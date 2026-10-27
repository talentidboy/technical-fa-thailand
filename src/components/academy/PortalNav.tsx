"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { LayoutDashboard, Building2, Users, Shirt, FileCheck2, Bell } from "lucide-react";
import { markNoticesRead } from "@/app/academies/portal/actions";

// สีไอคอนแต่ละเมนูตรงกับสีการ์ดของหัวข้อนั้นในหน้าภาพรวม
const LINKS = [
  { href: "/academies/portal", label: "ภาพรวม", icon: LayoutDashboard, color: "#1e96dc", exact: true },
  { href: "/academies/portal/profile", label: "ข้อมูลอคาเดมี", icon: Building2, color: "#0d9488" },
  { href: "/academies/portal/staff", label: "บุคลากร", icon: Users, color: "#8b5cf6" },
  { href: "/academies/portal/teams", label: "ทีมและนักเตะ", icon: Shirt, color: "#10b981" },
  { href: "/academies/portal/applications", label: "ใบสมัคร", icon: FileCheck2, color: "#f59e0b" },
  { href: "/academies/portal/notices", label: "การแจ้งเตือน", icon: Bell, color: "#f97316" },
];

// เมนูพอร์ทัลอคาเดมี: ปุ่มเม็ดยา · หน้าที่เปิดอยู่เป็นสีดำ · มือถือเลื่อนแนวนอนได้และเลื่อนเมนูที่เปิดอยู่มาให้เห็นเอง
export function PortalNav({ unread }: { unread: number }) {
  const path = usePathname();
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bar.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (el && bar.current) bar.current.scrollTo({ left: el.offsetLeft - (bar.current.clientWidth - el.offsetWidth) / 2, behavior: "smooth" });
  }, [path]);
  return (
    <nav aria-label="เมนูพอร์ทัล" className="border-b border-slate-200 bg-white">
      <div ref={bar} className="mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-4 py-2.5 sm:px-6 [scrollbar-width:none]">
        {LINKS.map(({ href, label, icon: Icon, color, exact }) => {
          const active = exact ? path === href : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex flex-none items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                active ? "bg-[#0b1220] text-white" : "text-slate-600 hover:bg-[#e6f3fc] hover:text-[#0b1220]"
              }`}
            >
              <Icon className="h-4 w-4" style={{ color: active ? "#ffd426" : color }} />
              {label}
              {href.endsWith("notices") && unread > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">{unread}</span>}
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
