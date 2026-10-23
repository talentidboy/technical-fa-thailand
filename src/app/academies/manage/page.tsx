import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { ACADEMY_LEVELS, LEVEL_META, daysUntil, showPublicly, thaiDate } from "@/lib/academy";
import { loadAcademies } from "@/lib/academy-data";
import { issueCounts } from "@/lib/academy-issues";
import { LevelBadge } from "@/components/academy/AcademyUi";
import { Card, Empty, PageBody, PageHeader, btn } from "@/components/academy/ManageUi";
import { ArrowRight, Plus } from "lucide-react";

const LEGACY = ["q", "level", "state", "province", "issue", "page"];

// หน้าแรกของระบบจัดการ: ตัวเลขสรุป + งานที่ต้องทำ + ใกล้หมดอายุ + กิจกรรมล่าสุด
export default async function ManageDashboard({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  // ลิงก์เดิม /academies/manage?state=... (ตอนหน้านี้เป็นทะเบียน) → ส่งต่อไปหน้าทะเบียน
  const sp = await searchParams;
  const legacy = new URLSearchParams(Object.entries(sp).filter((e): e is [string, string] => LEGACY.includes(e[0]) && !!e[1]));
  if (legacy.size) redirect(`/academies/manage/academies?${legacy}`);

  const now = new Date();
  const [rows, submitted, pendingMembers, logs] = await Promise.all([
    loadAcademies(now),
    prisma.academyApplication.count({ where: { status: "SUBMITTED" } }),
    prisma.academyMember.count({ where: { status: "PENDING" } }),
    prisma.auditLog.findMany({ where: { action: { startsWith: "ACADEMY_" } }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const listed = rows.filter((a) => showPublicly(a.active, a.state));
  const live = rows.filter((a) => a.active);
  const expiring = live.filter((a) => a.state === "expiring").sort((a, b) => a.current!.expiresAt!.getTime() - b.current!.expiresAt!.getTime());
  const expired = live.filter((a) => a.state === "expired").length;
  const issues = issueCounts(rows);
  const issueTotal = issues.reduce((n, i) => n + i.n, 0);

  const kpis = [
    { label: "แสดงบนทำเนียบ", value: listed.length, href: "/academies/manage/academies" },
    ...[...ACADEMY_LEVELS].reverse().map((l) => ({ label: `ระดับ ${LEVEL_META[l].label}`, value: listed.filter((a) => a.level === l).length, href: `/academies/manage/academies?level=${l}` })),
    { label: "ใกล้หมดอายุ (60 วัน)", value: expiring.length, href: "/academies/manage/licences?tab=expiring", tone: expiring.length ? "text-amber-700" : "" },
    { label: "หมดอายุแล้ว", value: expired, href: "/academies/manage/licences?tab=expired", tone: expired ? "text-red-600" : "" },
  ];
  const todo = [
    { label: "ใบสมัครรอตรวจ", n: submitted, href: "/academies/manage/applications" },
    { label: "คำขอสิทธิ์ดูแลอคาเดมีรออนุมัติ", n: pendingMembers, href: "/academies/manage/accounts" },
    { label: "ใบอนุญาตใกล้หมดอายุ — แจ้งต่ออายุ", n: expiring.length, href: "/academies/manage/licences?tab=expiring" },
    { label: "ใบอนุญาตหมดอายุแล้ว", n: expired, href: "/academies/manage/licences?tab=expired" },
    { label: "ข้อมูลในทะเบียนที่ควรตรวจสอบ", n: issueTotal, href: "/academies/manage/academies" },
  ];

  return (
    <>
      <PageHeader
        title="ภาพรวม"
        description={`ข้อมูล ณ ${thaiDate(now, "long")}`}
        actions={
          <Link href="/academies/manage/academies/new" className={btn.primary}>
            <Plus className="h-4 w-4" />
            เพิ่มอคาเดมี
          </Link>
        }
      />
      <PageBody>
        <section aria-label="สรุป" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {kpis.map((k) => (
            <Link key={k.label} href={k.href} className="rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-400">
              <p className={`text-2xl font-semibold tabular-nums text-slate-900 ${k.tone ?? ""}`}>{k.value.toLocaleString()}</p>
              <p className="mt-0.5 text-xs text-slate-500">{k.label}</p>
            </Link>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="งานที่ต้องทำ" flush>
            <ul className="divide-y divide-slate-100">
              {todo.map((t) => (
                <li key={t.label}>
                  <Link href={t.href} className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-slate-50">
                    <span className={`flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold ${t.n ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-400"}`}>{t.n}</span>
                    <span className={`flex-1 ${t.n ? "font-medium text-slate-900" : "text-slate-500"}`}>{t.label}</span>
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="ใกล้หมดอายุ" flush actions={<Link href="/academies/manage/licences?tab=expiring" className={`${btn.link} text-xs`}>ทั้งหมด</Link>}>
            {expiring.length === 0 ? (
              <Empty>ไม่มีใบอนุญาตที่จะหมดอายุใน 60 วัน</Empty>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {expiring.slice(0, 6).map((a) => (
                  <li key={a.id}>
                    <Link href={`/academies/manage/${a.id}?tab=licences`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50">
                      <LevelBadge level={a.level} />
                      <span className="min-w-0 flex-1 truncate font-medium text-slate-900">{a.nameEn}</span>
                      <span className="text-xs text-amber-700">อีก {daysUntil(a.current!.expiresAt!, now)} วัน</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card title="กิจกรรมล่าสุด" flush actions={<Link href="/academies/manage/activity" className={`${btn.link} text-xs`}>ดูทั้งหมด</Link>}>
          {logs.length === 0 ? (
            <Empty>ยังไม่มีกิจกรรม</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {logs.map((log) => {
                const meta = AUDIT_ACTIONS[log.action] ?? { label: log.action, tone: "bg-slate-100 text-slate-600" };
                return (
                  <li key={log.id} className="flex flex-wrap items-baseline gap-x-2 px-5 py-2.5 text-sm">
                    <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${meta.tone}`}>{meta.label}</span>
                    <span className="min-w-0 flex-1 text-slate-700">{log.summary}</span>
                    <span className="text-xs text-slate-400">{log.createdAt.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Bangkok" })}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </PageBody>
    </>
  );
}
