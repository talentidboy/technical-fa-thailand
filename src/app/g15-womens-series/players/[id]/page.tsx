import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatMatchDateShort } from "@/lib/g15";
import { parseRegionGroup, regionEn } from "@/lib/g15-region";
import { STAGES, roundStyle, hasPenalties, type G15Stage } from "@/lib/g15-stage";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { HeroArt } from "@/components/g15/HeroArt";
import { TeamBadge } from "@/components/g15/TeamBadge";
import { Reveal } from "@/components/g15/Reveal";
import { User, Shirt, Goal, Square, ListOrdered } from "lucide-react";

// โปรไฟล์นักกีฬา — สถิติแยกตามรอบ (ลงเล่น/ตัวจริง/ประตู/ใบเหลือง-แดง) จากไลน์อัพ ผู้ทำประตู และใบรายงานผู้ตัดสิน
// ไม่แสดงวันเกิด/ส่วนสูง/น้ำหนัก/เลขบัตร — นักกีฬาเป็นเยาวชน แสดงเฉพาะข้อมูลที่หน้าทีมเปิดเผยอยู่แล้ว
export default async function G15PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const [user, player] = await Promise.all([
    getCurrentUser(),
    prisma.g15Player.findUnique({
      where: { id },
      select: {
        id: true,
        teamId: true,
        firstNameTh: true,
        lastNameTh: true,
        firstNameEn: true,
        lastNameEn: true,
        jerseyNumber: true,
        jerseyName: true,
        position: true,
        nationality: true,
        team: true,
      },
    }),
  ]);
  if (!player) notFound();

  const fullName = `${player.firstNameTh} ${player.lastNameTh}`;
  const matchInclude = { homeTeam: true, awayTeam: true } as const;

  // ใบเหลือง/แดงไม่ได้ผูก player_id (มาจากใบรายงานผู้ตัดสิน) — จับคู่ด้วยทีม + ชื่อ-นามสกุลแบบเดียวกับที่ระบบบันทึกจากทะเบียน
  const [lineups, goals, cards] = await Promise.all([
    prisma.g15Lineup.findMany({ where: { playerId: id }, include: { match: { include: matchInclude } } }),
    prisma.g15Goal.findMany({ where: { playerId: id }, include: { match: { include: matchInclude } } }),
    prisma.g15Card.findMany({
      where: { teamId: player.teamId, holderRole: "PLAYER", holderName: fullName },
      include: { match: { include: matchInclude } },
    }),
  ]);

  type MatchWithTeams = (typeof lineups)[number]["match"];
  const matchById = new Map<number, MatchWithTeams>();
  for (const x of [...lineups, ...goals, ...cards]) matchById.set(x.match.id, x.match);
  const playedMatches = Array.from(matchById.values()).sort(
    (a, b) => (b.matchDate?.getTime() ?? 0) - (a.matchDate?.getTime() ?? 0),
  );

  const statsFor = (stage: G15Stage) => {
    const inStage = <T extends { match: { stage: string } }>(rows: T[]) => rows.filter((r) => r.match.stage === stage);
    const ls = inStage(lineups);
    return {
      apps: ls.length,
      starts: ls.filter((l) => l.status === "STARTING").length,
      goals: inStage(goals).length,
      yellow: inStage(cards).filter((c) => c.cardType === "YELLOW").length,
      red: inStage(cards).filter((c) => c.cardType === "RED").length,
    };
  };
  const stageStats = STAGES.map((s) => ({ ...s, stats: statsFor(s.key) })).filter(
    (s) => s.stats.apps + s.stats.goals + s.stats.yellow + s.stats.red > 0 || (s.key === "NATIONAL" && player.team.nationalGroup),
  );

  const region = parseRegionGroup(player.team.groupName)?.region ?? null;

  return (
    <div className="min-h-screen bg-slate-50">
      <G15Chrome user={user} />

      <section className="relative isolate overflow-hidden bg-linear-to-br from-g15-950 via-g15-800 to-g15-600 pb-24 pt-8 sm:pb-28">
        <div className="absolute inset-x-0 top-0 h-1.5 animate-shimmer-slide bg-linear-to-r from-amber-600 via-amber-200 via-50% to-amber-600 bg-size-[200%_100%]" />
        <HeroArt />
        <div className="mx-auto flex max-w-4xl items-center gap-5 px-6">
          <div className="flex h-20 w-20 flex-none items-center justify-center rounded-3xl bg-white/10 text-4xl font-extrabold text-white ring-2 ring-white/25 sm:h-24 sm:w-24 sm:text-5xl">
            {player.jerseyNumber ?? <User className="h-10 w-10" />}
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-g15-200">
              <Shirt className="h-3.5 w-3.5" />
              Player Profile
            </p>
            <h1 className="mt-1 truncate text-2xl font-extrabold text-white sm:text-3xl">{fullName}</h1>
            {(player.firstNameEn || player.lastNameEn) && (
              <p className="truncate text-sm text-g15-200">{[player.firstNameEn, player.lastNameEn].filter(Boolean).join(" ")}</p>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 pb-20">
        <div className="relative z-10 -mt-14 space-y-6">
          <Reveal>
            <div className="grid grid-cols-1 gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-g15-950/10 sm:grid-cols-4">
              <Link
                href={`/g15-womens-series/teams/${player.team.id}`}
                className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 transition-colors hover:bg-g15-50 sm:col-span-2"
              >
                <TeamBadge team={player.team} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{player.team.name}</p>
                  <p className="truncate text-xs text-slate-400">
                    {region ? `${region} / ${regionEn(region)}` : "ทีม / Team"}
                  </p>
                </div>
              </Link>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[11px] text-slate-400">ตำแหน่ง / Position</p>
                <p className="text-sm font-bold text-slate-900">{player.position ?? "-"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[11px] text-slate-400">สัญชาติ / Nationality</p>
                <p className="text-sm font-bold text-slate-900">{player.nationality ?? "-"}</p>
              </div>
            </div>
          </Reveal>

          {stageStats.map((s) => (
            <Reveal key={s.key}>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-700">
                  {s.label} <span className="font-normal text-slate-400">/ {s.en}</span>
                </div>
                <div className="grid grid-cols-5 gap-px bg-slate-100">
                  {[
                    { label: "ลงเล่น", en: "Apps", value: s.stats.apps, color: "text-slate-900" },
                    { label: "ตัวจริง", en: "Starts", value: s.stats.starts, color: "text-slate-900" },
                    { label: "ประตู", en: "Goals", value: s.stats.goals, color: "text-g15-600" },
                    { label: "ใบเหลือง", en: "Yellow", value: s.stats.yellow, color: "text-amber-500" },
                    { label: "ใบแดง", en: "Red", value: s.stats.red, color: "text-red-600" },
                  ].map((t) => (
                    <div key={t.en} className="bg-white px-2 py-4 text-center">
                      <p className={`text-2xl font-extrabold ${t.color}`}>{t.value}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {t.label} <span className="hidden sm:inline">/ {t.en}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}

          <Reveal>
            <section>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
                <ListOrdered className="h-4 w-4" />
                นัดที่ลงเล่น / Matches ({playedMatches.length})
              </div>
              {playedMatches.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
                  ยังไม่มีบันทึกการลงเล่น (ไลน์อัพ/ผู้ทำประตู) ของนักกีฬาคนนี้
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {playedMatches.map((m) => {
                    const isHome = m.homeTeamId === player.teamId;
                    const opponent = isHome ? m.awayTeam : m.homeTeam;
                    const finished = m.status === "FINISHED" && m.homeScore != null && m.awayScore != null;
                    const myGoals = goals.filter((g) => g.matchId === m.id);
                    const myCards = cards.filter((c) => c.matchId === m.id);
                    const lineup = lineups.find((l) => l.matchId === m.id);
                    return (
                      <li key={m.id}>
                        <Link
                          href={`/g15-womens-series/matches/${m.id}`}
                          className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-3 transition-colors hover:bg-slate-50"
                        >
                          <span className="w-14 flex-none text-xs text-slate-400">{formatMatchDateShort(m.matchDate)}</span>
                          <span className={`flex-none rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${roundStyle(m.round).bg}`}>
                            {m.round}
                          </span>
                          <span className="flex min-w-0 items-center gap-1.5 text-sm text-slate-700">
                            พบ <TeamBadge team={opponent} size="sm" />
                            <span className="truncate font-medium">{opponent.name}</span>
                          </span>
                          {finished && (
                            <span className="rounded-lg bg-slate-900 px-2 py-0.5 text-xs font-bold tabular-nums text-white">
                              {m.homeScore}-{m.awayScore}
                              {hasPenalties(m) && ` (${m.homePenalty}-${m.awayPenalty})`}
                            </span>
                          )}
                          <span className="ml-auto flex items-center gap-2 text-xs">
                            {lineup && (
                              <span className="text-slate-400">{lineup.status === "STARTING" ? "ตัวจริง" : "สำรอง"}</span>
                            )}
                            {myGoals.length > 0 && (
                              <span className="flex items-center gap-0.5 font-bold text-g15-600">
                                <Goal className="h-3.5 w-3.5" />
                                {myGoals.length}
                              </span>
                            )}
                            {myCards.map((c) => (
                              <Square
                                key={c.id}
                                className={`h-3.5 w-3 ${c.cardType === "RED" ? "fill-red-500 text-red-500" : "fill-amber-400 text-amber-400"}`}
                              />
                            ))}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
