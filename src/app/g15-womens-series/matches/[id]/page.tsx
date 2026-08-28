import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatMatchDateTime } from "@/lib/g15";
import { regionStyle } from "@/lib/g15-region";
import { LOGO_URL } from "@/lib/brand";
import { TeamBadge } from "@/components/g15/TeamBadge";
import { ArrowLeft, MapPin, Calendar, Target, LogIn, LogOut, Settings, ClipboardList, Users } from "lucide-react";

const OFFICIAL_ROLES = [
  { key: "referee", label: "ผู้ตัดสิน", en: "Referee" },
  { key: "assistantReferee1", label: "ผู้ช่วยผู้ตัดสินที่ 1", en: "Assistant Referee 1" },
  { key: "assistantReferee2", label: "ผู้ช่วยผู้ตัดสินที่ 2", en: "Assistant Referee 2" },
  { key: "fourthOfficial", label: "ผู้ตัดสินที่ 4", en: "Fourth Official" },
  { key: "matchCommissioner", label: "Match Commissioner", en: "" },
  { key: "refereeAssessor", label: "ผู้ประเมินผู้ตัดสิน", en: "Referee Assessor" },
  { key: "generalCoordinator", label: "ผู้ประสานงานกลาง", en: "General Coordinator" },
] as const;

