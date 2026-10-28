import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseRegionGroup, regionEn } from "@/lib/g15-region";
import { parseStage, NATIONAL_GROUPS } from "@/lib/g15-stage";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { HeroArt } from "@/components/g15/HeroArt";
import { StageSwitcher } from "@/components/g15/StageSwitcher";
import { TeamsGrid, type TeamWithCounts } from "@/components/g15/TeamsGrid";
import { Reveal } from "@/components/g15/Reveal";
import Link from "next/link";
import { Bebas_Neue } from "next/font/google";
import { TeamBadge } from "@/components/g15/TeamBadge";
import { getNationalStandings } from "@/lib/g15";
import { Users, MapPin, Shirt, ChevronRight } from "lucide-react";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "ทีมที่เข้าร่วม — G15 Women's Football Series", description: "ทีมที่เข้าร่วมการแข่งขัน G15 Women's Football Series 2026 ทุกภูมิภาค", path: "/g15-womens-series/teams" });

const display = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap" });

// สีประจำกลุ่ม (ชุดเดียวกับป้ายกลุ่มทั่วเว็บ)
const GROUP_TONE: Record<string, { grad: string; text: string }> = {
  A: { grad: "from-indigo-800 via-indigo-600 to-indigo-500", text: "text-indigo-700" },
  B: { grad: "from-fuchsia-800 via-fuchsia-600 to-fuchsia-500", text: "text-fuchsia-700" },
};

