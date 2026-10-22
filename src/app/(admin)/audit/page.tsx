import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { parseId } from "@/lib/route-id";
import { History } from "lucide-react";

const PAGE_SIZE = 100;
const dt = (d: Date) => d.toLocaleString("th-TH", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" });

// บันทึกการแก้ไขของแอดมิน/เจ้าหน้าที่ทั้งหมด — กรองตามประเภท / ผู้ฝึกสอน / ช่วงเวลา
export default async function AuditPage({ searchParams }: { searchParams: Promise<{ action?: string; coach?: string; days?: string; page?: string }> }) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/dashboard");
  const sp = await searchParams;
  const action = sp.action && AUDIT_ACTIONS[sp.action] ? sp.action : undefined;
  const coachId = parseId(sp.coach);
  const days = ["7", "30", "365"].includes(sp.days ?? "") ? Number(sp.days) : null;
  const page = Math.max(0, (parseId(sp.page) ?? 1) - 1);
  const where = {
    ...(action ? { action } : {}),
    ...(coachId ? { coachId } : {}),
    ...(days ? { createdAt: { gte: new Date(new Date().getTime() - days * 86_400_000) } } : {}),
  };
  const [logs, total, coach] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: page * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.auditLog.count({ where }),
    coachId ? prisma.coach.findUnique({ where: { id: coachId }, select: { id: true, nameTh: true, surnameTh: true, nameEn: true, familyNameEn: true } }) : null,
  ]);
  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ action, coach: coachId ? String(coachId) : undefined, days: days ? String(days) : undefined, ...patch })) if (v) p.set(k, v);
    return `/audit?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">บันทึกการแก้ไข</h1>
        <p className="mt-1 text-sm text-slate-500">ใคร ทำอะไร เมื่อไร — ออก/ลบ/ต่ออายุใบอนุญาต, ยืนยันผลอบรม, รวมประวัติ, บัญชีผู้ฝึกสอน, แก้ไขข้อมูล (มีค่าก่อน/หลัง)</p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "ทุกช่วงเวลา", v: undefined },
            { label: "7 วัน", v: "7" },
            { label: "30 วัน", v: "30" },
            { label: "1 ปี", v: "365" },
          ].map((o) => (
            <Link
              key={o.label}
              href={href({ days: o.v, page: undefined })}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${String(days ?? "") === (o.v ?? "") ? "bg-indigo-600 text-white ring-indigo-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"}`}
            >
              {o.label}
            </Link>
          ))}
          {coach && (
            <Link href={href({ coach: undefined, page: undefined })} className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 ring-1 ring-violet-200">
              ผู้ฝึกสอน #{coach.id} ✕
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Link href={href({ action: undefined, page: undefined })} className={`rounded-lg px-2.5 py-1 text-xs ring-1 ${!action ? "bg-slate-900 text-white ring-slate-900" : "ring-slate-200 text-slate-600"}`}>
            ทุกประเภท
          </Link>
          {Object.entries(AUDIT_ACTIONS).map(([key, meta]) => (
            <Link key={key} href={href({ action: key, page: undefined })} className={`rounded-lg px-2.5 py-1 text-xs ring-1 ${action === key ? "bg-slate-900 text-white ring-slate-900" : `ring-transparent ${meta.tone}`}`}>
              {meta.label}
            </Link>
          ))}
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-500">
          <History className="h-8 w-8 text-slate-300" />
          ยังไม่มีบันทึกการแก้ไข
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {logs.map((a) => {
            const meta = AUDIT_ACTIONS[a.action] ?? { label: a.action, tone: "bg-slate-100 text-slate-600" };
            return (
              <li key={a.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.tone}`}>{meta.label}</span>
                  <span className="min-w-0 flex-1 text-slate-800">{a.summary}</span>
                  {a.coachId && (
                    <Link href={`/coaches/${a.coachId}`} className="text-xs font-semibold text-indigo-600 hover:underline">
                      ผู้ฝึกสอน #{a.coachId}
                    </Link>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {dt(a.createdAt)} · {a.actorEmail}
                </p>
                {a.details != null && (
                  <details className="mt-1.5">
                    <summary className="cursor-pointer text-xs text-slate-500">รายละเอียด</summary>
                    <pre className="mt-1.5 max-h-64 overflow-auto rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-700 ring-1 ring-slate-200">
                      {JSON.stringify(a.details, null, 2)}
                    </pre>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            {page * PAGE_SIZE + 1}–{Math.min(total, (page + 1) * PAGE_SIZE)} จาก {total.toLocaleString()}
          </span>
          <div className="flex gap-2">
            {page > 0 && (
              <Link href={href({ page: String(page) })} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50">
                ก่อนหน้า
              </Link>
            )}
            {(page + 1) * PAGE_SIZE < total && (
              <Link href={href({ page: String(page + 2) })} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50">
                ถัดไป
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
