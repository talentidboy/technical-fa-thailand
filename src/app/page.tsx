import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ACADEMY_LEVELS, showPublicly, type AcademyLevel } from "@/lib/academy";
import { loadAcademies } from "@/lib/academy-data";
import { COVER_URL } from "@/lib/brand";
import { coreProgramSteps } from "@/lib/coach-program";
import { ROUND_FINAL, matchWinnerId } from "@/lib/g15-stage";
import { BrandLogo } from "@/components/BrandLogo";
import { NewsSection } from "@/components/NewsSection";
import { ProvinceMap, provinceName } from "@/components/ProvinceMap";
import { HomeHeader } from "@/components/home/HomeHeader";
import { DEPARTMENTS, departmentHref, type Department } from "@/components/home/departments";
import { AcademyShowcase, CoachShowcase, DataShowcase, G15Showcase, GrassrootsShowcase, PlayShowcase, TalentShowcase, type G15Board } from "@/components/home/DepartmentShowcases";
import { ShowcaseCarousel } from "@/components/home/ShowcaseCarousel";
import tile from "@/components/home/showcase.module.css";
import { GRASSROOTS_YEAR, grassrootsPlayers } from "@/lib/grassroots-data";
import { CountUp } from "@/components/play-and-learn/CountUp";
import { Reveal } from "@/components/g15/Reveal";
import { display } from "@/components/fonts";
import styles from "./home.module.css";
import { ArrowRight, ArrowUpRight, GraduationCap, IdCard, Lock, Mail, MapPin, ShieldCheck, Sparkles, Trophy } from "lucide-react";

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

// สีเน้นของแต่ละหมวดในสารบัญ (สีเดียวกับจุดเน้นในแผงของหมวดนั้น)
const ACCENT: Record<string, string> = {
  coach: "#c99b3b",
  g15: "#6a45c4",
  academy: "#b0662b",
  play: "#db2777",
  grassroots: "#16a34a",
  talent: "#eab308",
  data: "#1d4ed8",
};

// การ์ดหมวดงานแบบ bento: ขนาดตามความสำคัญ (4 คอลัมน์ × 3 แถว)
const SPAN: Record<string, string> = {
  coach: "lg:col-span-2 lg:row-span-2",
  g15: "lg:col-span-2",
  data: "lg:col-span-2",
};

