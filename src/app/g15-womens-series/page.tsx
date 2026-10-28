import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  getStandings,
  getRecentForm,
  getNationalStandings,
  getNationalBracket,
} from "@/lib/g15";
import { REGION_STYLE, DEFAULT_REGION_STYLE, regionEn, groupTeamsByRegion, groupStandingsByRegion } from "@/lib/g15-region";
import {
  parseStage,
  stageInfo,
  withStage,
  isGroupRound,
  isLive,
  needsLiveSync,
  matchdayMap,
  hasLiveScore,
  projectLive,
} from "@/lib/g15-stage";
import { G15_HERO_BANNER_URL } from "@/lib/brand";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { HeroArt } from "@/components/g15/HeroArt";
import { TeamBadge } from "@/components/g15/TeamBadge";
import { StandingTable } from "@/components/g15/StandingTable";
import { StageSwitcher } from "@/components/g15/StageSwitcher";
import { NationalGroupTables } from "@/components/g15/NationalGroupTables";
import { KnockoutBracket } from "@/components/g15/KnockoutBracket";
import { TeamOfRoundPitch } from "@/components/g15/TeamOfRoundPitch";
import { ChampionPodium } from "@/components/g15/ChampionPodium";
import { LiveSync } from "@/components/g15/LiveSync";
import { MatchSpotlight } from "@/components/g15/MatchSpotlight";
import { type PlayerLeaderboardRow } from "@/components/g15/PlayerLeaderboard";
import { MatchCard } from "@/components/g15/MatchCard";
import { StatLeaderCard, type StatLeaderRow } from "@/components/g15/StatLeaderCard";
import { Bebas_Neue } from "next/font/google";
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
  ShieldHalf,
  BarChart3,
  Sparkles,
  Images,
} from "lucide-react";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "G15 Women's Football Series 2026", description: "การแข่งขันฟุตบอลหญิงรุ่นอายุไม่เกิน 15 ปี — โปรแกรม ผลการแข่งขันสด ตารางคะแนน สถิติ และทีมที่เข้าร่วม", path: "/g15-womens-series" });

// ตัวอักษรแคบสูงสำหรับหัวข้อ/ตัวเลข (ชุดเดียวกับหน้าสถิติ/ตารางคะแนน)
const display = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap" });

