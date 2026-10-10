import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatMatchDateTime, formatMatchDateShort, getStandings, getNationalStandings, getRecentForm } from "@/lib/g15";
import {
  roundStyle,
  roundEn,
  isGroupRound,
  hasPenalties,
  stageInfo,
  withStage,
  isLive,
  needsLiveSync,
  hasLiveScore,
  type G15Stage,
} from "@/lib/g15-stage";
import { LivePill } from "@/components/g15/LivePill";
import { LiveSync } from "@/components/g15/LiveSync";
import { ResultShareCard } from "@/components/g15/ResultShareCard";
import { Countdown } from "@/components/g15/Countdown";
import { LiveClock } from "@/components/g15/LiveClock";
import { MatchTimeline } from "@/components/g15/MatchTimeline";
import { MatchLineups, MatchStatBars } from "@/components/g15/MatchLineups";
import { BallIcon } from "@/components/g15/BallIcon";
import { isClockLive } from "@/lib/g15-clock";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { HeroArt } from "@/components/g15/HeroArt";
import { TeamBadge } from "@/components/g15/TeamBadge";
import { FormPills } from "@/components/g15/StandingTable";
import { Reveal } from "@/components/g15/Reveal";
import {
  MapPin,
  Calendar,
  BarChart3,
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
          include: { player: { select: { firstNameTh: true, lastNameTh: true, jerseyNumber: true, photoUrl: true } } },
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
  const now = new Date();
  const live = isLive(match, now);
  // นาฬิกาเกมสด (แอดมินกดเริ่ม/จบครึ่งในหน้าจัดการนัด) — ส่งเป็น ISO string ให้ client component
  const clock = {
    clockPhase: match.clockPhase,
    firstHalfStartedAt: match.firstHalfStartedAt?.toISOString() ?? null,
    secondHalfStartedAt: match.secondHalfStartedAt?.toISOString() ?? null,
    firstHalfAddedTime: match.firstHalfAddedTime,
    secondHalfAddedTime: match.secondHalfAddedTime,
  };
  const clockLive = isClockLive(match.clockPhase);
  // ยังไม่ถึงเวลาเตะ → นับถอยหลังใต้สกอร์ (ถึงเวลาแล้ว Countdown จะรีเฟรชหน้าเอง ให้กลายเป็นสถานะกำลังแข่ง)
  const showCountdown = match.status === "SCHEDULED" && !!match.matchDate && match.matchDate.getTime() > now.getTime();
  const liveScore = hasLiveScore(match);

  // ผู้ทำประตูแต่ละฝั่งสำหรับภาพสรุปผล — รวมเป็น "ชื่อ 12', 45'" ต่อคน
  const scorerLines = (teamId: number) => {
    const byName = new Map<string, number[]>();
    for (const g of match.goals) {
      if (g.teamId !== teamId) continue;
      const label = g.isOwnGoal ? `${g.playerName} (OG)` : g.playerName;
      if (!byName.has(label)) byName.set(label, []);
      if (g.minute != null) byName.get(label)!.push(g.minute);
    }
    return Array.from(byName.entries()).map(([name, mins]) => `${name}${mins.length ? ` ${mins.map((m) => `${m}'`).join(", ")}` : ""}`);
  };
  const style = roundStyle(match.round);
  const stage = match.stage as G15Stage;

  // ผู้ทำประตูใต้ชื่อทีมบนสกอร์บอร์ด — รวมนาทีต่อคน เช่น "ณพิชญา แสนปาง 8', 34'"
  const scorerChips = (teamId: number) => {
    const byName = new Map<string, { minutes: number[]; og: boolean }>();
    for (const g of [...match.goals].sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999))) {
      if (g.teamId !== teamId) continue;
      const key = `${g.playerName}|${g.isOwnGoal}`;
      if (!byName.has(key)) byName.set(key, { minutes: [], og: g.isOwnGoal });
      if (g.minute != null) byName.get(key)!.minutes.push(g.minute);
    }
    return Array.from(byName.entries()).map(([key, v]) => ({
      name: key.split("|")[0],
      og: v.og,
      minutes: v.minutes.map((m) => `${m}'`).join(", "),
    }));
  };
  const statRows = [
    { label: "ประตู / Goals", side: (t: number) => match.goals.filter((g) => g.teamId === t).length },
    { label: "ใบเหลือง / Yellow cards", side: (t: number) => match.cards.filter((c) => c.teamId === t && c.cardType === "YELLOW").length },
    { label: "ใบแดง / Red cards", side: (t: number) => match.cards.filter((c) => c.teamId === t && c.cardType === "RED").length },
    { label: "เปลี่ยนตัว / Substitutions", side: (t: number) => match.substitutions.filter((x) => x.teamId === t).length },
  ]
    .map((r) => ({ label: r.label, home: r.side(match.homeTeamId), away: r.side(match.awayTeamId) }))
    // ซ่อนแถวที่ 0-0 (ไม่มีข้อมูลให้เทียบ) ยกเว้นประตูที่แสดงเสมอ
    .filter((r, i) => i === 0 || r.home + r.away > 0);
  const hasEvents = match.goals.length + match.cards.length + match.substitutions.length > 0;

  const hasOfficials = OFFICIAL_ROLES.some((r) => match[r.key]);
  const hasDetails =
    hasOfficials ||
    match.goals.length > 0 ||
    match.substitutions.length > 0 ||
    match.cards.length > 0 ||
    match.lineups.length > 0;


  // ข้อมูลก่อนแข่ง — ตำแหน่งตารางคะแนน + ฟอร์มล่าสุด ของทั้งสองทีม แสดงได้เสมอไม่ว่าจะมีใบรายงานผู้ตัดสินหรือยัง
  // นับเฉพาะรอบเดียวกับนัดนี้ — นัดรอบชิงแชมป์ประเทศใช้ตารางกลุ่ม A/B ไม่ใช่สถิติสะสมจากรอบภูมิภาค
  const stageMatches = allMatches.filter((m) => m.stage === match.stage);
  const standingRows = (
    stage === "NATIONAL" ? getNationalStandings(allTeams, stageMatches) : getStandings(allTeams, stageMatches)
  ).flatMap((g) => g.rows);
  const homeStanding = standingRows.find((r) => r.teamId === match.homeTeamId);
  const awayStanding = standingRows.find((r) => r.teamId === match.awayTeamId);
  const formMatches = stage === "NATIONAL" ? stageMatches.filter((m) => isGroupRound(m.round)) : stageMatches;
  const homeForm = getRecentForm(match.homeTeamId, formMatches);
  const awayForm = getRecentForm(match.awayTeamId, formMatches);

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
      <G15Chrome user={user} stage={stage} />
      {/* กำลังแข่ง → ดึงสกอร์/เหตุการณ์ใหม่ทุก 10 วินาที (นาฬิกาเดินเองทุกวินาทีฝั่งเบราว์เซอร์)
          ช่วง 3 ชม. รอบเวลาเตะ (ยังไม่จบ) → เช็กทุก 30 วินาที คนที่เปิดหน้าค้างไว้ก่อนเตะจะเห็นเกมเริ่มเองโดยไม่ต้องรีเฟรช */}
      <LiveSync active={needsLiveSync(match, now)} matchId={match.id} />

      {/* สกอร์บอร์ดเต็มความกว้างบนพื้นม่วงเข้ม — โลโก้ใหญ่ สกอร์ตัวโต ผู้ทำประตูใต้แต่ละทีม */}
      <section className="relative isolate overflow-hidden bg-linear-to-br from-g15-950 via-g15-900 to-g15-700 pb-8 pt-6 sm:pb-10 sm:pt-8">
        <div className="absolute inset-x-0 top-0 h-1.5 animate-shimmer-slide bg-linear-to-r from-amber-600 via-amber-200 via-50% to-amber-600 bg-size-[200%_100%]" />
        <HeroArt />
        <div aria-hidden className="absolute left-1/2 top-1/3 -z-10 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-g15-400/25 blur-3xl" />
        <div className="mx-auto max-w-5xl px-5 sm:px-6">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-g15-200">
            <Link href="/g15-womens-series" className="transition-colors hover:text-white">
              G15
            </Link>
            <span className="text-g15-400/60">›</span>
            <Link href={withStage("/g15-womens-series/matches", stage)} className="transition-colors hover:text-white">
              การแข่งขัน
            </Link>
            <span className="text-g15-400/60">›</span>
            <span>{stageInfo(stage).label}</span>
          </nav>

          {/* แถบบน: สถานะ / รอบ / ปุ่ม */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${
                  live ? "bg-red-600 text-white" : isFinished ? "bg-amber-400 text-amber-950" : "bg-white/15 text-white ring-1 ring-white/25"
                }`}
              >
                {live ? (
                  <>
                    <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                    กำลังแข่ง / Live
                  </>
                ) : isFinished ? (
                  <>
                    <Trophy className="h-3.5 w-3.5" />
                    ผลการแข่งขัน / Full time
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5" />
                    รอแข่งขัน / Upcoming
                  </>
                )}
              </span>
              <span className={`rounded-full px-3 py-1 text-[11px] font-bold text-white ${style.bg}`}>
                {match.matchNo != null && `นัดที่ ${match.matchNo} · `}
                {match.round}
                {roundEn(match.round) && <span className="font-medium opacity-80"> / {roundEn(match.round)}</span>}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* ภาพสำหรับโพสต์โซเชียล — จบแล้ว = สรุปผล, ยังไม่แข่ง = โปสเตอร์วันแข่ง */}
              {!live && (
                <ResultShareCard
                  fileName={`g15-${match.matchNo != null ? `match${match.matchNo}` : `match-${match.id}`}-${isFinished ? "result" : "matchday"}.png`}
                  data={{
                    kind: isFinished ? "result" : "matchday",
                    round: match.round,
                    roundEn: roundEn(match.round),
                    matchNo: match.matchNo,
                    dateLabel: formatMatchDateTime(match.matchDate),
                    venue: match.venue,
                    homeTeam: { name: match.homeTeam.name, logoUrl: match.homeTeam.logoUrl },
                    awayTeam: { name: match.awayTeam.name, logoUrl: match.awayTeam.logoUrl },
                    homeScore: match.homeScore,
                    awayScore: match.awayScore,
                    homePenalty: match.homePenalty,
                    awayPenalty: match.awayPenalty,
                    homeScorers: scorerLines(match.homeTeamId),
                    awayScorers: scorerLines(match.awayTeamId),
                  }}
                />
              )}
              {canManage && (
                <Link
                  href={`/g15-womens-series/manage/matches/${match.id}`}
                  className="inline-flex min-h-9 items-center gap-1 rounded-full bg-white/15 px-3 py-2 text-[11px] font-medium text-white ring-1 ring-white/25 transition-colors hover:bg-white/25"
                >
                  <Settings className="h-3 w-3" />
                  จัดการข้อมูลนัดนี้
                </Link>
              )}
            </div>
          </div>

          {/* ทีม — สกอร์ — ทีม */}
          <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3 sm:gap-8">
            <div className="flex flex-col items-center">
                <Link
                  href={`/g15-womens-series/teams/${match.homeTeam.id}`}
                  className="group flex min-w-0 flex-col items-center gap-3 text-center"
                >
                  <span className="rounded-full bg-white p-1.5 shadow-xl shadow-black/30 ring-4 ring-white/15 transition-transform group-hover:scale-105">
                    <TeamBadge team={match.homeTeam} size="lg" />
                  </span>
                  <span className="line-clamp-2 text-sm font-bold leading-snug text-white sm:text-lg">{match.homeTeam.name}</span>
                </Link>
                <ul className="mt-3 space-y-1 text-[11px] leading-snug text-g15-100 sm:text-xs text-right">
                  {scorerChips(match.homeTeamId).map((c) => (
                    <li key={c.name + c.og} className="flex items-start gap-1 justify-end">
                      <BallIcon className="mt-0.5 h-3.5 w-3.5 flex-none text-amber-300" />
                      <span>
                        {c.name}
                        {c.og && <span className="ml-1 font-bold text-red-300">(OG)</span>}
                        {c.minutes && <span className="ml-1 font-bold text-amber-300">{c.minutes}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
            </div>

            <div className="flex flex-col items-center gap-2 pt-4 sm:pt-6">
              {isFinished || liveScore ? (
                <div className="flex items-center gap-2 font-black tabular-nums text-white sm:gap-4">
                  <span className="text-6xl leading-none drop-shadow-lg sm:text-8xl">{match.homeScore}</span>
                  <span className="text-3xl text-white/40 sm:text-5xl">:</span>
                  <span className="text-6xl leading-none drop-shadow-lg sm:text-8xl">{match.awayScore}</span>
                </div>
              ) : (
                <span className="rounded-2xl bg-white/10 px-5 py-3 text-2xl font-black text-white/70 ring-1 ring-white/15 sm:text-4xl">VS</span>
              )}
              {clockLive ? (
                <LiveClock state={clock} serverNow={now.getTime()} />
              ) : live ? (
                <LivePill size="md" />
              ) : isFinished ? (
                <span className="rounded-md bg-white/15 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-widest text-white">FT</span>
              ) : null}
              {isFinished && hasPenalties(match) && (
                <span className="rounded-full bg-amber-400 px-3 py-0.5 text-[11px] font-bold text-amber-950">
                  จุดโทษ {match.homePenalty} - {match.awayPenalty}
                </span>
              )}
              {match.firstHalfHomeScore != null && match.firstHalfAwayScore != null && (
                <span className="text-[11px] font-semibold text-g15-200">
                  ครึ่งแรก / HT {match.firstHalfHomeScore}-{match.firstHalfAwayScore}
                </span>
              )}
            </div>

            <div className="flex flex-col items-center">
                <Link
                  href={`/g15-womens-series/teams/${match.awayTeam.id}`}
                  className="group flex min-w-0 flex-col items-center gap-3 text-center"
                >
                  <span className="rounded-full bg-white p-1.5 shadow-xl shadow-black/30 ring-4 ring-white/15 transition-transform group-hover:scale-105">
                    <TeamBadge team={match.awayTeam} size="lg" />
                  </span>
                  <span className="line-clamp-2 text-sm font-bold leading-snug text-white sm:text-lg">{match.awayTeam.name}</span>
                </Link>
                <ul className="mt-3 space-y-1 text-[11px] leading-snug text-g15-100 sm:text-xs text-left">
                  {scorerChips(match.awayTeamId).map((c) => (
                    <li key={c.name + c.og} className="flex items-start gap-1 ">
                      <BallIcon className="mt-0.5 h-3.5 w-3.5 flex-none text-amber-300" />
                      <span>
                        {c.name}
                        {c.og && <span className="ml-1 font-bold text-red-300">(OG)</span>}
                        {c.minutes && <span className="ml-1 font-bold text-amber-300">{c.minutes}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
            </div>
          </div>

          {showCountdown && (
            <div className="mx-auto mt-8 max-w-md rounded-2xl bg-white/10 px-4 py-5 ring-1 ring-white/15 backdrop-blur">
              <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-amber-300">เริ่มเตะใน / Kick-off in</p>
              <Countdown target={match.matchDate!.toISOString()} serverNow={now.getTime()} />
            </div>
          )}

          {/* แถบล่าง: วันเวลา / สนาม */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 border-t border-white/10 pt-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-g15-100">
              <Calendar className="h-3.5 w-3.5 flex-none text-amber-300" />
              {formatMatchDateTime(match.matchDate)}
            </span>
            {match.venue && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-g15-100">
                <MapPin className="h-3.5 w-3.5 flex-none text-amber-300" />
                {match.venue}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 pb-20 sm:px-6">
        {/* สรุปสถิติเกม */}
        {hasEvents && (
          <Reveal>
            <section className="mt-8">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-g15-50 text-g15-600">
                  <BarChart3 className="h-4 w-4" />
                </span>
                <h2 className="text-sm font-semibold text-slate-900">
                  สถิติเกม <span className="font-normal text-slate-400">/ Match Stats</span>
                </h2>
              </div>
              <MatchStatBars rows={statRows} />
            </section>
          </Reveal>
        )}

        {/* ไทม์ไลน์เหตุการณ์ (ประตู/ใบเหลือง-แดง/เปลี่ยนตัว) — อัปเดตเองระหว่างเกม */}
        {(live || match.goals.length + match.cards.length + match.substitutions.length > 0) && (
          <section className="mt-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-red-50 text-red-600">
                <Clock className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-semibold text-slate-900">
                ไทม์ไลน์ <span className="font-normal text-slate-400">/ Match Timeline</span>
              </h2>
              {clockLive && (
                <span className="ml-auto">
                  <LiveClock state={clock} serverNow={now.getTime()} />
                </span>
              )}
            </div>
            <MatchTimeline
              homeTeamId={match.homeTeamId}
              goals={match.goals}
              cards={match.cards}
              substitutions={match.substitutions}
              live={live}
              finished={isFinished}
              halfTimeScore={
                match.firstHalfHomeScore != null && match.firstHalfAwayScore != null
                  ? `${match.firstHalfHomeScore}-${match.firstHalfAwayScore}`
                  : null
              }
            />
          </section>
        )}

        {hasDetails && (
          <div className="mt-8 space-y-8">
            {/* ไลน์อัพ — รูปนักกีฬา + ไอคอนเหตุการณ์ (ประตู/แอสซิสต์/ใบเหลือง-แดง/เปลี่ยนตัว) ข้างชื่อ
                รายการผู้ทำประตู/เปลี่ยนตัว/ใบเหลือง-แดงแยกไม่ต้องมีแล้ว — อยู่ในสกอร์บอร์ด ไลน์อัพ และไทม์ไลน์ครบ */}
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
                  <MatchLineups
                    homeTeam={match.homeTeam}
                    awayTeam={match.awayTeam}
                    lineups={match.lineups}
                    goals={match.goals}
                    cards={match.cards}
                    substitutions={match.substitutions}
                  />
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
        {/* ข้อมูลก่อนแข่ง — โชว์ได้เสมอจากตารางคะแนน/ผลย้อนหลังในระบบ ไม่ต้องรอใบรายงานผู้ตัดสิน */}
        <Reveal delay={0}>
          <section className="mt-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-g15-50 text-g15-600">
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
                  className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-g15-200 hover:shadow-md"
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
                          <p className={`text-base font-bold ${s.label === "Pts" ? "text-g15-600" : "text-slate-900"}`}>{s.value}</p>
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
                        {/* พบกันล่าสุดดูข้ามรอบได้ (เคยเจอกันในรอบภูมิภาค) — จึงบอกรอบกำกับไว้ด้วย */}
                        <span className="flex-none text-xs text-slate-400">
                          {formatMatchDateShort(m.matchDate)}
                          <span className="block text-[10px] text-slate-300">{m.round}</span>
                        </span>
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

      </div>
    </div>
  );
}
