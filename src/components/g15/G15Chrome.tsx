"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { G15_IMAGE_URL } from "@/lib/brand";
import { withStage, DEFAULT_STAGE, type G15Stage } from "@/lib/g15-stage";
import { ArrowLeft, Settings, LogIn, Home, CalendarDays, Trophy, BarChart3, Users, MapPin } from "lucide-react";

const NAV_LINKS = [
  { href: "/g15-womens-series", label: "หน้าแรก", short: "หน้าแรก", en: "Home", icon: Home },
  { href: "/g15-womens-series/matches", label: "การแข่งขันและผล", short: "แข่งขัน", en: "Matches & Results", icon: CalendarDays },
  { href: "/g15-womens-series/standings", label: "ตารางคะแนน", short: "ตาราง", en: "Standings", icon: Trophy },
  { href: "/g15-womens-series/stats", label: "สถิติ", short: "สถิติ", en: "Statistics", icon: BarChart3 },
  { href: "/g15-womens-series/teams", label: "ทีมที่เข้าร่วม", short: "ทีม", en: "Teams", icon: Users },
  { href: "/g15-womens-series/stadium", label: "สนามแข่งขัน", short: "สนาม", en: "Stadium", icon: MapPin },
];

const headerButton =
  "inline-flex h-10 min-w-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 px-2.5 text-sm font-medium text-g15-200 transition-colors hover:bg-white/10 hover:text-white xl:px-3";

// โลโก้ + ชื่อ + เมนูนำทาง + ปุ่มจัดการ รวมอยู่ในแถบเดียวแบบเว็บทัวร์นาเมนต์ทั่วไป (ไม่แยกเป็นสองแถบซ้อนกัน)
// stage — รอบที่กำลังดูอยู่ ลิงก์เมนูจะพารอบนั้นติดไปด้วย (ดูรอบภูมิภาคอยู่ กดไปหน้าสถิติก็ยังเป็นรอบภูมิภาค)
// โทรศัพท์ (< md): เมนูย้ายไปเป็นแถบไอคอนติดขอบล่างจอ แบบแอปทั่วไป — ไม่ต้องปัดเมนูด้านบนหาหน้าที่ซ่อนอยู่
export function G15Chrome({ user, stage = DEFAULT_STAGE }: { user: { role: string } | null; stage?: G15Stage }) {
  const pathname = usePathname();
  const canManage = user?.role === "ADMIN" || user?.role === "STAFF";
  const isActive = (href: string) => (href === "/g15-womens-series" ? pathname === href : pathname.startsWith(href));

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-white/10 bg-g15-950/90 backdrop-blur">
        {/* ไม่ใส่ max-w-6xl ตรงนี้ (ต่างจากส่วนเนื้อหาอื่นของหน้า) ให้โลโก้/ปุ่มชิดขอบซ้าย-ขวาสุดของจอจริงๆ */}
        <div className="flex h-16 w-full items-center gap-2 px-3 sm:gap-3 sm:px-5 md:h-20">
          {/* โลโก้ใหญ่กว่าความสูงของแถบเอง ชิดขอบบนของแถบ (self-start) ให้ส่วนเกินล้นออกด้านล่างเส้นทั้งหมด
              แทนที่จะกึ่งกลางแล้วครึ่งหนึ่งโดนตัดที่ขอบบนสุดของจอ (เพราะแถบนี้คือ element แรกสุดของหน้า) */}
          <Link href={withStage("/g15-womens-series", stage)} className="flex min-w-0 flex-none items-center gap-2 self-start">
            <Image
              src={G15_IMAGE_URL}
              alt="G15 Women's Football Series"
              width={140}
              height={140}
              className="h-20 w-20 flex-none object-contain drop-shadow-xl md:h-28 md:w-28"
            />
            {/* ชื่อรายการ: โทรศัพท์มีที่ว่างเพราะเมนูไปอยู่ล่างจอ, iPad ซ่อนไว้ให้เมนูพอ, จอใหญ่โชว์อีกครั้ง */}
            <span className="mt-5 truncate text-sm font-bold leading-tight text-white md:hidden xl:mt-0 xl:inline">
              G15 Women&apos;s
              <br className="xl:hidden" /> Football Series
            </span>
          </Link>

          <nav className="no-scrollbar hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto md:flex xl:justify-start">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={withStage(link.href, stage)}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-none flex-col items-center gap-0.5 border-b-2 px-2 py-3 transition-colors lg:px-3 ${
                    active ? "border-amber-400 text-white" : "border-transparent text-g15-300 hover:text-white"
                  }`}
                >
                  <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wide">{link.label}</span>
                  <span className="whitespace-nowrap text-[10px] font-medium uppercase tracking-wide opacity-70">{link.en}</span>
                </Link>
              );
            })}
          </nav>
          <div className="flex-1 md:hidden" />

          <div className="flex flex-none items-center gap-1.5">
            {canManage ? (
              <Link href={withStage("/g15-womens-series/manage", stage)} className={headerButton} aria-label="จัดการข้อมูล">
                <Settings className="h-4 w-4 flex-none" />
                <span className="hidden xl:inline">จัดการข้อมูล</span>
              </Link>
            ) : (
              !user && (
                <Link href="/login" className={headerButton} aria-label="เข้าสู่ระบบ">
                  <LogIn className="h-4 w-4 flex-none" />
                  <span className="hidden xl:inline">เข้าสู่ระบบ</span>
                </Link>
              )
            )}
            <Link href="/" className={headerButton} aria-label="กลับหน้าแรก">
              <ArrowLeft className="h-4 w-4 flex-none" />
              <span className="hidden xl:inline">กลับหน้าแรก</span>
            </Link>
          </div>
        </div>
      </header>

      {/* แถบเมนูล่างจอสำหรับโทรศัพท์ — ทุกหน้าของ G15 มี padding ล่าง (pb-20) อยู่แล้ว เนื้อหาจึงไม่ถูกบัง */}
      <nav
        aria-label="เมนู G15"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-g15-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div className="grid grid-cols-6">
          {NAV_LINKS.map(({ href, short, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={withStage(href, stage)}
                aria-current={active ? "page" : undefined}
                className={`flex h-15 flex-col items-center justify-center gap-1 transition-colors ${
                  active ? "text-amber-300" : "text-g15-300 active:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-semibold leading-none">{short}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
