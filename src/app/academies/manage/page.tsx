import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProvinceOptions } from "@/lib/thai-address";
import { ACADEMY_LEVELS, LEVEL_META, STATE_META, compareAcademies, isLevel, levelRank, thaiDate, type AcademyState } from "@/lib/academy";
import { loadAcademies, matchesQuery, type AcademyRow } from "@/lib/academy-data";
import { ResultForm } from "@/components/ResultForm";
import { LevelBadge, StateChip } from "@/components/academy/AcademyUi";
import { ManageShell } from "@/components/academy/ManageShell";
import { createAcademy } from "./actions";
import { AcademyFields, LicenceFields, inputClass } from "./fields";
import { Plus, Download, Search, ChevronLeft, ChevronRight, ExternalLink, TriangleAlert } from "lucide-react";

const PAGE = 50;

// เรื่องที่ควรตรวจสอบ (ข้อมูลจากทะเบียน Excel เดิมไม่ครบ/ไม่สอดคล้อง)
const ISSUES = {
  "no-active": { label: "ไม่มีใบที่มีผล (ใบเดิมถูกแทนที่)", test: (a: AcademyRow) => !a.current && a.licences.some((l) => l.status === "SUPERSEDED") },
  "no-level":{ label: "ยังไม่ระบุระดับ", test: (a: AcademyRow) => a.state === "pending" },
  "no-province": { label: "ไม่มีจังหวัด", test: (a: AcademyRow) => !a.province },
  "no-contact": { label: "ไม่มีเบอร์ / อีเมล", test: (a: AcademyRow) => !a.phone && !a.email },
  "no-date": { label: "ใบอนุญาตไม่มีวันที่อนุมัติ", test: (a: AcademyRow) => !!a.current && !a.current.approvedAt },
  "upgrade-note": {
    label: "หมายเหตุว่าเลื่อนระดับ แต่ยังไม่มีใบระดับใหม่",
    test: (a: AcademyRow) =>
      a.licences.some((l) => {
        const m = l.note?.match(/เลื่อนระดับเป็น\s*(bronze|silver|gold)/i);
        return !!m && levelRank(m[1].toUpperCase()) > levelRank(a.level);
      }),
  },
} as const;
type IssueKey = keyof typeof ISSUES;

const STATES = Object.keys(STATE_META) as AcademyState[];

