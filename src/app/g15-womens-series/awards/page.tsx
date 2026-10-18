import Link from "next/link";
import { Bebas_Neue, Montserrat } from "next/font/google";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { Reveal } from "@/components/g15/Reveal";
import { TeamBadge } from "@/components/g15/TeamBadge";
import { Countdown } from "@/components/g15/Countdown";
import { BestXIPitch } from "@/components/g15/BestXIPitch";
import { INDIVIDUAL_AWARDS, type AwardDef } from "@/lib/g15-awards";
import { loadAwards } from "@/lib/g15-awards-data";
import { formatMatchDateTime } from "@/lib/g15";
import {
  Award,
  Crown,
  Goal,
  Hand,
  HeartHandshake,
  GraduationCap,
  Sparkles,
  Globe2,
  Settings,
  Lock,
  Star,
  Trophy,
  Users,
  Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const display = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap" });
const heavy = Montserrat({ weight: ["800", "900"], subsets: ["latin"], display: "swap" });

export const metadata = { title: "รางวัล / Awards — G15 Women's Football Series" };

const ICON: Record<string, LucideIcon> = {
  MVP: Crown,
  TOP_SCORER: Goal,
  GOLDEN_GLOVE: Hand,
  SPORTSMANSHIP: HeartHandshake,
  BEST_COACH: GraduationCap,
  INSPIRATIONAL_COACH: Sparkles,
  INTL_DEV_COACH: Globe2,
};

const GOLD_TEXT = "bg-linear-to-b from-amber-50 via-amber-300 to-amber-600 bg-clip-text text-transparent";

type Awards = Awaited<ReturnType<typeof loadAwards>>["awards"];
type AwardRow = NonNullable<ReturnType<Awards["get"]>>;
type Team = { id: number; name: string; logoUrl: string | null; groupName: string | null };

function SectionTitle({ en, th }: { en: string; th: string }) {
  return (
    <div className="mb-8 flex flex-col items-center text-center">
      <span className="mb-3 h-px w-24 bg-linear-to-r from-transparent via-amber-300 to-transparent" />
      <h2 className={`${display.className} text-5xl leading-none tracking-wide sm:text-6xl ${GOLD_TEXT}`}>{en}</h2>
      <p className="mt-1 text-sm font-semibold text-amber-100/70">{th}</p>
    </div>
  );
}

// ผู้ได้รับรางวัล (นักกีฬา/โค้ช) — รูป, ชื่อ, ทีม
function winnerOf(a: AwardRow | undefined) {
  if (!a) return null;
  const person = a.player ?? a.official;
  if (!person) return null;
  return {
    name: `${person.firstNameTh} ${person.lastNameTh}`,
    nameEn: [person.firstNameEn, person.lastNameEn].filter(Boolean).join(" ") || null,
    sub: a.official?.role ?? null,
    photoUrl: a.player?.photoUrl ?? null,
    number: a.player?.jerseyNumber ?? null,
    team: a.player?.team ?? a.official?.team ?? null,
    href: a.player ? `/g15-womens-series/players/${a.player.id}` : null,
    note: a.note,
  };
}

function Portrait({ w, size }: { w: NonNullable<ReturnType<typeof winnerOf>>; size: "md" | "xl" }) {
  const box = size === "xl" ? "h-36 w-36 sm:h-44 sm:w-44 text-6xl" : "h-24 w-24 text-4xl";
  return w.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={w.photoUrl} alt="" className={`${box} rounded-full object-cover`} />
  ) : (
    <span className={`${box} ${display.className} flex items-center justify-center rounded-full bg-linear-to-br from-g15-700 to-g15-950 text-amber-200`}>
      {w.number ?? w.name.charAt(0)}
    </span>
  );
}

