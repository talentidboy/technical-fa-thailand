import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getStandings } from "@/lib/g15";
import { parseStage, stageInfo } from "@/lib/g15-stage";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { HeroArt } from "@/components/g15/HeroArt";
import { StageSwitcher } from "@/components/g15/StageSwitcher";
import { TeamOfRoundPitch } from "@/components/g15/TeamOfRoundPitch";
import { MiniLeaderboard } from "@/components/g15/MiniLeaderboard";
import { StatLeaderCard, type StatLeaderRow } from "@/components/g15/StatLeaderCard";
import { Bebas_Neue } from "next/font/google";
import { TeamBadge } from "@/components/g15/TeamBadge";
import { Reveal } from "@/components/g15/Reveal";
import { AnimatedCounter } from "@/components/g15/AnimatedCounter";
import { Target, ShieldCheck, ShieldHalf, Flame, BarChart3, Users, CheckCircle2, TrendingUp } from "lucide-react";

// ตัวอักษรแคบสูงสำหรับหัวข้อ/ชื่อ/ตัวเลขในการ์ดอันดับ (แบบเดียวกับหน้าโปรไฟล์นักกีฬา)
const display = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap" });

export default async function G15StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const stage = parseStage((await searchParams).stage);

  // ทุกอย่างกรองตามรอบ — รอบชิงแชมป์ประเทศเริ่มนับประตู/คลีนชีต/ดาวซัลโวใหม่จากศูนย์ ไม่รวมผลรอบภูมิภาค
  const [user, allTeams, matches, goals, allStars, assistGoals, cards] = await Promise.all([
    getCurrentUser(),
    prisma.g15Team.findMany({ orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
    prisma.g15Match.findMany({ where: { stage }, include: { homeTeam: true, awayTeam: true } }),
    // ไม่นับประตูตัวเอง (OG) เป็นประตูของคนยิง
    prisma.g15Goal.findMany({
      where: { match: { stage }, isOwnGoal: false },
      include: { team: true, player: { select: { firstNameEn: true, lastNameEn: true, photoUrl: true } } },
    }),
    prisma.g15AllStar.findMany({
      where: { stage },
      include: { player: { select: { id: true, firstNameTh: true, lastNameTh: true, jerseyNumber: true, photoUrl: true, team: true } } },
    }),
    // แอสซิสต์ — ประตูที่มีผู้จ่ายบอล (ผูกทะเบียน) ในรอบนี้
    prisma.g15Goal.findMany({
      where: { match: { stage }, assistPlayerId: { not: null } },
      include: { team: true },
    }),
    prisma.g15Card.findMany({ where: { match: { stage }, holderRole: "PLAYER" }, include: { team: true } }),
  ]);
  const teams = stage === "NATIONAL" ? allTeams.filter((t) => t.nationalGroup) : allTeams;

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

  // ===== อันดับรายบุคคล (การ์ดแบบ leaderboard) =====
  // ข้อมูลนักกีฬาที่ต้องใช้ (รูป/ชื่ออังกฤษ) — แอสซิสต์อ้าง id, ใบเหลือง/แดงเก็บเป็นชื่อ (จับคู่ด้วยทีม+ชื่อ)
  const assistIds = [...new Set(assistGoals.map((g) => g.assistPlayerId!))];
  const cardTeamIds = [...new Set(cards.map((c) => c.teamId))];
  const people = await prisma.g15Player.findMany({
    where: { OR: [{ id: { in: assistIds } }, { teamId: { in: cardTeamIds } }] },
    select: { id: true, teamId: true, firstNameTh: true, lastNameTh: true, firstNameEn: true, lastNameEn: true, photoUrl: true },
  });
  const personById = new Map(people.map((p) => [p.id, p]));
  const personByTeamName = new Map(people.map((p) => [`${p.teamId}|${p.firstNameTh} ${p.lastNameTh}`, p]));
  const enName = (p?: { firstNameEn: string | null; lastNameEn: string | null } | null) =>
    p ? [p.firstNameEn, p.lastNameEn].filter(Boolean).join(" ") || null : null;
  const teamOf = (t: { name: string; logoUrl: string | null; groupName: string | null }) => ({
    name: t.name,
    logoUrl: t.logoUrl,
    groupName: t.groupName,
  });

  // นับรายการต่อคน แล้วเรียงมาก→น้อย (เท่ากันเรียงตามชื่อ)
  const tally = (entries: { key: string; build: () => Omit<StatLeaderRow, "value" | "key"> }[]) => {
    const map = new Map<string, StatLeaderRow>();
    for (const e of entries) {
      const row = map.get(e.key);
      if (row) row.value += 1;
      else map.set(e.key, { key: e.key, value: 1, ...e.build() });
    }
    return [...map.values()].sort((a, b) => b.value - a.value || a.nameTh.localeCompare(b.nameTh, "th"));
  };

  // ดาวซัลโว — คีย์ด้วย playerId ถ้าผูกทะเบียน ไม่งั้นทีม+ชื่อ; ไม่นับ OG และประตูที่ไม่ระบุผู้ทำ
  const topScorerRows = tally(
    goals
      .filter((g) => g.playerId != null || g.playerName !== "ไม่ระบุผู้ทำประตู")
      .map((g) => ({
        key: g.playerId != null ? `p${g.playerId}` : `n${g.teamId}:${g.playerName}`,
        build: () => ({
          playerId: g.playerId,
          nameTh: g.playerName,
          nameEn: enName(g.player),
          photoUrl: g.player?.photoUrl ?? null,
          team: teamOf(g.team),
        }),
      })),
  );
  const assistRows = tally(
    assistGoals.map((g) => {
      const p = personById.get(g.assistPlayerId!);
      return {
        key: `p${g.assistPlayerId}`,
        build: () => ({
          playerId: g.assistPlayerId,
          nameTh: g.assistName ?? (p ? `${p.firstNameTh} ${p.lastNameTh}` : "-"),
          nameEn: enName(p),
          photoUrl: p?.photoUrl ?? null,
          team: teamOf(g.team),
        }),
      };
    }),
  );
  const cardRows = (type: "YELLOW" | "RED") =>
    tally(
      cards
        .filter((c) => c.cardType === type)
        .map((c) => {
          const p = personByTeamName.get(`${c.teamId}|${c.holderName}`);
          return {
            key: p ? `p${p.id}` : `n${c.teamId}:${c.holderName}`,
            build: () => ({
              playerId: p?.id ?? null,
              nameTh: c.holderName,
              nameEn: enName(p),
              photoUrl: p?.photoUrl ?? null,
              team: teamOf(c.team),
            }),
          };
        }),
    );
  const yellowRows = cardRows("YELLOW");
  const redRows = cardRows("RED");

  return (
    <div className="min-h-screen bg-slate-50">
      <G15Chrome user={user} stage={stage} />

      {/* ฮีโร่ไล่สีชุดเดียวกับหน้าอื่นๆ ของ G15 — แถบสถิติลอยทับขอบล่างให้ภาษาภาพเป็นชุดเดียวกันทั้งเว็บ */}
      <section className="relative isolate overflow-hidden bg-linear-to-br from-g15-950 via-g15-800 to-g15-600 pb-20 pt-8 sm:pb-24">
        <div className="absolute inset-x-0 top-0 h-1.5 animate-shimmer-slide bg-linear-to-r from-amber-600 via-amber-200 via-50% to-amber-600 bg-size-[200%_100%]" />
        <HeroArt />
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-g15-200">
            <BarChart3 className="h-3.5 w-3.5" />
            Statistics
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
            สถิติ <span className="text-base font-normal text-g15-200">/ {stageInfo(stage).label}</span>
          </h1>
          <StageSwitcher stage={stage} basePath="/g15-womens-series/stats" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-20">
        {finishedMatches.length === 0 ? (
          <div className="relative z-10 -mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-xl shadow-g15-950/10 sm:-mt-14">
            <p className="text-sm text-slate-500">ยังไม่มีผลการแข่งขันใน{stageInfo(stage).label} จึงยังไม่มีสถิติให้แสดง</p>
            <p className="mt-0.5 text-xs text-slate-400">No {stageInfo(stage).en} results yet, so no statistics to show</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* แถบสถิติ — ลอยทับขอบล่างของฮีโร่ */}
            <div className="relative z-10 -mt-10 sm:-mt-14">
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-slate-200 shadow-xl shadow-g15-950/10 ring-1 ring-black/5 sm:grid-cols-4">
                {[
                  { label: "ทีมทั้งหมด", en: "Teams", value: teams.length, decimals: 0, icon: Users, color: "bg-g15-50 text-g15-600" },
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

            {/* อันดับรายบุคคล — การ์ดแบบ leaderboard (อันดับ 1 เป็นแบนเนอร์ใหญ่) */}
            <section>
              <h2 className={`${display.className} mb-4 text-4xl uppercase leading-none text-g15-900`}>
                Player Stats <span className="font-sans text-base font-semibold normal-case text-slate-400">/ สถิตินักกีฬา</span>
              </h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {[
                  { title: "Top Scorers", th: "ดาวซัลโว", rows: topScorerRows, unit: "Goals", unitTh: "ประตู" },
                  { title: "Top Assists", th: "แอสซิสต์สูงสุด", rows: assistRows, unit: "Assists", unitTh: "แอสซิสต์" },
                  { title: "Yellow Cards", th: "ใบเหลือง", rows: yellowRows, unit: "Yellow", unitTh: "ใบเหลือง" },
                  ...(redRows.length > 0 ? [{ title: "Red Cards", th: "ใบแดง", rows: redRows, unit: "Red", unitTh: "ใบแดง" }] : []),
                ].map((b, i) => (
                  <Reveal key={b.title} delay={i * 60} className="h-full">
                    <div className="flex h-full flex-col">
                      <p className="mb-2 flex items-baseline gap-2">
                        <span className={`${display.className} text-2xl uppercase text-g15-700`}>{b.title}</span>
                        <span className="text-xs font-semibold text-slate-400">{b.th}</span>
                      </p>
                      <div className="flex-1">
                        <StatLeaderCard rows={b.rows} unit={b.unit} unitTh={b.unitTh} displayFont={display.className} />
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </section>

            <section>
            <h2 className={`${display.className} mb-4 text-4xl uppercase leading-none text-g15-900`}>
              Team Stats <span className="font-sans text-base font-semibold normal-case text-slate-400">/ สถิติทีม</span>
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            </section>

            {allStars.length > 0 && (
              <Reveal>
                <div className="mx-auto max-w-2xl">
                  <TeamOfRoundPitch picks={allStars} title="ทีมยอดเยี่ยมประจำรอบ / Team of the Round" />
                </div>
              </Reveal>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
