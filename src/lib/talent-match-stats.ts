import { getAirtableRecords } from "./airtable";
import { categoryForPosition } from "./position-color";

const TABLE_NAME = "INDIVIDUAL STATS LEG 2 / 2026";

// ชื่อฟิลด์ตรงตาม Airtable เป๊ะ — ตรวจสอบจริงกับ API แล้ว (ตารางนี้แยกจากตาราง Players
// field ชื่อไม่เหมือนกันทุกตัว เช่น ภูมิภาคใช้ "ภูมิภาค copy" ไม่ใช่ "ภูมิภาค")
const FIELD = {
  nickCode: "Sport Code Nick Name",
  playerName: "Players / ผู้เล่น",
  playerId: "Players / ผู้เล่น 2", // linked record → ใช้ลิงก์ไปหน้าโปรไฟล์ /talent-id/[id] ได้ตรง ๆ
  position: "ตำแหน่ง",
  region: "ภูมิภาค copy",
  school: "โรงเรียน",
  photo: "Photo / รูปประจำตัว (from Players / ผู้เล่น 2)",
} as const;

// ตำแหน่ง/ภูมิภาค/โรงเรียนในตารางนี้เป็น lookup field — Airtable คืนมาเป็น array เสมอ
// (แม้จะมีค่าเดียว) ต่างจากตาราง Players ที่เป็น text ธรรมดา
function firstOrSelf(v: unknown): string | null {
  const raw = Array.isArray(v) ? v[0] : v;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

export const POSITION_CATEGORY_LABEL: Record<"FW" | "MF" | "DF" | "GK", string> = {
  FW: "กองหน้า",
  MF: "กองกลาง",
  DF: "กองหลัง",
  GK: "ผู้รักษาประตู",
};

// ชื่อสถิติแบบเต็ม (ไทย/อังกฤษ) สำหรับ 30 คอลัมน์ใน STAT_GROUPS — ใช้แสดงผลในตารางสรุปรายคน
export const STAT_LABELS: Record<string, { th: string; en: string }> = {
  PASSING: { th: "จ่ายบอล", en: "Passing" },
  "LINE BREAK PASS": { th: "จ่ายทะลุไลน์", en: "Line Break Pass" },
  "PASS BACK": { th: "จ่ายกลับหลัง", en: "Pass Back" },
  "LOSS PASS": { th: "จ่ายเสีย", en: "Loss Pass" },
  CROSSING: { th: "ครอส", en: "Crossing" },
  "ACCURATE CROSSING": { th: "ครอสแม่น", en: "Accurate Crossing" },
  "LOSS CROSSING": { th: "ครอสเสีย", en: "Loss Crossing" },
  "CHANCE CREATION": { th: "สร้างโอกาส", en: "Chance Creation" },
  ASSIST: { th: "แอสซิสต์", en: "Assist" },
  GOAL: { th: "ประตู", en: "Goal" },
  "TAKE ON 1V1": { th: "เลี้ยงผ่าน 1v1", en: "Take On 1v1" },
  "WIN TAKE ON 1V1": { th: "ชนะเลี้ยง 1v1", en: "Win Take On" },
  "LOST TAKE ON 1V1": { th: "แพ้เลี้ยง 1v1", en: "Lost Take On" },
  "DEFENSIVE DUEL 1V1": { th: "ดวลรับ 1v1", en: "Defensive Duel" },
  "WIN DEFENSIVE DUEL 1V1": { th: "ชนะดวลรับ", en: "Win Def Duel" },
  "LOST DEFENSIVE DUEL 1v1": { th: "แพ้ดวลรับ", en: "Lost Def Duel" },
  "DEFENSIVE ACTION": { th: "เกมรับ", en: "Defensive Action" },
  INTERCEP: { th: "ตัดบอล", en: "Interception" },
  TACKLE: { th: "เข้าสกัด", en: "Tackle" },
  "AERIAL CONTEST": { th: "ลูกกลางอากาศ", en: "Aerial Contest" },
  "WIN AERIAL CONTEST": { th: "ชนะลูกกลางอากาศ", en: "Win Aerial" },
  "LOST AERIAL CONTEST": { th: "แพ้ลูกกลางอากาศ", en: "Lost Aerial" },
  SHOT: { th: "ยิงประตู", en: "Shot" },
  "ON TARGET": { th: "เข้ากรอบ", en: "On Target" },
  "OFF TARGET": { th: "ออกกรอบ", en: "Off Target" },
  "ON BLOCK": { th: "ถูกบล็อก", en: "On Block" },
  "MISS CHANCE": { th: "พลาดโอกาส", en: "Miss Chance" },
  "BALL LOSS": { th: "เสียบอล", en: "Ball Loss" },
  "COUNTER PRESSING": { th: "เพรสกลับ", en: "Counter Pressing" },
  "NO REACTION": { th: "ไม่รีแอค", en: "No Reaction" },
};

// ทิศทางของแต่ละสถิติ — บางสถิติค่ายิ่งสูงยิ่งดี (positive) บางสถิติค่ายิ่งสูงยิ่งแย่ (negative)
// เช่น "จ่ายเสีย"/"เสียบอล" ค่าสูงคือปัญหา ไม่ใช่จุดเด่น — ใช้ตัดสินว่าใครแข็ง/ใครควรพัฒนาให้ถูกทิศทาง
// สถิติที่เป็นแค่ "จำนวนครั้งที่พยายาม" (เช่น SHOT, CROSSING, TAKE ON 1V1) ไม่ชี้ชัดว่าดีหรือแย่
// เลยไม่ใส่ในนี้ — ถือเป็นกลาง ๆ ไม่ถูกใช้ตัดสินจุดแข็ง/จุดที่ควรพัฒนา
export const STAT_DIRECTION: Record<string, "positive" | "negative"> = {
  GOAL: "positive",
  ASSIST: "positive",
  "ON TARGET": "positive",
  "OFF TARGET": "negative",
  "MISS CHANCE": "negative",
  "CHANCE CREATION": "positive",
  PASSING: "positive",
  "LOSS PASS": "negative",
  "LINE BREAK PASS": "positive",
  "ACCURATE CROSSING": "positive",
  "LOSS CROSSING": "negative",
  "WIN TAKE ON 1V1": "positive",
  "LOST TAKE ON 1V1": "negative",
  TACKLE: "positive",
  INTERCEP: "positive",
  "DEFENSIVE ACTION": "positive",
  "WIN DEFENSIVE DUEL 1V1": "positive",
  "LOST DEFENSIVE DUEL 1v1": "negative",
  "COUNTER PRESSING": "positive",
  "WIN AERIAL CONTEST": "positive",
  "LOST AERIAL CONTEST": "negative",
  "BALL LOSS": "negative",
  "NO REACTION": "negative",
};

// แกนสำหรับกราฟเรดาร์เทียบโปรไฟล์ผู้เล่นกับค่าสูงสุดของทุกคนในตาราง (real per-category
// data จริงจาก Airtable — ไม่ใช่แกนที่เดาขึ้นมาเอง)
export const RADAR_AXES = [
  "PASSING",
  "CHANCE CREATION",
  "TAKE ON 1V1",
  "SHOT",
  "DEFENSIVE ACTION",
  "INTERCEP",
  "WIN AERIAL CONTEST",
  "COUNTER PRESSING",
] as const;

// รายชื่อสถิติทั้งหมดในตาราง จัดกลุ่มตามหมวดฟุตบอลจริง (ชื่อคอลัมน์ตรงกับ Airtable เป๊ะ)
// เพื่อแสดงผลเป็นหมวดที่อ่านง่ายกว่าตัวเลข 29 ตัวเรียงแบน
export const STAT_GROUPS: { title: string; stats: string[] }[] = [
  {
    title: "การทำประตู",
    stats: ["GOAL", "ASSIST", "SHOT", "ON TARGET", "OFF TARGET", "MISS CHANCE", "CHANCE CREATION"],
  },
  {
    title: "การจ่ายบอล",
    stats: ["PASSING", "LOSS PASS", "LINE BREAK PASS", "PASS BACK", "ACCURATE CROSSING", "CROSSING", "LOSS CROSSING"],
  },
  {
    title: "การเลี้ยงบอล / ดวลตัวต่อตัว",
    stats: ["TAKE ON 1V1", "WIN TAKE ON 1V1", "LOST TAKE ON 1V1"],
  },
  {
    title: "การป้องกัน",
    stats: [
      "TACKLE",
      "INTERCEP",
      "DEFENSIVE ACTION",
      "DEFENSIVE DUEL 1V1",
      "WIN DEFENSIVE DUEL 1V1",
      "LOST DEFENSIVE DUEL 1v1",
      "ON BLOCK",
      "COUNTER PRESSING",
    ],
  },
  {
    title: "การดวลกลางอากาศ",
    stats: ["AERIAL CONTEST", "WIN AERIAL CONTEST", "LOST AERIAL CONTEST"],
  },
  {
    title: "อื่นๆ",
    stats: ["BALL LOSS", "NO REACTION"],
  },
];

export type PlayerMatchStats = Record<string, number>;

export type MatchStatsRow = {
  id: string;
  playerId: string | null;
  name: string;
  position: string | null;
  positionCategory: "FW" | "MF" | "DF" | "GK" | null;
  region: string | null;
  school: string | null;
  photoUrl: string | null;
  stats: PlayerMatchStats;
};

function photoUrl(v: unknown): string | null {
  const attachments = v as { url: string; thumbnails?: { large?: { url: string } } }[] | undefined;
  const first = attachments?.[0];
  return first?.thumbnails?.large?.url ?? first?.url ?? null;
}

// ตารางนี้เล็ก (หลักสิบแถว) ดึงทั้งหมดมาสรุปภาพรวมได้โดยไม่กระทบ perf แบบตาราง Players
export async function getAllMatchStats(): Promise<MatchStatsRow[]> {
  const records = await getAirtableRecords<Record<string, unknown>>(TABLE_NAME);
  return records.map((r) => {
    const stats: PlayerMatchStats = {};
    for (const group of STAT_GROUPS) {
      for (const key of group.stats) {
        const v = r.fields[key];
        if (typeof v === "number") stats[key] = v;
      }
    }
    const name =
      (r.fields[FIELD.playerName] as string) || (r.fields[FIELD.nickCode] as string) || "ไม่ระบุชื่อ";
    const position = firstOrSelf(r.fields[FIELD.position]);
    const linkedPlayerIds = r.fields[FIELD.playerId];
    return {
      id: r.id,
      playerId: Array.isArray(linkedPlayerIds) ? (linkedPlayerIds[0] as string) ?? null : null,
      name,
      position,
      positionCategory: categoryForPosition(position),
      region: firstOrSelf(r.fields[FIELD.region]),
      school: firstOrSelf(r.fields[FIELD.school]),
      photoUrl: photoUrl(r.fields[FIELD.photo]),
      stats,
    };
  });
}

// ค่าสูงสุดจริงของทั้งทีมต่อสถิติแต่ละตัว (ทุกคอลัมน์ใน STAT_GROUPS ไม่ใช่แค่แกนเรดาร์)
// ใช้เฉพาะกับ "รูปทรง" กราฟเรดาร์ (% เทียบผู้เล่นที่ทำได้สูงสุด — ทำให้กราฟมีรูปทรงเป็นหนามได้
// ตามธรรมชาติของสถิตินับจำนวนที่มีคนเก่งโดดเด่นเพียงไม่กี่คนต่อแกน)
export function computeStatsMax(rows: MatchStatsRow[]): Record<string, number> {
  const allKeys = STAT_GROUPS.flatMap((g) => g.stats);
  const max: Record<string, number> = {};
  for (const key of allKeys) {
    max[key] = Math.max(1, ...rows.map((r) => r.stats[key] ?? 0));
  }
  return max;
}

// การกระจายค่าจริงของทั้งทีมต่อสถิติแต่ละตัว (เรียงจากน้อยไปมาก) ใช้หา percentile ของ
// ผู้เล่นแต่ละคน — ต่างจาก computeStatsMax ตรงที่ percentile ไม่ถูกบิดเบือนจากคนเก่งโดดเด่น
// เพียงคนเดียว (ถ้าใช้ % เทียบค่าสูงสุดตรง ๆ คนส่วนใหญ่จะโดนดันไปกองอยู่ที่คะแนนต่ำหมด
// เพราะสถิติแบบนับจำนวนต่อแมตช์กระจายเบ้ขวาเป็นปกติ)
export function computeStatsDistribution(rows: MatchStatsRow[]): Record<string, number[]> {
  const allKeys = STAT_GROUPS.flatMap((g) => g.stats);
  const dist: Record<string, number[]> = {};
  for (const key of allKeys) {
    dist[key] = rows.map((r) => r.stats[key] ?? 0).sort((a, b) => a - b);
  }
  return dist;
}

// percentile rank ของค่าหนึ่งเทียบกับการกระจายทั้งหมด (0-100) — นับคนที่น้อยกว่าเต็ม ๆ
// บวกครึ่งหนึ่งของคนที่เท่ากัน (มาตรฐาน mid-rank percentile กันค่า 0 ที่คนส่วนใหญ่ทำได้
// เท่ากันหมดถูกตัดสินว่า "แย่" ทั้งที่จริงคือค่าเฉลี่ยของกลุ่ม)
function percentileOf(value: number, sorted: number[]): number {
  if (sorted.length === 0) return 0;
  let below = 0;
  let equal = 0;
  for (const v of sorted) {
    if (v < value) below++;
    else if (v === value) equal++;
  }
  return Math.round(((below + equal / 2) / sorted.length) * 100);
}

export function statPercentile(row: MatchStatsRow, key: string, dist: Record<string, number[]>): number {
  return percentileOf(row.stats[key] ?? 0, dist[key] ?? []);
}

// หาแถวสถิติของผู้เล่นคนเดียวด้วย Airtable record id ตรง ๆ ผ่าน linked record field
// (แม่นกว่าการจับคู่ชื่อ — กันปัญหาชื่อไทยสะกดคลาดเคลื่อนระหว่างสองตาราง) พร้อมค่าสูงสุด/
// การกระจายของทั้งทีมต่อสถิติ สำหรับวาดกราฟเรดาร์และไล่สีตารางสถิติเทียบกับผู้เล่นคนอื่น
export async function getPlayerMatchStatsRow(
  playerId: string,
): Promise<{ row: MatchStatsRow; statsMax: Record<string, number>; statsDist: Record<string, number[]> } | null> {
  const all = await getAllMatchStats();
  const row = all.find((r) => r.playerId === playerId);
  if (!row) return null;

  return { row, statsMax: computeStatsMax(all), statsDist: computeStatsDistribution(all) };
}

export type Leaderboard = { stat: string; rows: { row: MatchStatsRow; value: number }[] };

// จัดอันดับ top N รายบุคคลสำหรับทุกสถิติในกลุ่ม โดยตัดคนที่ค่าเป็น 0 หรือไม่มีข้อมูลออก
export function buildLeaderboards(
  data: MatchStatsRow[],
  statKeys: string[],
  topN = 5,
): Leaderboard[] {
  return statKeys
    .map((stat) => {
      const rows = data
        .map((row) => ({ row, value: row.stats[stat] }))
        .filter((r): r is { row: MatchStatsRow; value: number } => (r.value ?? 0) > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, topN);
      return { stat, rows };
    })
    .filter((lb) => lb.rows.length > 0);
}
