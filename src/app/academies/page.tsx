import Link from "next/link";
import type { Metadata } from "next";
import { getAcademyUser, getCurrentUser } from "@/lib/auth";
import { ACADEMY_LEVELS, LEVEL_META, compareAcademies, isLevel, levelRank, showPublicly, type AcademyLevel } from "@/lib/academy";
import { loadAcademies, matchesQuery } from "@/lib/academy-data";
import { LEVEL_SUMMARY, criteriaCount } from "@/lib/academy-criteria";
import { StateChip } from "@/components/academy/AcademyUi";
import { CriteriaExplorer } from "@/components/academy/CriteriaExplorer";
import { ThailandMap } from "@/components/academy/ThailandMap";
import { InfoDialog } from "@/components/academy/InfoDialog";
import { PublicFooter, PublicHeader } from "@/components/academy/PublicChrome";
import { COIN, Podium } from "@/components/academy/Podium";
import { AcademyCrest } from "@/components/academy/AcademyCrest";
import { InView } from "@/components/academy/InView";
import { LevelTabs } from "@/components/academy/LevelTabs";
import { Parallax } from "@/components/academy/Parallax";
import { CountUp } from "@/components/play-and-learn/CountUp";
import { academyFont, academyPoster } from "@/components/typefaces/academy";
import theme from "@/components/academy/public.module.css";
import { ArrowRight, Check, ChevronLeft, ChevronRight, MapPin, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Academy Licensing — ทำเนียบอคาเดมีที่ได้รับการรับรอง | FA Thailand",
  description: "ทำเนียบอคาเดมีฟุตบอลเยาวชนที่ได้รับใบอนุญาตรับรองมาตรฐาน FAT Bronze / Silver / Gold จากสมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์",
};

const PAGE = 12;
const LEVELS_DESC = [...ACADEMY_LEVELS].reverse();
const P = academyPoster.className;
const eyebrow = "text-[11px] font-bold uppercase tracking-[0.26em]";
const inkLink = "font-bold text-(--ink) underline decoration-(--ink)/30 decoration-2 underline-offset-[6px] transition-colors hover:decoration-(--ink)";
const i = (n: number) => ({ "--i": n }) as React.CSSProperties;
// ตัวอักษรสีระดับบนพื้นขาว (เข้มกว่าสีเหรียญให้อ่านง่าย)
const LEVEL_TEXT: Record<AcademyLevel, string> = { BRONZE: "#c14d14", SILVER: "#5b6b80", GOLD: "#a77700" };

const RIBBON = ["FAT Academy Licensing", "2025 Edition", "Gold", "Silver", "Bronze", "Youth Football"];

const STEPS = [
  { title: "สมัครบัญชีอคาเดมี", text: "ลงทะเบียนผู้ดูแลอคาเดมี ใช้งานพอร์ทัลได้ทันที" },
  { title: "กรอกข้อมูลอคาเดมี", text: "บุคลากร ทีม และนักเตะ — ระบบตรวจเกณฑ์ที่นับได้ให้อัตโนมัติ" },
  { title: "ยื่นขอพร้อมหลักฐาน", text: "แนบเอกสารทีละข้อตามเกณฑ์ของระดับที่ขอ" },
  { title: "สมาคมฯ ตรวจและรับรอง", text: "ติดตามผลการตรวจรายข้อ และรับใบอนุญาตออนไลน์" },
];

// เหรียญเล็กแบบเดียวกับบนแท่น (การ์ดระดับ)
function Coin({ level, className = "" }: { level: AcademyLevel; className?: string }) {
  const c = COIN[level];
  return (
    <svg viewBox="0 0 100 70" aria-hidden className={className}>
      <ellipse cx="50" cy="44" rx="44" ry="22" fill={c.side} />
      <rect x="6" y="30" width="88" height="14" fill={c.side} />
      <ellipse cx="50" cy="30" rx="44" ry="22" fill={c.face} />
      <ellipse cx="50" cy="30" rx="33" ry="16" fill="none" stroke={c.ring} strokeWidth="2.5" />
      <text x="50" y="38" textAnchor="middle" fontSize="22" fontWeight="800" fill={c.ink}>
        {c.letter}
      </text>
    </svg>
  );
}

