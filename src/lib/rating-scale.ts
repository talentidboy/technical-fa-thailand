// สเกลสี "เกรดผลงาน" แบบเดียวกับเกมจัดการทีมฟุตบอล (แถบสีตามคะแนน 0-100)
// ใช้ร่วมกันทั้งหน้าโปรไฟล์ผู้เล่นและหน้าสถิติ — เกณฑ์เดียวกันทุกที่เพื่อให้เทียบกันได้
export type RatingTier = {
  label: string;
  text: string;
  bg: string;
  ring: string;
};

const TIERS: { min: number; tier: RatingTier }[] = [
  { min: 85, tier: { label: "ยอดเยี่ยม", text: "text-emerald-300", bg: "bg-emerald-400/15", ring: "ring-emerald-400/40" } },
  { min: 70, tier: { label: "ดีมาก", text: "text-lime-300", bg: "bg-lime-400/15", ring: "ring-lime-400/40" } },
  { min: 50, tier: { label: "ดี", text: "text-amber-300", bg: "bg-amber-400/15", ring: "ring-amber-400/40" } },
  { min: 30, tier: { label: "ปานกลาง", text: "text-orange-300", bg: "bg-orange-400/15", ring: "ring-orange-400/40" } },
  { min: 0, tier: { label: "เริ่มต้น", text: "text-rose-300", bg: "bg-rose-400/15", ring: "ring-rose-400/40" } },
];

export function ratingTier(percent: number): RatingTier {
  const clamped = Math.max(0, Math.min(100, percent));
  return (TIERS.find((t) => clamped >= t.min) ?? TIERS[TIERS.length - 1]).tier;
}

// จุดอ้างอิงเปอร์เซ็นไทล์จริงของ "คะแนนประเมินเฉลี่ย" (Average Rating) วัดจากผู้เล่น
// ที่มีคะแนนทั้งหมด 1,055 คนในฐานข้อมูล ณ วันที่ตรวจสอบ (2026-08-21): min 1, p10 1.4,
// p25 1.6, p50 1.9, p75 2.2, p90 2.6, max 4 — ใช้แปลงเป็นสเกล 0-100 แบบเทียบกับกลุ่มจริง
// แทนการหาร min-max ตรงๆ ซึ่งจะทำให้ผู้เล่นส่วนใหญ่ (ค่ากลางอยู่ที่ 1.9) ดูคะแนนต่ำทั้งที่จริง
// อยู่ระดับกลางของกลุ่ม
const RATING_PERCENTILE_ANCHORS: [number, number][] = [
  [1, 5],
  [1.4, 20],
  [1.6, 32],
  [1.9, 50],
  [2.2, 72],
  [2.6, 88],
  [4, 99],
];

export function avgRatingToScore(value: number): number {
  const pts = RATING_PERCENTILE_ANCHORS;
  if (value <= pts[0][0]) return pts[0][1];
  if (value >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    if (value >= x0 && value <= x1) {
      const t = (value - x0) / (x1 - x0);
      return Math.round(y0 + t * (y1 - y0));
    }
  }
  return pts[pts.length - 1][1];
}
