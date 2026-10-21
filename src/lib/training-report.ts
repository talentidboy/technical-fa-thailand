import { prisma } from "./prisma";
import { CORE_LICENSE_PROGRESSION } from "./constants";
import { getProvinceNameByCode } from "./thai-address";

// รายงานสรุปการอบรม (ใบอนุญาตที่ออกตามปี/ระดับ/ภูมิภาค/เพศ, รุ่นอบรม, การต่ออายุ, ข้อมูลที่ควรตรวจสอบ)
// ใช้ร่วมกันระหว่างหน้า /reports และไฟล์ Excel

export const REPORT_LEVELS = ["PRO", "A", "B", "C", "G", "GK", "OTHER"] as const;
export type ReportLevel = (typeof REPORT_LEVELS)[number];
export const LEVEL_LABEL: Record<ReportLevel, string> = { PRO: "PRO", A: "A", B: "B", C: "C", G: "G", GK: "GK", OTHER: "อื่น ๆ" };

export function levelKey(licenseType: string): ReportLevel {
  if (CORE_LICENSE_PROGRESSION.includes(licenseType)) return licenseType as ReportLevel;
  if (licenseType.startsWith("GK")) return "GK";
  return "OTHER";
}

// 6 ภูมิภาคตามการแบ่งของราชบัณฑิตยสถาน (รหัสจังหวัด 2 หลัก)
export const REGIONS: { key: string; label: string; codes: string[] }[] = [
  { key: "N", label: "ภาคเหนือ", codes: ["50", "51", "52", "53", "54", "55", "56", "57", "58"] },
  {
    key: "NE",
    label: "ภาคตะวันออกเฉียงเหนือ",
    codes: ["30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49"],
  },
  {
    key: "C",
    label: "ภาคกลาง",
    codes: ["10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "26", "60", "61", "62", "64", "65", "66", "67", "72", "73", "74", "75"],
  },
  { key: "E", label: "ภาคตะวันออก", codes: ["20", "21", "22", "23", "24", "25", "27"] },
  { key: "W", label: "ภาคตะวันตก", codes: ["63", "70", "71", "76", "77"] },
  { key: "S", label: "ภาคใต้", codes: ["80", "81", "82", "83", "84", "85", "86", "90", "91", "92", "93", "94", "95", "96"] },
];
const REGION_BY_CODE = new Map(REGIONS.flatMap((r) => r.codes.map((c) => [c, r] as const)));
export const UNKNOWN_REGION = { key: "X", label: "ไม่ระบุจังหวัด" };

export function regionOf(provinceCode: string | null) {
  return (provinceCode && REGION_BY_CODE.get(provinceCode)) || UNKNOWN_REGION;
}

const GENDERS = [
  { key: "MALE", label: "ชาย" },
  { key: "FEMALE", label: "หญิง" },
  { key: "X", label: "ไม่ระบุ" },
];

// ปีตามเวลาไทย (ค.ศ.)
export function thaiYear(date: Date) {
  return new Date(date.getTime() + 7 * 3600_000).getUTCFullYear();
}
function yearStart(year: number) {
  return new Date(`${year}-01-01T00:00:00+07:00`);
}

type Counts = Record<ReportLevel, number>;
const emptyCounts = (): Counts => ({ PRO: 0, A: 0, B: 0, C: 0, G: 0, GK: 0, OTHER: 0 });
const sum = (c: Counts) => REPORT_LEVELS.reduce((s, l) => s + c[l], 0);

export type IssueRow = {
  recordId: number;
  coachId: number;
  coachName: string;
  licenseType: string;
  certificateNo: string | null;
  issueDate: Date | null;
  problem: string;
  buddhistYear: boolean;
};

export async function loadTrainingReport(fromYear: number, toYear: number, now = new Date()) {
  const currentYear = thaiYear(now);
  const [records, sessions, renewals] = await Promise.all([
    prisma.licenseRecord.findMany({
      select: {
        id: true,
        coachId: true,
        licenseType: true,
        issueDate: true,
        expireDate: true,
        certificateNo: true,
        coach: { select: { nameTh: true, surnameTh: true, nameEn: true, familyNameEn: true, afcId: true, gender: true, provinceCode: true } },
      },
    }),
    prisma.courseSession.findMany({
      include: { course: true, applications: { select: { status: true } } },
      orderBy: [{ startDate: "desc" }, { id: "desc" }],
    }),
    prisma.licenseRenewal.findMany({
      where: { status: "APPROVED", reviewedAt: { gte: yearStart(fromYear), lt: yearStart(toYear + 1) } },
      select: { licenseRecord: { select: { licenseType: true } } },
    }),
  ]);

  // ===== ข้อมูลที่ควรตรวจสอบ (ไม่นับรวมในรายงาน) =====
  const issues: IssueRow[] = [];
  const valid: typeof records = [];
  for (const r of records) {
    const name = `${r.coach.nameTh} ${r.coach.surnameTh}`;
    const base = { recordId: r.id, coachId: r.coachId, coachName: name, licenseType: r.licenseType, certificateNo: r.certificateNo, issueDate: r.issueDate };
    if (!r.issueDate) {
      issues.push({ ...base, problem: "ไม่มีวันที่ออกใบ", buddhistYear: false });
      continue;
    }
    const y = thaiYear(r.issueDate);
    if (y >= 2400) {
      issues.push({ ...base, problem: `ปีเป็น พ.ศ. ${y} (น่าจะเป็น ค.ศ. ${y - 543})`, buddhistYear: true });
      continue;
    }
    if (y > currentYear || r.issueDate.getTime() > now.getTime() + 86_400_000) {
      issues.push({ ...base, problem: `วันที่ออกใบเป็นอนาคต (${y})`, buddhistYear: false });
      continue;
    }
    if (r.expireDate && r.expireDate.getTime() < r.issueDate.getTime()) {
      issues.push({ ...base, problem: "วันหมดอายุก่อนวันที่ออกใบ", buddhistYear: false });
    }
    valid.push(r);
  }

  // ใบแรกของโค้ชแต่ละคน (โค้ชใหม่) และการอัปเกรดระดับหลัก (มีใบระดับหลักที่ต่ำกว่าออกก่อนหน้า)
  const byCoach = new Map<number, typeof valid>();
  for (const r of valid) byCoach.set(r.coachId, [...(byCoach.get(r.coachId) ?? []), r]);
  const firstRecord = new Set<number>();
  const upgrade = new Set<number>();
  for (const list of byCoach.values()) {
    list.sort((a, b) => a.issueDate!.getTime() - b.issueDate!.getTime() || a.id - b.id);
    firstRecord.add(list[0].id);
    for (const r of list) {
      const lv = CORE_LICENSE_PROGRESSION.indexOf(r.licenseType);
      if (lv <= 0) continue;
      if (list.some((o) => o.issueDate! < r.issueDate! && CORE_LICENSE_PROGRESSION.indexOf(o.licenseType) >= 0 && CORE_LICENSE_PROGRESSION.indexOf(o.licenseType) < lv))
        upgrade.add(r.id);
    }
  }

  const inRange = valid.filter((r) => {
    const y = thaiYear(r.issueDate!);
    return y >= fromYear && y <= toYear;
  });

  const years: number[] = [];
  for (let y = toYear; y >= fromYear; y--) years.push(y);
  const byYear = new Map(years.map((y) => [y, emptyCounts()]));
  const byRegion = new Map([...REGIONS, UNKNOWN_REGION].map((r) => [r.key, emptyCounts()]));
  const byGender = new Map(GENDERS.map((g) => [g.key, emptyCounts()]));
  const byProvince = new Map<string, number>();
  const coaches = new Set<number>();
  let newCoaches = 0;
  let upgrades = 0;

  for (const r of inRange) {
    const lv = levelKey(r.licenseType);
    byYear.get(thaiYear(r.issueDate!))![lv]++;
    byRegion.get(regionOf(r.coach.provinceCode).key)![lv]++;
    byGender.get(r.coach.gender === "MALE" || r.coach.gender === "FEMALE" ? r.coach.gender : "X")![lv]++;
    if (r.coach.provinceCode) byProvince.set(r.coach.provinceCode, (byProvince.get(r.coach.provinceCode) ?? 0) + 1);
    coaches.add(r.coachId);
    if (firstRecord.has(r.id)) newCoaches++;
    if (upgrade.has(r.id)) upgrades++;
  }

  const levelTotals = emptyCounts();
  for (const c of byYear.values()) for (const l of REPORT_LEVELS) levelTotals[l] += c[l];

  const sessionRows = sessions
    .filter((s) => {
      const d = s.startDate ?? s.createdAt;
      const y = thaiYear(d);
      return y >= fromYear && y <= toYear;
    })
    .map((s) => {
      const count = (st: string) => s.applications.filter((a) => a.status === st).length;
      const passed = count("PASSED");
      const failed = count("FAILED");
      return {
        id: s.id,
        title: s.course.title,
        level: s.course.licenseType,
        name: s.name,
        venue: s.venue,
        startDate: s.startDate,
        endDate: s.endDate,
        status: s.status,
        applicants: s.applications.length,
        approved: count("APPROVED") + passed + failed,
        passed,
        failed,
        passRate: passed + failed > 0 ? passed / (passed + failed) : null,
      };
    });

  const renewalCounts = emptyCounts();
  for (const r of renewals) renewalCounts[levelKey(r.licenseRecord.licenseType)]++;

  // ช่วงปีที่มีข้อมูล (สำหรับตัวเลือกปี)
  const dataYears = valid.map((r) => thaiYear(r.issueDate!));
  const minYear = dataYears.length ? Math.min(...dataYears) : currentYear;

  return {
    fromYear,
    toYear,
    currentYear,
    minYear,
    kpi: { issued: inRange.length, coaches: coaches.size, newCoaches, upgrades, renewals: renewals.length },
    levelTotals,
    byYear: years.map((y) => ({ year: y, counts: byYear.get(y)!, total: sum(byYear.get(y)!) })),
    byRegion: [...REGIONS, UNKNOWN_REGION].map((r) => ({ key: r.key, label: r.label, counts: byRegion.get(r.key)!, total: sum(byRegion.get(r.key)!) })),
    topProvinces: [...byProvince.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([code, total]) => ({ code, name: getProvinceNameByCode(code) ?? code, region: regionOf(code).label, total })),
    byGender: GENDERS.map((g) => ({ key: g.key, label: g.label, counts: byGender.get(g.key)!, total: sum(byGender.get(g.key)!) })),
    sessions: sessionRows,
    renewalCounts,
    issues: issues.sort((a, b) => Number(b.buddhistYear) - Number(a.buddhistYear) || (b.issueDate?.getTime() ?? 0) - (a.issueDate?.getTime() ?? 0)),
    // รายชื่อผู้ได้รับใบอนุญาตในช่วงปี (ใช้ในไฟล์ Excel)
    records: inRange
      .sort((a, b) => a.issueDate!.getTime() - b.issueDate!.getTime() || a.id - b.id)
      .map((r) => ({
        certificateNo: r.certificateNo,
        licenseType: r.licenseType,
        issueDate: r.issueDate!,
        expireDate: r.expireDate,
        nameTh: `${r.coach.nameTh} ${r.coach.surnameTh}`,
        nameEn: [r.coach.nameEn, r.coach.familyNameEn].filter(Boolean).join(" "),
        afcId: r.coach.afcId,
        gender: r.coach.gender === "MALE" ? "ชาย" : r.coach.gender === "FEMALE" ? "หญิง" : "",
        province: getProvinceNameByCode(r.coach.provinceCode) ?? "",
        region: regionOf(r.coach.provinceCode).label,
        kind: firstRecord.has(r.id) ? "ผู้ฝึกสอนใหม่" : upgrade.has(r.id) ? "อัปเกรดระดับ" : "",
      })),
  };
}

export type TrainingReport = Awaited<ReturnType<typeof loadTrainingReport>>;

// ช่วงปีจาก query string (ค.ศ.) — ค่าเริ่มต้น 5 ปีล่าสุด
export function parseYearRange(from: string | undefined, to: string | undefined, currentYear: number) {
  const clamp = (y: number) => Math.min(currentYear, Math.max(1990, y));
  let a = Number(from);
  let b = Number(to);
  if (!Number.isInteger(b)) b = currentYear;
  if (!Number.isInteger(a)) a = b - 4;
  a = clamp(a);
  b = clamp(b);
  return a <= b ? { fromYear: a, toYear: b } : { fromYear: b, toYear: a };
}
