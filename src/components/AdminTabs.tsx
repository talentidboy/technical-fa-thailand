"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  GraduationCap,
  BookOpen,
  Inbox,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  adminOnly?: boolean;
};

// เฉพาะเส้นทางที่อยู่ใน (admin) route group เท่านั้น — ให้ Sidebar/AdminTabs ยังอยู่ครบหลังคลิก
// /calendar, /announcements, /users อยู่นอกกลุ่มนี้ (มี header ของตัวเอง) จึงไม่ใส่ไว้ที่นี่
const TABS: Tab[] = [
  { href: "/dashboard", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/dashboard/report", label: "รายงานเชิงลึก", icon: BarChart3 },
  { href: "/coaches", label: "รายชื่อผู้ฝึกสอน", icon: Users },
  { href: "/instructors", label: "วิทยากร", icon: GraduationCap },
  { href: "/course-sessions", label: "หลักสูตรอบรม", icon: BookOpen, adminOnly: true },
  { href: "/requests", label: "คำขอแก้ไขข้อมูล", icon: Inbox, adminOnly: true },
];

export function AdminTabs({
  role,
  pendingRequestCount = 0,
}: {
  role: string;
  pendingRequestCount?: number;
}) {
  const pathname = usePathname();
  const tabs = TABS.filter((t) => !t.adminOnly || role === "ADMIN").map((t) =>
    t.href === "/requests" ? { ...t, badge: pendingRequestCount } : t,
  );

  return (
    <div className="mb-6 flex items-center gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      {tabs.map(({ href, label, icon: Icon, badge }) => {
        const active =
          pathname === href ||
          (href === "/dashboard" && pathname.startsWith("/dashboard/"));
        return (
          <Link
            key={href}
            href={href}
            className={`relative inline-flex flex-none items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {Boolean(badge) && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  active ? "bg-white/20 text-white" : "bg-red-500 text-white"
                }`}
              >
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
