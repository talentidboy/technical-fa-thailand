import { BrandLogo } from "@/components/BrandLogo";
import Link from "next/link";
import { AcademyLogo } from "@/components/SectionLogos";
import { HomeButton } from "@/components/HomeButton";
import { academySerif } from "@/components/typefaces/academy";

type Viewer = "admin" | "academy" | "staff-other" | "guest";

const NAV = [
  { href: "/academies#map", label: "แผนที่" },
  { href: "/academies#directory", label: "ทำเนียบ" },
  { href: "/academies#levels", label: "มาตรฐาน 3 ระดับ" },
];

const goldButton = "rounded-lg bg-[#d9b45a] px-4 py-2 text-sm font-semibold text-[#071530] transition-colors hover:bg-[#e4c272]";

// หัวเว็บของโหมด Academy Licensing (แยกจากหน้า Home): แถบสมาคมฯ ด้านบน + แถบหลักสีกรมท่าเข้มติดขอบจอ · ปุ่มกลับหน้าแรกมุมขวาสุด
export function PublicHeader({ viewer, manageHref = "/academies/manage" }: { viewer: Viewer; manageHref?: string }) {
  return (
    <>
      <div className="bg-[#050f24] text-[11px] text-white/60">
        <div className="mx-auto flex h-8 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <span className="truncate">สมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์ · ฝ่ายเทคนิค</span>
          <span className="hidden flex-none font-semibold uppercase tracking-[0.2em] text-[#d9b45a] sm:inline">FIFA Grow Together</span>
        </div>
      </div>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-(--night) text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link href="/academies" className="flex flex-none items-center gap-3">
            <BrandLogo tone="white" className="h-9" />
            <span className="h-7 w-px bg-white/20" />
            <AcademyLogo className="h-10" />
          </Link>
          <nav aria-label="เมนูหลัก" className="hidden flex-1 items-center gap-6 text-sm font-medium text-white/70 md:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="border-b-2 border-transparent py-1 transition-colors hover:border-[#d9b45a] hover:text-white">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex flex-none items-center gap-2">
            {viewer === "admin" ? (
              <Link href={manageHref} className={goldButton}>
                จัดการข้อมูล
              </Link>
            ) : viewer === "academy" ? (
              <Link href="/academies/portal" className={goldButton}>
                พอร์ทัลของฉัน
              </Link>
            ) : viewer === "guest" ? (
              <>
                <Link href="/academies/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-white hover:bg-white/10">
                  เข้าสู่ระบบ
                </Link>
                <Link href="/academies/register" className={`${goldButton} hidden sm:inline-block`}>
                  สมัครอคาเดมี
                </Link>
              </>
            ) : null}
            <HomeButton tone="dark" />
          </div>
        </div>
      </header>
    </>
  );
}

export function PublicFooter() {
  return (
    <footer className="bg-(--night) text-white/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <BrandLogo tone="white" className="h-10" />
            <span className="h-8 w-px bg-white/20" />
            <AcademyLogo className="h-10" />
          </div>
          <p className={`${academySerif.className} mt-5 text-xl font-semibold text-white`}>FAT Academy Licensing</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed">
            ใบอนุญาตรับรองมาตรฐานศูนย์ฝึกเยาวชนและอคาเดมีฟุตบอล โดยสมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์ ร่วมกับ FIFA (Grow Together) ตามเกณฑ์ AFC
          </p>
        </div>
        <div className="text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d9b45a]">For academies</p>
          <ul className="mt-3 space-y-2">
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d9b45a]">Explore</p>
          <ul className="mt-3 space-y-2">
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
      <p className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/45">
        ข้อมูลจากทะเบียน Academy Licensing ของสมาคมฯ · หากข้อมูลไม่ถูกต้องโปรดติดต่อฝ่ายเทคนิค
      </p>
    </footer>
  );
}
