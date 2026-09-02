"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Inbox,
  GraduationCap,
  BookOpen,
  ArrowLeft,
  KeyRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { logout } from "@/app/login/actions";
import { LOGO_URL } from "@/lib/brand";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
  { href: "/coaches", label: "รายชื่อผู้ฝึกสอน", icon: Users },
  { href: "/instructors", label: "วิทยากร", icon: GraduationCap },
];

export function Sidebar({
  email,
  role,
  pendingRequestCount = 0,
}: {
  email: string;
  role: string;
  pendingRequestCount?: number;
}) {
  const pathname = usePathname();

  const roleLabel =
    role === "ADMIN" ? "ผู้ดูแลระบบ" : role === "STAFF" ? "เจ้าหน้าที่" : role;

  const items =
    role === "ADMIN"
      ? [
          ...navItems,
          { href: "/course-sessions", label: "หลักสูตรอบรม", icon: BookOpen },
          { href: "/coaches/accounts", label: "บัญชีผู้ฝึกสอน", icon: KeyRound },
          {
            href: "/requests",
            label: "คำขอแก้ไขข้อมูล",
            icon: Inbox,
            badge: pendingRequestCount,
          },
        ]
      : navItems;

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-6 py-5">
        <Image
          src={LOGO_URL}
          alt="FA Thailand"
          width={36}
          height={36}
          className="h-9 w-9 rounded-lg object-cover"
        />
        <div>
          <p className="text-sm font-semibold text-slate-900">
            ศูนย์อบรมผู้ฝึกสอนฟุตบอล
          </p>
          <p className="text-xs text-slate-400">FA Thailand Technical</p>
        </div>
      </div>

      <div className="px-3 pb-2">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับหน้า Home
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map(({ href, label, icon: Icon, badge }) => {
          const active =
            pathname === href ||
            (href === "/dashboard" && pathname.startsWith("/dashboard/"));
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {active && (
                <span className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-indigo-600" />
              )}
              <Icon className="h-4.5 w-4.5" strokeWidth={2} />
              <span className="flex-1">{label}</span>
              {Boolean(badge) && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 px-4 py-4">
        <p className="truncate px-2 text-sm font-medium text-slate-700">
          {email}
        </p>
        <p className="px-2 text-xs text-slate-400">{roleLabel}</p>
        <form action={logout} className="mt-2">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </button>
        </form>
      </div>
    </aside>
  );
}
