import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { showPublicly } from "@/lib/academy";
import { loadAcademies } from "@/lib/academy-data";
import { COVER_URL, PLAY_AND_LEARN_PASSPORT_URLS } from "@/lib/brand";
import { coreProgramSteps } from "@/lib/coach-program";
import { GRASSROOTS_YEAR, grassrootsPlayers } from "@/lib/grassroots-data";
import { BrandLogo } from "@/components/BrandLogo";
import { NewsSection } from "@/components/NewsSection";
import { ProvinceMap, provinceName } from "@/components/ProvinceMap";
import { levelTone } from "@/components/coach/CoachUi";
import { HomeHeader } from "@/components/home/HomeHeader";
import { DEPARTMENTS, departmentHref, type Department } from "@/components/home/departments";
import { CountUp } from "@/components/play-and-learn/CountUp";
import { Reveal } from "@/components/g15/Reveal";
import { display } from "@/components/fonts";
import styles from "./home.module.css";
import { ArrowRight, ArrowUpRight, CalendarClock, GraduationCap, IdCard, Lock, Mail, MapPin, ShieldCheck, Sparkles, Trophy } from "lucide-react";

const h = display.className;
const TZ = { timeZone: "Asia/Bangkok" } as const;
const day = (d: Date) => d.toLocaleDateString("th-TH", { ...TZ, day: "numeric", month: "short", year: "2-digit" });

// ทางลัดตามสิ่งที่ผู้ใช้มาหา (คนทั่วไป / ผู้ฝึกสอน / ผู้ปกครอง / อคาเดมี)
const TASKS = [
  { href: "/courses", icon: GraduationCap, title: "สมัครอบรมหลักสูตรผู้ฝึกสอน", desc: "AFC C · B · A · Pro และหลักสูตรอื่น" },
  { href: "/coach-center", icon: IdCard, title: "ผู้ฝึกสอน: เข้าสู่ระบบ / สมัครสมาชิก", desc: "ดูใบอนุญาต บัตรดิจิทัล ต่ออายุ" },
  { href: "/academies", icon: ShieldCheck, title: "ค้นหาอคาเดมีที่ได้รับการรับรอง", desc: "แผนที่อคาเดมีทั่วประเทศ" },
  { href: "/g15-womens-series", icon: Trophy, title: "ผลการแข่งขัน G15", desc: "ตาราง ผลบอล ตารางคะแนน" },
  { href: "/play-and-learn", icon: Sparkles, title: "Play and Learn สำหรับผู้ปกครอง", desc: "ฟุตบอลเด็กหญิงวัย 5–8 ปี" },
];

// ระดับใบอนุญาตหลักของ AFC (ต่ำ → สูง)
const CORE_LEVELS = ["G", "C", "B", "A", "PRO"];
// แผนที่ผู้ฝึกสอน: ค่าขั้นต่ำของแต่ละช่วงสี (น้ำเงินสีเดียว อ่อน → เข้ม)
const COACH_BINS = [1, 10, 30, 75, 200];
const COACH_COLORS = ["#c3cee4", "#8fa3cf", "#5a76b5", "#2c4a8f", "#0b1f44"];

