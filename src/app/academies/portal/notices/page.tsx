import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAcademy } from "@/lib/academy-portal";
import { MarkNoticesRead } from "@/components/academy/PortalNav";
import { Bell, ChevronRight } from "lucide-react";

export const metadata: Metadata = { title: "การแจ้งเตือน | พอร์ทัลอคาเดมี" };

export default async function PortalNoticesPage() {
  const { member } = await requireAcademy();
  const notices = await prisma.academyNotice.findMany({ where: { academyId: member.academyId }, orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <MarkNoticesRead hasUnread={notices.some((n) => !n.readAt)} />
      <h1 className="border-b border-slate-100 px-6 py-4 text-lg font-bold text-slate-900">การแจ้งเตือน</h1>
      {notices.length === 0 ? (
        <p className="flex flex-col items-center gap-2 px-6 py-12 text-sm text-slate-400">
          <Bell className="h-8 w-8" />
          ยังไม่มีการแจ้งเตือน
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {notices.map((n) => {
            const inner = (
              <>
                {!n.readAt && <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-red-500" aria-label="ใหม่" />}
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm ${n.readAt ? "text-slate-700" : "font-semibold text-slate-900"}`}>{n.title}</span>
                  {n.body && <span className="block whitespace-pre-line text-sm text-slate-500">{n.body}</span>}
                  <span className="block text-xs text-slate-400">{n.createdAt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" })}</span>
                </span>
                {n.link && <ChevronRight className="h-4 w-4 flex-none text-slate-300" />}
              </>
            );
            return (
              <li key={n.id}>
                {n.link ? (
                  <Link href={n.link} className="flex gap-3 px-6 py-4 hover:bg-slate-50">
                    {inner}
                  </Link>
                ) : (
                  <div className="flex gap-3 px-6 py-4">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
