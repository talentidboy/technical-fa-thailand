import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getStandings, formatMatchDateTime, type StandingGroup, type StandingRow } from "@/lib/g15";
import { REGION_ORDER, REGION_STYLE, DEFAULT_REGION_STYLE, parseRegionGroup, regionEn } from "@/lib/g15-region";
import { LOGO_URL, G15_IMAGE_URL } from "@/lib/brand";
import { G15Tabs } from "@/components/g15/G15Tabs";
import { TeamBadge } from "@/components/g15/TeamBadge";
import { PublicMatchesBoard } from "@/components/g15/PublicMatchesBoard";
import {
  ArrowLeft,
  Trophy,
  Target,
  Calendar,
  MapPin,
  Settings,
  LogIn,
  ShieldCheck,
  ChevronRight,
  Globe2,
  Award,
  Rocket,
  Users,
  CheckCircle2,
} from "lucide-react";

function StandingTable({ group }: { group: StandingGroup }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-90 text-left text-sm">
        <thead className="bg-slate-50 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          <tr>
            <th className="w-10 px-3 py-2.5"></th>
            <th className="px-2 py-2.5">
              Team <span className="normal-case text-slate-400">/ ทีม</span>
            </th>
            <th className="px-2 py-2.5 text-center" title="แข่ง">
              P
            </th>
            <th className="px-2 py-2.5 text-center" title="ชนะ">
              W
            </th>
            <th className="hidden px-2 py-2.5 text-center sm:table-cell" title="เสมอ">
              D
            </th>
            <th className="hidden px-2 py-2.5 text-center sm:table-cell" title="แพ้">
              L
            </th>
            <th className="hidden px-2 py-2.5 text-center sm:table-cell" title="ผลต่าง">
              GD
            </th>
            <th className="px-4 py-2.5 text-center" title="คะแนน">
              Pts
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {group.rows.map((row, i) => {
            const rank = i + 1;
            const badge =
              rank === 1
                ? "bg-amber-400 text-amber-950"
                : rank === 2
                  ? "bg-slate-300 text-slate-900"
                  : rank === 3
                    ? "bg-orange-300 text-orange-950"
                    : "bg-slate-100 text-slate-400";
            return (
              <tr key={row.teamId}>
                <td className="px-3 py-2.5">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${badge}`}
                  >
                    {rank}
                  </span>
                </td>
                <td className="max-w-30 px-2 py-2.5 sm:max-w-none">
                  <div className="flex items-center gap-2">
                    <TeamBadge team={{ name: row.teamName, logoUrl: row.logoUrl, groupName: row.groupName }} size="sm" />
                    <span className="truncate font-medium text-slate-900 sm:whitespace-nowrap">{row.teamName}</span>
                  </div>
                </td>
                <td className="px-2 py-2.5 text-center text-slate-500">{row.played}</td>
                <td className="px-2 py-2.5 text-center text-slate-500">{row.won}</td>
                <td className="hidden px-2 py-2.5 text-center text-slate-500 sm:table-cell">{row.drawn}</td>
                <td className="hidden px-2 py-2.5 text-center text-slate-500 sm:table-cell">{row.lost}</td>
                <td className="hidden px-2 py-2.5 text-center text-slate-500 sm:table-cell">
                  {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                </td>
                <td className="px-4 py-2.5 text-center font-bold text-rose-600">{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MiniLeaderboard({
  title,
  icon: Icon,
  rows,
  valueOf,
}: {
  title: string;
  icon: typeof Trophy;
  rows: StandingRow[];
  valueOf: (row: StandingRow) => number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-rose-600" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-400">ยังไม่มีข้อมูล / No data yet</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((row, i) => (
            <li key={row.teamId} className="flex items-center gap-2.5">
              <span
                className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11px] font-bold ${
                  i === 0
                    ? "bg-amber-400 text-amber-950"
                    : i === 1
                      ? "bg-slate-300 text-slate-900"
                      : i === 2
                        ? "bg-orange-300 text-orange-950"
                        : "bg-slate-100 text-slate-400"
                }`}
              >
                {i + 1}
              </span>
              <TeamBadge team={{ name: row.teamName, logoUrl: row.logoUrl, groupName: row.groupName }} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{row.teamName}</span>
              <span className="flex-none text-sm font-bold text-rose-600">{valueOf(row)}</span>
            </li>
          ))}
        </ul>
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

export default async function G15WomensSeriesPage() {
  // หน้านี้เปิดให้ดูได้แบบสาธารณะไม่ต้องล็อกอิน — ต้องล็อกอินเฉพาะตอนจะ "จัดการข้อมูล" เท่านั้น
  const user = await getCurrentUser();
  const canManage = user?.role === "ADMIN" || user?.role === "STAFF";

  const [teams, matches, players, officials] = await Promise.all([
    prisma.g15Team.findMany({ orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
    prisma.g15Match.findMany({
      orderBy: [{ matchDate: "asc" }, { createdAt: "asc" }],
      include: { homeTeam: true, awayTeam: true },
    }),
    // แค่ตัวนับต่อทีมสำหรับหน้ารวม — รายละเอียดเต็มไปอยู่หน้าโปรไฟล์ทีมแทน
    prisma.g15Player.groupBy({ by: ["teamId"], _count: { id: true } }),
    prisma.g15Official.groupBy({ by: ["teamId"], _count: { id: true } }),
  ]);

  const playerCountByTeam = new Map(players.map((p) => [p.teamId, p._count.id]));
  const officialCountByTeam = new Map(officials.map((o) => [o.teamId, o._count.id]));

  const standingGroups = getStandings(teams, matches);

  // จัดทีมที่เข้าร่วมเป็นกลุ่มตามภูมิภาค → กลุ่มย่อย (A/B) สำหรับการ์ดทีมที่เข้าร่วม
  const teamsByRegion = new Map<string, Map<string, typeof teams>>();
  const ungroupedTeams: typeof teams = [];
  for (const team of teams) {
    const parsed = parseRegionGroup(team.groupName);
    if (!parsed) {
      ungroupedTeams.push(team);
      continue;
    }
    if (!teamsByRegion.has(parsed.region)) teamsByRegion.set(parsed.region, new Map());
    const groupMap = teamsByRegion.get(parsed.region)!;
    if (!groupMap.has(parsed.letter)) groupMap.set(parsed.letter, []);
    groupMap.get(parsed.letter)!.push(team);
  }
  const regionOrder = [
    ...REGION_ORDER.filter((r) => teamsByRegion.has(r)),
    ...Array.from(teamsByRegion.keys()).filter((r) => !REGION_ORDER.includes(r)),
  ];

  // จัดตารางคะแนนเป็นกลุ่มตามภูมิภาคเดียวกับทีมที่เข้าร่วม — รวม A/B ของภาคเดียวกันไว้การ์ดเดียว
  const standingsByRegion = new Map<string, Map<string, (typeof standingGroups)[number]>>();
  const ungroupedStandings: typeof standingGroups = [];
  for (const group of standingGroups) {
    const parsed = parseRegionGroup(group.groupName);
    if (!parsed) {
      ungroupedStandings.push(group);
      continue;
    }
    if (!standingsByRegion.has(parsed.region)) standingsByRegion.set(parsed.region, new Map());
    standingsByRegion.get(parsed.region)!.set(parsed.letter, group);
  }
  const standingsRegionOrder = [
    ...REGION_ORDER.filter((r) => standingsByRegion.has(r)),
    ...Array.from(standingsByRegion.keys()).filter((r) => !REGION_ORDER.includes(r)),
  ];

  // สถิติภาพรวมทัวร์นาเมนต์ — คำนวณจากผลแข่งจริงเท่านั้น (นัดที่ยังไม่แข่งไม่นับ)
  const finishedMatches = matches.filter((m) => m.status === "FINISHED");
  const totalGoals = finishedMatches.reduce(
    (s, m) => s + (m.homeScore ?? 0) + (m.awayScore ?? 0),
    0,
  );
  const avgGoals = finishedMatches.length > 0 ? totalGoals / finishedMatches.length : 0;
  const playedRows = standingGroups.flatMap((g) => g.rows).filter((r) => r.played > 0);
  const topScorers = [...playedRows].sort((a, b) => b.goalsFor - a.goalsFor).slice(0, 5);
  const bestDefense = [...playedRows]
    .sort((a, b) => a.goalsAgainst - b.goalsAgainst || b.played - a.played)
    .slice(0, 5);

  // ผลการแข่งขันล่าสุด — ทุกนัดในระบบตอนนี้แข่งจบไปแล้ว (ไม่มีนัดที่ยังไม่ถึงวันแข่ง) จึงโชว์ผลล่าสุดแทน "นัดถัดไป"
  const recentResults = [...finishedMatches]
    .sort((a, b) => (b.matchDate?.getTime() ?? 0) - (a.matchDate?.getTime() ?? 0))
    .slice(0, 10);

  const matchesContent = <PublicMatchesBoard matches={matches} regionOrder={REGION_ORDER} />;

  const tableContent = (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {standingsRegionOrder.map((region) => {
          const style = REGION_STYLE[region] ?? DEFAULT_REGION_STYLE;
          const groupMap = standingsByRegion.get(region)!;
          const letters = Array.from(groupMap.keys()).sort();

          return (
            <div
              key={region}
              className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ${style.ring}`}
            >
              <div className={`flex items-center gap-2.5 px-5 py-3 ${style.bg}`}>
                <MapPin className="h-4 w-4 text-white" />
                <h3 className="font-bold text-white">
                  {region} <span className="font-normal text-white/70">/ {regionEn(region)}</span>
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {letters.map((letter) => (
                  <div key={letter}>
                    <p className={`px-5 pt-3 text-xs font-bold ${style.text}`}>กลุ่ม {letter}</p>
                    <StandingTable group={groupMap.get(letter)!} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {ungroupedStandings.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {ungroupedStandings.map((group) => (
            <div key={group.groupName} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-3">
                <h3 className="font-semibold text-slate-900">{group.groupName}</h3>
              </div>
              <StandingTable group={group} />
            </div>
          ))}
        </div>
      )}
    </>
  );

  const statsContent =
    finishedMatches.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
        <p className="text-sm text-slate-500">ยังไม่มีผลการแข่งขัน จึงยังไม่มีสถิติให้แสดง</p>
        <p className="mt-0.5 text-xs text-slate-400">No results yet, so no statistics to show</p>
      </div>
    ) : (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "ทีมทั้งหมด", en: "Teams", value: teams.length },
            { label: "นัดที่แข่งแล้ว", en: "Played", value: finishedMatches.length },
            { label: "ประตูรวม", en: "Goals", value: totalGoals },
            { label: "ประตูเฉลี่ย/นัด", en: "Goals/Match", value: avgGoals.toFixed(2) },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="mt-1 text-xs text-slate-500">
                {s.label} <span className="text-slate-400">/ {s.en}</span>
              </p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MiniLeaderboard
            title="ทีมทำประตูสูงสุด / Top Scorers"
            icon={Target}
            rows={topScorers}
            valueOf={(r) => r.goalsFor}
          />
          <MiniLeaderboard
            title="ทีมเสียประตูน้อยที่สุด / Best Defence"
            icon={ShieldCheck}
            rows={bestDefense}
            valueOf={(r) => r.goalsAgainst}
          />
        </div>
      </div>
    );

  const clubsContent = (
    <>
      <div className="space-y-6">
        {regionOrder.map((region) => {
          const style = REGION_STYLE[region] ?? DEFAULT_REGION_STYLE;
          const groupMap = teamsByRegion.get(region)!;
          const letters = Array.from(groupMap.keys()).sort();
          const regionTotal = letters.reduce((s, l) => s + groupMap.get(l)!.length, 0);

          return (
            <div
              key={region}
              className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ${style.ring}`}
            >
              <div className={`flex items-center gap-2.5 px-5 py-3 ${style.bg}`}>
                <MapPin className="h-4 w-4 text-white" />
                <h3 className="font-bold text-white">
                  {region} <span className="font-normal text-white/70">/ {regionEn(region)}</span>
                </h3>
                <span className="ml-auto text-xs font-medium text-white/80">{regionTotal} ทีม / teams</span>
              </div>
              <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
                {letters.map((letter) => (
                  <div key={letter}>
                    <p className={`mb-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${style.light} ${style.text}`}>
                      Group / กลุ่ม {letter}
                    </p>
                    <ul className="space-y-1">
                      {groupMap.get(letter)!.map((team) => {
                        const playerCount = playerCountByTeam.get(team.id) ?? 0;
                        const officialCount = officialCountByTeam.get(team.id) ?? 0;
                        const hasRoster = playerCount > 0 || officialCount > 0;

                        const badge = team.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={team.logoUrl} alt="" className="h-6 w-6 flex-none rounded-full object-cover" />
                        ) : (
                          <span
                            className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-[10px] font-bold text-white ${style.bg}`}
                          >
                            {team.name.charAt(0)}
                          </span>
                        );

                        return (
                          <li key={team.id}>
                            <Link
                              href={`/g15-womens-series/teams/${team.id}`}
                              className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              {badge}
                              <span className="min-w-0 flex-1 truncate">{team.name}</span>
                              {hasRoster && (
                                <span className="flex-none text-[10px] text-slate-400">
                                  {playerCount > 0 && `${playerCount} players`}
                                  {playerCount > 0 && officialCount > 0 && " · "}
                                  {officialCount > 0 && `${officialCount} staff`}
                                </span>
                              )}
                              <ChevronRight className="h-3.5 w-3.5 flex-none text-slate-400" />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {ungroupedTeams.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {ungroupedTeams.map((team) => (
            <div
              key={team.id}
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm"
            >
              {team.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={team.logoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-600">
                  {team.name.charAt(0)}
                </div>
              )}
              <p className="text-sm font-medium text-slate-900">{team.name}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-rose-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
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
              <p className="truncate text-[11px] text-rose-300">หมวด: G15 Women&apos;s Football Series</p>
            </div>
          </Link>
          <div className="flex flex-none items-center gap-1.5 sm:gap-2">
            {canManage ? (
              <Link
                href="/g15-womens-series/manage"
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 px-2.5 py-2 text-sm font-medium text-rose-200 transition-colors hover:bg-white/10 hover:text-white sm:px-3"
              >
                <Settings className="h-4 w-4 flex-none" />
                <span className="hidden sm:inline">จัดการข้อมูล</span>
              </Link>
            ) : (
              !user && (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 px-2.5 py-2 text-sm font-medium text-rose-200 transition-colors hover:bg-white/10 hover:text-white sm:px-3"
                >
                  <LogIn className="h-4 w-4 flex-none" />
                  <span className="hidden sm:inline">เข้าสู่ระบบ</span>
                </Link>
              )
            )}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 px-2.5 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-white/10 hover:text-white sm:px-3"
            >
              <ArrowLeft className="h-4 w-4 flex-none" />
              <span className="hidden sm:inline">กลับหน้าแรก</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-rose-950 via-rose-900 to-fuchsia-800">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-amber-600 via-amber-300 to-amber-600" />

        {/* จุดไฟหลายชั้นเพิ่มมิติความหรูหรา */}
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-rose-400/25 blur-3xl" />
        <div className="absolute -right-20 top-1/4 h-112 w-md rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />

        {/* ลายจุดแบบละเอียด เพิ่มพื้นผิวให้พื้นหลังไม่โล่งจนเกินไป */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* โลโก้ถ้วยรางวัลจางๆ เป็นลายน้ำด้านหลัง เพิ่มความยิ่งใหญ่ */}
        <Trophy className="pointer-events-none absolute -right-10 -top-10 h-72 w-72 rotate-12 text-white/4" />

        <div className="relative mx-auto max-w-4xl px-6 pb-28 pt-16 text-center sm:pb-32 sm:pt-20">
          <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-300 ring-1 ring-amber-400/30">
            <Trophy className="h-3.5 w-3.5" />
            FA Thailand
          </div>

          <div className="relative mx-auto mt-6 flex h-32 w-32 items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-white/10 blur-xl" />
            <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl bg-white/10 shadow-2xl ring-1 ring-white/25">
              <Image
                src={G15_IMAGE_URL}
                alt="G15 Women's Football Series"
                width={128}
                height={128}
                className="h-full w-full object-cover"
                priority
              />
            </div>
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-5xl">
            G15 Women&apos;s Football Series 2026
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-semibold text-amber-200">
            เปิดรับสมัครทีมฟุตบอลหญิง รุ่นอายุไม่เกิน 15 ปี จากทั่วประเทศ เข้าร่วมการแข่งขัน
          </p>
          <p className="mx-auto mt-1 max-w-2xl text-sm font-medium text-amber-200/70">
            Open call for U15 women&apos;s football teams nationwide
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-rose-100">
            เวทีการแข่งขันที่เปิดโอกาสให้น้องๆ นักกีฬาฟุตบอลหญิงอายุไม่เกิน 15 ปี ได้แสดงศักยภาพ พัฒนาฝีเท้า
            และเก็บเกี่ยวประสบการณ์การแข่งขันอย่างเต็มที่ ภายใต้การสนับสนุนและการกำกับดูแลจากผู้เชี่ยวชาญของ FIFA
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-rose-100/70">
            A tournament for U15 women footballers to showcase their skills, develop as players, and gain real
            match experience, supported and overseen by FIFA experts.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-20">
        {/* แถบสถิติลอยทับรอยต่อ hero กับพื้นหลัง — ดึงจากข้อมูลจริงในระบบ */}
        <div className="relative z-10 -mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-slate-200 shadow-2xl ring-1 ring-black/5 sm:-mt-20 sm:grid-cols-4">
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
            <div key={s.label} className="bg-white px-4 py-6 text-center sm:py-7">
              <div className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon className="h-4.5 w-4.5" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {s.label} <span className="text-slate-400">/ {s.en}</span>
              </p>
            </div>
          ))}
        </div>

        {recentResults.length > 0 && (
          <div className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">ผลการแข่งขันล่าสุด</h2>
                <p className="text-xs text-slate-400">Recent Results</p>
              </div>
              <span className="text-xs text-slate-400">เลื่อนดู / Scroll →</span>
            </div>
            <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-2">
              {recentResults.map((match) => (
                <div
                  key={match.id}
                  className="w-52 flex-none rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <TeamBadge team={match.homeTeam} size="sm" />
                      <span className="min-w-0 truncate text-sm font-medium text-slate-700">
                        {match.homeTeam.name}
                      </span>
                    </div>
                    <span className="flex-none font-bold tabular-nums text-slate-900">{match.homeScore}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <TeamBadge team={match.awayTeam} size="sm" />
                      <span className="min-w-0 truncate text-sm font-medium text-slate-700">
                        {match.awayTeam.name}
                      </span>
                    </div>
                    <span className="flex-none font-bold tabular-nums text-slate-900">{match.awayScore}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-2.5 text-[11px] text-slate-400">
                    <Calendar className="h-3 w-3" />
                    {formatMatchDateTime(match.matchDate)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-10 mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {highlights.map(({ icon: Icon, title, titleEn, description, descriptionEn }) => (
            <div
              key={title}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
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
          ))}
        </div>

        {teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Trophy className="h-8 w-8 text-slate-400" />
            <p className="font-medium text-slate-600">กำหนดการและรายละเอียดการแข่งขัน</p>
            <p className="text-sm text-slate-500">
              อยู่ระหว่างการพัฒนา เร็วๆ นี้จะมีตารางแข่งขันและข้อมูลเพิ่มเติม
            </p>
            <p className="text-xs text-slate-400">Schedule and details coming soon</p>
          </div>
        ) : (
          <G15Tabs matches={matchesContent} table={tableContent} stats={statsContent} clubs={clubsContent} />
        )}
      </div>
    </div>
  );
}
