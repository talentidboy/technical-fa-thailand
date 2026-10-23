import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { Card, Empty, PageBody, PageHeader, btn, input } from "@/components/academy/ManageUi";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE = 50;

// บันทึกการแก้ไขทั้งหมดของ Academy Licensing (ใครทำอะไร เมื่อไร)
export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ action?: string; page?: string }> }) {
  const sp = await searchParams;
  const types = Object.keys(AUDIT_ACTIONS).filter((k) => k.startsWith("ACADEMY_"));
  const action = sp.action && types.includes(sp.action) ? sp.action : null;
  const where = action ? { action } : { action: { startsWith: "ACADEMY_" } };
  const total = await prisma.auditLog.count({ where });
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const page = Math.min(pages, Math.max(1, Number(sp.page) || 1));
  const logs = await prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE });
  const href = (p: number) => `/academies/manage/activity?${new URLSearchParams({ ...(action ? { action } : {}), page: String(p) })}`;

  return (
    <>
      <PageHeader title="บันทึกการแก้ไข" description={`${total.toLocaleString()} รายการ · ทุกการเพิ่ม แก้ไข ลบ อนุมัติ ถูกบันทึกพร้อมผู้ทำรายการ`} />
      <PageBody>
        <form action="/academies/manage/activity" className="flex flex-wrap gap-2">
          <select name="action" defaultValue={action ?? ""} aria-label="ประเภท" className={`${input} w-auto`}>
            <option value="">ทุกประเภท</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {AUDIT_ACTIONS[t].label}
              </option>
            ))}
          </select>
          <button type="submit" className={btn.primary}>
            กรอง
          </button>
        </form>
        <Card flush>
          {logs.length === 0 ? (
            <Empty>ยังไม่มีรายการ</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {logs.map((log) => {
                const meta = AUDIT_ACTIONS[log.action] ?? { label: log.action, tone: "bg-slate-100 text-slate-600" };
                const academyId = (log.details as { academyId?: unknown } | null)?.academyId;
                return (
                  <li key={log.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-3 text-sm">
                    <span className="w-36 flex-none text-xs text-slate-400">{log.createdAt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" })}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${meta.tone}`}>{meta.label}</span>
                    <span className="min-w-0 flex-1 text-slate-700">
                      {typeof academyId === "number" ? (
                        <Link href={`/academies/manage/${academyId}`} className="hover:underline">
                          {log.summary}
                        </Link>
                      ) : (
                        log.summary
                      )}
                    </span>
                    <span className="text-xs text-slate-400">{log.actorEmail}</span>
                  </li>
                );
              })}
            </ul>
          )}
          {pages > 1 && (
            <nav aria-label="หน้า" className="flex items-center justify-between gap-2 border-t border-slate-200 px-5 py-3 text-sm">
              {page > 1 ? (
                <Link href={href(page - 1)} className={btn.secondary}>
                  <ChevronLeft className="h-4 w-4" />
                  ใหม่กว่า
                </Link>
              ) : (
                <span />
              )}
              <span className="text-slate-500">
                หน้า {page} / {pages}
              </span>
              {page < pages ? (
                <Link href={href(page + 1)} className={btn.secondary}>
                  เก่ากว่า
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
