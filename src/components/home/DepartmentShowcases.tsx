import Link from "next/link";
import Image from "next/image";
import { G15_IMAGE_URL, GRASSROOTS_LOGO_URL, PLAY_AND_LEARN_ELEMENTS, PLAY_AND_LEARN_LOGO_URL, PLAY_AND_LEARN_MASCOT, PLAY_AND_LEARN_PASSPORT_URLS, TALENT_ID_LOGO_URL } from "@/lib/brand";
import { GRASSROOTS_YEAR, grassrootsCoaches, grassrootsPlayers } from "@/lib/grassroots-data";
import { LEVEL_META, type AcademyLevel } from "@/lib/academy";
import { formatMatchDateShort, formatMatchTimeShort } from "@/lib/g15";
import { coachCentreBg, g15Bg, grassrootsBg, talentIdBg } from "@/lib/section-images";
import { TRAINING_CENTRE_AREAS } from "@/lib/constants";
import { display } from "@/components/fonts";
import { AcademyLogo, CoachCentreLogo, DataCentreLogo } from "@/components/SectionLogos";
import { LicenceFan } from "@/components/coach/LicenceFan";
import { levelTone } from "@/components/coach/CoachUi";
import { Medal } from "@/components/academy/Medal";
import { Seal } from "@/components/academy/Seal";
import { TeamBadge } from "@/components/g15/TeamBadge";
import { TacticsBoard } from "@/components/training/TacticsBoard";
import { AREA_INFO } from "@/components/training/areas";
import { academySerif } from "@/components/typefaces/academy";
import { grassrootsFont } from "@/components/typefaces/grassroots";
import { talentFont } from "@/components/typefaces/talent";
import { markerFont, trainingFont } from "@/components/typefaces/training";
import coachUi from "@/components/coach/coach.module.css";
import festival from "@/app/grassroots-football/grassroots.module.css";
import { PlayOnView } from "./PlayOnView";
import styles from "./showcase.module.css";
import { ArrowRight, ArrowUpRight, Lock, Trophy } from "lucide-react";

const h = display.className;
const TZ = { timeZone: "Asia/Bangkok" } as const;

// ป้ายลำดับหมวด "01 / 07 · ชื่ออังกฤษ" — จุดร่วมเดียวของทุกแผง สีตามหมวด
function Index({ n, label, className = "" }: { n: number; label: string; className?: string }) {
  return (
    <p className={`flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] ${className}`}>
      <span className="whitespace-nowrap tabular-nums">{String(n).padStart(2, "0")} / 07</span>
      <span className="hidden h-px w-8 bg-current opacity-60 sm:block" />
      <span className="whitespace-nowrap">{label}</span>
    </p>
  );
}

// ================= 01 · ศูนย์อบรมผู้ฝึกสอน: กรมท่าเข้ม + ทอง · บัตรใบอนุญาตเรียงแบบไพ่ · บันไดระดับ · ตั๋วรุ่นอบรม =================
export type CoachLevel = { level: string; n: number; title?: string };
export type OpenSession = { id: number; course: string; name: string; venue: string | null; start: Date | null; daysLeft: number | null };

