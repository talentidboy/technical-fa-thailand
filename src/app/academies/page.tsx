import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getAcademyUser, getCurrentUser } from "@/lib/auth";
import { ACADEMY_LEVELS, LEVEL_META, compareAcademies, isLevel, levelRank, showPublicly } from "@/lib/academy";
import { loadAcademies, matchesQuery } from "@/lib/academy-data";
import { LEVEL_SUMMARY, criteriaCount } from "@/lib/academy-criteria";
import { academyBg } from "@/lib/section-images";
import { StateChip } from "@/components/academy/AcademyUi";
import { CriteriaExplorer } from "@/components/academy/CriteriaExplorer";
import { ThailandMap } from "@/components/academy/ThailandMap";
import { InfoDialog } from "@/components/academy/InfoDialog";
import { PublicFooter, PublicHeader } from "@/components/academy/PublicChrome";
import { MEDAL, Medal } from "@/components/academy/Medal";
import { AcademyCrest } from "@/components/academy/AcademyCrest";
import { InView } from "@/components/academy/InView";
import { CountUp } from "@/components/play-and-learn/CountUp";
import { academyFont } from "@/components/typefaces/academy";
import theme from "@/components/academy/public.module.css";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Academy Licensing — ทำเนียบอคาเดมีที่ได้รับการรับรอง | FA Thailand",
  description: "ทำเนียบอคาเดมีฟุตบอลเยาวชนที่ได้รับใบอนุญาตรับรองมาตรฐาน FAT Bronze / Silver / Gold จากสมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์",
};

const PAGE = 12;
const LEVELS_DESC = [...ACADEMY_LEVELS].reverse();
const eyebrow = "text-[11px] font-semibold uppercase tracking-[0.26em]";
const darkLink = "font-semibold text-white underline decoration-white/30 decoration-2 underline-offset-[6px] transition-colors hover:decoration-(--gold)";
const i = (n: number) => ({ "--i": n }) as React.CSSProperties;
// พื้นโลหะของแต่ละระดับ (ริบบิ้น → ขอบ → หน้าเหรียญ)
const metal = (l: keyof typeof MEDAL) => `linear-gradient(120deg, ${MEDAL[l].ribbon}, ${MEDAL[l].face} 45%, ${MEDAL[l].ring} 70%, ${MEDAL[l].face})`;

const STEPS = [
  { title: "สมัครบัญชีอคาเดมี", text: "ลงทะเบียนผู้ดูแลอคาเดมี ใช้งานพอร์ทัลได้ทันที" },
  { title: "กรอกข้อมูลอคาเดมี", text: "บุคลากร ทีม และนักเตะ — ระบบตรวจเกณฑ์ที่นับได้ให้อัตโนมัติ" },
  { title: "ยื่นขอพร้อมหลักฐาน", text: "แนบเอกสารทีละข้อตามเกณฑ์ของระดับที่ขอ" },
  { title: "สมาคมฯ ตรวจและรับรอง", text: "ติดตามผลการตรวจรายข้อ และรับใบอนุญาตออนไลน์" },
];

