import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { coachName } from "@/lib/coach-name";
import { normalizeCertNo } from "@/lib/cert-no";
import { LICENSE_TYPES, labelFor } from "@/lib/constants";
import { LicenseEditForm } from "@/components/LicenseEditForm";
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Combine, CopyX, FileQuestion, KeyRound } from "lucide-react";

export const metadata: Metadata = { title: "ตรวจข้อมูลผู้ฝึกสอน" };

const PAGE = 50;
const fmt = (d: Date | null) => (d ? d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" }) : "-");
const NAME = { nameTh: true, surnameTh: true, nameEn: true, familyNameEn: true } as const;

// ตรวจข้อมูลผู้ฝึกสอน (แอดมิน): ① เลขใบเดียวกันอยู่หลายประวัติ (คนเดียวกันบันทึกซ้ำ → รวมประวัติ)
// ② คนเดียวมีใบระดับเดียวกันหลายใบ (ผิดกฎ 1 คน 1 ใบต่อ 1 ระดับ) ③ ใบที่ไม่มีเลขที่หรือไม่มีวันที่ → แก้ได้ในแถวเลย
export default async function CoachDataCheckPage({ searchParams }: { searchParams: Promise<{ missing?: string; type?: string; page?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const missing = sp.missing === "date" ? "date" : "cert";
  const type = LICENSE_TYPES.some((t) => t.value === sp.type) || ["GK_I", "GK_II", "SC_I"].includes(sp.type ?? "") ? sp.type! : null;

  const records = await prisma.licenseRecord.findMany({
    select: { id: true, coachId: true, licenseType: true, certificateNo: true, issueDate: true, expireDate: true },
  });

  // ① เลขใบเดียวกัน (ระดับเดียวกัน) อยู่ในหลายประวัติ
  const byCert = new Map<string, typeof records>();
  for (const r of records) {
    if (!r.certificateNo) continue;
    const k = `${r.licenseType}|${normalizeCertNo(r.certificateNo)}`;
    byCert.set(k, [...(byCert.get(k) ?? []), r]);
  }
  const dupGroups = [...byCert.values()].filter((g) => new Set(g.map((r) => r.coachId)).size > 1);

  // ② คนเดียว ระดับเดียวกัน หลายใบ
  const byCoachLevel = new Map<string, typeof records>();
  for (const r of records) byCoachLevel.set(`${r.coachId}|${r.licenseType}`, [...(byCoachLevel.get(`${r.coachId}|${r.licenseType}`) ?? []), r]);
  const sameLevel = [...byCoachLevel.values()].filter((g) => g.length > 1);

  const coachIds = [...new Set([...dupGroups.flat(), ...sameLevel.flat()].map((r) => r.coachId))];
  const coaches = new Map(
    (
      await prisma.coach.findMany({
        where: { id: { in: coachIds } },
        select: { id: true, ...NAME, afcId: true, idNumber: true, systemUser: { select: { id: true } }, _count: { select: { licenseRecords: true } } },
      })
    ).map((c) => [c.id, c]),
  );
  // ประวัติที่ควรเก็บไว้: มีบัญชี > มี AFC ID > มีใบมากกว่า > สร้างก่อน
  const score = (id: number) => {
    const c = coaches.get(id);
    return c ? (c.systemUser ? 1000 : 0) + (c.afcId ? 100 : 0) + c._count.licenseRecords : 0;
  };

  // ③ ใบที่ข้อมูลไม่ครบ
  const incomplete = records.filter((r) => (missing === "cert" ? !r.certificateNo : !r.issueDate || !r.expireDate));
  const typeCounts = [...new Set(incomplete.map((r) => r.licenseType))].map((t) => ({ t, n: incomplete.filter((r) => r.licenseType === t).length })).sort((a, b) => b.n - a.n);
  const listed = incomplete.filter((r) => !type || r.licenseType === type).sort((a, b) => a.licenseType.localeCompare(b.licenseType) || a.coachId - b.coachId);
  const pages = Math.max(1, Math.ceil(listed.length / PAGE));
  const page = Math.min(pages, Math.max(1, Number(sp.page) || 1));
  const shown = listed.slice((page - 1) * PAGE, page * PAGE);
  const shownCoaches = new Map((await prisma.coach.findMany({ where: { id: { in: shown.map((r) => r.coachId) } }, select: { id: true, ...NAME, afcId: true } })).map((c) => [c.id, c]));
  const href = (p: Record<string, string | null>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ missing, type, page: null, ...p })) if (v && !(k === "missing" && v === "cert")) q.set(k, v);
    return `/coaches/data-check${q.size ? `?${q}` : ""}#incomplete`;
  };
  const noCert = records.filter((r) => !r.certificateNo).length;
  const noDate = records.filter((r) => !r.issueDate || !r.expireDate).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ตรวจข้อมูลผู้ฝึกสอน</h1>
        <p className="mt-1 text-sm text-slate-500">เก็บกวาดข้อมูลใบอนุญาตที่ซ้ำหรือไม่ครบ — กฎของระบบ: ผู้ฝึกสอน 1 คนมีใบอนุญาตได้ 1 ใบต่อ 1 ระดับ</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { n: dupGroups.length, label: "เลขใบซ้ำกันหลายประวัติ", href: "#duplicates" },
          { n: noCert, label: "ใบที่ไม่มีเลขที่ใบ", href: href({ missing: "cert" }) },
          { n: noDate, label: "ใบที่ไม่มีวันที่ออก / วันหมดอายุ", href: href({ missing: "date" }) },
        ].map((s) => (
          <a key={s.label} href={s.href} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 hover:border-slate-400">
            <span className={`block text-3xl font-bold tabular-nums ${s.n ? "text-amber-600" : "text-emerald-600"}`}>{s.n.toLocaleString()}</span>
            <span className="text-sm text-slate-600">{s.label}</span>
          </a>
        ))}
      </div>

      {/* ① เลขใบซ้ำ */}
      <section id="duplicates" className="scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <Combine className="h-5 w-5 text-violet-600" />
            เลขใบเดียวกันอยู่หลายประวัติ ({dupGroups.length})
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">ส่วนใหญ่คือคนเดียวกันถูกบันทึกซ้ำ — กด “รวมประวัติ” ระบบจะเปิดหน้าตัวอย่างให้ตรวจก่อนยืนยัน (ถ้าเลขบัตรหรือ AFC ID ไม่ตรงกัน ระบบจะไม่ให้รวม)</p>
        </div>
        {dupGroups.length === 0 ? (
          <p className="flex items-center justify-center gap-2 px-5 py-8 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            ไม่มีเลขใบซ้ำ
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {dupGroups.map((g) => {
              const ids = [...new Set(g.map((r) => r.coachId))].sort((a, b) => score(b) - score(a) || a - b);
              const [keep, ...others] = ids;
              return (
                <li key={`${g[0].licenseType}|${g[0].certificateNo}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 text-sm">
                  <span className="w-36 flex-none">
                    <span className="rounded-md bg-indigo-600 px-1.5 py-0.5 text-[11px] font-black text-white">{labelFor(LICENSE_TYPES, g[0].licenseType)}</span>
                    <span className="ml-1.5 font-semibold text-slate-800">{g[0].certificateNo}</span>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-wrap gap-2">
                    {ids.map((id) => {
                      const c = coaches.get(id);
                      return (
                        <Link key={id} href={`/coaches/${id}`} className={`rounded-lg px-2.5 py-1.5 ring-1 hover:bg-slate-50 ${id === keep ? "ring-emerald-300" : "ring-slate-200"}`}>
                          <span className="font-medium text-slate-900">{c ? coachName(c) : `#${id}`}</span>
                          <span className="ml-1.5 text-xs text-slate-500">
                            #{id} · {c?.afcId ?? "ไม่มี AFC ID"} · ใบ {c?._count.licenseRecords ?? 0}
                          </span>
                          {c?.systemUser && <KeyRound className="ml-1 inline h-3 w-3 text-emerald-600" aria-label="มีบัญชี" />}
                        </Link>
                      );
                    })}
                  </span>
                  {others.map((o) => (
                    <Link key={o} href={`/coaches/${keep}?mergeWith=${o}`} className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700">
                      รวมประวัติ #{o} → #{keep}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ))}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ② คนเดียวมีใบระดับเดียวกันหลายใบ (ปกติต้องเป็น 0) */}
      {sameLevel.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-red-200 bg-white">
          <div className="border-b border-red-100 px-5 py-4">
            <h2 className="flex items-center gap-2 font-bold text-slate-900">
              <CopyX className="h-5 w-5 text-red-600" />
              คนเดียวมีใบระดับเดียวกันหลายใบ ({sameLevel.length})
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">ผิดกฎ 1 คน 1 ใบต่อ 1 ระดับ — เปิดประวัติแล้วลบใบที่ผิด หรือถ้าเป็นคนละคนชื่อซ้ำ ให้เพิ่มเป็นผู้ฝึกสอนใหม่แล้วย้ายใบ</p>
          </div>
          <ul className="divide-y divide-slate-100 text-sm">
            {sameLevel.map((g) => {
              const c = coaches.get(g[0].coachId);
              return (
                <li key={`${g[0].coachId}|${g[0].licenseType}`} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <Link href={`/coaches/${g[0].coachId}`} className="font-medium text-slate-900 hover:text-indigo-700">
                    {c ? coachName(c) : `#${g[0].coachId}`}
                  </Link>
                  <span className="text-xs text-slate-500">
                    {labelFor(LICENSE_TYPES, g[0].licenseType)} {g.length} ใบ: {g.map((r) => r.certificateNo ?? "ไม่มีเลข").join(", ")}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ③ ใบที่ข้อมูลไม่ครบ */}
      <section id="incomplete" className="scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <FileQuestion className="h-5 w-5 text-amber-500" />
            ใบที่ข้อมูลไม่ครบ
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">กด “แก้ไข” ในแถวเพื่อใส่เลขที่ใบหรือวันที่ได้ทันที — แก้แล้วรายการจะหายจากหน้านี้</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              { k: "cert", label: `ไม่มีเลขที่ใบ (${noCert})` },
              { k: "date", label: `ไม่มีวันที่ (${noDate})` },
            ].map((t) => (
              <Link key={t.k} href={href({ missing: t.k, type: null })} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${missing === t.k ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                {t.label}
              </Link>
            ))}
            <span className="mx-1 w-px bg-slate-200" />
            <Link href={href({ type: null })} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${!type ? "bg-indigo-600 text-white" : "text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
              ทุกระดับ
            </Link>
            {typeCounts.map(({ t, n }) => (
              <Link key={t} href={href({ type: t })} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${type === t ? "bg-indigo-600 text-white" : "text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
                {labelFor(LICENSE_TYPES, t)} · {n}
              </Link>
            ))}
          </div>
        </div>
        {shown.length === 0 ? (
          <p className="flex items-center justify-center gap-2 px-5 py-8 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            ไม่มีรายการ
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {shown.map((r) => {
              const c = shownCoaches.get(r.coachId);
              return (
                <li key={r.id} className="flex flex-wrap items-start gap-x-4 gap-y-1 px-5 py-3 text-sm">
                  <span className="w-12 flex-none pt-1.5">
                    <span className="rounded-md bg-indigo-600 px-1.5 py-0.5 text-[11px] font-black text-white">{labelFor(LICENSE_TYPES, r.licenseType)}</span>
                  </span>
                  <span className="min-w-52 flex-1 pt-1">
                    <Link href={`/coaches/${r.coachId}`} className="font-medium text-slate-900 hover:text-indigo-700">
                      {c ? coachName(c) : `#${r.coachId}`}
                    </Link>
                    <span className="block text-xs text-slate-500">
                      {c?.afcId ?? "ไม่มี AFC ID"} · เลขที่ {r.certificateNo ?? "—"} · ออก {fmt(r.issueDate)} · หมดอายุ {fmt(r.expireDate)}
                    </span>
                  </span>
                  <LicenseEditForm record={r} />
                </li>
              );
            })}
          </ul>
        )}
        {pages > 1 && (
          <nav aria-label="หน้า" className="flex items-center justify-between gap-2 border-t border-slate-200 px-5 py-3 text-sm">
            {page > 1 ? (
              <Link href={href({ page: String(page - 1) })} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">
                <ChevronLeft className="h-4 w-4" />
                ก่อนหน้า
              </Link>
            ) : (
              <span />
            )}
            <span className="text-slate-500">
              หน้า {page} / {pages} · {listed.length.toLocaleString()} ใบ
            </span>
            {page < pages ? (
              <Link href={href({ page: String(page + 1) })} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">
                ถัดไป
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </section>
    </div>
  );
}
