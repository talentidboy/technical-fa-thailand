import Link from "next/link";
import Image from "next/image";
import { G15_IMAGE_URL, GRASSROOTS_LOGO_URL, PLAY_AND_LEARN_ELEMENTS, PLAY_AND_LEARN_LOGO_URL, PLAY_AND_LEARN_MASCOT, PLAY_AND_LEARN_PASSPORT_URLS, TALENT_ID_LOGO_URL } from "@/lib/brand";
import { GRASSROOTS_YEAR, grassrootsCoaches, grassrootsPlayers } from "@/lib/grassroots-data";
import { LEVEL_META, type AcademyLevel } from "@/lib/academy";
import { formatMatchDateShort, formatMatchTimeShort } from "@/lib/g15";
import { academyBg, coachCentreBg, g15Bg, grassrootsBg, talentIdBg } from "@/lib/section-images";
import { TRAINING_CENTRE_AREAS } from "@/lib/constants";
import { display } from "@/components/fonts";
import { AcademyLogo, CoachCentreLogo, DataCentreLogo } from "@/components/SectionLogos";
import { LicenceFan } from "@/components/coach/LicenceFan";
import { levelTone } from "@/components/coach/CoachUi";
import { MEDAL, Medal } from "@/components/academy/Medal";
import { TeamBadge } from "@/components/g15/TeamBadge";
import { TacticsBoard } from "@/components/training/TacticsBoard";
import { AREA_INFO } from "@/components/training/areas";
import { academyFont } from "@/components/typefaces/academy";
import { grassrootsFont } from "@/components/typefaces/grassroots";
import { talentFont } from "@/components/typefaces/talent";
import { markerFont, trainingFont } from "@/components/typefaces/training";
import coachUi from "@/components/coach/coach.module.css";
import festival from "@/app/grassroots-football/grassroots.module.css";
import styles from "./showcase.module.css";
import { ArrowRight, ArrowUpRight, Lock, Trophy } from "lucide-react";

// สไลด์แนะนำหมวดงานบนหน้าแรก (ใช้ใน ShowcaseCarousel) — แต่ละสไลด์เต็มความกว้างในสไตล์ของหมวดนั้นเอง
// ทุกสไลด์ h-full + จัดเนื้อหากึ่งกลางแนวตั้ง เพราะสไลด์ซ้อนกันในช่องเดียวที่สูงเท่าสไลด์ที่สูงที่สุด · บนมือถือซ่อนส่วนรองให้สไลด์สั้นใกล้เคียงกัน

const h = display.className;
const TZ = { timeZone: "Asia/Bangkok" } as const;
const wrap = "mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:py-16";

