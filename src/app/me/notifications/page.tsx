import Link from "next/link";
import { requireCoach } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MarkNotificationsRead } from "@/components/MarkNotificationsRead";
import { Bell, BellOff, ArrowRight, Mail } from "lucide-react";

export const metadata = { title: "การแจ้งเตือน — ศูนย์อบรมผู้ฝึกสอน" };

const TONE: Record<string, string> = {
  COURSE_PASSED: "bg-emerald-500",
  LICENSE_ISSUED: "bg-emerald-500",
  RENEWAL_APPROVED: "bg-emerald-500",
  APPLICATION_APPROVED: "bg-sky-500",
  PROFILE_APPROVED: "bg-sky-500",
  LICENSE_EXPIRING_90: "bg-amber-400",
  LICENSE_EXPIRING_30: "bg-orange-500",
  LICENSE_EXPIRED: "bg-red-500",
  COURSE_FAILED: "bg-red-500",
  APPLICATION_REJECTED: "bg-red-500",
  RENEWAL_REJECTED: "bg-red-500",
  PROFILE_REJECTED: "bg-red-500",
};

export default async function NotificationsPage() {
  const user = await requireCoach();
  const [items, coach] = await Promise.all([
    prisma.notification.findMany({ where: { coachId: user.coachId! }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.coach.findUnique({ where: { id: user.coachId! }, select: { email: true } }),
  ]);
  const hasUnread = items.some((n) => !n.readAt);

  return (
    <div className="space-y-6">
      <MarkNotificationsRead hasUnread={hasUnread} />
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
          <Bell className="h-6 w-6 text-amber-500" />
          การแจ้งเตือน
        </h1>
        <p className="mt-1 text-sm text-slate-500">ผลการสมัคร/การอบรม การต่ออายุ และใบอนุญาตใกล้หมดอายุ</p>
      </div>
      {!coach?.email && (
        <Link href="/me/settings#profile" className="flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100">
          <Mail className="h-4 w-4 flex-none text-amber-600" />
          <span className="flex-1">เพิ่มอีเมลในหน้าตั้งค่า เพื่อรับการแจ้งเตือนทางอีเมลด้วย</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <BellOff className="h-8 w-8 text-slate-300" />
          <p className="font-semibold text-slate-600">ยังไม่มีการแจ้งเตือน</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          {items.map((n) => {
            const body = (
              <div className="flex gap-3 px-5 py-4">
                <span className={`mt-1.5 h-2.5 w-2.5 flex-none rounded-full ${TONE[n.type] ?? "bg-slate-400"}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${n.readAt ? "font-medium text-slate-700" : "font-bold text-slate-900"}`}>
                    {n.title}
                    {!n.readAt && <span className="ml-2 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-amber-950">ใหม่</span>}
                  </p>
                  {n.body && <p className="mt-0.5 text-sm text-slate-500">{n.body}</p>}
                  <p className="mt-1 text-xs text-slate-400">
                    {n.createdAt.toLocaleString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" })}
                  </p>
                </div>
                {n.href && <ArrowRight className="mt-1 h-4 w-4 flex-none text-slate-300" />}
              </div>
            );
            return (
              <li key={n.id} className={n.readAt ? "" : "bg-amber-50/40"}>
                {n.href ? (
                  <Link href={n.href} className="block hover:bg-slate-50">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
