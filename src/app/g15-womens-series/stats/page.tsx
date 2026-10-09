import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getStandings } from "@/lib/g15";
import { parseStage, stageInfo } from "@/lib/g15-stage";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { HeroArt } from "@/components/g15/HeroArt";
import { StageSwitcher } from "@/components/g15/StageSwitcher";
import { TeamOfRoundPitch } from "@/components/g15/TeamOfRoundPitch";
import { StatLeaderCard, type StatLeaderRow } from "@/components/g15/StatLeaderCard";
import { Bebas_Neue } from "next/font/google";
import { TeamBadge } from "@/components/g15/TeamBadge";
import { Reveal } from "@/components/g15/Reveal";
import { AnimatedCounter } from "@/components/g15/AnimatedCounter";
import { Target, BarChart3, Users, CheckCircle2, TrendingUp } from "lucide-react";

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
  // คลีนชีตมากที่สุด — จำนวนนัดที่ทีมไม่เสียประตูเลย
  const cleanSheetsByTeamId = new Map<number, number>();
  for (const m of finishedMatches) {
    if (m.awayScore === 0) cleanSheetsByTeamId.set(m.homeTeamId, (cleanSheetsByTeamId.get(m.homeTeamId) ?? 0) + 1);
    if (m.homeScore === 0) cleanSheetsByTeamId.set(m.awayTeamId, (cleanSheetsByTeamId.get(m.awayTeamId) ?? 0) + 1);
  }
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

  // ===== อันดับทีม (การ์ดแบบเดียวกับนักกีฬา) =====
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const teamRow = (r: (typeof playedRows)[number], value: number): StatLeaderRow => {
    const t = teamById.get(r.teamId);
    return {
      key: `t${r.teamId}`,
      playerId: null,
      href: `/g15-womens-series/teams/${r.teamId}`,
      nameTh: r.teamName,
      nameEn: null,
      photoUrl: null,
      team: { name: r.teamName, logoUrl: r.logoUrl, groupName: r.groupName },
      subtitle: stage === "NATIONAL" && t?.nationalGroup ? `กลุ่ม ${t.nationalGroup} · ${r.groupName ?? ""}` : (r.groupName ?? undefined),
      value,
    };
  };
  const byValueDesc = (a: StatLeaderRow, b: StatLeaderRow) => b.value - a.value || a.nameTh.localeCompare(b.nameTh, "th");
  const goalsForRows = playedRows.map((r) => teamRow(r, r.goalsFor)).sort(byValueDesc);
  // เสียน้อยสุด = ค่าน้อยดีกว่า (เรียงน้อย→มาก) — อันดับร่วมยังใช้หลักเดิม (ค่าเท่ากัน = อันดับเดียวกัน)
  const defenceRows = playedRows
    .map((r) => teamRow(r, r.goalsAgainst))
    .sort((a, b) => a.value - b.value || a.nameTh.localeCompare(b.nameTh, "th"));
  const cleanSheetTeamRows = playedRows
    .map((r) => teamRow(r, cleanSheetsByTeamId.get(r.teamId) ?? 0))
    .filter((r) => r.value > 0)
    .sort(byValueDesc);
  const winsRows = playedRows
    .map((r) => teamRow(r, r.won))
    .filter((r) => r.value > 0)
    .sort(byValueDesc);

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
                        <StatLeaderCard rows={b.rows} unit={b.unit} unitTh={b.unitTh} displayFont={display.className} title={`${b.title} / ${b.th}`} />
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </section>

            {/* อันดับทีม — การ์ดแบบเดียวกับนักกีฬา (อันดับ 1 เป็นแบนเนอร์ + โลโก้ใหญ่) */}
            <section>
              <h2 className={`${display.className} mb-4 text-4xl uppercase leading-none text-g15-900`}>
                Team Stats <span className="font-sans text-base font-semibold normal-case text-slate-400">/ สถิติทีม</span>
              </h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {[
                  { title: "Most Goals", th: "ทีมยิงประตูสูงสุด", rows: goalsForRows, unit: "Goals", unitTh: "ประตูได้" },
                  { title: "Best Defence", th: "ทีมเสียประตูน้อยสุด", rows: defenceRows, unit: "Conceded", unitTh: "ประตูเสีย" },
                  { title: "Clean Sheets", th: "คลีนชีตมากที่สุด", rows: cleanSheetTeamRows, unit: "Clean sheets", unitTh: "นัด" },
                  { title: "Most Wins", th: "ชนะมากที่สุด", rows: winsRows, unit: "Wins", unitTh: "ชนะ" },
                ].map((b, i) => (
                  <Reveal key={b.title} delay={i * 60} className="h-full">
                    <div className="flex h-full flex-col">
                      <p className="mb-2 flex items-baseline gap-2">
                        <span className={`${display.className} text-2xl uppercase text-g15-700`}>{b.title}</span>
                        <span className="text-xs font-semibold text-slate-400">{b.th}</span>
                      </p>
                      <div className="flex-1">
                        <StatLeaderCard rows={b.rows} unit={b.unit} unitTh={b.unitTh} displayFont={display.className} kind="team" title={`${b.title} / ${b.th}`} />
                      </div>
                    </div>
                  </Reveal>
                ))}

                {/* ชนะขาดลอยที่สุด — แบนเนอร์สองโลโก้ + สกอร์ บนฉากสนามแบบเดียวกัน */}
                {biggestWin && (
                  <Reveal delay={240}>
                    <div className="flex flex-col">
                      <p className="mb-2 flex items-baseline gap-2">
                        <span className={`${display.className} text-2xl uppercase text-g15-700`}>Biggest Win</span>
                        <span className="text-xs font-semibold text-slate-400">ชนะขาดลอยที่สุด</span>
                      </p>
                      <Link
                        href={`/g15-womens-series/matches/${biggestWin.id}`}
                        className="group relative block h-72 overflow-hidden rounded-2xl shadow-sm ring-1 ring-slate-200"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/g15/player-profile-banner-v2-sm.webp"
                          alt=""
                          aria-hidden
                          className="absolute inset-0 h-full w-full object-cover object-[60%_50%]"
                        />
                        <div aria-hidden className="absolute inset-0 bg-linear-to-b from-g15-950/70 via-g15-900/60 to-g15-950/85" />
                        <div className="relative flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-white">
                          <div className="flex items-center gap-4">
                            <span className="rounded-full bg-white p-1.5 shadow-xl ring-4 ring-white/20">
                              <TeamBadge team={biggestWin.homeTeam} size="lg" />
                            </span>
                            <span className={`${display.className} text-6xl leading-none drop-shadow-lg`}>
                              {biggestWin.homeScore}
                              <span className="mx-1.5 text-white/40">:</span>
                              {biggestWin.awayScore}
                            </span>
                            <span className="rounded-full bg-white p-1.5 shadow-xl ring-4 ring-white/20">
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
