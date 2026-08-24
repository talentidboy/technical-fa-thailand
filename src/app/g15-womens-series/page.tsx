import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getStandings, type StandingGroup, type StandingRow } from "@/lib/g15";
import { REGION_ORDER, REGION_STYLE, DEFAULT_REGION_STYLE, parseRegionGroup } from "@/lib/g15-region";
import { LOGO_URL, G15_IMAGE_URL } from "@/lib/brand";
import { G15Tabs } from "@/components/g15/G15Tabs";
import {
  ArrowLeft,
  Trophy,
  Target,
  Venus,
  Calendar,
  Users,
  MapPin,
  Settings,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

function StandingTable({ group }: { group: StandingGroup }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          <tr>
            <th className="w-10 px-3 py-2.5"></th>
            <th className="px-2 py-2.5">ทีม</th>
            <th className="px-2 py-2.5 text-center">แข่ง</th>
            <th className="px-2 py-2.5 text-center">ชนะ</th>
            <th className="px-2 py-2.5 text-center">เสมอ</th>
            <th className="px-2 py-2.5 text-center">แพ้</th>
            <th className="px-2 py-2.5 text-center">ผลต่าง</th>
            <th className="px-4 py-2.5 text-center">คะแนน</th>
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
                <td className="whitespace-nowrap px-2 py-2.5 font-medium text-slate-900">{row.teamName}</td>
                <td className="px-2 py-2.5 text-center text-slate-500">{row.played}</td>
                <td className="px-2 py-2.5 text-center text-slate-500">{row.won}</td>
                <td className="px-2 py-2.5 text-center text-slate-500">{row.drawn}</td>
                <td className="px-2 py-2.5 text-center text-slate-500">{row.lost}</td>
                <td className="px-2 py-2.5 text-center text-slate-500">
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
        <p className="text-xs text-slate-400">ยังไม่มีข้อมูล</p>
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
    icon: Venus,
    title: "ฟุตบอลหญิง",
    description: "เวทีการแข่งขันสำหรับนักฟุตบอลหญิงเยาวชน",
  },
  {
    icon: Users,
    title: "รุ่นอายุไม่เกิน 15 ปี",
    description: "เปิดโอกาสให้นักฟุตบอลหญิงรุ่นเยาว์ได้แสดงศักยภาพ",
  },
  {
    icon: Calendar,
    title: "ซีรีส์ปี 2026",
    description: "ส่วนหนึ่งของแผนพัฒนาฟุตบอลหญิงระยะยาวของสมาคมฯ",
  },
];

function formatDateTime(date: Date | null) {
  if (!date) return "ยังไม่กำหนดวันแข่ง";
  return date.toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function G15WomensSeriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const canManage = user.role === "ADMIN" || user.role === "STAFF";

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

  const matchesByRound = matches.reduce<Record<string, typeof matches>>((acc, match) => {
    (acc[match.round] ??= []).push(match);
    return acc;
  }, {});

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

  const matchesContent =
    matches.length === 0 ? (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
        ยังไม่มีนัดการแข่งขัน
      </p>
    ) : (
      <div className="space-y-6">
        {Object.entries(matchesByRound).map(([round, roundMatches]) => (
          <div key={round} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-3">
              <h3 className="font-semibold text-slate-900">{round}</h3>
            </div>
            <ul className="divide-y divide-slate-100">
              {roundMatches.map((match) => (
                <li
                  key={match.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-900">{match.homeTeam.name}</span>
                    {match.status === "FINISHED" ? (
                      <span className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white">
                        {match.homeScore} - {match.awayScore}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">vs</span>
                    )}
                    <span className="font-medium text-slate-900">{match.awayTeam.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateTime(match.matchDate)}
                    </span>
                    {match.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {match.venue}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );

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
                <h3 className="font-bold text-white">{region}</h3>
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
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
        ยังไม่มีผลการแข่งขัน จึงยังไม่มีสถิติให้แสดง
      </p>
    ) : (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "ทีมทั้งหมด", value: teams.length },
            { label: "นัดที่แข่งแล้ว", value: finishedMatches.length },
            { label: "ประตูรวม", value: totalGoals },
            { label: "ประตูเฉลี่ย/นัด", value: avgGoals.toFixed(2) },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="mt-1 text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MiniLeaderboard title="ทีมทำประตูสูงสุด" icon={Target} rows={topScorers} valueOf={(r) => r.goalsFor} />
          <MiniLeaderboard
            title="ทีมเสียประตูน้อยที่สุด"
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
                <h3 className="font-bold text-white">{region}</h3>
                <span className="ml-auto text-xs font-medium text-white/80">{regionTotal} ทีม</span>
              </div>
              <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
                {letters.map((letter) => (
                  <div key={letter}>
                    <p className={`mb-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${style.light} ${style.text}`}>
                      กลุ่ม {letter}
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
                                  {playerCount > 0 && `${playerCount} นักกีฬา`}
                                  {playerCount > 0 && officialCount > 0 && " · "}
                                  {officialCount > 0 && `${officialCount} จนท.`}
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
      <header className="sticky top-0 z-20 border-b border-white/10 bg-indigo-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={LOGO_URL}
              alt="FA Thailand"
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-cover"
            />
            <div>
              <p className="text-sm font-bold text-white">FA Thailand Technical</p>
              <p className="text-[11px] text-indigo-300">หมวด: G15 Women&apos;s Football Series</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {canManage && (
              <Link
                href="/g15-womens-series/manage"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Settings className="h-4 w-4" />
                จัดการข้อมูล
              </Link>
            )}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              กลับหน้าแรก
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-rose-950 via-rose-900 to-fuchsia-800">
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-600 via-amber-400 to-amber-600" />
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-rose-400/20 blur-3xl" />
        <div className="absolute -right-16 top-1/3 h-96 w-96 rounded-full bg-fuchsia-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-white/10 shadow-xl ring-1 ring-white/20">
            <Image
              src={G15_IMAGE_URL}
              alt="G15 Women's Football Series"
              width={112}
              height={112}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            G15 Women&apos;s Football Series 2026
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-rose-100">
            เวทีการแข่งขันฟุตบอลหญิงรุ่นอายุไม่เกิน 15 ปี
            เพื่อส่งเสริมและพัฒนานักฟุตบอลหญิงเยาวชนของไทยสู่เส้นทางความเป็นเลิศ
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {highlights.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-500">{description}</p>
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
          </div>
        ) : (
          <G15Tabs matches={matchesContent} table={tableContent} stats={statsContent} clubs={clubsContent} />
        )}
      </div>
    </div>
  );
}
