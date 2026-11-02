import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { ACADEMY_LEVELS, LEVEL_META, daysUntil, showPublicly, thaiDate } from "@/lib/academy";
import { loadAcademies } from "@/lib/academy-data";
import { issueCounts } from "@/lib/academy-issues";
import { LevelBadge } from "@/components/academy/AcademyUi";
import { COIN } from "@/components/academy/Podium";
import { Card, Empty, PageBody, PageHeader, btn, input } from "@/components/academy/ManageUi";
import { ArrowRight, BadgeCheck, CheckCircle2, Clock, Download, FileCheck2, History, KeyRound, Plus, Search, TriangleAlert, type LucideIcon } from "lucide-react";

const LEGACY = ["q", "level", "state", "province", "issue", "page"];

// สีแถวงาน (เขียนเต็มชื่อคลาสให้ Tailwind เห็น)
const TASK_TONE = {
  sky: { bar: "bg-[#1e96dc]", text: "text-[#0b6cb0]" },
  violet: { bar: "bg-violet-500", text: "text-violet-700" },
  amber: { bar: "bg-amber-400", text: "text-amber-700" },
  red: { bar: "bg-red-500", text: "text-red-700" },
};
type Task = { n: number; title: string; done: string; hint: string; action: string; href: string; tone: keyof typeof TASK_TONE };

// งานที่คนดูแลทำบ่อย — ตอบคำถาม "ถ้าจะทำสิ่งนี้ ต้องไปที่ไหน"
const GOALS: { title: string; hint: string; href: string; icon: LucideIcon }[] = [
  { title: "เพิ่มอคาเดมีใหม่", hint: "กรอกชื่อและจังหวัด แล้วออกใบอนุญาตต่อได้เลย", href: "/academies/manage/academies/new", icon: Plus },
  { title: "ต่ออายุใบอนุญาต", hint: "ดูรายชื่อที่ใกล้หมดอายุ แล้วกดปุ่มต่ออายุท้ายแถว", href: "/academies/manage/licences", icon: BadgeCheck },
  { title: "ตรวจใบสมัคร", hint: "ตรวจเอกสารที่อคาเดมีส่งมาทีละข้อ แล้วอนุมัติหรือส่งกลับ", href: "/academies/manage/applications", icon: FileCheck2 },
  { title: "สร้างบัญชี / ตั้งรหัสผ่านใหม่", hint: "ให้อคาเดมีเข้าสู่ระบบ หรือช่วยเมื่อลืมรหัสผ่าน", href: "/academies/manage/accounts", icon: KeyRound },
];

