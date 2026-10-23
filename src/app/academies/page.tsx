import Link from "next/link";
import type { Metadata } from "next";
import { getAcademyUser, getCurrentUser } from "@/lib/auth";
import { ACADEMY_LEVELS, LEVEL_META, compareAcademies, isLevel, showPublicly } from "@/lib/academy";
import { loadAcademies, matchesQuery } from "@/lib/academy-data";
import { LEVEL_SUMMARY, criteriaCount } from "@/lib/academy-criteria";
import { LevelMark, StateChip } from "@/components/academy/AcademyUi";
import { CriteriaExplorer } from "@/components/academy/CriteriaExplorer";
import { ThailandMap } from "@/components/academy/ThailandMap";
import { InfoDialog } from "@/components/academy/InfoDialog";
import { PublicFooter, PublicHeader } from "@/components/academy/PublicChrome";
import { display } from "@/components/fonts";
import theme from "@/components/academy/public.module.css";
import { ArrowRight, ChevronLeft, ChevronRight, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Academy Licensing — ทำเนียบอคาเดมีที่ได้รับการรับรอง | FA Thailand",
  description: "ทำเนียบอคาเดมีฟุตบอลเยาวชนที่ได้รับใบอนุญาตรับรองมาตรฐาน FAT Bronze / Silver / Gold จากสมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์",
};

