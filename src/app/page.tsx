import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ACADEMY_LEVELS, showPublicly, type AcademyLevel } from "@/lib/academy";
import { coreProgramSteps } from "@/lib/coach-program";
import { ROUND_FINAL, matchWinnerId } from "@/lib/g15-stage";
import { loadAcademies } from "@/lib/academy-data";
import { COVER_URL } from "@/lib/brand";
import { GRASSROOTS_YEAR, grassrootsPlayers } from "@/lib/grassroots-data";
import { BrandLogo } from "@/components/BrandLogo";
import { NewsSection } from "@/components/NewsSection";
import { ProvinceMap, provinceName } from "@/components/ProvinceMap";
import { HomeHeader } from "@/components/home/HomeHeader";
import { DEPARTMENTS, departmentHref, type Department } from "@/components/home/departments";
import { AcademyShowcase, CoachShowcase, DataShowcase, G15Showcase, GrassrootsShowcase, PlayShowcase, TalentShowcase, type G15Board } from "@/components/home/DepartmentShowcases";
import { ShowcaseCarousel } from "@/components/home/ShowcaseCarousel";
import { HeroUpdates } from "@/components/home/HeroUpdates";
import tile from "@/components/home/showcase.module.css";
import { CountUp } from "@/components/play-and-learn/CountUp";
import { Reveal } from "@/components/g15/Reveal";
import { display } from "@/components/fonts";
import styles from "./home.module.css";
import { ArrowDown, ArrowRight, ArrowUpRight, Lock, Mail, MapPin } from "lucide-react";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ description: "ฝ่ายเทคนิค สมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์ — พัฒนาผู้ฝึกสอน อคาเดมี และนักฟุตบอลเยาวชนไทย", path: "/" });

const h = display.className;
const TZ = { timeZone: "Asia/Bangkok" } as const;
const day = (d: Date) => d.toLocaleDateString("th-TH", { ...TZ, day: "numeric", month: "short", year: "2-digit" });

// แผนที่ผู้ฝึกสอน: ค่าขั้นต่ำของแต่ละช่วงสี (น้ำเงินสีเดียว อ่อน → เข้ม)
const COACH_BINS = [1, 10, 30, 75, 200];
const COACH_COLORS = ["#c3cee4", "#8fa3cf", "#5a76b5", "#2c4a8f", "#0b1f44"];

// สีเน้นของแต่ละหมวด (เส้นใต้ชื่อ + ปุ่มลูกศรบนการ์ด)
const ACCENT: Record<string, string> = {
  coach: "#e3bb63",
  g15: "#a78bfa",
  academy: "#d9b45a",
  play: "#f472b6",
  grassroots: "#4ade80",
  talent: "#facc15",
  data: "#60a5fa",
};

// การ์ดหมวดงานแบบ bento: ขนาดตามความสำคัญ (คอม 4 คอลัมน์ × 3 แถว · มือถือ 2 คอลัมน์ เรียงตำแหน่งแบบเดียวกัน)
const SPAN: Record<string, string> = {
  coach: "col-span-2 lg:row-span-2",
  g15: "col-span-2",
  data: "col-span-2",
};

// ระดับใบอนุญาตหลักของ AFC (ต่ำ → สูง)
const CORE_LEVELS = ["G", "C", "B", "A", "PRO"];
// นัด G15 ที่นาฬิกาเกมกำลังเดิน
const LIVE_PHASES = ["FIRST_HALF", "HALF_TIME", "SECOND_HALF", "PENALTIES"];
const TEAM = { select: { name: true, logoUrl: true, groupName: true } };
const TEAMS = { homeTeam: TEAM, awayTeam: TEAM };

