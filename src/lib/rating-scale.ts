// สเกลสี "เกรดผลงาน" แบบเดียวกับเกมจัดการทีมฟุตบอล (แถบสีตามคะแนน 0-100)
// ใช้ร่วมกันทั้งหน้าโปรไฟล์ผู้เล่นและหน้าสถิติ — เกณฑ์เดียวกันทุกที่เพื่อให้เทียบกันได้
export type RatingTier = {
  label: string;
  text: string;
  bg: string;
  ring: string;
  hex: string; // สำหรับ fill ของกราฟ SVG (Recharts) ที่ใช้ Tailwind class ไม่ได้
};

const TIERS: { min: number; tier: RatingTier }[] = [
  { min: 85, tier: { label: "ยอดเยี่ยม", text: "text-emerald-300", bg: "bg-emerald-400/15", ring: "ring-emerald-400/40", hex: "#34d399" } },
  { min: 70, tier: { label: "ดีมาก", text: "text-lime-300", bg: "bg-lime-400/15", ring: "ring-lime-400/40", hex: "#a3e635" } },
  { min: 50, tier: { label: "ดี", text: "text-amber-300", bg: "bg-amber-400/15", ring: "ring-amber-400/40", hex: "#fbbf24" } },
  { min: 30, tier: { label: "ปานกลาง", text: "text-orange-300", bg: "bg-orange-400/15", ring: "ring-orange-400/40", hex: "#fb923c" } },
  { min: 0, tier: { label: "เริ่มต้น", text: "text-rose-300", bg: "bg-rose-400/15", ring: "ring-rose-400/40", hex: "#fb7185" } },
];

export function ratingTier(percent: number): RatingTier {
  const clamped = Math.max(0, Math.min(100, percent));
  return (TIERS.find((t) => clamped >= t.min) ?? TIERS[TIERS.length - 1]).tier;
}
