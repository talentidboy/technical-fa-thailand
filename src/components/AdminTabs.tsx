"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart3 } from "lucide-react";

// สลับ "มุมมอง" ของหมวดแดชบอร์ดเท่านั้น (ภาพรวม / รายงานเชิงลึก) — การนำทางไปหมวดอื่น
// (ผู้ฝึกสอน, วิทยากร, หลักสูตร, คำขอแก้ไข) อยู่ใน AdminTopBar แถวสถิติแทน ไม่ปนกับแท็บนี้
const TABS = [
  { href: "/dashboard", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/dashboard/report", label: "รายงานเชิงลึก", icon: BarChart3 },
];

export function AdminTabs() {
  const pathname = usePathname();
  // แท็บนี้สลับมุมมองของแดชบอร์ดเท่านั้น — หน้าอื่น (รายชื่อผู้ฝึกสอน ฯลฯ) ไม่ต้องแสดง
  if (!pathname.startsWith("/dashboard")) return null;

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-[#073c5e] text-white"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
