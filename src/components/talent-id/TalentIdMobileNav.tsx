"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Trophy } from "lucide-react";

const NAV = [
  { href: "/talent-id", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/talent-id/players", label: "ผู้เล่น", icon: Users },
  { href: "/talent-id/standouts", label: "โดดเด่น", icon: Trophy },
];

export function TalentIdMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-white/10 bg-indigo-950/95 backdrop-blur lg:hidden">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
              active ? "text-amber-300" : "text-indigo-300"
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
