// ชื่อที่ใช้แสดงของผู้ฝึกสอน — ผู้ฝึกสอนต่างชาติ (~560 คน) มีแต่ชื่ออังกฤษ ชื่อไทยว่าง จึงใช้ชื่ออังกฤษแทน
// (ต้องส่ง nameEn / familyNameEn มาด้วยเสมอ — ถ้า query ไม่ได้เลือกไว้ TypeScript จะเตือน)
type CoachNameFields = { nameTh: string; surnameTh: string; nameEn: string | null; familyNameEn: string | null };

export function coachName(c: CoachNameFields) {
  const th = `${c.nameTh ?? ""} ${c.surnameTh ?? ""}`.trim();
  if (th) return th;
  return [c.nameEn, c.familyNameEn].filter(Boolean).join(" ").trim() || "(ไม่มีชื่อ)";
}

// ตัวอักษรแรกสำหรับรูปแทนตัว (ข้ามสระนำหน้าภาษาไทย เ แ โ ใ ไ)
export function coachInitial(c: CoachNameFields) {
  return coachName(c).replace(/^[เแโใไ(]/, "").charAt(0).toUpperCase();
}
