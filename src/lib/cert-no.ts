// เลขที่ใบอนุญาตสำหรับเปรียบเทียบ — ข้อมูลเดิมมีทั้งขีดธรรมดาและขีดยูนิโคด (‐ –) และช่องว่างปน เช่น "C‐17/2383" กับ "C-17/2383" คือเลขเดียวกัน
export const normalizeCertNo = (s: string | null | undefined) => (s ?? "").normalize("NFC").trim().toLowerCase().replace(/[‐-―−]/g, "-").replace(/\s+/g, "");

// เลขที่พิมพ์ค้นหา → รูปแบบที่อาจถูกบันทึกไว้ (ขีดธรรมดา / ขีดยูนิโคด)
export const certNoVariants = (s: string) => {
  const plain = s.trim().replace(/[‐-―−]/g, "-");
  return [...new Set([plain, plain.replace(/-/g, "‐")])];
};