// การ์ดหมวดงานแบบ bento: ขนาดตามความสำคัญ
const SPAN: Record<string, string> = {
  coach: "lg:col-span-2 lg:row-span-2",
  g15: "lg:col-span-2",
  data: "lg:col-span-2",
};

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user?.role === "COACH") redirect("/me");
  const isStaff = user?.role === "ADMIN" || user?.role === "STAFF";
  const now = new Date();

  const [announcements, events, coachTotal, licensedCoaches, academies, g15Teams, levelCounts, byProvince, sessions] = await Promise.all([
    prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    isStaff ? prisma.event.findMany({ where: { endDate: { gte: now } }, orderBy: { startDate: "asc" }, take: 6 }) : Promise.resolve([]),
    prisma.coach.count(),
    prisma.coach.count({ where: { licenseRecords: { some: { OR: [{ expireDate: null }, { expireDate: { gte: now } }] } } } }),
    loadAcademies(now),
    prisma.g15Team.count(),
    // ผู้ฝึกสอนตามระดับใบอนุญาตสูงสุด (มีระดับนี้ และไม่มีระดับที่สูงกว่า)
    Promise.all(
      CORE_LEVELS.map((level, i) =>
        prisma.coach.count({ where: { licenseRecords: { some: { licenseType: level }, none: { licenseType: { in: CORE_LEVELS.slice(i + 1) } } } } }),
      ),
    ),
    prisma.coach.groupBy({ by: ["provinceCode"], where: { provinceCode: { not: null } }, _count: { _all: true } }),
    prisma.courseSession.findMany({
      where: { status: "OPEN", OR: [{ applicationDeadline: null }, { applicationDeadline: { gte: now } }] },
      include: { course: { select: { title: true } } },
      orderBy: [{ startDate: { sort: "asc", nulls: "last" } }, { id: "asc" }],
      take: 4,
    }),
  ]);
  const academyCount = academies.filter((a) => showPublicly(a.active, a.state)).length;
  const loggedIn = !!user;
  const levels = CORE_LEVELS.map((level, i) => ({ level, n: levelCounts[i], step: coreProgramSteps.find((s) => s.level === level) }));
  const levelTotal = levelCounts.reduce((a, b) => a + b, 0);
  const provinceValues = Object.fromEntries(byProvince.map((r) => [Number(r.provinceCode), r._count._all]));
  const mappedCoaches = byProvince.reduce((n, r) => n + r._count._all, 0);
  const topProvinces = byProvince
    .map((r) => ({ code: Number(r.provinceCode), n: r._count._all }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 8)
    .map((r) => ({ ...r, name: provinceName(r.code) }));

  const headerUser = user
    ? { email: user.email, roleLabel: user.role === "ADMIN" ? "ผู้ดูแลระบบ" : "เจ้าหน้าที่", isAdmin: user.role === "ADMIN", isStaff }
    : null;
  const headerEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    color: e.color,
    when: day(e.startDate) + (e.endDate.getTime() !== e.startDate.getTime() ? ` – ${day(e.endDate)}` : ""),
  }));
  const newsItems = announcements.map((a) => ({
    id: a.id,
    title: a.title,
    excerpt: a.excerpt,
    tag: a.tag,
    imageUrl: a.imageUrl,
    date: a.createdAt.toLocaleDateString("th-TH", { ...TZ, year: "numeric", month: "long", day: "numeric" }),
  }));
  const stats = [
    { n: coachTotal, label: "ผู้ฝึกสอนที่ขึ้นทะเบียน", href: "/coach-center" },
    { n: licensedCoaches, label: "ผู้ฝึกสอนที่ใบอนุญาตยังมีผล", href: "/coach-center" },
    { n: academyCount, label: "อคาเดมีที่ได้รับการรับรอง", href: "/academies" },
    { n: g15Teams, label: "ทีมใน G15 Women's Series", href: "/g15-womens-series" },
  ];

  return (
    <div className="min-h-screen bg-[#f5f4f0] text-slate-900">
      <HomeHeader user={headerUser} events={headerEvents} />

      {/* ===== ฮีโร่: ภาพอาคารสมาคม + พันธกิจ + ทางลัด ===== */}
      <section className="relative isolate overflow-hidden bg-[#04223a] pb-36 pt-32 text-white lg:flex lg:min-h-[94svh] lg:items-center lg:pb-44">
        <Image src={COVER_URL} alt="สำนักงานสมาคมกีฬาฟุตบอลแห่งประเทศไทย" fill priority sizes="100vw" className={`-z-20 object-cover ${styles.kenburns}`} />
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-[#04223a] via-[#04223a]/85 to-[#04223a]/35" />
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-[#04223a] via-transparent to-[#04223a]/50" />

        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-end">
          <div>
            <p className={`${styles.rise} flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300`}>
              <span className="h-px w-10 bg-amber-300" />
              FA Thailand · Technical Department
            </p>
            <h1 className={`${h} ${styles.rise} mt-6 text-[3.2rem] font-semibold leading-none tracking-tight sm:text-8xl`} style={{ animationDelay: "120ms" }}>
              FA Thailand
              <br />
              <span className="text-amber-300">Technical</span>
            </h1>
            <p className={`${styles.rise} mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg`} style={{ animationDelay: "260ms" }}>
              ฝ่ายเทคนิค สมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์ — ระบบงานผู้ฝึกสอน หลักสูตรอบรม อคาเดมี การพัฒนาเยาวชน และการแข่งขัน
            </p>
            <div className={`${styles.rise} mt-9 flex flex-wrap gap-3`} style={{ animationDelay: "380ms" }}>
              <a href="#departments" className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3.5 text-sm font-semibold text-[#073c5e] transition-colors hover:bg-amber-300">
                สำรวจหมวดงาน
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link href="/courses" className="inline-flex items-center gap-2 rounded-full border border-white/35 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                หลักสูตรอบรมผู้ฝึกสอน
              </Link>
            </div>
          </div>

          <div className={`${styles.rise} overflow-hidden rounded-xl bg-white text-slate-900 shadow-2xl`} style={{ animationDelay: "450ms" }}>
            <p className="border-b border-slate-100 px-5 py-3.5 text-sm font-semibold text-slate-500">วันนี้คุณมาหาอะไร?</p>
            <ul className="divide-y divide-slate-100">
              {TASKS.map(({ href, icon: Icon, title, desc }) => (
                <li key={href}>
                  <Link href={href} className="group flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-[#f5f4f0]">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-[#073c5e]/8 text-[#073c5e] transition-colors group-hover:bg-[#073c5e] group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900">{title}</span>
                      <span className="block truncate text-xs text-slate-500">{desc}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 flex-none text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#073c5e]" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ===== ตัวเลขจริงจากระบบ ===== */}
      <section aria-label="ตัวเลขสำคัญ" className="relative z-10 -mt-20 px-4 sm:px-6">
        <div className="mx-auto grid max-w-7xl grid-cols-2 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/5 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Link key={s.label} href={s.href} className={`group border-slate-100 p-5 transition-colors hover:bg-[#f5f4f0] sm:p-7 ${i % 2 ? "border-l" : ""} ${i > 1 ? "border-t lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}>
              <p className={`${h} text-3xl font-semibold text-[#073c5e] sm:text-5xl`}>
                <CountUp value={s.n.toLocaleString("en-US")} />
              </p>
              <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500 sm:text-sm">
                {s.label}
                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== หมวดงาน ===== */}
      <section id="departments" className="scroll-mt-20 px-4 pb-20 pt-24 sm:px-6">
        <span id="categories" className="sr-only" />
        <div className="mx-auto max-w-7xl">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700">Departments</p>
              <h2 className={`${h} mt-2 text-4xl font-semibold text-[#073c5e] sm:text-5xl`}>ทุกงานเทคนิค ในที่เดียว</h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-500">
              {DEPARTMENTS.length} หมวดงานของฝ่ายเทคนิค — หมวดที่มีรูปกุญแจสำหรับเจ้าหน้าที่ ต้องเข้าสู่ระบบก่อนใช้งาน
            </p>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:auto-rows-[15.5rem] lg:grid-cols-4">
            {DEPARTMENTS.map((d, i) => (
              <Reveal key={d.key} delay={i * 70} className={`h-full min-h-60 lg:min-h-0 ${SPAN[d.key] ?? ""}`}>
                <DepartmentTile d={d} href={departmentHref(d, loggedIn)} locked={!d.public && !loggedIn} big={d.key === "coach"} extra={d.key === "academy" ? `${academyCount} อคาเดมีบนแผนที่` : undefined} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== เส้นทางพัฒนานักฟุตบอล ===== */}
      <section className="bg-[#073c5e] px-4 py-20 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300">Player Pathway</p>
              <h2 className={`${h} mt-2 text-4xl font-semibold sm:text-5xl`}>เส้นทางพัฒนานักฟุตบอล</h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-white/70">
              งานของฝ่ายเทคนิคครอบคลุมตั้งแต่เด็กที่เริ่มเตะฟุตบอลครั้งแรก การคัดกรองดาวรุ่น อคาเดมี จนถึงเวทีการแข่งขันเยาวชนระดับชาติ
            </p>
          </Reveal>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-xl bg-white/15 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { href: "/play-and-learn", title: "Play and Learn", age: "5–8 ปี", desc: "ฟุตบอลสำหรับเด็กหญิง เรียนรู้ผ่านการเล่นกับ “กุ๋งกิ๋ง”", stat: String(PLAY_AND_LEARN_PASSPORT_URLS.length), statLabel: "บทในพาสปอร์ตแห่งการผจญภัย" },
              { href: "/grassroots-football", title: "Grassroots", age: "6–15 ปี", desc: "ฟุตบอลรากหญ้า ปูพื้นฐานเยาวชนทั่วประเทศ", stat: grassrootsPlayers.total.toLocaleString("en-US"), statLabel: `นักฟุตบอลในโครงการปี ${GRASSROOTS_YEAR}` },
              { href: "/talent-id", title: "Talent ID", age: "13–17 ปี", desc: "สืบค้นและคัดกรองนักฟุตบอลดาวรุ่นจากทุกภูมิภาค", stat: null, statLabel: "ข้อมูลสำหรับเจ้าหน้าที่" },
              { href: "/academies", title: "Academy", age: "เยาวชน", desc: "อคาเดมีที่ผ่านมาตรฐาน FAT Bronze · Silver · Gold", stat: academyCount.toLocaleString("en-US"), statLabel: "อคาเดมีที่ได้รับการรับรอง" },
              { href: "/g15-womens-series", title: "Competition", age: "U15", desc: "เวทีการแข่งขันฟุตบอลหญิงเยาวชน G15 Women's Series", stat: g15Teams.toLocaleString("en-US"), statLabel: "ทีมที่ร่วมการแข่งขัน" },
            ].map((s, i) => (
              <li key={s.title} className="bg-[#073c5e]">
                <Reveal delay={i * 80} className="h-full">
                  <Link href={s.href} className="group flex h-full flex-col p-6 transition-colors hover:bg-white/5">
                    <span className="flex items-center justify-between text-xs text-white/50">
                      <span className={`${h} tabular-nums`}>{String(i + 1).padStart(2, "0")}</span>
                      <span>{s.age}</span>
                    </span>
                    <span className={`${h} mt-8 text-2xl font-semibold`}>{s.title}</span>
                    <span className="mt-2 text-sm leading-relaxed text-white/65">{s.desc}</span>
                    <span className="mt-auto pt-8">
                      {s.stat && <span className={`${h} block text-4xl font-semibold text-amber-300`}>{s.stat}</span>}
                      <span className="mt-1 flex items-center justify-between gap-2 text-xs text-white/55">
                        {s.statLabel}
                        <ArrowRight className="h-4 w-4 flex-none transition-transform group-hover:translate-x-1 group-hover:text-white" />
                      </span>
                    </span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ol>
          <p className="mt-6 flex items-center gap-3 text-sm text-white/60">
            <span className="h-px w-10 bg-amber-300" />
            ต่อยอดสู่ทีมชาติไทยชุดเยาวชนและชุดใหญ่
          </p>
        </div>
      </section>

      {/* ===== เส้นทางใบอนุญาตผู้ฝึกสอน + รุ่นที่เปิดรับสมัคร ===== */}
      <section id="coach-education" className="scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHead eyebrow="Coach Education" title="เส้นทางใบอนุญาตผู้ฝึกสอน AFC" href="/courses" linkLabel="หลักสูตรทั้งหมด" />
            <p className="mt-3 max-w-2xl text-sm text-slate-500">
              ผู้ฝึกสอน {levelTotal.toLocaleString("en-US")} คนในฐานข้อมูล จำแนกตามใบอนุญาตระดับสูงสุดที่ได้รับ — เริ่มจากระดับพื้นฐาน G จนถึง PRO
            </p>
            {/* สัดส่วนผู้ฝึกสอนตามระดับ */}
            <div className="mt-8 flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label="สัดส่วนผู้ฝึกสอนตามระดับใบอนุญาตสูงสุด">
              {levels.map((l) => (
                <span key={l.level} className="h-full" style={{ width: `${Math.max(0.6, (l.n / Math.max(1, levelTotal)) * 100)}%`, background: levelTone(l.level).hex }} />
              ))}
            </div>
          </Reveal>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {levels.map((l, i) => (
              <li key={l.level}>
                <Reveal delay={i * 70} className="h-full">
                  <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-5">
                    <span className="absolute inset-x-0 top-0 h-1" style={{ background: levelTone(l.level).hex }} />
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`${h} text-4xl font-semibold leading-none`} style={{ color: levelTone(l.level).hex }}>
                        {l.level}
                      </span>
                      <span className="text-[11px] text-slate-400">ขั้นที่ {i + 1}</span>
                    </div>
                    <p className="mt-3 font-semibold leading-snug text-slate-900">{l.step?.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{l.step?.ageGroup}</p>
                    {l.step && (
                      <p className="mt-2 text-xs text-slate-500">
                        {l.step.totalHours} ชม. · {l.step.days} วัน
                      </p>
                    )}
                    <p className="mt-auto border-t border-slate-100 pt-4">
                      <span className={`${h} block text-3xl font-semibold text-[#073c5e]`}>{l.n.toLocaleString("en-US")}</span>
                      <span className="text-xs text-slate-500">ผู้ฝึกสอนที่ถือระดับนี้</span>
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>

          <Reveal className="mt-12 grid grid-cols-1 gap-8 rounded-xl border border-slate-200 bg-white p-6 sm:p-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700">Open Courses</p>
              <h3 className={`${h} mt-2 text-2xl font-semibold text-[#073c5e]`}>เปิดรับสมัครอบรม</h3>
              <p className="mt-2 text-sm text-slate-500">ยังไม่มีบัญชีก็สมัครได้ ระบบสร้างบัญชีผู้ฝึกสอนให้พร้อมใบสมัคร</p>
            </div>
            {sessions.length === 0 ? (
              <div className="flex flex-col items-start justify-center gap-3 rounded-lg bg-[#f5f4f0] p-6 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-3">
                  <CalendarClock className="h-8 w-8 flex-none text-slate-400" />
                  <span>
                    <span className="block text-sm font-medium text-slate-800">ยังไม่มีรุ่นที่เปิดรับสมัครในตอนนี้</span>
                    <span className="block text-xs text-slate-500">ติดตามประกาศรุ่นใหม่ได้ที่หน้าหลักสูตรอบรมและข่าวประกาศ</span>
                  </span>
                </span>
                <Link href="/coach-center" className="inline-flex flex-none items-center gap-1 text-sm font-semibold text-[#073c5e] underline decoration-slate-300 underline-offset-4 hover:decoration-[#073c5e]">
                  ศูนย์อบรมผู้ฝึกสอน
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 border-y border-slate-100">
                {sessions.map((s) => {
                  const left = s.applicationDeadline ? Math.ceil((s.applicationDeadline.getTime() - now.getTime()) / 86_400_000) : null;
                  return (
                    <li key={s.id}>
                      <Link href={`/apply/${s.id}`} className="group flex items-center gap-4 py-4 transition-colors hover:bg-[#f5f4f0] sm:px-3">
                        <span className="flex h-14 w-14 flex-none flex-col items-center justify-center rounded-lg bg-[#073c5e] text-white">
                          {s.startDate ? (
                            <>
                              <span className={`${h} text-xl font-semibold leading-none`}>{s.startDate.toLocaleDateString("th-TH", { ...TZ, day: "numeric" })}</span>
                              <span className="text-[10px] uppercase">{s.startDate.toLocaleDateString("th-TH", { ...TZ, month: "short" })}</span>
                            </>
                          ) : (
                            <GraduationCap className="h-6 w-6" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-slate-900">{s.course.title}</span>
                          <span className="block truncate text-xs text-slate-500">
                            {s.name}
                            {s.venue && ` · ${s.venue}`}
                          </span>
                        </span>
                        {left !== null && <span className={`flex-none rounded-full px-2.5 py-1 text-[11px] font-semibold ${left <= 7 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>ปิดรับใน {left} วัน</span>}
                        <ArrowRight className="h-4 w-4 flex-none text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#073c5e]" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Reveal>
        </div>
      </section>

      {/* ===== ผู้ฝึกสอนทั่วประเทศ ===== */}
      <section className="border-y border-slate-200 bg-white px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700">Coaches Nationwide</p>
            <h2 className={`${h} mt-2 text-4xl font-semibold text-[#073c5e] sm:text-5xl`}>ผู้ฝึกสอนทั่วประเทศ</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
              จำนวนผู้ฝึกสอนตามจังหวัดที่ระบุไว้ในระบบ ({mappedCoaches.toLocaleString("en-US")} จาก {coachTotal.toLocaleString("en-US")} คน) — ข้อมูลจังหวัดจะครบขึ้นเมื่อผู้ฝึกสอนอัปเดตข้อมูลของตนเอง
            </p>
            {topProvinces.length > 0 && (
              <ol className="mt-8 space-y-3">
                {topProvinces.map((p, i) => (
                  <li key={p.code} className="grid grid-cols-[1.5rem_8rem_minmax(0,1fr)_3.5rem] items-center gap-3 text-sm">
                    <span className={`${h} text-right text-slate-400 tabular-nums`}>{i + 1}</span>
                    <span className="truncate font-medium text-slate-800">{p.name}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <span className="block h-full rounded-full bg-[#073c5e]" style={{ width: `${(p.n / topProvinces[0].n) * 100}%` }} />
                    </span>
                    <span className="text-right font-semibold tabular-nums text-slate-900">{p.n.toLocaleString("en-US")}</span>
                  </li>
                ))}
              </ol>
            )}
            <div className="mt-8 flex items-center gap-3 text-xs text-slate-500" aria-label="คำอธิบายสีแผนที่">
              <span>ผู้ฝึกสอนต่อจังหวัด</span>
              <span className="flex">
                {[{ l: "0", c: "#e6e8ee" }, ...COACH_BINS.map((b, i) => ({ l: i === COACH_BINS.length - 1 ? `${b}+` : String(b), c: COACH_COLORS[i] }))].map((b) => (
                  <span key={b.l} className="flex w-8 flex-col items-center gap-1">
                    <span className="h-2 w-full" style={{ background: b.c }} />
                    <span className="tabular-nums">{b.l}</span>
                  </span>
                ))}
              </span>
            </div>
          </Reveal>
          <Reveal delay={120} className="mx-auto w-full max-w-sm">
            <ProvinceMap values={provinceValues} bins={COACH_BINS} colors={COACH_COLORS} unit="คน" title={`แผนที่จำนวนผู้ฝึกสอนตามจังหวัด ${mappedCoaches} คน`} />
          </Reveal>
        </div>
      </section>

      <NewsSection items={newsItems} />

      {/* ===== ชวนผู้ฝึกสอน ===== */}
      <section className="px-4 pb-20 sm:px-6">
        <Reveal className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-xl bg-amber-400 p-8 sm:p-12 lg:flex-row lg:items-center">
          <div>
            <h2 className={`${h} text-3xl font-semibold leading-tight text-[#073c5e] sm:text-4xl`}>เป็นผู้ฝึกสอนฟุตบอลมาตรฐาน AFC</h2>
            <p className="mt-2 max-w-xl text-[#073c5e]/80">สมัครสมาชิกศูนย์อบรมผู้ฝึกสอน ยื่นสมัครหลักสูตร ติดตามใบอนุญาตและการต่ออายุได้ด้วยตัวเอง</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/coach-center" className="rounded-full bg-[#073c5e] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#0a4a73]">
              เข้าสู่ศูนย์อบรมผู้ฝึกสอน
            </Link>
            <Link href="/courses" className="rounded-full border border-[#073c5e]/30 px-6 py-3.5 text-sm font-semibold text-[#073c5e] hover:bg-[#073c5e]/5">
              ดูหลักสูตร
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ===== ท้ายเว็บ ===== */}
      <footer id="contact" className="bg-[#04223a] text-white/70">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <BrandLogo tone="white" className="h-14" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed">ฝ่ายเทคนิค สมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์</p>
            <p className="mt-4 flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4" />
              technical@fathailand.org
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              กรุงเทพมหานคร ประเทศไทย
            </p>
          </div>
          <FooterCol title="Departments" links={DEPARTMENTS.slice(0, 4).map((d) => ({ href: departmentHref(d, loggedIn), label: d.title }))} />
          <FooterCol
            title="Coaches"
            links={[
              { href: "/courses", label: "หลักสูตรอบรม" },
              { href: "/coach-center", label: "ศูนย์อบรมผู้ฝึกสอน" },
              { href: "/coach-center/login", label: "เข้าสู่ระบบผู้ฝึกสอน" },
            ]}
          />
          <FooterCol
            title="Explore"
            links={[
              { href: "/academies", label: "ทำเนียบอคาเดมี" },
              { href: "/g15-womens-series", label: "G15 Women's Series" },
              { href: "/#news", label: "ข่าวประกาศ" },
              { href: "/login", label: "เข้าสู่ระบบเจ้าหน้าที่" },
            ]}
          />
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto max-w-7xl px-4 py-6 text-xs text-white/45 sm:px-6">© {now.getFullYear()} FA Thailand Technical · สมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์</p>
        </div>
      </footer>
    </div>
  );
}

function DepartmentTile({ d, href, locked, big, extra }: { d: Department; href: string; locked: boolean; big?: boolean; extra?: string }) {
  const Icon = d.icon;
  return (
    <Link href={href} className={`group relative flex h-full flex-col justify-end overflow-hidden rounded-xl p-6 text-white ${d.tone}`}>
      {d.image && (
        <>
          <Image
            src={d.image}
            alt=""
            fill
            sizes={big ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"}
            placeholder={typeof d.image === "string" ? "empty" : "blur"}
            style={d.imagePosition ? { objectPosition: d.imagePosition } : undefined}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-black/10" />
        </>
      )}
      {d.art && (
        <span className="absolute -bottom-3 right-0 h-[88%] w-[46%] transition-transform duration-500 group-hover:-translate-y-1.5 group-hover:rotate-2">
          <Image src={d.art} alt="" fill sizes="(min-width: 1024px) 12vw, 45vw" className="object-contain object-bottom-right drop-shadow-xl" />
        </span>
      )}
      {!d.image && !d.art && <Icon className="absolute -right-6 -top-6 h-36 w-36 text-white/10 transition-transform duration-700 group-hover:-rotate-6 group-hover:scale-110" />}
      <div className="absolute left-6 top-6 flex items-center gap-2">
        {d.logo ? (
          <span className={`flex h-12 items-center ${d.logoBoxed ? "rounded-lg bg-white px-3 shadow" : ""}`}>
            <Image src={d.logo} alt="" className={`w-auto ${d.logoBoxed ? "h-7" : "h-12"}`} />
          </span>
        ) : d.badge ? (
          <span className="relative h-12 w-12 overflow-hidden rounded-lg bg-white shadow">
            <Image src={d.badge} alt="" fill sizes="48px" className="object-contain p-1.5" />
          </span>
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/15">
            <Icon className="h-6 w-6" />
          </span>
        )}
      </div>
      {locked && (
        <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium">
          <Lock className="h-3 w-3" />
          เจ้าหน้าที่
        </span>
      )}
      <div className={`relative ${d.art ? "max-w-[58%]" : ""}`}>
        {extra && <p className="mb-1 text-xs font-semibold text-amber-300">{extra}</p>}
        <h3 className={`${h} font-semibold leading-tight ${big ? "text-3xl sm:text-4xl" : "text-xl"}`}>{d.title}</h3>
        <p className={`mt-1.5 text-white/75 ${big ? "max-w-md text-sm sm:text-base" : "line-clamp-2 text-xs"}`}>{d.subtitle}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
          {locked ? (d.guestHref ? "เข้าสู่ระบบ / สมัครสมาชิก" : "เข้าสู่ระบบเพื่อใช้งาน") : "เข้าใช้งาน"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

function SectionHead({ eyebrow, title, href, linkLabel }: { eyebrow: string; title: string; href: string; linkLabel: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700">{eyebrow}</p>
        <h2 className={`${h} mt-2 text-3xl font-semibold text-[#073c5e]`}>{title}</h2>
      </div>
      <Link href={href} className="inline-flex flex-none items-center gap-1 text-sm font-semibold text-[#073c5e] hover:underline">
        {linkLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
