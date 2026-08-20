"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users } from "lucide-react";

const TABS = [
  { href: "/talent-id", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/talent-id/players", label: "ผู้เล่นทั้งหมด", icon: Users },
];

export function TalentIdNav() {
  const pathname = usePathname();

  return (
    <div className="mb-8 inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-amber-400 text-indigo-950"
                : "text-indigo-300 hover:bg-white/10 hover:text-white"
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