// หน้าสาธารณะ: ทำเนียบอคาเดมีที่ได้รับการรับรอง — ไม่แสดงชื่อผู้ประสานงาน เบอร์ และอีเมล (ข้อมูลส่วนบุคคล)
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
  const provinces = [...all.reduce((m, a) => (a.province ? m.set(a.province, (m.get(a.province) ?? 0) + 1) : m), new Map<string, number>())].sort((a, b) =>
    a[0].localeCompare(b[0], "th"),
  );
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

      {/* ===== ฮีโร่ + แผนที่ ===== */}
      <section id="map" className="relative isolate scroll-mt-16 overflow-hidden bg-(--night) text-white">
        <Image src={academyBg} alt="" fill priority placeholder="blur" sizes="100vw" className={`${theme.kenburns} -z-20 object-cover opacity-35`} />
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-(--night) via-(--night)/90 to-(--night)/55" />
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-(--night) via-transparent to-(--night)/40" />

        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-14 sm:px-6 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-16 lg:py-16">
          <div>
            <p className={`${theme.rise} ${eyebrow} flex items-center gap-3 text-(--gold)`} style={i(0)}>
              <span className="h-px w-10 bg-(--gold)" />
              FAT Academy Licensing · FIFA Grow Together
            </p>
            <h1 className="mt-6 text-[2.7rem] font-bold leading-[1.08] sm:text-6xl xl:text-7xl">
              <span className={`${theme.rise} block`} style={i(1)}>
                อคาเดมีฟุตบอล
              </span>
              <span className={`${theme.rise} block`} style={i(2)}>
                เยาวชน
              </span>
              <span className={`${theme.rise} block text-(--gold)`} style={i(3)}>
                ที่ผ่านการรับรอง
              </span>
            </h1>
            <p className={`${theme.rise} mt-6 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg`} style={i(4)}>
              ทำเนียบศูนย์ฝึกเยาวชนที่ได้รับใบอนุญาตจากสมาคมฯ ตามเกณฑ์ FIFA และ AFC — ค้นหาตามจังหวัด หรือดูตามระดับ Gold · Silver · Bronze
            </p>
            <div className={`${theme.rise} mt-8 flex flex-wrap items-center gap-x-7 gap-y-4`} style={i(5)}>
              <a href="#directory" className="group inline-flex h-13 items-center justify-center gap-2.5 rounded-xl bg-(--gold) px-7 text-sm font-bold text-(--night) shadow-[0_10px_30px_-10px_rgb(242_193_78/0.7)] transition-transform hover:-translate-y-0.5">
                <Search className="h-4 w-4" />
                ค้นหาอคาเดมี
              </a>
              <Link href={applyHref} className={`${darkLink} inline-flex items-center gap-1.5 text-sm`}>
                {academyUser ? "พอร์ทัลอคาเดมีของฉัน" : "ยื่นขอใบอนุญาต"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* จำนวนรวม + สัดส่วนตามระดับ */}
            <div className={`${theme.rise} mt-12 max-w-lg`} style={i(6)}>
              <p className="flex items-baseline gap-3">
                <span className="text-5xl font-bold tabular-nums sm:text-6xl">
                  <CountUp value={all.length.toLocaleString("en-US")} />
                </span>
                <span className="text-sm text-white/65">
                  อคาเดมีที่ได้รับการรับรอง
                  <br />
                  ใน {provinces.length} จังหวัด
                </span>
              </p>
              <div className="mt-5 flex h-2.5 gap-1 overflow-hidden rounded-full" role="img" aria-label="สัดส่วนอคาเดมีตามระดับ">
                {LEVELS_DESC.map((l) => (
                  <span key={l} className="h-full rounded-full" style={{ width: `${Math.max(3, (count(l) / Math.max(1, all.length)) * 100)}%`, background: metal(l) }} />
                ))}
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-3">
                {LEVELS_DESC.map((l) => (
                  <div key={l} className="flex items-center gap-2.5">
                    <Medal level={l} size="sm" />
                    <div className="flex flex-col-reverse">
                      <dt className="text-[11px] text-white/55">{LEVEL_META[l].label}</dt>
                      <dd className="text-xl font-bold tabular-nums">
                        <CountUp value={count(l).toLocaleString("en-US")} />
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>

            <div className={`${theme.rise} mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm`} style={i(7)}>
              <InfoDialog title="Academy Licensing คืออะไร" className={darkLink} label="เกี่ยวกับโครงการ">
                <p className="text-sm leading-relaxed">
                  ระบบการออกใบอนุญาตรับรองมาตรฐานศูนย์ฝึกเยาวชนหรืออคาเดมีฟุตบอล (Youth Football Academy) ที่จัดทำโดยสมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์ (FAT)
                  ภายใต้โครงการความร่วมมือกับ FIFA (Grow Together) และอิงเกณฑ์มาตรฐานของสมาพันธ์ฟุตบอลแห่งเอเชีย (AFC)
                </p>
                <ul className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
                  {ACADEMY_LEVELS.map((l) => (
                    <li key={l} className="flex items-center gap-3 py-3">
                      <Medal level={l} size="sm" />
                      <span>
                        <span className="block font-semibold text-slate-900">{LEVEL_SUMMARY[l].title}</span>
                        <span className="block text-xs text-slate-500">{LEVEL_SUMMARY[l].audience.th}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs leading-relaxed text-slate-500">อคาเดมีระดับ Gold ยื่นขอรับรองระดับเอเชีย AFC Elite Youth Scheme (1–3 ดาว) ผ่านสมาคมฯ ได้</p>
                <Link href={applyHref} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0a1630] px-5 py-3 text-sm font-semibold text-white hover:bg-[#13306a]">
                  {academyUser ? "ไปที่พอร์ทัลอคาเดมี" : "สมัครและยื่นขอใบอนุญาตออนไลน์"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </InfoDialog>
              <InfoDialog wide title="เกณฑ์มาตรฐานอคาเดมี" className={darkLink} label="เกณฑ์มาตรฐาน">
                <CriteriaExplorer />
              </InfoDialog>
            </div>
          </div>
          <div className={theme.rise} style={i(3)}>
            <ThailandMap academies={all.map((a) => ({ id: a.id, nameEn: a.nameEn, nameTh: a.nameTh, province: a.province, level: a.level }))} />
          </div>
        </div>
      </section>

      {/* ===== แถบตราอคาเดมีวิ่ง ===== */}
      {ribbon.length > 0 && (
        <section aria-label="อคาเดมีที่ได้รับการรับรอง" className="border-y border-white/10 bg-(--night-2) py-5">
          <div className={theme.marquee}>
            <div className={theme.track}>
              {[0, 1].map((k) => (
                <ul key={k} aria-hidden={k === 1} className="flex flex-none items-center gap-3 pr-3">
                  {ribbon.map((a) => (
                    <li key={a.id}>
                      <Link href={`/academies/${a.id}`} tabIndex={k === 1 ? -1 : undefined} className="flex items-center gap-3 rounded-xl bg-white/[0.04] py-2 pl-2 pr-5 ring-1 ring-white/10 transition-colors hover:bg-white/10">
                        <AcademyCrest name={a.nameEn} logoUrl={a.logoUrl} level={a.level} size="sm" />
                        <span className="flex flex-col">
                          <span className="whitespace-nowrap text-sm font-semibold text-white">{a.nameEn}</span>
                          <span className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: isLevel(a.level) ? MEDAL[a.level].ring : "#94a3b8" }}>
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
              <p className={`${theme.up} ${eyebrow} text-(--accent)`}>Official registry</p>
              <h2 className="mt-3 text-4xl font-bold leading-tight text-(--ink) sm:text-5xl">
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
                  พบ <span className="font-semibold text-(--ink)">{list.length.toLocaleString()}</span> จาก {all.length.toLocaleString()} ·{" "}
                  <Link href="/academies#directory" className="font-semibold text-(--ink) underline decoration-(--line) decoration-2 underline-offset-4 hover:decoration-(--accent)">
                    ล้างตัวกรอง
                  </Link>
                </>
              ) : (
                `ทั้งหมด ${all.length.toLocaleString()} อคาเดมี`
              )}
            </p>
          </InView>

          <form action="/academies#directory" className="mt-10 grid gap-2 rounded-2xl bg-white p-2 shadow-[0_20px_40px_-30px_rgb(10_22_48/0.5)] ring-1 ring-(--line) sm:grid-cols-[minmax(0,1fr)_12rem_10rem_auto]">
            <label className="relative">
              <span className="sr-only">ค้นหาชื่ออคาเดมี</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={q}
                placeholder="ค้นหาชื่ออคาเดมี (ไทย / อังกฤษ)"
                className="h-13 w-full rounded-xl bg-(--paper) pl-11 pr-3 text-sm text-(--ink) placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-(--ink)"
              />
            </label>
            <select name="province" defaultValue={province ?? ""} aria-label="จังหวัด" className="h-13 rounded-xl bg-(--paper) px-3 text-sm text-(--ink) focus:outline-none focus:ring-2 focus:ring-(--ink)">
              <option value="">ทุกจังหวัด</option>
              {provinces.map(([p, n]) => (
                <option key={p} value={p}>
                  {p} ({n})
                </option>
              ))}
            </select>
            <select name="level" defaultValue={level ?? ""} aria-label="ระดับ" className="h-13 rounded-xl bg-(--paper) px-3 text-sm text-(--ink) focus:outline-none focus:ring-2 focus:ring-(--ink)">
              <option value="">ทุกระดับ</option>
              {LEVELS_DESC.map((l) => (
                <option key={l} value={l}>
                  {LEVEL_META[l].label} ({count(l)})
                </option>
              ))}
            </select>
            <button type="submit" className="h-13 rounded-xl bg-(--ink) px-7 text-sm font-semibold text-white transition-colors hover:bg-[#13306a]">
              ค้นหา
            </button>
          </form>

          {/* ทางลัดกรองตามระดับ */}
          <nav aria-label="กรองตามระดับในทำเนียบ" className="mt-4 flex flex-wrap gap-2 text-sm">
            {[{ key: null, label: "ทุกระดับ", n: all.length }, ...LEVELS_DESC.map((l) => ({ key: l, label: LEVEL_META[l].label, n: count(l) }))].map((x) => {
              const active = level === x.key;
              return (
                <Link
                  key={x.label}
                  href={href({ level: x.key, page: null })}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition-colors ${active ? "bg-(--ink) text-white" : "bg-white text-(--ink-soft) ring-1 ring-(--line) hover:text-(--ink) hover:ring-(--ink)/30"}`}
                >
                  {x.key && <span className="h-2.5 w-2.5 rounded-full" style={{ background: metal(x.key) }} />}
                  {x.label}
                  <span className={active ? "text-white/60" : "text-slate-400"}>{x.n.toLocaleString()}</span>
                </Link>
              );
            })}
          </nav>

          {shown.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-dashed border-(--line) py-16 text-center text-sm text-(--ink-soft)">ไม่พบอคาเดมีตามเงื่อนไขที่ค้นหา</p>
          ) : (
            <InView as="ul" className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((a, n) => {
                const meta = isLevel(a.level) ? LEVEL_META[a.level] : null;
                const hex = isLevel(a.level) ? MEDAL[a.level].face : "#94a3b8";
                return (
                  <li key={a.id} className={theme.up} style={i(n)}>
                    <Link href={`/academies/${a.id}`} style={{ "--lv": hex } as React.CSSProperties} className={`${theme.card} group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-(--line)`}>
                      <span className="flex items-start gap-4">
                        <AcademyCrest name={a.nameEn} logoUrl={a.logoUrl} level={a.level} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: hex }}>
                            <span className="h-2 w-2 rounded-full" style={{ background: isLevel(a.level) ? metal(a.level) : hex }} />
                            {meta ? `FAT ${meta.label}` : "รอระดับ"}
                          </span>
                          <span className="mt-1 line-clamp-2 block font-bold leading-snug text-(--ink)">{a.nameEn}</span>
                          {a.nameTh && <span className="block truncate text-sm text-(--ink-soft)">{a.nameTh}</span>}
                        </span>
                      </span>
                      <span className="mt-auto flex items-center justify-between gap-3 pt-6">
                        <span className="flex min-w-0 items-center gap-1.5 text-xs text-(--ink-soft)">
                          <MapPin className="h-3.5 w-3.5 flex-none" />
                          <span className="truncate">{a.province ?? "ไม่ระบุจังหวัด"}</span>
                        </span>
                        <span className="flex flex-none items-center gap-2">
                          {a.state !== "active" && <StateChip state={a.state} />}
                          <span className={`${theme.cardGo} flex h-8 w-8 items-center justify-center rounded-full bg-(--paper) text-(--ink)`}>
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </span>
                      </span>
                      <span className={`${theme.cardBar} absolute inset-x-0 bottom-0 h-1`} style={{ background: isLevel(a.level) ? metal(a.level) : hex }} />
                    </Link>
                  </li>
                );
              })}
            </InView>
          )}

          {pages > 1 && (
            <nav aria-label="หน้า" className="mt-10 flex items-center justify-between gap-3 text-sm">
              {page > 1 ? (
                <Link href={href({ page: String(page - 1) })} className="inline-flex items-center gap-1 rounded-lg bg-white px-4 py-2.5 font-semibold text-(--ink) ring-1 ring-(--line) hover:ring-(--ink)">
                  <ChevronLeft className="h-4 w-4" />
                  ก่อนหน้า
                </Link>
              ) : (
                <span />
              )}
              <span className="text-(--ink-soft)">
                หน้า <span className="font-semibold text-(--ink)">{page}</span> จาก {pages}
              </span>
              {page < pages ? (
                <Link href={href({ page: String(page + 1) })} className="inline-flex items-center gap-1 rounded-lg bg-white px-4 py-2.5 font-semibold text-(--ink) ring-1 ring-(--line) hover:ring-(--ink)">
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

      {/* ===== มาตรฐาน 3 ระดับ ===== */}
      <section id="levels" className="scroll-mt-16 bg-(--night) text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <InView className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-end">
            <div>
              <p className={`${theme.up} ${eyebrow} text-(--gold)`}>Standards</p>
              <h2 className="mt-3 text-4xl font-bold leading-tight sm:text-6xl">
                <span className={theme.line}>
                  <span style={i(0)}>ใบอนุญาต 3 ระดับ</span>
                </span>
                <span className={theme.line}>
                  <span style={i(1)} className="text-(--gold)">
                    จากทองแดงสู่ทอง
                  </span>
                </span>
              </h2>
            </div>
            <p className={`${theme.up} text-sm leading-relaxed text-white/65 sm:text-base`} style={i(2)}>
              แต่ละระดับมีเกณฑ์ 3 หมวด: การจัดการและองค์กร · การฝึกสอน · สุขภาพและสวัสดิการ — พัฒนาทีละขั้นจนพร้อมรับรองระดับเอเชีย
            </p>
          </InView>
          <InView as="ol" className="mt-14 grid grid-cols-1 items-end gap-5 md:grid-cols-3">
            {ACADEMY_LEVELS.map((l, n) => {
              const sm = LEVEL_SUMMARY[l];
              const top = l === "GOLD";
              const reqs = [["หัวหน้าอคาเดมี", sm.head], ["ผู้ฝึกสอน", sm.coaches], ...(sm.assistants ? [["ผู้ช่วยผู้ฝึกสอน", sm.assistants]] : []), ["จำนวนทีม", sm.teams]];
              return (
                <li key={l} className={theme.up} style={i(n * 2)}>
                  <article className={`${theme.tier} relative flex flex-col overflow-hidden rounded-3xl ${top ? "bg-white text-(--ink) ring-2 ring-(--gold) md:pb-4" : "bg-(--night-2) ring-1 ring-white/10"}`}>
                    <div className="relative h-24" style={{ background: metal(l) }}>
                      {top && <span className="absolute right-4 top-4 rounded-md bg-(--night) px-2.5 py-1 text-[11px] font-bold text-(--gold)">ระดับสูงสุด</span>}
                    </div>
                    <div className="-mt-11 flex flex-1 flex-col px-7 pb-7">
                      <div className="flex items-end justify-between gap-4">
                        <span className="rounded-full p-1.5" style={{ background: top ? "#fff" : "var(--night-2)" }}>
                          <Medal level={l} size="lg" />
                        </span>
                        <span className={`text-right text-xs ${top ? "text-(--ink-soft)" : "text-white/55"}`}>
                          <b className="block text-4xl font-bold tabular-nums">
                            <CountUp value={count(l).toLocaleString("en-US")} />
                          </b>
                          อคาเดมี
                        </span>
                      </div>
                      <h3 className="mt-14 text-3xl font-bold">{LEVEL_META[l].label}</h3>
                      <p className={`text-sm font-semibold ${top ? "text-(--ink-soft)" : "text-white/75"}`}>{sm.th}</p>
                      <p className={`mt-3 text-sm leading-relaxed ${top ? "text-(--ink-soft)" : "text-white/60"}`}>{sm.audience.th}</p>
                      <dl className="mt-6 text-sm">
                        {reqs.map(([k, v]) => (
                          <div key={k} className={`flex justify-between gap-3 border-t py-2.5 ${top ? "border-(--line)" : "border-white/10"}`}>
                            <dt className={top ? "text-(--ink-soft)" : "text-white/55"}>{k}</dt>
                            <dd className="text-right font-semibold">{v}</dd>
                          </div>
                        ))}
                      </dl>
                      <InfoDialog
                        wide
                        title="เกณฑ์มาตรฐานอคาเดมี"
                        className={`mt-6 inline-flex items-center justify-between gap-2 rounded-xl px-5 py-3.5 text-left text-sm font-semibold transition-colors ${
                          top ? "bg-(--ink) text-white hover:bg-[#13306a]" : "bg-white/[0.06] text-white ring-1 ring-white/15 hover:bg-white/10"
                        }`}
                        label={
                          <>
                            ดูเกณฑ์ทั้งหมด {criteriaCount(l)} ข้อ
                            <ArrowRight className="h-4 w-4" />
                          </>
                        }
                      >
                        <CriteriaExplorer initialLevel={l} />
                      </InfoDialog>
                    </div>
                  </article>
                </li>
              );
            })}
          </InView>
        </div>
      </section>

      {/* ===== ขั้นตอนการขอใบอนุญาต ===== */}
      <section id="apply" className="scroll-mt-16 px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <InView className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className={`${theme.up} ${eyebrow} text-(--accent)`}>How to apply</p>
              <h2 className="mt-3 text-4xl font-bold leading-tight text-(--ink) sm:text-5xl">
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
              <Link href={applyHref} className="inline-flex h-13 items-center gap-2 rounded-xl bg-(--ink) px-7 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">
                {academyUser ? "ไปที่พอร์ทัลอคาเดมี" : "สมัครบัญชีอคาเดมี"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {!academyUser && (
                <Link href="/academies/login" className="inline-flex h-13 items-center rounded-xl bg-white px-7 text-sm font-semibold text-(--ink) ring-1 ring-(--line) hover:ring-(--ink)">
                  เข้าสู่ระบบพอร์ทัล
                </Link>
              )}
            </div>
          </InView>
          <InView as="ol" className="relative mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {/* เส้นเชื่อมขั้นตอน (จอใหญ่) */}
            <span aria-hidden className="absolute left-7 right-[12%] top-7 hidden h-0.5 bg-(--line) lg:block">
              <span className={`${theme.grow} block h-full bg-(--gold)`} />
            </span>
            {STEPS.map((st, n) => (
              <li key={st.title} className="relative">
                <span className={`${theme.pop} relative flex h-14 w-14 items-center justify-center rounded-2xl bg-(--ink) text-xl font-bold text-(--gold) shadow-lg`} style={i(n)}>
                  {n + 1}
                </span>
                <div className={theme.up} style={i(n * 2 + 2)}>
                  <p className="mt-6 text-xl font-bold text-(--ink)">{st.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-(--ink-soft)">{st.text}</p>
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
