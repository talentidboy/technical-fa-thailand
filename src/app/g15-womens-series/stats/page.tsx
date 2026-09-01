import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getStandings } from "@/lib/g15";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { MiniLeaderboard } from "@/components/g15/MiniLeaderboard";
import { PlayerLeaderboard, type PlayerLeaderboardRow } from "@/components/g15/PlayerLeaderboard";
import { TeamBadge } from "@/components/g15/TeamBadge";
import { Reveal } from "@/components/g15/Reveal";
import { AnimatedCounter } from "@/components/g15/AnimatedCounter";
import { Target, ShieldCheck, ShieldHalf, Trophy, Flame, BarChart3, Users, CheckCircle2, TrendingUp } from "lucide-react";

export default async function G15StatsPage() {
  const [user, teams, matches, goals] = await Promise.all([
    getCurrentUser(),
    prisma.g15Team.findMany({ orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
    prisma.g15Match.findMany({ include: { homeTeam: true, awayTeam: true } }),
    prisma.g15Goal.findMany({ include: { team: true } }),
  ]);

  const standingGroups = getStandings(teams, matches);
  const finishedMatches = matches.filter((m) => m.status === "FINISHED" && m.homeScore != null && m.awayScore != null);
  const totalGoals = finishedMatches.reduce((s, m) => s + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0);
  const avgGoals = finishedMatches.length > 0 ? totalGoals / finishedMatches.length : 0;
  const playedRows = standingGroups.flatMap((g) => g.rows).filter((r) => r.played > 0);
  // ไม่ตัดจำนวนตรงนี้แล้ว — ส่งเต็มลิสต์ให้คอมโพเนนต์ MiniLeaderboard เป็นคนจัดการ "ดูเพิ่มเติม" เอง
  // value คำนวณไว้ล่วงหน้าติดกับแต่ละแถว (แทนการส่งฟังก์ชัน valueOf) เพราะ MiniLeaderboard เป็น Client Component
  // ส่งฟังก์ชันข้าม server-client boundary ไม่ได้
  const topScorers = [...playedRows].sort((a, b) => b.goalsFor - a.goalsFor).map((r) => ({ ...r, value: r.goalsFor }));
  const bestDefense = [...playedRows]
    .sort((a, b) => a.goalsAgainst - b.goalsAgainst || b.played - a.played)
    .map((r) => ({ ...r, value: r.goalsAgainst }));

  // คลีนชีตมากที่สุด — จำนวนนัดที่ทีมไม่เสียประตูเลย
  const cleanSheetsByTeamId = new Map<number, number>();
  for (const m of finishedMatches) {
    if (m.awayScore === 0) cleanSheetsByTeamId.set(m.homeTeamId, (cleanSheetsByTeamId.get(m.homeTeamId) ?? 0) + 1);
    if (m.homeScore === 0) cleanSheetsByTeamId.set(m.awayTeamId, (cleanSheetsByTeamId.get(m.awayTeamId) ?? 0) + 1);
  }
  const cleanSheetRows = playedRows
    .map((r) => ({ ...r, value: cleanSheetsByTeamId.get(r.teamId) ?? 0 }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);

  // ชนะขาดลอยที่สุด — นัดที่ผลต่างประตูเยอะที่สุด
  const biggestWin = [...finishedMatches].sort(
    (a, b) => Math.abs(b.homeScore! - b.awayScore!) - Math.abs(a.homeScore! - a.awayScore!),
  )[0];
  const biggestWinMargin = biggestWin ? Math.abs(biggestWin.homeScore! - biggestWin.awayScore!) : 0;

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
  const topIndividualScorers = Array.from(scorerMap.values()).sort((a, b) => b.goals - a.goals);

  return (
    <div className="min-h-screen bg-slate-50">
      <G15Chrome user={user} />

      {/* ฮีโร่ไล่สีชุดเดียวกับหน้าอื่นๆ ของ G15 — แถบสถิติลอยทับขอบล่างให้ภาษาภาพเป็นชุดเดียวกันทั้งเว็บ */}
      <section className="relative overflow-hidden bg-linear-to-br from-rose-950 via-rose-900 to-fuchsia-800 pb-20 pt-8 sm:pb-24">
        <div className="absolute inset-x-0 top-0 h-1.5 animate-shimmer-slide bg-linear-to-r from-amber-600 via-amber-200 via-50% to-amber-600 bg-size-[200%_100%]" />
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-rose-200">
            <BarChart3 className="h-3.5 w-3.5" />
            Statistics
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
            สถิติ <span className="text-base font-normal text-rose-200">/ ภาพรวมทัวร์นาเมนต์</span>
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-20">
        {finishedMatches.length === 0 ? (
          <div className="relative z-10 -mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-xl shadow-rose-950/10 sm:-mt-14">
            <p className="text-sm text-slate-500">ยังไม่มีผลการแข่งขัน จึงยังไม่มีสถิติให้แสดง</p>
            <p className="mt-0.5 text-xs text-slate-400">No results yet, so no statistics to show</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* แถบสถิติ — ลอยทับขอบล่างของฮีโร่ */}
            <div className="relative z-10 -mt-10 sm:-mt-14">
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-slate-200 shadow-xl shadow-rose-950/10 ring-1 ring-black/5 sm:grid-cols-4">
                {[
                  { label: "ทีมทั้งหมด", en: "Teams", value: teams.length, decimals: 0, icon: Users, color: "bg-rose-50 text-rose-600" },
                  {
                    label: "นัดที่แข่งแล้ว",
                    en: "Played",
                    value: finishedMatches.length,
                    decimals: 0,
                    icon: CheckCircle2,
                    color: "bg-emerald-50 text-emerald-600",
                  },
                  { label: "ประตูรวม", en: "Goals", value: totalGoals, decimals: 0, icon: Target, color: "bg-amber-50 text-amber-600" },
                  {
                    label: "ประตูเฉลี่ย/นัด",
                    en: "Goals/Match",
                    value: avgGoals,
                    decimals: 2,
                    icon: TrendingUp,
                    color: "bg-fuchsia-50 text-fuchsia-600",
                  },
                ].map((s) => (
                  <div key={s.label} className="group bg-white px-4 py-6 text-center transition-colors duration-300 hover:bg-slate-50 sm:py-7">
                    <div className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${s.color} transition-transform duration-300 group-hover:scale-110`}>
                      <s.icon className="h-4.5 w-4.5" />
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                      <AnimatedCounter value={s.value} decimals={s.decimals} />
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {s.label} <span className="text-slate-400">/ {s.en}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Reveal delay={0}>
                <PlayerLeaderboard
                  title="ดาวซัลโว / Top Scorers"
                  icon={<Trophy className="h-4 w-4" />}
                  rows={topIndividualScorers}
                  accent="rose"
                />
              </Reveal>
              <Reveal delay={80}>
                <MiniLeaderboard
                  title="ทีมทำประตูสูงสุด / Top Scoring Teams"
                  icon={<Target className="h-4 w-4" />}
                  rows={topScorers}
                  accent="emerald"
                />
              </Reveal>
              <Reveal delay={160}>
                <MiniLeaderboard
                  title="ทีมเสียประตูน้อยที่สุด / Best Defence"
                  icon={<ShieldCheck className="h-4 w-4" />}
                  rows={bestDefense}
                  accent="indigo"
                />
              </Reveal>
              {cleanSheetRows.length > 0 && (
                <Reveal delay={0}>
                  <MiniLeaderboard
                    title="คลีนชีตมากที่สุด / Most Clean Sheets"
                    icon={<ShieldHalf className="h-4 w-4" />}
                    rows={cleanSheetRows}
                    accent="cyan"
                  />
                </Reveal>
              )}
              {biggestWin && (
                <Reveal delay={80}>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <Flame className="h-4 w-4" />
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900">ชนะขาดลอยที่สุด / Biggest Win</h3>
                    </div>
                    <div className="flex items-center justify-center gap-2.5">
                      <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
                        <TeamBadge team={biggestWin.homeTeam} size="md" />
                        <span className="max-w-24 truncate text-xs font-semibold text-slate-700">{biggestWin.homeTeam.name}</span>
                      </div>
                      <span className="flex-none rounded-lg bg-slate-900 px-3 py-1.5 text-lg font-extrabold tabular-nums text-white">
                        {biggestWin.homeScore}-{biggestWin.awayScore}
                      </span>
                      <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
                        <TeamBadge team={biggestWin.awayTeam} size="md" />
                        <span className="max-w-24 truncate text-xs font-semibold text-slate-700">{biggestWin.awayTeam.name}</span>
                      </div>
                    </div>
                    <p className="mt-3.5 text-center text-xs text-slate-400">
                      {biggestWin.round} · ต่างกัน {biggestWinMargin} ประตู
                    </p>
                  </div>
                </Reveal>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
