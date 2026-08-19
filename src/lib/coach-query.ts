import { Prisma } from "@/generated/prisma/client";
import { prisma } from "./prisma";
import { LICENSE_RANK_ORDER } from "./constants";
import { AGE_BUCKETS } from "./coach-report";

export type CoachFilters = {
  gender: string;
  nationality: string;
  residence: string;
  division: string;
  position: string;
  currentLicense: string;
  afcId: "" | "yes" | "no";
  expStatus: "" | "active" | "expiring" | "expired" | "unknown";
  ageBucket: string;
  year: string;
  licenseHeld: string[];
  search: string;
};

export const EMPTY_FILTERS: CoachFilters = {
  gender: "",
  nationality: "",
  residence: "",
  division: "",
  position: "",
  currentLicense: "",
  afcId: "",
  expStatus: "",
  ageBucket: "",
  year: "",
  licenseHeld: [],
  search: "",
};

export type SortKey =
  | "afcId"
  | "name"
  | "gender"
  | "nationality"
  | "club"
  | "division"
  | "position"
  | "currentLicenseLabel"
  | "expireDate";

const SORT_COLUMNS: Record<SortKey, Prisma.Sql> = {
  afcId: Prisma.sql`f.afc_id`,
  name: Prisma.sql`f.name_th`,
  gender: Prisma.sql`f.gender`,
  nationality: Prisma.sql`f.nationality`,
  club: Prisma.sql`f.club_name`,
  division: Prisma.sql`f.division`,
  position: Prisma.sql`f.position`,
  currentLicenseLabel: Prisma.sql`f.current_license_type`,
  expireDate: Prisma.sql`f.current_expire_date`,
};

export const PAGE_SIZE = 50;

function rankOrderCase(column: Prisma.Sql) {
  const whens = LICENSE_RANK_ORDER.map(
    (type, i) => Prisma.sql`WHEN ${type} THEN ${i}`,
  );
  return Prisma.sql`CASE ${column} ${Prisma.join(whens, " ")} ELSE 999 END`;
}

function ageBucketCase(column: Prisma.Sql) {
  const whens = AGE_BUCKETS.map(
    (b) => Prisma.sql`WHEN ${column} >= ${b.min} AND ${column} < ${b.max} THEN ${b.key}`,
  );
  return Prisma.sql`CASE ${Prisma.join(whens, " ")} ELSE NULL END`;
}

// รวม current_license (ใบอนุญาตปัจจุบันตาม logic เดียวกับ getHighestLicense เดิม)
// และ current_employment (งานล่าสุด) เป็น base CTE ที่ทุก query ในไฟล์นี้ใช้ร่วมกัน
const BASE_CTE = Prisma.sql`
  WITH ranked_license AS (
    SELECT
      lr.coach_id,
      lr.license_type,
      lr.issue_date,
      lr.expire_date,
      (lr.expire_date IS NOT NULL AND lr.expire_date < now()) AS is_expired,
      ${rankOrderCase(Prisma.sql`lr.license_type`)} AS rank_order,
      bool_or(lr.expire_date IS NULL OR lr.expire_date >= now())
        OVER (PARTITION BY lr.coach_id) AS coach_has_active
    FROM license_records lr
  ),
  current_license AS (
    SELECT DISTINCT ON (coach_id) coach_id, license_type, expire_date
    FROM ranked_license
    WHERE (NOT is_expired) OR (NOT coach_has_active)
    ORDER BY coach_id, rank_order ASC, issue_date DESC NULLS LAST
  ),
  current_employment AS (
    SELECT DISTINCT ON (coach_id) coach_id, club_name, division, position
    FROM employments
    ORDER BY coach_id, created_at DESC
  ),
  filtered AS (
    SELECT
      c.id,
      c.afc_id,
      c.name_th,
      c.surname_th,
      c.name_en,
      c.family_name_en,
      c.gender,
      c.nationality,
      c.dob,
      EXTRACT(YEAR FROM age(current_date, c.dob))::int AS age,
      cl.license_type AS current_license_type,
      cl.expire_date AS current_expire_date,
      CASE
        WHEN cl.expire_date IS NULL THEN 'unknown'
        WHEN cl.expire_date < now() THEN 'expired'
        WHEN cl.expire_date < now() + interval '90 days' THEN 'expiring'
        ELSE 'active'
      END AS exp_status,
      ce.club_name,
      ce.division,
      ce.position
    FROM coaches c
    LEFT JOIN current_license cl ON cl.coach_id = c.id
    LEFT JOIN current_employment ce ON ce.coach_id = c.id
  )
`;