// หน้านี้เปิดให้ดูได้แบบสาธารณะไม่ต้องล็อกอิน — เหมือนหน้าทีม (teams/[id]) ต้องล็อกอินเฉพาะตอนจะจัดการข้อมูลเท่านั้น
export default async function G15MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const [user, match] = await Promise.all([
    getCurrentUser(),
    prisma.g15Match.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        goals: { orderBy: [{ minute: "asc" }, { id: "asc" }] },
        substitutions: { orderBy: [{ minute: "asc" }, { id: "asc" }] },
        cards: { orderBy: [{ minute: "asc" }, { id: "asc" }] },
        lineups: {
          include: { player: { select: { firstNameTh: true, lastNameTh: true, jerseyNumber: true } } },
          orderBy: [{ player: { jerseyNumber: { sort: "asc", nulls: "last" } } }],
        },
      },
    }),
  ]);
  if (!match) notFound();

  const canManage = user?.role === "ADMIN" || user?.role === "STAFF";
  const isFinished = match.status === "FINISHED" && match.homeScore != null && match.awayScore != null;
  const style = regionStyle(match.round);

  const hasOfficials = OFFICIAL_ROLES.some((r) => match[r.key]);
  const hasHalfScores =
    match.firstHalfHomeScore != null ||
    match.firstHalfAwayScore != null ||
    match.secondHalfHomeScore != null ||
    match.secondHalfAwayScore != null;
  const hasDetails =
    hasOfficials ||
    match.goals.length > 0 ||
    match.substitutions.length > 0 ||
    match.cards.length > 0 ||
    match.lineups.length > 0;

  const teamById = (teamId: number) => (teamId === match.homeTeamId ? match.homeTeam : match.awayTeam);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-indigo-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <Image
              src={LOGO_URL}
              alt="FA Thailand"
              width={36}
              height={36}
              className="h-9 w-9 flex-none rounded-lg object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">FA Thailand Technical</p>
              <p className="truncate text-[11px] text-indigo-300">หมวด: G15 Women&apos;s Football Series</p>
            </div>
          </Link>
          <Link
            href="/g15-womens-series/matches"
            className="inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 px-2.5 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-white/10 hover:text-white sm:px-3"
          >
            <ArrowLeft className="h-4 w-4 flex-none" />
            <span className="hidden sm:inline">ตารางการแข่งขัน / Back</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
          <Link href="/g15-womens-series" className="hover:text-slate-900">
            G15 Women&apos;s Football Series
          </Link>
          <span>›</span>
          <Link href="/g15-womens-series/matches" className="hover:text-slate-900">
            ตารางการแข่งขันและผลการแข่งขัน
          </Link>
          <span>›</span>
          <span className="font-medium text-slate-600">
            {match.homeTeam.name} vs {match.awayTeam.name}
          </span>
        </nav>

        {/* การ์ดสรุปนัด */}
        <div className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ring-1 ${style.ring}`}>
          <div className={`flex items-center justify-between gap-2 px-6 py-2.5 ${style.bg}`}>
            <span className="text-xs font-bold uppercase tracking-wide text-white">{match.round}</span>
            {canManage && (
              <Link
                href={`/g15-womens-series/manage/matches/${match.id}`}
                className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-white/25"
              >
                <Settings className="h-3 w-3" />
                จัดการข้อมูลนัดนี้
              </Link>
            )}
          </div>

          <div className="grid grid-cols-3 items-center gap-2 px-6 py-8 sm:gap-4">
            <Link
              href={`/g15-womens-series/teams/${match.homeTeam.id}`}
              className="flex flex-col items-center gap-2.5 text-center hover:opacity-80"
            >
              <TeamBadge team={match.homeTeam} size="lg" />
              <span className="text-sm font-bold text-slate-900 sm:text-base">{match.homeTeam.name}</span>
            </Link>

            <div className="flex flex-col items-center gap-1.5">
              {isFinished ? (
                <span className="text-3xl font-extrabold tabular-nums text-slate-900 sm:text-4xl">
                  {match.homeScore} - {match.awayScore}
                </span>
              ) : (
                <span className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400">VS</span>
              )}
              {isFinished && (
                <span className="rounded bg-rose-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                  Full time
                </span>
              )}
              {hasHalfScores && (
                <p className="mt-1 text-center text-[11px] text-slate-400">
                  ตามใบรายงานผู้ตัดสิน: ครึ่งแรก {match.firstHalfHomeScore ?? "-"}-{match.firstHalfAwayScore ?? "-"} ·
                  ครึ่งหลัง {match.secondHalfHomeScore ?? "-"}-{match.secondHalfAwayScore ?? "-"}
                </p>
              )}
            </div>

            <Link
              href={`/g15-womens-series/teams/${match.awayTeam.id}`}
              className="flex flex-col items-center gap-2.5 text-center hover:opacity-80"
            >
              <TeamBadge team={match.awayTeam} size="lg" />
              <span className="text-sm font-bold text-slate-900 sm:text-base">{match.awayTeam.name}</span>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 px-6 py-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 flex-none" />
              {formatMatchDateTime(match.matchDate)}
            </span>
            {match.venue && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 flex-none" />
                {match.venue}
              </span>
            )}
          </div>
        </div>

        {!hasDetails ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <ClipboardList className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">ยังไม่มีรายละเอียดใบรายงานผู้ตัดสินสำหรับนัดนี้</p>
            <p className="mt-0.5 text-xs text-slate-400">Match report details not available yet — more will be added soon.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {/* ไลน์อัพ */}
            {match.lineups.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Users className="h-4 w-4" />
                  ไลน์อัพ / Lineups
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[match.homeTeam, match.awayTeam].map((team) => {
                    const teamLineups = match.lineups.filter((l) => l.teamId === team.id);
                    const starting = teamLineups.filter((l) => l.status === "STARTING");
                    const subs = teamLineups.filter((l) => l.status === "SUBSTITUTE");
                    return (
                      <div key={team.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                          <TeamBadge team={team} size="sm" />
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">{team.name}</span>
                        </div>
                        {starting.length === 0 && subs.length === 0 ? (
                          <p className="px-4 py-4 text-xs text-slate-400">ยังไม่มีไลน์อัพของทีมนี้</p>
                        ) : (
                          <>
                            {starting.length > 0 && (
                              <div className="px-4 py-3">
                                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                  ตัวจริง
                                </p>
                                <ul className="space-y-1">
                                  {starting.map((l) => (
                                    <li key={l.id} className="flex items-center gap-2 text-sm text-slate-700">
                                      <span className="w-7 flex-none text-center text-xs font-bold text-slate-400">
                                        #{l.player.jerseyNumber ?? "-"}
                                      </span>
                                      <span className="min-w-0 flex-1 truncate">
                                        {l.player.firstNameTh} {l.player.lastNameTh}
                                      </span>
                                      {l.isCaptain && (
                                        <span className="flex-none rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">
                                          C
                                        </span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {subs.length > 0 && (
                              <div className="border-t border-slate-100 px-4 py-3">
                                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                  ตัวสำรอง
                                </p>
                                <ul className="space-y-1">
                                  {subs.map((l) => (
                                    <li key={l.id} className="flex items-center gap-2 text-sm text-slate-500">
                                      <span className="w-7 flex-none text-center text-xs font-bold text-slate-400">
                                        #{l.player.jerseyNumber ?? "-"}
                                      </span>
                                      <span className="min-w-0 flex-1 truncate">
                                        {l.player.firstNameTh} {l.player.lastNameTh}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ผู้ทำประตู */}
            {match.goals.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Target className="h-4 w-4" />
                  ผู้ทำประตู / Goal Scorers
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <ul className="divide-y divide-slate-100">
                    {match.goals.map((g) => {
                      const team = teamById(g.teamId);
                      return (
                        <li key={g.id} className="flex items-center gap-3 px-5 py-3">
                          <span className="w-10 flex-none rounded-md bg-emerald-50 px-1.5 py-1 text-center text-xs font-bold text-emerald-700">
                            {g.minute != null ? `${g.minute}'` : "-"}
                          </span>
                          <TeamBadge team={team} size="sm" />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
                            {g.playerName}
                            {g.jerseyNumber != null && <span className="ml-1.5 text-slate-400">#{g.jerseyNumber}</span>}
                          </span>
                          <span className="flex-none truncate text-xs text-slate-400">{team.name}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </section>
            )}

            {/* การเปลี่ยนตัวผู้เล่น */}
            {match.substitutions.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500">
                  <LogIn className="h-4 w-4" />
                  การเปลี่ยนตัวผู้เล่น / Substitutions
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <ul className="divide-y divide-slate-100">
                    {match.substitutions.map((s) => {
                      const team = teamById(s.teamId);
                      return (
                        <li key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                          <span className="w-10 flex-none rounded-md bg-slate-100 px-1.5 py-1 text-center text-xs font-bold text-slate-600">
                            {s.minute != null ? `${s.minute}'` : "-"}
                          </span>
                          <TeamBadge team={team} size="sm" />
                          <span className="flex items-center gap-1 text-sm text-emerald-700">
                            <LogIn className="h-3.5 w-3.5 flex-none" />
                            {s.playerInName}
                            {s.playerInNumber != null && <span className="text-emerald-500">#{s.playerInNumber}</span>}
                          </span>
                          <span className="flex items-center gap-1 text-sm text-red-600">
                            <LogOut className="h-3.5 w-3.5 flex-none" />
                            {s.playerOutName}
                            {s.playerOutNumber != null && <span className="text-red-400">#{s.playerOutNumber}</span>}
                          </span>
                          <span className="ml-auto flex-none truncate text-xs text-slate-400">{team.name}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </section>
            )}

            {/* ใบเหลือง/ใบแดง */}
            {match.cards.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500">
                  <span className="h-3.5 w-2.5 flex-none rounded-sm bg-amber-400" />
                  ใบเหลือง / ใบแดง / Cards
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <ul className="divide-y divide-slate-100">
                    {match.cards.map((c) => {
                      const team = teamById(c.teamId);
                      return (
                        <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                          <span className="w-10 flex-none rounded-md bg-slate-100 px-1.5 py-1 text-center text-xs font-bold text-slate-600">
                            {c.minute != null ? `${c.minute}'` : "-"}
                          </span>
                          <span
                            className={`h-4 w-3 flex-none rounded-sm ${c.cardType === "RED" ? "bg-red-600" : "bg-amber-400"}`}
                          />
                          <TeamBadge team={team} size="sm" />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
                            {c.holderName}
                            {c.holderNumber != null && <span className="ml-1.5 text-slate-400">#{c.holderNumber}</span>}
                            {c.holderRole === "OFFICIAL" && (
                              <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                                เจ้าหน้าที่ทีม
                              </span>
                            )}
                          </span>
                          {c.reason && <span className="flex-none text-xs text-slate-400">{c.reason}</span>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </section>
            )}

            {/* ทีมงานผู้ตัดสิน */}
            {hasOfficials && (
              <section>
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500">
                  <ClipboardList className="h-4 w-4" />
                  ทีมงานผู้ตัดสิน / Match Officials
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-3 p-5 sm:grid-cols-2">
                    {OFFICIAL_ROLES.filter((r) => match[r.key]).map((r) => (
                      <div key={r.key} className="flex items-baseline justify-between gap-3 border-b border-slate-50 pb-2">
                        <dt className="flex-none text-xs text-slate-400">
                          {r.label}
                          {r.en && <span className="ml-1 text-slate-300">/ {r.en}</span>}
                        </dt>
                        <dd className="truncate text-sm font-medium text-slate-900">{match[r.key]}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
