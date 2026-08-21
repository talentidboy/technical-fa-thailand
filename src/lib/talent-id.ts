import {
  getAirtableRecords,
  getAirtableRecord,
  queryAirtablePage,
  escapeAirtableFormulaString,
  type AirtableRecord,
} from "./airtable";

type RawFields = Record<string, unknown>;

export type TalentPlayer = {
  id: string;
  playerId: number | null;
  fullNameTh: string;
  fullNameEn: string | null;
  nickname: string | null;
  photoUrl: string | null;
  school: string | null;
  club: string | null;
  province: string | null;
  yearOfBirth: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  bmi: number | null;
  strongFoot: string | null;
  position1: string | null;
  position2: string[];
  styleOfPlay: string | null;
  talent: string[];
  region: string | null;
  hudlVideoLeg1: string | null;
  hudlVideoLeg2: string | null;
  gradeLeg1: string | null;
  gradeLeg2: string | null;
  gradeCamp2026: string | null;
  avgRatingLeg1: number | null;
  avgRatingLeg2: number | null;
  avgRatingCamp2026: number | null;
  scoutScores: { label: string; value: number }[];
  tags: string[];
  notes: string | null;
  // ข้อมูลอ่อนไหว — แสดงเฉพาะ ADMIN/STAFF เท่านั้น (คัดกรองตอน render ในหน้าเว็บ)
  idCardNumber: string | null;
  phone: string | null;
  emergencyPhone: string | null;
  email: string | null;
  lineId: string | null;
};

const TABLE_NAME = process.env.AIRTABLE_TALENT_TABLE || "Players / ผู้เล่น";

const FIELD = {
  playerId: "ตัวเลขประจำตัวนักกีฬา / Player ID",
  fullNameTh: "Full Name / ชื่อจริง นามสกุล",
  fullNameEn: "English Name",
  nickname: "Nickname / ชื่อเล่น",
  photo: "Photo / รูปประจำตัว",
  school: "School / โรงเรียน",
  club: "Club / ต้นสังกัด",
  province: "Province / จังหวัดที่เกิด",
  yearOfBirth: "Year of Birth / ปีเกิด",
  age: "Age / อายุ",
  height: "Height (cm) / ส่วนสูง (ซม)",
  weight: "Weight (kg) / น้ำหนัก (กิโลกรัม)",
  bmi: "ดัชนีมวลกาย / BMI",
  strongFoot: "Strong Foot / เท้าข้างถนัด",
  position1: "1st Position / ตำแหน่งถนัด",
  position2: "2nd Position / ตำแหน่งรอง",
  styleOfPlay: "สไตล์ในการเล่น / Style of play",
  talent: "Talent / ความสามารถโดดเด่น",
  region: "Region / ภูมิภาค",
  hudlVideoLeg1: "HUDL VDO LEG 1 2026",
  hudlVideoLeg2: "HUDL VDO LEG 2 2026",
  gradeLeg1: "GRADE LEG1",
  gradeLeg2: "GRADE Leg 2",
  gradeCamp2026: "GRADE Camp 2026",
  avgRatingLeg1: "Average Rating LEG 1",
  avgRatingLeg2: "Average Rating Leg 2",
  avgRatingCamp2026: "Average Rating Camp 2026",
  scout1: "Scout 1",
  scout2: "Scout 2",
  scout3: "Scout 3",
  scout4: "Scout 4",
  scout5: "Scout 5",
  scout6: "Scout 6",
  notes: "Notes / หมายเหตุ",
  idCardNumber: "ID Card Number / รหัสประจำตัวประชาชน",
  phone: "Phone Number / เบอร์โทรศัพท์",
  emergencyPhone: "เบอร์ฉุกเฉิน",
  email: "Email / อีเมล์",
  lineId: "Line ID / ไอดีไลน์",
} as const;

const NON_TAG_KEYS = new Set<string>(Object.values(FIELD));

// ตัวเลือกจริงจาก Airtable field schema (singleSelect choices) — ใช้ทำ dropdown ตัวกรอง
// โดยไม่ต้องดึงข้อมูลทุกแถวมาหาค่าที่ไม่ซ้ำกันเอง (ตารางมี 2,000+ แถว ทำแบบนั้นไม่ไหว)
export const POSITIONS = [
  "ผู้รักษาประตู / Goalkeeper",
  "แบ็คซ้าย / Left Back",
  "เซ็นเตอร์ซ้าย / Left Centerback",
  "เซ็นเตอร์ขวา / Right Centerback",
  "แบ็คขวา / Right Back",
  "กองกลางตัวรับ / Defensive Midfielder",
  "กองกลาง / Central Midfielder",
  "กองกลางตัวรุก / Attacking Midfielder",
  "ปีกซ้าย / Left Winger",
  "ปีกขวา / Right Winger",
  "หน้าเป้า / Striker",
];

