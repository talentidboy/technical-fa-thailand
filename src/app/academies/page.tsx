import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getAcademyUser, getCurrentUser } from "@/lib/auth";
import { LOGO_URL } from "@/lib/brand";
import { ACADEMY_LEVELS, LEVEL_META, compareAcademies, isLevel, showPublicly } from "@/lib/academy";
import { loadAcademies, matchesQuery } from "@/lib/academy-data";
import { LEVEL_SUMMARY, criteriaCount } from "@/lib/academy-criteria";
import { LevelMedal, StateChip } from "@/components/academy/AcademyUi";
import { CriteriaExplorer } from "@/components/academy/CriteriaExplorer";
import { ThailandMap } from "@/components/academy/ThailandMap";
import { InfoDialog } from "@/components/academy/InfoDialog";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardPen,
  Info,
  LayoutDashboard,
  ListChecks,
  LogIn,
  MapPin,
  Search,
  Settings,
  ShieldCheck,
  Star,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Academy Licensing — ทำเนียบอคาเดมีที่ได้รับการรับรอง | FA Thailand",
  description: "ทำเนียบอคาเดมีฟุตบอลเยาวชนที่ได้รับใบอนุญาตรับรองมาตรฐาน FAT Bronze / Silver / Gold จากสมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์",
};

const PAGE = 24;