// การ์ดรางวัล (ขอบทองไล่เฉด + เหรียญไอคอนลอยด้านบน) — ยังไม่ประกาศ = เงาล็อก
function AwardCard({ def, a, delay }: { def: AwardDef; a: AwardRow | undefined; delay: number }) {
  const Icon = ICON[def.key] ?? Award;
  const w = winnerOf(a);
  return (
    <Reveal delay={delay} className="h-full">
      <div className={`group relative h-full rounded-3xl p-px ${w ? "bg-linear-to-b from-amber-200 via-amber-500/40 to-amber-900/30" : "bg-white/10"}`}>
        {/* เหรียญไอคอนลอยเหนือขอบการ์ด (อยู่นอกกล่องที่ตัดขอบ จึงไม่ถูกตัดครึ่ง) */}
        <span
          className={`absolute -top-7 left-1/2 z-10 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full ring-4 ring-[#0b0618] ${
            w ? "bg-linear-to-br from-amber-200 via-amber-400 to-amber-600 text-amber-950 shadow-[0_0_30px_rgba(252,211,77,0.45)]" : "bg-[#1d0f42] text-white/40"
          }`}
        >
          <Icon className="h-6 w-6" />
        </span>
        <div className="relative flex h-full flex-col items-center overflow-hidden rounded-[calc(1.5rem-1px)] bg-linear-to-b from-[#1d0f42] to-[#0d0720] px-5 pb-7 pt-12 text-center">
          {w && <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_top,rgba(252,211,77,0.22),transparent_70%)]" />}
          <p className={`relative text-[11px] font-black uppercase tracking-[0.18em] ${w ? "text-amber-300" : "text-white/40"}`}>{def.en.replace(" Award", "")}</p>
          <p className="relative mt-1 text-sm font-semibold leading-snug text-white/80">{def.th}</p>

          {w ? (
            <>
              <span className="relative mt-5 rounded-full bg-linear-to-br from-amber-200 to-amber-600 p-1 shadow-[0_0_40px_rgba(252,211,77,0.25)] transition-transform duration-500 group-hover:scale-105">
                <Portrait w={w} size="md" />
              </span>
              {w.href ? (
                <Link href={w.href} className="relative mt-4 text-lg font-extrabold leading-tight text-white hover:text-amber-200">
                  {w.name}
                </Link>
              ) : (
                <p className="relative mt-4 text-lg font-extrabold leading-tight text-white">{w.name}</p>
              )}
              {w.nameEn && <p className="relative text-[11px] uppercase tracking-wider text-white/40">{w.nameEn}</p>}
              {w.sub && <p className="relative mt-0.5 text-xs text-amber-100/70">{w.sub}</p>}
              {w.team && (
                <span className="relative mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/5 py-1 pl-1 pr-3 text-xs text-white/80 ring-1 ring-white/10">
                  <TeamBadge team={w.team} size="sm" />
                  {w.team.name}
                </span>
              )}
              {w.note && (
                <span className="relative mt-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-amber-950 shadow-lg shadow-amber-900/40">
                  {w.note}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="relative mt-5 flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-white/15 bg-white/5">
                <Lock className="h-8 w-8 text-white/25" />
              </span>
              <p className="relative mt-4 text-sm font-semibold text-white/40">รอประกาศผล</p>
            </>
          )}
        </div>
      </div>
    </Reveal>
  );
}

// โพเดียม: ที่ 2 ซ้าย · แชมป์กลาง (สูงสุด มีแสงหมุนด้านหลัง) · ที่ 3 ขวา
function ChampionStage({ champion, runnerUp, third }: { champion: Team; runnerUp: Team | null; third: Team | null }) {
  const place = (team: Team | null, n: 1 | 2 | 3) => {
    const tone = {
      1: { block: "h-44 sm:h-56 from-amber-200 via-amber-400 to-amber-700", ring: "ring-amber-300", label: "แชมป์ / Champion", num: "text-amber-950/80" },
      2: { block: "h-32 sm:h-40 from-slate-100 via-slate-300 to-slate-500", ring: "ring-slate-200", label: "รองแชมป์ / Runner-up", num: "text-slate-700/80" },
      3: { block: "h-24 sm:h-28 from-orange-200 via-orange-400 to-orange-800", ring: "ring-orange-300", label: "อันดับ 3 / Third", num: "text-orange-950/70" },
    }[n];
    return (
      <div className="flex flex-col items-center">
        {team ? (
          <Link href={`/g15-womens-series/teams/${team.id}`} className="group mb-4 flex flex-col items-center text-center">
            {n === 1 && <Crown className="animate-float-y mb-2 h-9 w-9 text-amber-300 drop-shadow-[0_0_12px_rgba(252,211,77,0.8)]" />}
            <span className="relative">
              {n === 1 && (
                <span
                  aria-hidden
                  className="absolute -inset-10 animate-[spin_18s_linear_infinite] rounded-full bg-[repeating-conic-gradient(from_0deg,rgba(252,211,77,0.35)_0deg_8deg,transparent_8deg_24deg)] mask-[radial-gradient(circle,black_35%,transparent_70%)]"
                />
              )}
              <span className={`relative block rounded-full bg-white p-1.5 ring-4 ${tone.ring} shadow-2xl transition-transform duration-500 group-hover:scale-105`}>
                <TeamBadge team={team} size={n === 1 ? "xl" : "lg"} />
              </span>
            </span>
            <span className={`mt-3 line-clamp-2 font-extrabold leading-tight ${n === 1 ? "text-lg text-amber-100 sm:text-2xl" : "text-sm text-white sm:text-base"}`}>
              {team.name}
            </span>
            <span className={`mt-1 text-[10px] font-bold uppercase tracking-widest sm:text-[11px] ${n === 1 ? "text-amber-300" : "text-white/50"}`}>{tone.label}</span>
          </Link>
        ) : (
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-white/20">
            <Lock className="h-6 w-6 text-white/30" />
          </div>
        )}
        <div className={`relative w-full overflow-hidden rounded-t-2xl bg-linear-to-b ${tone.block} shadow-[0_-10px_40px_rgba(0,0,0,0.35)]`}>
          <div aria-hidden className="absolute inset-x-0 top-0 h-1/3 bg-linear-to-b from-white/50 to-transparent" />
          <span className={`${display.className} absolute inset-0 flex items-center justify-center text-6xl sm:text-8xl ${tone.num}`}>{n}</span>
        </div>
      </div>
    );
  };
  return (
    <section>
      <SectionTitle en="Champions" th="ทีมที่ประสบความสำเร็จ" />
      <div className="relative mx-auto max-w-4xl">
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-[30rem] w-[42rem] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(252,211,77,0.2),transparent)]" />
        <div className="relative grid grid-cols-3 items-end gap-2 sm:gap-5">
          {place(runnerUp, 2)}
          {place(champion, 1)}
          {place(third, 3)}
        </div>
        <div className="h-3 rounded-b-xl bg-linear-to-r from-transparent via-white/15 to-transparent" />
      </div>
    </section>
  );
}

