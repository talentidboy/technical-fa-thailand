import Link from "next/link";
import { Bebas_Neue } from "next/font/google";
import { getCurrentUser } from "@/lib/auth";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { HeroArt } from "@/components/g15/HeroArt";
import { Reveal } from "@/components/g15/Reveal";
import { TeamBadge } from "@/components/g15/TeamBadge";
import { ChampionPodium } from "@/components/g15/ChampionPodium";
import { BestXIPitch } from "@/components/g15/BestXIPitch";
import { INDIVIDUAL_AWARDS } from "@/lib/g15-awards";
import { loadAwards } from "@/lib/g15-awards-data";
import { Award, Crown, Goal, Hand, HeartHandshake, GraduationCap, Sparkles, Globe2, Users, Settings, Hourglass } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const display = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap" });

const ICON: Record<string, LucideIcon> = {
  MVP: Crown,
  TOP_SCORER: Goal,
  GOLDEN_GLOVE: Hand,
  SPORTSMANSHIP: HeartHandshake,
  BEST_COACH: GraduationCap,
  INSPIRATIONAL_COACH: Sparkles,
  INTL_DEV_COACH: Globe2,
};

export const metadata = { title: "รางวัล / Awards — G15 Women's Football Series" };

export default async function G15AwardsPage() {
  const [user, { awards, xi }] = await Promise.all([getCurrentUser(), loadAwards()]);
  const canManage = user?.role === "ADMIN" || user?.role === "STAFF";

  const teamOf = (key: string) => awards.get(key)?.team ?? null;
  const champion = teamOf("CHAMPION");
  const anything = awards.size > 0 || xi.length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <G15Chrome user={user} stage="NATIONAL" />

      <section className="relative isolate overflow-hidden bg-linear-to-br from-g15-950 via-g15-800 to-g15-600 pb-20 pt-8 sm:pb-24">
        <div className="absolute inset-x-0 top-0 h-1.5 animate-shimmer-slide bg-linear-to-r from-amber-600 via-amber-200 via-50% to-amber-600 bg-size-[200%_100%]" />
        <HeroArt />
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-3 px-6">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-g15-200">
              <Award className="h-3.5 w-3.5" />
              Awards
            </div>
            <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
              รางวัล <span className="text-base font-normal text-g15-200">/ Awards</span>
            </h1>
            <p className="mt-1 text-sm text-g15-200">FA Thailand G15 Women&apos;s Football Series 2026</p>
          </div>
          {canManage && (
            <Link
              href="/g15-womens-series/manage/awards"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2 text-xs font-semibold text-white ring-1 ring-white/25 hover:bg-white/25"
            >
              <Settings className="h-3.5 w-3.5" />
              จัดการรางวัล
            </Link>
          )}
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-10 max-w-6xl space-y-12 px-6 pb-20 sm:-mt-14">
        {!anything && (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-xl shadow-g15-950/10">
            <Hourglass className="h-9 w-9 text-amber-500" />
            <p className="text-base font-bold text-slate-800">ประกาศรางวัลหลังจบการแข่งขัน</p>
            <p className="text-sm text-slate-500">Awards will be announced after the final</p>
          </div>
        )}

        {/* รางวัลทีม */}
        {champion && (
          <Reveal>
            <ChampionPodium champion={champion} runnerUp={teamOf("RUNNER_UP")} third={teamOf("THIRD_PLACE")} topScorer={null} />
          </Reveal>
        )}

        {/* รางวัลส่วนบุคคล */}
        {anything && (
          <Reveal>
            <section>
              <h2 className="mb-5 flex items-center gap-3">
                <Award className="h-6 w-6 text-amber-500" />
                <span className={`${display.className} text-4xl uppercase leading-none text-g15-900`}>Individual Awards</span>
                <span className="text-sm font-semibold text-slate-400">/ รางวัลส่วนบุคคล</span>
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {INDIVIDUAL_AWARDS.map((def) => {
                  const a = awards.get(def.key);
                  const Icon = ICON[def.key] ?? Award;
                  const person = a?.player ?? a?.official ?? null;
                  const team = a?.player?.team ?? a?.official?.team ?? null;
                  const photo = a?.player?.photoUrl ?? null;
                  return (
                    <div
                      key={def.key}
                      className={`relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm ${
                        person ? "border-amber-200" : "border-dashed border-slate-300"
                      }`}
                    >
                      <div className={`flex items-center gap-3 px-4 py-3 ${person ? "bg-linear-to-r from-g15-950 via-g15-800 to-g15-700 text-white" : "bg-slate-50 text-slate-500"}`}>
                        <span
                          className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${
                            person ? "bg-linear-to-br from-amber-300 to-amber-500 text-amber-950 shadow-md" : "bg-slate-200 text-slate-400"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold leading-snug">{def.th}</span>
                          <span className={`block text-[11px] leading-snug ${person ? "text-g15-200" : "text-slate-400"}`}>{def.en}</span>
                        </span>
                      </div>
                      {person ? (
                        <div className="flex flex-1 items-center gap-3 px-4 py-4">
                          {photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={photo} alt="" className="h-16 w-16 flex-none rounded-full object-cover ring-2 ring-amber-300" />
                          ) : (
                            <span className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-g15-50 text-xl font-black text-g15-700 ring-2 ring-amber-300">
                              {a?.player?.jerseyNumber ?? person.firstNameTh.charAt(0)}
                            </span>
                          )}
                          <div className="min-w-0">
                            {a?.player ? (
                              <Link href={`/g15-womens-series/players/${a.player.id}`} className="block truncate text-base font-extrabold text-slate-900 hover:text-g15-700">
                                {person.firstNameTh} {person.lastNameTh}
                              </Link>
                            ) : (
                              <p className="truncate text-base font-extrabold text-slate-900">
                                {person.firstNameTh} {person.lastNameTh}
                              </p>
                            )}
                            {a?.official?.role && <p className="truncate text-xs text-slate-500">{a.official.role}</p>}
                            {team && (
                              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                <TeamBadge team={team} size="sm" />
                                <span className="truncate">{team.name}</span>
                              </p>
                            )}
                            {a?.note && (
                              <span className="mt-1.5 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">{a.note}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="flex flex-1 items-center justify-center px-4 py-7 text-sm font-medium text-slate-400">รอประกาศผล</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </Reveal>
        )}

        {/* ทีมยอดเยี่ยม */}
        {xi.length > 0 && (
          <Reveal>
            <section>
              <h2 className="mb-5 flex flex-wrap items-center gap-3">
                <Users className="h-6 w-6 text-emerald-600" />
                <span className={`${display.className} text-4xl uppercase leading-none text-g15-900`}>Best XI</span>
                <span className="text-sm font-semibold text-slate-400">/ ทีมยอดเยี่ยม · 4-3-3</span>
              </h2>
              <BestXIPitch picks={xi.map((x) => ({ slot: x.slot, player: x.player }))} />
            </section>
          </Reveal>
        )}
      </div>
    </div>
  );
}