export default async function G15TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const stage = parseStage((await searchParams).stage);

  const [user, teams, players, officials, nationalMatches] = await Promise.all([
    getCurrentUser(),
    prisma.g15Team.findMany({ orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
    // แค่ตัวนับต่อทีมสำหรับหน้ารวม — รายละเอียดเต็มไปอยู่หน้าโปรไฟล์ทีมแทน
    prisma.g15Player.groupBy({ by: ["teamId"], where: { isActive: true }, _count: { id: true } }),
    prisma.g15Official.groupBy({ by: ["teamId"], where: { isActive: true }, _count: { id: true } }),
    prisma.g15Match.findMany({ where: { stage: "NATIONAL" } }),
  ]);

  const playerCountByTeam = new Map(players.map((p) => [p.teamId, p._count.id]));
  const officialCountByTeam = new Map(officials.map((o) => [o.teamId, o._count.id]));

  const withCounts = (t: (typeof teams)[number]): TeamWithCounts => ({
    id: t.id,
    name: t.name,
    logoUrl: t.logoUrl,
    groupName: t.groupName,
    playerCount: playerCountByTeam.get(t.id) ?? 0,
    officialCount: officialCountByTeam.get(t.id) ?? 0,
  });

  const nationalTeams = teams
    .filter((t) => t.nationalGroup)
    .sort((a, b) => (a.nationalGroup ?? "").localeCompare(b.nationalGroup ?? "") || (a.nationalSeed ?? 99) - (b.nationalSeed ?? 99));
  const shownTeams = stage === "NATIONAL" ? nationalTeams : teams;
  // อันดับ/แต้มในกลุ่ม (โชว์เมื่อแข่งไปแล้ว)
  const standingByTeam = new Map<number, { rank: number; played: number; points: number }>();
  for (const g of getNationalStandings(teams, nationalMatches)) {
    g.rows.forEach((r, i) => standingByTeam.set(r.teamId, { rank: i + 1, played: r.played, points: r.points }));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <G15Chrome user={user} stage={stage} />

      {/* ฮีโร่ไล่สีชุดเดียวกับหน้าอื่นๆ ของ G15 — เนื้อหาหลักลอยทับขอบล่างให้ภาษาภาพเป็นชุดเดียวกันทั้งเว็บ */}
      <section className="relative isolate overflow-hidden bg-linear-to-br from-g15-950 via-g15-800 to-g15-600 pb-20 pt-8 sm:pb-24">
        <div className="absolute inset-x-0 top-0 h-1.5 animate-shimmer-slide bg-linear-to-r from-amber-600 via-amber-200 via-50% to-amber-600 bg-size-[200%_100%]" />
        <HeroArt />
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-g15-200">
            <Users className="h-3.5 w-3.5" />
            Teams
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
            ทีมที่เข้าร่วม <span className="text-base font-normal text-g15-200">/ Teams</span>
          </h1>
          <StageSwitcher stage={stage} basePath="/g15-womens-series/teams" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-20">
        {shownTeams.length === 0 ? (
          <div className="relative z-10 -mt-10 flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-xl shadow-g15-950/10 sm:-mt-14">
            <Users className="h-8 w-8 text-slate-400" />
            <p className="text-sm text-slate-500">ยังไม่มีทีมเข้าร่วม</p>
            <p className="text-xs text-slate-400">No teams yet</p>
          </div>
        ) : stage === "NATIONAL" ? (
          <div className="relative z-10 -mt-10 space-y-10 sm:-mt-14">
            {NATIONAL_GROUPS.map((group) => {
              const tone = GROUP_TONE[group] ?? GROUP_TONE.A;
              const groupTeams = nationalTeams.filter((t) => t.nationalGroup === group);
              if (groupTeams.length === 0) return null;
              return (
                <Reveal key={group}>
                  <section className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-g15-950/10 ring-1 ring-slate-200">
                    {/* หัวกลุ่ม */}
                    <div className={`relative isolate flex items-end justify-between gap-3 overflow-hidden bg-linear-to-r ${tone.grad} px-5 py-4 sm:px-7 sm:py-5`}>
                      <span
                        aria-hidden
                        className={`${display.className} pointer-events-none absolute -bottom-8 right-4 -z-10 select-none text-[9rem] leading-none text-white/10`}
                      >
                        {group}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-white/75">รอบชิงแชมป์ประเทศ / National Round</p>
                        <h2 className={`${display.className} text-5xl leading-none text-white`}>
                          Group {group} <span className="font-sans text-lg font-bold">/ กลุ่ม {group}</span>
                        </h2>
                      </div>
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/25">{groupTeams.length} ทีม</span>
                    </div>

                    {/* การ์ดทีม */}
                    <div className="grid grid-cols-2 gap-2.5 p-3 sm:gap-4 sm:p-6 lg:grid-cols-4">
                      {groupTeams.map((t) => {
                        const region = parseRegionGroup(t.groupName)?.region ?? null;
                        const st = standingByTeam.get(t.id);
                        const c = withCounts(t);
                        return (
                          <Link
                            key={t.id}
                            href={`/g15-womens-series/teams/${t.id}`}
                            className="group relative flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-g15-950/15 hover:ring-g15-300"
                          >
                            {/* แถบสีกลุ่ม + โลโก้จางด้านหลัง */}
                            <div className={`relative isolate h-20 overflow-hidden bg-linear-to-br ${tone.grad}`}>
                              {t.logoUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={t.logoUrl}
                                  alt=""
                                  aria-hidden
                                  className="absolute -right-4 -top-6 -z-10 h-32 w-32 rounded-full object-cover opacity-20 grayscale"
                                />
                              )}
                              <span className={`${display.className} absolute left-3 top-2 rounded-lg bg-white px-2 pt-0.5 text-2xl leading-tight ${tone.text}`}>
                                {group}
                                {t.nationalSeed ?? ""}
                              </span>
                              {st && st.played > 0 && (
                                <span className="absolute right-2 top-2.5 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-black text-amber-950 sm:right-3 sm:top-3 sm:px-2.5 sm:text-[11px]">
                                  อันดับ {st.rank} · {st.points} แต้ม
                                </span>
                              )}
                            </div>
                            <div className="relative z-10 -mt-10 flex flex-1 flex-col items-center px-2.5 pb-3 text-center sm:px-4 sm:pb-4">
                              <span className="rounded-full bg-white p-1.5 shadow-lg ring-4 ring-white transition-transform duration-300 group-hover:scale-105">
                                <TeamBadge team={t} size="lg" />
                              </span>
                              <h3 className="mt-3 line-clamp-2 min-h-[2.5rem] text-[13px] font-extrabold leading-snug text-g15-950 sm:min-h-[2.75rem] sm:text-[15px]">{t.name}</h3>
                              {region && (
                                <p className="mt-1 flex flex-wrap items-center justify-center gap-x-1 text-[11px] font-medium text-slate-500">
                                  <MapPin className="h-3 w-3 flex-none" />
                                  ตัวแทน{region} <span className="text-slate-400">/ {regionEn(region)}</span>
                                </p>
                              )}
                              <div className="mt-3 flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-500">
                                <span className="inline-flex items-center gap-1">
                                  <Shirt className="h-3.5 w-3.5 text-g15-500" />
                                  {c.playerCount} นักกีฬา
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Users className="h-3.5 w-3.5 text-g15-500" />
                                  {c.officialCount} เจ้าหน้าที่
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="absolute bottom-4 right-3 hidden h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-g15-500 lg:block" />
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                </Reveal>
              );
            })}
          </div>
        ) : (
          <Reveal>
            <div className="relative z-10 -mt-10 sm:-mt-14">
              <TeamsGrid teams={teams.map(withCounts)} />
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
