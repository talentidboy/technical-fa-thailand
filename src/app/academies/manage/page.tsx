import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { ACADEMY_LEVELS, LEVEL_META, daysUntil, showPublicly, thaiDate } from "@/lib/academy";
import { loadAcademies } from "@/lib/academy-data";
import { issueCounts } from "@/lib/academy-issues";
import { LevelBadge } from "@/components/academy/AcademyUi";
import { COIN } from "@/components/academy/Podium";
import { Card, Empty, PageBody, PageHeader, btn } from "@/components/academy/ManageUi";
import { ArrowRight, CalendarX2, CheckCircle2, Clock, Download, FileCheck2, History, Plus, TriangleAlert, UserCheck, type LucideIcon } from "lucide-react";

const LEGACY = ["q", "level", "state", "province", "issue", "page"];

// สีการ์ดงาน (เขียนเต็มชื่อคลาสให้ Tailwind เห็น)
const TASK_TONE = {
  sky: { tile: "bg-[#e6f3fc] ring-[#bfe0f6] hover:ring-[#1e96dc]", bar: "bg-[#1e96dc]", text: "text-[#0b6cb0]" },
  violet: { tile: "bg-violet-50 ring-violet-200 hover:ring-violet-500", bar: "bg-violet-500", text: "text-violet-700" },
  amber: { tile: "bg-amber-50 ring-amber-200 hover:ring-amber-400", bar: "bg-amber-400", text: "text-amber-700" },
  red: { tile: "bg-red-50 ring-red-200 hover:ring-red-500", bar: "bg-red-500", text: "text-red-700" },
  orange: { tile: "bg-orange-50 ring-orange-200 hover:ring-orange-500", bar: "bg-orange-500", text: "text-orange-700" },
};
type Task = { label: string; hint: string; n: number; href: string; icon: LucideIcon; tone: keyof typeof TASK_TONE };