// หน้าสาธารณะ: ทำเนียบอคาเดมีที่ได้รับการรับรอง — ไม่แสดงชื่อผู้ประสานงาน เบอร์ และอีเมล (ข้อมูลส่วนบุคคล)
export default async function AcademiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; level?: string; province?: string; page?: string; criteria?: string }>;
}) {
  const sp = await searchParams;
  const criteriaLevel = isLevel(sp.criteria) ? sp.criteria : "BRONZE";
  const [user, academyUser, rows] = await Promise.all([getCurrentUser(), getAcademyUser(), loadAcademies()]);
  const canManage = user?.role === "ADMIN" || user?.role === "STAFF";

  const all = rows.filter((a) => showPublicly(a.active, a.state));
  const q = (sp.q ?? "").trim();
  const level = isLevel(sp.level) ? sp.level : null;
  const province = sp.province?.trim() || null;
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
    const merged = { q: q || null, level, province, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return `/academies${s ? `?${s}` : ""}#directory`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-indigo-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/academies" className="flex items-center gap-2.5">
            <Image src={LOGO_URL} alt="FA Thailand" width={36} height={36} className="h-9 w-9 rounded-lg object-cover" />
            <div>
              <p className="text-sm font-bold text-white">Academy Licensing</p>
              <p className="text-[11px] text-indigo-300">สมาคมกีฬาฟุตบอลแห่งประเทศไทยฯ</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {canManage ? (
              <Link
                href="/academies/manage"
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-indigo-950 transition-colors hover:bg-amber-300"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">จัดการข้อมูล</span>
              </Link>
            ) : academyUser ? (
              <Link
                href="/academies/portal"
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-indigo-950 transition-colors hover:bg-amber-300"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">พอร์ทัลอคาเดมี</span>
              </Link>
            ) : (
              !user && (
                <Link
                  href="/academies/login"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-indigo-950 transition-colors hover:bg-indigo-50"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">เข้าสู่ระบบอคาเดมี</span>
                </Link>
              )
            )}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">หน้าแรก</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero: แผนที่อคาเดมีทั่วประเทศ */}
      <section className="relative isolate overflow-hidden bg-indigo-950 text-white">
        <div className="absolute -left-24 -top-24 -z-10 h-112 w-md rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute -right-24 top-1/3 -z-10 h-120 w-120 rounded-full bg-amber-400/15 blur-3xl" />
        <div
          className="absolute inset-0 -z-10 opacity-[0.05]"
          style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "36px 36px" }}
        />
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-600 via-amber-300 to-amber-600" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:min-h-[calc(100svh-4.25rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-14 lg:py-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-300 ring-1 ring-white/15">
              <ShieldCheck className="h-3.5 w-3.5" />
              ใบอนุญาตรับรองมาตรฐานอคาเดมี · FAT
            </p>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Academy
              <span className="block bg-linear-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text pb-1 text-transparent">Licensing</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-indigo-200 sm:text-lg">อคาเดมีฟุตบอลเยาวชนที่ได้รับการรับรองมาตรฐานจากสมาคมฯ ทั่วประเทศ บนแผนที่เดียว</p>

            <dl className="mt-8 flex gap-10">
              {[
                [all.length.toLocaleString(), "อคาเดมีที่ได้รับการรับรอง"],
                [String(provinces.length), "จังหวัด"],
              ].map(([n, label]) => (
                <div key={label} className="flex flex-col-reverse">
                  <dt className="text-xs text-indigo-300">{label}</dt>
                  <dd className="text-4xl font-extrabold tabular-nums">{n}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 grid max-w-md grid-cols-3 gap-2">
              {[...ACADEMY_LEVELS].reverse().map((l) => (
                <Link key={l} href={href({ level: l, page: null })} className="flex items-center gap-2 rounded-2xl bg-white/5 p-1.5 pr-2 ring-1 ring-white/10 transition-colors hover:bg-white/10">
                  <LevelMedal level={l} size="sm" />
                  <span className="min-w-0 leading-tight">
                    <span className="block text-base font-extrabold tabular-nums">{count(l)}</span>
                    <span className="block text-[11px] font-semibold text-indigo-300">{LEVEL_META[l].label}</span>
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#directory"
                className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-indigo-950 shadow-lg shadow-amber-500/25 transition-transform hover:scale-105"
              >
                <Search className="h-4 w-4" />
                ค้นหาอคาเดมี
              </a>
              <Link
                href={academyUser ? "/academies/portal" : "/academies/register"}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-indigo-950 transition-transform hover:scale-105"
              >
                <ClipboardPen className="h-4 w-4" />
                {academyUser ? "พอร์ทัลอคาเดมีของฉัน" : "สมัคร / ยื่นขอใบอนุญาต"}
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-indigo-200">
              <InfoDialog
                title="Academy Licensing คืออะไร"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
                label={
                  <>
                    <Info className="h-4 w-4" />
                    เกี่ยวกับโครงการ
                  </>
                }
              >
                <p className="text-sm leading-relaxed">
                  ระบบการออกใบอนุญาตรับรองมาตรฐานศูนย์ฝึกเยาวชนหรืออคาเดมีฟุตบอล (Youth Football Academy) ที่จัดทำโดยสมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์ (FAT)
                  ภายใต้โครงการความร่วมมือกับ FIFA (Grow Together) และอิงเกณฑ์มาตรฐานของสมาพันธ์ฟุตบอลแห่งเอเชีย (AFC)
                </p>
                <ul className="mt-5 space-y-2.5">
                  {ACADEMY_LEVELS.map((l) => (
                    <li key={l} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-2.5">
                      <LevelMedal level={l} size="sm" />
                      <span className="min-w-0">
                        <span className={`block text-sm font-bold ${LEVEL_META[l].text}`}>{LEVEL_SUMMARY[l].title}</span>
                        <span className="block text-xs text-slate-500">{LEVEL_SUMMARY[l].th}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 flex gap-2 rounded-2xl bg-indigo-50 p-3 text-xs leading-relaxed text-indigo-900">
                  <Star className="mt-0.5 h-4 w-4 flex-none fill-amber-400 text-amber-400" />
                  อคาเดมีระดับ Gold ยื่นขอรับรองระดับเอเชีย AFC Elite Youth Scheme (1–3 ดาว) ผ่านสมาคมฯ ได้
                </p>
                <Link
                  href={academyUser ? "/academies/portal" : "/academies/register"}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-700 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-800"
                >
                  {academyUser ? "ไปที่พอร์ทัลอคาเดมี" : "สมัครและยื่นขอใบอนุญาตออนไลน์"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </InfoDialog>
              <a href="#levels" className="inline-flex items-center gap-1.5 transition-colors hover:text-white">
                <Award className="h-4 w-4" />
                มาตรฐาน 3 ระดับ
              </a>
              <a href="#criteria" className="inline-flex items-center gap-1.5 transition-colors hover:text-white">
                <ListChecks className="h-4 w-4" />
                เกณฑ์มาตรฐาน
              </a>
            </div>
          </div>
          <ThailandMap academies={all.map((a) => ({ id: a.id, nameEn: a.nameEn, nameTh: a.nameTh, province: a.province, level: a.level }))} />
        </div>
      </section>

      {/* มาตรฐาน 3 ระดับ (จากเอกสารของสมาคมฯ) */}
      <section id="levels" className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-center text-xl font-extrabold text-slate-900 sm:text-2xl">มาตรฐานอคาเดมี 3 ระดับ</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-500">
          พัฒนาอคาเดมีทีละขั้นจากระดับทองแดงสู่ระดับทอง แต่ละระดับมีเกณฑ์ใน 3 หมวด: การจัดการและองค์กร · การฝึกสอนและประสิทธิภาพ · สุขภาพและสวัสดิการ
        </p>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {ACADEMY_LEVELS.map((l) => {
            const s = LEVEL_SUMMARY[l];
            return (
              <article key={l} className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-lg">
                <div className={`h-1.5 bg-linear-to-r ${LEVEL_META[l].medal}`} />
                <div className="flex items-center gap-4 px-5 pt-5">
                  <LevelMedal level={l} />
                  <div>
                    <p className={`text-lg font-extrabold ${LEVEL_META[l].text}`}>{s.title}</p>
                    <p className="text-sm font-semibold text-slate-700">{s.th}</p>
                  </div>
                </div>
                <p className="px-5 pt-3 text-sm leading-relaxed text-slate-600">{s.audience.th}</p>
                <dl className="mx-5 mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 rounded-2xl bg-slate-50 p-4 text-sm">
                  <dt className="text-slate-500">หัวหน้าอคาเดมี</dt>
                  <dd className="font-semibold text-slate-800">{s.head}</dd>
                  <dt className="text-slate-500">ผู้ฝึกสอน</dt>
                  <dd className="font-semibold text-slate-800">{s.coaches}</dd>
                  {s.assistants && (
                    <>
                      <dt className="text-slate-500">ผู้ช่วยผู้ฝึกสอน</dt>
                      <dd className="font-semibold text-slate-800">{s.assistants}</dd>
                    </>
                  )}
                  <dt className="text-slate-500">จำนวนทีม</dt>
                  <dd className="font-semibold text-slate-800">{s.teams}</dd>
                </dl>
                <ul className="space-y-1.5 px-5 py-4 text-sm text-slate-600">
                  {s.highlights.map((h) => (
                    <li key={h} className="flex gap-2">
                      <Check className={`mt-0.5 h-4 w-4 flex-none ${LEVEL_META[l].text}`} />
                      {h}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-center justify-between border-t border-slate-100 px-5 py-3">
                  <Link href={`/academies?criteria=${l}#criteria`} className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                    ดูเกณฑ์ทั้งหมด {criteriaCount(l)} ข้อ
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <span className="text-xs text-slate-400">{count(l)} อคาเดมี</span>
                </div>
              </article>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-4 rounded-3xl bg-indigo-950 p-5 text-white">
          <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
            <Star className="h-6 w-6 fill-amber-300 text-amber-300" />
          </span>
          <p className="text-sm text-indigo-100">
            อคาเดมีระดับ Gold สามารถยื่นขอรับรองระดับเอเชีย <span className="font-bold text-white">AFC Elite Youth Scheme</span> (1 ดาว · 2 ดาว · 3 ดาว) ผ่านสมาคมฯ ได้
          </p>
        </div>
      </section>

      {/* ทำเนียบ */}
      <section id="directory" className="mx-auto max-w-6xl scroll-mt-20 px-6 pb-16">
        <form action="/academies" className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <span className="sr-only">ค้นหาชื่ออคาเดมี</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="ค้นหาชื่ออคาเดมี (ไทย / อังกฤษ)"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <select
            name="province"
            defaultValue={province ?? ""}
            aria-label="จังหวัด"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">ทุกจังหวัด</option>
            {provinces.map(([p, n]) => (
              <option key={p} value={p}>
                {p} ({n})
              </option>
            ))}
          </select>
          {level && <input type="hidden" name="level" value={level} />}
          <button type="submit" className="rounded-xl bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-800">
            ค้นหา
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {[null, ...[...ACADEMY_LEVELS].reverse()].map((l) => (
            <Link
              key={l ?? "all"}
              href={href({ level: l, page: null })}
              aria-current={level === l ? "true" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 transition-colors ${
                level === l ? "bg-indigo-700 text-white ring-indigo-700" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {l ? `${LEVEL_META[l].label} (${count(l)})` : `ทั้งหมด (${all.length})`}
            </Link>
          ))}
          <p className="ml-auto text-xs text-slate-500">พบ {list.length.toLocaleString()} อคาเดมี</p>
        </div>

        {shown.length === 0 ? (
          <p className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-400">ไม่พบอคาเดมีตามเงื่อนไขที่ค้นหา</p>
        ) : (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/academies/${a.id}`}
                  className="group flex h-full items-center gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-indigo-200"
                >
                  <LevelMedal level={a.level} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-900 group-hover:text-indigo-700">{a.nameEn}</p>
                    {a.nameTh && <p className="truncate text-xs text-slate-500">{a.nameTh}</p>}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {a.province && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3 w-3" />
                          {a.province}
                        </span>
                      )}
                      {a.state !== "active" && <StateChip state={a.state} />}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-none text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500" />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {pages > 1 && (
          <nav aria-label="หน้า" className="mt-8 flex items-center justify-center gap-2">
            {page > 1 && (
              <Link href={href({ page: String(page - 1) })} className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-sm text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">
                <ChevronLeft className="h-4 w-4" />
                ก่อนหน้า
              </Link>
            )}
            <span className="px-2 text-sm text-slate-500">
              หน้า {page} / {pages}
            </span>
            {page < pages && (
              <Link href={href({ page: String(page + 1) })} className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-sm text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">
                ถัดไป
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </nav>
        )}
      </section>

      {/* เกณฑ์มาตรฐาน */}
      <section id="criteria" className="scroll-mt-20 border-t border-slate-200 bg-white py-14">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">เกณฑ์มาตรฐานอคาเดมี</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            เลือกระดับเพื่อดูสิ่งที่อคาเดมีต้องมี — ป้าย “เพิ่มใหม่” และ “ยกระดับ” บอกสิ่งที่ต้องทำเพิ่มจากระดับก่อนหน้า
          </p>
          <div className="mt-6">
            <CriteriaExplorer key={criteriaLevel} initialLevel={criteriaLevel} />
          </div>
          <p className="mt-5 text-xs text-slate-400">ที่มา: เกณฑ์ FAT Academy Licensing · โครงการ GROW TOGETHER · FIFA Talent Development Scheme</p>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-400">
        ข้อมูลจากทะเบียน Academy Licensing ของสมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์ · หากข้อมูลไม่ถูกต้องโปรดติดต่อฝ่ายเทคนิคของสมาคมฯ
      </footer>
    </div>
  );
}