export const REGIONS = [
  "กรุงเทพ / Bangkok",
  "ภาคเหนือ / North",
  "ภาคกลาง / Central",
  "ภาคตะวันตก / West",
  "ภาคตะวันออก / East",
  "ภาคตะวันออกเฉียงเหนือ (ตอนบน) / North East (Upper)",
  "ภาคตะวันออกเฉียงเหนือ (ตอนล่าง) / North East (Lower)",
  "ภาคใต้ (ตอนบน) / South (Upper)",
  "ภาคใต้(ตอนล่าง) / South (Lower)",
  "ต่างประเทศ",
];

export const YEARS_OF_BIRTH = [
  "2009 / 2552",
  "2010 / 2553",
  "2011 / 2554",
  "2012 / 2555",
  "2013 / 2556",
  "2014 / 2557",
];

export const PROVINCES = [
  "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี",
  "ฉะเชิงเทรา", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "ชลบุรี", "เชียงใหม่", "เชียงราย",
  "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา",
  "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ",
  "บุรีรัมย์", "ประจวบคีรีขันธ์", "ปทุมธานี", "ปราจีนบุรี", "ปัตตานี",
  "พระนครศรีอยุธยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี",
  "เพชรบูรณ์", "แพร่", "พะเยา", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน",
  "ยะลา", "ยโสธร", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง",
  "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สมุทรสาคร", "สมุทรปราการ",
  "สมุทรสงคราม", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี",
  "สุราษฎร์ธานี", "สุรินทร์", "สตูล", "หนองคาย", "หนองบัวลำภู", "อำนาจเจริญ",
  "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี", "อ่างทอง", "กรุงเทพ",
  "England",
];

function str(v: unknown): string | null {
  if (v == null || v === "") return null;
  return String(v);
}
function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}
function photoUrl(v: unknown): string | null {
  const attachments = v as
    | { url: string; thumbnails?: { large?: { url: string } } }[]
    | undefined;
  const first = attachments?.[0];
  return first?.thumbnails?.large?.url ?? first?.url ?? null;
}

function mapPlayer(record: AirtableRecord<RawFields>): TalentPlayer {
  const f = record.fields;

  // แท็กสถานะการคัดเลือก/สแกาต์ — ดึงจากทุกฟิลด์ checkbox ที่เป็น true อัตโนมัติ
  // (Longlist, Top U14/U16, Youth Potential Player ฯลฯ) แทนการไล่ระบุทีละชื่อ
  const tags = Object.entries(f)
    .filter(([key, value]) => value === true && !NON_TAG_KEYS.has(key))
    .map(([key]) => key);

  return {
    id: record.id,
    playerId: num(f[FIELD.playerId]),
    fullNameTh: str(f[FIELD.fullNameTh]) ?? "ไม่ระบุชื่อ",
    fullNameEn: str(f[FIELD.fullNameEn]),
    nickname: str(f[FIELD.nickname]),
    photoUrl: photoUrl(f[FIELD.photo]),
    school: str(f[FIELD.school]),
    club: str(f[FIELD.club]),
    province: str(f[FIELD.province]),
    yearOfBirth: str(f[FIELD.yearOfBirth]),
    age: num(f[FIELD.age]),
    height: num(f[FIELD.height]),
    weight: num(f[FIELD.weight]),
    bmi: num(f[FIELD.bmi]),
    strongFoot: str(f[FIELD.strongFoot]),
    position1: str(f[FIELD.position1]),
    position2: strArr(f[FIELD.position2]),
    styleOfPlay: str(f[FIELD.styleOfPlay]),
    talent: strArr(f[FIELD.talent]),
    region: str(f[FIELD.region]),
    hudlVideoLeg1: str(f[FIELD.hudlVideoLeg1]),
    hudlVideoLeg2: str(f[FIELD.hudlVideoLeg2]),
    gradeLeg1: str(f[FIELD.gradeLeg1]),
    gradeLeg2: str(f[FIELD.gradeLeg2]),
    gradeCamp2026: str(f[FIELD.gradeCamp2026]),
    avgRatingLeg1: num(f[FIELD.avgRatingLeg1]),
    avgRatingLeg2: num(f[FIELD.avgRatingLeg2]),
    avgRatingCamp2026: num(f[FIELD.avgRatingCamp2026]),
    scoutScores: (
      [
        ["สแกาต์ 1", num(f[FIELD.scout1])],
        ["สแกาต์ 2", num(f[FIELD.scout2])],
        ["สแกาต์ 3", num(f[FIELD.scout3])],
        ["สแกาต์ 4", num(f[FIELD.scout4])],
        ["สแกาต์ 5", num(f[FIELD.scout5])],
        ["สแกาต์ 6", num(f[FIELD.scout6])],
      ] as [string, number | null][]
    )
      .filter((s): s is [string, number] => s[1] != null)
      .map(([label, value]) => ({ label, value })),
    tags,
    notes: str(f[FIELD.notes]),
    idCardNumber: str(f[FIELD.idCardNumber]),
    phone: str(f[FIELD.phone]),
    emergencyPhone: str(f[FIELD.emergencyPhone]),
    email: str(f[FIELD.email]),
    lineId: str(f[FIELD.lineId]),
  };
}

