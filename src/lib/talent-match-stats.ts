import { queryAirtablePage, escapeAirtableFormulaString } from "./airtable";
import type { TalentPlayer } from "./talent-id";

const TABLE_NAME = "INDIVIDUAL STATS LEG 2 / 2026";

const FIELD = {
  nickCode: "Sport Code Nick Name",
  playerName: "Players / ผู้เล่น",
} as const;

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

function esc(v: string) {
  return escapeAirtableFormulaString(v.trim());
}

// จับคู่ผู้เล่นด้วยชื่อแบบ exact match เท่านั้น (ตาราง INDIVIDUAL STATS ไม่มี link record
// กลับไปที่ตาราง Players จริงๆ มีแค่ชื่อเป็นข้อความ) ถ้าไม่เจอ match ตรงเป๊ะ คืนค่า null
// แทนการเดา — กันข้อมูลสถิติไปติดผิดคน
export async function getPlayerMatchStats(
  player: Pick<TalentPlayer, "fullNameTh" | "nickname">,
): Promise<PlayerMatchStats | null> {
  const names = [player.fullNameTh, player.nickname].filter(
    (n): n is string => Boolean(n?.trim()),
  );
  if (names.length === 0) return null;

  const conditions = names.flatMap((name) => [
    `TRIM({${FIELD.playerName}}) = "${esc(name)}"`,
    `TRIM({${FIELD.nickCode}}) = "${esc(name)}"`,
  ]);
  const formula = conditions.length === 1 ? conditions[0] : `OR(${conditions.join(",")})`;

  const { records } = await queryAirtablePage<Record<string, unknown>>(TABLE_NAME, {
    filterByFormula: formula,
    pageSize: 1,
  });

  const record = records[0];
  if (!record) return null;

  const stats: PlayerMatchStats = {};
  for (const group of STAT_GROUPS) {
    for (const key of group.stats) {
      const v = record.fields[key];
      if (typeof v === "number") stats[key] = v;
    }
  }
  return stats;
}
