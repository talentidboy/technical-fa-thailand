import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getStandings, getRecentForm, formatMatchDateShort, formatMatchTimeShort } from "@/lib/g15";
import { REGION_STYLE, DEFAULT_REGION_STYLE, regionEn, groupTeamsByRegion, groupStandingsByRegion } from "@/lib/g15-region";
import { G15_HERO_BANNER_URL } from "@/lib/brand";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { TeamBadge } from "@/components/g15/TeamBadge";
import { StandingTable } from "@/components/g15/StandingTable";
import { MatchSpotlight } from "@/components/g15/MatchSpotlight";
import { PlayerLeaderboard, type PlayerLeaderboardRow } from "@/components/g15/PlayerLeaderboard";
import { Reveal } from "@/components/g15/Reveal";
import { AnimatedCounter } from "@/components/g15/AnimatedCounter";
import {
  Trophy,
  Calendar,
  MapPin,
  ChevronRight,
  Globe2,
  Award,
  Rocket,
  Users,
  CheckCircle2,
  Flame,
  ShieldHalf,
  BarChart3,
  Sparkles,
} from "lucide-react";

const highlights = [
  {
    icon: Globe2,
    title: "ทีมเข้าร่วมทั่วประเทศ",
    titleEn: "Nationwide Teams",
    description: "เชื่อมนักฟุตบอลหญิงจากภาคเหนือ ใต้ กลาง และอีสาน ไว้ในเวทีเดียวกัน",
    descriptionEn: "Bringing together young female footballers from the North, South, Central, and Northeast.",
  },
  {
    icon: Award,
    title: "มาตรฐานระดับ FIFA",
    titleEn: "FIFA Standard",
    description: "จัดการแข่งขันภายใต้การสนับสนุนและกำกับดูแลจากผู้เชี่ยวชาญของ FIFA",
    descriptionEn: "Organised with support and oversight from FIFA development experts.",
  },
  {
    icon: Rocket,
    title: "เส้นทางสู่ความเป็นเลิศ",
    titleEn: "Path to Excellence",
    description: "ปูพื้นฐานและเก็บเกี่ยวประสบการณ์แข่งขันจริง สู่เส้นทางนักฟุตบอลอาชีพ",
    descriptionEn: "Building the foundations and match experience for a future in professional football.",
  },
];

const quickLinks = [
  { href: "/g15-womens-series/matches", icon: Calendar, label: "การแข่งขันและผล", labelEn: "Matches & Results", color: "bg-rose-50 text-rose-600" },
  { href: "/g15-womens-series/standings", icon: Trophy, label: "ตารางคะแนน", labelEn: "Standings", color: "bg-amber-50 text-amber-600" },
  { href: "/g15-womens-series/stats", icon: BarChart3, label: "สถิติ", labelEn: "Statistics", color: "bg-emerald-50 text-emerald-600" },
  { href: "/g15-womens-series/teams", icon: Users, label: "ทีมที่เข้าร่วม", labelEn: "Teams", color: "bg-indigo-50 text-indigo-600" },
  { href: "/g15-womens-series/stadium", icon: MapPin, label: "สนามแข่งขัน", labelEn: "Stadium", color: "bg-fuchsia-50 text-fuchsia-600" },
];

