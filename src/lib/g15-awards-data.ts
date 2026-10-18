import { prisma } from "./prisma";
import { getNationalBracket } from "./g15";
import { BEST_XI_STAGE } from "./g15-awards";

// รางวัลที่บันทึกแล้ว + ทีมยอดเยี่ยม (Best XI)
export async function loadAwards() {
  const [awards, xi] = await Promise.all([
    prisma.g15Award.findMany({
      include: {
        player: { include: { team: true } },
        official: { include: { team: true } },
        team: true,
      },
    }),
    prisma.g15AllStar.findMany({
      where: { stage: BEST_XI_STAGE },
      include: { player: { include: { team: true } } },
    }),
  ]);
  return { awards: new Map(awards.map((a) => [a.key, a])), xi };
}

export type AwardSuggestion = { id: number; note: string | null };

const top = (counts: Map<number, number>) => {
  let best: [number, number] | null = null;
  for (const e of counts) if (!best || e[1] > best[1]) best = e;
  return best;
};

// ค่าแนะนำจากผลการแข่งขันรอบชิงแชมป์ประเทศ (แอดมินแก้ได้ก่อนบันทึก)
// ทีม: ผลนัดชิงชนะเลิศ/ชิงที่ 3 · ดาวซัลโว: ประตูมากสุด (ไม่นับ OG) · ถุงมือทองคำ: คลีนชีตมากสุด · MVP: Player of the Match มากสุด
export async function awardSuggestions() {
  const [teams, matches, goals, keeperStarts] = await Promise.all([
    prisma.g15Team.findMany(),
    prisma.g15Match.findMany({ where: { stage: "NATIONAL" } }),
    prisma.g15Goal.findMany({
      where: { match: { stage: "NATIONAL" }, isOwnGoal: false, playerId: { not: null } },
      select: { playerId: true },
    }),
    prisma.g15Lineup.findMany({
      where: {
        status: "STARTING",
        match: { stage: "NATIONAL", status: "FINISHED" },
        player: {
          OR: [
            { position: { contains: "ผู้รักษาประตู" } },
            { position: "ประตู" },
            { position: { contains: "GK", mode: "insensitive" } },
            { position: { contains: "goalkeeper", mode: "insensitive" } },
          ],
        },
      },
      select: { playerId: true, teamId: true, match: { select: { homeTeamId: true, homeScore: true, awayScore: true } } },
    }),
  ]);

  const bracket = getNationalBracket(teams, matches);
  const final = bracket.find((t) => t.key === "FINAL");
  const third = bracket.find((t) => t.key === "THIRD");
  const winnerOf = (t: typeof final) => (t?.isFinished ? (t.home.isWinner ? t.home.team : t.away.isWinner ? t.away.team : null) : null);
  const loserOf = (t: typeof final) => (t?.isFinished ? (t.home.isWinner ? t.away.team : t.away.isWinner ? t.home.team : null) : null);

  const goalsBy = new Map<number, number>();
  for (const g of goals) goalsBy.set(g.playerId!, (goalsBy.get(g.playerId!) ?? 0) + 1);
  const cleanBy = new Map<number, number>();
  for (const l of keeperStarts) {
    const conceded = l.teamId === l.match.homeTeamId ? l.match.awayScore : l.match.homeScore;
    if (conceded === 0) cleanBy.set(l.playerId, (cleanBy.get(l.playerId) ?? 0) + 1);
  }
  const potmBy = new Map<number, number>();
  for (const m of matches) if (m.playerOfMatchId) potmBy.set(m.playerOfMatchId, (potmBy.get(m.playerOfMatchId) ?? 0) + 1);

  const scorer = top(goalsBy);
  const keeper = top(cleanBy);
  const mvp = top(potmBy);
  const team: Record<string, number | null> = {
    CHAMPION: winnerOf(final)?.id ?? null,
    RUNNER_UP: loserOf(final)?.id ?? null,
    THIRD_PLACE: winnerOf(third)?.id ?? null,
  };
  const people: Record<string, AwardSuggestion | null> = {
    TOP_SCORER: scorer ? { id: scorer[0], note: `${scorer[1]} ประตู` } : null,
    GOLDEN_GLOVE: keeper ? { id: keeper[0], note: `คลีนชีต ${keeper[1]} นัด` } : null,
    MVP: mvp ? { id: mvp[0], note: `Player of the Match ${mvp[1]} นัด` } : null,
  };
  return { team, people };
}
