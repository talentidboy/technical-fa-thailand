import Link from "next/link";
import { Montserrat } from "next/font/google";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { Reveal } from "@/components/g15/Reveal";
import { TeamBadge } from "@/components/g15/TeamBadge";
import { Countdown } from "@/components/g15/Countdown";
import { BestXIPitch } from "@/components/g15/BestXIPitch";
import { INDIVIDUAL_AWARDS, TEAM_AWARDS, type AwardDef } from "@/lib/g15-awards";
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
  Settings,
  Lock,
  Medal,
  Trophy,
  Users,
  Clock,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { pageMeta } from "@/lib/seo";

const heavy = Montserrat({ weight: ["700", "800", "900"], subsets: ["latin"], display: "swap" });

export const metadata = pageMeta({ title: "รางวัล / Awards — G15 Women's Football Series", description: "รางวัลประจำการแข่งขัน G15 Women's Football Series 2026 — ผู้เล่นยอดเยี่ยม ดาวซัลโว ผู้รักษาประตูยอดเยี่ยม และรางวัลผู้ฝึกสอน", path: "/g15-womens-series/awards" });

const ICON: Record<string, LucideIcon> = {
  MVP: Crown,
  TOP_SCORER: Goal,
  GOLDEN_GLOVE: Hand,
  SPORTSMANSHIP: HeartHandshake,
  BEST_COACH: GraduationCap,
  INSPIRATIONAL_COACH: Sparkles,
};

// สีประจำรางวัล — ใช้กับแสงหลังรูป แถบบนการ์ด ป้ายกำกับ (ตัวหนังสือหลักยังเป็นสีขาว)
type Accent = { text: string; tile: string; bar: string; glow: string; note: string };
const ACCENT: Record<string, Accent> = {
  MVP: {
    text: "text-amber-300",
    tile: "bg-amber-400/15 text-amber-300 ring-amber-300/30",
    bar: "from-amber-200 via-amber-400 to-amber-600",
    glow: "bg-[radial-gradient(closest-side,rgba(251,191,36,0.5),transparent)]",
    note: "bg-amber-400/15 text-amber-200 ring-amber-300/30",
  },
  TOP_SCORER: {
    text: "text-orange-300",
    tile: "bg-orange-400/15 text-orange-300 ring-orange-300/30",
    bar: "from-amber-300 via-orange-400 to-rose-500",
    glow: "bg-[radial-gradient(closest-side,rgba(251,113,60,0.5),transparent)]",
    note: "bg-orange-400/15 text-orange-200 ring-orange-300/30",
  },
  GOLDEN_GLOVE: {
    text: "text-sky-300",
    tile: "bg-sky-400/15 text-sky-300 ring-sky-300/30",
    bar: "from-cyan-300 via-sky-400 to-indigo-500",
    glow: "bg-[radial-gradient(closest-side,rgba(56,189,248,0.45),transparent)]",
    note: "bg-sky-400/15 text-sky-200 ring-sky-300/30",
  },
  SPORTSMANSHIP: {
    text: "text-emerald-300",
    tile: "bg-emerald-400/15 text-emerald-300 ring-emerald-300/30",
    bar: "from-lime-300 via-emerald-400 to-teal-500",
    glow: "bg-[radial-gradient(closest-side,rgba(52,211,153,0.42),transparent)]",
    note: "bg-emerald-400/15 text-emerald-200 ring-emerald-300/30",
  },
  BEST_COACH: {
    text: "text-violet-300",
    tile: "bg-violet-400/15 text-violet-300 ring-violet-300/30",
    bar: "from-fuchsia-300 via-violet-400 to-indigo-500",
    glow: "bg-[radial-gradient(closest-side,rgba(167,139,250,0.45),transparent)]",
    note: "bg-violet-400/15 text-violet-200 ring-violet-300/30",
  },
  INSPIRATIONAL_COACH: {
    text: "text-pink-300",
    tile: "bg-pink-400/15 text-pink-300 ring-pink-300/30",
    bar: "from-rose-300 via-pink-400 to-fuchsia-500",
    glow: "bg-[radial-gradient(closest-side,rgba(244,114,182,0.42),transparent)]",
    note: "bg-pink-400/15 text-pink-200 ring-pink-300/30",
  },
};

