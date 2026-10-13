"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, GraduationCap, IdCard } from "lucide-react";

// เมนูของผู้ฝึกสอน (ส่วนหัวหน้า /me) — จอเล็กแสดงแค่ไอคอน
const LINKS = [
  { href: "/me", label: "หน้าแรก", icon: Home },
  { href: "/me/courses", label: "สมัครอบรม", icon: GraduationCap },
  { href: "/me/card", label: "บัตรประจำตัว", icon: IdCard },
];

export function MeNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors sm:px-3 ${
              active ? "bg-white text-indigo-900" : "text-indigo-200 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4 flex-none" />
            <span className="hidden md:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
