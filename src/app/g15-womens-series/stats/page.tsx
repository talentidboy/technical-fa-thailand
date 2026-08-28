import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getStandings } from "@/lib/g15";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { MiniLeaderboard } from "@/components/g15/MiniLeaderboard";
import { PlayerLeaderboard, type PlayerLeaderboardRow } from "@/components/g15/PlayerLeaderboard";
import { Target, ShieldCheck, Trophy } from "lucide-react";

export default async function G15StatsPage() {
  const [user, teams, matches, goals] = await Promise.all([
    getCurrentUser(),
    prisma.g15Team.findMany({ orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
    prisma.g15Match.findMany(),
    prisma.g15Goal.findMany({ include: { team: true } }),
  ]);

  const standingGroups = getStandings(teams, matches);
  const finishedMatches = matches.filter((m) => m.status === "FINISHED");
  const totalGoals = finishedMatches.reduce((s, m) => s + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0);
  const avgGoals = finishedMatches.length > 0 ? totalGoals / finishedMatches.length : 0;
  const playedRows = standingGroups.flatMap((g) => g.rows).filter((r) => r.played > 0);
  const topScorers = [...playedRows].sort((a, b) => b.goalsFor - a.goalsFor).slice(0, 5);
  const bestDefense = [...playedRows]
    .sort((a, b) => a.goalsAgainst - b.goalsAgainst || b.played - a.played)
    .slice(0, 5);

  // ดาวซัลโว — รวมประตูรายคน คีย์ด้วย playerId ถ้าผูกทะเบียนไว้ ไม่งั้นคีย์ด้วยทีม+ชื่อ (กันปะปนกันข้ามทีม)
  const scorerMap = new Map<string, PlayerLeaderboardRow>();
  for (const goal of goals) {
    const key = goal.playerId != null ? `p${goal.playerId}` : `n${goal.teamId}:${goal.playerName}`;
    const existing = scorerMap.get(key);
    if (existing) {
      existing.goals += 1;
    } else {
      scorerMap.set(key, {
        key,
        playerName: goal.playerName,
        jerseyNumber: goal.jerseyNumber,
        teamName: goal.team.name,
        teamLogoUrl: goal.team.logoUrl,
        teamGroupName: goal.team.groupName,
        goals: 1,
      });
    }
  }
  const topIndividualScorers = Array.from(scorerMap.values())
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-slate-50">
      <G15Chrome user={user} />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">สถิติ</h1>
          <p className="text-sm text-slate-400">Statistics</p>
        </div>

        {finishedMatches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <p className="text-sm text-slate-500">ยังไม่มีผลการแข่งขัน จึงยังไม่มีสถิติให้แสดง</p>
            <p className="mt-0.5 text-xs text-slate-400">No results yet, so no statistics to show</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "ทีมทั้งหมด", en: "Teams", value: teams.length },
                { label: "นัดที่แข่งแล้ว", en: "Played", value: finishedMatches.length },
                { label: "ประตูรวม", en: "Goals", value: totalGoals },
                { label: "ประตูเฉลี่ย/นัด", en: "Goals/Match", value: avgGoals.toFixed(2) },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {s.label} <span className="text-slate-400">/ {s.en}</span>
                  </p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <PlayerLeaderboard title="ดาวซัลโว / Top Scorers" icon={Trophy} rows={topIndividualScorers} />
              <MiniLeaderboard
                title="ทีมทำประตูสูงสุด / Top Scoring Teams"
                icon={Target}
                rows={topScorers}
                valueOf={(r) => r.goalsFor}
              />
              <MiniLeaderboard
                title="ทีมเสียประตูน้อยที่สุด / Best Defence"
                icon={ShieldCheck}
                rows={bestDefense}
                valueOf={(r) => r.goalsAgainst}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
