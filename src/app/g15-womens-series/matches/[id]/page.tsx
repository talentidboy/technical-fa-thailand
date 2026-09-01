import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatMatchDateTime, formatMatchDateShort, getStandings, getRecentForm } from "@/lib/g15";
import { regionStyle } from "@/lib/g15-region";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { TeamBadge } from "@/components/g15/TeamBadge";
import { FormPills } from "@/components/g15/StandingTable";
import { Reveal } from "@/components/g15/Reveal";
import {
  MapPin,
  Calendar,
  Target,
  LogIn,
  LogOut,
  Settings,
  ClipboardList,
  Users,
  Swords,
  ListOrdered,
  Trophy,
  Clock,
} from "lucide-react";

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

  const [user, match, allTeams, allMatches] = await Promise.all([
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
    prisma.g15Team.findMany(),
    prisma.g15Match.findMany(),
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

  // ข้อมูลก่อนแข่ง — ตำแหน่งตารางคะแนน + ฟอร์มล่าสุด ของทั้งสองทีม แสดงได้เสมอไม่ว่าจะมีใบรายงานผู้ตัดสินหรือยัง
  const standingRows = getStandings(allTeams, allMatches).flatMap((g) => g.rows);
  const homeStanding = standingRows.find((r) => r.teamId === match.homeTeamId);
  const awayStanding = standingRows.find((r) => r.teamId === match.awayTeamId);
  const homeForm = getRecentForm(match.homeTeamId, allMatches);
  const awayForm = getRecentForm(match.awayTeamId, allMatches);

  // พบกันล่าสุด — นัดอื่นๆ ระหว่างสองทีมนี้ (ไม่รวมนัดนี้เอง) ที่แข่งจบแล้ว เรียงล่าสุดก่อน
  const headToHead = allMatches
    .filter(
      (m) =>
        m.id !== match.id &&
        m.status === "FINISHED" &&
        m.homeScore != null &&
        m.awayScore != null &&
        ((m.homeTeamId === match.homeTeamId && m.awayTeamId === match.awayTeamId) ||
          (m.homeTeamId === match.awayTeamId && m.awayTeamId === match.homeTeamId)),
    )
    .sort((a, b) => (b.matchDate?.getTime() ?? 0) - (a.matchDate?.getTime() ?? 0));

  return (
    <div className="min-h-screen bg-slate-50">
      <G15Chrome user={user} />

      {/* ฮีโร่ไล่สีชุดเดียวกับหน้าแรก G15 — การ์ดสรุปนัดลอยทับขอบล่าง ให้ภาษาภาพเป็นชุดเดียวกันทั้งเว็บ */}
      <section className="relative overflow-hidden bg-linear-to-br from-rose-950 via-rose-900 to-fuchsia-800 pb-24 pt-6 sm:pb-32 sm:pt-8">
        <div className="absolute inset-x-0 top-0 h-1.5 animate-shimmer-slide bg-linear-to-r from-amber-600 via-amber-200 via-50% to-amber-600 bg-size-[200%_100%]" />
        <div className="mx-auto max-w-4xl px-6">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-rose-200">
            <Link href="/g15-womens-series" className="transition-colors hover:text-white">
              G15 Women&apos;s Football Series
            </Link>
            <span className="text-rose-400/60">›</span>
            <Link href="/g15-womens-series/matches" className="transition-colors hover:text-white">
              ตารางการแข่งขันและผลการแข่งขัน
            </Link>
            <span className="text-rose-400/60">›</span>
            <span className="font-medium text-white">
              {match.homeTeam.name} vs {match.awayTeam.name}
            </span>
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 pb-20">
        {/* การ์ดสรุปนัด — ลอยทับขอบล่างของฮีโร่ */}
        <div className="relative z-10 -mt-16 sm:-mt-20">
          <div
            className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-rose-950/20 ring-1 ${style.ring}`}
          >
            <div className={`flex flex-wrap items-center justify-between gap-2 px-6 py-3 ${style.bg}`}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white ring-1 ring-white/30">
                {isFinished ? (
                  <>
                    <Trophy className="h-3.5 w-3.5" />
                    ผลการแข่งขัน / Final Result
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5" />
                    รอแข่งขัน / Scheduled
                  </>
                )}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-white/85">{match.round}</span>
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
            </div>

            <div className="grid grid-cols-3 items-center gap-2 px-6 py-8 sm:gap-4 sm:py-10">
              <Link
                href={`/g15-womens-series/teams/${match.homeTeam.id}`}
                className="flex flex-col items-center gap-2.5 text-center transition-opacity hover:opacity-80"
              >
                <TeamBadge team={match.homeTeam} size="lg" />
                <span className="text-sm font-bold text-slate-900 sm:text-base">{match.homeTeam.name}</span>
              </Link>

              <div className="flex flex-col items-center gap-1.5">
                {isFinished ? (
                  <span className="rounded-2xl bg-slate-900 px-4 py-3 text-3xl font-extrabold tabular-nums text-white sm:px-6 sm:text-4xl">
                    {match.homeScore} - {match.awayScore}
                  </span>
                ) : (
                  <span className="rounded-2xl bg-slate-100 px-4 py-3 text-lg font-bold text-slate-400 sm:px-6 sm:text-xl">
                    VS
                  </span>
                )}
                {isFinished && (
                  <span className="mt-1 rounded bg-rose-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
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
                className="flex flex-col items-center gap-2.5 text-center transition-opacity hover:opacity-80"
              >
                <TeamBadge team={match.awayTeam} size="lg" />
                <span className="text-sm font-bold text-slate-900 sm:text-base">{match.awayTeam.name}</span>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-6 py-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                <Calendar className="h-3.5 w-3.5 flex-none text-slate-400" />
                {formatMatchDateTime(match.matchDate)}
              </span>
              {match.venue && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                  <MapPin className="h-3.5 w-3.5 flex-none text-slate-400" />
                  {match.venue}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ข้อมูลก่อนแข่ง — โชว์ได้เสมอจากตารางคะแนน/ผลย้อนหลังในระบบ ไม่ต้องรอใบรายงานผู้ตัดสิน */}
        <Reveal delay={0}>
          <section className="mt-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <ListOrdered className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-semibold text-slate-900">
                ข้อมูลก่อนแข่ง <span className="font-normal text-slate-400">/ Match Facts</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { team: match.homeTeam, standing: homeStanding, form: homeForm },
                { team: match.awayTeam, standing: awayStanding, form: awayForm },
              ].map(({ team, standing, form }) => (
                <Link
                  key={team.id}
                  href={`/g15-womens-series/teams/${team.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <TeamBadge team={team} size="md" />
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">{team.name}</span>
                  </div>
                  {standing ? (
                    <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: "P", value: standing.played },
                        { label: "W", value: standing.won },
                        { label: "GD", value: standing.goalDiff > 0 ? `+${standing.goalDiff}` : standing.goalDiff },
                        { label: "Pts", value: standing.points },
                      ].map((s) => (
                        <div key={s.label}>
                          <p className={`text-base font-bold ${s.label === "Pts" ? "text-rose-600" : "text-slate-900"}`}>{s.value}</p>
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-slate-400">ยังไม่มีสถิติในตารางคะแนน</p>
                  )}
                  {form.length > 0 && (
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="text-[11px] text-slate-400">ฟอร์มล่าสุด / Form</span>
                      <FormPills results={form} size="md" />
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {headToHead.length > 0 && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-fuchsia-50 text-fuchsia-600">
                    <Swords className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm font-medium text-slate-700">พบกันล่าสุด / Head to Head</span>
                </div>
                <ul className="divide-y divide-slate-100">
                  {headToHead.slice(0, 5).map((m) => {
                    const sameOrientation = m.homeTeamId === match.homeTeamId;
                    const leftTeam = sameOrientation ? match.homeTeam : match.awayTeam;
                    const rightTeam = sameOrientation ? match.awayTeam : match.homeTeam;
                    const leftScore = sameOrientation ? m.homeScore : m.awayScore;
                    const rightScore = sameOrientation ? m.awayScore : m.homeScore;
                    return (
                      <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
                        <span className="flex-none text-xs text-slate-400">{formatMatchDateShort(m.matchDate)}</span>
                        <div className="flex flex-1 items-center justify-end gap-2 text-right">
                          <span className="min-w-0 truncate text-sm text-slate-700">{leftTeam.name}</span>
                          <TeamBadge team={leftTeam} size="sm" />
                        </div>
                        <span className="flex-none rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold tabular-nums text-white">
                          {leftScore} - {rightScore}
                        </span>
                        <div className="flex flex-1 items-center gap-2">
                          <TeamBadge team={rightTeam} size="sm" />
                          <span className="min-w-0 truncate text-sm text-slate-700">{rightTeam.name}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>
        </Reveal>

        {hasDetails && (
          <div className="mt-8 space-y-8">
            {/* ไลน์อัพ */}
            {match.lineups.length > 0 && (
              <Reveal delay={0}>
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Users className="h-4 w-4" />
                    </span>
                    <h2 className="text-sm font-semibold text-slate-900">
                      ไลน์อัพ <span className="font-normal text-slate-400">/ Lineups</span>
                    </h2>
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
              </Reveal>
            )}

            {/* ผู้ทำประตู */}
            {match.goals.length > 0 && (
              <Reveal delay={0}>
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Target className="h-4 w-4" />
                    </span>
                    <h2 className="text-sm font-semibold text-slate-900">
                      ผู้ทำประตู <span className="font-normal text-slate-400">/ Goal Scorers</span>
                    </h2>
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
              </Reveal>
            )}

            {/* การเปลี่ยนตัวผู้เล่น */}
            {match.substitutions.length > 0 && (
              <Reveal delay={0}>
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                      <LogIn className="h-4 w-4" />
                    </span>
                    <h2 className="text-sm font-semibold text-slate-900">
                      การเปลี่ยนตัวผู้เล่น <span className="font-normal text-slate-400">/ Substitutions</span>
                    </h2>
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
              </Reveal>
            )}

            {/* ใบเหลือง/ใบแดง */}
            {match.cards.length > 0 && (
              <Reveal delay={0}>
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-amber-50">
                      <span className="h-3.5 w-2.5 flex-none rounded-sm bg-amber-400" />
                    </span>
                    <h2 className="text-sm font-semibold text-slate-900">
                      ใบเหลือง / ใบแดง <span className="font-normal text-slate-400">/ Cards</span>
                    </h2>
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
              </Reveal>
            )}

            {/* ทีมงานผู้ตัดสิน */}
            {hasOfficials && (
              <Reveal delay={0}>
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <ClipboardList className="h-4 w-4" />
                    </span>
                    <h2 className="text-sm font-semibold text-slate-900">
                      ทีมงานผู้ตัดสิน <span className="font-normal text-slate-400">/ Match Officials</span>
                    </h2>
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
              </Reveal>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
