import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { NewsSection } from "@/components/NewsSection";
import {
  LOGO_URL,
  COVER_URL,
  COACH_CENTRE_IMAGE_URL,
  G15_IMAGE_URL,
  GRASSROOTS_LOGO_URL,
  TALENT_ID_LOGO_URL,
} from "@/lib/brand";
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
  },
  {
    title: "Training Centre",
    subtitle: "ศูนย์รวบรวมข้อมูลด้านการฝึกอบรมและเทคนิคของสมาคม",
    href: "/training-centre" as string | null,
    image: null as string | null,
    badgeImage: null as string | null,
    icon: Database,
    features: [] as { icon: typeof FileBadge; label: string }[],
    comingSoon: false,
  },
  {
    title: "Talent ID",
    subtitle: "ศูนย์สืบค้นและคัดกรองนักฟุตบอลผู้มีความสามารถโดดเด่น",
    href: "/talent-id" as string | null,
    image: null as string | null,
    badgeImage: TALENT_ID_LOGO_URL as string | null,
    icon: Target,
    features: [] as { icon: typeof FileBadge; label: string }[],
    comingSoon: false,
  },
  {
    title: "Grassroots Football",
    subtitle: "โครงการฟุตบอลรากหญ้า ปลูกฝังและพัฒนาเยาวชนตั้งแต่ระดับพื้นฐาน",
    href: "/grassroots-football" as string | null,
    image: null as string | null,
    badgeImage: GRASSROOTS_LOGO_URL as string | null,
    icon: Sprout,
    features: [] as { icon: typeof FileBadge; label: string }[],
    comingSoon: false,
  },
  {
    title: "G15 Women's Football Series 2026",
    subtitle: "เวทีการแข่งขันฟุตบอลหญิงรุ่นอายุไม่เกิน 15 ปี",
    href: "/g15-womens-series" as string | null,
    // ไม่ใช้ภาพโลโก้เป็นพื้นหลังการ์ด (object-cover จะครอปเบี้ยว) — ใช้เป็นตราสัญลักษณ์ในกล่องไอคอนแทน
    image: null as string | null,
    badgeImage: G15_IMAGE_URL as string | null,
    icon: Trophy,
    features: [] as { icon: typeof FileBadge; label: string }[],
    comingSoon: false,
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

  const latestAnnouncement = announcements[0] ?? null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-indigo-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-2">
            <Image
              src={LOGO_URL}
              alt="FA Thailand"
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-cover"
            />
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
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50"
              >
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero — neutral, no category-specific content */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={COVER_URL}
            alt="สำนักงานสมาคมกีฬาฟุตบอลแห่งประเทศไทย"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-b from-indigo-950/90 via-indigo-950/80 to-indigo-950/95" />
        </div>
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute -right-16 top-1/4 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-600 via-amber-400 to-amber-600" />

        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <Image
            src={LOGO_URL}
            alt="FA Thailand"
            width={72}
            height={72}
            className="mx-auto h-18 w-18 rounded-2xl shadow-lg shadow-black/30 ring-2 ring-white/20"
          />
          <span className="mx-auto mt-6 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-indigo-200 backdrop-blur-sm">
            สมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            FA Thailand Technical
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-indigo-200">
            ศูนย์รวมระบบงานด้านเทคนิคของสมาคมกีฬาฟุตบอลแห่งประเทศไทย
            เลือกหมวดที่ต้องการเข้าใช้งานด้านล่าง
          </p>

          {latestAnnouncement && (
            <Link
              href={`/news/${latestAnnouncement.id}`}
              className="group mx-auto mt-6 flex max-w-md items-center gap-2.5 rounded-full border border-amber-400/30 bg-amber-400/10 py-2 pl-2 pr-4 text-left backdrop-blur-sm transition-colors hover:bg-amber-400/20"
            >
              <span className="inline-flex flex-none items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-amber-950">
                <Megaphone className="h-3 w-3" />
                ข่าวล่าสุด
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-amber-100 sm:text-sm">
                {latestAnnouncement.title}
              </span>
              <ArrowRight className="h-3.5 w-3.5 flex-none text-amber-200 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}

          <Link
            href="#categories"
            className="mt-8 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300 transition-colors hover:text-white"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            ดูหมวดงานทั้งหมด
            <ChevronDown className="h-3.5 w-3.5" />
          </Link>
        </div>

        <svg
          className="relative block w-full text-slate-50"
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
        >
          <path fill="currentColor" d="M0,32 C480,72 960,0 1440,32 L1440,60 L0,60 Z" />
        </svg>
      </section>

      {/* Categories */}
      <section id="categories" className="mx-auto -mt-6 max-w-6xl px-6 pb-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <LayoutGrid className="h-4 w-4" />
            หมวดงานเทคนิคทั้งหมด
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
            {categories.length} หมวด
          </span>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const CategoryIcon = category.icon;

            const cardContent = (
              <>
                <div className="relative flex h-36 items-center justify-center overflow-hidden">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className={`object-cover ${
                        category.comingSoon
                          ? ""
                          : "transition-transform duration-300 group-hover:scale-105"
                      }`}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-indigo-700 via-indigo-800 to-indigo-950" />
                  )}
                  <div className="absolute inset-0 bg-linear-to-br from-indigo-950/85 via-indigo-900/55 to-indigo-950/30" />
                  <div
                    className={`relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-110 ${
                      category.badgeImage ? "bg-white p-2" : "bg-white/10 ring-1 ring-white/30 backdrop-blur-sm"
                    }`}
                  >
                    {category.badgeImage ? (
                      <Image src={category.badgeImage} alt={category.title} fill sizes="64px" className="object-contain" />
                    ) : (
                      <CategoryIcon className="h-8 w-8 text-amber-300" />
                    )}
                  </div>
                  {category.comingSoon && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white ring-1 ring-white/30 backdrop-blur-sm">
                      <Clock className="h-3 w-3" />
                      เร็วๆ นี้
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <h2 className="font-bold text-slate-900">
                    {category.title}
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-500">
                    {category.subtitle}
                  </p>

                  {category.features.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {category.features.map(({ icon: Icon, label }) => (
                        <span
                          key={label}
                          className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
                        >
                          <Icon className="h-3 w-3" />
                          {label}
                        </span>
                      ))}
                    </div>
                  )}

                  {category.comingSoon ? (
                    <span className="mt-5 inline-flex items-center gap-1.5 border-t border-slate-100 pt-4 text-sm font-medium text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      อยู่ระหว่างการพัฒนา
                    </span>
                  ) : (
                    <span className="mt-5 inline-flex items-center gap-1.5 border-t border-slate-100 pt-4 text-sm font-medium text-indigo-600 group-hover:gap-2.5">
                      {user ? "เข้าใช้งาน" : "เข้าสู่ระบบเพื่อใช้งาน"}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  )}
                </div>
              </>
            );

            if (category.comingSoon || !category.href) {
              return (
                <div
                  key={category.title}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white opacity-90 shadow-sm"
                >
                  {cardContent}
                </div>
              );
            }

            return (
              <Link
                key={category.title}
                href={user ? category.href : "/login"}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-indigo-900/10 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-900/15"
              >
                {cardContent}
              </Link>
            );
          })}

          {/* placeholder for future categories */}
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white/60 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-slate-400">
              หมวดงานเทคนิคอื่นๆ เร็วๆ นี้
            </p>
          </div>
        </div>
      </section>

      <NewsSection items={newsItems} />

      {/* Footer */}
      <footer id="contact" className="relative bg-indigo-950 text-indigo-200">
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-600 via-amber-400 to-amber-600" />
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-wrap items-start justify-between gap-10">
            <div className="flex items-center gap-3">
              <Image
                src={LOGO_URL}
                alt="FA Thailand"
                width={40}
                height={40}
                className="h-10 w-10 rounded-lg object-cover"
              />
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
