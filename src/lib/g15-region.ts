// สีประจำภูมิภาค — จัดกลุ่มเองเพื่อให้ดูแยกโซนง่าย ๆ ไม่ใช่ข้อมูลจาก Airtable/DB
export const REGION_ORDER = ["ภาคใต้", "ภาคเหนือ", "ภาคกลาง", "ภาคตะวันออกเฉียงเหนือ"];

export const REGION_STYLE: Record<string, { bg: string; text: string; light: string; ring: string }> = {
  ภาคใต้: { bg: "bg-cyan-500", text: "text-cyan-300", light: "bg-cyan-400/15", ring: "ring-cyan-400/30" },
  ภาคเหนือ: { bg: "bg-emerald-500", text: "text-emerald-300", light: "bg-emerald-400/15", ring: "ring-emerald-400/30" },
  ภาคกลาง: { bg: "bg-purple-500", text: "text-purple-300", light: "bg-purple-400/15", ring: "ring-purple-400/30" },
  ภาคตะวันออกเฉียงเหนือ: { bg: "bg-amber-500", text: "text-amber-300", light: "bg-amber-400/15", ring: "ring-amber-400/30" },
};

export const DEFAULT_REGION_STYLE = { bg: "bg-slate-500", text: "text-slate-300", light: "bg-white/10", ring: "ring-white/15" };

export function regionStyle(region: string | null) {
  if (!region) return DEFAULT_REGION_STYLE;
  return REGION_STYLE[region] ?? DEFAULT_REGION_STYLE;
}

// groupName ในฐานข้อมูลเก็บเป็น "ภาคX - กลุ่ม Y" (เช่น "ภาคใต้ - กลุ่ม A") — แยกเป็นภาค/กลุ่มย่อย
// เพื่อจัดหมวดหมู่การ์ดต่าง ๆ ให้ดูตามภูมิภาค แทนกริดยาว ๆ รวมกันหมด
export function parseRegionGroup(groupName: string | null): { region: string; letter: string } | null {
  if (!groupName) return null;
  const m = groupName.match(/^(.+?)\s*-\s*กลุ่ม\s*(.+)$/);
  if (!m) return null;
  return { region: m[1].trim(), letter: m[2].trim() };
}
