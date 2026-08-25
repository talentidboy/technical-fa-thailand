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

export function getStandings(
  teams: G15TeamInput[],
  matches: G15MatchInput[],
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
    const groupName = team.groupName?.trim() || UNGROUPED_LABEL;
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
