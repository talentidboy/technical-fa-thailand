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

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
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
