import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { BrandLogo } from "@/components/BrandLogo";
import { HomeButton } from "@/components/HomeButton";
import { areasFor } from "@/components/admin/areas";
import { display } from "@/components/fonts";
import { ArrowRight, BadgeCheck, Bug, CalendarClock, CheckCircle2, ClipboardList, FilePlus2, Inbox, LogOut, Megaphone, Plus, RefreshCcw, ShieldCheck, UserPlus, UserRoundCheck } from "lucide-react";

export const metadata: Metadata = { title: "ศูนย์ควบคุม | FA Thailand Technical" };

const h = display.className;
const DAY = 86_400_000;

// ศูนย์ควบคุม: หน้าแรกของแอดมิน/เจ้าหน้าที่หลังเข้าสู่ระบบ — งานค้างของทุกหมวดในหน้าเดียว + ทางเข้าระบบจัดการทุกหมวด + ทางลัดงานที่ทำบ่อย
export default async function AdminHubPage() {
  const user = await requireStaff();
  const isAdmin = user.role === "ADMIN";
  const now = new Date();
  const zero = Promise.resolve(0);

  const [editRequests, renewals, applicants, errors, academyApps, academyMembers, academyExpiring, coachExpiring] = await Promise.all([
    isAdmin ? prisma.profileEditRequest.count({ where: { status: "PENDING" } }) : zero,
    isAdmin ? prisma.licenseRenewal.count({ where: { status: "PENDING" } }) : zero,
    isAdmin ? prisma.application.count({ where: { status: "PENDING" } }) : zero,
    isAdmin ? prisma.errorLog.count({ where: { resolved: false } }).catch(() => 0) : zero,
    prisma.academyApplication.count({ where: { status: "SUBMITTED" } }),
    prisma.academyMember.count({ where: { status: "PENDING" } }),
    prisma.academyLicence.count({ where: { status: "ACTIVE", expiresAt: { gte: now, lte: new Date(now.getTime() + 60 * DAY) }, academy: { active: true } } }),
    prisma.licenseRecord.count({ where: { expireDate: { gte: now, lte: new Date(now.getTime() + 30 * DAY) } } }),
  ]);

  // งานค้าง: ต้องตัดสินใจ (urgent) ขึ้นก่อน · ข้อมูลเพื่อทราบ (info) ตามหลัง
  const tasks = [
    { show: isAdmin, n: applicants, label: "ผู้สมัครอบรมรออนุมัติ", area: "ศูนย์อบรมผู้ฝึกสอน", href: "/course-sessions", icon: UserRoundCheck, urgent: true },
    { show: isAdmin, n: renewals, label: "คำขอต่ออายุใบอนุญาต", area: "ศูนย์อบรมผู้ฝึกสอน", href: "/renewals", icon: RefreshCcw, urgent: true },
    { show: isAdmin, n: editRequests, label: "คำขอแก้ไขข้อมูลผู้ฝึกสอน", area: "ศูนย์อบรมผู้ฝึกสอน", href: "/requests", icon: Inbox, urgent: true },
    { show: true, n: academyApps, label: "ใบสมัคร Academy Licensing รอตรวจ", area: "Academy Licensing", href: "/academies/manage/applications", icon: ClipboardList, urgent: true },
    { show: true, n: academyMembers, label: "คำขอสิทธิ์ดูแลอคาเดมีรออนุมัติ", area: "Academy Licensing", href: "/academies/manage/accounts", icon: ShieldCheck, urgent: true },
    { show: isAdmin, n: errors, label: "ข้อผิดพลาดของระบบที่ยังไม่แก้", area: "ระบบ", href: "/errors", icon: Bug, urgent: true },
    { show: true, n: coachExpiring, label: "ใบอนุญาตผู้ฝึกสอนจะหมดอายุใน 30 วัน", area: "ศูนย์อบรมผู้ฝึกสอน", href: isAdmin ? "/renewals?tab=expiring" : "/coaches", icon: CalendarClock, urgent: false },
    { show: true, n: academyExpiring, label: "ใบอนุญาตอคาเดมีจะหมดอายุใน 60 วัน", area: "Academy Licensing", href: "/academies/manage/licences?tab=expiring", icon: BadgeCheck, urgent: false },
  ].filter((t) => t.show);
  const pending = tasks.filter((t) => t.n > 0);
  const done = tasks.filter((t) => t.n === 0);
  const urgentTotal = pending.filter((t) => t.urgent).reduce((s, t) => s + t.n, 0);

  const quick = [
    { show: isAdmin, label: "เพิ่มผู้ฝึกสอน", href: "/coaches", icon: UserPlus },
    { show: isAdmin, label: "เปิดรับสมัครรุ่นอบรม", href: "/course-sessions", icon: Plus },
    { show: true, label: "เพิ่มอคาเดมี", href: "/academies/manage/academies/new", icon: ShieldCheck },
    { show: true, label: "เพิ่มข่าวประกาศ", href: "/announcements", icon: Megaphone },
    { show: true, label: "เพิ่มบทความ", href: "/training-centre/manage", icon: FilePlus2 },
    { show: true, label: "เพิ่มกิจกรรมในปฏิทิน", href: "/calendar", icon: CalendarClock },
  ].filter((q) => q.show);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-t-[3px] border-amber-400 bg-[#04223a] text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <BrandLogo tone="white" className="h-9" />
            <span className="leading-tight">
              <span className={`${h} block text-sm font-semibold`}>ศูนย์ควบคุม</span>
              <span className="block text-[11px] text-white/55">ระบบจัดการฝ่ายเทคนิค</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-right text-xs leading-tight sm:block">
              <span className="block text-white">{user.email}</span>
              <span className="text-white/50">{isAdmin ? "ผู้ดูแลระบบ" : "เจ้าหน้าที่"}</span>
            </span>
            <form action={logout}>
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </form>
            <HomeButton tone="dark" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-sm text-slate-500">{now.toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        <h1 className={`${h} mt-1 text-3xl font-semibold text-[#04223a] sm:text-4xl`}>{urgentTotal > 0 ? `มีงานรอคุณ ${urgentTotal.toLocaleString()} รายการ` : "ไม่มีงานค้าง เยี่ยมมาก"}</h1>

        {/* ===== งานที่ต้องทำ ===== */}
        <section aria-label="งานที่ต้องทำ" className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
            <p className="border-b border-slate-100 px-5 py-3.5 text-sm font-semibold text-slate-700">งานที่ต้องทำ</p>
            {pending.length === 0 ? (
              <p className="flex items-center gap-3 px-5 py-10 text-sm text-slate-500">
                <CheckCircle2 className="h-6 w-6 flex-none text-emerald-500" />
                ทุกหมวดเคลียร์หมดแล้ว — ไม่มีรายการรออนุมัติหรือรอตรวจ
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {pending.map((t) => {
                  const Icon = t.icon;
                  return (
                    <li key={t.label}>
                      <Link href={t.href} className="group flex items-center gap-4 px-5 py-4 hover:bg-slate-50">
                        <span className={`flex h-11 min-w-11 flex-none items-center justify-center rounded-lg px-2 text-lg font-bold tabular-nums ${t.urgent ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
                          {t.n.toLocaleString()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 font-semibold text-slate-900">
                            <Icon className="h-4 w-4 flex-none text-slate-400" />
                            {t.label}
                          </span>
                          <span className="block text-xs text-slate-500">{t.area}</span>
                        </span>
                        <span className="hidden flex-none items-center gap-1 text-sm font-semibold text-[#04223a] group-hover:underline sm:inline-flex">
                          {t.urgent ? "ไปจัดการ" : "ดูรายการ"}
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {done.length > 0 && (
              <p className="border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-xs text-slate-500">
                <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-emerald-500" />
                ไม่มีค้าง: {done.map((t) => t.label).join(" · ")}
              </p>
            )}
          </div>

          {/* ทางลัดงานที่ทำบ่อย */}
          <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <p className="text-sm font-semibold text-slate-700">ทางลัด</p>
            <ul className="mt-3 space-y-1.5">
              {quick.map(({ label, href, icon: Icon }) => (
                <li key={label}>
                  <Link href={href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-[#04223a] hover:text-white hover:ring-[#04223a]">
                    <Icon className="h-4 w-4 flex-none" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ===== ระบบจัดการแต่ละหมวด ===== */}
        <section aria-label="ระบบจัดการ" className="mt-10">
          <h2 className={`${h} text-2xl font-semibold text-[#04223a]`}>ระบบจัดการ</h2>
          <p className="mt-1 text-sm text-slate-500">เลือกหมวดที่ต้องการแก้ไขข้อมูล — ในทุกหมวดมีปุ่ม “สลับระบบจัดการ” ให้กลับมาหน้านี้หรือไปหมวดอื่นได้ทันที</p>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {areasFor(isAdmin).map((a) => {
              const Icon = a.icon;
              const shortcuts = (a.shortcuts ?? []).filter((s) => isAdmin || !s.adminOnly);
              return (
                <li key={a.key} className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 transition-shadow hover:shadow-lg">
                  <Link href={a.href} className="group flex flex-1 items-start gap-4 p-5">
                    <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl text-white" style={{ background: a.hex }}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2 font-semibold text-slate-900">
                        {a.label}
                        <ArrowRight className="h-4 w-4 flex-none text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-700" />
                      </span>
                      <span className="mt-0.5 block text-sm text-slate-500">{a.desc}</span>
                    </span>
                  </Link>
                  {shortcuts.length > 0 && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 px-5 py-3 text-xs font-medium">
                      {shortcuts.map((s) => (
                        <Link key={s.href} href={s.href} className="text-slate-600 hover:text-[#04223a] hover:underline">
                          {s.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
