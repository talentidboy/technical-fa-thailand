import Link from "next/link";
import { ACADEMY_LEVELS, LEVEL_META, STATE_META, compareAcademies, isLevel, thaiDate, type AcademyState } from "@/lib/academy";
import { loadAcademies, matchesQuery } from "@/lib/academy-data";
import { ISSUES, issueCounts as countIssues, type IssueKey } from "@/lib/academy-issues";
import { LevelBadge, StateChip } from "@/components/academy/AcademyUi";
import { Card, PageBody, PageHeader, btn, input } from "@/components/academy/ManageUi";
import { Building2, ChevronLeft, ChevronRight, Download, Plus, Search, TriangleAlert } from "lucide-react";

const PAGE = 50;

const STATES = Object.keys(STATE_META) as AcademyState[];

// ทะเบียนอคาเดมีทั้งหมด (ค้นหา / กรอง / ส่งออก) — กดชื่อเพื่อเปิดหน้ารายละเอียด
export default async function AcademyRegistryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; level?: string; state?: string; province?: string; issue?: string; page?: string }>;
}) {
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
  const query = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, page: null, ...patch })) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `?${s}` : "";
  };
  const href = (patch: Record<string, string | null>) => `/academies/manage/academies${query(patch)}`;
  const issueCounts = countIssues(rows);
  const provincesInUse = [...new Set(rows.map((a) => a.province).filter((p): p is string => !!p))].sort((a, b) => a.localeCompare(b, "th"));
  const filtered = !!(q || level || state || province || issue);

  return (
    <>
      <PageHeader
        title="อคาเดมี"
        description={`ทะเบียนทั้งหมด ${rows.length.toLocaleString()} แห่ง · ข้อมูลติดต่อเห็นเฉพาะในระบบจัดการ`}
        actions={
          <>
            <a href={`/academies/manage/export${query({})}`} className={btn.secondary}>
              <Download className="h-4 w-4" />
              ส่งออก Excel ({list.length})
            </a>
            <Link href="/academies/manage/academies/new" className={btn.primary}>
              <Plus className="h-4 w-4" />
              เพิ่มอคาเดมี
            </Link>
          </>
        }
      />
      <PageBody>
        {issueCounts.length > 0 && (
          <div className="rounded-2xl border border-orange-200 border-l-4 border-l-orange-500 bg-orange-50 p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
              <TriangleAlert className="h-4 w-4" />
              ข้อมูลที่ควรตรวจสอบ
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {issueCounts.map((i) => (
                <Link
                  key={i.key}
                  href={href({ issue: issue === i.key ? null : i.key })}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${issue === i.key ? "bg-amber-600 text-white ring-amber-600" : "bg-white text-amber-900 ring-amber-200 hover:bg-amber-100"}`}
                >
                  {i.label} · {i.n}
                </Link>
              ))}
            </div>
          </div>
        )}

        <form action="/academies/manage/academies" className="grid gap-2 rounded-2xl bg-white p-3 ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_1fr_1fr_1fr_auto]">
          <label className="relative">
            <span className="sr-only">ค้นหา</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={q} placeholder="ค้นหาชื่ออคาเดมี" className={`${input} pl-9`} />
          </label>
          <select name="level" defaultValue={level ?? ""} aria-label="ระดับ" className={input}>
            <option value="">ทุกระดับ</option>
            {[...ACADEMY_LEVELS].reverse().map((l) => (
              <option key={l} value={l}>
                {LEVEL_META[l].label}
              </option>
            ))}
            <option value="PENDING">ยังไม่ระบุระดับ</option>
          </select>
          <select name="state" defaultValue={state ?? ""} aria-label="สถานะ" className={input}>
            <option value="">ทุกสถานะ</option>
            {STATES.map((s) => (
              <option key={s} value={s}>
                {STATE_META[s].label}
              </option>
            ))}
            <option value="inactive">ปิดการแสดง</option>
          </select>
          <select name="province" defaultValue={province ?? ""} aria-label="จังหวัด" className={input}>
            <option value="">ทุกจังหวัด</option>
            {provincesInUse.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {issue && <input type="hidden" name="issue" value={issue} />}
          <button type="submit" className={btn.primary}>
            กรอง
          </button>
        </form>

        <Card
          flush
          icon={Building2}
          title={
            <>
              {list.length.toLocaleString()} อคาเดมี{issue && <span className="ml-2 font-normal text-amber-700">· {ISSUES[issue].label}</span>}
            </>
          }
          actions={
            filtered && (
              <Link href="/academies/manage/academies" className="text-xs font-semibold text-slate-600 hover:text-slate-900">
                ล้างตัวกรอง
              </Link>
            )
          }
        >
          {shown.length === 0 ? (
            <p className="px-6 py-14 text-center text-sm text-slate-400">ไม่พบอคาเดมีตามเงื่อนไข</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-4xl text-sm">
                <thead className="bg-[#e6f3fc] text-left text-xs font-semibold text-[#0b6cb0]">
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
                    <tr key={a.id} className={`hover:bg-[#f4f8fc] ${a.active ? "" : "opacity-60"}`}>
                      <td className="px-5 py-2.5">
                        <Link href={`/academies/manage/${a.id}`} className="font-semibold text-[#0b1220] hover:text-[#0b6cb0] hover:underline">
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
            <nav aria-label="หน้า" className="flex items-center justify-between gap-2 border-t border-slate-200 px-5 py-3 text-sm">
              {page > 1 ? (
                <Link href={href({ page: String(page - 1) })} className={btn.secondary}>
                  <ChevronLeft className="h-4 w-4" />
                  ก่อนหน้า
                </Link>
              ) : (
                <span />
              )}
              <span className="text-slate-500">
                หน้า {page} / {pages}
              </span>
              {page < pages ? (
                <Link href={href({ page: String(page + 1) })} className={btn.secondary}>
                  ถัดไป
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </Card>
      </PageBody>
    </>
  );
}
