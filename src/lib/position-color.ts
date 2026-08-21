// สีตามกลุ่มตำแหน่ง ใช้ร่วมกันทุกที่ที่แสดงผู้เล่น (โปรไฟล์, การ์ดในหน้าสถิติ, กราฟเรดาร์)
// เพื่อให้สีสื่อความหมายเดียวกันทั้งแอป — เห็นสีก็รู้กลุ่มตำแหน่งทันที
export const POSITION_COLOR: Record<"FW" | "MF" | "DF" | "GK", string> = {
  FW: "#fbbf24", // amber-400
  MF: "#38bdf8", // sky-400
  DF: "#34d399", // emerald-400
  GK: "#a78bfa", // violet-400
};

export const POSITION_COLOR_DEFAULT = "#818cf8"; // indigo-400 — ไม่ทราบกลุ่มตำแหน่ง

export function positionColor(category: "FW" | "MF" | "DF" | "GK" | null | undefined): string {
  return category ? POSITION_COLOR[category] : POSITION_COLOR_DEFAULT;
}

// จับกลุ่มตำแหน่งจากค่าจริง 11 ตำแหน่งในตาราง Players (ตรวจสอบกับ Airtable schema แล้ว)
// ใช้ได้ทั้งฟิลด์ตำแหน่งของตาราง Players และตาราง INDIVIDUAL STATS (ค่าตรงกัน)
const POSITION_CATEGORY: Record<string, "FW" | "MF" | "DF" | "GK"> = {
  "ผู้รักษาประตู / Goalkeeper": "GK",
  "แบ็คซ้าย / Left Back": "DF",
  "เซ็นเตอร์ซ้าย / Left Centerback": "DF",
  "เซ็นเตอร์ขวา / Right Centerback": "DF",
  "แบ็คขวา / Right Back": "DF",
  "กองกลางตัวรับ / Defensive Midfielder": "MF",
  "กองกลาง / Central Midfielder": "MF",
  "กองกลางตัวรุก / Attacking Midfielder": "MF",
  "ปีกซ้าย / Left Winger": "FW",
  "ปีกขวา / Right Winger": "FW",
  "หน้าเป้า / Striker": "FW",
};

export function categoryForPosition(position: string | null | undefined): "FW" | "MF" | "DF" | "GK" | null {
  if (!position) return null;
  return POSITION_CATEGORY[position] ?? null;
}
