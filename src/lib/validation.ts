// ตรวจรูปแบบเลขบัตรประชาชนไทย 13 หลัก ด้วยสูตร checksum มาตรฐาน (mod 11)
// sum = Σ d(i) * (13 - i) สำหรับ i = 0..11 (0-indexed ของหลักที่ 1-12) แล้วเช็คหลักที่ 13
export function isValidThaiIdNumber(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 13) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(digits[i]) * (13 - i);
  }
  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === Number(digits[12]);
}
