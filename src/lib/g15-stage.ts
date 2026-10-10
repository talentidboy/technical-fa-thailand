import { REGION_STYLE, DEFAULT_REGION_STYLE, REGION_EN } from "@/lib/g15-region";

// ทัวร์นาเมนต์มี 2 ช่วง — รอบภูมิภาค (จบแล้ว) และรอบชิงแชมป์ประเทศ (National Round)
// ทุกหน้าที่คำนวณสถิติต้องกรองตาม stage เสมอ เพื่อให้รอบชิงแชมป์ประเทศเริ่มนับใหม่จากศูนย์ ไม่ปนกับรอบภูมิภาค
export type G15Stage = "REGIONAL" | "NATIONAL";

export const STAGES: { key: G15Stage; param: string; label: string; en: string }[] = [
  { key: "NATIONAL", param: "national", label: "รอบชิงแชมป์ประเทศ", en: "National Round" },
  { key: "REGIONAL", param: "regional", label: "รอบภูมิภาค", en: "Regional Round" },
];

export const DEFAULT_STAGE: G15Stage = "NATIONAL";

// อ่านค่า ?stage= จาก URL — ค่าอื่นๆ/ไม่ระบุ ถือเป็นรอบปัจจุบัน (รอบชิงแชมป์ประเทศ)
export function parseStage(value: string | string[] | undefined): G15Stage {
  const v = Array.isArray(value) ? value[0] : value;
  return STAGES.find((s) => s.param === v)?.key ?? DEFAULT_STAGE;
}

export function stageInfo(stage: G15Stage) {
  return STAGES.find((s) => s.key === stage)!;
}

// ต่อ ?stage= ให้ลิงก์ภายในเว็บ — รอบปัจจุบันไม่ต้องใส่ เพื่อให้ URL สั้นและเป็นค่าเริ่มต้น
export function withStage(href: string, stage: G15Stage) {
  if (stage === DEFAULT_STAGE) return href;
  return `${href}${href.includes("?") ? "&" : "?"}stage=${stageInfo(stage).param}`;
}

// ===== รอบชิงแชมป์ประเทศ =====

export const NATIONAL_GROUPS = ["A", "B"] as const;
export const NATIONAL_SEEDS = [1, 2, 3, 4] as const;

export const ROUND_GROUP_A = "กลุ่ม A";
export const ROUND_GROUP_B = "กลุ่ม B";
export const ROUND_SEMI = "รอบรองชนะเลิศ";
export const ROUND_THIRD = "ชิงอันดับที่ 3";
export const ROUND_FINAL = "ชิงชนะเลิศ";

export const NATIONAL_ROUNDS = [ROUND_GROUP_A, ROUND_GROUP_B, ROUND_SEMI, ROUND_THIRD, ROUND_FINAL];
export const KNOCKOUT_ROUNDS = [ROUND_SEMI, ROUND_THIRD, ROUND_FINAL];

export function groupRound(group: string) {
  return `กลุ่ม ${group}`;
}

export function isGroupRound(round: string) {
  return round === ROUND_GROUP_A || round === ROUND_GROUP_B;
}

export function isKnockoutRound(round: string) {
  return KNOCKOUT_ROUNDS.includes(round);
}

// เลขนัดตามผังทางการ — รอบแบ่งกลุ่มคือ 1-12 แล้วต่อด้วยน็อกเอาต์
export const MATCH_NO_SEMI_1 = 13;
export const MATCH_NO_SEMI_2 = 14;
export const MATCH_NO_THIRD = 15;
export const MATCH_NO_FINAL = 16;

type RoundStyle = { bg: string; text: string; light: string; ring: string };

const NATIONAL_ROUND_STYLE: Record<string, RoundStyle> = {
  [ROUND_GROUP_A]: { bg: "bg-indigo-600", text: "text-indigo-700", light: "bg-indigo-50", ring: "ring-indigo-400/30" },
  [ROUND_GROUP_B]: { bg: "bg-fuchsia-600", text: "text-fuchsia-700", light: "bg-fuchsia-50", ring: "ring-fuchsia-400/30" },
  [ROUND_SEMI]: { bg: "bg-g15-600", text: "text-g15-700", light: "bg-g15-50", ring: "ring-g15-400/30" },
  [ROUND_THIRD]: { bg: "bg-orange-800", text: "text-orange-800", light: "bg-orange-50", ring: "ring-orange-700/30" },
  // ชิงชนะเลิศ = สีทอง (amber ของโปรเจกต์ถูกปรับเป็นโทนทองแล้วใน globals.css)
  [ROUND_FINAL]: { bg: "bg-amber-600", text: "text-amber-700", light: "bg-amber-50", ring: "ring-amber-400/40" },
};

const NATIONAL_ROUND_EN: Record<string, string> = {
  [ROUND_GROUP_A]: "Group A",
  [ROUND_GROUP_B]: "Group B",
  [ROUND_SEMI]: "Semi-final",
  [ROUND_THIRD]: "3rd Place",
  [ROUND_FINAL]: "Final",
};

// สี/ชื่ออังกฤษของ "round" — ครอบคลุมทั้งชื่อภาค (รอบภูมิภาค) และชื่อรอบของรอบชิงแชมป์ประเทศ
// ใช้แทน REGION_STYLE[match.round] ตรงๆ ที่เดิมรู้จักแค่ชื่อภาค
export function roundStyle(round: string | null): RoundStyle {
  if (!round) return DEFAULT_REGION_STYLE;
  return NATIONAL_ROUND_STYLE[round] ?? REGION_STYLE[round] ?? DEFAULT_REGION_STYLE;
}