function getConds(filters: CoachFilters): Prisma.Sql[] {
  const conds: Prisma.Sql[] = [];

  if (filters.gender) conds.push(Prisma.sql`f.gender = ${filters.gender}`);
  if (filters.nationality)
    conds.push(Prisma.sql`f.nationality = ${filters.nationality}`);
  if (filters.residence)
    conds.push(Prisma.sql`c2.residence = ${filters.residence}`);
  if (filters.division) conds.push(Prisma.sql`f.division = ${filters.division}`);
  if (filters.position) conds.push(Prisma.sql`f.position = ${filters.position}`);
  if (filters.currentLicense)
    conds.push(Prisma.sql`f.current_license_type = ${filters.currentLicense}`);
  if (filters.afcId === "yes") conds.push(Prisma.sql`f.afc_id IS NOT NULL`);
  if (filters.afcId === "no") conds.push(Prisma.sql`f.afc_id IS NULL`);
  if (filters.expStatus) conds.push(Prisma.sql`f.exp_status = ${filters.expStatus}`);
  if (filters.ageBucket)
    conds.push(Prisma.sql`${ageBucketCase(Prisma.sql`f.age`)} = ${filters.ageBucket}`);
  if (filters.year) {
    const year = Number(filters.year);
    conds.push(
      Prisma.sql`EXISTS (SELECT 1 FROM license_records lr WHERE lr.coach_id = f.id AND EXTRACT(YEAR FROM lr.issue_date) = ${year})`,
    );
  }
  for (const type of filters.licenseHeld) {
    conds.push(
      Prisma.sql`EXISTS (SELECT 1 FROM license_records lr WHERE lr.coach_id = f.id AND lr.license_type = ${type})`,
    );
  }
  const q = filters.search.trim();
  if (q) {
    const like = `%${q}%`;
    conds.push(
      Prisma.sql`(f.afc_id ILIKE ${like} OR f.name_th || ' ' || f.surname_th ILIKE ${like} OR f.name_en || ' ' || f.family_name_en ILIKE ${like} OR f.club_name ILIKE ${like})`,
    );
  }

  return conds;
}

function joinConds(conds: Prisma.Sql[]): Prisma.Sql {
  if (conds.length === 0) return Prisma.sql``;
  return Prisma.sql`WHERE ${Prisma.join(conds, " AND ")}`;
}

function buildWhere(filters: CoachFilters): Prisma.Sql {
  return joinConds(getConds(filters));
}

// เหมือน buildWhere แต่ผนวกเงื่อนไขเพิ่ม (ใช้กับ groupCount ที่ต้องกรอง column IS NOT NULL ด้วย)
function buildWhereWith(filters: CoachFilters, extra: Prisma.Sql): Prisma.Sql {
  return joinConds([...getConds(filters), extra]);
}

// residence ต้อง join กลับไปที่ตาราง coaches เพราะไม่ได้เก็บใน filtered CTE (ประหยัด payload)
const FROM_FILTERED = Prisma.sql`FROM filtered f JOIN coaches c2 ON c2.id = f.id`;

export type CoachTableRow = {
  id: number;
  afcId: string | null;
  name: string;
  nameEn: string | null;
  gender: string | null;
  nationality: string | null;
  club: string | null;
  division: string | null;
  position: string | null;
  currentLicenseType: string | null;
  currentExpireDate: Date | null;
  expStatus: "active" | "expiring" | "expired" | "unknown";
};

