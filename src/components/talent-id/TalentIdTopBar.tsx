"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, LayoutDashboard, Trophy, Users } from "lucide-react";
import { TALENT_ID_LOGO_URL } from "@/lib/brand";
import { HomeButton } from "@/components/HomeButton";
import { talentFont } from "@/components/typefaces/talent";
import { AdminSwitcher } from "@/components/admin/AdminSwitcher";

const NAV = [
  { href: "/talent-id", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/talent-id/players", label: "ผู้เล่นทั้งหมด", icon: Users },
  { href: "/talent-id/standouts", label: "ผู้เล่นโดดเด่นตามเกรด", icon: Trophy },
  { href: "/talent-id/stats", label: "สถิติการแข่งขัน", icon: Activity },
];

// หน้าโปรไฟล์ผู้เล่น /talent-id/rec... นับเป็นแท็บ "ผู้เล่นทั้งหมด"
const isActive = (pathname: string, href: string) => pathname === href || (href === "/talent-id/players" && /^\/talent-id\/rec/.test(pathname));

// แถบบนของ Talent ID (ห้องวิเคราะห์ข้อมูล): โลโก้ · แท็บเมนู · ผู้ใช้ · ปุ่มกลับหน้าแรกมุมขวาสุด (โทรศัพท์ใช้แถบเมนูล่างจอแทนแท็บ)
export function TalentIdTopBar({ email, roleLabel, isAdmin = false }: { email?: string; roleLabel?: string; isAdmin?: boolean }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-indigo-950">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/talent-id" className="flex flex-none items-center gap-3">
          <span className="relative h-9 w-9 overflow-hidden rounded-md bg-white">
            <Image src={TALENT_ID_LOGO_URL} alt="" fill sizes="36px" className="object-contain p-0.5" />
          </span>
          <span className="leading-none">
            <span className={`${talentFont.className} block text-lg font-bold tracking-wide text-white`}>
              TALENT<span className="text-amber-300">ID</span>
            </span>
            <span className="text-[10px] text-indigo-400">FA Thailand Technical</span>
          </span>
        </Link>

        <nav aria-label="เมนู Talent ID" className="hidden h-full flex-1 items-stretch gap-1 md:flex">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center gap-2 px-3 text-sm font-medium transition-colors ${active ? "text-white" : "text-indigo-300 hover:text-white"}`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-amber-300" : ""}`} />
                <span className="whitespace-nowrap">{label}</span>
                {active && <span className="absolute inset-x-3 bottom-0 h-0.5 bg-amber-300" />}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex flex-none items-center gap-4">
          <div className="hidden xl:block">
            <AdminSwitcher current="talent" isAdmin={isAdmin} />
          </div>
          {email && (
            <span className="hidden text-right leading-tight xl:block">
              <span className="block max-w-48 truncate text-xs text-indigo-200" title={email}>
                {email}
              </span>
              {roleLabel && <span className="text-[11px] text-indigo-400">{roleLabel}</span>}
            </span>
          )}
          <HomeButton tone="dark" />
        </div>
      </div>
    </header>
  );
}
