// สีประจำภูมิภาค — จัดกลุ่มเองเพื่อให้ดูแยกโซนง่าย ๆ ไม่ใช่ข้อมูลจาก Airtable/DB
export const REGION_ORDER = ["ภาคใต้", "ภาคเหนือ", "ภาคกลาง", "ภาคตะวันออกเฉียงเหนือ"];

export const REGION_STYLE: Record<string, { bg: string; text: string; light: string; ring: string }> = {
  ภาคใต้: { bg: "bg-cyan-500", text: "text-cyan-700", light: "bg-cyan-50", ring: "ring-cyan-400/30" },
  ภาคเหนือ: { bg: "bg-emerald-500", text: "text-emerald-700", light: "bg-emerald-50", ring: "ring-emerald-400/30" },
  ภาคกลาง: { bg: "bg-purple-500", text: "text-purple-700", light: "bg-purple-50", ring: "ring-purple-400/30" },
  ภาคตะวันออกเฉียงเหนือ: { bg: "bg-amber-500", text: "text-amber-700", light: "bg-amber-50", ring: "ring-amber-400/30" },
};

export const DEFAULT_REGION_STYLE = { bg: "bg-slate-500", text: "text-slate-600", light: "bg-slate-100", ring: "ring-slate-300" };

export function regionStyle(region: string | null) {
  if (!region) return DEFAULT_REGION_STYLE;
  return REGION_STYLE[region] ?? DEFAULT_REGION_STYLE;
}

// ชื่อภาคภาษาอังกฤษ — ใช้คู่กับชื่อไทยเพื่อให้ผู้ใช้ต่างชาติเข้าใจง่ายขึ้น
export const REGION_EN: Record<string, string> = {
  ภาคใต้: "South",
  ภาคเหนือ: "North",
  ภาคกลาง: "Central",
  ภาคตะวันออกเฉียงเหนือ: "Northeast",
};

export function regionEn(region: string | null) {
  if (!region) return "";
  return REGION_EN[region] ?? "";
}

// groupName ในฐานข้อมูลเก็บเป็น "ภาคX - กลุ่ม Y" (เช่น "ภาคใต้ - กลุ่ม A") — แยกเป็นภาค/กลุ่มย่อย
// เพื่อจัดหมวดหมู่การ์ดต่าง ๆ ให้ดูตามภูมิภาค แทนกริดยาว ๆ รวมกันหมด
export function parseRegionGroup(groupName: string | null): { region: string; letter: string } | null {
  if (!groupName) return null;
  const m = groupName.match(/^(.+?)\s*-\s*กลุ่ม\s*(.+)$/);
  if (!m) return null;
  return { region: m[1].trim(), letter: m[2].trim() };
}

// จัดทีมเป็นกลุ่มตามภูมิภาค → กลุ่มย่อย (A/B) — ใช้ซ้ำในหลายหน้า (หน้าแรก/ทีมที่เข้าร่วม) แทนที่จะเขียนลูปเดิมซ้ำทุกที่
export function groupTeamsByRegion<T extends { groupName: string | null }>(teams: T[]) {
  const byRegion = new Map<string, Map<string, T[]>>();
  const ungrouped: T[] = [];
  for (const team of teams) {
    const parsed = parseRegionGroup(team.groupName);
    if (!parsed) {
      ungrouped.push(team);
      continue;
    }
    if (!byRegion.has(parsed.region)) byRegion.set(parsed.region, new Map());
    const groupMap = byRegion.get(parsed.region)!;
    if (!groupMap.has(parsed.letter)) groupMap.set(parsed.letter, []);
    groupMap.get(parsed.letter)!.push(team);
  }
  const regionOrder = [
    ...REGION_ORDER.filter((r) => byRegion.has(r)),
    ...Array.from(byRegion.keys()).filter((r) => !REGION_ORDER.includes(r)),
  ];
  return { regionOrder, byRegion, ungrouped };
}

// เหมือน groupTeamsByRegion แต่ทำงานกับผลลัพธ์ตารางคะแนน (StandingGroup) — groupName ของแต่ละกลุ่มใช้รูปแบบเดียวกัน
export function groupStandingsByRegion<T extends { groupName: string }>(groups: T[]) {
  const byRegion = new Map<string, Map<string, T>>();
  const ungrouped: T[] = [];
  for (const group of groups) {
    const parsed = parseRegionGroup(group.groupName);
    if (!parsed) {
      ungrouped.push(group);
      continue;
    }
    if (!byRegion.has(parsed.region)) byRegion.set(parsed.region, new Map());
    byRegion.get(parsed.region)!.set(parsed.letter, group);
  }
  const regionOrder = [
    ...REGION_ORDER.filter((r) => byRegion.has(r)),
    ...Array.from(byRegion.keys()).filter((r) => !REGION_ORDER.includes(r)),
  ];
  return { regionOrder, byRegion, ungrouped };
}