const CARD_BG = "bg-[#140c2c]";
// รูปค่อย ๆ จางเป็นโปร่งใสที่ขอบล่าง — กลืนกับพื้น/แสงด้านหลังได้ทุกสี
const FADE_MASK = "mask-[linear-gradient(to_bottom,black_62%,transparent_96%)]";

type Awards = Awaited<ReturnType<typeof loadAwards>>["awards"];
type AwardRow = NonNullable<ReturnType<Awards["get"]>>[number];
type Team = { id: number; name: string; logoUrl: string | null; groupName: string | null };

// หัวข้อ section ชิดซ้าย: ลำดับ + ชื่อไทย / หัวข้อใหญ่ภาษาอังกฤษ
function SectionTitle({ no, en, th }: { no: number; en: string; th: string }) {
  return (
    <div className="mb-8 border-b border-white/10 pb-5">
      <p className="flex items-center gap-2.5 text-xs font-bold tracking-wide text-amber-300">
        <span className={`${heavy.className} text-white/40`}>{String(no).padStart(2, "0")}</span>
        <span className="h-px w-6 bg-amber-300/60" />
        {th}
      </p>
      <h2 className={`${heavy.className} mt-2 text-3xl font-black uppercase leading-none tracking-tight text-white sm:text-5xl`}>{en}</h2>
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

type Winner = NonNullable<ReturnType<typeof winnerOf>>;

// ผู้ได้รับรางวัลทุกคนของรางวัลหนึ่ง (รางวัลร่วม = หลายคน)
function winnersOf(rows: AwardRow[] | undefined): Winner[] {
  return (rows ?? []).map(winnerOf).filter((w): w is Winner => w != null);
}

function WinnerName({ w, className }: { w: Winner; className: string }) {
  return w.href ? (
    <Link href={w.href} className={`${className} hover:text-amber-200`}>
      {w.name}
    </Link>
  ) : (
    <p className={className}>{w.name}</p>
  );
}

function TeamChip({ team, className = "" }: { team: Team; className?: string }) {
  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/7 py-1 pl-1 pr-3 text-xs text-white/80 ring-1 ring-white/10 ${className}`}>
      <TeamBadge team={team} size="sm" />
      <span className="truncate">{team.name}</span>
    </span>
  );
}

// รูปนักกีฬาแบบตัดพื้นหลัง (bust) ยืนชิดขอบล่างของกรอบ — ไม่มีรูป = เบอร์เสื้อตัวใหญ่จาง ๆ
function Bust({ w, h = "h-[112%]" }: { w: Winner; h?: string }) {
  return w.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={w.photoUrl}
      alt={w.name}
      className={`absolute bottom-0 left-1/2 ${h} w-auto max-w-none -translate-x-1/2 object-contain object-bottom drop-shadow-[0_18px_28px_rgba(0,0,0,0.55)] transition-transform duration-700 group-hover:scale-[1.03]`}
    />
  ) : (
    <span className={`${heavy.className} absolute inset-x-0 bottom-6 text-center text-8xl font-black leading-none text-white/20`}>
      {w.number ?? w.name.charAt(0)}
    </span>
  );
}

function CardHeader({ def, ac }: { def: AwardDef; ac: Accent }) {
  const Icon = ICON[def.key] ?? Award;
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className={`${heavy.className} text-[11px] font-extrabold uppercase tracking-[0.18em] ${ac.text}`}>{def.en.replace(/ Award$/, "")}</p>
        <h3 className="mt-1 text-[15px] font-bold leading-snug text-white">{def.th}</h3>
      </div>
      <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ring-1 ${ac.tile}`}>
        <Icon className="h-5 w-5" />
      </span>
    </header>
  );
}

