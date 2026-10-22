// แปลงเลข id จาก URL (/coaches/123) — ไม่ใช่จำนวนเต็มบวกในช่วง INT ของฐานข้อมูล = null
// ใช้กันลิงก์ผิด/พิมพ์ผิด (เช่น /verify/abc หรือเลขยาวเกิน) ไม่ให้ฐานข้อมูลโยน error จนขึ้นหน้าข้อผิดพลาด → ตอบ "ไม่พบ" แทน
export function parseId(value: string | null | undefined): number | null {
  if (!value || !/^\d{1,10}$/.test(value)) return null;
  const n = Number(value);
  return n >= 1 && n <= 2_147_483_647 ? n : null;
}
