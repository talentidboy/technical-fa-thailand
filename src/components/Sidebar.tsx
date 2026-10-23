"use client";

import { BrandLogo } from "@/components/BrandLogo";
import { useEffect, useState } from "react";
import Link from "next/link";
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
  BarChart3,
  Bug,
  History,
  Menu,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { logout } from "@/app/login/actions";
import { display } from "@/components/fonts";

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
  { href: "/reports", label: "รายงานการอบรม", icon: BarChart3 },
];

// แถบเมนูของศูนย์อบรมผู้ฝึกสอน — จอใหญ่ (lg+) เป็นแถบด้านซ้ายถาวร, จอเล็กเป็นแถบบน + เมนูเลื่อนออกจากซ้าย
export function Sidebar({
  email,
  role,
  pendingRequestCount = 0,
  renewalRequestCount = 0,
  errorCount = 0,
}: {
  email: string;
  role: string;
  pendingRequestCount?: number;
  renewalRequestCount?: number;
  errorCount?: number;
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
          { href: "/audit", label: "บันทึกการแก้ไข", icon: History },
          { href: "/errors", label: "บันทึกข้อผิดพลาด", icon: Bug, badge: errorCount },
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
        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          active ? "bg-white text-[#04223a]" : "text-white/70 hover:bg-white/10 hover:text-white"
        }`}
      >
        <Icon className={`h-4 w-4 flex-none ${active ? "text-[#073c5e]" : "text-white/45"}`} strokeWidth={2} />
        <span className="flex-1">{label}</span>
        {Boolean(badge) && <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[11px] font-bold leading-none text-[#04223a]">{badge}</span>}
      </Link>
    );
  };

  const brand = (
    <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
      <BrandLogo tone="white" className="h-9" />
            <div className="min-w-0">
        <p className={`${display.className} truncate text-sm font-semibold leading-tight text-white`}>ศูนย์อบรมผู้ฝึกสอนฟุตบอล</p>
        <p className="truncate text-[11px] text-white/50">Coach Education · FA Thailand</p>
      </div>
    </Link>
  );

  const panel = (
    <div className="flex h-full flex-col bg-[#04223a] text-white">
      <div className="h-0.75 flex-none bg-amber-400" />
      <div className="flex items-center justify-between gap-2 px-5 pb-3 pt-5">
        {brand}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="ปิดเมนู"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-md text-white/70 hover:bg-white/10 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <div className="space-y-0.5">
          <p className="px-3 pb-1.5 text-[11px] font-semibold text-white/40">เมนูหลัก</p>
          {navItems.map(navLink)}
        </div>
        {adminItems.length > 0 && (
          <div className="space-y-0.5">
            <p className="px-3 pb-1.5 text-[11px] font-semibold text-white/40">จัดการระบบ</p>
            {adminItems.map(navLink)}
          </div>
        )}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-white/10 text-sm font-semibold uppercase text-amber-300">{email.charAt(0)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white" title={email}>
              {email}
            </p>
            <p className="text-[11px] text-white/50">{roleLabel}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 text-xs font-medium">
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-md py-1.5 text-white/55 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" />
            กลับหน้า Home
          </Link>
          <form action={logout}>
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-white/55 transition-colors hover:bg-white/10 hover:text-white">
              <LogOut className="h-3.5 w-3.5" />
              ออกจากระบบ
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* จอใหญ่: แถบซ้ายถาวร */}
      <aside className="hidden h-screen w-72 shrink-0 lg:block">{panel}</aside>

      {/* จอเล็ก: แถบบน + ปุ่มเมนู */}
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-t-[3px] border-amber-400 bg-[#04223a] px-4 py-2.5 lg:hidden">
        {brand}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="เปิดเมนู"
          className="relative flex h-10 w-10 flex-none items-center justify-center rounded-md bg-white/10 text-white"
        >
          <Menu className="h-5 w-5" />
          {pendingRequestCount > 0 && role === "ADMIN" && (
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-amber-400 ring-2 ring-[#04223a]" />
          )}
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="เมนู">
          <button type="button" aria-label="ปิดเมนู" onClick={() => setOpen(false)} className="absolute inset-0 bg-slate-950/60" />
          <div className="relative h-full w-[85%] max-w-xs shadow-2xl">{panel}</div>
        </div>
      )}
    </>
  );
}