export async function getCoachPage(
  filters: CoachFilters,
  sortKey: SortKey,
  sortAsc: boolean,
  page: number,
): Promise<{ rows: CoachTableRow[]; total: number; pageCount: number }> {
  const where = buildWhere(filters);
  const sortCol = SORT_COLUMNS[sortKey] ?? SORT_COLUMNS.name;
  const dir = sortAsc ? Prisma.sql`ASC` : Prisma.sql`DESC`;
  const offset = page * PAGE_SIZE;

  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw<
      {
        id: number;
        afc_id: string | null;
        name_th: string;
        surname_th: string;
        name_en: string | null;
        family_name_en: string | null;
        gender: string | null;
        nationality: string | null;
        club_name: string | null;
        division: string | null;
        position: string | null;
        current_license_type: string | null;
        current_expire_date: Date | null;
        exp_status: "active" | "expiring" | "expired" | "unknown";
      }[]
    >(Prisma.sql`
      ${BASE_CTE}
      SELECT f.id, f.afc_id, f.name_th, f.surname_th, f.name_en, f.family_name_en,
             f.gender, f.nationality, f.club_name, f.division, f.position,
             f.current_license_type, f.current_expire_date, f.exp_status
      ${FROM_FILTERED}
      ${where}
      ORDER BY ${sortCol} ${dir} NULLS LAST
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `),
    prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
      ${BASE_CTE}
      SELECT COUNT(*)::bigint AS count ${FROM_FILTERED} ${where}
    `),
  ]);

  const total = Number(countRows[0]?.count ?? 0);
  return {
    rows: rows.map((r) => ({
      id: r.id,
      afcId: r.afc_id,
      name: `${r.name_th} ${r.surname_th}`.trim(),
      nameEn: [r.name_en, r.family_name_en].filter(Boolean).join(" ") || null,
      gender: r.gender,
      nationality: r.nationality,
      club: r.club_name,
      division: r.division,
      position: r.position,
      currentLicenseType: r.current_license_type,
      currentExpireDate: r.current_expire_date,
      expStatus: r.exp_status,
    })),
    total,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

type Bucket = { name: string; value: number }[];
// เหมือน Bucket แต่มี key (ค่าดิบ) แนบไว้ด้วย ไว้ผูกสีตาม entity ไม่ใช่ตามตำแหน่ง
type KeyedBucket = { key: string; name: string; value: number }[];

export type CoachAggregates = {
  total: number;
  withAfc: number;
  thaiCount: number;
  male: number;
  female: number;
  avgAge: number | null;
  noLicenseCount: number;
  genderChart: KeyedBucket;
  afcChart: KeyedBucket;
  expiryChart: KeyedBucket;
  nationalityChart: Bucket;
  ageChart: Bucket;
  divisionChart: Bucket;
  positionChart: Bucket;
  clubChart: Bucket;
  residenceChart: Bucket;
  licenseDistChart: KeyedBucket;
  levelUpChart: Bucket;
  trend: { data: Record<string, number | string>[]; licenseTypes: string[] };
  expiryForecast: Bucket;
  genderByLicense: {
    data: Record<string, number | string>[];
    genders: { key: string; label: string }[];
  };
  registrationTrend: Bucket;
};

async function groupCount(
  filters: CoachFilters,
  column: Prisma.Sql,
  limit?: number,
): Promise<Bucket> {
  const where = buildWhereWith(filters, Prisma.sql`${column} IS NOT NULL`);
  const rows = await prisma.$queryRaw<{ name: string | null; value: bigint }[]>(
    Prisma.sql`
      ${BASE_CTE}
      SELECT ${column} AS name, COUNT(*)::bigint AS value
      ${FROM_FILTERED}
      ${where}
      GROUP BY ${column}
      ORDER BY value DESC
      ${limit ? Prisma.sql`LIMIT ${limit}` : Prisma.sql``}
    `,
  );
  return rows.map((r) => ({ name: r.name ?? "", value: Number(r.value) }));
}

export async function getCoachAggregates(
  filters: CoachFilters,
): Promise<CoachAggregates> {
  const where = buildWhere(filters);
  const conds = getConds(filters);
  const levelUpWhere = joinConds([
    ...conds,
    Prisma.sql`lr.is_level_up = true`,
    Prisma.sql`lr.issue_date IS NOT NULL`,
  ]);
  const trendWhere = joinConds([
    ...conds,
    Prisma.sql`lr.issue_date IS NOT NULL`,
    ...(filters.licenseHeld.length
      ? [Prisma.sql`lr.license_type IN (${Prisma.join(filters.licenseHeld)})`]
      : []),
  ]);

  const [
    kpiRows,
    genderRaw,
    nationalityRaw,
    divisionChart,
    positionRaw,
    clubRaw,
    residenceRaw,
    licenseDistRaw,
    expiryRaw,
    ageRaw,
    levelUpRaw,
    trendRaw,
    expiryForecastRaw,
    genderLicenseRaw,
    registrationRaw,
  ] = await Promise.all([
    prisma.$queryRaw<
      {
        total: bigint;
        with_afc: bigint;
        thai: bigint;
        male: bigint;
        female: bigint;
        avg_age: number | null;
        no_license: bigint;
      }[]
    >(Prisma.sql`
      ${BASE_CTE}
      SELECT
        COUNT(*)::bigint AS total,
        COUNT(*) FILTER (WHERE f.afc_id IS NOT NULL)::bigint AS with_afc,
        COUNT(*) FILTER (WHERE f.nationality = 'ไทย')::bigint AS thai,
        COUNT(*) FILTER (WHERE f.gender = 'MALE')::bigint AS male,
        COUNT(*) FILTER (WHERE f.gender = 'FEMALE')::bigint AS female,
        AVG(f.age)::numeric(10,1) AS avg_age,
        COUNT(*) FILTER (
          WHERE NOT EXISTS (SELECT 1 FROM license_records lr3 WHERE lr3.coach_id = f.id)
        )::bigint AS no_license
      ${FROM_FILTERED} ${where}
    `),
    groupCount(filters, Prisma.sql`f.gender`),
    groupCount(filters, Prisma.sql`f.nationality`),
    groupCount(filters, Prisma.sql`f.division`),
    groupCount(filters, Prisma.sql`f.position`, 10),
    groupCount(filters, Prisma.sql`f.club_name`, 10),
    groupCount(filters, Prisma.sql`c2.residence`, 10),
    groupCount(filters, Prisma.sql`f.current_license_type`),
    prisma.$queryRaw<{ name: string; value: bigint }[]>(Prisma.sql`
      ${BASE_CTE}
      SELECT f.exp_status AS name, COUNT(*)::bigint AS value
      ${FROM_FILTERED} ${where}
      GROUP BY f.exp_status
    `),
    prisma.$queryRaw<{ name: string | null; value: bigint }[]>(Prisma.sql`
      ${BASE_CTE}
      SELECT ${ageBucketCase(Prisma.sql`f.age`)} AS name, COUNT(*)::bigint AS value
      ${FROM_FILTERED} ${where}
      GROUP BY 1
    `),
    prisma.$queryRaw<{ year: number; value: bigint }[]>(Prisma.sql`
      ${BASE_CTE}
      SELECT EXTRACT(YEAR FROM lr.issue_date)::int AS year, COUNT(*)::bigint AS value
      FROM license_records lr
      JOIN filtered f ON f.id = lr.coach_id
      JOIN coaches c2 ON c2.id = f.id
      ${levelUpWhere}
      GROUP BY 1
      ORDER BY 1
    `),
    prisma.$queryRaw<{ year: number; type: string; value: bigint }[]>(Prisma.sql`
      ${BASE_CTE}
      SELECT EXTRACT(YEAR FROM lr.issue_date)::int AS year, lr.license_type AS type, COUNT(*)::bigint AS value
      FROM license_records lr
      JOIN filtered f ON f.id = lr.coach_id
      JOIN coaches c2 ON c2.id = f.id
      ${trendWhere}
      GROUP BY 1, 2
      ORDER BY 1
    `),
    // ใบอนุญาตปัจจุบันที่จะหมดอายุใน 12 เดือนข้างหน้า แยกตามเดือน (สำหรับวางแผนต่ออายุ)
    prisma.$queryRaw<{ ym: string; value: bigint }[]>(Prisma.sql`
      ${BASE_CTE}
      SELECT to_char(date_trunc('month', f.current_expire_date), 'YYYY-MM') AS ym,
             COUNT(*)::bigint AS value
      ${FROM_FILTERED}
      ${buildWhereWith(filters, Prisma.sql`f.current_expire_date BETWEEN now() AND now() + interval '12 months'`)}
      GROUP BY 1
      ORDER BY 1
    `),
    // สัดส่วนระดับใบอนุญาตปัจจุบัน แยกตามเพศ
    prisma.$queryRaw<{ type: string; gender: string; value: bigint }[]>(Prisma.sql`
      ${BASE_CTE}
      SELECT f.current_license_type AS type, f.gender AS gender, COUNT(*)::bigint AS value
      ${FROM_FILTERED}
      ${buildWhereWith(filters, Prisma.sql`f.current_license_type IS NOT NULL AND f.gender IS NOT NULL`)}
      GROUP BY 1, 2
    `),
    // จำนวนผู้ฝึกสอนใหม่ที่ถูกเพิ่มเข้าระบบต่อปี
    prisma.$queryRaw<{ year: number; value: bigint }[]>(Prisma.sql`
      ${BASE_CTE}
      SELECT EXTRACT(YEAR FROM c2.created_at)::int AS year, COUNT(*)::bigint AS value
      ${FROM_FILTERED} ${where}
      GROUP BY 1
      ORDER BY 1
    `),
  ]);

  const kpi = kpiRows[0];
  const total = Number(kpi?.total ?? 0);
  const withAfc = Number(kpi?.with_afc ?? 0);

  const nationalityChart = (() => {
    const top = nationalityRaw.slice(0, 8);
    const restTotal = nationalityRaw.slice(8).reduce((s, d) => s + d.value, 0);
    return restTotal > 0 ? [...top, { name: "อื่นๆ", value: restTotal }] : top;
  })();

  // ลำดับคงที่ (ไม่ใช่เรียงตามจำนวน) เพื่อให้สีผูกกับหมวดหมู่เดิมเสมอ ไม่สลับตามตัวกรอง
  const GENDER_ORDER = ["MALE", "FEMALE", "OTHER"];
  const GENDER_LABELS: Record<string, string> = { MALE: "ชาย", FEMALE: "หญิง", OTHER: "อื่นๆ" };
  const genderMap = new Map(genderRaw.map((r) => [r.name, r.value]));
  const genderChart = GENDER_ORDER.filter((g) => genderMap.has(g)).map((g) => ({
    key: g,
    name: GENDER_LABELS[g] ?? g,
    value: genderMap.get(g) ?? 0,
  }));

  const EXP_ORDER = ["active", "expiring", "expired", "unknown"];
  const EXP_LABELS: Record<string, string> = {
    active: "ใช้งานได้",
    expiring: "ใกล้หมดอายุ",
    expired: "หมดอายุแล้ว",
    unknown: "ไม่มีวันหมดอายุ",
  };
  const expiryMap = new Map(expiryRaw.map((r) => [r.name, Number(r.value)]));
  const expiryChart = EXP_ORDER.filter((k) => expiryMap.has(k)).map((k) => ({
    key: k,
    name: EXP_LABELS[k] ?? k,
    value: expiryMap.get(k) ?? 0,
  }));

  const LICENSE_TYPE_ORDER = ["G", "C", "B", "A", "PRO", "ELITE_YOUTH", "GK", "VDO"];
  const licenseDistMap = new Map(licenseDistRaw.map((r) => [r.name, r.value]));
  const licenseDistChart = LICENSE_TYPE_ORDER.filter((t) => licenseDistMap.has(t)).map(
    (t) => ({
      key: t,
      name: t,
      value: licenseDistMap.get(t) ?? 0,
    }),
  );
  const ageChart = ageRaw
    .filter((r) => r.name)
    .map((r) => ({ name: r.name as string, value: Number(r.value) }))
    .sort(
      (a, b) =>
        AGE_BUCKETS.findIndex((b2) => b2.key === a.name) -
        AGE_BUCKETS.findIndex((b2) => b2.key === b.name),
    );
  const levelUpChart = levelUpRaw
    .map((r) => ({ name: String(r.year), value: Number(r.value) }))
    .sort((a, b) => Number(a.name) - Number(b.name));

  const typesToShow = filters.licenseHeld.length
    ? filters.licenseHeld
    : Array.from(new Set(trendRaw.map((r) => r.type)));
  const years = Array.from(new Set(trendRaw.map((r) => r.year))).sort((a, b) => a - b);
  const trendData = years.map((year) => {
    const row: Record<string, number | string> = { year: String(year) };
    typesToShow.forEach((t) => {
      row[t] = Number(
        trendRaw.find((r) => r.year === year && r.type === t)?.value ?? 0,
      );
    });
    return row;
  });

  // แปลง "YYYY-MM" เป็นป้ายเดือนภาษาไทยแบบย่อ เช่น "ม.ค. 69"
  const expiryForecast = expiryForecastRaw.map((r) => {
    const [y, m] = r.ym.split("-").map(Number);
    const label = new Date(y, m - 1, 1).toLocaleDateString("th-TH", {
      month: "short",
      year: "2-digit",
    });
    return { name: label, value: Number(r.value) };
  });

  const GENDER_LABELS2: Record<string, string> = { MALE: "ชาย", FEMALE: "หญิง", OTHER: "อื่นๆ" };
  const gendersPresent = Array.from(new Set(genderLicenseRaw.map((r) => r.gender)));
  const gendersOrdered = ["MALE", "FEMALE", "OTHER"].filter((g) =>
    gendersPresent.includes(g),
  );
  const genderByLicenseData = LICENSE_TYPE_ORDER.filter((t) =>
    genderLicenseRaw.some((r) => r.type === t),
  ).map((t) => {
    const row: Record<string, number | string> = { name: t };
    gendersOrdered.forEach((g) => {
      row[g] = Number(
        genderLicenseRaw.find((r) => r.type === t && r.gender === g)?.value ?? 0,
      );
    });
    return row;
  });

  const registrationTrend = registrationRaw
    .map((r) => ({ name: String(r.year), value: Number(r.value) }))
    .sort((a, b) => Number(a.name) - Number(b.name));

  return {
    total,
    withAfc,
    thaiCount: Number(kpi?.thai ?? 0),
    male: Number(kpi?.male ?? 0),
    female: Number(kpi?.female ?? 0),
    avgAge: kpi?.avg_age != null ? Number(kpi.avg_age) : null,
    noLicenseCount: Number(kpi?.no_license ?? 0),
    genderChart,
    afcChart: [
      { key: "yes", name: "มี ID AFC", value: withAfc },
      { key: "no", name: "ยังไม่มี ID", value: total - withAfc },
    ],
    expiryChart,
    nationalityChart,
    ageChart,
    divisionChart,
    positionChart: positionRaw,
    clubChart: clubRaw,
    residenceChart: residenceRaw,
    licenseDistChart,
    levelUpChart,
    trend: { data: trendData, licenseTypes: typesToShow },
    expiryForecast,
    genderByLicense: {
      data: genderByLicenseData,
      genders: gendersOrdered.map((g) => ({ key: g, label: GENDER_LABELS2[g] ?? g })),
    },
    registrationTrend,
  };
}

export type FilterOptions = {
  gender: [string, number][];
  nationality: [string, number][];
  residence: [string, number][];
  division: [string, number][];
  position: [string, number][];
  currentLicense: [string, number][];
  years: number[];
};

// ตัวเลือกใน dropdown คำนวณจากข้อมูลทั้งหมด (ไม่ขึ้นกับตัวกรองปัจจุบัน) เหมือนพฤติกรรมเดิม
export async function getFilterOptions(): Promise<FilterOptions> {
  const [gender, nationality, residence, division, position, currentLicense, years] =
    await Promise.all([
      groupCount(EMPTY_FILTERS, Prisma.sql`f.gender`),
      groupCount(EMPTY_FILTERS, Prisma.sql`f.nationality`),
      groupCount(EMPTY_FILTERS, Prisma.sql`c2.residence`),
      groupCount(EMPTY_FILTERS, Prisma.sql`f.division`),
      groupCount(EMPTY_FILTERS, Prisma.sql`f.position`),
      groupCount(EMPTY_FILTERS, Prisma.sql`f.current_license_type`),
      prisma.$queryRaw<{ year: number }[]>(Prisma.sql`
        SELECT DISTINCT EXTRACT(YEAR FROM issue_date)::int AS year
        FROM license_records WHERE issue_date IS NOT NULL ORDER BY 1 DESC
      `),
    ]);
  const toPairs = (b: Bucket): [string, number][] => b.map((d) => [d.name, d.value]);
  return {
    gender: toPairs(gender),
    nationality: toPairs(nationality),
    residence: toPairs(residence),
    division: toPairs(division),
    position: toPairs(position),
    currentLicense: toPairs(currentLicense),
    years: years.map((r) => r.year),
  };
}

export type HeroSummary = {
  total: number;
  withAfc: number;
  clubsCovered: number;
  latestYear: number | null;
  trainedLatestYear: number;
  pyramid: { tier: string; count: number }[];
  sideCounts: { tier: string; count: number }[];
};

// ภาพรวมทั้งระบบสำหรับ DashboardHero — ไม่ขึ้นกับตัวกรองของตาราง (ตามพฤติกรรมเดิม)
export async function getHeroSummary(
  coreTiers: string[],
  sideTiers: string[],
): Promise<HeroSummary> {
  const [totals, pyramidRaw, latestYearRow] = await Promise.all([
    prisma.$queryRaw<{ total: bigint; with_afc: bigint; clubs: bigint }[]>(Prisma.sql`
      ${BASE_CTE}
      SELECT
        COUNT(*)::bigint AS total,
        COUNT(*) FILTER (WHERE f.afc_id IS NOT NULL)::bigint AS with_afc,
        COUNT(DISTINCT f.club_name)::bigint AS clubs
      ${FROM_FILTERED}
    `),
    prisma.$queryRaw<{ tier: string; count: bigint }[]>(Prisma.sql`
      ${BASE_CTE}
      SELECT f.current_license_type AS tier, COUNT(*)::bigint AS count
      ${FROM_FILTERED}
      WHERE f.current_license_type IS NOT NULL
      GROUP BY f.current_license_type
    `),
    prisma.$queryRaw<{ year: number | null }[]>(Prisma.sql`
      SELECT MAX(EXTRACT(YEAR FROM issue_date))::int AS year
      FROM license_records WHERE issue_date IS NOT NULL
    `),
  ]);

  const latestYear = latestYearRow[0]?.year ?? null;
  let trainedLatestYear = 0;
  if (latestYear != null) {
    const rows = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
      SELECT COUNT(DISTINCT coach_id)::bigint AS count
      FROM license_records
      WHERE EXTRACT(YEAR FROM issue_date) = ${latestYear}
    `);
    trainedLatestYear = Number(rows[0]?.count ?? 0);
  }

  const pyramidMap = new Map(pyramidRaw.map((r) => [r.tier, Number(r.count)]));
  return {
    total: Number(totals[0]?.total ?? 0),
    withAfc: Number(totals[0]?.with_afc ?? 0),
    clubsCovered: Number(totals[0]?.clubs ?? 0),
    latestYear,
    trainedLatestYear,
    pyramid: coreTiers.map((tier) => ({ tier, count: pyramidMap.get(tier) ?? 0 })),
    sideCounts: sideTiers
      .map((tier) => ({ tier, count: pyramidMap.get(tier) ?? 0 }))
      .filter((d) => d.count > 0),
  };
}
