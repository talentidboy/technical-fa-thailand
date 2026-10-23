import { BrandLogo } from "@/components/BrandLogo";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { NewsSection } from "@/components/NewsSection";
import { COVER_URL, COACH_CENTRE_IMAGE_URL, G15_IMAGE_URL, GRASSROOTS_LOGO_URL, TALENT_ID_LOGO_URL, PLAY_AND_LEARN_LOGO_URL } from "@/lib/brand";
import {
  FileBadge,
  GraduationCap,
  IdCard,
  ArrowRight,
  LayoutGrid,
  MapPin,
  Mail,
  Phone,
  LogOut,
  Menu,
  ChevronDown,
  UserCog,
  Megaphone,
  Database,
  Clock,
  Target,
  Calendar,
  Sprout,
  Trophy,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

const menuLinks = [
  { href: "/", label: "หน้าหลัก" },
  { href: "/#categories", label: "หมวดงานเทคนิค" },
  { href: "/#news", label: "ข่าวประกาศ" },
  { href: "/courses", label: "หลักสูตรอบรมผู้ฝึกสอน" },
  { href: "/#contact", label: "ติดต่อเรา" },
];

const categories = [
  {
    title: "ศูนย์อบรมผู้ฝึกสอนฟุตบอล",
    subtitle: "ระบบจัดการข้อมูลผู้ฝึกสอนฟุตบอล ใบอนุญาต AFC และวิทยากร",
    href: "/dashboard",
    image: COACH_CENTRE_IMAGE_URL as string | null,
    badgeImage: null as string | null,
    icon: GraduationCap,
    features: [
      { icon: FileBadge, label: "ใบอนุญาตผู้ฝึกสอน AFC" },
      { icon: GraduationCap, label: "ทำเนียบวิทยากร" },
      { icon: IdCard, label: "บัตรประจำตัวดิจิทัล" },
    ],
    comingSoon: false,
    public: false,
    // ผู้ฝึกสอนที่ยังไม่ล็อกอินให้ไปหน้าทางเข้าเฉพาะโค้ชก่อน (เลือกเข้าสู่ระบบ/สมัครสมาชิก) แทนที่จะเด้งไป /login ตรงๆ
    // แอดมิน/เจ้าหน้าที่ที่ล็อกอินแล้วยังคงเข้า href ปกติ (/dashboard) เหมือนเดิม ไม่กระทบ
    loggedOutHref: "/coach-center",
    accent: "from-indigo-700 via-indigo-800 to-indigo-950",
    loggedOutLabel: "เข้าสู่ระบบ / สมัครสมาชิก",
  },
  {
    title: "FA Thailand Data Center",
    subtitle: "ศูนย์รวบรวมข้อมูลด้านการฝึกอบรมและเทคนิคของสมาคม",
    href: "/training-centre" as string | null,
    image: null as string | null,
    badgeImage: null as string | null,
    icon: Database,
    accent: "from-sky-500 via-indigo-700 to-indigo-950",
    features: [] as { icon: typeof FileBadge; label: string }[],
    comingSoon: false,
    public: false,
  },
  {
    title: "Talent ID",
    subtitle: "ศูนย์สืบค้นและคัดกรองนักฟุตบอลผู้มีความสามารถโดดเด่น",
    href: "/talent-id" as string | null,
    image: null as string | null,
    badgeImage: TALENT_ID_LOGO_URL as string | null,
    icon: Target,
    accent: "from-amber-400 via-amber-600 to-indigo-950",
    features: [] as { icon: typeof FileBadge; label: string }[],
    comingSoon: false,
    public: false,
  },
  {
    title: "Grassroots Football",
    subtitle: "โครงการฟุตบอลรากหญ้า ปลูกฝังและพัฒนาเยาวชนตั้งแต่ระดับพื้นฐาน",
    href: "/grassroots-football" as string | null,
    image: null as string | null,
    badgeImage: GRASSROOTS_LOGO_URL as string | null,
    icon: Sprout,
    accent: "from-emerald-400 via-emerald-700 to-indigo-950",
    features: [] as { icon: typeof FileBadge; label: string }[],
    comingSoon: false,
    public: false,
  },
  {
    title: "G15 Women's Football Series 2026",
    subtitle: "เวทีการแข่งขันฟุตบอลหญิงรุ่นอายุไม่เกิน 15 ปี",
    href: "/g15-womens-series" as string | null,
    // ไม่ใช้ภาพโลโก้เป็นพื้นหลังการ์ด (object-cover จะครอปเบี้ยว) — ใช้เป็นตราสัญลักษณ์ในกล่องไอคอนแทน
    image: null as string | null,
    badgeImage: G15_IMAGE_URL as string | null,
    icon: Trophy,
    accent: "from-fuchsia-500 via-g15-600 to-g15-950",
    features: [] as { icon: typeof FileBadge; label: string }[],
    comingSoon: false,
    // หน้า G15 เปิดสาธารณะไม่ต้องล็อกอิน (ดู src/proxy.ts) การ์ดนี้จึงต้องลิงก์ตรงเสมอ ไม่ใช่เด้งไป /login ก่อน
    public: true,
  },
  {
    title: "Play and Learn เพลินให้สุดกับฟุตบอล",
    subtitle: "โครงการฟุตบอลสำหรับเด็กผู้หญิงวัย 5–8 ปี นำโดย “กุ๋งกิ๋ง”",
    href: "/play-and-learn" as string | null,
    image: null as string | null,
    badgeImage: PLAY_AND_LEARN_LOGO_URL as string | null,
    icon: Sparkles,
    accent: "from-pink-400 via-rose-500 to-indigo-950",
    features: [] as { icon: typeof FileBadge; label: string }[],
    comingSoon: false,
    // แคมเปญสำหรับผู้ปกครอง/บุคคลทั่วไป เปิดสาธารณะไม่ต้องล็อกอินเช่นกัน (ดู src/proxy.ts)
    public: true,
  },
  {
    title: "Academy Licensing",
    subtitle: "ใบอนุญาตรับรองมาตรฐานอคาเดมีฟุตบอลเยาวชน ระดับ Bronze / Silver / Gold",
    href: "/academies" as string | null,
    image: null as string | null,
    badgeImage: null as string | null,
    icon: ShieldCheck,
    accent: "from-yellow-300 via-amber-500 to-indigo-950",
    features: [] as { icon: typeof FileBadge; label: string }[],
    comingSoon: false,
    // ทำเนียบอคาเดมีเปิดสาธารณะ (ดู src/proxy.ts) — แอดมินจัดการที่ /academies/manage
    public: true,
  },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user?.role === "COACH") redirect("/me");

  const isAdminOrStaff = user?.role === "ADMIN" || user?.role === "STAFF";

  const [announcements, upcomingEvents] = await Promise.all([
    prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    isAdminOrStaff
      ? prisma.event.findMany({
          where: { endDate: { gte: new Date() } },
          orderBy: { startDate: "asc" },
          take: 8,
        })
      : Promise.resolve([]),
  ]);
  const newsItems = announcements.map((a) => ({
    id: a.id,
    title: a.title,
    excerpt: a.excerpt,
    tag: a.tag,
    imageUrl: a.imageUrl,
    date: a.createdAt.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
  }));

  const roleLabel =
    user?.role === "ADMIN" ? "ผู้ดูแลระบบ" : user?.role === "STAFF" ? "เจ้าหน้าที่" : null;


  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-indigo-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-2">
            <BrandLogo tone="white" className="h-9" />
            <div>
              <p className="text-sm font-bold text-white">
                FA Thailand Technical
              </p>
              <p className="text-[11px] text-indigo-300">
                ฝ่ายเทคนิค สมาคมกีฬาฟุตบอลแห่งประเทศไทย
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Menu className="h-4 w-4" />
                เมนู
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
              </button>
              <div className="invisible absolute right-0 z-30 mt-1 max-h-80 w-56 overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
                {menuLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="block px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-white">
                    {user.email}
                  </p>
                  <p className="text-[11px] text-indigo-300">{roleLabel}</p>
                </div>
                {isAdminOrStaff && (
                  <div className="group relative">
                    <Link
                      href="/calendar"
                      aria-label="ปฏิทินกิจกรรม"
                      title="ปฏิทินกิจกรรม"
                      className="inline-flex items-center justify-center rounded-lg border border-white/15 p-2.5 text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <Calendar className="h-4 w-4" />
                    </Link>
                    <div className="invisible absolute right-0 z-30 mt-1 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
                      <div className="border-b border-slate-100 px-4 py-2.5">
                        <p className="text-xs font-semibold text-slate-500">
                          กิจกรรมใกล้ๆ นี้
                        </p>
                      </div>
                      {upcomingEvents.length === 0 ? (
                        <p className="px-4 py-6 text-center text-xs text-slate-400">
                          ไม่มีกิจกรรมที่จะถึง
                        </p>
                      ) : (
                        <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                          {upcomingEvents.map((e) => (
                            <li key={e.id} className="flex items-start gap-2.5 px-4 py-2.5">
                              <span
                                className="mt-1 h-2.5 w-2.5 flex-none rounded-sm"
                                style={{ backgroundColor: e.color }}
                              />
                              <div>
                                <p className="text-xs font-medium text-slate-900">
                                  {e.title}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {e.startDate.toLocaleDateString("th-TH", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                                  {e.endDate.getTime() !== e.startDate.getTime() &&
                                    ` - ${e.endDate.toLocaleDateString("th-TH", {
                                      day: "numeric",
                                      month: "short",
                                    })}`}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                      <Link
                        href="/calendar"
                        className="block border-t border-slate-100 px-4 py-2.5 text-center text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                      >
                        ดูปฏิทินทั้งหมด
                      </Link>
                    </div>
                  </div>
                )}
                {isAdminOrStaff && (
                  <Link
                    href="/announcements"
                    aria-label="จัดการข่าวประกาศ"
                    title="จัดการข่าวประกาศ"
                    className="inline-flex items-center justify-center rounded-lg border border-white/15 p-2.5 text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Megaphone className="h-4 w-4" />
                  </Link>
                )}
                {user.role === "ADMIN" && (
                  <Link
                    href="/users"
                    aria-label="ผู้ใช้งานระบบ"
                    title="ผู้ใช้งานระบบ"
                    className="inline-flex items-center justify-center rounded-lg border border-white/15 p-2.5 text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <UserCog className="h-4 w-4" />
                  </Link>
                )}
                <form action={logout}>
                  <button
                    type="submit"
                    aria-label="ออกจากระบบ"
                    className="inline-flex items-center justify-center rounded-lg border border-white/15 p-2.5 text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/login"
                className="whitespace-nowrap rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50"
              >
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero — ภาพอาคารสมาคมเป็นพื้นหลัง · ซ้าย: ชื่อระบบ + ปุ่มลัด · ขวา: ข่าวล่าสุด 3 รายการ */}
      <section className="relative isolate overflow-hidden bg-indigo-950">
        <Image src={COVER_URL} alt="สำนักงานสมาคมกีฬาฟุตบอลแห่งประเทศไทย" fill priority className="-z-20 object-cover" />
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-indigo-950 via-indigo-950/90 to-indigo-950/60" />
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-indigo-950 via-transparent to-transparent" />
        <div className="absolute -left-24 -top-24 -z-10 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute -right-16 top-1/3 -z-10 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl" />
        <div
          className="absolute inset-0 -z-10 opacity-[0.05]"
          style={{
            backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-600 via-amber-300 to-amber-600" />

        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-28 pt-14 sm:pt-20 lg:grid-cols-[1.25fr_1fr] lg:pb-32">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center gap-3 lg:justify-start">
              <BrandLogo tone="white" className="h-14 sm:h-16" />
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-indigo-200 backdrop-blur-sm sm:text-xs">
                สมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์
              </span>
            </div>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
              FA Thailand
              <span className="block bg-linear-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">Technical</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-indigo-200 sm:text-lg lg:mx-0">
              ศูนย์รวมระบบงานด้านเทคนิคของสมาคมกีฬาฟุตบอลแห่งประเทศไทย — ผู้ฝึกสอน การแข่งขัน และการพัฒนาเยาวชน ในที่เดียว
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link
                href="#categories"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-amber-950 shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 hover:bg-amber-300"
              >
                <LayoutGrid className="h-4 w-4" />
                ดูหมวดงานทั้งหมด
              </Link>
              <Link
                href="#news"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                <Megaphone className="h-4 w-4" />
                ข่าวประกาศ
              </Link>
            </div>

            {/* โครงการของสมาคม — ตราสัญลักษณ์เรียงเป็นแถว */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <span className="w-full text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-300/80 lg:w-auto lg:pr-1">Programs</span>
              {categories
                .filter((c) => c.badgeImage)
                .map((c) => (
                  <Link
                    key={c.title}
                    href={c.public || user ? (c.href ?? "/") : (c.loggedOutHref ?? "/login")}
                    title={c.title}
                    className="relative h-12 w-12 overflow-hidden rounded-xl bg-white p-1.5 shadow-lg ring-2 ring-white/10 transition-transform hover:-translate-y-0.5 hover:scale-105"
                  >
                    <Image src={c.badgeImage!} alt={c.title} fill sizes="48px" className="object-contain p-1" />
                  </Link>
                ))}
            </div>
          </div>

          {/* ข่าวล่าสุด */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/30 backdrop-blur-md sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-bold text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-amber-950">
                  <Megaphone className="h-4 w-4" />
                </span>
                ข่าวล่าสุด <span className="font-normal text-indigo-300">/ Latest News</span>
              </p>
              <Link href="#news" className="text-xs font-semibold text-amber-300 hover:text-amber-200">
                ทั้งหมด
              </Link>
            </div>
            {announcements.length === 0 ? (
              <p className="py-8 text-center text-sm text-indigo-300">ยังไม่มีข่าวประกาศ</p>
            ) : (
              <ul className="space-y-2.5">
                {announcements.slice(0, 3).map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/news/${a.id}`}
                      className="group flex items-center gap-3 rounded-2xl bg-white/5 p-2.5 ring-1 ring-white/5 transition-colors hover:bg-white/10"
                    >
                      <span className="relative h-14 w-20 flex-none overflow-hidden rounded-xl bg-linear-to-br from-indigo-500 to-indigo-800">
                        {a.imageUrl ? (
                          <Image src={a.imageUrl} alt="" fill sizes="80px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <Megaphone className="absolute inset-0 m-auto h-5 w-5 text-white/50" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-sm font-semibold leading-snug text-white">{a.title}</span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-indigo-300">
                          {a.tag && <span className="rounded-full bg-amber-400/15 px-1.5 text-amber-200">{a.tag}</span>}
                          {a.createdAt.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 flex-none text-indigo-300 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <svg className="absolute inset-x-0 bottom-0 block w-full text-slate-50" viewBox="0 0 1440 60" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,32 C480,72 960,0 1440,32 L1440,60 L0,60 Z" />
        </svg>
      </section>

      {/* หมวดงานเทคนิค */}
      <section id="categories" className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-6 pb-4 pt-4">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Technical Departments</p>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">หมวดงานเทคนิค</h2>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">
            {categories.length} หมวด
          </span>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const CategoryIcon = category.icon;

            const cardContent = (
              <>
                {/* แบนเนอร์สีประจำหมวด + ไอคอนจางด้านหลัง */}
                <div className={`relative h-36 overflow-hidden bg-linear-to-br ${category.accent}`}>
                  {category.image && (
                    <>
                      <Image
                        src={category.image}
                        alt={category.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-linear-to-br from-indigo-950/80 via-indigo-900/50 to-indigo-950/20" />
                    </>
                  )}
                  <div
                    className="absolute inset-0 opacity-[0.08]"
                    style={{
                      backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
                      backgroundSize: "22px 22px",
                    }}
                  />
                  <CategoryIcon className="absolute -right-5 -top-5 h-32 w-32 text-white/10 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110" />
                  {category.comingSoon && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white ring-1 ring-white/30 backdrop-blur-sm">
                      <Clock className="h-3 w-3" />
                      เร็วๆ นี้
                    </span>
                  )}
                </div>

                {/* ตราสัญลักษณ์ลอยทับขอบแบนเนอร์ */}
                <div
                  className={`absolute left-6 top-24 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl shadow-xl ring-4 ring-white transition-transform duration-300 group-hover:-translate-y-1 ${
                    category.badgeImage ? "bg-white" : "bg-linear-to-br from-indigo-800 to-indigo-950"
                  }`}
                >
                  {category.badgeImage ? (
                    <Image src={category.badgeImage} alt={category.title} fill sizes="80px" className="object-contain p-2" />
                  ) : (
                    <CategoryIcon className="h-9 w-9 text-amber-300" />
                  )}
                </div>

                <div className="flex flex-1 flex-col px-6 pb-6 pt-14">
                  <h3 className="text-lg font-extrabold leading-snug text-slate-900">{category.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{category.subtitle}</p>

                  {category.features.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {category.features.map(({ icon: Icon, label }) => (
                        <span key={label} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                          <Icon className="h-3 w-3" />
                          {label}
                        </span>
                      ))}
                    </div>
                  )}

                  {category.comingSoon ? (
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      อยู่ระหว่างการพัฒนา
                    </span>
                  ) : (
                    <span className="mt-auto flex items-center justify-between pt-5">
                      <span className="text-sm font-bold text-indigo-700">
                        {category.public || user ? "เข้าใช้งาน" : (category.loggedOutLabel ?? "เข้าสู่ระบบเพื่อใช้งาน")}
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 transition-all group-hover:bg-indigo-700 group-hover:text-white">
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </span>
                  )}
                </div>
              </>
            );

            if (category.comingSoon || !category.href) {
              return (
                <div key={category.title} className="group relative flex flex-col overflow-hidden rounded-3xl bg-white opacity-90 shadow-sm ring-1 ring-slate-200">
                  {cardContent}
                </div>
              );
            }

            return (
              <Link
                key={category.title}
                href={category.public || user ? category.href : (category.loggedOutHref ?? "/login")}
                className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-lg shadow-indigo-950/5 ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-950/15 hover:ring-indigo-200"
              >
                {cardContent}
              </Link>
            );
          })}
        </div>
      </section>

      <NewsSection items={newsItems} />

      {/* Footer */}
      <footer id="contact" className="relative bg-indigo-950 text-indigo-200">
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-600 via-amber-400 to-amber-600" />
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-wrap items-start justify-between gap-10">
            <div className="flex items-center gap-3">
              <BrandLogo tone="white" className="h-10" />
              <div>
                <p className="font-bold text-white">FA Thailand Technical</p>
                <p className="mt-0.5 text-sm text-indigo-300">
                  สมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2.5 text-sm sm:grid-cols-1">
              <p className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  <MapPin className="h-4 w-4" />
                </span>
                กรุงเทพมหานคร ประเทศไทย
              </p>
              <p className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  <Mail className="h-4 w-4" />
                </span>
                technical@fathailand.org
              </p>
              <p className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  <Phone className="h-4 w-4" />
                </span>
                02-000-0000
              </p>
            </div>
          </div>
          <p className="mt-10 border-t border-white/10 pt-6 text-xs text-indigo-400">
            © {new Date().getFullYear()} FA Thailand Technical
          </p>
        </div>
      </footer>
    </div>
  );
}