// หัวข้อแต่ละส่วนของหน้าแรก — ภาษาอังกฤษตัวใหญ่ + ภาษาไทย + ลิงก์ "ดูทั้งหมด"
function SectionHead({ en, th, href }: { en: string; th: string; href?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <h2 className="flex min-w-0 flex-wrap items-baseline gap-x-2">
        <span className={`${display.className} text-4xl uppercase leading-none text-g15-950`}>{en}</span>
        <span className="text-sm font-semibold text-slate-400">/ {th}</span>
      </h2>
      {href && (
        <Link href={href} className="-my-2 flex flex-none items-center gap-1 py-2 text-xs font-semibold text-g15-600 hover:text-g15-700">
          ดูทั้งหมด / View all
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

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
  { href: "/g15-womens-series/matches", icon: Calendar, label: "การแข่งขันและผล", labelEn: "Matches & Results", color: "bg-g15-50 text-g15-600" },
  { href: "/g15-womens-series/standings", icon: Trophy, label: "ตารางคะแนน", labelEn: "Standings", color: "bg-amber-50 text-amber-600" },
  { href: "/g15-womens-series/stats", icon: BarChart3, label: "สถิติ", labelEn: "Statistics", color: "bg-emerald-50 text-emerald-600" },
  { href: "/g15-womens-series/teams", icon: Users, label: "ทีมที่เข้าร่วม", labelEn: "Teams", color: "bg-indigo-50 text-indigo-600" },
  { href: "/g15-womens-series/stadium", icon: MapPin, label: "สนามแข่งขัน", labelEn: "Stadium", color: "bg-fuchsia-50 text-fuchsia-600" },
  { href: "/g15-womens-series/gallery", icon: Images, label: "แกลเลอรี", labelEn: "Gallery", color: "bg-sky-50 text-sky-600" },
];

export default async function G15WomensSeriesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const stage = parseStage((await searchParams).stage);
  const isNational = stage === "NATIONAL";
  const href = (path: string) => withStage(path, stage);

  // หน้านี้เปิดให้ดูได้แบบสาธารณะไม่ต้องล็อกอิน — ต้องล็อกอินเฉพาะตอนจะ "จัดการข้อมูล" เท่านั้น
  const user = await getCurrentUser();

  // สถิติทุกตัวในหน้านี้นับเฉพาะรอบที่เลือก — รอบชิงแชมป์ประเทศเริ่มจากศูนย์ ไม่รวมผลรอบภูมิภาค
  const [allTeams, matches, goals, allStars] = await Promise.all([
    prisma.g15Team.findMany({ orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
    prisma.g15Match.findMany({
      where: { stage },
      orderBy: [{ matchDate: "asc" }, { createdAt: "asc" }],
      include: { homeTeam: true, awayTeam: true, goals: true },
    }),
    // ไม่นับประตูตัวเอง (OG) เป็นประตูของคนยิง
    prisma.g15Goal.findMany({
      where: { match: { stage }, isOwnGoal: false },
      include: { team: true, player: { select: { firstNameEn: true, lastNameEn: true, photoUrl: true } } },
    }),
    prisma.g15AllStar.findMany({
      where: { stage },
      include: { player: { select: { id: true, firstNameTh: true, lastNameTh: true, jerseyNumber: true, photoUrl: true, team: true } } },
    }),
  ]);
  const teams = isNational ? allTeams.filter((t) => t.nationalGroup) : allTeams;

  const standingGroups = getStandings(teams, matches);
  // มีนัดรอบแบ่งกลุ่มกำลังแข่ง (กรอกสกอร์สดแล้ว) → ตารางคะแนนสด นับนัดนั้นเหมือนจบตามสกอร์ปัจจุบัน
  const liveGroupTable = isNational && matches.some((m) => isGroupRound(m.round) && hasLiveScore(m));
  const nationalGroups = isNational ? getNationalStandings(teams, liveGroupTable ? projectLive(matches) : matches) : [];
  const bracket = isNational ? getNationalBracket(teams, matches) : [];
  const { regionOrder, byRegion: teamsByRegion } = groupTeamsByRegion(teams);
  const { regionOrder: standingsRegionOrder, byRegion: standingsByRegion } = groupStandingsByRegion(standingGroups);
  const formMatches = isNational ? matches.filter((m) => isGroupRound(m.round)) : matches;
  const formByTeamId = new Map(teams.map((t) => [t.id, getRecentForm(t.id, formMatches)]));

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
  // การ์ดดาวซัลโวแบบเดียวกับหน้าสถิติ (รูปนักกีฬา + ชื่ออังกฤษ)
  const scorerRowMap = new Map<string, StatLeaderRow>();
  for (const g of goals) {
    if (g.playerId == null && g.playerName === "ไม่ระบุผู้ทำประตู") continue;
    const key = g.playerId != null ? `p${g.playerId}` : `n${g.teamId}:${g.playerName}`;
    const row = scorerRowMap.get(key);
    if (row) row.value += 1;
    else
      scorerRowMap.set(key, {
        key,
        playerId: g.playerId,
        nameTh: g.playerName,
        nameEn: g.player ? [g.player.firstNameEn, g.player.lastNameEn].filter(Boolean).join(" ") || null : null,
        photoUrl: g.player?.photoUrl ?? null,
        team: { name: g.team.name, logoUrl: g.team.logoUrl, groupName: g.team.groupName },
        value: 1,
      });
  }
  const topScorerRows = [...scorerRowMap.values()].sort((a, b) => b.value - a.value || a.nameTh.localeCompare(b.nameTh, "th"));

  // ผลการแข่งขันล่าสุด — ทุกนัดในระบบตอนนี้แข่งจบไปแล้ว (ไม่มีนัดที่ยังไม่ถึงวันแข่ง) จึงโชว์ผลล่าสุดแทน "นัดถัดไป"
  const recentResults = [...finishedMatches]
    .sort((a, b) => (b.matchDate?.getTime() ?? 0) - (a.matchDate?.getTime() ?? 0))
    .slice(0, 3);

  // การ์ดพิเศษด้านบน — กำลังแข่ง > นัดถัดไป (นับถอยหลัง) > ผลล่าสุด
  const now = new Date();
  const liveMatches = matches.filter((m) => isLive(m, now));
  const nextMatch = matches
    .filter((m) => m.status === "SCHEDULED" && m.matchDate && m.matchDate.getTime() > now.getTime())
    .sort((a, b) => a.matchDate!.getTime() - b.matchDate!.getTime())[0];
  const matchdays = matchdayMap(matches);
  const spotlightMatches = liveMatches.length > 0 ? liveMatches : [nextMatch ?? recentResults[0]].filter((m) => m != null);
  const spotlightMode = liveMatches.length > 0 ? "live" : nextMatch ? "upcoming" : "result";

  // จบนัดชิงชนะเลิศแล้ว → ประกาศแชมป์บนสุดของหน้า
  const finalTie = bracket.find((t) => t.key === "FINAL");
  const thirdTie = bracket.find((t) => t.key === "THIRD");
  const champion = finalTie?.home.isWinner ? finalTie.home.team : finalTie?.away.isWinner ? finalTie.away.team : null;
  const runnerUp = champion ? (finalTie!.home.isWinner ? finalTie!.away.team : finalTie!.home.team) : null;
  const thirdPlace = thirdTie?.home.isWinner ? thirdTie.home.team : thirdTie?.away.isWinner ? thirdTie.away.team : null;

  // ยังไม่มีผลเลย (เช่น วันแรกของรอบชิงแชมป์ประเทศ) — โชว์โปรแกรมนัดถัดไปแทนกล่องว่าง
  const upcomingMatches = matches
    .filter((m) => m.status !== "FINISHED")
    .sort((a, b) => (a.matchDate?.getTime() ?? Infinity) - (b.matchDate?.getTime() ?? Infinity))
    .slice(0, 3);
  const showUpcomingList = recentResults.length === 0 && upcomingMatches.length > 0;
  const listMatches = showUpcomingList ? upcomingMatches : recentResults;

  return (
    <div className="min-h-screen bg-slate-50">
      <G15Chrome user={user} stage={stage} />
      <LiveSync active={matches.some((m) => needsLiveSync(m, now))} stage={stage} />

      {/* Hero — แบนเนอร์ทางการมีชื่อรายการ/สโลแกน/โลโก้ในภาพอยู่แล้ว จึงโชว์เต็มความกว้างไปเลยโดยไม่มีข้อความทับ */}
      <section className="relative isolate overflow-hidden bg-linear-to-br from-g15-950 via-g15-800 to-g15-600 pb-6 sm:pb-8">
        <h1 className="sr-only">G15 Women&apos;s Football Series 2026 — Beautiful Game, Bright Future</h1>
        <div className="absolute inset-x-0 top-0 h-1.5 animate-shimmer-slide bg-linear-to-r from-amber-600 via-amber-200 via-50% to-amber-600 bg-size-[200%_100%]" />
        <HeroArt />
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
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-g15-950 to-transparent sm:h-56" />
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-20">
        {/* จุดเด่นของรายการ — ลอยทับแค่ขอบล่างสุดของภาพ ไม่ทับตัวอักษรในภาพ · ซ่อนบนโทรศัพท์ (3 ใบเต็มจอเกือบ 2 หน้าจอ กว่าจะถึงผลการแข่งขัน) */}
        <div className="relative z-10 -mt-10 hidden grid-cols-3 gap-6 sm:grid">
          {highlights.map(({ icon: Icon, title, titleEn, description, descriptionEn }, i) => (
            <Reveal key={title} delay={i * 120}>
              <div className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-g15-950/10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-g15-50 text-g15-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{title}</h3>
                  <p className="text-xs font-medium text-g15-500">{titleEn}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">{description}</p>
                  <p className="mt-1 text-xs text-slate-400">{descriptionEn}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* สลับรอบ — สถิติ/ผล/ตารางคะแนนด้านล่างทั้งหมดเปลี่ยนตามรอบที่เลือก */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={`${display.className} text-4xl uppercase leading-none text-g15-950`}>{stageInfo(stage).en}</p>
            <h2 className="text-sm font-semibold text-slate-400">{stageInfo(stage).label}</h2>
          </div>
          <StageSwitcher stage={stage} basePath="/g15-womens-series" variant="light" />
        </div>

        {/* แถบสถิติจริงในระบบ */}
        <Reveal delay={150}>
          <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-slate-200 shadow-sm ring-1 ring-black/5 sm:grid-cols-4">
            {[
              { label: "ทีมเข้าร่วม", en: "Teams", value: teams.length, icon: Users, color: "bg-g15-50 text-g15-600" },
              {
                label: isNational ? "กลุ่ม" : "ภาคทั่วประเทศ",
                en: isNational ? "Groups" : "Regions",
                value: isNational ? nationalGroups.length : regionOrder.length,
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
                <p className={`${display.className} text-5xl leading-none text-g15-950 sm:text-6xl`}>
                  <AnimatedCounter value={s.value} />
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {s.label} <span className="text-slate-400">/ {s.en}</span>
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        {champion && (
          <Reveal delay={100}>
            <div className="mt-8">
              <ChampionPodium
                champion={champion}
                runnerUp={runnerUp}
                third={thirdPlace}
                topScorer={topScorersPreview[0] ?? null}
              />
            </div>
          </Reveal>
        )}

        {!champion && spotlightMatches.length > 0 && (
          <Reveal delay={200}>
            <div className={`mt-8 grid gap-6 ${spotlightMatches.length > 1 ? "lg:grid-cols-2" : ""}`}>
              {spotlightMatches.map((m) => (
                <MatchSpotlight key={m.id} match={{ ...m, matchNo: matchdays.get(m.id) ?? null }} mode={spotlightMode} serverNow={now.getTime()} />
              ))}
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
            {/* ผลการแข่งขันล่าสุด / โปรแกรมถัดไป — การ์ดนัดแบบเดียวกับหน้ารายการแข่ง */}
            <Reveal delay={0}>
              <div>
                <SectionHead
                  en={showUpcomingList ? "Fixtures" : "Latest Results"}
                  th={showUpcomingList ? "โปรแกรมการแข่งขัน" : "ผลการแข่งขันล่าสุด"}
                  href={href("/g15-womens-series/matches")}
                />
                {listMatches.length === 0 ? (
                  <p className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-400">
                    ยังไม่มีผลการแข่งขัน
                  </p>
                ) : (
                  <div className="space-y-4">
                    {listMatches.map((match) => (
                      <MatchCard key={match.id} match={{ ...match, matchNo: matchdays.get(match.id) ?? null }} now={now} showDate />
                    ))}
                  </div>
                )}
              </div>
            </Reveal>

            {/* ตารางคะแนน */}
            <Reveal delay={120}>
              <div>
                <SectionHead en="Standings" th="ตารางคะแนน" href={href("/g15-womens-series/standings")} />
                {isNational ? (
                  nationalGroups.length > 0 ? (
                    <NationalGroupTables groups={nationalGroups} formByTeamId={formByTeamId} columns={1} live={liveGroupTable} compact />
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-400">
                      ยังไม่ได้จัดกลุ่ม
                    </p>
                  )
                ) : standingsRegionOrder.length === 0 ? (
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

        {/* สายน็อกเอาต์ของรอบชิงแชมป์ประเทศ — ป้าย "ที่ 1 กลุ่ม A" จะกลายเป็นชื่อทีมจริงเมื่อจบรอบแบ่งกลุ่ม */}
        {isNational && bracket.length > 0 && (
          <Reveal delay={0}>
            <section className="mt-10">
              <SectionHead en="Knockout Stage" th="รอบน็อกเอาต์" href={href("/g15-womens-series/standings")} />
              <KnockoutBracket ties={bracket} />
            </section>
          </Reveal>
        )}

        {/* ไฮไลต์สถิติ — ดาวซัลโว (การ์ดแบบหน้าสถิติ) · ชนะขาดลอยที่สุด · คลีนชีตมากที่สุด */}
        {(topScorerRows.length > 0 || (biggestWin && biggestWinMargin > 0) || topCleanSheetTeam) && (
          <section className="mt-12">
            <SectionHead en="Stats Highlights" th="ไฮไลต์สถิติ" href={href("/g15-womens-series/stats")} />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {topScorerRows.length > 0 && (
                <Reveal className="h-full">
                  <div className="flex h-full flex-col">
                    <p className="mb-2 flex items-baseline gap-2">
                      <span className={`${display.className} text-2xl uppercase text-g15-700`}>Top Scorers</span>
                      <span className="text-xs font-semibold text-slate-400">ดาวซัลโว</span>
                    </p>
                    <div className="flex-1">
                      <StatLeaderCard rows={topScorerRows} unit="Goals" unitTh="ประตู" displayFont={display.className} title="Top Scorers / ดาวซัลโว" />
                    </div>
                  </div>
                </Reveal>
              )}
              {biggestWin && biggestWinMargin > 0 && (
                <Reveal delay={80} className="h-full">
                  <div className="flex h-full flex-col">
                    <p className="mb-2 flex items-baseline gap-2">
                      <span className={`${display.className} text-2xl uppercase text-g15-700`}>Biggest Win</span>
                      <span className="text-xs font-semibold text-slate-400">ชนะขาดลอยที่สุด</span>
                    </p>
                    <Link
                      href={`/g15-womens-series/matches/${biggestWin.id}`}
                      className="group relative block min-h-72 flex-1 overflow-hidden rounded-2xl shadow-sm ring-1 ring-slate-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/g15/player-profile-banner-v2-sm.webp" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-[60%_50%]" />
                      <div aria-hidden className="absolute inset-0 bg-linear-to-b from-g15-950/70 via-g15-900/60 to-g15-950/85" />
                      <div className="relative flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-white">
                        <div className="flex items-center gap-4">
                          <span className="rounded-full bg-white p-1.5 shadow-xl ring-4 ring-white/20 transition-transform group-hover:scale-105">
                            <TeamBadge team={biggestWin.homeTeam} size="lg" />
                          </span>
                          <span className={`${display.className} text-6xl leading-none drop-shadow-lg`}>
                            {biggestWin.homeScore}
                            <span className="mx-1.5 text-white/40">:</span>
                            {biggestWin.awayScore}
                          </span>
                          <span className="rounded-full bg-white p-1.5 shadow-xl ring-4 ring-white/20 transition-transform group-hover:scale-105">
                            <TeamBadge team={biggestWin.awayTeam} size="lg" />
                          </span>
                        </div>
                        <p className="line-clamp-2 text-sm font-bold">
                          {biggestWin.homeTeam.name} <span className="font-normal text-g15-200">vs</span> {biggestWin.awayTeam.name}
                        </p>
                        <p className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-amber-950">
                          ต่างกัน {biggestWinMargin} ประตู · {biggestWin.round}
                        </p>
                      </div>
                    </Link>
                  </div>
                </Reveal>
              )}
              {topCleanSheetTeam && topCleanSheetEntry && (
                <Reveal delay={160} className="h-full">
                  <div className="flex h-full flex-col">
                    <p className="mb-2 flex items-baseline gap-2">
                      <span className={`${display.className} text-2xl uppercase text-g15-700`}>Clean Sheets</span>
                      <span className="text-xs font-semibold text-slate-400">คลีนชีตมากที่สุด</span>
                    </p>
                    <Link
                      href={`/g15-womens-series/teams/${topCleanSheetTeam.id}`}
                      className="group relative isolate flex min-h-72 flex-1 flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl bg-linear-to-br from-emerald-700 via-emerald-600 to-teal-500 p-6 text-center text-white shadow-sm ring-1 ring-emerald-700/20"
                    >
                      <ShieldHalf aria-hidden className="absolute -right-8 -top-8 -z-10 h-52 w-52 text-white/10" />
                      <span className="rounded-full bg-white p-2 shadow-xl ring-4 ring-white/25 transition-transform group-hover:scale-105">
                        <TeamBadge team={topCleanSheetTeam} size="xl" />
                      </span>
                      <p className="line-clamp-2 text-base font-extrabold">{topCleanSheetTeam.name}</p>
                      <p className="flex items-baseline gap-2">
                        <span className={`${display.className} text-6xl leading-none`}>{topCleanSheetEntry[1]}</span>
                        <span className="text-sm font-semibold text-emerald-100">นัดไม่เสียประตู</span>
                      </p>
                    </Link>
                  </div>
                </Reveal>
              )}
            </div>
          </section>
        )}

        {allStars.length > 0 && (
          <Reveal delay={0}>
            <div className="mx-auto mt-10 max-w-2xl">
              <TeamOfRoundPitch picks={allStars} title="ทีมยอดเยี่ยมประจำรอบ / Team of the Round" />
            </div>
          </Reveal>
        )}

        {/* 4 ภาคทั่วประเทศ */}
        {regionOrder.length > 0 && (
          <div className="mt-10">
            <Reveal>
              <SectionHead en={isNational ? "Representatives" : "Regions"} th={isNational ? "ตัวแทน 4 ภาค" : "4 ภาคทั่วประเทศ"} href={href("/g15-womens-series/teams")} />
            </Reveal>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {regionOrder.map((region, i) => {
                const style = REGION_STYLE[region] ?? DEFAULT_REGION_STYLE;
                const groupMap = teamsByRegion.get(region)!;
                const count = Array.from(groupMap.values()).reduce((s, arr) => s + arr.length, 0);
                return (
                  <Reveal key={region} delay={i * 90}>
                    <Link
                      href={href("/g15-womens-series/teams")}
                      className={`group relative isolate block overflow-hidden rounded-2xl p-5 text-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${style.bg}`}
                    >
                      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-br from-white/10 via-transparent to-black/25" />
                      <MapPin aria-hidden className="absolute -bottom-5 -right-5 -z-10 h-28 w-28 text-white/15 transition-transform duration-500 group-hover:scale-110" />
                      <p className={`${display.className} text-2xl uppercase leading-none tracking-wide text-white/90`}>{regionEn(region)}</p>
                      <p className="mt-1 text-sm font-bold">{region}</p>
                      <p className="mt-4 flex items-baseline gap-1.5">
                        <span className={`${display.className} text-5xl leading-none`}>{count}</span>
                        <span className="text-xs font-semibold text-white/80">ทีม</span>
                      </p>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        )}

        {/* ลิงก์ด่วนไปทุกหมวด */}
        <div className="mt-12">
          <Reveal>
            <SectionHead en="Explore" th="สำรวจ G15" />
          </Reveal>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {quickLinks.map(({ href: path, icon: Icon, label, labelEn, color }, i) => (
              <Reveal key={path} delay={i * 70}>
                <Link
                  href={href(path)}
                  className="group flex h-full flex-col items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-g15-200 hover:shadow-lg"
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
