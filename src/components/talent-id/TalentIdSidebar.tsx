"use client";

import { BrandLogo } from "@/components/BrandLogo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Trophy, Activity, ArrowLeft } from "lucide-react";
import { display } from "@/components/fonts";

const NAV = [
  { href: "/talent-id", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/talent-id/players", label: "ผู้เล่นทั้งหมด", icon: Users },
  { href: "/talent-id/standouts", label: "ผู้เล่นโดดเด่นตามเกรด", icon: Trophy },
  { href: "/talent-id/stats", label: "สถิติการแข่งขัน", icon: Activity },
];

// หน้าโปรไฟล์ผู้เล่น /talent-id/rec... นับเป็นเมนู "ผู้เล่นทั้งหมด"
const isActive = (pathname: string, href: string) =>
  pathname === href || (href === "/talent-id/players" && /^\/talent-id\/rec/.test(pathname));

export function TalentIdSidebar({
  email,
  roleLabel,
}: {
  email?: string;
  roleLabel?: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[#081528] lg:flex">
      <div className="h-0.75 flex-none bg-amber-400" />
      <Link href="/talent-id" className="flex items-center gap-3 px-5 py-5">
        <BrandLogo tone="white" className="h-9" />
        <span className="h-7 w-px bg-white/20" />
        <span className="leading-tight">
          <span className={`${display.className} block text-base font-semibold text-white`}>Talent ID</span>
          <span className="block text-[11px] text-indigo-300">FA Thailand Technical</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-white text-indigo-950" : "text-indigo-200 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Icon className={`h-4 w-4 flex-none ${active ? "text-amber-600" : "text-indigo-400"}`} strokeWidth={2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        {email && (
          <>
            <p className="truncate text-sm font-medium text-indigo-100" title={email}>
              {email}
            </p>
            {roleLabel && <p className="text-[11px] text-indigo-400">{roleLabel}</p>}
          </>
        )}
        <Link href="/" className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300 hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" />
          กลับหน้าแรก
        </Link>
      </div>
    </aside>
  );
}
