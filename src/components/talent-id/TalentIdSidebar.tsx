"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Trophy, ArrowLeft } from "lucide-react";
import { LOGO_URL } from "@/lib/brand";

const NAV = [
  { href: "/talent-id", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/talent-id/players", label: "ผู้เล่นทั้งหมด", icon: Users },
  { href: "/talent-id/standouts", label: "ผู้เล่นโดดเด่นตามเกรด", icon: Trophy },
];

export function TalentIdSidebar({
  email,
  roleLabel,
}: {
  email?: string;
  roleLabel?: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-black/20">
      <div className="flex items-center gap-2 px-5 py-5">
        <Image
          src={LOGO_URL}
          alt="FA Thailand"
          width={36}
          height={36}
          className="h-9 w-9 rounded-lg object-cover"
        />
        <div>
          <p className="text-sm font-bold text-white">FA Thailand Technical</p>
          <p className="text-[11px] text-indigo-300">Talent ID</p>
        </div>
      </div>

      <div className="px-3 pb-2">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-indigo-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับหน้าแรก
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-amber-400/15 text-amber-300"
                  : "text-indigo-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {active && (
                <span className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-amber-400" />
              )}
              <Icon className="h-4.5 w-4.5" strokeWidth={2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {email && (
        <div className="border-t border-white/10 px-4 py-4">
          <p className="truncate px-2 text-sm font-medium text-indigo-100">{email}</p>
          {roleLabel && <p className="px-2 text-xs text-indigo-400">{roleLabel}</p>}
        </div>
      )}
    </aside>
  );
}