// นัด G15 ที่นาฬิกาเกมกำลังเดิน
const LIVE_PHASES = ["FIRST_HALF", "HALF_TIME", "SECOND_HALF", "PENALTIES"];
const TEAMS = { homeTeam: { select: { name: true, logoUrl: true, groupName: true } }, awayTeam: { select: { name: true, logoUrl: true, groupName: true } } };

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user?.role === "COACH") redirect("/me");
  const isStaff = user?.role === "ADMIN" || user?.role === "STAFF";
  const now = new Date();

  const [announcements, events, coachTotal, licensedCoaches, academies, g15Teams, levelCounts, byProvince, sessions, g15Live, g15Last, g15Next, g15Played, articles, articleAreas] = await Promise.all([
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
    prisma.g15Match.findFirst({ where: { clockPhase: { in: LIVE_PHASES } }, include: TEAMS, orderBy: { matchDate: "desc" } }),
    prisma.g15Match.findFirst({ where: { status: "FINISHED" }, include: TEAMS, orderBy: [{ matchDate: { sort: "desc", nulls: "last" } }, { id: "desc" }] }),
    prisma.g15Match.findFirst({ where: { status: "SCHEDULED", matchDate: { gte: now } }, include: TEAMS, orderBy: { matchDate: "asc" } }),
    prisma.g15Match.count({ where: { status: "FINISHED" } }),
    prisma.trainingArticle.findMany({ select: { id: true, title: true, area: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.trainingArticle.groupBy({ by: ["area"], _count: { _all: true } }),
  ]);
  const publicAcademies = academies.filter((a) => showPublicly(a.active, a.state));
  const academyCount = publicAcademies.length;
  const academyByLevel = Object.fromEntries(ACADEMY_LEVELS.map((lv) => [lv, publicAcademies.filter((a) => a.level === lv).length])) as Record<AcademyLevel, number>;
  const loggedIn = !!user;
  const levels = CORE_LEVELS.map((level, i) => ({ level, n: levelCounts[i], title: coreProgramSteps.find((s) => s.level === level)?.title }));
  const levelTotal = levelCounts.reduce((a, b) => a + b, 0);
  const dept = Object.fromEntries(DEPARTMENTS.map((d) => [d.key, { href: departmentHref(d, loggedIn), locked: !d.public && !loggedIn }]));

  const articleTotal = articleAreas.reduce((n, a) => n + a._count._all, 0);
  // ตัวเลขเด่นบนการ์ดหมวดงาน
  const tileExtra: Record<string, string> = {
    coach: `${coachTotal.toLocaleString("en-US")} ผู้ฝึกสอนในระบบ`,
    g15: `${g15Teams} ทีม · ${g15Played} นัด`,
    academy: `${academyCount} อคาเดมีที่ได้รับการรับรอง`,
    play: "เด็กหญิงวัย 5–8 ปี",
    grassroots: `${grassrootsPlayers.total.toLocaleString("en-US")} นักฟุตบอล ปี ${GRASSROOTS_YEAR}`,
    talent: "สำหรับเจ้าหน้าที่",
    data: articleTotal ? `${articleTotal} บทความ` : "The Game · Practice · Environment",
  };

  // กระดานสกอร์ G15: กำลังแข่ง → แชมป์ (จบนัดชิงแล้ว) → นัดถัดไป → ผลล่าสุด
  const featured = g15Live ?? (g15Last?.round === ROUND_FINAL ? g15Last : (g15Next ?? g15Last));
  const g15Board: G15Board = featured
    ? {
        mode: featured === g15Live ? "live" : featured.status === "FINISHED" ? (featured.round === ROUND_FINAL ? "champion" : "result") : "next",
        id: featured.id,
        round: featured.round,
        date: featured.matchDate,
        home: featured.homeTeam,
        away: featured.awayTeam,
        homeScore: featured.homeScore,
        awayScore: featured.awayScore,
        homePenalty: featured.homePenalty,
        awayPenalty: featured.awayPenalty,
        champion: (() => {
          const w = matchWinnerId(featured);
          return w === featured.homeTeamId ? featured.homeTeam : w === featured.awayTeamId ? featured.awayTeam : null;
        })(),
      }
    : { mode: "none" };
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

      {/* ===== ฮีโร่: หัวข้อ + ทางลัด (ซ้าย) · ภาพหมวดงานเลื่อนสวนทางสองแถว (ขวา) ===== */}
      <section className="relative isolate overflow-hidden bg-[#04223a] pb-36 pt-28 text-white lg:flex lg:min-h-[100svh] lg:items-center lg:pb-40 lg:pt-24">
        <Image src={COVER_URL} alt="สำนักงานสมาคมกีฬาฟุตบอลแห่งประเทศไทย" fill priority sizes="100vw" className={`-z-20 object-cover opacity-40 ${styles.kenburns}`} />
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-[#04223a] via-[#04223a]/90 to-[#04223a]/60" />
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-[#04223a] via-transparent to-[#04223a]/70" />

        <div className="mx-auto grid w-full max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:items-center lg:gap-16">
          <div>
            <p className={`${styles.rise} flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300`}>
              <span className="h-px w-10 bg-amber-300" />
              FA Thailand · Technical Department
            </p>
            <h1 className={`${h} mt-6 text-[3.4rem] font-semibold leading-[0.95] sm:text-8xl xl:text-[7.5rem]`}>
              <span className={`${styles.rise} block`} style={{ animationDelay: "120ms" }}>
                FA Thailand
              </span>
              <span className={`${styles.rise} relative inline-block pb-4 text-amber-300`} style={{ animationDelay: "240ms" }}>
                Technical
                {/* เส้นพู่กันทองลากใต้คำ */}
                <svg aria-hidden viewBox="0 0 400 24" preserveAspectRatio="none" className="absolute -bottom-1 left-0 h-4 w-full sm:h-6">
                  <path d="M4 16 C 90 4, 210 4, 396 12" pathLength={1} className={styles.brush} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className={`${styles.rise} mt-7 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg`} style={{ animationDelay: "380ms" }}>
              ฝ่ายเทคนิค สมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์ — ผู้ฝึกสอน หลักสูตรอบรม อคาเดมี การพัฒนาเยาวชน และการแข่งขัน ครบในที่เดียว
            </p>
            <div className={`${styles.rise} mt-9 flex flex-wrap gap-3`} style={{ animationDelay: "480ms" }}>
              <a href="#departments" className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-7 py-4 text-sm font-semibold text-[#073c5e] shadow-[0_14px_36px_-12px_rgb(251_191_36/0.7)] transition-transform hover:-translate-y-0.5">
                สำรวจหมวดงาน
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link href="/courses" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-7 py-4 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                หลักสูตรอบรมผู้ฝึกสอน
              </Link>
            </div>

            {/* ทางลัด: วันนี้คุณมาหาอะไร */}
            <div className={`${styles.rise} mt-12`} style={{ animationDelay: "600ms" }}>
              <p className="text-xs font-semibold text-white/50">วันนี้คุณมาหาอะไร?</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {TASKS.map(({ href, icon: Icon, title }) => (
                  <li key={href}>
                    <Link href={href} className="group flex h-full items-center gap-3 rounded-xl bg-white/[0.06] px-3.5 py-3 ring-1 ring-white/10 transition-colors hover:bg-white hover:text-[#073c5e]">
                      <Icon className="h-4 w-4 flex-none text-amber-300 group-hover:text-[#073c5e]" />
                      <span className="min-w-0 flex-1 text-[13px] font-semibold leading-snug">{title}</span>
                      <ArrowRight className="h-3.5 w-3.5 flex-none opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ภาพหมวดงาน: สองแถวเลื่อนสวนทางกัน (จอใหญ่) · แถวเดียวเลื่อนแนวนอน (มือถือ) */}
          <div className={`${styles.rise} hidden lg:block`} style={{ animationDelay: "300ms" }}>
            <div className={`${styles.reel} grid h-[min(44rem,calc(100svh-9rem))] grid-cols-2 gap-4`}>
              {[DEPARTMENTS, [...DEPARTMENTS.slice(3), ...DEPARTMENTS.slice(0, 3)]].map((col, c) => (
                <div key={c} className={`${c ? styles.down : styles.up} flex flex-col gap-4`}>
                  {[...col, ...col].map((d, k) => (
                    <ReelTile key={`${d.key}-${k}`} d={d} href={dept[d.key].href} hidden={k >= col.length} />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className={`${styles.rise} ${styles.reelX} -mx-4 lg:hidden`} style={{ animationDelay: "300ms" }}>
            <div className={`${styles.across} flex w-max gap-3`}>
              {[...DEPARTMENTS, ...DEPARTMENTS].map((d, k) => (
                <div key={`${d.key}-${k}`} className="w-40 flex-none sm:w-48">
                  <ReelTile d={d} href={dept[d.key].href} hidden={k >= DEPARTMENTS.length} />
                </div>
              ))}
            </div>
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

      {/* ===== สไลด์แนะนำหมวดงาน: เลื่อนเองทีละหมวด ===== */}
      <div className="mt-16 sm:mt-20">
        <ShowcaseCarousel
          slides={[
            {
              key: "coach",
              label: "ศูนย์อบรมผู้ฝึกสอน",
              accent: ACCENT.coach,
              node: (
                <CoachShowcase
                  href={dept.coach.href}
                  locked={dept.coach.locked}
                  levels={levels}
                  total={levelTotal}
                  sessions={sessions.map((s) => ({
                    id: s.id,
                    course: s.course.title,
                    name: s.name,
                    venue: s.venue,
                    start: s.startDate,
                    daysLeft: s.applicationDeadline ? Math.ceil((s.applicationDeadline.getTime() - now.getTime()) / 86_400_000) : null,
                  }))}
                />
              ),
            },
            { key: "g15", label: "G15 Women's Series", accent: ACCENT.g15, node: <G15Showcase teams={g15Teams} played={g15Played} board={g15Board} /> },
            { key: "academy", label: "Academy Licensing", accent: ACCENT.academy, node: <AcademyShowcase total={academyCount} byLevel={academyByLevel} /> },
            { key: "play", label: "Play and Learn", accent: ACCENT.play, node: <PlayShowcase /> },
            { key: "grassroots", label: "Grassroots Football", accent: ACCENT.grassroots, node: <GrassrootsShowcase /> },
            { key: "talent", label: "Talent ID", accent: ACCENT.talent, node: <TalentShowcase href={dept.talent.href} locked={dept.talent.locked} /> },
            { key: "data", label: "Data & Articles", accent: ACCENT.data, node: <DataShowcase articles={articles} total={articleTotal} byArea={Object.fromEntries(articleAreas.map((a) => [a.area, a._count._all]))} /> },
          ]}
        />
      </div>

      {/* ===== หมวดงาน: การ์ดภาพแบบ bento (ศูนย์อบรมใหญ่สุด) ===== */}
      <section id="departments" className="scroll-mt-20 px-4 pb-20 pt-24 sm:px-6">
        <span id="categories" className="sr-only" />
        <div className="mx-auto max-w-7xl">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700">Departments</p>
              <h2 className={`${h} mt-2 text-4xl font-semibold text-[#073c5e] sm:text-5xl`}>ทุกงานเทคนิค ในที่เดียว</h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-500">{DEPARTMENTS.length} หมวดงานของฝ่ายเทคนิค — หมวดที่มีรูปกุญแจสำหรับเจ้าหน้าที่ ต้องเข้าสู่ระบบก่อนใช้งาน</p>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:auto-rows-[18.5rem] lg:grid-cols-4">
            {DEPARTMENTS.map((d, i) => (
              <Reveal key={d.key} delay={i * 70} className={`h-full lg:min-h-0 ${d.key === "coach" ? "min-h-[26rem]" : "min-h-[19rem]"} ${SPAN[d.key] ?? ""}`}>
                <DepartmentTile d={d} n={i + 1} href={dept[d.key].href} locked={dept[d.key].locked} big={d.key === "coach"} extra={tileExtra[d.key]} />
              </Reveal>
            ))}
          </div>
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

// การ์ดหมวดงาน: ภาพเต็มช่วงบนไล่กลืนลงพื้นสีประจำหมวด · โลโก้วางคร่อมรอยต่อ · ตัวอักษรอยู่บนพื้นสีทึบเสมอ (อ่านง่ายทุกการ์ด)
// ชี้แล้ว: ภาพซูมช้าๆ · เส้นสีประจำหมวดยืดออก · ปุ่มลูกศรเติมสีและหมุนชี้ขึ้น
function DepartmentTile({ d, n, href, locked, big, extra }: { d: Department; n: number; href: string; locked: boolean; big?: boolean; extra?: string }) {
  const Icon = d.icon;
  return (
    <Link
      href={href}
      style={{ "--tile": d.hex, "--accent": ACCENT[d.key] } as React.CSSProperties}
      className={`${tile.tile} group relative flex h-full flex-col overflow-hidden rounded-2xl bg-(--tile) text-white shadow-[0_24px_48px_-30px_rgb(0_0_0/0.7)] ring-1 ring-black/10 transition-transform duration-500 hover:-translate-y-1`}
    >
      <div className="relative min-h-28 flex-1 overflow-hidden">
        {d.image ? (
          <Image
            src={d.image}
            alt=""
            fill
            sizes={big ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"}
            placeholder={typeof d.image === "string" ? "empty" : "blur"}
            style={d.imagePosition ? { objectPosition: d.imagePosition } : undefined}
            className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
          />
        ) : (
          <Icon className="absolute -right-6 -top-6 h-36 w-36 text-white/10" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-(--tile) via-transparent to-black/30" />
        <span className={`${h} absolute left-4 top-4 rounded-md bg-black/55 px-2 py-0.5 text-xs font-semibold tabular-nums`}>{String(n).padStart(2, "0")}</span>
        {locked && (
          <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium">
            <Lock className="h-3 w-3" />
            เจ้าหน้าที่
          </span>
        )}
      </div>
      <div className={`relative ${big ? "px-6 pb-6 sm:px-7 sm:pb-7" : "px-5 pb-5"}`}>
        {/* โลโก้คร่อมรอยต่อภาพกับพื้นสี */}
        <span className={`absolute -top-7 flex h-14 items-center justify-center rounded-xl bg-white px-2.5 shadow-lg ring-4 ring-(--tile) ${big ? "left-6 sm:left-7" : "left-5"}`}>
          {d.logo ? (
            <Image src={d.logo} alt="" className="h-8 w-auto" />
          ) : d.badge ? (
            <span className="relative h-10 w-10">
              <Image src={d.badge} alt="" fill sizes="40px" className="object-contain" />
            </span>
          ) : (
            <Icon className="h-6 w-6" style={{ color: d.hex }} />
          )}
        </span>
        <div className="pt-10">
          <span className={`${tile.tileBar} block h-1 rounded-full bg-(--accent)`} />
          <h3 className={`${h} mt-3 font-semibold leading-tight ${big ? "text-3xl sm:text-4xl" : "text-xl"}`}>{d.title}</h3>
          <p className={`mt-1 text-white/75 ${big ? "max-w-md text-sm sm:text-base" : "line-clamp-2 text-[13px] leading-snug"}`}>{d.subtitle}</p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="min-w-0 truncate text-xs font-semibold text-white/65">{locked ? (d.guestHref ? "เข้าสู่ระบบ / สมัครสมาชิก" : "เข้าสู่ระบบเพื่อใช้งาน") : extra}</span>
            <span className={`${tile.tileGo} flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/10 ring-1 ring-white/25`}>
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ภาพหมวดงานในฮีโร่: รูปเต็มกรอบ + ชื่อหมวดบนแถบสีประจำหมวด · ชุดที่ซ้ำไว้ให้เลื่อนวนต่อเนื่อง ซ่อนจากโปรแกรมอ่านหน้าจอ/คีย์บอร์ด
function ReelTile({ d, href, hidden }: { d: Department; href: string; hidden?: boolean }) {
  return (
    <Link
      href={href}
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : undefined}
      style={{ "--tile": d.hex } as React.CSSProperties}
      className="group relative block aspect-4/5 flex-none overflow-hidden rounded-2xl bg-(--tile) ring-1 ring-white/10"
    >
      {d.image && (
        <Image
          src={d.image}
          alt=""
          fill
          sizes="(min-width: 1024px) 15rem, 12rem"
          placeholder={typeof d.image === "string" ? "empty" : "blur"}
          style={d.imagePosition ? { objectPosition: d.imagePosition } : undefined}
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
      )}
      <span className="absolute inset-0 bg-linear-to-t from-(--tile) via-(--tile)/20 to-transparent" />
      <span className="absolute inset-x-0 bottom-0 p-4">
        <span className="block h-1 w-8 rounded-full bg-amber-300 transition-[width] duration-300 group-hover:w-14" />
        <span className={`${h} mt-2 block text-base font-semibold leading-tight text-white`}>{d.title}</span>
      </span>
    </Link>
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
