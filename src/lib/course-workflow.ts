// ขั้นตอนรุ่นอบรม: เปิดรับสมัคร → อนุมัติเข้าอบรม → ยืนยันผลผ่าน (ออกใบอนุญาตอัตโนมัติ)
// ไฟล์นี้ไม่แตะฐานข้อมูล ใช้ได้ทั้งฝั่ง server และ client

export const APPLICATION_STATUS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "รออนุมัติ", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  APPROVED: { label: "อนุมัติเข้าอบรม", className: "bg-sky-50 text-sky-700 ring-sky-200" },
  PASSED: { label: "ผ่านการอบรม", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  FAILED: { label: "ไม่ผ่านการอบรม", className: "bg-red-50 text-red-700 ring-red-200" },
  REJECTED: { label: "ไม่อนุมัติ", className: "bg-slate-100 text-slate-500 ring-slate-200" },
  CANCELLED: { label: "ยกเลิก", className: "bg-slate-100 text-slate-500 ring-slate-200" },
};

// ใบสมัครที่ยังนับเป็นผู้เข้าอบรม (ใช้นับที่นั่ง และกันสมัครซ้ำ)
export const LIVE_APPLICATION_STATUSES = ["PENDING", "APPROVED", "PASSED"];

export const SESSION_STATUS: Record<string, { label: string; className: string }> = {
  OPEN: { label: "เปิดรับสมัคร", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  CLOSED: { label: "ปิดรับสมัคร", className: "bg-slate-100 text-slate-600 ring-slate-200" },
  COMPLETED: { label: "จบรุ่นแล้ว", className: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
};

// ชื่อหลักสูตรที่สร้างให้อัตโนมัติเมื่อเปิดรุ่นของระดับนั้นครั้งแรก
export function defaultCourseTitle(licenseType: string) {
  return licenseType === "G" ? "Grassroots G Certificate" : `AFC ${licenseType} Diploma`;
}

// อายุใบอนุญาตตามข้อมูลเดิมในระบบ: C / B / A / PRO = 3 ปี, ระดับอื่นไม่กำหนดวันหมดอายุ
export function defaultExpiry(licenseType: string | null, issueDate: Date) {
  if (!licenseType || !["C", "B", "A", "PRO"].includes(licenseType)) return null;
  const d = new Date(issueDate);
  d.setFullYear(d.getFullYear() + 3);
  return d;
}

// คำนำหน้าเลขที่ใบประกาศ เช่น C-26/ (PRO ใช้ P ตามเลขเดิม P-19/0001)
export function certificatePrefix(licenseType: string, issueDate: Date) {
  const letter = licenseType === "PRO" ? "P" : licenseType;
  return `${letter}-${String(issueDate.getFullYear() % 100).padStart(2, "0")}/`;
}

// เลขที่ใบประกาศลำดับที่ n (เริ่ม 0) นับต่อจากเลขเริ่มต้น — เพิ่มเฉพาะตัวเลขท้ายสุด คงจำนวนหลักเดิม
// เช่น "C-26/0009" + 2 → "C-26/0011", "Intro.4892" + 1 → "Intro.4893"
export function nthCertificateNo(start: string, n: number) {
  const m = start.match(/^(.*?)(\d+)(\D*)$/);
  if (!m) return n === 0 ? start : `${start}-${n + 1}`;
  const [, head, digits, tail] = m;
  return `${head}${String(Number(digits) + n).padStart(digits.length, "0")}${tail}`;
}

export function toDateInput(date: Date | null) {
  if (!date) return "";
  const local = new Date(date.getTime() + 7 * 60 * 60 * 1000); // เวลาไทย
  return local.toISOString().slice(0, 10);
}