// หน้าแรกของระบบจัดการ: แถบสรุป (งานรอ + จำนวนตามระดับ) → การ์ดงานที่ต้องทำแยกสี (กดแล้วไปทำงานนั้นทันที) → ใกล้หมดอายุ + กิจกรรมล่าสุด
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

  const tasks: Task[] = [
    { label: "ใบสมัครรอตรวจ", hint: "ตรวจเอกสารและอนุมัติใบอนุญาต", n: submitted, href: "/academies/manage/applications", icon: FileCheck2, tone: "sky" },
    { label: "คำขอสิทธิ์ดูแลอคาเดมีรออนุมัติ", hint: "อนุมัติบัญชีผู้ดูแลของอคาเดมี", n: pendingMembers, href: "/academies/manage/accounts", icon: UserCheck, tone: "violet" },
    { label: "ใบอนุญาตใกล้หมดอายุ — แจ้งต่ออายุ", hint: "หมดอายุภายใน 60 วัน", n: expiring.length, href: "/academies/manage/licences?tab=expiring", icon: Clock, tone: "amber" },
    { label: "ใบอนุญาตหมดอายุแล้ว", hint: "ต่ออายุ หรือปิดการแสดง", n: expired, href: "/academies/manage/licences?tab=expired", icon: CalendarX2, tone: "red" },
    { label: "ข้อมูลในทะเบียนที่ควรตรวจสอบ", hint: "ข้อมูลไม่ครบหรือไม่ตรงกัน", n: issueTotal, href: "/academies/manage/academies", icon: TriangleAlert, tone: "orange" },
  ];
  const waiting = tasks.filter((t) => t.n > 0).length;

  return (
    <>
      <PageHeader
        title="ภาพรวม"
        description={`ข้อมูล ณ ${thaiDate(now, "long")}`}
        actions={
          <>
            {/* ลิงก์ดาวน์โหลดไฟล์ (route handler) — ใช้ <a> ธรรมดา ไม่ให้ <Link> prefetch สร้างไฟล์ล่วงหน้า */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/academies/manage/export" className={btn.secondary}>
              <Download className="h-4 w-4" />
              ส่งออก Excel
            </a>
            <Link href="/academies/manage/academies/new" className={btn.primary}>
              <Plus className="h-4 w-4" />
              เพิ่มอคาเดมี
            </Link>
          </>
        }
      />
      <PageBody>
        {/* แถบสรุป: งานรอ + อคาเดมีบนทำเนียบแยกระดับ */}
        <section aria-label="สรุป" className="grid gap-4 overflow-hidden rounded-3xl bg-[#1e96dc] p-5 text-white sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-white/80">วันนี้</p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">{waiting ? `มีงานรอจัดการ ${waiting} เรื่อง` : "เรียบร้อย ไม่มีงานค้าง"}</p>
            <p className="mt-1.5 text-sm text-white/80">{waiting ? "กดการ์ดสีด้านล่างเพื่อไปทำงานนั้นได้ทันที" : "ทุกใบสมัครและใบอนุญาตได้รับการดูแลแล้ว"}</p>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <Link href="/academies/manage/academies" className="rounded-2xl bg-[#0b1220] px-3 py-3 text-center transition-transform hover:-translate-y-0.5 sm:px-5">
              <span className="block text-2xl font-bold tabular-nums sm:text-3xl">{listed.length.toLocaleString()}</span>
              <span className="mt-0.5 block text-[11px] text-white/70">แสดงบนทำเนียบ</span>
            </Link>
            {[...ACADEMY_LEVELS].reverse().map((l) => (
              <Link key={l} href={`/academies/manage/academies?level=${l}`} className="rounded-2xl bg-white px-3 py-3 text-center text-[#0b1220] transition-transform hover:-translate-y-0.5 sm:px-5">
                <span className="mx-auto block h-3 w-3 rounded-full" style={{ background: COIN[l].face, boxShadow: `0 2px 0 ${COIN[l].side}` }} />
                <span className="mt-1 block text-2xl font-bold tabular-nums sm:text-3xl">{listed.filter((a) => a.level === l).length.toLocaleString()}</span>
                <span className="block text-[11px] font-semibold text-slate-500">ระดับ {LEVEL_META[l].label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* งานที่ต้องทำ: การ์ดแยกสี */}
        <section aria-labelledby="todo">
          <h2 id="todo" className="text-lg font-bold text-[#0b1220]">
            งานที่ต้องทำ
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {tasks.map((t) => {
              const c = TASK_TONE[t.tone];
              const on = t.n > 0;
              return (
                <li key={t.label}>
                  <Link
                    href={t.href}
                    className={`relative flex h-full flex-col overflow-hidden rounded-2xl p-4 pt-5 ring-1 transition-all hover:-translate-y-0.5 ${on ? c.tile : "bg-white ring-slate-200 hover:ring-slate-400"}`}
                  >
                    <span className={`absolute inset-x-0 top-0 h-1.5 ${on ? c.bar : "bg-slate-200"}`} />
                    <span className="flex items-center justify-between">
                      <t.icon className={`h-5 w-5 ${on ? c.text : "text-slate-300"}`} />
                      <span className={`text-3xl font-bold tabular-nums ${on ? c.text : "text-slate-300"}`}>{t.n}</span>
                    </span>
                    <span className={`mt-3 text-sm font-bold leading-snug ${on ? "text-[#0b1220]" : "text-slate-500"}`}>{t.label}</span>
                    <span className="mt-0.5 text-xs text-slate-500">{t.hint}</span>
                    <span className={`mt-auto flex items-center gap-1 pt-3 text-xs font-bold ${on ? c.text : "text-emerald-600"}`}>
                      {on ? (
                        <>
                          ไปจัดการ
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          ไม่มีงานค้าง
                        </>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="ใกล้หมดอายุ" icon={Clock} tone="amber" flush actions={<Link href="/academies/manage/licences?tab=expiring" className={`${btn.link} text-xs`}>ทั้งหมด</Link>}>
            {expiring.length === 0 ? (
              <Empty>ไม่มีใบอนุญาตที่จะหมดอายุใน 60 วัน</Empty>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {expiring.slice(0, 6).map((a) => {
                  const days = daysUntil(a.current!.expiresAt!, now);
                  return (
                    <li key={a.id}>
                      <Link href={`/academies/manage/${a.id}?tab=licences`} className="flex items-center gap-3 px-5 py-3 hover:bg-amber-50/60">
                        <LevelBadge level={a.level} />
                        <span className="min-w-0 flex-1 truncate font-semibold text-slate-900">{a.nameEn}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${days <= 14 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>อีก {days} วัน</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="กิจกรรมล่าสุด" icon={History} flush actions={<Link href="/academies/manage/activity" className={`${btn.link} text-xs`}>ดูทั้งหมด</Link>}>
            {logs.length === 0 ? (
              <Empty>ยังไม่มีกิจกรรม</Empty>
            ) : (
              <ul className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const meta = AUDIT_ACTIONS[log.action] ?? { label: log.action, tone: "bg-slate-100 text-slate-600" };
                  return (
                    <li key={log.id} className="px-5 py-2.5 text-sm">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${meta.tone}`}>{meta.label}</span>
                        <span className="text-xs text-slate-400">{log.createdAt.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Bangkok" })}</span>
                      </span>
                      <span className="mt-1 block text-slate-700">{log.summary}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </PageBody>
    </>
  );
}