// หน้าแรกของระบบจัดการ: วันนี้ต้องทำอะไร → อยากทำอะไร (ค้นหา + ทางลัด) → ตัวเลขสรุป → ใกล้หมดอายุ + กิจกรรมล่าสุด
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
    prisma.auditLog.findMany({ where: { action: { startsWith: "ACADEMY_" } }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  const listed = rows.filter((a) => showPublicly(a.active, a.state));
  const live = rows.filter((a) => a.active);
  const expiring = live.filter((a) => a.state === "expiring").sort((a, b) => a.current!.expiresAt!.getTime() - b.current!.expiresAt!.getTime());
  const expired = live.filter((a) => a.state === "expired").length;
  const issues = issueCounts(rows).sort((a, b) => b.n - a.n);
  const issueTotal = issues.reduce((n, i) => n + i.n, 0);

  const tasks: Task[] = [
    { n: submitted, title: `มีใบสมัคร ${submitted} ใบรอตรวจ`, done: "ใบสมัครรอตรวจ", hint: "เปิดดูเอกสารทีละข้อ แล้วอนุมัติ ส่งกลับให้แก้ไข หรือไม่อนุมัติ", action: "ตรวจใบสมัคร", href: "/academies/manage/applications", tone: "sky" },
    { n: pendingMembers, title: `มีคนขอเป็นผู้ดูแลอคาเดมี ${pendingMembers} คน`, done: "คำขอเป็นผู้ดูแล", hint: "ตรวจว่าเป็นผู้ดูแลจริง แล้วกดอนุมัติหรือไม่อนุมัติ", action: "ตรวจคำขอ", href: "/academies/manage/accounts", tone: "violet" },
    { n: expired, title: `ใบอนุญาตหมดอายุแล้ว ${expired} ใบ`, done: "ใบอนุญาตหมดอายุ", hint: "ต่ออายุให้ ถ้าอคาเดมีผ่านการประเมินแล้ว หรือปิดการแสดงบนทำเนียบ", action: "ดูรายชื่อ", href: "/academies/manage/licences?tab=expired", tone: "red" },
    { n: expiring.length, title: `ใบอนุญาต ${expiring.length} ใบจะหมดอายุภายใน 60 วัน`, done: "ใบอนุญาตใกล้หมดอายุ", hint: "แจ้งอคาเดมีให้เตรียมยื่นต่ออายุ", action: "ดูรายชื่อ", href: "/academies/manage/licences?tab=expiring", tone: "amber" },
  ];
  const todo = tasks.filter((t) => t.n > 0);
  const clear = tasks.filter((t) => t.n === 0);

  return (
    <>
      <PageHeader title="ภาพรวม" description={`วันนี้ต้องทำอะไรบ้าง · ข้อมูล ณ ${thaiDate(now, "long")}`} />
      <PageBody>
        {/* วันนี้ต้องทำอะไร: แสดงเฉพาะงานที่มีจริง เรียงตามความเร่งด่วน */}
        <section aria-labelledby="todo">
          <h2 id="todo" className="text-lg font-bold text-[#0b1220]">
            งานที่ต้องทำวันนี้
          </h2>
          {todo.length === 0 ? (
            <p className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-50 px-5 py-4 font-semibold text-emerald-800 ring-1 ring-emerald-200">
              <CheckCircle2 className="h-5 w-5 flex-none" />
              ไม่มีงานค้าง ไม่ต้องทำอะไรเพิ่ม
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {todo.map((t) => {
                const c = TASK_TONE[t.tone];
                return (
                  <li key={t.href}>
                    <Link href={t.href} className="group relative flex flex-wrap items-center gap-x-4 gap-y-2 overflow-hidden rounded-2xl bg-white py-4 pl-6 pr-5 ring-1 ring-slate-200 transition-shadow hover:shadow-md hover:ring-slate-300">
                      <span className={`absolute inset-y-0 left-0 w-1.5 ${c.bar}`} />
                      <span className="min-w-60 flex-1">
                        <span className="block font-bold text-[#0b1220]">{t.title}</span>
                        <span className="mt-0.5 block text-sm text-slate-500">{t.hint}</span>
                      </span>
                      <span className={`inline-flex items-center gap-1 text-sm font-bold ${c.text}`}>
                        {t.action}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          {todo.length > 0 && clear.length > 0 && (
            <p className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-500">
              <CheckCircle2 className="h-3.5 w-3.5 flex-none text-emerald-600" />
              ไม่มีงานค้าง: {clear.map((t) => t.done).join(" · ")}
            </p>
          )}
        </section>

        {/* อยากทำอะไร: ค้นหา + ทางลัดงานที่ทำบ่อย */}
        <section aria-labelledby="goals">
          <h2 id="goals" className="text-lg font-bold text-[#0b1220]">
            อยากทำอะไร
          </h2>
          <form action="/academies/manage/academies" className="mt-3 flex gap-2">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">ค้นหาอคาเดมี</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input name="q" placeholder="ค้นหาอคาเดมีเพื่อดูหรือแก้ไขข้อมูล เช่น พิมพ์ชื่ออคาเดมี" className={`${input} pl-9`} />
            </label>
            <button type="submit" className={btn.primary}>
              ค้นหา
            </button>
          </form>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {GOALS.map((g) => (
              <li key={g.href}>
                <Link href={g.href} className="flex h-full items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 transition-colors hover:bg-[#f4f8fc] hover:ring-[#9fd0f0]">
                  <g.icon className="mt-0.5 h-5 w-5 flex-none text-[#1e96dc]" />
                  <span className="min-w-0">
                    <span className="block font-semibold text-[#0b1220]">{g.title}</span>
                    <span className="mt-0.5 block text-sm text-slate-500">{g.hint}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {/* ลิงก์ดาวน์โหลดไฟล์ (route handler) — ใช้ <a> ธรรมดา ไม่ให้ <Link> prefetch สร้างไฟล์ล่วงหน้า */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/academies/manage/export" className={`${btn.link} mt-3 inline-flex items-center gap-1.5 text-sm`}>
            <Download className="h-4 w-4" />
            ดาวน์โหลดรายชื่ออคาเดมีเป็น Excel
          </a>
        </section>

        {/* ตัวเลขสรุป */}
        <section aria-label="จำนวนอคาเดมีบนทำเนียบ" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Link href="/academies/manage/academies" className="rounded-2xl bg-[#0b1220] px-4 py-3 text-white transition-opacity hover:opacity-90">
            <span className="block text-2xl font-bold tabular-nums">{listed.length.toLocaleString()}</span>
            <span className="block text-xs text-white/70">แสดงบนทำเนียบ</span>
          </Link>
          {[...ACADEMY_LEVELS].reverse().map((l) => (
            <Link key={l} href={`/academies/manage/academies?level=${l}`} className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200 hover:ring-slate-400">
              <span className="block text-2xl font-bold tabular-nums text-[#0b1220]">{listed.filter((a) => a.level === l).length.toLocaleString()}</span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: COIN[l].face }} />
                ระดับ {LEVEL_META[l].label}
              </span>
            </Link>
          ))}
        </section>

        {/* ข้อมูลไม่ครบ: ไม่ใช่งานเร่งด่วน จึงแยกจากงานที่ต้องทำ */}
        {issueTotal > 0 && (
          <Link href="/academies/manage/academies" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-white px-5 py-3.5 text-sm ring-1 ring-slate-200 hover:ring-slate-400">
            <TriangleAlert className="h-4 w-4 flex-none text-amber-500" />
            <span className="min-w-60 flex-1 text-slate-600">
              <span className="font-semibold text-slate-800">ข้อมูลที่ควรตรวจสอบ {issueTotal} รายการ</span> · ไม่เร่งด่วน ค่อยเติมเมื่อมีเวลา (มากสุดคือ {issues[0].label} {issues[0].n} แห่ง)
            </span>
            <span className={btn.link}>ดูรายการ</span>
          </Link>
        )}

        <div className={`grid gap-6 ${expiring.length ? "lg:grid-cols-2" : ""}`}>
          {expiring.length > 0 && (
            <Card title="ใกล้หมดอายุ" icon={Clock} tone="amber" flush actions={<Link href="/academies/manage/licences?tab=expiring" className={`${btn.link} text-xs`}>ทั้งหมด</Link>}>
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
            </Card>
          )}

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