const PAGE = 12;
const LEVELS_DESC = [...ACADEMY_LEVELS].reverse();
const h = display.className;
const eyebrow = "text-[11px] font-bold uppercase tracking-[0.2em] text-(--accent)";
const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-md bg-(--ink) px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-(--ink)/90";
const textLink = "font-semibold text-(--ink) underline decoration-(--line) decoration-2 underline-offset-4 transition-colors hover:decoration-(--accent)";

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
    const s = p.toString();
    return `/academies${s ? `?${s}` : ""}#directory`;
  };
  const applyHref = academyUser ? "/academies/portal" : "/academies/register";

  return (
    <div className={`${theme.theme} min-h-screen`}>
      <PublicHeader viewer={viewer} />

      {/* ===== แผนที่ ===== */}
      <section id="map" className="scroll-mt-16 border-b border-(--line)">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:min-h-[calc(100svh-6rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-16 lg:py-8">
          <div>
            <p className={eyebrow}>FAT Academy Licensing</p>
            <h1 className={`${h} mt-4 text-[2.6rem] font-semibold leading-[1.08] tracking-tight text-(--ink) sm:text-6xl`}>
              อคาเดมีฟุตบอลเยาวชน
              <br />
              ที่ผ่านการรับรอง
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-(--ink-soft)">
              ทำเนียบศูนย์ฝึกเยาวชนที่ได้รับใบอนุญาตจากสมาคมฯ ตามเกณฑ์ FIFA และ AFC ค้นหาตามจังหวัด หรือดูตามระดับ Gold · Silver · Bronze
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <a href="#directory" className={btnPrimary}>
                <Search className="h-4 w-4" />
                ค้นหาอคาเดมี
              </a>
              <Link href={applyHref} className={`${textLink} inline-flex items-center gap-1.5 text-sm`}>
                {academyUser ? "พอร์ทัลอคาเดมีของฉัน" : "ยื่นขอใบอนุญาต"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* ตัวเลขสรุปแบบป้ายคะแนน */}
            <dl className="mt-10 grid grid-cols-2 border-y border-(--line) sm:grid-cols-5">
              {[
                { key: "all", label: "อคาเดมี", n: all.length, mark: null },
                { key: "prov", label: "จังหวัด", n: provinces.length, mark: null },
                ...LEVELS_DESC.map((l) => ({ key: l, label: LEVEL_META[l].label, n: count(l), mark: LEVEL_META[l].hex })),
              ].map((s, i) => (
                <div key={s.key} className={`flex flex-col-reverse border-(--line) py-3.5 pr-3 ${i % 2 ? "border-l pl-4" : ""} ${i > 1 ? "border-t sm:border-t-0" : ""} ${i ? "sm:border-l sm:pl-4" : ""}`}>
                  <dt className="flex items-center gap-1.5 text-xs text-(--ink-soft)">
                    {s.mark && <span className="h-2 w-2 rounded-xs" style={{ background: s.mark }} />}
                    {s.label}
                  </dt>
                  <dd className={`${h} text-3xl font-semibold tabular-nums text-(--ink)`}>{s.n.toLocaleString()}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <InfoDialog title="Academy Licensing คืออะไร" className={textLink} label="เกี่ยวกับโครงการ">
                <p className="text-sm leading-relaxed">
                  ระบบการออกใบอนุญาตรับรองมาตรฐานศูนย์ฝึกเยาวชนหรืออคาเดมีฟุตบอล (Youth Football Academy) ที่จัดทำโดยสมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์ (FAT)
                  ภายใต้โครงการความร่วมมือกับ FIFA (Grow Together) และอิงเกณฑ์มาตรฐานของสมาพันธ์ฟุตบอลแห่งเอเชีย (AFC)
                </p>
                <ul className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
                  {ACADEMY_LEVELS.map((l) => (
                    <li key={l} className="flex items-center gap-3 py-3">
                      <span className="h-8 w-1.5 flex-none" style={{ background: LEVEL_META[l].hex }} />
                      <span>
                        <span className={`${h} block font-semibold text-slate-900`}>{LEVEL_SUMMARY[l].title}</span>
                        <span className="block text-xs text-slate-500">{LEVEL_SUMMARY[l].audience.th}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs leading-relaxed text-slate-500">อคาเดมีระดับ Gold ยื่นขอรับรองระดับเอเชีย AFC Elite Youth Scheme (1–3 ดาว) ผ่านสมาคมฯ ได้</p>
                <Link href={applyHref} className={`${btnPrimary} mt-5 w-full bg-[#0b1f44]`}>
                  {academyUser ? "ไปที่พอร์ทัลอคาเดมี" : "สมัครและยื่นขอใบอนุญาตออนไลน์"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </InfoDialog>
              <InfoDialog wide title="เกณฑ์มาตรฐานอคาเดมี" className={textLink} label="เกณฑ์มาตรฐาน">
                <CriteriaExplorer />
              </InfoDialog>
            </div>
          </div>
          <ThailandMap academies={all.map((a) => ({ id: a.id, nameEn: a.nameEn, nameTh: a.nameTh, province: a.province, level: a.level }))} />
        </div>
      </section>

      {/* ===== ทำเนียบ ===== */}
      <section id="directory" className="scroll-mt-16 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className={eyebrow}>Directory</p>
              <h2 className={`${h} mt-2 text-3xl font-semibold tracking-tight text-(--ink) sm:text-4xl`}>อคาเดมีที่ได้รับการรับรอง</h2>
            </div>
            <p className="text-sm text-(--ink-soft)">
              {filtered ? (
                <>
                  พบ <span className="font-semibold text-(--ink)">{list.length.toLocaleString()}</span> จาก {all.length.toLocaleString()} ·{" "}
                  <Link href="/academies#directory" className={textLink}>
                    ล้างตัวกรอง
                  </Link>
                </>
              ) : (
                `ทั้งหมด ${all.length.toLocaleString()} อคาเดมี`
              )}
            </p>
          </div>

          <form action="/academies#directory" className="mt-6 grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_10rem_auto]">
            <label className="relative">
              <span className="sr-only">ค้นหาชื่ออคาเดมี</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={q}
                placeholder="ค้นหาชื่ออคาเดมี (ไทย / อังกฤษ)"
                className="h-11 w-full rounded-md border border-(--line) bg-white pl-10 pr-3 text-sm text-(--ink) placeholder:text-slate-400 focus:border-(--ink) focus:outline-none"
              />
            </label>
            <select name="province" defaultValue={province ?? ""} aria-label="จังหวัด" className="h-11 rounded-md border border-(--line) bg-white px-3 text-sm text-(--ink) focus:border-(--ink) focus:outline-none">
              <option value="">ทุกจังหวัด</option>
              {provinces.map(([p, n]) => (
                <option key={p} value={p}>
                  {p} ({n})
                </option>
              ))}
            </select>
            <select name="level" defaultValue={level ?? ""} aria-label="ระดับ" className="h-11 rounded-md border border-(--line) bg-white px-3 text-sm text-(--ink) focus:border-(--ink) focus:outline-none">
              <option value="">ทุกระดับ</option>
              {LEVELS_DESC.map((l) => (
                <option key={l} value={l}>
                  {LEVEL_META[l].label} ({count(l)})
                </option>
              ))}
            </select>
            <button type="submit" className={`${btnPrimary} h-11 py-0`}>
              ค้นหา
            </button>
          </form>

          {shown.length === 0 ? (
            <p className="mt-8 border-y border-(--line) py-16 text-center text-sm text-(--ink-soft)">ไม่พบอคาเดมีตามเงื่อนไขที่ค้นหา</p>
          ) : (
            <div className="mt-8 border-t-2 border-(--ink)">
              <div className="hidden grid-cols-[7rem_minmax(0,1fr)_11rem_1.25rem] gap-4 border-b border-(--line) py-2.5 text-xs font-semibold text-(--ink-soft) md:grid">
                <span>ระดับ</span>
                <span>อคาเดมี</span>
                <span>จังหวัด</span>
                <span />
              </div>
              <ul className="divide-y divide-(--line) border-b border-(--line)">
                {shown.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/academies/${a.id}`}
                      className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-3.5 transition-colors hover:bg-(--paper) md:grid-cols-[7rem_minmax(0,1fr)_11rem_1.25rem] md:px-0"
                    >
                      <LevelMark level={a.level} className="order-2 md:order-0" />
                      <span className="order-1 min-w-0 md:order-0">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate font-semibold text-(--ink) group-hover:underline group-hover:decoration-(--accent) group-hover:decoration-2 group-hover:underline-offset-4">
                            {a.nameEn}
                          </span>
                          {a.state !== "active" && <StateChip state={a.state} />}
                        </span>
                        {a.nameTh && <span className="block truncate text-xs text-(--ink-soft)">{a.nameTh}</span>}
                      </span>
                      <span className="order-3 col-span-2 truncate text-sm text-(--ink-soft) md:order-0 md:col-span-1">{a.province ?? "—"}</span>
                      <ArrowRight className="hidden h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-(--ink) md:block" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {pages > 1 && (
            <nav aria-label="หน้า" className="mt-6 flex items-center justify-between gap-3 text-sm">
              {page > 1 ? (
                <Link href={href({ page: String(page - 1) })} className="inline-flex items-center gap-1 rounded-md border border-(--line) px-3 py-2 font-semibold text-(--ink) hover:bg-(--paper)">
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
                <Link href={href({ page: String(page + 1) })} className="inline-flex items-center gap-1 rounded-md border border-(--line) px-3 py-2 font-semibold text-(--ink) hover:bg-(--paper)">
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
      <section id="levels" className="scroll-mt-16 border-t border-(--line)">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className={eyebrow}>Standards</p>
          <h2 className={`${h} mt-2 text-3xl font-semibold tracking-tight text-(--ink) sm:text-4xl`}>ใบอนุญาต 3 ระดับ</h2>
          <p className="mt-2 max-w-2xl text-sm text-(--ink-soft)">พัฒนาทีละขั้นจากระดับทองแดงสู่ระดับทอง แต่ละระดับมีเกณฑ์ 3 หมวด: การจัดการและองค์กร · การฝึกสอน · สุขภาพและสวัสดิการ</p>
          <div className="mt-8 grid border border-(--line) bg-white md:grid-cols-3">
            {ACADEMY_LEVELS.map((l, i) => {
              const s = LEVEL_SUMMARY[l];
              const reqs = [["หัวหน้าอคาเดมี", s.head], ["ผู้ฝึกสอน", s.coaches], ...(s.assistants ? [["ผู้ช่วยผู้ฝึกสอน", s.assistants]] : []), ["จำนวนทีม", s.teams]];
              return (
                <article key={l} className={`flex flex-col border-(--line) ${i ? "border-t md:border-l md:border-t-0" : ""}`}>
                  <div className="h-1.5" style={{ background: LEVEL_META[l].hex }} />
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className={`${h} text-2xl font-semibold text-(--ink)`}>{LEVEL_META[l].label}</h3>
                      <span className="text-xs text-(--ink-soft)">{count(l)} อคาเดมี</span>
                    </div>
                    <p className="text-xs font-semibold text-(--ink-soft)">{s.title}</p>
                    <p className="mt-3 text-sm leading-relaxed text-(--ink-soft)">{s.audience.th}</p>
                    <dl className="mt-5 flex-1 text-sm">
                      {reqs.map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-3 border-t border-(--line) py-2">
                          <dt className="text-(--ink-soft)">{k}</dt>
                          <dd className="text-right font-semibold text-(--ink)">{v}</dd>
                        </div>
                      ))}
                    </dl>
                    <InfoDialog
                      wide
                      title="เกณฑ์มาตรฐานอคาเดมี"
                      className="mt-5 inline-flex items-center justify-between gap-2 border-t-2 border-(--ink) pt-3 text-left text-sm font-semibold text-(--ink) hover:text-(--accent)"
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
              );
            })}
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
