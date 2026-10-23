import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { showPublicly } from "@/lib/academy";
import { loadAcademies } from "@/lib/academy-data";
import { COVER_URL } from "@/lib/brand";
import { BrandLogo } from "@/components/BrandLogo";
import { NewsSection } from "@/components/NewsSection";
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

  const [announcements, events, coachTotal, licensedCoaches, academies, g15Teams, results, sessions] = await Promise.all([
    prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    isStaff ? prisma.event.findMany({ where: { endDate: { gte: now } }, orderBy: { startDate: "asc" }, take: 6 }) : Promise.resolve([]),
    prisma.coach.count(),
    prisma.coach.count({ where: { licenseRecords: { some: { OR: [{ expireDate: null }, { expireDate: { gte: now } }] } } } }),
    loadAcademies(now),
    prisma.g15Team.count(),
    prisma.g15Match.findMany({
      where: { status: "FINISHED", homeScore: { not: null }, awayScore: { not: null } },
      include: { homeTeam: { select: { name: true, logoUrl: true } }, awayTeam: { select: { name: true, logoUrl: true } } },
      orderBy: [{ matchDate: { sort: "desc", nulls: "last" } }, { id: "desc" }],
      take: 3,
    }),
    prisma.courseSession.findMany({
      where: { status: "OPEN", OR: [{ applicationDeadline: null }, { applicationDeadline: { gte: now } }] },
      include: { course: { select: { title: true } } },
      orderBy: [{ startDate: { sort: "asc", nulls: "last" } }, { id: "asc" }],
      take: 4,
    }),
  ]);
  const academyCount = academies.filter((a) => showPublicly(a.active, a.state)).length;
  const loggedIn = !!user;

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
            <h1 className={`${h} ${styles.rise} mt-6 text-[2.9rem] font-semibold leading-[1.04] tracking-tight sm:text-7xl`} style={{ animationDelay: "120ms" }}>
              พัฒนาฟุตบอลไทย
              <br />
              <span className="text-amber-300">จากรากหญ้า</span>
              <br />
              สู่ทีมชาติ
            </h1>
            <p className={`${styles.rise} mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg`} style={{ animationDelay: "260ms" }}>
              ศูนย์รวมงานเทคนิคของสมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์ — ผู้ฝึกสอน หลักสูตรอบรม อคาเดมี การแข่งขันเยาวชน และฟุตบอลรากหญ้า
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
              <h2 className={`${h} mt-2 text-4xl font-semibold tracking-tight text-[#073c5e] sm:text-5xl`}>ทุกงานเทคนิค ในที่เดียว</h2>
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

      {/* ===== ความเคลื่อนไหว: ผล G15 + หลักสูตรที่เปิดรับ ===== */}
      <section className="border-y border-slate-200 bg-white px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionHead eyebrow="Match Centre" title="ผลการแข่งขันล่าสุด" href="/g15-womens-series/matches" linkLabel="ทั้งหมด" />
            {results.length === 0 ? (
              <p className="mt-6 text-sm text-slate-400">ยังไม่มีผลการแข่งขัน</p>
            ) : (
              <ul className="mt-6 divide-y divide-slate-100 border-y border-slate-100">
                {results.map((m) => (
                  <li key={m.id}>
                    <Link href={`/g15-womens-series/matches/${m.id}`} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 py-4 transition-colors hover:bg-[#f5f4f0] sm:gap-5 sm:px-3">
                      <TeamSide name={m.homeTeam.name} logo={m.homeTeam.logoUrl} align="right" />
                      <span className="text-center">
                        <span className={`${h} block rounded-md bg-[#073c5e] px-3 py-1 text-xl font-semibold tabular-nums text-white`}>
                          {m.homeScore} – {m.awayScore}
                        </span>
                        {m.homePenalty !== null && m.awayPenalty !== null && <span className="mt-0.5 block text-[10px] text-slate-500">จุดโทษ {m.homePenalty}–{m.awayPenalty}</span>}
                        <span className="mt-1 block text-[11px] text-slate-400">{m.matchDate ? day(m.matchDate) : m.round}</span>
                      </span>
                      <TeamSide name={m.awayTeam.name} logo={m.awayTeam.logoUrl} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Reveal>

          <Reveal delay={120}>
            <SectionHead eyebrow="Coach Education" title="เปิดรับสมัครอบรม" href="/courses" linkLabel="หลักสูตรทั้งหมด" />
            {sessions.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center">
                <CalendarClock className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-700">ยังไม่มีรุ่นที่เปิดรับสมัครในตอนนี้</p>
                <p className="mt-1 text-xs text-slate-500">ติดตามประกาศรุ่นใหม่ได้ที่หน้าหลักสูตรอบรม หรือข่าวประกาศด้านล่าง</p>
                <Link href="/courses" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#073c5e] underline decoration-slate-300 underline-offset-4 hover:decoration-[#073c5e]">
                  ดูหลักสูตรทั้งหมด
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <ul className="mt-6 divide-y divide-slate-100 border-y border-slate-100">
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
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
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
          <Image src={d.image} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-black/5" />
        </>
      )}
      {d.art && (
        <span className="absolute -bottom-3 right-0 h-[88%] w-[46%] transition-transform duration-500 group-hover:-translate-y-1.5 group-hover:rotate-2">
          <Image src={d.art} alt="" fill sizes="(min-width: 1024px) 12vw, 45vw" className="object-contain object-bottom-right drop-shadow-xl" />
        </span>
      )}
      {d.mark && (
        <span className={`${h} pointer-events-none absolute -right-3 top-1/2 -translate-y-1/2 select-none text-[9rem] font-semibold leading-none text-white/10 transition-transform duration-700 group-hover:-translate-x-2`}>
          {d.mark}
        </span>
      )}
      {!d.image && !d.art && !d.mark && <Icon className="absolute -right-6 -top-6 h-36 w-36 text-white/10 transition-transform duration-700 group-hover:-rotate-6 group-hover:scale-110" />}
      <div className="absolute left-6 top-6 flex items-center gap-2">
        {d.badge ? (
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
        <h2 className={`${h} mt-2 text-3xl font-semibold tracking-tight text-[#073c5e]`}>{title}</h2>
      </div>
      <Link href={href} className="inline-flex flex-none items-center gap-1 text-sm font-semibold text-[#073c5e] hover:underline">
        {linkLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function TeamSide({ name, logo, align = "left" }: { name: string; logo: string | null; align?: "left" | "right" }) {
  return (
    <span className={`flex min-w-0 items-center gap-2.5 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      <span className="relative h-9 w-9 flex-none overflow-hidden rounded-full bg-slate-100">
        {logo && <Image src={logo} alt="" fill sizes="36px" className="object-contain p-0.5" />}
      </span>
      <span className="truncate text-sm font-semibold text-slate-800">{name}</span>
    </span>
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