function NoteChip({ note, ac }: { note: string | null | undefined; ac: Accent }) {
  if (!note) return null;
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${ac.note}`}>{note}</span>;
}

// การ์ดรางวัลนักกีฬา: รูป bust บนแสงสีประจำรางวัล + ชื่อ/ทีม/สถิติ — รางวัลร่วม = รูปเรียงคู่กัน
function PlayerAwardCard({ def, rows, delay }: { def: AwardDef; rows: AwardRow[] | undefined; delay: number }) {
  const ac = ACCENT[def.key] ?? ACCENT.MVP;
  const all = winnersOf(rows);
  const w = all[0] ?? null;
  const joint = all.length > 1;
  return (
    <Reveal delay={delay} className="h-full">
      <article
        className={`group relative flex h-full flex-col overflow-hidden rounded-3xl ${CARD_BG} ring-1 ring-white/10 transition duration-500 hover:-translate-y-1 hover:ring-white/25`}
      >
        <div aria-hidden className={`h-1 bg-linear-to-r ${ac.bar}`} />
        <div className="px-5 pt-5">
          <CardHeader def={def} ac={ac} />
        </div>

        <div className={`relative mt-3 aspect-[5/4] overflow-hidden ${FADE_MASK}`}>
          <div aria-hidden className={`absolute left-1/2 top-[60%] h-[125%] w-[125%] -translate-x-1/2 -translate-y-1/2 ${ac.glow} opacity-70 transition-opacity duration-500 group-hover:opacity-100`} />
          {w ? (
            <>
              {!joint && w.number != null && (
                <span aria-hidden className={`${heavy.className} absolute inset-x-0 -top-2 select-none text-center text-[10rem] font-black leading-none tracking-tighter text-white/6`}>
                  {w.number}
                </span>
              )}
              <div className="absolute inset-0 flex justify-center">
                {all.map((x) => (
                  <div key={x.href ?? x.name} className={`relative h-full ${joint ? "flex-1" : "w-full"}`}>
                    <Bust w={x} h={joint ? "h-[96%]" : "h-[112%]"} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-white/20 bg-white/5">
                <UserRound className="h-10 w-10 text-white/25" strokeWidth={1.5} />
              </span>
            </div>
          )}
        </div>

        <div className="relative -mt-8 flex flex-1 flex-col px-5 pb-5">
          {joint ? (
            <>
              <span className="w-fit rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-white/80 ring-1 ring-white/15">
                รางวัลร่วม {all.length} คน · Joint winners
              </span>
              <div className={`mt-3 grid gap-3 ${all.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {all.map((x) => (
                  <div key={x.href ?? x.name} className="min-w-0">
                    <WinnerName w={x} className="line-clamp-2 block text-sm font-black leading-tight text-white" />
                    {x.team && (
                      <span className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[11px] text-white/55">
                        <TeamBadge team={x.team} size="sm" />
                        <span className="truncate">{x.team.name}</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-4">
                <NoteChip note={w?.note} ac={ac} />
              </div>
            </>
          ) : w ? (
            <>
              <WinnerName w={w} className="block text-xl font-black leading-tight text-white" />
              {w.nameEn && <p className="mt-0.5 truncate text-[11px] font-semibold uppercase tracking-wider text-white/40">{w.nameEn}</p>}
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                {w.team && <TeamChip team={w.team} />}
                <NoteChip note={w.note} ac={ac} />
              </div>
            </>
          ) : (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-white/40">
              <Lock className="h-4 w-4" />
              รอประกาศผล
            </p>
          )}
        </div>
      </article>
    </Reveal>
  );
}

// การ์ดรางวัลโค้ช (ไม่มีรูป) — โลโก้ทีมเป็นภาพหลัก + โลโก้จาง ๆ เป็นลายน้ำมุมการ์ด
function CoachAwardCard({ def, rows, delay }: { def: AwardDef; rows: AwardRow[] | undefined; delay: number }) {
  const ac = ACCENT[def.key] ?? ACCENT.BEST_COACH;
  const all = winnersOf(rows);
  const mark = all[0]?.team?.logoUrl ?? null;
  return (
    <Reveal delay={delay} className="h-full">
      <article
        className={`group relative flex h-full flex-col overflow-hidden rounded-3xl ${CARD_BG} ring-1 ring-white/10 transition duration-500 hover:-translate-y-1 hover:ring-white/25`}
      >
        <div aria-hidden className={`h-1 bg-linear-to-r ${ac.bar}`} />
        <div aria-hidden className={`pointer-events-none absolute -right-28 -top-28 h-80 w-80 ${ac.glow} opacity-60`} />
        {mark && (
          // eslint-disable-next-line @next/next/no-img-element
          <img aria-hidden src={mark} alt="" className="pointer-events-none absolute -bottom-12 -right-12 h-60 w-60 rounded-full object-cover opacity-[0.07] grayscale" />
        )}
        <div className="relative flex flex-1 flex-col p-5 sm:p-6">
          <CardHeader def={def} ac={ac} />
          {all.length === 0 ? (
            <div className="mt-8 flex items-center gap-4">
              <span className="flex h-16 w-16 flex-none items-center justify-center rounded-full border border-dashed border-white/20 bg-white/5">
                <Lock className="h-6 w-6 text-white/25" />
              </span>
              <p className="text-sm font-semibold text-white/40">รอประกาศผล</p>
            </div>
          ) : (
            <>
              {all.length > 1 && (
                <span className="mt-5 w-fit rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-white/80 ring-1 ring-white/15">
                  รางวัลร่วม {all.length} คน · Joint winners
                </span>
              )}
              <ul className={`space-y-5 ${all.length > 1 ? "mt-4" : "mt-8"}`}>
                {all.map((x) => (
                  <li key={x.name} className="flex items-center gap-4">
                    {x.team ? (
                      <span className="flex-none rounded-full bg-white p-1 shadow-lg shadow-black/40 ring-4 ring-white/10">
                        <TeamBadge team={x.team} size={all.length > 1 ? "md" : "lg"} />
                      </span>
                    ) : (
                      <span className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-white/10 text-2xl font-black">{x.name.charAt(0)}</span>
                    )}
                    <div className="min-w-0">
                      <p className={`font-black leading-tight text-white ${all.length > 1 ? "text-lg" : "text-2xl"}`}>{x.name}</p>
                      {x.nameEn && <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-white/40">{x.nameEn}</p>}
                      <p className="mt-1 truncate text-sm text-white/60">{[x.sub, x.team?.name].filter(Boolean).join(" · ")}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-6">
                <NoteChip note={all[0].note} ac={ac} />
              </div>
            </>
          )}
        </div>
      </article>
    </Reveal>
  );
}

// MVP: การ์ดใหญ่ — รูป bust ซ้อนบนตัวหนังสือ "MVP" ขนาดยักษ์ + ข้อมูลด้านขวา · MVP ร่วม = รูปเรียงกัน + ชื่อด้านล่าง
function MvpFeature({ mvps }: { mvps: Winner[] }) {
  const ac = ACCENT.MVP;
  const single = mvps.length === 1 ? mvps[0] : null;
  return (
    <div className={`group relative overflow-hidden rounded-[2rem] ${CARD_BG} ring-1 ${mvps.length ? "ring-amber-300/25" : "ring-white/10"}`}>
      <div aria-hidden className={`h-1 bg-linear-to-r ${ac.bar}`} />
      <div aria-hidden className="pointer-events-none absolute -left-40 top-0 h-[38rem] w-[38rem] bg-[radial-gradient(closest-side,rgba(251,191,36,0.3),transparent)]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-48 -right-40 h-[34rem] w-[34rem] bg-[radial-gradient(closest-side,rgba(147,51,234,0.35),transparent)]" />

      {mvps.length === 0 ? (
        <div className="relative flex flex-col items-center px-6 py-20 text-center">
          <span className="flex h-28 w-28 items-center justify-center rounded-full border border-dashed border-white/20 bg-white/5">
            <Crown className="h-12 w-12 text-white/20" />
          </span>
          <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white/45">
            <Lock className="h-4 w-4" />
            รอประกาศผล
          </p>
        </div>
      ) : (
        <div className={`relative grid ${single ? "md:grid-cols-[1fr_1.05fr] md:items-center" : ""}`}>
          {/* เวทีรูป */}
          <div className="relative h-[22rem] sm:h-[28rem]">
            <span
              aria-hidden
              className={`${heavy.className} absolute inset-x-0 top-2 select-none text-center text-[9rem] font-black leading-none tracking-tighter text-white/6 sm:text-[13rem]`}
            >
              MVP
            </span>
            <div aria-hidden className={`absolute bottom-[-30%] left-1/2 h-[110%] w-[110%] -translate-x-1/2 ${ac.glow}`} />
            <div className={`absolute inset-0 flex justify-center ${FADE_MASK} ${single ? "md:[mask-image:none]" : ""}`}>
              {mvps.map((x) => (
                <div key={x.href ?? x.name} className={`relative h-full ${single ? "w-full" : "w-1/2 max-w-sm"}`}>
                  <Bust w={x} h={single ? "h-[104%]" : "h-[96%]"} />
                </div>
              ))}
            </div>
          </div>

          {/* ข้อมูล */}
          {single ? (
            <div className="relative px-6 pb-10 text-center md:py-12 md:pl-0 md:pr-12 md:text-left">
              <span className={`${heavy.className} inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber-300 ring-1 ring-amber-300/30`}>
                <Crown className="h-3.5 w-3.5" />
                Most Valuable Player
              </span>
              <WinnerName w={single} className="mt-5 block text-4xl font-black leading-[1.1] text-white sm:text-5xl" />
              {single.nameEn && <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/40">{single.nameEn}</p>}
              <div className="mt-7 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                {single.team && <TeamChip team={single.team} className="text-sm" />}
                {single.number != null && (
                  <span className={`${heavy.className} rounded-full bg-white/7 px-3 py-1 text-xs font-extrabold text-white/80 ring-1 ring-white/10`}>#{single.number}</span>
                )}
                <NoteChip note={single.note} ac={ac} />
              </div>
            </div>
          ) : (
            <div className="relative px-6 pb-10 text-center">
              <span className={`${heavy.className} inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber-300 ring-1 ring-amber-300/30`}>
                <Crown className="h-3.5 w-3.5" />
                Joint Most Valuable Players
              </span>
              <div className={`mx-auto mt-6 grid max-w-2xl gap-6 ${mvps.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
                {mvps.map((x) => (
                  <div key={x.href ?? x.name} className="flex min-w-0 flex-col items-center">
                    <WinnerName w={x} className="block text-lg font-black leading-tight text-white sm:text-2xl" />
                    {x.team && <TeamChip team={x.team} className="mt-3" />}
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <NoteChip note={mvps[0].note} ac={ac} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// อันดับทีม 1-2-3 — การ์ดเรียงตามลำดับ ตัวเลขใหญ่โปร่งเป็นพื้นหลัง (แทนแท่นโพเดียม)
function StandingCard({ team, n, delay }: { team: Team | null; n: 1 | 2 | 3; delay: number }) {
  const tone = {
    1: {
      card: "bg-linear-to-br from-amber-400/25 via-amber-400/5 to-transparent ring-amber-300/40",
      glow: "bg-amber-400/30",
      chip: "bg-amber-400 text-amber-950",
      ring: "ring-amber-300/70",
      stroke: "[-webkit-text-stroke:2px_rgba(252,211,77,0.35)]",
      en: "Champion",
      th: "ชนะเลิศ",
      icon: Trophy,
    },
    2: {
      card: "bg-linear-to-br from-slate-200/15 via-white/3 to-transparent ring-white/15",
      glow: "bg-slate-200/15",
      chip: "bg-slate-200 text-slate-900",
      ring: "ring-slate-200/60",
      stroke: "[-webkit-text-stroke:2px_rgba(226,232,240,0.22)]",
      en: "Runner-up",
      th: "รองชนะเลิศ",
      icon: Medal,
    },
    3: {
      card: "bg-linear-to-br from-orange-500/20 via-orange-500/3 to-transparent ring-orange-300/25",
      glow: "bg-orange-500/20",
      chip: "bg-orange-300 text-orange-950",
      ring: "ring-orange-300/60",
      stroke: "[-webkit-text-stroke:2px_rgba(253,186,116,0.25)]",
      en: "Third Place",
      th: "อันดับ 3",
      icon: Medal,
    },
  }[n];
  const Icon = tone.icon;
  const body = (
    <>
      <div aria-hidden className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl ${tone.glow}`} />
      <span
        aria-hidden
        className={`${heavy.className} pointer-events-none absolute -bottom-10 right-3 select-none text-[10rem] font-black leading-none text-transparent ${tone.stroke}`}
      >
        {n}
      </span>
      <span className={`${heavy.className} relative inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] ${tone.chip}`}>
        <Icon className="h-3.5 w-3.5" />
        {tone.en}
      </span>
      <div className="relative mt-5 flex items-center gap-4 sm:mt-8 sm:flex-col sm:items-start sm:gap-5">
        {team ? (
          <>
            <span className={`w-fit flex-none rounded-full bg-white p-1 shadow-xl shadow-black/40 ring-4 ${tone.ring} transition-transform duration-500 group-hover:scale-105`}>
              <TeamBadge team={team} size="lg" />
            </span>
            <div className="min-w-0">
              <p className="text-xl font-black leading-tight text-white sm:text-2xl">{team.name}</p>
              <p className="mt-1 text-sm text-white/50">{tone.th}</p>
            </div>
          </>
        ) : (
          <>
            <span className="flex h-20 w-20 flex-none items-center justify-center rounded-full border border-dashed border-white/20">
              <Lock className="h-6 w-6 text-white/30" />
            </span>
            <p className="text-sm font-semibold text-white/40">รอประกาศผล</p>
          </>
        )}
      </div>
    </>
  );
  const cls = `group relative flex h-full flex-col overflow-hidden rounded-3xl p-5 ring-1 transition duration-500 hover:-translate-y-1 sm:p-6 ${tone.card}`;
  return (
    <Reveal delay={delay} className="h-full">
      {team ? (
        <Link href={`/g15-womens-series/teams/${team.id}`} className={cls}>
          {body}
        </Link>
      ) : (
        <div className={cls}>{body}</div>
      )}
    </Reveal>
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
  const teamOf = (key: string) => awards.get(key)?.[0]?.team ?? null;
  const champion = teamOf("CHAMPION");
  const finalUpcoming = !!final?.matchDate && final.status !== "FINISHED" && final.matchDate > now;
  const finalDone = final?.status === "FINISHED" && final.homeScore != null && final.awayScore != null;
  const finalPens = finalDone && final.homePenalty != null && final.awayPenalty != null;

  const mvps = winnersOf(awards.get("MVP"));
  const playerAwards = INDIVIDUAL_AWARDS.filter((a) => a.kind === "player" && a.key !== "MVP");
  const coachAwards = INDIVIDUAL_AWARDS.filter((a) => a.kind === "official");

  // เลขลำดับหัวข้อ (ส่วนอันดับทีมจะแสดงเมื่อประกาศแชมป์แล้ว)
  let no = 0;
  const next = () => ++no;

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
                { icon: Trophy, text: `${TEAM_AWARDS.length} รางวัลทีม` },
                { icon: Award, text: `${INDIVIDUAL_AWARDS.length} รางวัลส่วนบุคคล` },
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

          {/* การ์ดกระจก: ก่อนประกาศ = นัดชิง + นับถอยหลัง, ประกาศแล้ว = ทีมแชมป์ + ผลนัดชิง */}
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
                    {finalDone && (
                      <div className="mt-7 w-full border-t border-white/10 pt-6">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-white/45">นัดชิงชนะเลิศ · Final</p>
                        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                          <span className="flex min-w-0 items-center justify-end gap-2 text-right text-xs font-semibold text-white/75">
                            <span className="line-clamp-2">{final.homeTeam.name}</span>
                            <TeamBadge team={final.homeTeam} size="md" />
                          </span>
                          <span className={`${heavy.className} text-2xl font-black tabular-nums text-white`}>
                            {final.homeScore} – {final.awayScore}
                          </span>
                          <span className="flex min-w-0 items-center gap-2 text-left text-xs font-semibold text-white/75">
                            <TeamBadge team={final.awayTeam} size="md" />
                            <span className="line-clamp-2">{final.awayTeam.name}</span>
                          </span>
                        </div>
                        {finalPens && (
                          <p className="mt-2 text-xs font-semibold text-amber-200/80">
                            ดวลจุดโทษ {final.homePenalty} – {final.awayPenalty}
                          </p>
                        )}
                      </div>
                    )}
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

      <main className="relative mx-auto max-w-6xl space-y-24 px-4 pb-28 pt-6 sm:px-6">
        {/* ===== อันดับทีม ===== */}
        {champion && (
          <section>
            <SectionTitle no={next()} en="Final Standings" th="ทีมที่ประสบความสำเร็จ" />
            <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
              <StandingCard team={champion} n={1} delay={0} />
              <StandingCard team={teamOf("RUNNER_UP")} n={2} delay={120} />
              <StandingCard team={teamOf("THIRD_PLACE")} n={3} delay={240} />
            </div>
          </section>
        )}

        {/* ===== MVP ===== */}
        <section>
          <SectionTitle no={next()} en="Most Valuable Player" th="รางวัลผู้เล่นทรงคุณค่า" />
          <Reveal>
            <MvpFeature mvps={mvps} />
          </Reveal>
        </section>

        {/* ===== รางวัลนักกีฬา ===== */}
        <section>
          <SectionTitle no={next()} en="Player Awards" th="รางวัลส่วนบุคคล" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {playerAwards.map((def, i) => (
              <PlayerAwardCard key={def.key} def={def} rows={awards.get(def.key)} delay={i * 120} />
            ))}
          </div>
        </section>

        {/* ===== รางวัลผู้ฝึกสอน ===== */}
        <section>
          <SectionTitle no={next()} en="Coaching Awards" th="รางวัลผู้ฝึกสอน" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {coachAwards.map((def, i) => (
              <CoachAwardCard key={def.key} def={def} rows={awards.get(def.key)} delay={i * 120} />
            ))}
          </div>
        </section>

        {/* ===== Best XI ===== */}
        <section>
          <SectionTitle no={next()} en="Best XI" th="ทีมยอดเยี่ยมประจำทัวร์นาเมนต์ · 4-3-3" />
          <Reveal>
            <div className="relative mx-auto max-w-5xl">
              {xi.length === 0 && (
                <p className="mx-auto mb-5 w-fit rounded-full bg-white/5 px-5 py-2 text-sm font-bold text-amber-200 ring-1 ring-amber-300/30">
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
