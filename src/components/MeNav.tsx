"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, GraduationCap, IdCard, Settings, Bell } from "lucide-react";

// เมนูของผู้ฝึกสอน (ส่วนหัวหน้า /me) — จอเล็กแสดงแค่ไอคอน
const LINKS = [
  { href: "/me", label: "หน้าแรก", icon: Home },
  { href: "/me/courses", label: "สมัครอบรม", icon: GraduationCap },
  { href: "/me/card", label: "บัตรประจำตัว", icon: IdCard },
  { href: "/me/settings", label: "ตั้งค่า", icon: Settings },
];

export function MeNav({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1">
      <Link
        href="/me/notifications"
        aria-label={unread ? `การแจ้งเตือน (${unread} ใหม่)` : "การแจ้งเตือน"}
        aria-current={pathname === "/me/notifications" ? "page" : undefined}
        className={`relative inline-flex h-10 items-center rounded-lg px-2.5 transition-colors ${
          pathname === "/me/notifications" ? "bg-white text-indigo-900" : "text-indigo-200 hover:bg-white/10 hover:text-white"
        }`}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors sm:px-3 ${
              active ? "bg-white text-indigo-900" : "text-indigo-200 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4 flex-none" />
            <span className="hidden md:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