export function roundEn(round: string | null) {
  if (!round) return "";
  return NATIONAL_ROUND_EN[round] ?? REGION_EN[round] ?? "";
}

// ===== ผลการแข่งขัน =====

type ResultInput = {
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number | null;
  awayScore: number | null;
  homePenalty?: number | null;
  awayPenalty?: number | null;
  status: string;
};

// ผู้ชนะของนัด (นับดวลจุดโทษด้วยถ้าเสมอในเวลา) — null = ยังไม่จบ หรือเสมอโดยไม่มีจุดโทษ
export function matchWinnerId(m: ResultInput): number | null {
  if (m.status !== "FINISHED" || m.homeScore == null || m.awayScore == null) return null;
  if (m.homeScore !== m.awayScore) return m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId;
  if (m.homePenalty != null && m.awayPenalty != null && m.homePenalty !== m.awayPenalty) {
    return m.homePenalty > m.awayPenalty ? m.homeTeamId : m.awayTeamId;
  }
  return null;
}

export function matchLoserId(m: ResultInput): number | null {
  const winner = matchWinnerId(m);
  if (winner == null) return null;
  return winner === m.homeTeamId ? m.awayTeamId : m.homeTeamId;
}

export function hasPenalties(m: { homePenalty?: number | null; awayPenalty?: number | null }) {
  return m.homePenalty != null && m.awayPenalty != null;
}

// ===== กำลังแข่ง (LIVE) =====
// 90 นาที + พักครึ่ง 15 นาที + ทดเวลา ≈ 2 ชั่วโมงนับจากเวลาเตะ
export const LIVE_WINDOW_MS = 120 * 60 * 1000;

type LiveInput = { status: string; matchDate: Date | null; clockPhase?: string };

// กำลังแข่ง = แอดมินกดอัปเดตสกอร์สด (status LIVE) หรือยังไม่มีผลแต่อยู่ในช่วงเวลาแข่งตามโปรแกรม
export function isLive(m: LiveInput, now: Date = new Date()) {
  // นาฬิกาเกมสดเป็นตัวบอกที่แม่นที่สุด — แอดมินกดเริ่มแล้วจนถึงก่อนจบเกม = กำลังแข่ง, จบเกมแล้ว = ไม่ใช่
  if (m.clockPhase === "FIRST_HALF" || m.clockPhase === "HALF_TIME" || m.clockPhase === "SECOND_HALF") return true;
  if (m.clockPhase === "FULL_TIME") return false;
  if (m.status === "LIVE") return true;
  if (m.status !== "SCHEDULED" || !m.matchDate) return false;
  const kickoff = m.matchDate.getTime();
  return now.getTime() >= kickoff && now.getTime() < kickoff + LIVE_WINDOW_MS;
}

// มีสกอร์ระหว่างเกมให้โชว์ (status LIVE + กรอกสกอร์แล้ว)
export function hasLiveScore(m: { status: string; homeScore: number | null; awayScore: number | null }) {
  return m.status === "LIVE" && m.homeScore != null && m.awayScore != null;
}

// ตารางคะแนนสด — นับนัดที่กำลังแข่งเหมือนจบตามสกอร์ปัจจุบัน ("ถ้าจบแบบนี้ ใครเข้ารอบ")
export function projectLive<M extends { status: string; homeScore: number | null; awayScore: number | null }>(matches: M[]): M[] {
  return matches.map((m) => (hasLiveScore(m) ? { ...m, status: "FINISHED" } : m));
}

// ===== ทีมยอดเยี่ยมประจำรอบ (Team of the Round) — ผัง 4-3-3 =====
// line: 0 = ผู้รักษาประตู (แถวล่างสุดของสนาม) ... 3 = กองหน้า (แถวบนสุด)
export const TEAM_OF_ROUND_SLOTS = [
  { slot: "GK", line: 0, label: "ผู้รักษาประตู", en: "GK" },
  { slot: "DF1", line: 1, label: "กองหลัง 1", en: "DF" },
  { slot: "DF2", line: 1, label: "กองหลัง 2", en: "DF" },
  { slot: "DF3", line: 1, label: "กองหลัง 3", en: "DF" },
  { slot: "DF4", line: 1, label: "กองหลัง 4", en: "DF" },
  { slot: "MF1", line: 2, label: "กองกลาง 1", en: "MF" },
  { slot: "MF2", line: 2, label: "กองกลาง 2", en: "MF" },
  { slot: "MF3", line: 2, label: "กองกลาง 3", en: "MF" },
  { slot: "FW1", line: 3, label: "กองหน้า 1", en: "FW" },
  { slot: "FW2", line: 3, label: "กองหน้า 2", en: "FW" },
  { slot: "FW3", line: 3, label: "กองหน้า 3", en: "FW" },
] as const;

// ช่วงที่ต้องซิงก์ข้อมูลสด: กำลังแข่ง หรือยังไม่จบและเวลาเตะอยู่ภายใน ±3 ชม. (คนที่เปิดหน้าไว้ก่อนเตะจะเห็นเกมเริ่มเอง)
const SYNC_WINDOW_MS = 3 * 3600_000;
export function needsLiveSync(m: LiveInput, now: Date = new Date()) {
  if (isLive(m, now)) return true;
  if (m.status === "FINISHED" || m.clockPhase === "FULL_TIME" || !m.matchDate) return false;
  return Math.abs(m.matchDate.getTime() - now.getTime()) < SYNC_WINDOW_MS;
}
