import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatMatchDateShort } from "@/lib/g15";
import { parseRegionGroup, regionEn } from "@/lib/g15-region";
import { STAGES, roundStyle, hasPenalties, type G15Stage } from "@/lib/g15-stage";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { StadiumBackdrop } from "@/components/g15/StadiumBackdrop";
import { TeamBadge } from "@/components/g15/TeamBadge";
import { squadLineLabel } from "@/lib/g15-squad";
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
        photoUrl: true,
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

      {/* ฮีโร่โปรไฟล์ — รูปไดคัทขนาดใหญ่ "ยืน" ชิดขอบล่างของฮีโร่ (ไม่ลอย) ช่วงอกจางเข้ากับพื้น,
          เบอร์เสื้อยักษ์แบบตัวอักษรโปร่ง + สปอตไลต์/ลำแสงด้านหลัง, ชื่อใหญ่ไล่สีด้านซ้าย */}
      <section className="relative isolate overflow-hidden bg-g15-950">
        <div className="absolute inset-x-0 top-0 z-10 h-1.5 animate-shimmer-slide bg-linear-to-r from-amber-600 via-amber-200 via-50% to-amber-600 bg-size-[200%_100%]" />
        <StadiumBackdrop />
        {/* ฝั่งซ้ายเข้มขึ้นให้ชื่ออ่านชัดบนฉากสนาม */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-r from-g15-950/85 via-g15-950/30 to-transparent" />

        <div className="relative mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-end gap-2 px-6 pt-10 sm:gap-8 sm:pt-14">
          <div className="min-w-0 self-center pb-6 sm:pb-12">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300 sm:text-xs">
              <Shirt className="h-3.5 w-3.5" />
              Player Profile
            </p>
            <h1 className="mt-3 bg-linear-to-b from-white via-white to-g15-200 bg-clip-text text-3xl font-black leading-[1.15] text-transparent drop-shadow-[0_4px_20px_rgba(0,0,0,0.35)] sm:text-6xl">
              {player.firstNameTh}
              <br />
              {player.lastNameTh}
            </h1>
            {(player.firstNameEn || player.lastNameEn) && (
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-g15-200 sm:mt-3 sm:text-base">
                {[player.firstNameEn, player.lastNameEn].filter(Boolean).join(" ")}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-6">
              <Link
                href={`/g15-womens-series/teams/${player.team.id}`}
                className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-white/20 sm:text-sm"
              >
                <span className="flex-none rounded-full bg-white p-0.5">
                  <TeamBadge team={player.team} size="sm" />
                </span>
                <span className="truncate">{player.team.name}</span>
              </Link>
              {player.jerseyNumber != null && (
                <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-amber-950 sm:text-sm">#{player.jerseyNumber}</span>
              )}
              {player.position && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-g15-100 ring-1 ring-white/20 sm:text-sm">
                  {squadLineLabel(player.position)}
                </span>
              )}
            </div>
          </div>

          <div className="relative h-60 w-44 flex-none sm:h-[26rem] sm:w-80">
            {/* ลำแสงฟุ้ง 3 เส้นจากด้านบน + สปอตไลต์หลังศีรษะ — ทุกชิ้นเบลอ ไม่มีขอบแข็ง */}
            <div aria-hidden className="absolute -top-16 left-[30%] h-[110%] w-10 -rotate-[18deg] bg-linear-to-b from-white/30 to-transparent blur-xl" />
            <div aria-hidden className="absolute -top-16 left-[52%] h-[110%] w-14 rotate-[8deg] bg-linear-to-b from-pink-300/30 to-transparent blur-xl" />
            <div aria-hidden className="absolute -top-16 left-[72%] h-[110%] w-8 rotate-[24deg] bg-linear-to-b from-cyan-200/25 to-transparent blur-xl" />
            <div aria-hidden className="absolute left-1/2 top-[18%] h-3/4 w-[110%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.35),rgba(167,139,250,0.22)_40%,transparent_70%)] blur-2xl" />
            {player.jerseyNumber != null && (
              <span
                aria-hidden
                className="absolute -right-4 top-0 select-none text-[8rem] font-black italic leading-none tracking-tighter text-transparent sm:-right-10 sm:text-[17rem]"
                style={{ WebkitTextStroke: "2px rgba(255,255,255,0.28)" }}
              >
                {player.jerseyNumber}
              </span>
            )}
            {/* แสงเรืองบนพื้นสนามใต้ตัวนักกีฬา — ให้ดูยืนอยู่บนสนามจริง */}
            <div aria-hidden className="absolute -bottom-6 left-1/2 h-16 w-[95%] -translate-x-1/2 rounded-[100%] bg-g15-300/45 blur-2xl" />
            <Reveal className="absolute inset-0">
              {player.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={player.photoUrl}
                  alt={fullName}
                  className="absolute inset-x-0 bottom-0 h-full w-full object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
                  style={{
                    maskImage: "linear-gradient(to bottom, black 82%, transparent 100%)",
                    WebkitMaskImage: "linear-gradient(to bottom, black 82%, transparent 100%)",
                  }}
                />
              ) : (
                <User className="absolute bottom-0 left-1/2 h-4/5 w-4/5 -translate-x-1/2 text-white/20" strokeWidth={1.2} />
              )}
            </Reveal>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 pb-20">
        <div className="relative z-10 mt-8 space-y-6">
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
