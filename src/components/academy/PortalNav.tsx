"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { LayoutDashboard, Building2, Users, Shirt, FileCheck2, Bell } from "lucide-react";
import { markNoticesRead } from "@/app/academies/portal/actions";

const LINKS = [
  { href: "/academies/portal", label: "ภาพรวม", icon: LayoutDashboard, exact: true },
  { href: "/academies/portal/profile", label: "ข้อมูลอคาเดมี", icon: Building2 },
  { href: "/academies/portal/staff", label: "บุคลากร", icon: Users },
  { href: "/academies/portal/teams", label: "ทีมและนักเตะ", icon: Shirt },
  { href: "/academies/portal/applications", label: "ใบสมัคร", icon: FileCheck2 },
  { href: "/academies/portal/notices", label: "การแจ้งเตือน", icon: Bell },
];

// เมนูพอร์ทัลอคาเดมี (เลื่อนแนวนอนได้บนมือถือ)
export function PortalNav({ unread }: { unread: number }) {
  const path = usePathname();
  return (
    <nav aria-label="เมนูพอร์ทัล" className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6 [scrollbar-width:none]">
        {LINKS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? path === href : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex flex-none items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                active ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {href.endsWith("notices") && unread > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{unread}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// เปิดหน้าการแจ้งเตือนแล้ว = อ่านแล้ว (ทำหลังแสดงผล ให้ยังเห็นว่ารายการไหนใหม่)
export function MarkNoticesRead({ hasUnread }: { hasUnread: boolean }) {
  useEffect(() => {
    if (hasUnread) void markNoticesRead();
  }, [hasUnread]);
  return null;
}