export function CoachShowcase({ href, locked, levels, total, sessions }: { href: string; locked: boolean; levels: CoachLevel[]; total: number; sessions: OpenSession[] }) {
  const max = Math.max(1, ...levels.map((l) => l.n));
  return (
    <section id="dept-coach" className="relative isolate scroll-mt-16 overflow-hidden bg-[#031a2c] text-white">
      <div className="absolute inset-y-0 right-0 -z-10 hidden w-[55%] lg:block">
        <Image src={coachCentreBg} alt="" fill sizes="55vw" placeholder="blur" className="object-cover opacity-30" style={{ objectPosition: "50% 25%" }} />
        <div className="absolute inset-0 bg-linear-to-r from-[#031a2c] via-[#031a2c]/70 to-[#031a2c]/30" />
      </div>
      <div className="mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] lg:items-center lg:py-28">
        <div>
          <Index n={1} label="Coach Education" className="text-[#e3bb63]" />
          <CoachCentreLogo tone="white" className="mt-8 h-12" />
          <h2 className={`${h} mt-6 text-[2.6rem] font-semibold leading-[1.05] sm:text-6xl`}>
            ศูนย์อบรม
            <br />
            <span className="text-[#e3bb63]">ผู้ฝึกสอนฟุตบอล</span>
          </h2>
          <p className="mt-5 max-w-lg leading-relaxed text-white/70">ใบอนุญาตผู้ฝึกสอนมาตรฐาน AFC ตั้งแต่ระดับพื้นฐาน G จนถึง PRO · สมัครอบรม ติดตามใบอนุญาต และบัตรประจำตัวดิจิทัลในที่เดียว</p>

          {/* บันไดใบอนุญาต: PRO อยู่บนสุด */}
          <div className="mt-10 max-w-lg">
            <p className="flex items-baseline justify-between text-xs text-white/50">
              <span>ผู้ฝึกสอนตามใบอนุญาตระดับสูงสุด</span>
              <span className="tabular-nums">รวม {total.toLocaleString("en-US")} คน</span>
            </p>
            <ol className="mt-4 space-y-2">
              {[...levels].reverse().map((l) => (
                <li key={l.level}>
                  <Link href={`/courses#level-${l.level}`} className="group grid grid-cols-[3.25rem_minmax(0,1fr)_4.5rem] items-center gap-3">
                    <span className={`${h} text-2xl font-semibold leading-none ${l.level === "PRO" ? "text-[#e3bb63]" : "text-white/90"}`}>{l.level}</span>
                    <span className="h-3 overflow-hidden rounded-sm bg-white/8">
                      <span className="block h-full rounded-sm transition-[filter] group-hover:brightness-125" style={{ width: `${Math.max(2, (l.n / max) * 100)}%`, background: levelTone(l.level).hex }} />
                    </span>
                    <span className="text-right text-sm font-semibold tabular-nums">{l.n.toLocaleString("en-US")}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href={href} className="inline-flex items-center gap-2 rounded-lg bg-[#e3bb63] px-6 py-3.5 text-sm font-semibold text-[#031a2c] transition-colors hover:bg-[#edc977]">
              {locked ? "เข้าสู่ระบบ / สมัครสมาชิกผู้ฝึกสอน" : "เข้าสู่ศูนย์อบรม"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/courses" className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-6 py-3.5 text-sm font-semibold transition-colors hover:bg-white/10">
              หลักสูตรอบรมทั้งหมด
            </Link>
          </div>
        </div>

        <div className="min-w-0">
          <LicenceFan />
          <div className="mt-10" style={{ "--paper": "#031a2c" } as React.CSSProperties}>
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
    </section>
  );
}

// ================= 02 · G15: ภาพสนามเต็มจอ + กระดานสกอร์ (แชมป์ / ถ่ายทอดสด / นัดถัดไป) =================
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
    <section id="dept-g15" className="relative isolate scroll-mt-16 overflow-hidden bg-g15-950 text-white">
      <Image src={g15Bg} alt="" fill sizes="100vw" placeholder="blur" className="-z-20 object-cover" style={{ objectPosition: "50% 45%" }} />
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-g15-950 via-g15-950/85 to-g15-950/30" />
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-g15-950 via-transparent to-g15-950/40" />

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-end lg:py-28">
        <div>
          <Index n={2} label="Matchday · U15 Women" className="text-g15-200" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={G15_IMAGE_URL} alt="" className="mt-8 h-16 w-16 rounded-xl object-cover ring-2 ring-white/20" />
          <h2 className={`${h} mt-6 text-[2.6rem] font-semibold uppercase leading-[0.95] sm:text-7xl`}>
            G15 Women&apos;s
            <br />
            Football Series
            <span className="ml-3 align-top text-2xl text-g15-300 sm:text-4xl">2026</span>
          </h2>
          <p className="mt-5 max-w-lg leading-relaxed text-white/75">เวทีฟุตบอลหญิงรุ่นอายุไม่เกิน 15 ปี จากรอบภูมิภาคสู่รอบชิงแชมป์ประเทศไทย — ตาราง ผลการแข่งขัน สถิติ และรางวัลครบทุกนัด</p>
          <dl className="mt-9 flex divide-x divide-white/15">
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
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/g15-womens-series" className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3.5 text-sm font-semibold text-g15-900 transition-colors hover:bg-g15-100">
              เข้าสู่ G15 Series
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/g15-womens-series/matches" className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3.5 text-sm font-semibold transition-colors hover:bg-white/10">
              ตารางแข่งขันและผลบอล
            </Link>
          </div>
        </div>

        <Scoreboard board={board} />
      </div>
    </section>
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

// ================= 03 · Academy Licensing: ใบรับรองกรอบทองสองชั้น · ตราประทับ · เหรียญสามระดับ =================
export function AcademyShowcase({ total, byLevel }: { total: number; byLevel: Record<AcademyLevel, number> }) {
  const s = academySerif.className;
  const order: AcademyLevel[] = ["GOLD", "SILVER", "BRONZE"];
  return (
    <article id="dept-academy" className="h-full scroll-mt-20 bg-white p-2 text-[#0b1f44] shadow-[0_30px_60px_-35px_rgb(11_31_68/0.45)] sm:p-3">
      <div className="h-full border-2 border-[#d9b45a] p-1">
        <div className="flex h-full flex-col border border-[#d9b45a] bg-[#f8f6f0] px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <Index n={3} label="Academy Licensing" className="text-[#8a6a10]" />
            <AcademyLogo className="h-10 sm:h-12" />
          </div>
          <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#3d4a63]">Certificate of Academy Licensing</p>
          <h2 className={`${s} mt-3 text-4xl font-bold leading-tight sm:text-5xl`}>Academy Licensing</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#3d4a63]">ทำเนียบอคาเดมีและศูนย์ฝึกเยาวชนที่ได้รับการรับรองมาตรฐานจากสมาคมฯ ร่วมกับ FIFA Grow Together ตามเกณฑ์ AFC</p>

          <div className="mt-8 flex flex-col items-center gap-8 sm:flex-row sm:items-center">
            <Seal count={total} className="h-36 w-36 flex-none" />
            <ul className="grid w-full grid-cols-3 gap-2 sm:gap-4">
              {order.map((lv) => (
                <li key={lv}>
                  <Link href={`/academies?level=${lv}#directory`} className="flex flex-col items-center rounded-lg px-1 pb-3 pt-1 text-center transition-colors hover:bg-white">
                    <Medal level={lv} size="md" />
                    <span className={`${s} mt-8 text-3xl font-bold leading-none tabular-nums`}>{byLevel[lv]}</span>
                    <span className="mt-1 text-xs text-[#3d4a63]">{LEVEL_META[lv].label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto flex flex-wrap gap-3 pt-10">
            <Link href="/academies" className="inline-flex items-center gap-2 bg-[#071530] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0b1f44]">
              แผนที่และทำเนียบอคาเดมี
              <ArrowRight className="h-4 w-4 text-[#d9b45a]" />
            </Link>
            <Link href="/academies/register" className="inline-flex items-center gap-2 border border-[#0b1f44]/25 px-5 py-3 text-sm font-semibold transition-colors hover:border-[#0b1f44]">
              สมัครรับการรับรอง
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

// ================= 04 · Play and Learn: การ์ดชมพูมนๆ · กุ๋งกิ๋ง · ตราประทับพาสปอร์ต 8 บท =================
export function PlayShowcase() {
  return (
    <article id="dept-play" className="relative isolate flex h-full scroll-mt-20 flex-col overflow-hidden rounded-[2.5rem] bg-[#ffe3ee] p-7 text-[#4a0d2a] sm:p-9">
      <Image src={PLAY_AND_LEARN_ELEMENTS.flowerYellow} alt="" width={64} height={64} className="pointer-events-none absolute -right-3 top-24 -z-10 h-16 w-16 rotate-12" />
      <Image src={PLAY_AND_LEARN_ELEMENTS.flowerPurple} alt="" width={64} height={64} className="pointer-events-none absolute bottom-40 left-[-1.25rem] -z-10 h-14 w-14" />
      <div className="flex items-start justify-between gap-4">
        <Index n={4} label="Play and Learn" className="text-[#be185d]" />
        <Image src={PLAY_AND_LEARN_LOGO_URL} alt="Play and Learn" width={120} height={120} className="h-16 w-auto" />
      </div>
      <h2 className="mt-6 text-4xl font-extrabold leading-[1.05] text-[#be185d] sm:text-5xl">
        Play
        <br />
        and Learn
      </h2>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#4a0d2a]/80">ฟุตบอลสำหรับเด็กหญิงวัย 5–8 ปี เรียนรู้ผ่านการเล่นไปกับ “กุ๋งกิ๋ง”</p>

      <p className="mt-7 text-xs font-bold text-[#be185d]">พาสปอร์ตแห่งการผจญภัย {PLAY_AND_LEARN_PASSPORT_URLS.length} บท</p>
      <ul className="mt-3 grid max-w-[12.5rem] grid-cols-4 gap-2 sm:max-w-[15rem] sm:gap-2.5">
        {PLAY_AND_LEARN_PASSPORT_URLS.map((_, i) => (
          <li key={i}>
            <Link
              href="/play-and-learn#passport"
              aria-label={`พาสปอร์ตบทที่ ${i + 1}`}
              className={`${styles.stamp} flex aspect-square flex-col items-center justify-center rounded-full border-2 border-dashed bg-white/70 leading-none`}
              style={{ borderColor: ["#db2777", "#9333ea", "#0d9488", "#f59e0b"][i % 4], color: ["#db2777", "#9333ea", "#0d9488", "#b45309"][i % 4], transform: `rotate(${[-8, 6, -4, 10][i % 4]}deg)` }}
            >
              <span className="text-[9px] font-bold">บท</span>
              <span className="text-lg font-extrabold">{i + 1}</span>
            </Link>
          </li>
        ))}
      </ul>

      <Image src={PLAY_AND_LEARN_MASCOT.kicking} alt="" width={260} height={320} className={`pointer-events-none absolute -bottom-2 right-1 -z-10 h-36 w-auto sm:right-2 sm:h-56 ${styles.sway}`} />
      <div className="mt-auto pt-9">
        <Link href="/play-and-learn" className="inline-flex items-center gap-2 rounded-2xl bg-[#db2777] px-5 py-3 text-sm font-bold text-white shadow-[0_6px_0_#9d174d] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_2px_0_#9d174d]">
          ไปเล่นกันเลย
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

// ================= 05 · Grassroots: แถบริบบิ้นวิ่ง · พื้นหญ้าตัดลาย · สติกเกอร์ตัวเลข · ภาพโพลารอยด์ =================
export function GrassrootsShowcase() {
  const g = grassrootsFont.className;
  const ribbon = ["Grassroots Football", "ฟุตบอลรากหญ้า", "เล่นสนุก ปลอดภัย", "ทุกคนได้เล่น", "ปูพื้นฐานเยาวชนทั่วประเทศ"];
  const maxAge = Math.max(...grassrootsPlayers.ageRanges.map((a) => a.count));
  const stickers = [
    { n: grassrootsPlayers.total, l: "นักฟุตบอล", bg: "#f97316", fg: "#fff", r: -6 },
    { n: grassrootsCoaches.total, l: "ผู้ฝึกสอน", bg: "#fde047", fg: "#064e3b", r: 5 },
    { n: grassrootsPlayers.provinces, l: "จังหวัด", bg: "#fff", fg: "#064e3b", r: -3 },
  ];
  return (
    <section id="dept-grassroots" className={`${g} ${festival.grass} relative scroll-mt-16 overflow-hidden text-white`}>
      <div className={`${festival.marquee} -mx-4 -rotate-1 bg-[#fde047] py-3 text-[#064e3b] shadow-lg`}>
        <div className={festival.track}>
          {[0, 1].map((k) => (
            <span key={k} aria-hidden={k === 1} className="flex flex-none items-center">
              {ribbon.concat(ribbon).map((t, i) => (
                <span key={i} className="flex items-center gap-6 px-6 text-lg font-medium whitespace-nowrap">
                  {t}
                  <span className="text-[#f97316]">✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-14 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:items-center lg:pb-28">
        <div>
          <Index n={5} label="Grassroots Football" className="text-[#fde047]" />
          <div className="mt-8 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={GRASSROOTS_LOGO_URL} alt="" className="h-16 w-16 rounded-full bg-white object-contain p-1.5 shadow-lg" />
            <span className="text-sm text-white/75">โครงการปี {GRASSROOTS_YEAR}</span>
          </div>
          <h2 className="mt-6 text-5xl font-semibold leading-[1.02] sm:text-7xl">
            Grassroots
            <br />
            <span className="text-[#fde047]">Football</span>
          </h2>
          <p className="mt-4 max-w-md text-lg text-white/85">
            ฟุตบอล<span className="whitespace-nowrap">รากหญ้า</span> ปูพื้นฐานเยาวชนทั่วประเทศ — ให้เด็กทุกคนได้เล่นอย่างสนุกและปลอดภัย
          </p>
          <ul className="mt-10 flex flex-wrap gap-4">
            {stickers.map((s) => (
              <li
                key={s.l}
                className={`${festival.sticker} flex h-28 w-28 flex-col items-center justify-center rounded-full text-center shadow-[0_8px_0_rgb(0_0_0/0.18)] sm:h-32 sm:w-32`}
                style={{ background: s.bg, color: s.fg, transform: `rotate(${s.r}deg)` }}
              >
                <span className="text-3xl font-semibold leading-none tabular-nums sm:text-4xl">{s.n.toLocaleString("en-US")}</span>
                <span className="mt-1 text-sm">{s.l}</span>
              </li>
            ))}
          </ul>
          <Link href="/grassroots-football" className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-medium text-[#064e3b] shadow-[0_6px_0_#064e3b] transition-transform hover:-translate-y-0.5">
            ดูข้อมูลโครงการ
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-md">
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
    </section>
  );
}

// ================= 06 · Talent ID: กล้องแมวมอง (กรอบมุม · เส้นสแกน · ไฟ REC) บนพื้นเทาถ่าน + เหลือง =================
export function TalentShowcase({ href, locked }: { href: string; locked: boolean }) {
  const f = talentFont.className;
  const corner = "absolute h-7 w-7 border-[#facc15]";
  return (
    <article id="dept-talent" className={`${f} flex h-full scroll-mt-20 flex-col overflow-hidden bg-[#0d1117] text-white ring-1 ring-white/10`}>
      <div className="relative aspect-16/10 overflow-hidden">
        <Image src={talentIdBg} alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" placeholder="blur" className="object-cover contrast-125 grayscale" style={{ objectPosition: "50% 60%" }} />
        <div className="absolute inset-0 bg-[#0d1117]/45" />
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

      <div className="flex flex-1 flex-col p-7 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <Index n={6} label="Talent Identification" className="text-[#facc15]" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={TALENT_ID_LOGO_URL} alt="" className="h-11 w-11 rounded-md bg-white object-contain p-1" />
        </div>
        <h2 className="mt-5 text-4xl font-bold uppercase leading-none sm:text-5xl">
          Talent <span className="text-[#facc15]">ID</span>
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/70">สืบค้นและคัดกรองนักฟุตบอลดาวรุ่นจากทุกภูมิภาค ด้วยข้อมูลที่เป็นระบบ</p>
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[13px] text-white/85">
          {["โปรไฟล์และข้อมูลร่างกาย", "ผังตำแหน่งบนสนาม", "ผลประเมินและเกรด", "รุ่นคัดเลือกตามภูมิภาค"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 flex-none bg-[#facc15]" />
              {t}
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-8">
          {locked && (
            <p className="mb-3 flex items-center gap-2 text-xs text-white/55">
              <Lock className="h-3.5 w-3.5" />
              ข้อมูลนักฟุตบอลเยาวชน เปิดให้เฉพาะเจ้าหน้าที่
            </p>
          )}
          <Link href={href} className="inline-flex items-center gap-2 bg-[#facc15] px-5 py-3 text-sm font-bold text-[#0d1117] transition-colors hover:bg-[#fde047]">
            {locked ? "เข้าสู่ระบบเจ้าหน้าที่" : "เปิด Talent ID"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

// ================= 07 · ศูนย์ข้อมูลและบทความ: ไวท์บอร์ดกรอบอะลูมิเนียม · ภาพวาดแทคติก · โน้ตปักหมุด · รางปากกา =================
export type LatestArticle = { id: number; title: string; area: string; createdAt: Date };

export function DataShowcase({ articles, total, byArea }: { articles: LatestArticle[]; total: number; byArea: Record<string, number> }) {
  const m = markerFont.className;
  return (
    <article id="dept-data" className={`${trainingFont.className} h-full scroll-mt-20 rounded-lg bg-linear-to-b from-[#d7dbe1] to-[#b9bfc8] p-2.5 shadow-[0_30px_60px_-30px_rgb(15_23_42/0.5)]`}>
      <div className="flex h-full flex-col rounded-sm bg-[#fdfdfb] p-6 text-[#111827] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <Index n={7} label="Data & Articles" className="text-[#1d4ed8]" />
          <DataCentreLogo className="h-14" />
        </div>
        <h2 className="mt-4 text-3xl font-bold leading-[1.05] sm:text-4xl">
          Technical Data
          <br />& Articles Centre
        </h2>
        <p className="mt-2 text-sm text-slate-600">ศูนย์ข้อมูลและบทความด้านเทคนิค ของฝ่ายเทคนิค สมาคมฯ</p>

        <div className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] sm:items-start">
          <PlayOnView className="rounded-md border border-slate-200 bg-white p-1">
            <TacticsBoard />
          </PlayOnView>
          <ul className="space-y-3">
            {articles.length > 0
              ? articles.map((a, i) => (
                  <li key={a.id}>
                    <Link href={`/training-centre/${a.id}`} className={`${styles.note} relative block bg-[#fef9c3] px-4 pb-3 pt-4 shadow-md`} style={{ transform: `rotate(${i % 2 ? 1.2 : -1.2}deg)` }}>
                      <span className="absolute left-1/2 top-1 h-3 w-3 -translate-x-1/2 rounded-full bg-red-600 shadow" />
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: AREA_INFO[a.area]?.color }}>
                        {TRAINING_CENTRE_AREAS.find((x) => x.value === a.area)?.label ?? a.area}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-sm font-semibold leading-snug">{a.title}</span>
                    </Link>
                  </li>
                ))
              : TRAINING_CENTRE_AREAS.map((a, i) => (
                  <li key={a.value}>
                    <Link href={`/training-centre?area=${a.value}`} className={`${styles.note} relative block bg-[#fef9c3] px-4 pb-3 pt-4 shadow-md`} style={{ transform: `rotate(${i % 2 ? 1.2 : -1.2}deg)` }}>
                      <span className="absolute left-1/2 top-1 h-3 w-3 -translate-x-1/2 rounded-full bg-red-600 shadow" />
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: AREA_INFO[a.value]?.color }}>
                        {a.label}
                      </span>
                      <span className="mt-0.5 block text-sm font-semibold">{AREA_INFO[a.value]?.th}</span>
                      <span className="block text-xs text-slate-500">{byArea[a.value] ? `${byArea[a.value]} บทความ` : "เร็วๆ นี้"}</span>
                    </Link>
                  </li>
                ))}
          </ul>
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-8">
          <Link href="/training-centre" className={`${m} inline-flex items-center gap-2 text-2xl text-[#1d4ed8] underline decoration-[#1d4ed8]/40 decoration-2 underline-offset-8 hover:decoration-[#1d4ed8]`}>
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
    </article>
  );
}
