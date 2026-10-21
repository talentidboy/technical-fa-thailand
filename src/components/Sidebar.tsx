"use client";

import { useEffect, useState } from "react";
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
  CalendarClock,
  Menu,
  X,
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

// แถบเมนูของศูนย์อบรมผู้ฝึกสอน — จอใหญ่ (lg+) เป็นแถบด้านซ้ายถาวร, จอเล็กเป็นแถบบน + เมนูเลื่อนออกจากซ้าย
export function Sidebar({
  email,
  role,
  pendingRequestCount = 0,
  renewalRequestCount = 0,
}: {
  email: string;
  role: string;
  pendingRequestCount?: number;
  renewalRequestCount?: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // เปลี่ยนหน้าแล้วปิดเมนูบนมือถือ · เปิดเมนูอยู่ห้ามเลื่อนหน้าด้านหลัง
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const roleLabel = role === "ADMIN" ? "ผู้ดูแลระบบ" : role === "STAFF" ? "เจ้าหน้าที่" : role;

  const adminItems: NavItem[] =
    role === "ADMIN"
      ? [
          { href: "/course-sessions", label: "หลักสูตรอบรม", icon: BookOpen },
          { href: "/renewals", label: "ต่ออายุใบอนุญาต", icon: CalendarClock, badge: renewalRequestCount },
          { href: "/coaches/accounts", label: "บัญชีผู้ฝึกสอน", icon: KeyRound },
          { href: "/requests", label: "คำขอแก้ไขข้อมูล", icon: Inbox, badge: pendingRequestCount },
        ]
      : [];

  const isActive = (href: string) =>
    pathname === href ||
    (href === "/dashboard" && pathname.startsWith("/dashboard/")) ||
    (href === "/coaches" && pathname.startsWith("/coaches/") && !pathname.startsWith("/coaches/accounts")) ||
    (href !== "/dashboard" && href !== "/coaches" && pathname.startsWith(`${href}/`));

  const navLink = ({ href, label, icon: Icon, badge }: NavItem) => {
    const active = isActive(href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
          active ? "bg-white text-indigo-800 shadow-lg shadow-black/20" : "text-indigo-200 hover:bg-white/10 hover:text-white"
        }`}
      >
        {active && <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-amber-400" />}
        <span
          className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg transition-colors ${
            active ? "bg-indigo-50 text-indigo-700" : "bg-white/5 text-indigo-300 group-hover:text-white"
          }`}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="flex-1">{label}</span>
        {Boolean(badge) && (
          <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">{badge}</span>
        )}
      </Link>
    );
  };

  const brand = (
    <Link href="/dashboard" className="flex items-center gap-3">
      <Image src={LOGO_URL} alt="FA Thailand" width={40} height={40} className="h-10 w-10 flex-none rounded-xl object-cover ring-2 ring-white/15" />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold leading-tight text-white">ศูนย์อบรมผู้ฝึกสอนฟุตบอล</p>
        <p className="truncate text-[11px] text-indigo-300">Coach Education · FA Thailand</p>
      </div>
    </Link>
  );

  const panel = (
    <div className="flex h-full flex-col bg-linear-to-b from-indigo-900 via-indigo-950 to-indigo-950 text-white">
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-600 via-amber-300 to-amber-600" />
      <div className="flex items-center justify-between gap-2 px-5 pb-4 pt-6">
        {brand}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="ปิดเมนู"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-indigo-200 hover:bg-white/10 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-indigo-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          กลับหน้า Home
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
        <div className="space-y-1">
          <p className="px-3 pb-1 text-[11px] font-semibold text-indigo-400">เมนูหลัก</p>
          {navItems.map(navLink)}
        </div>
        {adminItems.length > 0 && (
          <div className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold text-indigo-400">จัดการระบบ</p>
            {adminItems.map(navLink)}
          </div>
        )}
      </nav>

      <div className="m-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-amber-400 text-sm font-black uppercase text-amber-950">
            {email.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{email}</p>
            <p className="text-[11px] text-indigo-300">{roleLabel}</p>
          </div>
        </div>
        <form action={logout} className="mt-2.5">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-indigo-200 transition-colors hover:bg-red-500/20 hover:text-red-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            ออกจากระบบ
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* จอใหญ่: แถบซ้ายถาวร */}
      <aside className="relative hidden h-screen w-72 shrink-0 lg:block">{panel}</aside>

      {/* จอเล็ก: แถบบน + ปุ่มเมนู */}
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/10 bg-indigo-950 px-4 py-3 lg:hidden">
        {brand}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="เปิดเมนู"
          className="relative flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-white/10 text-white"
        >
          <Menu className="h-5 w-5" />
          {pendingRequestCount > 0 && role === "ADMIN" && (
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500 ring-2 ring-indigo-950" />
          )}
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="เมนู">
          <button type="button" aria-label="ปิดเมนู" onClick={() => setOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
          <div className="relative h-full w-[85%] max-w-xs shadow-2xl">{panel}</div>
        </div>
      )}
    </>
  );
}
