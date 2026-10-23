import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getAcademyUser, getCurrentUser } from "@/lib/auth";
import { ACADEMY_LEVELS, LEVEL_META, compareAcademies, isLevel, showPublicly } from "@/lib/academy";
import { loadAcademies, matchesQuery } from "@/lib/academy-data";
import { LEVEL_SUMMARY, criteriaCount } from "@/lib/academy-criteria";
import { academyBg } from "@/lib/section-images";
import { StateChip } from "@/components/academy/AcademyUi";
import { CriteriaExplorer } from "@/components/academy/CriteriaExplorer";
import { ThailandMap } from "@/components/academy/ThailandMap";
import { InfoDialog } from "@/components/academy/InfoDialog";
import { PublicFooter, PublicHeader } from "@/components/academy/PublicChrome";
import { Medal } from "@/components/academy/Medal";
import { Seal } from "@/components/academy/Seal";
import { academySerif } from "@/components/typefaces/academy";
import theme from "@/components/academy/public.module.css";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Academy Licensing — ทำเนียบอคาเดมีที่ได้รับการรับรอง | FA Thailand",
  description: "ทำเนียบอคาเดมีฟุตบอลเยาวชนที่ได้รับใบอนุญาตรับรองมาตรฐาน FAT Bronze / Silver / Gold จากสมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์",
};

