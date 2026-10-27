import { BrandLogo } from "@/components/BrandLogo";
import Link from "next/link";
import { AcademyLogo } from "@/components/SectionLogos";
import { HomeButton } from "@/components/HomeButton";
import { academyPoster } from "@/components/typefaces/academy";

type Viewer = "admin" | "academy" | "staff-other" | "guest";

const NAV = [
  { href: "/academies#map", label: "แผนที่" },
  { href: "/academies#directory", label: "ทำเนียบ" },
  { href: "/academies#levels", label: "มาตรฐาน 3 ระดับ" },
  { href: "/academies#apply", label: "ขั้นตอนการสมัคร" },
];

const yellowButton = "rounded-xl bg-(--yellow) px-4 py-2 text-sm font-bold text-(--ink) shadow-[3px_3px_0_var(--ink)] transition-transform hover:-translate-y-0.5";

// หัวเว็บของ Academy Licensing: แถบขาวติดขอบจอ · เมนูมีเส้นเหลืองใต้เมื่อชี้ · ปุ่มกลับหน้าแรกมุมขวาสุด
export function PublicHeader({ viewer, manageHref = "/academies/manage" }: { viewer: Viewer; manageHref?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-(--line) bg-white text-(--ink)">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/academies" className="flex flex-none items-center gap-3">
          <BrandLogo tone="navy" className="h-9" />
          <span className="h-7 w-px bg-(--line)" />
          <AcademyLogo className="h-9" />
        </Link>
        <nav aria-label="เมนูหลัก" className="hidden flex-1 items-center gap-1 text-sm font-semibold text-(--ink-soft) lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="group relative rounded-md px-3 py-2 transition-colors hover:text-(--ink)">
              {n.label}
              <span className="absolute inset-x-3 bottom-1 h-1 origin-left scale-x-0 rounded-full bg-(--yellow) transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex flex-none items-center gap-2">
          {viewer === "admin" ? (
            <Link href={manageHref} className={yellowButton}>
              จัดการข้อมูล
            </Link>
          ) : viewer === "academy" ? (
            <Link href="/academies/portal" className={yellowButton}>
              พอร์ทัลของฉัน
            </Link>
          ) : viewer === "guest" ? (
            <>
              <Link href="/academies/login" className="rounded-xl px-3 py-2 text-sm font-bold text-(--ink) hover:bg-(--sky-soft)">
                เข้าสู่ระบบ
              </Link>
              <Link href="/academies/register" className={`${yellowButton} hidden sm:inline-block`}>
                สมัครอคาเดมี
              </Link>
            </>
          ) : null}
          <HomeButton />
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="bg-(--ink) text-white/65">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <BrandLogo tone="white" className="h-10" />
            <span className="h-8 w-px bg-white/20" />
            <AcademyLogo className="h-10" />
          </div>
          <p className={`${academyPoster.className} mt-6 text-2xl font-bold text-white`}>
            FAT <span className="text-(--yellow)">Academy Licensing</span>
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed">
            ใบอนุญาตรับรองมาตรฐานศูนย์ฝึกเยาวชนและอคาเดมีฟุตบอล โดยสมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์ ตามเกณฑ์มาตรฐานปี 2025
          </p>
        </div>
        <div className="text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-(--yellow)">For academies</p>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link href="/academies/register" className="hover:text-white">
                สมัครและยื่นขอใบอนุญาต
              </Link>
            </li>
            <li>
              <Link href="/academies/login" className="hover:text-white">
                เข้าสู่ระบบพอร์ทัล
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-(--yellow)">Explore</p>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link href="/academies#directory" className="hover:text-white">
                ทำเนียบอคาเดมี
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:text-white">
                เว็บไซต์ฝ่ายเทคนิค
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <p className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/40">ข้อมูลจากทะเบียน Academy Licensing ของสมาคมฯ · หากข้อมูลไม่ถูกต้องโปรดติดต่อฝ่ายเทคนิค</p>
    </footer>
  );
}