// หมายเหตุ: ตาราง Players มีมากกว่า 2,000 แถว — ใช้เฉพาะหน้า Home/Standouts ที่ต้อง
// สรุปภาพรวมทั้งหมดจริงๆ เท่านั้น (ดึงช้าโดยธรรมชาติ เพราะต้องวน ~21+ รอบ) หน้ารายชื่อ
// ผู้เล่นให้ใช้ getTalentPlayersPage() แทน ซึ่งผลัก filter/sort/pagination ไปที่ Airtable
export async function getTalentPlayers(): Promise<TalentPlayer[]> {
  const records = await getAirtableRecords<RawFields>(TABLE_NAME);
  return records.map(mapPlayer);
}

export type TalentSortKey = "name" | "position" | "club" | "age" | "height" | "weight" | "rating";

const SORT_FIELD: Record<TalentSortKey, string> = {
  name: FIELD.fullNameTh,
  position: FIELD.position1,
  club: FIELD.club,
  age: FIELD.age,
  height: FIELD.height,
  weight: FIELD.weight,
  // ไม่มีฟิลด์ "คะแนนล่าสุด" รวมเดียวใน Airtable (เราคำนวณเอง = Camp2026 ?? Leg2 ?? Leg1)
  // ใช้ Camp 2026 เป็นตัวแทนคะแนนล่าสุดสำหรับการเรียงลำดับฝั่ง Airtable
  rating: FIELD.avgRatingCamp2026,
};

export type TalentPlayerQuery = {
  search?: string;
  province?: string;
  region?: string;
  position?: string;
  year?: string;
  sortKey?: TalentSortKey;
  sortAsc?: boolean;
  pageSize?: number;
  offset?: string;
};

function buildFilterFormula(query: TalentPlayerQuery): string | undefined {
  const conditions: string[] = [];

  if (query.province) {
    conditions.push(
      `TRIM({${FIELD.province}}) = "${escapeAirtableFormulaString(query.province)}"`,
    );
  }
  if (query.region) {
    conditions.push(
      `TRIM({${FIELD.region}}) = "${escapeAirtableFormulaString(query.region)}"`,
    );
  }
  if (query.position) {
    conditions.push(
      `TRIM({${FIELD.position1}}) = "${escapeAirtableFormulaString(query.position)}"`,
    );
  }
  if (query.year) {
    conditions.push(`{${FIELD.yearOfBirth}} = "${escapeAirtableFormulaString(query.year)}"`);
  }
  if (query.search?.trim()) {
    const q = escapeAirtableFormulaString(query.search.trim().toLowerCase());
    const searchFields = [FIELD.fullNameTh, FIELD.fullNameEn, FIELD.nickname, FIELD.club, FIELD.school];
    conditions.push(
      `OR(${searchFields.map((f) => `SEARCH("${q}", LOWER({${f}}))`).join(",")})`,
    );
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return `AND(${conditions.join(",")})`;
}

export async function getTalentPlayersPage(
  query: TalentPlayerQuery,
): Promise<{ players: TalentPlayer[]; offset?: string }> {
  const sortKey = query.sortKey ?? "name";
  const { records, offset } = await queryAirtablePage<RawFields>(TABLE_NAME, {
    filterByFormula: buildFilterFormula(query),
    sort: [{ field: SORT_FIELD[sortKey], direction: query.sortAsc === false ? "desc" : "asc" }],
    pageSize: query.pageSize ?? 50,
    offset: query.offset,
  });
  return { players: records.map(mapPlayer), offset };
}

export async function getTalentPlayerById(id: string): Promise<TalentPlayer | null> {
  const record = await getAirtableRecord<RawFields>(TABLE_NAME, id);
  return record ? mapPlayer(record) : null;
}

export function stripSensitive(player: TalentPlayer): TalentPlayer {
  return {
    ...player,
    idCardNumber: null,
    phone: null,
    emergencyPhone: null,
    email: null,
    lineId: null,
  };
}
