import {
  groupRound,
  isGroupRound,
  matchWinnerId,
  matchLoserId,
  ROUND_SEMI,
  ROUND_THIRD,
  ROUND_FINAL,
  MATCH_NO_SEMI_1,
  MATCH_NO_SEMI_2,
  MATCH_NO_THIRD,
  MATCH_NO_FINAL,
} from "@/lib/g15-stage";

// เซิร์ฟเวอร์ (Vercel) รันเวลา UTC แต่การแข่งขันทั้งหมดใช้เวลาไทย — ต้องระบุโซนเวลาให้ชัดเจนเสมอ
// ไทยไม่มี daylight saving จึง offset +07:00 คงที่ ใช้แปลงตรงได้โดยไม่ต้องพึ่ง timezone database
const BANGKOK_TZ = "Asia/Bangkok";

// ใช้ locale "en-GB" (ไม่ใช่ th-TH) เพื่อให้ปีเป็น ค.ศ. (Gregorian) ไม่ใช่ พ.ศ. — th-TH จะแปลงปีเป็นพุทธศักราชอัตโนมัติ
// ซึ่งทำให้ผู้ใช้ต่างชาติสับสน (เช่น 2569 แทนที่จะเป็น 2026) จึงใช้รูปแบบสากล "16 Aug 2026, 13:00" แทน
export function formatMatchDateTime(date: Date | null) {
  if (!date) return "TBD";
  return date.toLocaleString("en-GB", {
    timeZone: BANGKOK_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// วันที่/เวลาแบบสั้น แยกกัน — ใช้ในรายการผลแข่งแบบแถวเดียว (วันที่ซ้าย เวลาอยู่บรรทัดล่าง)
export function formatMatchDateShort(date: Date | null) {
  if (!date) return "TBD";
  return date.toLocaleDateString("en-GB", { timeZone: BANGKOK_TZ, day: "numeric", month: "short" });
}

export function formatMatchTimeShort(date: Date | null) {
  if (!date) return "";
  return date.toLocaleTimeString("en-GB", {
    timeZone: BANGKOK_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// แปลง Date -> ค่าเริ่มต้นของ <input type="datetime-local"> โดยยึดเวลาไทยเสมอ ไม่ใช่ timezone ของเซิร์ฟเวอร์
export function toDateTimeLocalValue(date: Date | null) {
  if (!date) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BANGKOK_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

// แปลงค่าจาก <input type="datetime-local"> (ตีความเป็นเวลาไทยเสมอ) กลับเป็น Date ที่ถูกต้อง
// ไม่ใช้ new Date(rawString) ตรงๆ เพราะจะถูกตีความตาม timezone ของ runtime (UTC บน Vercel) ทำให้เวลาคลาดเคลื่อน 7 ชั่วโมง
export function parseBangkokDateTimeLocal(value: string): Date | null {
  if (!value) return null;
  return new Date(`${value}:00+07:00`);
}

export type G15TeamInput = {
  id: number;
  name: string;
  logoUrl: string | null;
  groupName: string | null;
};

export type G15MatchInput = {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
};

export type StandingRow = {
  teamId: number;
  teamName: string;
  logoUrl: string | null;
  groupName: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

export type StandingGroup = {
  groupName: string;
  rows: StandingRow[];
};

const UNGROUPED_LABEL = "อื่นๆ";

// groupOf — กำหนดว่าทีมอยู่ตารางไหน (ค่าเริ่มต้น = groupName รอบภูมิภาค) รอบชิงแชมป์ประเทศส่ง "กลุ่ม A/B" แทน
// ส่วน row.groupName ยังเป็นกลุ่มรอบภูมิภาคเสมอ เพราะ TeamBadge ใช้ค่านี้ระบายสีประจำภาค
// ผู้เรียกต้องกรอง matches ให้เหลือเฉพาะ stage/รอบที่ต้องการเอง (เช่น ไม่ส่งนัดน็อกเอาต์มานับในตารางกลุ่ม)
export function getStandings(
  teams: G15TeamInput[],
  matches: G15MatchInput[],
  groupOf: (team: G15TeamInput) => string | null = (t) => t.groupName,
): StandingGroup[] {
  const rowByTeamId = new Map<number, StandingRow>();
  for (const team of teams) {
    rowByTeamId.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      logoUrl: team.logoUrl,
      groupName: team.groupName,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
    });
  }

  for (const match of matches) {
    if (match.status !== "FINISHED") continue;
    if (match.homeScore == null || match.awayScore == null) continue;

    const home = rowByTeamId.get(match.homeTeamId);
    const away = rowByTeamId.get(match.awayTeamId);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (match.homeScore < match.awayScore) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  for (const row of rowByTeamId.values()) {
    row.goalDiff = row.goalsFor - row.goalsAgainst;
  }

  const groupsByName = new Map<string, StandingRow[]>();
  for (const team of teams) {
    const groupName = groupOf(team)?.trim() || UNGROUPED_LABEL;
    const row = rowByTeamId.get(team.id);
    if (!row) continue;
    if (!groupsByName.has(groupName)) groupsByName.set(groupName, []);
    groupsByName.get(groupName)!.push(row);
  }

  const sortRows = (rows: StandingRow[]) =>
    [...rows].sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDiff - a.goalDiff ||
        b.goalsFor - a.goalsFor ||
        a.teamName.localeCompare(b.teamName, "th"),
    );

  return Array.from(groupsByName.entries())
    .sort(([a], [b]) => {
      if (a === UNGROUPED_LABEL) return 1;
      if (b === UNGROUPED_LABEL) return -1;
      return a.localeCompare(b, "th");
    })
    .map(([groupName, rows]) => ({ groupName, rows: sortRows(rows) }));
}

export type FormMatchInput = {
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  matchDate: Date | null;
};

// ฟอร์มการแข่งขัน 5 นัดล่าสุดของทีม (W/D/L เรียงเก่า→ใหม่ อ่านซ้ายไปขวา) — ดึงมาจากหน้าโปรไฟล์ทีมเดิม
// เพื่อใช้ร่วมกันกับตารางคะแนน แทนที่จะเขียน logic เดิมซ้ำอีกที่
export function getRecentForm(teamId: number, matches: FormMatchInput[], limit = 5): ("W" | "D" | "L")[] {
  return matches
    .filter(
      (m) =>
        (m.homeTeamId === teamId || m.awayTeamId === teamId) &&
        m.status === "FINISHED" &&
        m.homeScore != null &&
        m.awayScore != null,
    )
    .sort((a, b) => (b.matchDate?.getTime() ?? 0) - (a.matchDate?.getTime() ?? 0))
    .slice(0, limit)
    .reverse()
    .map((m) => {
      const isHome = m.homeTeamId === teamId;
      const gf = isHome ? m.homeScore! : m.awayScore!;
      const ga = isHome ? m.awayScore! : m.homeScore!;
      return gf > ga ? "W" : gf < ga ? "L" : "D";
    });
}

// ===== รอบชิงแชมป์ประเทศ (National Round) =====

export type NationalTeamInput = G15TeamInput & { nationalGroup: string | null; nationalSeed: number | null };

export type NationalMatchInput = G15MatchInput & {
  stage: string;
  round: string;
  matchNo: number | null;
  homePenalty: number | null;
  awayPenalty: number | null;
};

function nationalGroupMatches<M extends NationalMatchInput>(matches: M[]) {
  return matches.filter((m) => m.stage === "NATIONAL" && isGroupRound(m.round));
}

// ตารางคะแนนกลุ่ม A/B — นับเฉพาะนัดรอบแบ่งกลุ่มของรอบชิงแชมป์ประเทศเท่านั้น (ผลรอบภูมิภาค/น็อกเอาต์ไม่เกี่ยว)
export function getNationalStandings(teams: NationalTeamInput[], matches: NationalMatchInput[]): StandingGroup[] {
  return getStandings(
    teams.filter((t) => t.nationalGroup),
    nationalGroupMatches(matches),
    (t) => groupRound((t as NationalTeamInput).nationalGroup!),
  );
}

// กลุ่มที่แข่งครบทุกนัดแล้ว — ถึงจะรู้ทีมที่ 1/2 แน่นอน (ก่อนหน้านั้นสายน็อกเอาต์แสดงเป็นป้าย "ที่ 1 กลุ่ม A" ไปก่อน)
export function isGroupComplete(group: string, matches: NationalMatchInput[]) {
  const round = groupRound(group);
  const groupMatches = nationalGroupMatches(matches).filter((m) => m.round === round);
  return groupMatches.length > 0 && groupMatches.every((m) => m.status === "FINISHED" && m.homeScore != null && m.awayScore != null);
}

export type BracketTeam = { id: number; name: string; logoUrl: string | null; groupName: string | null };

export type BracketSide = {
  placeholder: string;
  placeholderEn: string;
  team: BracketTeam | null;
  score: number | null;
  penalty: number | null;
  isWinner: boolean;
};

export type BracketTie = {
  key: "SF1" | "SF2" | "THIRD" | "FINAL";
  matchNo: number;
  round: string;
  matchId: number | null;
  matchDate: Date | null;
  venue: string | null;
  isFinished: boolean;
  home: BracketSide;
  away: BracketSide;
};

type BracketMatch = NationalMatchInput & { id: number; matchDate: Date | null; venue: string | null };

// สายน็อกเอาต์ตามผังทางการ: นัด 13 = ที่ 1 กลุ่ม A พบ ที่ 2 กลุ่ม B, นัด 14 = ที่ 1 กลุ่ม B พบ ที่ 2 กลุ่ม A
// ชิงที่ 3 = ผู้แพ้นัด 13 พบ ผู้แพ้นัด 14, ชิงชนะเลิศ = ผู้ชนะนัด 13 พบ ผู้ชนะนัด 14
// ถ้ามีนัดจริงในระบบแล้ว (matchNo ตรง) ใช้ทีมจากนัดนั้นเลย ไม่งั้นคำนวณจากตารางคะแนน/ผลรอบก่อนหน้า (เฉพาะเมื่อรู้ผลแน่นอนแล้ว)
export function getNationalBracket(
  teams: (BracketTeam & { nationalGroup: string | null; nationalSeed: number | null })[],
  matches: BracketMatch[],
): BracketTie[] {
  const national = matches.filter((m) => m.stage === "NATIONAL");
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const standings = getNationalStandings(teams, national);
  const rowsByGroup = new Map(standings.map((g) => [g.groupName, g.rows]));
  const byNo = new Map(national.filter((m) => m.matchNo != null).map((m) => [m.matchNo!, m]));

  const groupPos = (group: string, pos: number) => {
    if (!isGroupComplete(group, national)) return null;
    const row = rowsByGroup.get(groupRound(group))?.[pos - 1];
    return row ? (teamById.get(row.teamId) ?? null) : null;
  };
  const resultOf = (matchNo: number, want: "winner" | "loser") => {
    const m = byNo.get(matchNo);
    if (!m) return null;
    const id = want === "winner" ? matchWinnerId(m) : matchLoserId(m);
    return id != null ? (teamById.get(id) ?? null) : null;
  };

  const build = (
    key: BracketTie["key"],
    matchNo: number,
    round: string,
    home: [string, string, BracketTeam | null],
    away: [string, string, BracketTeam | null],
  ): BracketTie => {
    const m = byNo.get(matchNo) ?? null;
    const winnerId = m ? matchWinnerId(m) : null;
    const isFinished = !!m && m.status === "FINISHED" && m.homeScore != null && m.awayScore != null;
    const side = ([placeholder, placeholderEn, fallback]: [string, string, BracketTeam | null], isHome: boolean): BracketSide => {
      const team = m ? (teamById.get(isHome ? m.homeTeamId : m.awayTeamId) ?? null) : fallback;
      return {
        placeholder,
        placeholderEn,
        team,
        score: m ? (isHome ? m.homeScore : m.awayScore) : null,
        penalty: m ? (isHome ? m.homePenalty : m.awayPenalty) : null,
        isWinner: winnerId != null && team?.id === winnerId,
      };
    };
    return {
      key,
      matchNo,
      round,
      matchId: m?.id ?? null,
      matchDate: m?.matchDate ?? null,
      venue: m?.venue ?? null,
      isFinished,
      home: side(home, true),
      away: side(away, false),
    };
  };

  return [
    build("SF1", MATCH_NO_SEMI_1, ROUND_SEMI, ["ที่ 1 กลุ่ม A", "Winner Group A", groupPos("A", 1)], ["ที่ 2 กลุ่ม B", "Runner-up Group B", groupPos("B", 2)]),
    build("SF2", MATCH_NO_SEMI_2, ROUND_SEMI, ["ที่ 1 กลุ่ม B", "Winner Group B", groupPos("B", 1)], ["ที่ 2 กลุ่ม A", "Runner-up Group A", groupPos("A", 2)]),
    build("THIRD", MATCH_NO_THIRD, ROUND_THIRD, ["ผู้แพ้นัดที่ 13", "Loser Match 13", resultOf(MATCH_NO_SEMI_1, "loser")], ["ผู้แพ้นัดที่ 14", "Loser Match 14", resultOf(MATCH_NO_SEMI_2, "loser")]),
    build("FINAL", MATCH_NO_FINAL, ROUND_FINAL, ["ผู้ชนะนัดที่ 13", "Winner Match 13", resultOf(MATCH_NO_SEMI_1, "winner")], ["ผู้ชนะนัดที่ 14", "Winner Match 14", resultOf(MATCH_NO_SEMI_2, "winner")]),
  ];
}