// ป้ายชื่อหมวดแบบอังกฤษตัวเล็ก สีตามหมวด
function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] ${className}`}>
      <span className="h-px w-8 bg-current opacity-60" />
      <span className="whitespace-nowrap">{children}</span>
    </p>
  );
}

// ================= ศูนย์อบรมผู้ฝึกสอน: กรมท่าเข้ม + ทอง · บัตรใบอนุญาตเรียงแบบไพ่ · บันไดระดับ · ตั๋วรุ่นอบรม =================
export type CoachLevel = { level: string; n: number };
export type OpenSession = { id: number; course: string; name: string; venue: string | null; start: Date | null; daysLeft: number | null };

export function CoachShowcase({ href, locked, levels, total, sessions }: { href: string; locked: boolean; levels: CoachLevel[]; total: number; sessions: OpenSession[] }) {
  const max = Math.max(1, ...levels.map((l) => l.n));
  return (
    <div className="relative isolate flex h-full items-center overflow-hidden bg-[#031a2c] text-white">
      <div className="absolute inset-y-0 right-0 -z-10 hidden w-[55%] lg:block">
        <Image src={coachCentreBg} alt="" fill sizes="55vw" placeholder="blur" className="object-cover opacity-30" style={{ objectPosition: "50% 25%" }} />
        <div className="absolute inset-0 bg-linear-to-r from-[#031a2c] via-[#031a2c]/70 to-[#031a2c]/30" />
      </div>
      <div className={`${wrap} grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:items-center`}>
        <div>
          <Eyebrow className="text-[#e3bb63]">Coach Education</Eyebrow>
          <CoachCentreLogo tone="white" className="mt-6 h-10 sm:h-12" />
          <h2 className={`${h} mt-5 text-4xl font-semibold leading-[1.05] sm:text-6xl`}>
            ศูนย์อบรม
            <br />
            <span className="text-[#e3bb63]">ผู้ฝึกสอนฟุตบอล</span>
          </h2>
          <p className="mt-4 hidden max-w-lg leading-relaxed text-white/70 sm:block">ใบอนุญาตผู้ฝึกสอนมาตรฐาน AFC ตั้งแต่ระดับพื้นฐาน G จนถึง PRO · สมัครอบรม ติดตามใบอนุญาต และบัตรประจำตัวดิจิทัลในที่เดียว</p>

          {/* บันไดใบอนุญาต: PRO อยู่บนสุด */}
          <div className="mt-8 hidden max-w-lg sm:block">
            <p className="flex items-baseline justify-between text-xs text-white/50">
              <span>ผู้ฝึกสอนตามใบอนุญาตระดับสูงสุด</span>
              <span className="tabular-nums">รวม {total.toLocaleString("en-US")} คน</span>
            </p>
            <ol className="mt-3 space-y-1.5">
              {[...levels].reverse().map((l) => (
                <li key={l.level}>
                  <Link href={`/courses#level-${l.level}`} className="group grid grid-cols-[3.25rem_minmax(0,1fr)_4.5rem] items-center gap-3">
                    <span className={`${h} text-xl font-semibold leading-none ${l.level === "PRO" ? "text-[#e3bb63]" : "text-white/90"}`}>{l.level}</span>
                    <span className="h-2.5 overflow-hidden rounded-sm bg-white/8">
                      <span className="block h-full rounded-sm transition-[filter] group-hover:brightness-125" style={{ width: `${Math.max(2, (l.n / max) * 100)}%`, background: levelTone(l.level).hex }} />
                    </span>
                    <span className="text-right text-sm font-semibold tabular-nums">{l.n.toLocaleString("en-US")}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={href} className="inline-flex items-center gap-2 rounded-lg bg-[#e3bb63] px-6 py-3.5 text-sm font-semibold text-[#031a2c] transition-colors hover:bg-[#edc977]">
              {locked ? "เข้าสู่ระบบ / สมัครสมาชิก" : "เข้าสู่ศูนย์อบรม"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/courses" className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-6 py-3.5 text-sm font-semibold transition-colors hover:bg-white/10">
              หลักสูตรอบรม
            </Link>
          </div>
        </div>

        <div className="min-w-0">
          <LicenceFan />
          <div className="mt-8 hidden sm:block" style={{ "--paper": "#031a2c" } as React.CSSProperties}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#e3bb63]">Now Enrolling · เปิดรับสมัคร</p>
            {sessions.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-white/20 px-5 py-4 text-sm text-white/60">
                ยังไม่มีรุ่นที่เปิดรับสมัครในตอนนี้ — ติดตามประกาศรุ่นใหม่ได้ที่{" "}
                <Link href="/courses" className="font-semibold text-white underline underline-offset-4">
                  หน้าหลักสูตร
                </Link>
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {sessions.slice(0, 2).map((s) => (
                  <li key={s.id}>
                    <Link href={`/apply/${s.id}`} className="group flex overflow-hidden rounded-xl bg-[#f6f1e4] text-[#031a2c] transition-transform hover:-translate-y-0.5">
                      <span className="flex w-20 flex-none flex-col items-center justify-center bg-[#e3bb63] py-3">
                        {s.start ? (
                          <>
                            <span className={`${h} text-2xl font-semibold leading-none`}>{s.start.toLocaleDateString("th-TH", { ...TZ, day: "numeric" })}</span>
                            <span className="mt-0.5 text-[11px] font-semibold">{s.start.toLocaleDateString("th-TH", { ...TZ, month: "short" })}</span>
                          </>
                        ) : (
                          <span className="text-xs font-semibold">รอประกาศ</span>
                        )}
                      </span>
                      <span className={`${coachUi.notch} relative flex min-w-0 flex-1 items-center gap-3 border-l-2 border-dashed border-[#031a2c]/20 px-4 py-3`}>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{s.course}</span>
                          <span className="block truncate text-xs text-[#031a2c]/60">
                            {s.name}
                            {s.venue && ` · ${s.venue}`}
                          </span>
                        </span>
                        {s.daysLeft !== null && <span className={`flex-none text-xs font-semibold ${s.daysLeft <= 7 ? "text-red-700" : "text-[#031a2c]/60"}`}>อีก {s.daysLeft} วัน</span>}
                        <ArrowRight className="h-4 w-4 flex-none transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ================= G15: ภาพสนามเต็มจอ + กระดานสกอร์ (แชมป์ / ถ่ายทอดสด / นัดถัดไป) =================
type G15Side = { name: string; logoUrl: string | null; groupName: string | null };
export type G15Board = {
  mode: "live" | "champion" | "result" | "next" | "none";
  id?: number;
  round?: string;
  date?: Date | null;
  home?: G15Side;
  away?: G15Side;
  homeScore?: number | null;
  awayScore?: number | null;
  homePenalty?: number | null;
  awayPenalty?: number | null;
  champion?: G15Side | null;
};

export function G15Showcase({ teams, played, board }: { teams: number; played: number; board: G15Board }) {
  return (
    <div className="relative isolate flex h-full items-center overflow-hidden bg-g15-950 text-white">
      <Image src={g15Bg} alt="" fill sizes="100vw" placeholder="blur" className="-z-20 object-cover" style={{ objectPosition: "50% 45%" }} />
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-g15-950 via-g15-950/85 to-g15-950/30" />
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-g15-950 via-transparent to-g15-950/40" />

      <div className={`${wrap} grid gap-10 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-center`}>
        <div>
          <Eyebrow className="text-g15-200">Matchday · U15 Women</Eyebrow>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={G15_IMAGE_URL} alt="" className="mt-6 hidden h-16 w-16 rounded-xl object-cover ring-2 ring-white/20 sm:block" />
          <h2 className={`${h} mt-5 text-4xl font-semibold uppercase leading-[0.95] sm:text-7xl`}>
            G15 Women&apos;s
            <br />
            Football Series
            <span className="ml-3 align-top text-2xl text-g15-300 sm:text-4xl">2026</span>
          </h2>
          <p className="mt-5 hidden max-w-lg leading-relaxed text-white/75 sm:block">เวทีฟุตบอลหญิงรุ่นอายุไม่เกิน 15 ปี จากรอบภูมิภาคสู่รอบชิงแชมป์ประเทศไทย — ตาราง ผลการแข่งขัน สถิติ และรางวัลครบทุกนัด</p>
          <dl className="mt-8 flex divide-x divide-white/15">
            {[
              { n: teams, l: "ทีมที่ร่วมการแข่งขัน" },
              { n: played, l: "นัดที่แข่งจบแล้ว" },
            ].map((s) => (
              <div key={s.l} className="flex flex-col-reverse px-6 first:pl-0">
                <dt className="text-xs text-white/60">{s.l}</dt>
                <dd className={`${h} text-4xl font-semibold tabular-nums sm:text-5xl`}>{s.n.toLocaleString("en-US")}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/g15-womens-series" className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3.5 text-sm font-semibold text-g15-900 transition-colors hover:bg-g15-100">
              เข้าสู่ G15 Series
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/g15-womens-series/matches" className="hidden items-center gap-2 rounded-lg border border-white/30 px-6 py-3.5 text-sm font-semibold transition-colors hover:bg-white/10 sm:inline-flex">
              ตารางแข่งขันและผลบอล
            </Link>
          </div>
        </div>

        <Scoreboard board={board} />
      </div>
    </div>
  );
}

function Scoreboard({ board }: { board: G15Board }) {
  if (board.mode === "none" || !board.home || !board.away) {
    return (
      <Link href="/g15-womens-series/matches" className="rounded-2xl bg-black/50 p-6 text-sm text-white/75 ring-1 ring-white/15 hover:bg-black/60">
        ติดตามโปรแกรมการแข่งขันได้ที่หน้าตารางแข่งขัน →
      </Link>
    );
  }
  const head =
    board.mode === "live" ? (
      <span className="inline-flex items-center gap-2 font-semibold text-red-300">
        <span className={`h-2 w-2 rounded-full bg-red-400 ${styles.pulse}`} />
        LIVE · กำลังแข่ง
      </span>
    ) : board.mode === "champion" ? (
      <span className="font-semibold text-amber-300">Final · นัดชิงชนะเลิศ</span>
    ) : board.mode === "result" ? (
      <span className="font-semibold text-g15-200">ผลล่าสุด</span>
    ) : (
      <span className="font-semibold text-g15-200">นัดถัดไป</span>
    );
  const scored = board.mode !== "next" && board.homeScore != null && board.awayScore != null;
  return (
    <Link href={`/g15-womens-series/matches/${board.id}`} className="group block overflow-hidden rounded-2xl bg-[#0c0520]/90 shadow-2xl ring-1 ring-white/12 transition-transform hover:-translate-y-1">
      {board.mode === "champion" && board.champion && (
        <div className="flex items-center gap-4 border-b border-white/10 bg-linear-to-r from-amber-500/25 to-transparent px-6 py-5">
          <Trophy className={`h-10 w-10 flex-none text-amber-300 ${styles.float}`} />
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300">Champions 2026</span>
            <span className={`${h} block truncate text-2xl font-semibold`}>{board.champion.name}</span>
          </span>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 px-6 pt-5 text-xs">
        {head}
        <span className="text-white/55">
          {board.round} · {formatMatchDateShort(board.date ?? null)}
        </span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-6 pb-6 pt-5 text-center">
        <TeamSide team={board.home} />
        <div className="rounded-xl bg-black px-4 py-3 ring-1 ring-white/10">
          {scored ? (
            <span className={`${h} block text-4xl font-semibold tabular-nums text-[#e9ff70] sm:text-5xl`}>
              {board.homeScore}
              <span className="mx-2 text-white/30">:</span>
              {board.awayScore}
            </span>
          ) : (
            <span className={`${h} block text-3xl font-semibold tabular-nums text-[#e9ff70]`}>{formatMatchTimeShort(board.date ?? null) || "VS"}</span>
          )}
          {board.homePenalty != null && board.awayPenalty != null && (
            <span className="mt-1 block text-[11px] text-white/60">
              จุดโทษ {board.homePenalty}–{board.awayPenalty}
            </span>
          )}
        </div>
        <TeamSide team={board.away} />
      </div>
      <span className="flex items-center justify-between border-t border-white/10 px-6 py-3.5 text-sm font-semibold text-white/80 group-hover:text-white">
        รายละเอียดนัดนี้
        <ArrowUpRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

function TeamSide({ team }: { team: G15Side }) {
  return (
    <span className="flex min-w-0 flex-col items-center gap-2">
      <TeamBadge team={team} size="lg" />
      <span className="line-clamp-2 text-sm font-semibold leading-snug">{team.name}</span>
    </span>
  );
}

// ================= Academy Licensing: กรมท่าลึก + ทอง (ชุดเดียวกับหน้า Academy) · ตัวเลขรวมสีทอง · การ์ดโลหะสามระดับ =================
export function AcademyShowcase({ total, byLevel }: { total: number; byLevel: Record<AcademyLevel, number> }) {
  const order: AcademyLevel[] = ["GOLD", "SILVER", "BRONZE"];
  const metal = (l: AcademyLevel) => `linear-gradient(120deg, ${MEDAL[l].ribbon}, ${MEDAL[l].face} 45%, ${MEDAL[l].ring} 70%, ${MEDAL[l].face})`;
  return (
    <div className={`${academyFont.className} relative isolate flex h-full items-center overflow-hidden bg-[#060d22] text-white`}>
      <Image src={academyBg} alt="" fill sizes="100vw" placeholder="blur" className="-z-20 object-cover opacity-45" style={{ objectPosition: "50% 20%" }} />
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-[#060d22] via-[#060d22]/85 to-[#060d22]/40" />
      <div className={`${wrap} grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:items-center`}>
        <div>
          <div className="flex items-center gap-4">
            <AcademyLogo className="h-11 sm:h-12" />
            <Eyebrow className="text-[#f2c14e]">Criteria 2025</Eyebrow>
          </div>
          <h2 className="mt-6 text-4xl font-bold leading-[1.05] sm:text-6xl">
            Academy
            <br />
            <span className="text-[#f2c14e]">Licensing</span>
          </h2>
          <p className="mt-4 hidden max-w-md leading-relaxed text-white/70 sm:block">ทำเนียบอคาเดมีและศูนย์ฝึกเยาวชนที่ได้รับการรับรองมาตรฐานจากสมาคมฯ ตามเกณฑ์ปี 2025 — ค้นหาบนแผนที่ทั่วประเทศ</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/academies" className="inline-flex items-center gap-2 rounded-xl bg-[#f2c14e] px-6 py-3.5 text-sm font-bold text-[#060d22] transition-transform hover:-translate-y-0.5">
              แผนที่และทำเนียบอคาเดมี
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/academies/register" className="hidden items-center gap-2 rounded-xl border border-white/25 px-6 py-3.5 text-sm font-semibold transition-colors hover:bg-white/10 sm:inline-flex">
              สมัครรับการรับรอง
            </Link>
          </div>
        </div>
        <div>
          <p className="flex items-baseline gap-3">
            <span className="text-6xl font-bold tabular-nums text-[#f2c14e] sm:text-7xl">{total.toLocaleString("en-US")}</span>
            <span className="text-sm text-white/65">
              อคาเดมี
              <br />
              ที่ได้รับการรับรอง
            </span>
          </p>
          <ul className="mt-6 grid grid-cols-3 gap-3">
            {order.map((lv) => (
              <li key={lv}>
                <Link href={`/academies?level=${lv}#directory`} className="group block overflow-hidden rounded-2xl bg-white/[0.05] ring-1 ring-white/10 transition-transform hover:-translate-y-1">
                  <span className="block h-2" style={{ background: metal(lv) }} />
                  <span className="flex flex-col items-center px-2 pb-4 pt-4 text-center">
                    <Medal level={lv} size="md" />
                    <span className="mt-8 text-3xl font-bold leading-none tabular-nums">{byLevel[lv]}</span>
                    <span className="mt-1 text-xs text-white/60">{LEVEL_META[lv].label}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ================= Play and Learn: พื้นชมพู · กุ๋งกิ๋งตัวใหญ่ · ตราประทับพาสปอร์ต 8 บท =================
export function PlayShowcase() {
  return (
    <div className="relative isolate flex h-full items-center overflow-hidden bg-[#ffe3ee] text-[#4a0d2a]">
      <Image src={PLAY_AND_LEARN_ELEMENTS.flowerYellow} alt="" width={64} height={64} className="pointer-events-none absolute right-[8%] top-10 -z-10 h-16 w-16 rotate-12" />
      <Image src={PLAY_AND_LEARN_ELEMENTS.flowerPurple} alt="" width={64} height={64} className="pointer-events-none absolute bottom-12 left-[3%] -z-10 hidden h-14 w-14 sm:block" />
      <Image src={PLAY_AND_LEARN_ELEMENTS.flowerPink} alt="" width={64} height={64} className="pointer-events-none absolute left-[46%] top-16 -z-10 hidden h-12 w-12 -rotate-12 lg:block" />
      <div className={`${wrap} relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-center`}>
        <div>
          <div className="flex items-center gap-4">
            <Image src={PLAY_AND_LEARN_LOGO_URL} alt="Play and Learn" width={120} height={120} className="h-16 w-auto rounded-xl bg-white p-1 sm:h-20" />
            <Eyebrow className="text-[#be185d]">Play and Learn</Eyebrow>
          </div>
          <h2 className="mt-6 text-5xl font-extrabold leading-[1.02] text-[#be185d] sm:text-7xl">
            Play
            <br />
            and Learn
          </h2>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-[#4a0d2a]/80">ฟุตบอลสำหรับเด็กหญิงวัย 5–8 ปี เรียนรู้ผ่านการเล่นไปกับ “กุ๋งกิ๋ง”</p>

          <p className="mt-7 text-xs font-bold text-[#be185d]">พาสปอร์ตแห่งการผจญภัย {PLAY_AND_LEARN_PASSPORT_URLS.length} บท</p>
          <ul className="mt-3 grid max-w-[12.5rem] grid-cols-4 gap-2 sm:flex sm:max-w-none sm:gap-2.5">
            {PLAY_AND_LEARN_PASSPORT_URLS.map((_, i) => (
              <li key={i}>
                <Link
                  href="/play-and-learn#passport"
                  aria-label={`พาสปอร์ตบทที่ ${i + 1}`}
                  className={`${styles.stamp} flex aspect-square flex-col items-center justify-center rounded-full border-2 border-dashed bg-white/70 leading-none sm:h-14 sm:w-14`}
                  style={{ borderColor: ["#db2777", "#9333ea", "#0d9488", "#f59e0b"][i % 4], color: ["#db2777", "#9333ea", "#0d9488", "#b45309"][i % 4], transform: `rotate(${[-8, 6, -4, 10][i % 4]}deg)` }}
                >
                  <span className="text-[9px] font-bold">บท</span>
                  <span className="text-lg font-extrabold">{i + 1}</span>
                </Link>
              </li>
            ))}
          </ul>

          <Link href="/play-and-learn" className="mt-9 inline-flex items-center gap-2 rounded-2xl bg-[#db2777] px-6 py-3.5 text-sm font-bold text-white shadow-[0_6px_0_#9d174d] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_2px_0_#9d174d]">
            ไปเล่นกันเลย
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <Image
          src={PLAY_AND_LEARN_MASCOT.kicking}
          alt=""
          width={260}
          height={320}
          className={`pointer-events-none absolute bottom-6 right-4 h-36 w-auto sm:h-48 lg:static lg:mx-auto lg:h-[26rem] ${styles.sway}`}
        />
      </div>
    </div>
  );
}

// ================= Grassroots: แถบริบบิ้นวิ่ง · พื้นหญ้าตัดลาย · สติกเกอร์ตัวเลข · ภาพโพลารอยด์ =================
export function GrassrootsShowcase() {
  const ribbon = ["Grassroots Football", "ฟุตบอลรากหญ้า", "เล่นสนุก ปลอดภัย", "ทุกคนได้เล่น", "ปูพื้นฐานเยาวชนทั่วประเทศ"];
  const maxAge = Math.max(...grassrootsPlayers.ageRanges.map((a) => a.count));
  const stickers = [
    { n: grassrootsPlayers.total, l: "นักฟุตบอล", bg: "#f97316", fg: "#fff", r: -6 },
    { n: grassrootsCoaches.total, l: "ผู้ฝึกสอน", bg: "#fde047", fg: "#064e3b", r: 5 },
    { n: grassrootsPlayers.provinces, l: "จังหวัด", bg: "#fff", fg: "#064e3b", r: -3 },
  ];
  return (
    <div className={`${grassrootsFont.className} ${festival.grass} relative flex h-full flex-col overflow-hidden text-white`}>
      <div className={`${festival.marquee} -mx-4 mt-4 -rotate-1 bg-[#fde047] py-2.5 text-[#064e3b] shadow-lg`}>
        <div className={festival.track}>
          {[0, 1].map((k) => (
            <span key={k} aria-hidden={k === 1} className="flex flex-none items-center">
              {ribbon.concat(ribbon).map((t, i) => (
                <span key={i} className="flex items-center gap-6 whitespace-nowrap px-6 text-base font-medium sm:text-lg">
                  {t}
                  <span className="text-[#f97316]">✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 items-center">
        <div className={`${wrap} grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-center`}>
          <div>
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={GRASSROOTS_LOGO_URL} alt="" className="h-14 w-14 rounded-full bg-white object-contain p-1.5 shadow-lg sm:h-16 sm:w-16" />
              <span className="text-sm text-white/75">โครงการปี {GRASSROOTS_YEAR}</span>
            </div>
            <h2 className="mt-5 text-5xl font-semibold leading-[1.02] sm:text-7xl">
              Grassroots
              <br />
              <span className="text-[#fde047]">Football</span>
            </h2>
            <p className="mt-4 hidden max-w-md text-lg text-white/85 sm:block">
              ฟุตบอล<span className="whitespace-nowrap">รากหญ้า</span> ปูพื้นฐานเยาวชนทั่วประเทศ — ให้เด็กทุกคนได้เล่นอย่างสนุกและปลอดภัย
            </p>
            <ul className="mt-8 flex flex-wrap gap-3 sm:gap-4">
              {stickers.map((s) => (
                <li
                  key={s.l}
                  className={`${festival.sticker} flex h-24 w-24 flex-col items-center justify-center rounded-full text-center shadow-[0_8px_0_rgb(0_0_0/0.18)] sm:h-32 sm:w-32`}
                  style={{ background: s.bg, color: s.fg, transform: `rotate(${s.r}deg)` }}
                >
                  <span className="text-2xl font-semibold leading-none tabular-nums sm:text-4xl">{s.n.toLocaleString("en-US")}</span>
                  <span className="mt-1 text-xs sm:text-sm">{s.l}</span>
                </li>
              ))}
            </ul>
            <Link href="/grassroots-football" className="mt-9 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-medium text-[#064e3b] shadow-[0_6px_0_#064e3b] transition-transform hover:-translate-y-0.5">
              ดูข้อมูลโครงการ
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative mx-auto hidden w-full max-w-md md:block">
            <div className="rotate-2 bg-white p-3 pb-14 shadow-2xl">
              <div className="relative aspect-4/3 overflow-hidden">
                <Image src={grassrootsBg} alt="เด็กๆ ในกิจกรรมฟุตบอลรากหญ้า" fill sizes="(min-width: 1024px) 28rem, 90vw" placeholder="blur" className="object-cover" style={{ objectPosition: "50% 35%" }} />
              </div>
              <p className={`${markerFont.className} absolute bottom-3 left-0 right-0 text-center text-xl text-[#064e3b]`}>สนุกทุกสนาม!</p>
            </div>
            <div className="-mt-4 ml-auto w-[88%] -rotate-1 rounded-xl bg-[#064e3b] p-5 shadow-xl ring-2 ring-white/20">
              <p className="text-sm text-white/80">นักฟุตบอลตามช่วงอายุ</p>
              <ul className="mt-3 space-y-2">
                {grassrootsPlayers.ageRanges.map((a) => (
                  <li key={a.label} className="grid grid-cols-[4.5rem_minmax(0,1fr)_3rem] items-center gap-2 text-sm">
                    <span className="text-white/80">{a.label}</span>
                    <span className="h-2.5 overflow-hidden rounded-full bg-white/10">
                      <span className="block h-full rounded-full bg-[#fde047]" style={{ width: `${(a.count / maxAge) * 100}%` }} />
                    </span>
                    <span className="text-right tabular-nums">{a.count.toLocaleString("en-US")}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ================= Talent ID: กล้องแมวมอง (กรอบมุม · เส้นสแกน · ไฟ REC) บนพื้นเทาถ่าน + เหลือง =================
export function TalentShowcase({ href, locked }: { href: string; locked: boolean }) {
  const corner = "absolute h-7 w-7 border-[#facc15]";
  return (
    <div className={`${talentFont.className} flex h-full items-center bg-[#0d1117] text-white`}>
      <div className={`${wrap} grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-14`}>
        <div className="relative aspect-video overflow-hidden ring-1 ring-white/10 lg:aspect-4/3">
          <Image src={talentIdBg} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" placeholder="blur" className="object-cover contrast-125 grayscale" style={{ objectPosition: "50% 60%" }} />
          <div className="absolute inset-0 bg-[#0d1117]/40" />
          <span className={`${corner} left-4 top-4 border-l-2 border-t-2`} />
          <span className={`${corner} right-4 top-4 border-r-2 border-t-2`} />
          <span className={`${corner} bottom-4 left-4 border-b-2 border-l-2`} />
          <span className={`${corner} bottom-4 right-4 border-b-2 border-r-2`} />
          <span aria-hidden className={`absolute inset-x-6 h-px bg-[#facc15] shadow-[0_0_12px_#facc15] ${styles.scan}`} />
          {/* เป้าเล็งกลางภาพ */}
          <span aria-hidden className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#facc15]/80">
            <span className="absolute left-1/2 top-[-0.6rem] h-3 w-px bg-[#facc15]" />
            <span className="absolute bottom-[-0.6rem] left-1/2 h-3 w-px bg-[#facc15]" />
            <span className="absolute left-[-0.6rem] top-1/2 h-px w-3 bg-[#facc15]" />
            <span className="absolute right-[-0.6rem] top-1/2 h-px w-3 bg-[#facc15]" />
          </span>
          <span className="absolute left-7 top-7 flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-white/85">
            <span className={`h-2 w-2 rounded-full bg-red-500 ${styles.blink}`} />
            REC · SCOUT CAM
          </span>
          <span className="absolute bottom-7 right-7 text-[11px] font-semibold tracking-[0.2em] text-[#facc15]">AGE 13–17</span>
        </div>

        <div>
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={TALENT_ID_LOGO_URL} alt="" className="h-12 w-12 rounded-md bg-white object-contain p-1" />
            <Eyebrow className="text-[#facc15]">Talent Identification</Eyebrow>
          </div>
          <h2 className="mt-6 text-5xl font-bold uppercase leading-none sm:text-7xl">
            Talent <span className="text-[#facc15]">ID</span>
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-white/70">สืบค้นและคัดกรองนักฟุตบอลดาวรุ่นจากทุกภูมิภาค ด้วยข้อมูลที่เป็นระบบ</p>
          <ul className="mt-6 hidden max-w-md grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-white/85 sm:grid">
            {["โปรไฟล์และข้อมูลร่างกาย", "ผังตำแหน่งบนสนาม", "ผลประเมินและเกรด", "รุ่นคัดเลือกตามภูมิภาค"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 flex-none bg-[#facc15]" />
                {t}
              </li>
            ))}
          </ul>
          {locked && (
            <p className="mt-8 flex items-center gap-2 text-xs text-white/55">
              <Lock className="h-3.5 w-3.5" />
              ข้อมูลนักฟุตบอลเยาวชน เปิดให้เฉพาะเจ้าหน้าที่
            </p>
          )}
          <Link href={href} className={`${locked ? "mt-3" : "mt-8"} inline-flex items-center gap-2 bg-[#facc15] px-6 py-3.5 text-sm font-bold text-[#0d1117] transition-colors hover:bg-[#fde047]`}>
            {locked ? "เข้าสู่ระบบเจ้าหน้าที่" : "เปิด Talent ID"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ================= ศูนย์ข้อมูลและบทความ: ไวท์บอร์ดกรอบอะลูมิเนียมบนผนัง · ภาพวาดแทคติก · โน้ตปักหมุด · รางปากกา =================
export type LatestArticle = { id: number; title: string; area: string; createdAt: Date };

export function DataShowcase({ articles, total, byArea }: { articles: LatestArticle[]; total: number; byArea: Record<string, number> }) {
  const notes =
    articles.length > 0
      ? articles.map((a) => ({ key: a.id, href: `/training-centre/${a.id}`, area: a.area, title: a.title, sub: null as string | null }))
      : TRAINING_CENTRE_AREAS.map((a) => ({ key: a.value, href: `/training-centre?area=${a.value}`, area: a.value, title: AREA_INFO[a.value]?.th ?? a.label, sub: byArea[a.value] ? `${byArea[a.value]} บทความ` : "เร็วๆ นี้" }));
  return (
    <div className={`${trainingFont.className} flex h-full items-center bg-[#e4e7ec]`}>
      <div className={wrap}>
        <div className="rounded-lg bg-linear-to-b from-[#d7dbe1] to-[#aab1bc] p-2.5 shadow-[0_30px_60px_-30px_rgb(15_23_42/0.5)]">
          <div className="grid gap-8 rounded-sm bg-[#fdfdfb] p-6 text-[#111827] sm:p-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-12">
            <div>
              <div className="flex items-center gap-4">
                <DataCentreLogo className="h-14 sm:h-16" />
                <Eyebrow className="text-[#1d4ed8]">Data & Articles</Eyebrow>
              </div>
              <h2 className="mt-6 text-4xl font-bold leading-[1.05] sm:text-5xl">
                Technical Data
                <br />& Articles Centre
              </h2>
              <p className="mt-3 text-slate-600">ศูนย์ข้อมูลและบทความด้านเทคนิค ของฝ่ายเทคนิค สมาคมฯ</p>
              <ul className="mt-7 hidden gap-3 sm:grid sm:grid-cols-3">
                {notes.map((n, i) => (
                  <li key={n.key}>
                    <Link href={n.href} className={`${styles.note} relative block h-full bg-[#fef9c3] px-3.5 pb-3 pt-4 shadow-md`} style={{ transform: `rotate(${[-1.5, 1.2, -0.8][i % 3]}deg)` }}>
                      <span className="absolute left-1/2 top-1 h-3 w-3 -translate-x-1/2 rounded-full bg-red-600 shadow" />
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: AREA_INFO[n.area]?.color }}>
                        {TRAINING_CENTRE_AREAS.find((x) => x.value === n.area)?.label ?? n.area}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-sm font-semibold leading-snug">{n.title}</span>
                      {n.sub && <span className="block text-xs text-slate-500">{n.sub}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                <Link href="/training-centre" className={`${markerFont.className} inline-flex items-center gap-2 text-2xl text-[#1d4ed8] underline decoration-[#1d4ed8]/40 decoration-2 underline-offset-8 hover:decoration-[#1d4ed8]`}>
                  {total > 0 ? `อ่านบทความทั้งหมด ${total} เรื่อง` : "เข้าศูนย์ข้อมูล"}
                  <ArrowRight className="h-5 w-5" />
                </Link>
                {/* รางปากกาไวท์บอร์ด */}
                <span aria-hidden className="flex items-end gap-1.5 rounded-sm bg-[#c9ced6] px-2.5 py-1.5">
                  {["#1d4ed8", "#dc2626", "#15803d", "#111827"].map((c) => (
                    <span key={c} className="h-2.5 w-9 rounded-full" style={{ background: c }} />
                  ))}
                </span>
              </div>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-1">
              <TacticsBoard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
