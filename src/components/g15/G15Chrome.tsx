"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { G15_IMAGE_URL } from "@/lib/brand";
import { ArrowLeft, Settings, LogIn } from "lucide-react";

const NAV_LINKS = [
  { href: "/g15-womens-series", label: "หน้าแรก", en: "Home" },
  { href: "/g15-womens-series/matches", label: "การแข่งขันและผล", en: "Matches & Results" },
  { href: "/g15-womens-series/standings", label: "ตารางคะแนน", en: "Standings" },
  { href: "/g15-womens-series/stats", label: "สถิติ", en: "Statistics" },
  { href: "/g15-womens-series/teams", label: "ทีมที่เข้าร่วม", en: "Teams" },
  { href: "/g15-womens-series/stadium", label: "สนามแข่งขัน", en: "Stadium" },
];

// โลโก้ + ชื่อ + เมนูนำทาง + ปุ่มจัดการ รวมอยู่ในแถบเดียวแบบเว็บทัวร์นาเมนต์ทั่วไป (ไม่แยกเป็นสองแถบซ้อนกัน)
export function G15Chrome({ user }: { user: { role: string } | null }) {
  const pathname = usePathname();
  const canManage = user?.role === "ADMIN" || user?.role === "STAFF";

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-rose-950/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:h-20 sm:gap-4 sm:px-6">
        {/* โลโก้ใหญ่กว่าความสูงของแถบเอง ตั้งใจให้ล้นเส้นขอบบน-ล่างของแถบออกมา */}
        <Link href="/g15-womens-series" className="flex flex-none items-center gap-2">
          <Image
            src={G15_IMAGE_URL}
            alt="G15 Women's Football Series"
            width={140}
            height={140}
            className="h-20 w-20 object-contain drop-shadow-xl sm:h-28 sm:w-28"
          />
          <span className="hidden truncate text-sm font-bold text-white lg:inline">
            G15 Women&apos;s Football Series
          </span>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
          {NAV_LINKS.map((link) => {
            const active = link.href === "/g15-womens-series" ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-none flex-col items-center gap-0.5 border-b-2 px-2.5 py-3 transition-colors sm:px-3 ${
                  active ? "border-amber-400 text-white" : "border-transparent text-rose-300 hover:text-white"
                }`}
              >
                <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wide">{link.label}</span>
                <span className="whitespace-nowrap text-[8px] font-medium uppercase tracking-wide opacity-70">
                  {link.en}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-none items-center gap-1.5">
          {canManage ? (
            <Link
              href="/g15-womens-series/manage"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 px-2.5 py-2 text-sm font-medium text-rose-200 transition-colors hover:bg-white/10 hover:text-white sm:px-3"
            >
              <Settings className="h-4 w-4 flex-none" />
              <span className="hidden sm:inline">จัดการข้อมูล</span>
            </Link>
          ) : (
            !user && (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 px-2.5 py-2 text-sm font-medium text-rose-200 transition-colors hover:bg-white/10 hover:text-white sm:px-3"
              >
                <LogIn className="h-4 w-4 flex-none" />
                <span className="hidden sm:inline">เข้าสู่ระบบ</span>
              </Link>
            )
          )}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 px-2.5 py-2 text-sm font-medium text-rose-200 transition-colors hover:bg-white/10 hover:text-white sm:px-3"
          >
            <ArrowLeft className="h-4 w-4 flex-none" />
            <span className="hidden sm:inline">กลับหน้าแรก</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