const PAGE = 12;
const LEVELS_DESC = [...ACADEMY_LEVELS].reverse();
const s = academySerif.className;
const GOLD = "#d9b45a";
const eyebrowLight = "text-[11px] font-semibold uppercase tracking-[0.26em] text-(--accent)";
const eyebrowDark = "text-[11px] font-semibold uppercase tracking-[0.26em] text-[#d9b45a]";
const darkLink = "font-semibold text-white underline decoration-white/30 decoration-2 underline-offset-4 transition-colors hover:decoration-[#d9b45a]";

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

  return (
    <div className={`${theme.theme} min-h-screen overflow-x-clip`}>
      <PublicHeader viewer={viewer} />

      {/* ===== ฮีโร่ + แผนที่ ===== */}
      <section id="map" className="relative isolate scroll-mt-16 overflow-hidden bg-(--night) text-white">
        <Image src={academyBg} alt="" fill priority placeholder="blur" sizes="100vw" className="-z-10 object-cover opacity-[0.13] grayscale" />
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-14 sm:px-6 lg:min-h-[calc(100svh-6rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-14 lg:py-12">
          <div className="relative">
            <div className="flex items-center gap-5">
              <Seal count={all.length} className="h-24 w-24 flex-none sm:h-28 sm:w-28" />
              <p className={`${eyebrowDark} leading-relaxed`}>
                FAT Academy Licensing
                <br />
                FIFA Grow Together
              </p>
            </div>
            <h1 className={`${s} mt-7 text-[2.5rem] font-bold leading-[1.15] sm:text-6xl`}>
              อคาเดมีฟุตบอลเยาวชน
              <br />
              <span style={{ color: GOLD }}>ที่ผ่านการรับรอง</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/70">
              ทำเนียบศูนย์ฝึกเยาวชนที่ได้รับใบอนุญาตจากสมาคมฯ ตามเกณฑ์ FIFA และ AFC ค้นหาตามจังหวัด หรือดูตามระดับ Gold · Silver · Bronze
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <a href="#directory" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#d9b45a] px-6 text-sm font-semibold text-(--night) transition-colors hover:bg-[#e4c272]">
                <Search className="h-4 w-4" />
                ค้นหาอคาเดมี
              </a>
              <Link href={applyHref} className={`${darkLink} inline-flex items-center gap-1.5 text-sm`}>
                {academyUser ? "พอร์ทัลอคาเดมีของฉัน" : "ยื่นขอใบอนุญาต"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* จำนวนตามระดับ (เหรียญ) */}
            <dl className="mt-11 grid max-w-lg grid-cols-3 gap-3">
              {LEVELS_DESC.map((l) => (
                <div key={l} className="flex items-center gap-3 rounded-xl bg-[#0e2148] px-3.5 py-3 ring-1 ring-white/10">
                  <Medal level={l} size="sm" />
                  <div className="flex flex-col-reverse">
                    <dt className="text-[11px] text-white/60">{LEVEL_META[l].label}</dt>
                    <dd className={`${s} text-2xl font-bold tabular-nums`}>{count(l).toLocaleString()}</dd>
                  </div>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm text-white/60">
              รวม <b className="font-semibold text-white">{all.length.toLocaleString()}</b> อคาเดมี ใน <b className="font-semibold text-white">{provinces.length}</b> จังหวัด
            </p>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
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
                        <span className={`${s} block font-semibold text-slate-900`}>{LEVEL_SUMMARY[l].title}</span>
                        <span className="block text-xs text-slate-500">{LEVEL_SUMMARY[l].audience.th}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs leading-relaxed text-slate-500">อคาเดมีระดับ Gold ยื่นขอรับรองระดับเอเชีย AFC Elite Youth Scheme (1–3 ดาว) ผ่านสมาคมฯ ได้</p>
                <Link href={applyHref} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0b1f44] px-5 py-3 text-sm font-semibold text-white hover:bg-[#13306a]">
                  {academyUser ? "ไปที่พอร์ทัลอคาเดมี" : "สมัครและยื่นขอใบอนุญาตออนไลน์"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </InfoDialog>
              <InfoDialog wide title="เกณฑ์มาตรฐานอคาเดมี" className={darkLink} label="เกณฑ์มาตรฐาน">
                <CriteriaExplorer />
              </InfoDialog>
            </div>
          </div>
          <ThailandMap academies={all.map((a) => ({ id: a.id, nameEn: a.nameEn, nameTh: a.nameTh, province: a.province, level: a.level }))} />
        </div>
      </section>

      {/* ===== ทำเนียบ: การ์ดใบรับรอง ===== */}
      <section id="directory" className="scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className={eyebrowLight}>Official registry</p>
              <h2 className={`${s} mt-2 text-3xl font-bold text-(--ink) sm:text-5xl`}>
                ทำเนียบอคาเดมี<span className="whitespace-nowrap">ที่ได้รับการรับรอง</span>
              </h2>
            </div>
            <p className="text-sm text-(--ink-soft)">
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
          </div>

          <form action="/academies#directory" className="mt-8 grid gap-2 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-(--line) sm:grid-cols-[minmax(0,1fr)_12rem_10rem_auto]">
            <label className="relative">
              <span className="sr-only">ค้นหาชื่ออคาเดมี</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={q}
                placeholder="ค้นหาชื่ออคาเดมี (ไทย / อังกฤษ)"
                className="h-12 w-full rounded-xl bg-(--paper) pl-10 pr-3 text-sm text-(--ink) placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-(--ink)"
              />
            </label>
            <select name="province" defaultValue={province ?? ""} aria-label="จังหวัด" className="h-12 rounded-xl bg-(--paper) px-3 text-sm text-(--ink) focus:outline-none focus:ring-2 focus:ring-(--ink)">
              <option value="">ทุกจังหวัด</option>
              {provinces.map(([p, n]) => (
                <option key={p} value={p}>
                  {p} ({n})
                </option>
              ))}
            </select>
            <select name="level" defaultValue={level ?? ""} aria-label="ระดับ" className="h-12 rounded-xl bg-(--paper) px-3 text-sm text-(--ink) focus:outline-none focus:ring-2 focus:ring-(--ink)">
              <option value="">ทุกระดับ</option>
              {LEVELS_DESC.map((l) => (
                <option key={l} value={l}>
                  {LEVEL_META[l].label} ({count(l)})
                </option>
              ))}
            </select>
            <button type="submit" className="h-12 rounded-xl bg-(--ink) px-6 text-sm font-semibold text-white transition-colors hover:bg-[#13306a]">
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
                  className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 font-semibold transition-colors ${active ? "bg-(--ink) text-white" : "bg-white text-(--ink-soft) ring-1 ring-(--line) hover:text-(--ink)"}`}
                >
                  {x.key && <span className="h-2.5 w-2.5 rounded-full" style={{ background: LEVEL_META[x.key].hex }} />}
                  {x.label}
                  <span className={active ? "text-white/70" : "text-slate-400"}>{x.n.toLocaleString()}</span>
                </Link>
              );
            })}
          </nav>

          {shown.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-dashed border-(--line) py-16 text-center text-sm text-(--ink-soft)">ไม่พบอคาเดมีตามเงื่อนไขที่ค้นหา</p>
          ) : (
            <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((a) => {
                const meta = isLevel(a.level) ? LEVEL_META[a.level] : null;
                return (
                  <li key={a.id}>
                    <Link href={`/academies/${a.id}`} className={`${theme.cert} group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-(--line)`}>
                      <span className="absolute inset-x-0 top-0 h-1" style={{ background: meta?.hex ?? "#cbd5e1" }} />
                      <span className="flex items-start justify-between gap-3">
                        <Medal level={a.level} size="sm" />
                        {a.state !== "active" && <StateChip state={a.state} />}
                      </span>
                      <span className={`${s} mt-5 block text-lg font-bold leading-snug text-(--ink) group-hover:text-(--accent)`}>{a.nameEn}</span>
                      {a.nameTh && <span className="mt-0.5 block text-sm text-(--ink-soft)">{a.nameTh}</span>}
                      <span className="mt-auto flex items-end justify-between gap-3 pt-5">
                        <span className="flex min-w-0 items-center gap-1.5 text-xs text-(--ink-soft)">
                          <MapPin className="h-3.5 w-3.5 flex-none" />
                          <span className="truncate">{a.province ?? "ไม่ระบุจังหวัด"}</span>
                        </span>
                        <span className="flex-none text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: meta?.hex ?? "#94a3b8" }}>
                          {meta ? `FAT ${meta.label}` : "รอระดับ"}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {pages > 1 && (
            <nav aria-label="หน้า" className="mt-8 flex items-center justify-between gap-3 text-sm">
              {page > 1 ? (
                <Link href={href({ page: String(page - 1) })} className="inline-flex items-center gap-1 rounded-lg bg-white px-3.5 py-2 font-semibold text-(--ink) ring-1 ring-(--line) hover:ring-(--ink)">
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
                <Link href={href({ page: String(page + 1) })} className="inline-flex items-center gap-1 rounded-lg bg-white px-3.5 py-2 font-semibold text-(--ink) ring-1 ring-(--line) hover:ring-(--ink)">
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

      {/* ===== มาตรฐาน 3 ระดับ: เหรียญ ===== */}
      <section id="levels" className="scroll-mt-16 bg-(--night) text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className={eyebrowDark}>Standards</p>
          <h2 className={`${s} mt-2 text-3xl font-bold sm:text-5xl`}>ใบอนุญาต 3 ระดับ</h2>
          <p className="mt-3 max-w-2xl text-sm text-white/65">พัฒนาทีละขั้นจากระดับทองแดงสู่ระดับทอง แต่ละระดับมีเกณฑ์ 3 หมวด: การจัดการและองค์กร · การฝึกสอน · สุขภาพและสวัสดิการ</p>
          <ol className="mt-12 grid grid-cols-1 items-end gap-5 md:grid-cols-3">
            {ACADEMY_LEVELS.map((l, i) => {
              const sm = LEVEL_SUMMARY[l];
              const reqs = [["หัวหน้าอคาเดมี", sm.head], ["ผู้ฝึกสอน", sm.coaches], ...(sm.assistants ? [["ผู้ช่วยผู้ฝึกสอน", sm.assistants]] : []), ["จำนวนทีม", sm.teams]];
              return (
                <li key={l} className={`relative ${i === 1 ? "md:-translate-y-4" : i === 2 ? "md:-translate-y-8" : ""}`}>
                  {i > 0 && <ChevronRight aria-hidden className="absolute -left-4 top-24 hidden h-6 w-6 -translate-x-1/2 text-white/30 md:block" />}
                  <article className="flex flex-col rounded-2xl bg-[#0e2148] p-7 ring-1 ring-white/10">
                    <div className="flex items-start justify-between gap-4">
                      <Medal level={l} size="lg" />
                      <span className="text-right text-xs text-white/55">
                        <b className={`${s} block text-3xl font-bold text-white`}>{count(l).toLocaleString()}</b>
                        อคาเดมี
                      </span>
                    </div>
                    <h3 className={`${s} mt-9 text-3xl font-bold`} style={{ color: LEVEL_META[l].hex === "#8a96a6" ? "#cfd6de" : LEVEL_META[l].hex }}>
                      {LEVEL_META[l].label}
                    </h3>
                    <p className="text-sm font-semibold text-white/80">{sm.th}</p>
                    <p className="mt-3 text-sm leading-relaxed text-white/60">{sm.audience.th}</p>
                    <dl className="mt-5 text-sm">
                      {reqs.map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-3 border-t border-white/10 py-2">
                          <dt className="text-white/55">{k}</dt>
                          <dd className="text-right font-semibold">{v}</dd>
                        </div>
                      ))}
                    </dl>
                    <InfoDialog
                      wide
                      title="เกณฑ์มาตรฐานอคาเดมี"
                      className="mt-5 inline-flex items-center justify-between gap-2 rounded-lg bg-white/[0.06] px-4 py-3 text-left text-sm font-semibold text-white ring-1 ring-white/15 hover:bg-white/10"
                      label={
                        <>
                          ดูเกณฑ์ทั้งหมด {criteriaCount(l)} ข้อ
                          <ArrowRight className="h-4 w-4" />
                        </>
                      }
                    >
                      <CriteriaExplorer initialLevel={l} />
                    </InfoDialog>
                  </article>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ===== ขั้นตอนการขอใบอนุญาต ===== */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
            <div>
              <p className={eyebrowLight}>How to apply</p>
              <h2 className={`${s} mt-2 text-3xl font-bold text-(--ink) sm:text-5xl`}>ขอใบอนุญาตออนไลน์ใน 4 ขั้นตอน</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-(--ink-soft)">ทุกขั้นตอนทำผ่านพอร์ทัลอคาเดมี — ติดตามสถานะและความเห็นจากสมาคมฯ ได้ตลอด</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={applyHref} className="inline-flex h-12 items-center gap-2 rounded-lg bg-(--ink) px-6 text-sm font-semibold text-white hover:bg-[#13306a]">
                  {academyUser ? "ไปที่พอร์ทัลอคาเดมี" : "สมัครบัญชีอคาเดมี"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {!academyUser && (
                  <Link href="/academies/login" className="inline-flex h-12 items-center rounded-lg px-6 text-sm font-semibold text-(--ink) ring-1 ring-(--line) hover:ring-(--ink)">
                    เข้าสู่ระบบพอร์ทัล
                  </Link>
                )}
              </div>
            </div>
            <ol className="relative grid grid-cols-1 gap-4 sm:grid-cols-2">
              {STEPS.map((st, i) => (
                <li key={st.title} className="rounded-2xl bg-white p-6 ring-1 ring-(--line)">
                  <span className={`${s} flex h-11 w-11 items-center justify-center rounded-full border-2 border-(--accent) text-lg font-bold text-(--accent)`}>{i + 1}</span>
                  <p className={`${s} mt-4 text-xl font-bold text-(--ink)`}>{st.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-(--ink-soft)">{st.text}</p>
                </li>
              ))}
            </ol>
          </div>
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
