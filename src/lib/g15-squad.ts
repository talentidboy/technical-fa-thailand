// จัดกลุ่มตำแหน่งนักกีฬา G15 สำหรับหน้ารายชื่อทีม (Squad List) — ค่าในฐานข้อมูลมาจากแบบฟอร์มของแต่ละทีม
// พิมพ์ไม่เหมือนกัน ("ปีกขวา", "แบ็คซ้าย", "กลองกลาง", "ผู้รักษาประตู เซ็นเตอร์" ฯลฯ) จึงจับด้วยคำสำคัญ
// ลำดับการเช็กสำคัญ: ผู้รักษาประตูก่อนเสมอ (บางคนกรอก "ผู้รักษาประตู เซ็นเตอร์")
export type SquadLine = "GK" | "DF" | "MF" | "FW" | "OTHER";

export const SQUAD_LINES: { key: SquadLine; label: string; en: string }[] = [
  { key: "GK", label: "ผู้รักษาประตู", en: "Goalkeepers" },
  { key: "DF", label: "กองหลัง", en: "Defenders" },
  { key: "MF", label: "กองกลาง", en: "Midfielders" },
  { key: "FW", label: "กองหน้า", en: "Forwards" },
  { key: "OTHER", label: "ไม่ระบุตำแหน่ง", en: "Players" },
];

export function squadLine(position: string | null): SquadLine {
  const p = position ?? "";
  if (/ประตู/.test(p)) return "GK";
  if (/หลัง|แบ็ค|แบล็ค|เซ็นเตอร์/.test(p)) return "DF";
  if (/กลาง|กลอง/.test(p)) return "MF";
  if (/หน้า|ปีก/.test(p)) return "FW";
  return "OTHER";
}

export function squadLineLabel(position: string | null) {
  const line = squadLine(position);
  return line === "OTHER" ? (position ?? "-") : SQUAD_LINES.find((l) => l.key === line)!.label;
}

// ลำดับเจ้าหน้าที่ — หัวหน้าผู้ฝึกสอน/ผู้จัดการทีมขึ้นก่อน ที่เหลือตามที่กรอกมา
const ROLE_ORDER = [/หัวหน้าผู้ฝึกสอน/, /ผู้จัดการทีม$|^ผู้จัดการทีม/, /ผู้ช่วยผู้ฝึกสอน|ผู้ช่วยโค้ช/, /ประตู/, /ผู้ฝึกสอน|โค้ช/];

export function staffRank(role: string | null) {
  const r = role ?? "";
  const i = ROLE_ORDER.findIndex((re) => re.test(r));
  return i === -1 ? ROLE_ORDER.length : i;
}
