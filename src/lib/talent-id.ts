import { getAirtableRecords, getAirtableRecord, type AirtableRecord } from "./airtable";

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
  notes: "Notes / หมายเหตุ",
  idCardNumber: "ID Card Number / รหัสประจำตัวประชาชน",
  phone: "Phone Number / เบอร์โทรศัพท์",
  emergencyPhone: "เบอร์ฉุกเฉิน",
  email: "Email / อีเมล์",
  lineId: "Line ID / ไอดีไลน์",
} as const;

const NON_TAG_KEYS = new Set<string>(Object.values(FIELD));

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
    tags,
    notes: str(f[FIELD.notes]),
    idCardNumber: str(f[FIELD.idCardNumber]),
    phone: str(f[FIELD.phone]),
    emergencyPhone: str(f[FIELD.emergencyPhone]),
    email: str(f[FIELD.email]),
    lineId: str(f[FIELD.lineId]),
  };
}

export async function getTalentPlayers(): Promise<TalentPlayer[]> {
  const records = await getAirtableRecords<RawFields>(TABLE_NAME);
  return records.map(mapPlayer);
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
