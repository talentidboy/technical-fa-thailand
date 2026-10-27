"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  BookOpen,
  CalendarDays,
  CalendarHeart,
  CircleHelp,
  Clapperboard,
  ClipboardList,
  FileText,
  Handshake,
  Images,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  Quote,
  Timer,
  Trophy,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { logout } from "@/app/login/actions";
import { BrandLogo } from "@/components/BrandLogo";
import { display } from "@/components/fonts";
import { AdminSwitcher } from "./AdminSwitcher";
import { ADMIN_AREAS } from "./areas";

// ไอคอนของเมนู (ส่งเป็นชื่อจากฝั่งเซิร์ฟเวอร์ — ส่งตัวคอมโพเนนต์ข้ามไม่ได้)
const ICONS = {
  award: Award,
  book: BookOpen,
  calendar: CalendarDays,
  calendarHeart: CalendarHeart,
  help: CircleHelp,
  clapper: Clapperboard,
  clipboard: ClipboardList,
  file: FileText,
  handshake: Handshake,
  images: Images,
  dashboard: LayoutDashboard,
  tasks: ListChecks,
  pin: MapPin,
  megaphone: Megaphone,
  quote: Quote,
  timer: Timer,
  trophy: Trophy,
  users: UsersRound,
} satisfies Record<string, LucideIcon>;

export type AdminNavItem = {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  badge?: number | null;
  // กำหนดเองเมื่อเมนูอิงพารามิเตอร์ในลิงก์ (เช่น ?tab=) · ไม่กำหนด = ดูจาก path
  active?: boolean;
  // path อื่นที่นับเป็นเมนูนี้ (เช่น หน้ารายละเอียดนัด/ทีม)
  match?: string[];
};

// แถบซ้ายของระบบจัดการ (ทุกหมวดใช้รูปแบบเดียวกัน): โลโก้ + ชื่อหมวด · ปุ่มสลับระบบจัดการ · เมนูของหมวด · ลิงก์หน้าเว็บ · ผู้ใช้/ออกจากระบบ
// จอใหญ่: แถบซ้ายติดจอ · จอเล็ก: แถบบน + ปุ่มเปิดเมนูแบบลิ้นชัก
export function AdminSidebar({
  area,
  title,
  items,
  publicHref,
  publicLabel,
  email,
  role,
}: {
  area: string;
  title: string;
  items: AdminNavItem[];
  publicHref?: string;
  publicLabel?: string;
  email: string;
  role: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isAdmin = role === "ADMIN";
  const hex = ADMIN_AREAS.find((a) => a.key === area)?.hex ?? "#04223a";
  const isActive = (it: AdminNavItem) =>
    it.active ?? (pathname === it.href || (it.match ?? []).some((m) => pathname.startsWith(m)));

  const brand = (
    <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
      <BrandLogo tone="white" className="h-9" />
      <span className="min-w-0">
        <span className={`${display.className} block truncate text-sm font-semibold leading-tight text-white`}>{title}</span>
        <span className="block truncate text-[11px] text-white/50">ระบบจัดการ · FA Thailand</span>
      </span>
    </Link>
  );

  const panel = (
    <div className="flex h-full flex-col bg-[#04223a] text-white">
      <div className="h-0.75 flex-none" style={{ background: hex === "#04223a" ? "#fbbf24" : hex }} />
      <div className="flex items-start justify-between gap-2 px-5 pb-4 pt-5">
        {brand}
        <button type="button" onClick={() => setOpen(false)} aria-label="ปิดเมนู" className="flex h-9 w-9 flex-none items-center justify-center rounded-md text-white/70 hover:bg-white/10 lg:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-3">
        <AdminSwitcher current={area} isAdmin={isAdmin} wide />
      </div>

      <nav aria-label="เมนูระบบจัดการ" className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-1.5 text-[11px] font-semibold text-white/40">เมนู</p>
        {items.map((it) => {
          const Icon = ICONS[it.icon];
          const active = isActive(it);
          return (
            <Link
              key={it.href}
              href={it.href}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-white text-[#04223a]" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
            >
              <Icon className="h-4.5 w-4.5 flex-none" />
              <span className="flex-1">{it.label}</span>
              {it.badge != null && <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold leading-none ${active ? "bg-slate-100 text-slate-600" : "bg-white/10 text-white/70"}`}>{it.badge}</span>}
            </Link>
          );
        })}
        {publicHref && (
          <Link href={publicHref} className="mt-3 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/55 hover:bg-white/10 hover:text-white">
            <ArrowUpRight className="h-4.5 w-4.5 flex-none" />
            {publicLabel ?? "ดูหน้าเว็บ"}
          </Link>
        )}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-white/10 text-sm font-semibold uppercase text-amber-300">{email.charAt(0)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white" title={email}>
              {email}
            </p>
            <p className="text-[11px] text-white/50">{isAdmin ? "ผู้ดูแลระบบ" : "เจ้าหน้าที่"}</p>
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
      <aside className="hidden h-screen w-72 flex-none lg:sticky lg:top-0 lg:block">{panel}</aside>

      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-t-[3px] border-amber-400 bg-[#04223a] px-4 py-2.5 lg:hidden">
        {brand}
        <button type="button" onClick={() => setOpen(true)} aria-label="เปิดเมนู" className="flex h-10 w-10 flex-none items-center justify-center rounded-md text-white hover:bg-white/10">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="เมนู">
          <button type="button" aria-label="ปิดเมนู" onClick={() => setOpen(false)} className="absolute inset-0 bg-slate-950/60" />
          <div className="absolute inset-y-0 left-0 w-[min(20rem,85vw)] shadow-2xl">{panel}</div>
        </div>
      )}
    </>
  );
}