// ภาพฮีโร่: อาคารสมาคมเป็นฉากหลัก แล้วภาพแต่ละหมวดค่อยๆ จางเข้าทีละภาพ (วนรอบละ 8 ภาพ × 6 วินาที)
const HERO_SLIDES = DEPARTMENTS.filter((d) => d.image);

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user?.role === "COACH") redirect("/me");
  const isStaff = user?.role === "ADMIN" || user?.role === "STAFF";
  const now = new Date();

  const [announcements, events, coachTotal, licensedCoaches, academies, g15Teams, g15Played, byProvince, articleAreas, levelCounts, sessions, g15Live, g15Last, g15Next, articles] = await Promise.all([
    prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    isStaff ? prisma.event.findMany({ where: { endDate: { gte: now } }, orderBy: { startDate: "asc" }, take: 6 }) : Promise.resolve([]),
    prisma.coach.count(),
    prisma.coach.count({ where: { licenseRecords: { some: { OR: [{ expireDate: null }, { expireDate: { gte: now } }] } } } }),
    loadAcademies(now),
    prisma.g15Team.count(),
    prisma.g15Match.count({ where: { status: "FINISHED" } }),
    prisma.coach.groupBy({ by: ["provinceCode"], where: { provinceCode: { not: null } }, _count: { _all: true } }),
    prisma.trainingArticle.groupBy({ by: ["area"], _count: { _all: true } }),
    // ผู้ฝึกสอนตามระดับใบอนุญาตสูงสุด (มีระดับนี้ และไม่มีระดับที่สูงกว่า)
    Promise.all(CORE_LEVELS.map((level, i) => prisma.coach.count({ where: { licenseRecords: { some: { licenseType: level }, none: { licenseType: { in: CORE_LEVELS.slice(i + 1) } } } } }))),
    prisma.courseSession.findMany({
      where: { status: "OPEN", OR: [{ applicationDeadline: null }, { applicationDeadline: { gte: now } }] },
      include: { course: { select: { title: true } } },
      orderBy: [{ startDate: { sort: "asc", nulls: "last" } }, { id: "asc" }],
      take: 4,
    }),
    prisma.g15Match.findFirst({ where: { clockPhase: { in: LIVE_PHASES } }, include: TEAMS, orderBy: { matchDate: "desc" } }),
    prisma.g15Match.findFirst({ where: { status: "FINISHED" }, include: TEAMS, orderBy: [{ matchDate: { sort: "desc", nulls: "last" } }, { id: "desc" }] }),
    prisma.g15Match.findFirst({ where: { status: "SCHEDULED", matchDate: { gte: now } }, include: TEAMS, orderBy: { matchDate: "asc" } }),
    prisma.trainingArticle.findMany({ select: { id: true, title: true, area: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 3 }),
  ]);
  const publicAcademies = academies.filter((a) => showPublicly(a.active, a.state));
  const academyCount = publicAcademies.length;
  const academyByLevel = Object.fromEntries(ACADEMY_LEVELS.map((lv) => [lv, publicAcademies.filter((a) => a.level === lv).length])) as Record<AcademyLevel, number>;
  const loggedIn = !!user;
  const dept = Object.fromEntries(DEPARTMENTS.map((d) => [d.key, { href: departmentHref(d, loggedIn), locked: !d.public && !loggedIn }]));
  const articleTotal = articleAreas.reduce((n, a) => n + a._count._all, 0);
  const levels = CORE_LEVELS.map((level, i) => ({ level, n: levelCounts[i], title: coreProgramSteps.find((x) => x.level === level)?.title }));
  const levelTotal = levelCounts.reduce((a, b) => a + b, 0);
  const heroSessions = sessions.map((x) => ({
    id: x.id,
    course: x.course.title,
    name: x.name,
    venue: x.venue,
    start: x.startDate,
    daysLeft: x.applicationDeadline ? Math.ceil((x.applicationDeadline.getTime() - now.getTime()) / 86_400_000) : null,
  }));

  // กระดานสกอร์ G15: กำลังแข่ง → แชมป์ (จบนัดชิงแล้ว) → นัดถัดไป → ผลล่าสุด
  const featured = g15Live ?? (g15Last?.round === ROUND_FINAL ? g15Last : (g15Next ?? g15Last));
  const winner = featured ? matchWinnerId(featured) : null;
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
        champion: winner === featured.homeTeamId ? featured.homeTeam : winner === featured.awayTeamId ? featured.awayTeam : null,
      }
    : { mode: "none" };

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

      {/* ===== ฮีโร่: ภาพเต็มจอ (อาคารสมาคม → ภาพแต่ละหมวดจางเข้าทีละภาพ) + หัวข้อใหญ่ ===== */}
      <section className="relative isolate flex min-h-[92svh] items-center overflow-hidden bg-[#04223a] pb-40 pt-28 text-white lg:min-h-[100svh]">
        <Image src={COVER_URL} alt="สำนักงานสมาคมกีฬาฟุตบอลแห่งประเทศไทย" fill priority sizes="100vw" className={`-z-30 object-cover ${styles.kenburns}`} />
        {HERO_SLIDES.map((d, k) => (
          <div key={d.key} aria-hidden className={`${styles.slide} absolute inset-0 -z-20`} style={{ animationDelay: `${(k + 1) * 6}s` }}>
            <Image src={d.image!} alt="" fill sizes="100vw" placeholder={typeof d.image === "string" ? "empty" : "blur"} style={d.imagePosition ? { objectPosition: d.imagePosition } : undefined} className="object-cover" />
          </div>
        ))}
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-[#04223a]/95 via-[#04223a]/60 to-[#04223a]/20" />
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-[#04223a] via-transparent to-[#04223a]/55" />

        {/* ซ้าย: ชื่อ + คำอธิบาย + ปุ่ม · ขวา (มือถืออยู่ใต้ปุ่ม): การ์ดอัปเดตล่าสุด */}
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-16">
          <div>
            <p className={`${styles.rise} flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300`}>
              <span className="h-px w-8 bg-amber-300" />
              FA Thailand · Technical Department
            </p>
            <h1 className={`${h} mt-5 text-[3.25rem] font-semibold leading-[0.95] sm:mt-6 sm:text-7xl xl:text-8xl`}>
              <span className={`${styles.rise} block`} style={{ animationDelay: "120ms" }}>
                FA Thailand
              </span>
              <span className={`${styles.rise} block text-amber-300`} style={{ animationDelay: "240ms" }}>
                Technical
              </span>
            </h1>
            <p className={`${styles.rise} mt-5 max-w-xl border-l-2 border-amber-300/70 pl-4 text-[15px] leading-relaxed text-white/85 sm:mt-7 sm:text-lg`} style={{ animationDelay: "360ms" }}>
              ฝ่ายเทคนิค สมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์ — พัฒนาผู้ฝึกสอน อคาเดมี และนักฟุตบอลเยาวชนไทย
            </p>
            <div className={`${styles.rise} mt-7 flex gap-2.5 sm:mt-9 sm:gap-3`} style={{ animationDelay: "480ms" }}>
              <a href="#departments" className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-lg bg-amber-400 px-4 text-[13px] font-semibold text-[#073c5e] transition-colors hover:bg-amber-300 sm:min-h-12 sm:px-7 sm:text-sm">
                สำรวจหมวดงาน
                <ArrowDown className="h-4 w-4" />
              </a>
              <Link href="/courses" className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-lg bg-white/10 px-4 text-[13px] font-semibold text-white ring-1 ring-white/30 transition-colors hover:bg-white/20 sm:min-h-12 sm:px-7 sm:text-sm">
                หลักสูตรอบรมผู้ฝึกสอน
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className={styles.rise} style={{ animationDelay: "600ms" }}>
            <HeroUpdates
              board={g15Board}
              session={heroSessions[0] ?? null}
              news={announcements[0] ? { id: announcements[0].id, title: announcements[0].title, imageUrl: announcements[0].imageUrl, date: announcements[0].createdAt } : null}
            />
          </div>
        </div>

        {/* ชื่อหมวดของภาพที่กำลังแสดง (จางเข้า-ออกพร้อมภาพ) */}
        <div aria-hidden className="absolute bottom-28 left-6 hidden text-xs text-white/60 lg:block lg:left-10">
          {HERO_SLIDES.map((d, k) => (
            <span key={d.key} className={`${styles.caption} absolute bottom-0 left-0 flex items-center gap-2 whitespace-nowrap`} style={{ animationDelay: `${(k + 1) * 6}s` }}>
              <span className="h-px w-6 bg-amber-300" />
              {d.title}
            </span>
          ))}
        </div>
      </section>

      {/* ===== ตัวเลขจริงจากระบบ ===== */}
      <section aria-label="ตัวเลขสำคัญ" className="relative z-10 -mt-20 px-4 sm:px-6">
        <div className="mx-auto grid max-w-7xl grid-cols-4 overflow-hidden rounded-2xl bg-white shadow-[0_30px_60px_-30px_rgb(4_34_58/0.45)] ring-1 ring-black/5 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Link key={s.label} href={s.href} className={`group relative border-slate-100 px-2.5 pb-3.5 pt-4 transition-colors hover:bg-[#f5f4f0] sm:p-8 ${i ? "border-l" : ""}`}>
              <span className="absolute left-2.5 top-0 h-1 w-6 rounded-b-full bg-amber-400 transition-[width] duration-300 group-hover:w-20 sm:left-8 sm:w-10" />
              <p className={`${h} text-lg font-semibold text-[#073c5e] sm:text-5xl`}>
                <CountUp value={s.n.toLocaleString("en-US")} />
              </p>
              <p className="mt-1 flex items-center gap-1 text-[11px] leading-tight text-slate-500 sm:mt-1.5 sm:text-sm">
                {s.label}
                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== สไลด์แนะนำหมวดงาน: เลื่อนเองทีละหมวด ===== */}
      <div className="mt-14 sm:mt-24">
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
                  sessions={heroSessions}
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

      {/* ===== หมวดงาน: การ์ดภาพแบบ bento — ทางเข้าหมวดงานจุดเดียวบนหน้าแรก ===== */}
      <section id="departments" className="scroll-mt-20 px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24 lg:pt-28">
        <span id="categories" className="sr-only" />
        <div className="mx-auto max-w-7xl">
          <Reveal className="flex items-end justify-between gap-4 sm:gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700">Departments</p>
              <h2 className={`${h} mt-3 whitespace-nowrap text-[1.7rem] font-semibold leading-tight text-[#073c5e] sm:text-6xl`}>
                ทุกงานเทคนิค
                <br />
                ในที่เดียว
              </h2>
            </div>
            <p className="max-w-sm text-[11px] leading-relaxed text-slate-500 sm:text-sm">
              {DEPARTMENTS.length} หมวดงานของฝ่ายเทคนิค เลือกหมวดที่ต้องการได้เลย — หมวดที่มีรูปกุญแจสำหรับเจ้าหน้าที่ ต้องเข้าสู่ระบบก่อนใช้งาน
            </p>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-5 lg:auto-rows-[19rem] lg:grid-cols-4">
            {DEPARTMENTS.map((d, i) => (
              <Reveal key={d.key} delay={i * 70} className={`h-full lg:min-h-0 ${d.key === "coach" ? "min-h-[21rem] sm:min-h-[26rem]" : "min-h-[12.5rem] sm:min-h-[19rem]"} ${SPAN[d.key] ?? ""}`}>
                <DepartmentTile d={d} n={i + 1} href={dept[d.key].href} locked={dept[d.key].locked} big={d.key === "coach"} extra={tileExtra[d.key]} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ผู้ฝึกสอนทั่วประเทศ ===== */}
      <section className="bg-white px-4 py-14 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-center gap-4 sm:gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700">Coaches Nationwide</p>
            <h2 className={`${h} mt-3 whitespace-nowrap text-xl font-semibold text-[#073c5e] sm:text-5xl`}>ผู้ฝึกสอนทั่วประเทศ</h2>
            <p className="mt-3 max-w-xl text-[11px] leading-relaxed text-slate-500 sm:mt-4 sm:text-sm">
              จำนวนผู้ฝึกสอนตามจังหวัดที่ระบุไว้ในระบบ ({mappedCoaches.toLocaleString("en-US")} จาก {coachTotal.toLocaleString("en-US")} คน) — ข้อมูลจังหวัดจะครบขึ้นเมื่อผู้ฝึกสอนอัปเดตข้อมูลของตนเอง
            </p>
            {topProvinces.length > 0 && (
              <ol className="mt-5 space-y-2 sm:mt-10 sm:space-y-3.5">
                {topProvinces.map((p, i) => (
                  <li key={p.code} className="grid grid-cols-[0.9rem_minmax(0,1fr)_2.5rem] items-center gap-2 text-xs sm:grid-cols-[1.5rem_8rem_minmax(0,1fr)_3.5rem] sm:gap-3 sm:text-sm">
                    <span className={`${h} text-right tabular-nums ${i < 3 ? "font-semibold text-amber-600" : "text-slate-400"}`}>{i + 1}</span>
                    <span className="truncate font-medium text-slate-800">{p.name}</span>
                    <span className="hidden h-2 overflow-hidden rounded-full bg-slate-100 sm:block">
                      <span className="block h-full rounded-full bg-[#073c5e]" style={{ width: `${(p.n / topProvinces[0].n) * 100}%` }} />
                    </span>
                    <span className="text-right font-semibold tabular-nums text-slate-900">{p.n.toLocaleString("en-US")}</span>
                  </li>
                ))}
              </ol>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-500 sm:mt-8 sm:text-xs" aria-label="คำอธิบายสีแผนที่">
              <span>ผู้ฝึกสอนต่อจังหวัด</span>
              <span className="flex">
                {[{ l: "0", c: "#e6e8ee" }, ...COACH_BINS.map((b, i) => ({ l: i === COACH_BINS.length - 1 ? `${b}+` : String(b), c: COACH_COLORS[i] }))].map((b) => (
                  <span key={b.l} className="flex w-5 flex-col items-center gap-1 sm:w-8">
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
        <div className="mx-auto grid max-w-7xl grid-cols-3 gap-x-4 gap-y-8 px-4 py-12 sm:gap-10 sm:px-6 sm:py-16 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="col-span-3 lg:col-span-1">
            <BrandLogo tone="white" className="h-11 sm:h-14" />
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
// ชี้แล้ว: การ์ดยกขึ้น · ภาพซูมช้าๆ · เส้นสีประจำหมวดยืดออก · ปุ่มลูกศรเติมสีและหมุนชี้ขึ้น
function DepartmentTile({ d, n, href, locked, big, extra }: { d: Department; n: number; href: string; locked: boolean; big?: boolean; extra?: string }) {
  const Icon = d.icon;
  return (
    <Link
      href={href}
      style={{ "--tile": d.hex, "--accent": ACCENT[d.key] } as React.CSSProperties}
      className={`${tile.tile} group relative flex h-full flex-col overflow-hidden rounded-3xl bg-(--tile) text-white shadow-[0_24px_48px_-30px_rgb(0_0_0/0.7)] ring-1 ring-black/10 transition-[transform,box-shadow] duration-500 hover:-translate-y-1.5 hover:shadow-[0_36px_60px_-30px_rgb(0_0_0/0.75)]`}
    >
      <div className="relative min-h-20 flex-1 overflow-hidden sm:min-h-28">
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
        <span className={`${h} absolute left-3 top-3 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums sm:left-4 sm:top-4 sm:px-2 sm:text-xs`}>{String(n).padStart(2, "0")}</span>
        {locked && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-medium sm:right-4 sm:top-4 sm:px-2 sm:py-1 sm:text-[11px]">
            <Lock className="h-3 w-3" />
            เจ้าหน้าที่
          </span>
        )}
      </div>
      <div className={`relative ${big ? "px-5 pb-5 sm:px-8 sm:pb-8" : "px-3.5 pb-3.5 sm:px-5 sm:pb-5"}`}>
        {/* โลโก้คร่อมรอยต่อภาพกับพื้นสี */}
        <span className={`absolute -top-6 flex h-12 items-center justify-center rounded-xl bg-white px-2 shadow-lg ring-4 ring-(--tile) sm:-top-7 sm:h-14 sm:px-2.5 ${big ? "left-5 sm:left-8" : "left-3.5 sm:left-5"}`}>
          {d.logo ? (
            <Image src={d.logo} alt="" className="h-6 w-auto sm:h-8" />
          ) : d.badge ? (
            <span className="relative h-8 w-8 sm:h-10 sm:w-10">
              <Image src={d.badge} alt="" fill sizes="40px" className="object-contain" />
            </span>
          ) : (
            <Icon className="h-6 w-6" style={{ color: d.hex }} />
          )}
        </span>
        <div className="pt-8 sm:pt-10">
          <span className={`${tile.tileBar} block h-1 rounded-full bg-(--accent)`} />
          <h3 className={`${h} mt-2.5 font-semibold leading-tight sm:mt-3 ${big ? "text-2xl sm:text-5xl" : "text-[15px] sm:text-xl"}`}>{d.title}</h3>
          <p className={`mt-1.5 text-white/75 ${big ? "max-w-md text-xs sm:text-base" : "hidden text-[13px] leading-snug sm:line-clamp-2"}`}>{d.subtitle}</p>
          <div className="mt-3 flex items-center justify-between gap-2 sm:mt-4 sm:gap-3">
            <span className="min-w-0 truncate text-[11px] font-semibold text-white/65 sm:text-xs">{locked ? (d.guestHref ? "เข้าสู่ระบบ / สมัครสมาชิก" : "เข้าสู่ระบบเพื่อใช้งาน") : extra}</span>
            <span className={`${tile.tileGo} flex h-8 w-8 flex-none items-center justify-center rounded-full bg-white/10 ring-1 ring-white/25 sm:h-10 sm:w-10`}>
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45 sm:text-[11px]">{title}</p>
      <ul className="mt-2 text-xs sm:mt-3 sm:text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="inline-flex min-h-8 items-center hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