export default async function AcademyManagePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; level?: string; state?: string; province?: string; issue?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) redirect("/academies");
  const sp = await searchParams;
  const rows = await loadAcademies();

  const q = (sp.q ?? "").trim();
  const level = sp.level === "PENDING" || isLevel(sp.level) ? sp.level : null;
  const state = STATES.includes(sp.state as AcademyState) ? (sp.state as AcademyState) : sp.state === "inactive" ? "inactive" : null;
  const province = sp.province?.trim() || null;
  const issue = sp.issue && sp.issue in ISSUES ? (sp.issue as IssueKey) : null;

  const list = rows
    .filter(
      (a) =>
        (!level || (level === "PENDING" ? a.state === "pending" : a.level === level)) &&
        (!state || (state === "inactive" ? !a.active : a.state === state)) &&
        (!province || a.province === province) &&
        (!issue || ISSUES[issue].test(a)) &&
        matchesQuery(a, q),
    )
    .sort(compareAcademies);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const page = Math.min(pages, Math.max(1, Number(sp.page) || 1));
  const shown = list.slice((page - 1) * PAGE, page * PAGE);

  const params = { q: q || null, level, state, province, issue };
  const href = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, page: null, ...patch })) if (v) p.set(k, v);
    const s = p.toString();
    return `/academies/manage${s ? `?${s}` : ""}`;
  };
  const exportHref = href({}).replace("/academies/manage", "/academies/manage/export");

  const live = rows.filter((a) => a.active);
  const kpis = [
    { label: "อคาเดมีทั้งหมด", value: rows.length, href: href({ q: null, level: null, state: null, province: null, issue: null }), tone: "text-slate-900" },
    ...[...ACADEMY_LEVELS].reverse().map((l) => ({
      label: `ระดับ ${LEVEL_META[l].label}`,
      value: live.filter((a) => a.level === l && a.state !== "revoked").length,
      href: href({ level: l, state: null }),
      tone: LEVEL_META[l].text,
    })),
    { label: "ใกล้หมดอายุ (60 วัน)", value: live.filter((a) => a.state === "expiring").length, href: href({ state: "expiring", level: null }), tone: "text-amber-600" },
    { label: "หมดอายุแล้ว", value: live.filter((a) => a.state === "expired").length, href: href({ state: "expired", level: null }), tone: "text-red-600" },
  ];
  const issueCounts = (Object.keys(ISSUES) as IssueKey[]).map((k) => ({ key: k, label: ISSUES[k].label, n: rows.filter(ISSUES[k].test).length })).filter((i) => i.n > 0);
  const provinceOptions = getProvinceOptions().map((p) => p.nameTh);
  const provincesInUse = [...new Set(rows.map((a) => a.province).filter((p): p is string => !!p))].sort((a, b) => a.localeCompare(b, "th"));

  return (
    <ManageShell active="registry">
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">ทะเบียนอคาเดมี</h1>
            <p className="mt-1 text-sm text-slate-500">ข้อมูลติดต่อ (ผู้ประสานงาน เบอร์ อีเมล) เห็นเฉพาะในหน้านี้ ไม่แสดงบนหน้าสาธารณะ</p>
          </div>
          <a
            href={exportHref}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            ส่งออก Excel ({list.length})
          </a>
        </div>

        <section aria-label="สรุป" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {kpis.map((k) => (
            <Link key={k.label} href={k.href} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-colors hover:ring-indigo-300">
              <p className={`text-2xl font-extrabold ${k.tone}`}>{k.value.toLocaleString()}</p>
              <p className="mt-0.5 text-xs text-slate-500">{k.label}</p>
            </Link>
          ))}
        </section>

        {issueCounts.length > 0 && (
          <section className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-800">
              <TriangleAlert className="h-4 w-4" />
              ข้อมูลที่ควรตรวจสอบ
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {issueCounts.map((i) => (
                <Link
                  key={i.key}
                  href={href({ issue: issue === i.key ? null : i.key })}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-colors ${
                    issue === i.key ? "bg-amber-600 text-white ring-amber-600" : "bg-white text-amber-800 ring-amber-200 hover:bg-amber-100"
                  }`}
                >
                  {i.label} · {i.n}
                </Link>
              ))}
            </div>
          </section>
        )}

        <details className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <summary className="flex cursor-pointer items-center gap-2 px-6 py-4 text-sm font-semibold text-slate-900">
            <Plus className="h-4 w-4 text-indigo-600" />
            เพิ่มอคาเดมีใหม่
          </summary>
          <ResultForm action={createAcademy} className="space-y-6 border-t border-slate-100 p-6">
            <AcademyFields provinces={provinceOptions} />
            <fieldset className="rounded-xl bg-slate-50 p-4">
              <legend className="px-1 text-sm font-semibold text-slate-700">ใบอนุญาตใบแรก (ไม่บังคับ)</legend>
              <LicenceFields />
            </fieldset>
            <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
              <Plus className="h-4 w-4" />
              เพิ่มอคาเดมี
            </button>
          </ResultForm>
        </details>

        <form action="/academies/manage" className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_auto]">
          <label className="relative">
            <span className="sr-only">ค้นหา</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={q} placeholder="ค้นหาชื่ออคาเดมี" className={`${inputClass} w-full pl-9`} />
          </label>
          <select name="level" defaultValue={level ?? ""} aria-label="ระดับ" className={inputClass}>
            <option value="">ทุกระดับ</option>
            {[...ACADEMY_LEVELS].reverse().map((l) => (
              <option key={l} value={l}>
                {LEVEL_META[l].label}
              </option>
            ))}
            <option value="PENDING">ยังไม่ระบุระดับ</option>
          </select>
          <select name="state" defaultValue={state ?? ""} aria-label="สถานะ" className={inputClass}>
            <option value="">ทุกสถานะ</option>
            {STATES.map((s) => (
              <option key={s} value={s}>
                {STATE_META[s].label}
              </option>
            ))}
            <option value="inactive">ปิดการแสดง</option>
          </select>
          <select name="province" defaultValue={province ?? ""} aria-label="จังหวัด" className={inputClass}>
            <option value="">ทุกจังหวัด</option>
            {provincesInUse.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {issue && <input type="hidden" name="issue" value={issue} />}
          <button type="submit" className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
            กรอง
          </button>
        </form>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 text-sm">
            <p className="font-semibold text-slate-900">
              {list.length.toLocaleString()} อคาเดมี{issue && <span className="ml-2 font-normal text-amber-700">· {ISSUES[issue].label}</span>}
            </p>
            {(q || level || state || province || issue) && (
              <Link href="/academies/manage" className="text-xs font-medium text-indigo-600 hover:underline">
                ล้างตัวกรอง
              </Link>
            )}
          </div>
          {shown.length === 0 ? (
            <p className="px-6 py-14 text-center text-sm text-slate-400">ไม่พบอคาเดมีตามเงื่อนไข</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[56rem] text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">อคาเดมี</th>
                    <th className="px-3 py-2.5 font-medium">จังหวัด</th>
                    <th className="px-3 py-2.5 font-medium">ระดับ</th>
                    <th className="px-3 py-2.5 font-medium">สถานะ</th>
                    <th className="px-3 py-2.5 font-medium">อนุมัติ</th>
                    <th className="px-3 py-2.5 font-medium">หมดอายุ</th>
                    <th className="px-3 py-2.5 font-medium">ผู้ประสานงาน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shown.map((a) => (
                    <tr key={a.id} className={`hover:bg-indigo-50/40 ${a.active ? "" : "opacity-60"}`}>
                      <td className="px-5 py-2.5">
                        <Link href={`/academies/manage/${a.id}`} className="font-semibold text-slate-900 hover:text-indigo-700">
                          {a.nameEn}
                        </Link>
                        {a.nameTh && <p className="text-xs text-slate-500">{a.nameTh}</p>}
                        {!a.active && <p className="text-xs font-medium text-slate-500">ปิดการแสดง</p>}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">{a.province ?? <span className="text-slate-300">-</span>}</td>
                      <td className="px-3 py-2.5">
                        <LevelBadge level={a.level} tier={a.current?.tier} />
                      </td>
                      <td className="px-3 py-2.5">
                        <StateChip state={a.state} />
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">{thaiDate(a.current?.approvedAt)}</td>
                      <td className="px-3 py-2.5 text-slate-600">{thaiDate(a.current?.expiresAt)}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-600">
                        {a.contactName ?? "-"}
                        {a.phone && <p className="text-slate-400">{a.phone}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pages > 1 && (
            <nav aria-label="หน้า" className="flex items-center justify-center gap-2 border-t border-slate-100 px-5 py-3">
              {page > 1 && (
                <Link href={href({ page: String(page - 1) })} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">
                  <ChevronLeft className="h-4 w-4" />
                  ก่อนหน้า
                </Link>
              )}
              <span className="text-sm text-slate-500">
                หน้า {page} / {pages}
              </span>
              {page < pages && (
                <Link href={href({ page: String(page + 1) })} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">
                  ถัดไป
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </nav>
          )}
        </section>

        <p className="flex items-center justify-center gap-1 text-xs text-slate-400">
          <ExternalLink className="h-3 w-3" />
          ทุกการแก้ไขถูกบันทึกในบันทึกการแก้ไขของระบบ
        </p>
      </main>
    </ManageShell>
  );
}