export default async function G15WomensSeriesPage() {
  // หน้านี้เปิดให้ดูได้แบบสาธารณะไม่ต้องล็อกอิน — ต้องล็อกอินเฉพาะตอนจะ "จัดการข้อมูล" เท่านั้น
  const user = await getCurrentUser();

  const [teams, matches, goals] = await Promise.all([
    prisma.g15Team.findMany({ orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
    prisma.g15Match.findMany({
      orderBy: [{ matchDate: "asc" }, { createdAt: "asc" }],
      include: { homeTeam: true, awayTeam: true },
    }),
    prisma.g15Goal.findMany({ include: { team: true } }),
  ]);

  const standingGroups = getStandings(teams, matches);
  const { regionOrder, byRegion: teamsByRegion } = groupTeamsByRegion(teams);
  const { regionOrder: standingsRegionOrder, byRegion: standingsByRegion } = groupStandingsByRegion(standingGroups);
  const formByTeamId = new Map(teams.map((t) => [t.id, getRecentForm(t.id, matches)]));

  const finishedMatches = matches.filter((m) => m.status === "FINISHED" && m.homeScore != null && m.awayScore != null);

  // ชนะขาดลอยที่สุด + คลีนชีตมากที่สุด — สรุปย่อแบบเดียวกับหน้าสถิติ แต่เลือกแค่อันดับ 1 มาโชว์เป็นการ์ดคู่บนหน้าแรก
  const biggestWin = [...finishedMatches].sort(
    (a, b) => Math.abs(b.homeScore! - b.awayScore!) - Math.abs(a.homeScore! - a.awayScore!),
  )[0];
  const biggestWinMargin = biggestWin ? Math.abs(biggestWin.homeScore! - biggestWin.awayScore!) : 0;

  const cleanSheetsByTeamId = new Map<number, number>();
  for (const m of finishedMatches) {
    if (m.awayScore === 0) cleanSheetsByTeamId.set(m.homeTeamId, (cleanSheetsByTeamId.get(m.homeTeamId) ?? 0) + 1);
    if (m.homeScore === 0) cleanSheetsByTeamId.set(m.awayTeamId, (cleanSheetsByTeamId.get(m.awayTeamId) ?? 0) + 1);
  }
  const topCleanSheetEntry = [...cleanSheetsByTeamId.entries()].sort((a, b) => b[1] - a[1])[0];
  const topCleanSheetTeam = topCleanSheetEntry ? teams.find((t) => t.id === topCleanSheetEntry[0]) : null;

  // ดาวซัลโว (ตัวย่อ top 5) — เกณฑ์คีย์เดียวกับหน้าสถิติเต็ม
  const scorerMap = new Map<string, PlayerLeaderboardRow>();
  for (const goal of goals) {
    const key = goal.playerId != null ? `p${goal.playerId}` : `n${goal.teamId}:${goal.playerName}`;
    const existing = scorerMap.get(key);
    if (existing) existing.goals += 1;
    else
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
  const topScorersPreview = Array.from(scorerMap.values())
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 5);

  // ผลการแข่งขันล่าสุด — ทุกนัดในระบบตอนนี้แข่งจบไปแล้ว (ไม่มีนัดที่ยังไม่ถึงวันแข่ง) จึงโชว์ผลล่าสุดแทน "นัดถัดไป"
  const recentResults = [...finishedMatches]
    .sort((a, b) => (b.matchDate?.getTime() ?? 0) - (a.matchDate?.getTime() ?? 0))
    .slice(0, 5);

  // การ์ดพิเศษด้านบน — นัดถัดไปที่ใกล้ที่สุด ถ้าไม่มีนัดที่ยังไม่ถึงวันแข่งเลย ใช้ผลล่าสุดแทน
  const now = new Date();
  const nextMatch = matches
    .filter((m) => m.status !== "FINISHED" && m.matchDate && m.matchDate.getTime() > now.getTime())
    .sort((a, b) => a.matchDate!.getTime() - b.matchDate!.getTime())[0];
  const spotlightMatch = nextMatch ?? recentResults[0] ?? null;
  const spotlightIsUpcoming = !!nextMatch;

  return (
    <div className="min-h-screen bg-slate-50">
      <G15Chrome user={user} />

      {/* Hero — แบนเนอร์ทางการมีชื่อรายการ/สโลแกน/โลโก้ในภาพอยู่แล้ว จึงโชว์เต็มความกว้างไปเลยโดยไม่มีข้อความทับ */}
      <section className="relative overflow-hidden bg-linear-to-br from-rose-950 via-rose-900 to-fuchsia-800 pb-6 sm:pb-8">
        <div className="absolute inset-x-0 top-0 h-1.5 animate-shimmer-slide bg-linear-to-r from-amber-600 via-amber-200 via-50% to-amber-600 bg-size-[200%_100%]" />
        <Sparkles className="animate-float-y absolute right-6 top-10 hidden h-6 w-6 text-amber-300/70 sm:block" />
        <Sparkles className="animate-float-y absolute left-10 top-20 hidden h-4 w-4 text-white/40 sm:block" style={{ animationDelay: "1.2s" }} />
        <Image
          src={G15_HERO_BANNER_URL}
          alt="G15 Women's Football Series 2026 — Beautiful Game, Bright Future"
          width={2752}
          height={1536}
          className="h-auto w-full"
          priority
        />
        {/* ไล่สีให้ขอบล่างของภาพกลืนเข้ากับพื้นหลัง เผื่อพื้นที่ให้การ์ดด้านล่างลอยทับภาพได้เลย ไม่ต้องมีช่องว่างสีทึบคั่น */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-rose-950 to-transparent sm:h-56" />
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-20">
        {/* จุดเด่นของรายการ — ลอยทับแค่ขอบล่างสุดของภาพ (โซนที่ไล่สีจนเกือบทึบแล้ว) ไม่ทับตัวอักษรในภาพ */}
        <div className="relative z-10 -mt-8 grid grid-cols-1 gap-6 sm:-mt-10 sm:grid-cols-3">
          {highlights.map(({ icon: Icon, title, titleEn, description, descriptionEn }, i) => (
            <Reveal key={title} delay={i * 120}>
              <div className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-rose-950/10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{title}</h3>
                  <p className="text-xs font-medium text-rose-500">{titleEn}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">{description}</p>
                  <p className="mt-1 text-xs text-slate-400">{descriptionEn}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* แถบสถิติจริงในระบบ */}
        <Reveal delay={150}>
          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-slate-200 shadow-sm ring-1 ring-black/5 sm:grid-cols-4">
            {[
              { label: "ทีมเข้าร่วม", en: "Teams", value: teams.length, icon: Users, color: "bg-rose-50 text-rose-600" },
              {
                label: "ภาคทั่วประเทศ",
                en: "Regions",
                value: regionOrder.length,
                icon: MapPin,
                color: "bg-fuchsia-50 text-fuchsia-600",
              },
              {
                label: "นัดการแข่งขัน",
                en: "Matches",
                value: matches.length,
                icon: Calendar,
                color: "bg-amber-50 text-amber-600",
              },
              {
                label: "นัดที่แข่งจบแล้ว",
                en: "Finished",
                value: finishedMatches.length,
                icon: CheckCircle2,
                color: "bg-emerald-50 text-emerald-600",
              },
            ].map((s) => (
              <div key={s.label} className="group bg-white px-4 py-6 text-center transition-colors duration-300 hover:bg-slate-50 sm:py-7">
                <div className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${s.color} transition-transform duration-300 group-hover:scale-110`}>
                  <s.icon className="h-4.5 w-4.5" />
                </div>
                <p className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                  <AnimatedCounter value={s.value} />
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {s.label} <span className="text-slate-400">/ {s.en}</span>
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        {spotlightMatch && (
          <Reveal delay={200}>
            <div className="mt-8">
              <MatchSpotlight match={spotlightMatch} isUpcoming={spotlightIsUpcoming} />
            </div>
          </Reveal>
        )}

        {teams.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Trophy className="h-8 w-8 text-slate-400" />
            <p className="font-medium text-slate-600">กำหนดการและรายละเอียดการแข่งขัน</p>
            <p className="text-sm text-slate-500">
              อยู่ระหว่างการพัฒนา เร็วๆ นี้จะมีตารางแข่งขันและข้อมูลเพิ่มเติม
            </p>
            <p className="text-xs text-slate-400">Schedule and details coming soon</p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* ผลการแข่งขันล่าสุด */}
            <Reveal delay={0}>
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">ผลการแข่งขันล่าสุด</h2>
                    <p className="text-xs text-slate-400">Latest Results</p>
                  </div>
                  <Link
                    href="/g15-womens-series/matches"
                    className="flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700"
                  >
                    ดูทั้งหมด / View all
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                {recentResults.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-400">
                    ยังไม่มีผลการแข่งขัน
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentResults.map((match) => {
                      const style = REGION_STYLE[match.round] ?? DEFAULT_REGION_STYLE;
                      return (
                        <Link
                          key={match.id}
                          href={`/g15-womens-series/matches/${match.id}`}
                          className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 flex-none text-xs">
                              <p className="font-bold text-slate-900">{formatMatchDateShort(match.matchDate)}</p>
                              <p className="text-slate-400">{formatMatchTimeShort(match.matchDate)}</p>
                            </div>
                            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                              <span className="min-w-0 truncate text-sm font-semibold text-slate-800">
                                {match.homeTeam.name}
                              </span>
                              <TeamBadge team={match.homeTeam} size="sm" />
                            </div>
                            <div className="flex flex-none flex-col items-center gap-1 px-1">
                              <span className="text-base font-extrabold tabular-nums text-slate-900">
                                {match.homeScore}-{match.awayScore}
                              </span>
                              <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white">
                                Full time
                              </span>
                            </div>
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              <TeamBadge team={match.awayTeam} size="sm" />
                              <span className="min-w-0 truncate text-sm font-semibold text-slate-800">
                                {match.awayTeam.name}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2.5 flex items-center gap-1.5 border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                            <span className={`flex-none rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white ${style.bg}`}>
                              {match.round}
                            </span>
                            {match.venue && <span className="truncate">• {match.venue}</span>}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </Reveal>

            {/* ตารางคะแนน */}
            <Reveal delay={120}>
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">ตารางคะแนน</h2>
                    <p className="text-xs text-slate-400">Current Standings</p>
                  </div>
                  <Link
                    href="/g15-womens-series/standings"
                    className="flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700"
                  >
                    ดูทั้งหมด / View all
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                {standingsRegionOrder.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-400">
                    ยังไม่มีตารางคะแนน
                  </p>
                ) : (
                  (() => {
                    const previewRegion = standingsRegionOrder[0];
                    const style = REGION_STYLE[previewRegion] ?? DEFAULT_REGION_STYLE;
                    const groupMap = standingsByRegion.get(previewRegion)!;
                    const letters = Array.from(groupMap.keys()).sort();
                    return (
                      <div
                        className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ${style.ring}`}
                      >
                        <div className={`flex items-center gap-2.5 px-5 py-3 ${style.bg}`}>
                          <MapPin className="h-4 w-4 text-white" />
                          <h3 className="font-bold text-white">
                            {previewRegion} <span className="font-normal text-white/70">/ {regionEn(previewRegion)}</span>
                          </h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {letters.map((letter) => (
                            <div key={letter}>
                              {letters.length > 1 && (
                                <p className={`px-5 pt-3 text-xs font-bold ${style.text}`}>กลุ่ม {letter}</p>
                              )}
                              <StandingTable group={groupMap.get(letter)!} formByTeamId={formByTeamId} />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </Reveal>
          </div>
        )}

        {/* ดาวซัลโว — โชว์ที่หน้าแรกเลย เพราะเป็นข้อมูลที่คนสนใจดูเร็วๆ (การ์ดมีหัวข้อในตัวเองอยู่แล้ว จึงมีแค่ลิงก์ "ดูทั้งหมด" กำกับด้านบนพอ) */}
        {topScorersPreview.length > 0 && (
          <Reveal delay={0}>
            <div className="mt-8">
              <div className="mb-4 flex justify-end">
                <Link
                  href="/g15-womens-series/stats"
                  className="flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700"
                >
                  ดูทั้งหมด / View all
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <PlayerLeaderboard title="ดาวซัลโว / Top Scorers" icon={<Trophy className="h-4 w-4" />} rows={topScorersPreview} />
            </div>
          </Reveal>
        )}

        {/* ชนะขาดลอยที่สุด + คลีนชีตมากที่สุด */}
        {(biggestWin || topCleanSheetTeam) && (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {biggestWin && (
              <Reveal delay={0}>
                <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Flame className="h-4 w-4 text-rose-600" />
                    ชนะขาดลอยที่สุด / Biggest Win
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
            {topCleanSheetTeam && topCleanSheetEntry && (
              <Reveal delay={100}>
                <div className="flex h-full flex-col justify-center rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <ShieldHalf className="h-4 w-4 text-emerald-600" />
                    คลีนชีตมากที่สุด / Most Clean Sheets
                  </div>
                  <Link href={`/g15-womens-series/teams/${topCleanSheetTeam.id}`} className="flex items-center gap-3 hover:opacity-80">
                    <TeamBadge team={topCleanSheetTeam} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{topCleanSheetTeam.name}</p>
                      <p className="text-xs text-slate-400">ไม่เสียประตูเลย / clean sheets</p>
                    </div>
                    <p className="flex-none text-3xl font-extrabold text-emerald-600">{topCleanSheetEntry[1]}</p>
                  </Link>
                </div>
              </Reveal>
            )}
          </div>
        )}

        {/* 4 ภาคทั่วประเทศ */}
        {regionOrder.length > 0 && (
          <div className="mt-10">
            <Reveal>
              <h2 className="mb-4 text-lg font-bold text-slate-900">
                4 ภาคทั่วประเทศ <span className="text-sm font-normal text-slate-400">/ Regions</span>
              </h2>
            </Reveal>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {regionOrder.map((region, i) => {
                const style = REGION_STYLE[region] ?? DEFAULT_REGION_STYLE;
                const groupMap = teamsByRegion.get(region)!;
                const count = Array.from(groupMap.values()).reduce((s, arr) => s + arr.length, 0);
                return (
                  <Reveal key={region} delay={i * 90}>
                    <Link
                      href="/g15-womens-series/teams"
                      className={`block rounded-2xl p-5 text-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${style.bg}`}
                    >
                      <MapPin className="h-5 w-5 text-white/80" />
                      <p className="mt-3 text-base font-bold">{region}</p>
                      <p className="text-xs text-white/70">{regionEn(region)}</p>
                      <p className="mt-3 text-2xl font-extrabold">
                        {count} <span className="text-xs font-normal text-white/80">ทีม</span>
                      </p>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        )}

        {/* ลิงก์ด่วนไปทุกหมวด */}
        <div className="mt-10">
          <Reveal>
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              สำรวจ G15 <span className="text-sm font-normal text-slate-400">/ Explore</span>
            </h2>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {quickLinks.map(({ href, icon: Icon, label, labelEn, color }, i) => (
              <Reveal key={href} delay={i * 70}>
                <Link
                  href={href}
                  className="group flex h-full flex-col items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-rose-200 hover:shadow-lg"
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color} transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{label}</p>
                    <p className="text-[11px] text-slate-400">{labelEn}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