export default async function G15AwardsPage() {
  const [user, { awards, xi }, final] = await Promise.all([
    getCurrentUser(),
    loadAwards(),
    prisma.g15Match.findFirst({
      where: { stage: "NATIONAL", matchNo: 16 },
      include: { homeTeam: true, awayTeam: true },
    }),
  ]);
  const canManage = user?.role === "ADMIN" || user?.role === "STAFF";
  const now = new Date();
  const teamOf = (key: string) => awards.get(key)?.team ?? null;
  const champion = teamOf("CHAMPION");
  const finalUpcoming = !!final?.matchDate && final.status !== "FINISHED" && final.matchDate > now;

  const mvpDef = INDIVIDUAL_AWARDS.find((a) => a.key === "MVP")!;
  const mvp = winnerOf(awards.get("MVP"));
  const playerAwards = INDIVIDUAL_AWARDS.filter((a) => a.kind === "player" && a.key !== "MVP");
  const coachAwards = INDIVIDUAL_AWARDS.filter((a) => a.kind === "official");

  return (
    <div className="min-h-screen overflow-x-clip bg-[#0b0618] text-white">
      <G15Chrome user={user} stage="NATIONAL" />

      {/* ===== HERO — โทนมืดทันสมัย: แสงฟุ้งสีแบรนด์ + ตารางจาง ๆ, หัวข้อชิดซ้าย, การ์ดกระจกด้านขวา ===== */}
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="absolute -left-40 -top-48 -z-10 h-[34rem] w-[34rem] rounded-full bg-fuchsia-600/30 blur-[120px]" />
        <div aria-hidden className="absolute -right-40 top-0 -z-10 h-[32rem] w-[32rem] rounded-full bg-indigo-600/35 blur-[120px]" />
        <div aria-hidden className="absolute -bottom-56 left-1/3 -z-10 h-[28rem] w-[28rem] rounded-full bg-amber-400/15 blur-[120px]" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[56px_56px] mask-[radial-gradient(ellipse_at_center,black_25%,transparent_75%)]"
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-linear-to-b from-transparent to-[#0b0618]" />

        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-14 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 ring-1 ring-white/10 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_#fbbf24]" />
              FA Thailand · G15 Women&apos;s Football Series
            </span>
            <h1 className={`${heavy.className} mt-6 text-6xl font-black leading-[0.9] tracking-tight sm:text-8xl`}>
              <span className="block bg-linear-to-br from-white via-white to-g15-300 bg-clip-text text-transparent">AWARDS</span>
              <span className="block text-transparent [-webkit-text-stroke:2px_rgba(251,191,36,0.9)]">2026</span>
            </h1>
            <p className="mt-6 text-xl font-bold text-white sm:text-2xl">รางวัลแห่งเกียรติยศประจำทัวร์นาเมนต์</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/60">
              ทีมแชมป์ รางวัลส่วนบุคคล และทีมยอดเยี่ยม (Best XI) ของรอบชิงแชมป์ประเทศ
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { icon: Trophy, text: "3 รางวัลทีม" },
                { icon: Award, text: "7 รางวัลส่วนบุคคล" },
                { icon: Users, text: "Best XI · 4-3-3" },
              ].map(({ icon: Icon, text }) => (
                <span key={text} className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 ring-1 ring-white/10">
                  <Icon className="h-3.5 w-3.5 text-amber-300" />
                  {text}
                </span>
              ))}
            </div>
            {canManage && (
              <Link
                href="/g15-womens-series/manage/awards"
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white"
              >
                <Settings className="h-3.5 w-3.5" />
                จัดการรางวัล
              </Link>
            )}
          </div>

          {/* การ์ดกระจก: ก่อนประกาศ = นัดชิง + นับถอยหลัง, ประกาศแล้ว = ทีมแชมป์ */}
          <div className="relative">
            <div aria-hidden className="absolute -inset-4 -z-10 rounded-[2rem] bg-linear-to-br from-fuchsia-500/20 via-transparent to-amber-400/20 blur-2xl" />
            <div className="rounded-3xl bg-linear-to-br from-white/25 via-white/5 to-white/10 p-px">
              <div className="rounded-[calc(1.5rem-1px)] bg-[#120a28]/85 p-6 backdrop-blur-xl sm:p-8">
                {champion ? (
                  <div className="flex flex-col items-center text-center">
                    <span className="rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-300 ring-1 ring-amber-300/30">
                      Champion 2026
                    </span>
                    <Link href={`/g15-womens-series/teams/${champion.id}`} className="group mt-6 flex flex-col items-center">
                      <span className="rounded-full bg-white p-2 shadow-[0_0_60px_rgba(251,191,36,0.35)] ring-4 ring-amber-300/70 transition-transform group-hover:scale-105">
                        <TeamBadge team={champion} size="xl" />
                      </span>
                      <span className="mt-5 text-2xl font-black leading-tight text-white sm:text-3xl">{champion.name}</span>
                    </Link>
                    <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-200/80">
                      <Crown className="h-4 w-4" />
                      แชมป์ประเทศไทย
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-300 ring-1 ring-amber-300/30">
                        Final · ชิงชนะเลิศ
                      </span>
                      {final?.matchDate && <span className="text-xs text-white/50">{formatMatchDateTime(final.matchDate)}</span>}
                    </div>
                    {final ? (
                      <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        {[final.homeTeam, final.awayTeam].map((t, i) => (
                          <span key={t.id} className={`flex flex-col items-center gap-3 text-center ${i === 1 ? "order-3" : ""}`}>
                            <span className="rounded-full bg-white p-1.5 shadow-xl ring-1 ring-white/20">
                              <TeamBadge team={t} size="lg" />
                            </span>
                            <span className="line-clamp-2 text-sm font-bold leading-snug text-white/90">{t.name}</span>
                          </span>
                        ))}
                        <span className={`${heavy.className} order-2 text-lg font-black text-white/40`}>VS</span>
                      </div>
                    ) : (
                      <p className="mt-6 text-sm text-white/50">ยังไม่มีนัดชิงชนะเลิศ</p>
                    )}
                    {finalUpcoming ? (
                      <div className="mt-7 border-t border-white/10 pt-6 text-center">
                        <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-white/50">เริ่มใน / Kick-off in</p>
                        <Countdown target={final!.matchDate!.toISOString()} serverNow={now.getTime()} />
                      </div>
                    ) : null}
                    <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-white/50">
                      <Clock className="h-3.5 w-3.5" />
                      ประกาศรางวัลหลังจบนัดชิงชนะเลิศ
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="relative mx-auto max-w-6xl space-y-24 px-4 pb-28 sm:px-6">
        {/* ===== ทีมแชมป์ ===== */}
        {champion && (
          <Reveal>
            <ChampionStage champion={champion} runnerUp={teamOf("RUNNER_UP")} third={teamOf("THIRD_PLACE")} />
          </Reveal>
        )}

        {/* ===== MVP ===== */}
        <section>
          <SectionTitle en="Most Valuable Player" th={mvpDef.th} />
          <Reveal>
            <div className={`relative mx-auto max-w-4xl rounded-[2rem] p-[1.5px] ${mvp ? "bg-linear-to-br from-amber-100 via-amber-500 to-amber-900" : "bg-white/10"}`}>
              <div className="relative overflow-hidden rounded-[calc(2rem-1.5px)] bg-linear-to-br from-[#26114f] via-[#150833] to-[#07040f] px-6 py-10 sm:px-12 sm:py-14">
                <div aria-hidden className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(252,211,77,0.25),transparent_65%)]" />
                <Star aria-hidden className="absolute right-8 top-8 h-24 w-24 text-amber-300/10" />
                {mvp ? (
                  <div className="relative grid items-center gap-8 sm:grid-cols-[auto_1fr]">
                    <div className="relative mx-auto">
                      <span
                        aria-hidden
                        className="absolute -inset-8 animate-[spin_24s_linear_infinite] rounded-full bg-[repeating-conic-gradient(from_0deg,rgba(252,211,77,0.35)_0deg_6deg,transparent_6deg_20deg)] mask-[radial-gradient(circle,black_45%,transparent_72%)]"
                      />
                      <Crown className="absolute -top-9 left-1/2 h-10 w-10 -translate-x-1/2 text-amber-300 drop-shadow-[0_0_14px_rgba(252,211,77,0.9)]" />
                      <span className="relative block rounded-full bg-linear-to-br from-amber-100 via-amber-400 to-amber-700 p-1.5 shadow-[0_0_70px_rgba(252,211,77,0.4)]">
                        <Portrait w={mvp} size="xl" />
                      </span>
                    </div>
                    <div className="text-center sm:text-left">
                      <p className={`${display.className} text-5xl leading-none sm:text-6xl ${GOLD_TEXT}`}>MVP</p>
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.25em] text-amber-200/70">Most Valuable Player</p>
                      {mvp.href ? (
                        <Link href={mvp.href} className="mt-4 block text-3xl font-black leading-tight text-white hover:text-amber-200 sm:text-4xl">
                          {mvp.name}
                        </Link>
                      ) : (
                        <p className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl">{mvp.name}</p>
                      )}
                      {mvp.nameEn && <p className="mt-1 text-sm uppercase tracking-widest text-white/40">{mvp.nameEn}</p>}
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        {mvp.team && (
                          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3.5 text-sm text-white ring-1 ring-white/15">
                            <TeamBadge team={mvp.team} size="md" />
                            {mvp.team.name}
                          </span>
                        )}
                        {mvp.number != null && (
                          <span className="rounded-full bg-white/10 px-3 py-1.5 font-mono text-sm font-black text-amber-200 ring-1 ring-white/15">#{mvp.number}</span>
                        )}
                        {mvp.note && <span className="rounded-full bg-amber-400 px-3.5 py-1.5 text-sm font-black text-amber-950">{mvp.note}</span>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative flex flex-col items-center py-6 text-center">
                    <span className="flex h-36 w-36 items-center justify-center rounded-full border-2 border-dashed border-white/15 bg-white/5">
                      <Crown className="h-14 w-14 text-white/20" />
                    </span>
                    <p className="mt-5 text-base font-bold text-white/50">รอประกาศผล</p>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </section>

        {/* ===== รางวัลนักกีฬา ===== */}
        <section>
          <SectionTitle en="Player Awards" th="รางวัลส่วนบุคคล" />
          <div className="grid grid-cols-1 gap-x-5 gap-y-14 pt-7 sm:grid-cols-3">
            {playerAwards.map((def, i) => (
              <AwardCard key={def.key} def={def} a={awards.get(def.key)} delay={i * 120} />
            ))}
          </div>
        </section>

        {/* ===== รางวัลผู้ฝึกสอน ===== */}
        <section>
          <SectionTitle en="Coaching Awards" th="รางวัลผู้ฝึกสอน" />
          <div className="grid grid-cols-1 gap-x-5 gap-y-14 pt-7 sm:grid-cols-3">
            {coachAwards.map((def, i) => (
              <AwardCard key={def.key} def={def} a={awards.get(def.key)} delay={i * 120} />
            ))}
          </div>
        </section>

        {/* ===== Best XI ===== */}
        <section>
          <SectionTitle en="Best XI" th="ทีมยอดเยี่ยมประจำทัวร์นาเมนต์ · 4-3-3" />
          <Reveal>
            <div className="relative mx-auto max-w-5xl">
              {xi.length === 0 && (
                <p className="mx-auto -mt-3 mb-5 w-fit rounded-full bg-white/5 px-5 py-2 text-sm font-bold text-amber-200 ring-1 ring-amber-300/30">
                  <Lock className="mr-1.5 inline h-4 w-4" />
                  ประกาศหลังจบการแข่งขัน
                </p>
              )}
              <BestXIPitch picks={xi.map((x) => ({ slot: x.slot, player: x.player }))} />
            </div>
          </Reveal>
        </section>

        <p className="text-center text-xs text-white/30">FA Thailand · Technical Department</p>
      </main>
    </div>
  );
}