// หน้าสาธารณะ: ทำเนียบอคาเดมีที่ได้รับการรับรอง (ธีมโปสเตอร์ FAT Level Academy: ฟ้า ดำ เหลือง ขาว) — ไม่แสดงชื่อผู้ประสานงาน เบอร์ และอีเมล
export default async function AcademiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; level?: string; province?: string; page?: string; criteria?: string }>;
}) {
  const sp = await searchParams;
  const [user, academyUser, rows] = await Promise.all([getCurrentUser(), getAcademyUser(), loadAcademies()]);
  const viewer = user?.role === "ADMIN" || user?.role === "STAFF" ? "admin" : academyUser ? "academy" : user ? "staff-other" : "guest";

  const all = rows.filter((a) => showPublicly(a.active, a.state));
  const q = (sp.q ?? "").trim();
  const level = isLevel(sp.level) ? sp.level : null;
  const province = sp.province?.trim() || null;
  const filtered = !!(q || level || province);
  const list = all
    .filter((a) => (!level || a.level === level) && (!province || a.province === province) && matchesQuery(a, q))
    .sort(compareAcademies);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const page = Math.min(pages, Math.max(1, Number(sp.page) || 1));
  const shown = list.slice((page - 1) * PAGE, page * PAGE);

  const count = (l: string) => all.filter((a) => a.level === l).length;
  const counts = Object.fromEntries(ACADEMY_LEVELS.map((l) => [l, count(l)])) as Record<AcademyLevel, number>;
  const byProvince = [...all.reduce((m, a) => (a.province ? m.set(a.province, (m.get(a.province) ?? 0) + 1) : m), new Map<string, number>())];
  const provinces = [...byProvince].sort((a, b) => a[0].localeCompare(b[0], "th"));
  const topProvinces = [...byProvince].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "th")).slice(0, 6);
  const href = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ q: q || null, level, province, ...patch })) if (v) p.set(k, v);
    const str = p.toString();
    return `/academies${str ? `?${str}` : ""}#directory`;
  };
  const applyHref = academyUser ? "/academies/portal" : "/academies/register";
  // แถบโลโก้วิ่ง: เฉพาะใบที่มีผล — มีโลโก้ก่อน แล้วเรียงระดับสูง → ต่ำ
  const ribbon = all
    .filter((a) => a.state === "active")
    .sort((a, b) => Number(!!b.logoUrl) - Number(!!a.logoUrl) || levelRank(b.level) - levelRank(a.level) || a.nameEn.localeCompare(b.nameEn))
    .slice(0, 28);

  return (
    <div className={`${theme.theme} ${academyFont.className} min-h-screen overflow-x-clip`}>
      <PublicHeader viewer={viewer} />

      <section id="map" className="scroll-mt-16">
        {/* ===== ฮีโร่: เวทีโปสเตอร์ — รัศมีแสง + แท่นสามมิติ + แถบตัวอักษรเอียง · ขยับตามเมาส์ ===== */}
        <Parallax className="relative isolate overflow-hidden bg-(--sky)">
          <span aria-hidden className="absolute -bottom-24 -left-24 -z-10 h-72 w-72 rounded-full bg-white/10" />

          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-6 px-4 pb-36 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,38rem)] lg:pb-40 lg:pt-12">
            <div>
              <p className={`${theme.rise} ${eyebrow} flex items-center gap-3 text-(--ink)`} style={i(0)}>
                <span className="h-1 w-10 rounded-full bg-(--ink)" />
                FAT Academy Licensing · 2025 Edition
              </p>
              <h1 className={`${P} mt-5 text-[2.8rem] font-extrabold leading-[1.02] text-(--ink) sm:text-7xl xl:text-[4.9rem]`}>
                <span className={`${theme.rise} block`} style={i(1)}>
                  อคาเดมีฟุตบอล
                </span>
                <span className={`${theme.rise} flex items-center gap-4`} style={i(2)}>
                  เยาวชน
                  <span aria-hidden className="inline-flex -rotate-6 flex-col rounded-2xl bg-(--yellow) px-3.5 py-1.5 text-center shadow-[4px_4px_0_var(--ink)] transition-transform duration-300 hover:rotate-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Criteria</span>
                    <span className="text-2xl leading-none sm:text-3xl">2025</span>
                  </span>
                </span>
                <span className={`${theme.rise} block text-white [text-shadow:4px_4px_0_var(--ink)]`} style={i(3)}>
                  ที่ผ่านการรับรอง
                </span>
              </h1>
              <p className={`${theme.rise} mt-5 max-w-lg text-base font-medium leading-relaxed text-(--ink)/80 sm:text-lg`} style={i(4)}>
                ทำเนียบศูนย์ฝึกเยาวชนที่ได้รับใบอนุญาตจากสมาคมฯ — ค้นหาตามจังหวัด หรือดูตามระดับ Gold · Silver · Bronze
              </p>
              <div className={`${theme.rise} mt-7 flex flex-wrap items-center gap-x-7 gap-y-4`} style={i(5)}>
                <a href="#directory" className="inline-flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-(--ink) px-8 text-base font-bold text-white shadow-[5px_5px_0_var(--yellow)] transition-transform hover:-translate-y-0.5">
                  <Search className="h-5 w-5" />
                  ค้นหาอคาเดมี
                </a>
                <Link href={applyHref} className={`${inkLink} inline-flex items-center gap-1.5 text-sm`}>
                  {academyUser ? "พอร์ทัลอคาเดมีของฉัน" : "ยื่นขอใบอนุญาต"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* แถบตัวเลข: กล่องขาวขอบดำ แบ่งช่อง */}
              <dl className={`${theme.rise} mt-8 inline-grid grid-cols-3 divide-x-2 divide-(--ink) overflow-hidden rounded-2xl bg-white text-(--ink) ring-2 ring-(--ink) shadow-[5px_5px_0_var(--ink)]`} style={i(6)}>
                {(
                  [
                    ["อคาเดมี", all.length.toLocaleString("en-US"), "bg-(--yellow)"],
                    ["จังหวัด", String(provinces.length), ""],
                    ["ระดับ", "3", ""],
                  ] as const
                ).map(([k, v, bg]) => (
                  <div key={k} className={`flex flex-col-reverse px-5 py-2.5 sm:px-6 ${bg}`}>
                    <dt className="text-xs font-bold">{k}</dt>
                    <dd className={`${P} text-3xl font-extrabold tabular-nums sm:text-4xl`}>
                      <CountUp value={v} />
                    </dd>
                  </div>
                ))}
              </dl>

              <div className={`${theme.rise} mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm`} style={i(7)}>
                <InfoDialog title="Academy Licensing คืออะไร" className={inkLink} label="เกี่ยวกับโครงการ">
                  <p className="text-sm leading-relaxed">
                    ระบบการออกใบอนุญาตรับรองมาตรฐานศูนย์ฝึกเยาวชนหรืออคาเดมีฟุตบอล (Youth Football Academy) ที่จัดทำโดยสมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์ (FAT)
                    อิงเกณฑ์มาตรฐานของสมาพันธ์ฟุตบอลแห่งเอเชีย (AFC) · เกณฑ์ฉบับปี 2025 (2025 Edition)
                  </p>
                  <ul className="mt-5 space-y-2">
                    {ACADEMY_LEVELS.map((l) => (
                      <li key={l} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
                        <Coin level={l} className="h-9 w-12 flex-none" />
                        <span>
                          <span className="block font-bold text-slate-900">{LEVEL_SUMMARY[l].title}</span>
                          <span className="block text-xs text-slate-500">{LEVEL_SUMMARY[l].audience.th}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs leading-relaxed text-slate-500">อคาเดมีระดับ Gold ยื่นขอรับรองระดับเอเชีย AFC Elite Youth Scheme (1–3 ดาว) ผ่านสมาคมฯ ได้</p>
                  <Link href={applyHref} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0b1220] px-5 py-3 text-sm font-bold text-white hover:bg-[#1e96dc]">
                    {academyUser ? "ไปที่พอร์ทัลอคาเดมี" : "สมัครและยื่นขอใบอนุญาตออนไลน์"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </InfoDialog>
                <InfoDialog wide title="เกณฑ์มาตรฐานอคาเดมี" className={inkLink} label="เกณฑ์มาตรฐาน">
                  <CriteriaExplorer />
                </InfoDialog>
              </div>
            </div>

            {/* เวทีแท่น: รัศมีแสงหมุนช้าด้านหลัง (ขยับสวนเมาส์) + แท่น (ขยับตามเมาส์) */}
            <div className="relative">
              <div aria-hidden className="absolute left-1/2 top-1/2 -z-10 h-[52rem] w-[52rem] -translate-x-1/2 -translate-y-1/2">
                <div className={`${theme.far} h-full w-full`}>
                  <div className={`${theme.rays} h-full w-full rounded-full`} />
                </div>
              </div>
              <div className={theme.near}>
                <Podium counts={counts} className="mx-auto w-full max-w-2xl" />
              </div>
            </div>
          </div>

          {/* แถบตัวอักษรวิ่งไขว้กันท้ายฮีโร่ */}
          <div aria-hidden className={`${P} pointer-events-none absolute inset-x-0 bottom-8 h-16 select-none text-sm font-extrabold uppercase tracking-[0.18em] sm:text-base`}>
            <div className="absolute -inset-x-12 top-1 rotate-[1.6deg] overflow-hidden bg-(--yellow) py-2.5 text-(--ink)">
              <div className={`${theme.ribbon} ${theme.ribbonBack}`}>
                {[0, 1].map((k) => (
                  <span key={k} className="flex flex-none">
                    {Array.from({ length: 4 }, (_, n) =>
                      RIBBON.map((w) => (
                        <span key={`${n}-${w}`} className="flex items-center gap-5 pr-5 whitespace-nowrap">
                          {w}
                          <span className="h-2 w-2 rotate-45 bg-(--ink)" />
                        </span>
                      )),
                    )}
                  </span>
                ))}
              </div>
            </div>
            <div className="absolute -inset-x-12 top-1 -rotate-[1.6deg] overflow-hidden bg-(--ink) py-2.5 text-white">
              <div className={theme.ribbon}>
                {[0, 1].map((k) => (
                  <span key={k} className="flex flex-none">
                    {Array.from({ length: 4 }, (_, n) =>
                      RIBBON.map((w) => (
                        <span key={`${n}-${w}`} className="flex items-center gap-5 pr-5 whitespace-nowrap">
                          {w}
                          <span className="h-2 w-2 rotate-45 bg-(--yellow)" />
                        </span>
                      )),
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Parallax>

        {/* ===== แผนที่ ===== */}
        <div className="bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:py-20">
            <ThailandMap academies={all.map((a) => ({ id: a.id, nameEn: a.nameEn, nameTh: a.nameTh, province: a.province, level: a.level }))} />
            <InView>
              <p className={`${theme.up} ${eyebrow} text-(--sky-deep)`}>Academy map</p>
              <h2 className={`${P} mt-3 text-4xl font-extrabold leading-tight text-(--ink) sm:text-5xl`}>
                <span className={theme.line}>
                  <span style={i(0)}>อคาเดมีทั่วประเทศ</span>
                </span>
              </h2>
              <p className={`${theme.up} mt-3 max-w-md text-sm leading-relaxed text-(--ink-soft)`} style={i(1)}>
                แตะจังหวัดบนแผนที่เพื่อดูรายชื่ออคาเดมี หรือกรองเฉพาะระดับ Gold · Silver · Bronze จากแถบด้านบนของแผนที่
              </p>
              {topProvinces.length > 0 && (
                <ol className="mt-8 space-y-3">
                  {topProvinces.map(([name, n], k) => (
                    <li key={name} className={`${theme.up} grid grid-cols-[1.75rem_8.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm`} style={i(k + 2)}>
                      <span className={`${P} flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${k === 0 ? "bg-(--yellow) text-(--ink)" : "bg-(--sky-soft) text-(--sky-deep)"}`}>{k + 1}</span>
                      <Link href={href({ province: name, level: null, page: null })} className="truncate font-semibold text-(--ink) hover:text-(--sky-deep)">
                        {name}
                      </Link>
                      <span className="h-2.5 overflow-hidden rounded-full bg-(--sky-soft)">
                        <span className="block h-full rounded-full bg-(--sky)" style={{ width: `${(n / topProvinces[0][1]) * 100}%` }} />
                      </span>
                      <span className="text-right font-bold tabular-nums text-(--ink)">{n}</span>
                    </li>
                  ))}
                </ol>
              )}
            </InView>
          </div>
        </div>
      </section>

      {/* ===== แถบตราอคาเดมีวิ่ง ===== */}
      {ribbon.length > 0 && (
        <section aria-label="อคาเดมีที่ได้รับการรับรอง" className="bg-(--ink) py-5">
          <div className={theme.marquee}>
            <div className={theme.track}>
              {[0, 1].map((k) => (
                <ul key={k} aria-hidden={k === 1} className="flex flex-none items-center gap-3 pr-3">
                  {ribbon.map((a) => (
                    <li key={a.id}>
                      <Link href={`/academies/${a.id}`} tabIndex={k === 1 ? -1 : undefined} className="flex items-center gap-3 rounded-2xl bg-white/[0.06] py-2 pl-2 pr-5 transition-colors hover:bg-white/15">
                        <AcademyCrest name={a.nameEn} logoUrl={a.logoUrl} level={a.level} size="sm" />
                        <span className="flex flex-col">
                          <span className="whitespace-nowrap text-sm font-semibold text-white">{a.nameEn}</span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: isLevel(a.level) ? COIN[a.level].face : "#94a3b8" }}>
                            FAT {isLevel(a.level) ? LEVEL_META[a.level].label : ""}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== ทำเนียบ ===== */}
      <section id="directory" className="scroll-mt-16">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
          <InView className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className={`${theme.up} ${eyebrow} text-(--sky-deep)`}>Official registry</p>
              <h2 className={`${P} mt-3 text-4xl font-extrabold leading-tight text-(--ink) sm:text-5xl`}>
                <span className={theme.line}>
                  <span style={i(0)}>ทำเนียบอคาเดมี</span>
                </span>
                <span className={theme.line}>
                  <span style={i(1)}>ที่ได้รับการรับรอง</span>
                </span>
              </h2>
            </div>
            <p className={`${theme.up} text-sm text-(--ink-soft)`} style={i(2)}>
              {filtered ? (
                <>
                  พบ <span className="font-bold text-(--ink)">{list.length.toLocaleString()}</span> จาก {all.length.toLocaleString()} ·{" "}
                  <Link href="/academies#directory" className="font-bold text-(--ink) underline decoration-(--yellow) decoration-2 underline-offset-4">
                    ล้างตัวกรอง
                  </Link>
                </>
              ) : (
                `ทั้งหมด ${all.length.toLocaleString()} อคาเดมี`
              )}
            </p>
          </InView>

          <form action="/academies#directory" className="mt-10 grid gap-2 rounded-3xl bg-white p-2 shadow-[6px_6px_0_var(--ink)] ring-2 ring-(--ink) sm:grid-cols-[minmax(0,1fr)_12rem_10rem_auto]">
            <label className="relative">
              <span className="sr-only">ค้นหาชื่ออคาเดมี</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={q}
                placeholder="ค้นหาชื่ออคาเดมี (ไทย / อังกฤษ)"
                className="h-13 w-full rounded-2xl bg-(--paper) pl-11 pr-3 text-sm text-(--ink) placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-(--sky)"
              />
            </label>
            <select name="province" defaultValue={province ?? ""} aria-label="จังหวัด" className="h-13 rounded-2xl bg-(--paper) px-3 text-sm text-(--ink) focus:outline-none focus:ring-2 focus:ring-(--sky)">
              <option value="">ทุกจังหวัด</option>
              {provinces.map(([p, n]) => (
                <option key={p} value={p}>
                  {p} ({n})
                </option>
              ))}
            </select>
            <select name="level" defaultValue={level ?? ""} aria-label="ระดับ" className="h-13 rounded-2xl bg-(--paper) px-3 text-sm text-(--ink) focus:outline-none focus:ring-2 focus:ring-(--sky)">
              <option value="">ทุกระดับ</option>
              {LEVELS_DESC.map((l) => (
                <option key={l} value={l}>
                  {LEVEL_META[l].label} ({count(l)})
                </option>
              ))}
            </select>
            <button type="submit" className="h-13 rounded-2xl bg-(--yellow) px-7 text-sm font-bold text-(--ink) transition-colors hover:bg-[#ffe066]">
              ค้นหา
            </button>
          </form>

          {/* ทางลัดกรองตามระดับ */}
          <nav aria-label="กรองตามระดับในทำเนียบ" className="mt-5 flex flex-wrap gap-2 text-sm">
            {[{ key: null, label: "ทุกระดับ", n: all.length }, ...LEVELS_DESC.map((l) => ({ key: l, label: LEVEL_META[l].label, n: count(l) }))].map((x) => {
              const active = level === x.key;
              return (
                <Link
                  key={x.label}
                  href={href({ level: x.key, page: null })}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 font-bold transition-colors ${active ? "bg-(--ink) text-white" : "bg-white text-(--ink-soft) ring-1 ring-(--line) hover:text-(--ink) hover:ring-(--ink)"}`}
                >
                  {x.key && <span className="h-3 w-3 rounded-full" style={{ background: COIN[x.key].face }} />}
                  {x.label}
                  <span className={active ? "text-white/60" : "text-slate-400"}>{x.n.toLocaleString()}</span>
                </Link>
              );
            })}
          </nav>

          {shown.length === 0 ? (
            <p className="mt-8 rounded-3xl border-2 border-dashed border-(--line) py-16 text-center text-sm text-(--ink-soft)">ไม่พบอคาเดมีตามเงื่อนไขที่ค้นหา</p>
          ) : (
            <InView as="ul" className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((a, n) => {
                const lv = isLevel(a.level) ? a.level : null;
                return (
                  <li key={a.id} className={theme.up} style={i(n)}>
                    <Link href={`/academies/${a.id}`} className={`${theme.card} group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white p-5 ring-2 ring-(--ink)/10 hover:ring-(--ink)`}>
                      <span className="flex items-start gap-4">
                        <AcademyCrest name={a.nameEn} logoUrl={a.logoUrl} level={a.level} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: lv ? LEVEL_TEXT[lv] : "#94a3b8" }}>
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: lv ? COIN[lv].face : "#cbd5e1" }} />
                            {lv ? `FAT ${LEVEL_META[lv].label}` : "รอระดับ"}
                          </span>
                          <span className="mt-1 line-clamp-2 block font-bold leading-snug text-(--ink)">{a.nameEn}</span>
                          {a.nameTh && <span className="block truncate text-sm text-(--ink-soft)">{a.nameTh}</span>}
                        </span>
                      </span>
                      <span className="mt-auto flex items-center justify-between gap-3 pt-6">
                        <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-(--ink-soft)">
                          <MapPin className="h-3.5 w-3.5 flex-none text-(--sky)" />
                          <span className="truncate">{a.province ?? "ไม่ระบุจังหวัด"}</span>
                        </span>
                        <span className="flex flex-none items-center gap-2">
                          {a.state !== "active" && <StateChip state={a.state} />}
                          <span className={`${theme.cardGo} flex h-9 w-9 items-center justify-center rounded-full bg-(--sky-soft) text-(--ink)`}>
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </InView>
          )}

          {pages > 1 && (
            <nav aria-label="หน้า" className="mt-10 flex items-center justify-between gap-3 text-sm">
              {page > 1 ? (
                <Link href={href({ page: String(page - 1) })} className="inline-flex items-center gap-1 rounded-xl bg-white px-4 py-2.5 font-bold text-(--ink) ring-2 ring-(--ink) hover:bg-(--yellow)">
                  <ChevronLeft className="h-4 w-4" />
                  ก่อนหน้า
                </Link>
              ) : (
                <span />
              )}
              <span className="text-(--ink-soft)">
                หน้า <span className="font-bold text-(--ink)">{page}</span> จาก {pages}
              </span>
              {page < pages ? (
                <Link href={href({ page: String(page + 1) })} className="inline-flex items-center gap-1 rounded-xl bg-white px-4 py-2.5 font-bold text-(--ink) ring-2 ring-(--ink) hover:bg-(--yellow)">
                  ถัดไป
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </div>
      </section>

      {/* ===== มาตรฐาน 3 ระดับ: การ์ดโปสเตอร์ ===== */}
      <section id="levels" className="relative isolate scroll-mt-16 overflow-hidden bg-(--sky)">
        <span aria-hidden className="absolute -left-20 top-20 -z-10 h-64 w-64 rounded-full bg-white/10" />
        <span aria-hidden className="absolute -right-10 bottom-10 -z-10 h-40 w-40 rounded-full border-2 border-dashed border-white/40" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <InView className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-end">
            <div>
              <p className={`${theme.up} ${eyebrow} text-(--ink)`}>Standards 2025</p>
              <h2 className={`${P} mt-3 text-4xl font-extrabold leading-tight text-(--ink) sm:text-6xl`}>
                <span className={theme.line}>
                  <span style={i(0)}>ใบอนุญาต 3 ระดับ</span>
                </span>
                <span className={theme.line}>
                  <span style={i(1)} className="text-white [text-shadow:3px_3px_0_var(--ink)]">
                    จากทองแดงสู่ทอง
                  </span>
                </span>
              </h2>
            </div>
            <p className={`${theme.up} text-sm font-medium leading-relaxed text-(--ink)/80 sm:text-base`} style={i(2)}>
              แต่ละระดับมีเกณฑ์ 3 หมวด: การจัดการและองค์กร · โปรแกรมการฝึกสอน · สุขภาพและสวัสดิการ — พัฒนาทีละขั้นจนพร้อมรับรองระดับเอเชีย
            </p>
          </InView>
          {/* แท็บระดับ: กดแล้วแสดงเฉพาะการ์ดของระดับนั้น */}
          <div className="mt-14">
            <LevelTabs
              items={ACADEMY_LEVELS.map((l) => {
                const sm = LEVEL_SUMMARY[l];
                const reqs = [["หัวหน้าอคาเดมี", sm.head], ["ผู้ฝึกสอน", sm.coaches], ...(sm.assistants ? [["ผู้ช่วยผู้ฝึกสอน", sm.assistants]] : []), ["ทีม / นักกีฬา", sm.teams]];
                return {
                  key: l,
                  tab: (
                    <span className="flex flex-col items-center gap-2 px-2 py-4 text-center sm:flex-row sm:gap-4 sm:px-5 sm:text-left">
                      <Coin level={l} className="h-10 w-14 flex-none sm:h-12 sm:w-16" />
                      <span className="min-w-0">
                        <span className={`${P} block text-base font-extrabold leading-tight sm:text-xl`}>ระดับ{LEVEL_META[l].th}</span>
                        <span className="block text-xs font-semibold text-(--ink)/60">
                          {LEVEL_META[l].label} · {count(l).toLocaleString("en-US")} อคาเดมี
                        </span>
                      </span>
                    </span>
                  ),
                  panel: (
                    <article className="grid overflow-hidden rounded-3xl bg-white ring-2 ring-(--ink) shadow-[8px_8px_0_var(--ink)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                      <div className="flex flex-col justify-between gap-8 bg-(--sky-soft) p-6 sm:p-10">
                        <div>
                          <Coin level={l} className="h-24 w-36" />
                          <h3 className={`${P} mt-6 text-4xl font-extrabold uppercase leading-[0.95] text-(--ink) sm:text-5xl`}>
                            FAT <span style={{ color: LEVEL_TEXT[l] }}>{LEVEL_META[l].label}</span>
                            <span className="block text-2xl sm:text-3xl">Level Academy</span>
                          </h3>
                          <p className="mt-4 max-w-md leading-relaxed text-(--ink-soft)">{sm.audience.th}</p>
                        </div>
                        <p className="flex items-baseline gap-3">
                          <b className={`${P} text-6xl font-extrabold tabular-nums text-(--ink)`}>
                            <CountUp value={count(l).toLocaleString("en-US")} />
                          </b>
                          <span className="text-sm font-bold text-(--ink-soft)">อคาเดมีที่ได้รับการรับรอง</span>
                        </p>
                      </div>
                      <div className="flex flex-col p-6 sm:p-10">
                        {/* กล่องเหลืองข้อกำหนดหลัก (แบบโปสเตอร์) */}
                        <dl className="space-y-2 rounded-2xl bg-(--yellow) p-5 text-sm text-(--ink) sm:text-base">
                          {reqs.map(([k, v]) => (
                            <div key={k} className="flex justify-between gap-3">
                              <dt className="font-medium text-(--ink)/70">{k}</dt>
                              <dd className="text-right font-bold">{v}</dd>
                            </div>
                          ))}
                        </dl>
                        <ul className="mt-6 grid gap-3 text-sm text-(--ink) sm:grid-cols-2">
                          {sm.highlights.map((h) => (
                            <li key={h} className="flex gap-2.5">
                              <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-(--ink) text-(--yellow)">
                                <Check className="h-3 w-3" strokeWidth={3} />
                              </span>
                              {h}
                            </li>
                          ))}
                        </ul>
                        <InfoDialog
                          wide
                          title="เกณฑ์มาตรฐานอคาเดมี"
                          className="mt-8 inline-flex items-center justify-between gap-2 self-start rounded-2xl bg-(--ink) px-6 py-3.5 text-left text-sm font-bold text-white transition-colors hover:bg-(--sky-deep)"
                          label={
                            <>
                              ดูเกณฑ์ทั้งหมด {criteriaCount(l)} ข้อ
                              <ArrowRight className="h-4 w-4" />
                            </>
                          }
                        >
                          <CriteriaExplorer initialLevel={l} lockLevel />
                        </InfoDialog>
                      </div>
                    </article>
                  ),
                };
              })}
            />
          </div>
        </div>
      </section>

      {/* ===== ขั้นตอนการขอใบอนุญาต: ขั้นบันไดดำ ===== */}
      <section id="apply" className="scroll-mt-16 bg-white px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <InView className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className={`${theme.up} ${eyebrow} text-(--sky-deep)`}>How to apply</p>
              <h2 className={`${P} mt-3 text-4xl font-extrabold leading-tight text-(--ink) sm:text-5xl`}>
                <span className={theme.line}>
                  <span style={i(0)}>ขอใบอนุญาตออนไลน์</span>
                </span>
                <span className={theme.line}>
                  <span style={i(1)}>ใน 4 ขั้นตอน</span>
                </span>
              </h2>
              <p className={`${theme.up} mt-4 max-w-md text-sm leading-relaxed text-(--ink-soft)`} style={i(2)}>
                ทุกขั้นตอนทำผ่านพอร์ทัลอคาเดมี — ติดตามสถานะและความเห็นจากสมาคมฯ ได้ตลอด
              </p>
            </div>
            <div className={`${theme.up} flex flex-wrap gap-3`} style={i(3)}>
              <Link href={applyHref} className="inline-flex h-13 items-center gap-2 rounded-2xl bg-(--yellow) px-7 text-sm font-bold text-(--ink) shadow-[4px_4px_0_var(--ink)] transition-transform hover:-translate-y-0.5">
                {academyUser ? "ไปที่พอร์ทัลอคาเดมี" : "สมัครบัญชีอคาเดมี"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {!academyUser && (
                <Link href="/academies/login" className="inline-flex h-13 items-center rounded-2xl bg-white px-7 text-sm font-bold text-(--ink) ring-2 ring-(--ink) hover:bg-(--sky-soft)">
                  เข้าสู่ระบบพอร์ทัล
                </Link>
              )}
            </div>
          </InView>
          <InView as="ol" className="mt-14 grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((st, n) => (
              <li key={st.title} className={theme.up} style={{ ...i(n * 2), minHeight: `${13 + n * 2.5}rem` } as React.CSSProperties}>
                <div className="flex h-full flex-col rounded-3xl bg-(--ink) p-6 text-white">
                  <span className={`${theme.pop} ${P} flex h-14 w-14 items-center justify-center rounded-2xl bg-(--yellow) text-2xl font-extrabold text-(--ink)`} style={i(n)}>
                    {n + 1}
                  </span>
                  <p className={`${P} mt-auto pt-8 text-xl font-bold`}>{st.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{st.text}</p>
                </div>
              </li>
            ))}
          </InView>
        </div>
      </section>

      {/* ลิงก์เดิม ?criteria=GOLD#criteria → เปิดกล่องเกณฑ์ของระดับนั้นทันที */}
      <div id="criteria" />
      {isLevel(sp.criteria) && (
        <InfoDialog wide defaultOpen clearParam="criteria" title="เกณฑ์มาตรฐานอคาเดมี">
          <CriteriaExplorer initialLevel={sp.criteria} />
        </InfoDialog>
      )}

      <PublicFooter />
    </div>
  );
}
