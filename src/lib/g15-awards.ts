// รางวัลประจำทัวร์นาเมนต์ G15 + ทีมยอดเยี่ยม (Best XI) ผัง 4-3-3 แบบมีกองกลางตัวรับ (holding)
// ไฟล์นี้ไม่แตะฐานข้อมูล ใช้ได้ทั้งฝั่ง server และ client

export type AwardKind = "player" | "official" | "team";
export type AwardDef = { key: string; kind: AwardKind; th: string; en: string };

export const INDIVIDUAL_AWARDS: AwardDef[] = [
  { key: "MVP", kind: "player", th: "รางวัลผู้เล่นทรงคุณค่า", en: "Most Valuable Player (MVP) Award" },
  { key: "TOP_SCORER", kind: "player", th: "รางวัลดาวซัลโวสูงสุด", en: "Top Goalscorer Award" },
  { key: "GOLDEN_GLOVE", kind: "player", th: "รางวัลผู้รักษาประตูยอดเยี่ยม", en: "Golden Glove Award" },
  { key: "SPORTSMANSHIP", kind: "player", th: "รางวัลน้ำใจนักกีฬา", en: "Sportsmanship Award" },
  { key: "BEST_COACH", kind: "official", th: "รางวัลผู้ฝึกสอนยอดเยี่ยมประจำการแข่งขัน", en: "Best Coach of the Tournament Award" },
  { key: "INSPIRATIONAL_COACH", kind: "official", th: "รางวัลผู้ฝึกสอนผู้สร้างแรงบันดาลใจ", en: "Inspirational Coach Award" },
  {
    key: "INTL_DEV_COACH",
    kind: "official",
    th: "รางวัลผู้ฝึกสอนผู้พัฒนาผู้เล่นสู่ระดับนานาชาติ",
    en: "International Player Development Coach Award",
  },
];

export const TEAM_AWARDS: AwardDef[] = [
  { key: "CHAMPION", kind: "team", th: "ชนะเลิศ", en: "Champion" },
  { key: "RUNNER_UP", kind: "team", th: "รองชนะเลิศ", en: "Runner-up" },
  { key: "THIRD_PLACE", kind: "team", th: "อันดับ 3", en: "Third Place" },
];

export const ALL_AWARDS = [...TEAM_AWARDS, ...INDIVIDUAL_AWARDS];

// ===== Best XI =====
export const BEST_XI_STAGE = "TOURNAMENT";

export type PositionGroup = "GK" | "DF" | "MF" | "FW";

// row: 0 = ผู้รักษาประตู (ล่างสุดของสนาม) … 4 = แนวรุก (บนสุด) · DM อยู่แถวเดียวหน้ากองหลัง (holding)
export const BEST_XI_SLOTS: { slot: string; row: number; th: string; en: string; group: PositionGroup }[] = [
  { slot: "LW", row: 4, th: "ปีกซ้าย", en: "LW", group: "FW" },
  { slot: "ST", row: 4, th: "กองหน้าตัวเป้า", en: "ST", group: "FW" },
  { slot: "RW", row: 4, th: "ปีกขวา", en: "RW", group: "FW" },
  { slot: "LCM", row: 3, th: "กองกลาง", en: "CM", group: "MF" },
  { slot: "RCM", row: 3, th: "กองกลาง", en: "CM", group: "MF" },
  { slot: "DM", row: 2, th: "กองกลางตัวรับ", en: "DM", group: "MF" },
  { slot: "LB", row: 1, th: "แบ็กซ้าย", en: "LB", group: "DF" },
  { slot: "LCB", row: 1, th: "เซ็นเตอร์แบ็ก", en: "CB", group: "DF" },
  { slot: "RCB", row: 1, th: "เซ็นเตอร์แบ็ก", en: "CB", group: "DF" },
  { slot: "RB", row: 1, th: "แบ็กขวา", en: "RB", group: "DF" },
  { slot: "GK", row: 0, th: "ผู้รักษาประตู", en: "GK", group: "GK" },
];

export const POSITION_GROUP_LABEL: Record<PositionGroup, string> = {
  GK: "ผู้รักษาประตู",
  DF: "กองหลัง",
  MF: "กองกลาง",
  FW: "กองหน้า",
};

// ตำแหน่งในทะเบียน (ภาษาไทย/อังกฤษ) → กลุ่มตำแหน่ง
export function positionGroup(position: string | null | undefined): PositionGroup | null {
  const p = (position ?? "").toLowerCase();
  if (!p) return null;
  if (p.includes("ผู้รักษาประตู") || p === "ประตู" || p.includes("gk") || p.includes("goalkeeper")) return "GK";
  if (p.includes("กองหลัง") || p.includes("def") || p === "df") return "DF";
  if (p.includes("กองกลาง") || p.includes("mid") || p === "mf") return "MF";
  if (p.includes("กองหน้า") || p.includes("forward") || p.includes("striker") || p === "fw") return "FW";
  return null;
}

// โค้ชก่อน (หัวหน้าผู้ฝึกสอน / ผู้ฝึกสอน …) แล้วจึงเจ้าหน้าที่อื่น — ใช้เรียงตัวเลือกรางวัลผู้ฝึกสอน
export function coachRank(role: string | null | undefined) {
  const r = role ?? "";
  if (r.includes("หัวหน้าผู้ฝึกสอน") || /head coach/i.test(r)) return 0;
  if (r === "ผู้ฝึกสอน" || /^coach$/i.test(r)) return 1;
  if (r.includes("ผู้ฝึกสอน") || /coach/i.test(r)) return 2;
  return 3;
}
