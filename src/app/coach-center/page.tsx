import { BrandLogo } from "@/components/BrandLogo";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COVER_URL } from "@/lib/brand";
import { LIVE_APPLICATION_STATUSES } from "@/lib/course-workflow";
import { coreProgramSteps } from "@/lib/coach-program";
import { Reveal } from "@/components/g15/Reveal";
import { display, levelTone, SectionHead, PathwayStairs } from "@/components/coach/CoachUi";
import {
  ArrowLeft,
  LogIn,
  UserPlus,
  ArrowRight,
  CalendarDays,
  MapPin,
  Users,
  Clock,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  BadgeCheck,
  ShieldCheck,
  HeartPulse,
  Megaphone,
  Download,
  RefreshCw,
} from "lucide-react";

function formatDate(date: Date | null) {
  if (!date) return null;
  return date.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Bangkok" });
}

const STEPS = [
  { icon: UserPlus, title: "สมัครออนไลน์", text: "เลือกรุ่นที่เปิดรับ กรอกใบสมัครครั้งเดียว ระบบสร้างบัญชีผู้ฝึกสอนให้ทันที — ไม่ต้องมีบัญชีมาก่อน" },
  { icon: ClipboardCheck, title: "เข้ารับการอบรม", text: "เจ้าหน้าที่ตรวจสอบและอนุมัติ ติดตามสถานะใบสมัครได้ในหน้าของคุณ" },
  { icon: BadgeCheck, title: "รับใบอนุญาตออนไลน์", text: "ผ่านการอบรมแล้ว ดาวน์โหลด Diploma / Licence ได้เอง และยื่นต่ออายุออนไลน์เมื่อใกล้หมดอายุ" },
];

const TRACKS = [
  { icon: ShieldCheck, title: "AFC Goalkeeper Coaching", text: "ผู้ฝึกสอนผู้รักษาประตู 3 ระดับ (C · B · A)", tone: "from-emerald-400/20 text-emerald-300" },
  { icon: HeartPulse, title: "AFC Fitness Coaching", text: "ผู้ฝึกสอนฟิตเนส 3 ระดับ (C · B · A)", tone: "from-rose-400/20 text-rose-300" },
];

// หน้าทางเข้าสาธารณะของศูนย์อบรมผู้ฝึกสอน — ข่าวเปิดรับสมัคร + เส้นทางใบอนุญาต ดูได้โดยไม่ต้องล็อกอิน (สมัครจริงต้องมีบัญชี)
// (แอดมิน/เจ้าหน้าที่ใช้ /login ตรง ๆ ตามเดิม)
export default async function CoachCenterPage() {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    redirect(currentUser.role === "COACH" ? "/me" : "/");
  }

  const [openSessions, coachCount, licenseCount] = await Promise.all([
    prisma.courseSession.findMany({
      where: { status: "OPEN" },
      include: {
        course: { select: { title: true, courseType: true, licenseType: true } },
        _count: { select: { applications: { where: { status: { in: LIVE_APPLICATION_STATUSES } } } } },
      },
      orderBy: [{ applicationDeadline: "asc" }, { startDate: "asc" }],
    }),
    prisma.coach.count({ where: { licenseRecords: { some: {} } } }),
    prisma.licenseRecord.count(),
  ]);
  const now = new Date();

  return (
    <div className="min-h-screen overflow-x-clip bg-slate-50">
      {/* ===== HERO ===== */}
      <section className="relative isolate overflow-hidden bg-[#070b1f] text-white">
        <Image src={COVER_URL} alt="" fill priority className="-z-20 object-cover opacity-25" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-b from-[#070b1f]/70 via-[#070b1f]/85 to-[#070b1f]" />
        <div aria-hidden className="absolute -left-40 -top-40 -z-10 h-128 w-128 rounded-full bg-indigo-600/40 blur-[120px]" />
        <div aria-hidden className="absolute -right-32 top-10 -z-10 h-112 w-112 rounded-full bg-sky-500/25 blur-[120px]" />
        <div aria-hidden className="absolute -bottom-40 left-1/3 -z-10 h-96 w-96 rounded-full bg-amber-400/15 blur-[120px]" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[56px_56px] mask-[radial-gradient(ellipse_at_center,black_20%,transparent_75%)]"
        />
        <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-600 via-amber-300 to-amber-600" />

        {/* แถบบน */}
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 pt-5 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <BrandLogo tone="white" className="h-9" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">FA Thailand Technical</span>
              <span className="flex items-center gap-1 text-[11px] text-white/50">
                <ArrowLeft className="h-3 w-3" />
                กลับหน้าแรก
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/courses" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white sm:inline-flex">
              หลักสูตรทั้งหมด
            </Link>
            <Link
              href="/coach-center/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3.5 py-2 text-sm font-semibold ring-1 ring-white/15 backdrop-blur hover:bg-white/20"
            >
              <LogIn className="h-4 w-4" />
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.15fr_1fr] lg:pb-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 ring-1 ring-white/10 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_#fbbf24]" />
              AFC Coaching Convention · FA Thailand
            </span>
            <h1 className={`${display.className} mt-6 text-5xl font-black leading-[0.92] tracking-tight sm:text-7xl`}>
              <span className="block bg-linear-to-br from-white via-white to-sky-200 bg-clip-text text-transparent">COACH</span>
              <span className="block bg-linear-to-r from-amber-200 via-amber-300 to-amber-500 bg-clip-text text-transparent">EDUCATION</span>
            </h1>
            <p className="mt-6 text-2xl font-extrabold sm:text-3xl">ศูนย์อบรมผู้ฝึกสอนฟุตบอล</p>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/65 sm:text-base">
              พัฒนาผู้ฝึกสอนฟุตบอลไทยตามมาตรฐานสมาพันธ์ฟุตบอลเอเชีย ตั้งแต่ระดับพื้นฐาน G จนถึง PRO — สมัครอบรม ติดตามผล รับใบอนุญาต และต่ออายุได้ในที่เดียว
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={openSessions.length > 0 ? "#open" : "/register"}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 text-sm font-bold text-amber-950 shadow-lg shadow-amber-500/25 transition-colors hover:bg-amber-300"
              >
                {openSessions.length > 0 ? (
                  <>
                    <GraduationCap className="h-4 w-4" />
                    ดูรุ่นที่เปิดรับสมัคร ({openSessions.length})
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    สมัครบัญชีผู้ฝึกสอน
                  </>
                )}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/coach-center/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-6 py-3.5 text-sm font-semibold ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-white/20"
              >
                <LogIn className="h-4 w-4" />
                มีบัญชีแล้ว — เข้าสู่ระบบ
              </Link>
            </div>
          </div>

          {/* การ์ดกระจก: บันไดเส้นทางใบอนุญาต */}
          <div className="relative">
            <div aria-hidden className="absolute -inset-4 -z-10 rounded-[2rem] bg-linear-to-br from-sky-500/20 via-transparent to-amber-400/20 blur-2xl" />
            <div className="rounded-3xl bg-linear-to-br from-white/25 via-white/5 to-white/10 p-px">
              <div className="rounded-[calc(1.5rem-1px)] bg-[#0d1433]/85 p-6 backdrop-blur-xl sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-300 ring-1 ring-amber-300/30">
                    AFC Coaching Pathway
                  </span>
                  <span className="text-xs text-white/40">5 ระดับ</span>
                </div>
                <div className="mt-8">
                  <PathwayStairs />
                </div>
                <div className="mt-4 grid grid-cols-5 gap-2 text-center text-[10px] leading-tight text-white/45 sm:gap-3">
                  {coreProgramSteps.map((s) => (
                    <span key={s.level}>{s.days} วัน</span>
                  ))}
                </div>
                <Link
                  href="/courses"
                  className="mt-6 flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold ring-1 ring-white/10 transition-colors hover:bg-white/10"
                >
                  รายละเอียดหลักสูตรทุกระดับ
                  <ArrowRight className="h-4 w-4 text-amber-300" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ตัวเลข */}
        <div className="relative border-t border-white/10 bg-white/3 backdrop-blur">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 divide-white/10 px-5 sm:grid-cols-4 sm:divide-x sm:px-6">
            {[
              { value: coachCount.toLocaleString(), label: "ผู้ฝึกสอนที่มีใบอนุญาต" },
              { value: licenseCount.toLocaleString(), label: "ใบอนุญาตที่ออกแล้ว" },
              { value: String(openSessions.length), label: "รุ่นที่เปิดรับสมัคร" },
              { value: "3", label: "สายหลักสูตร AFC" },
            ].map((s) => (
              <div key={s.label} className="px-2 py-5 sm:px-6">
                <dt className="text-xs text-white/50">{s.label}</dt>
                <dd className={`${display.className} mt-1 text-2xl font-black tabular-nums sm:text-3xl`}>{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-20 px-5 py-16 sm:px-6">
        {/* ===== เปิดรับสมัคร ===== */}
        <section id="open" className="scroll-mt-6">
          <SectionHead
            no="01"
            eyebrow="Open Courses"
            title="รุ่นอบรมที่เปิดรับสมัคร"
            sub="ยังไม่มีบัญชีก็สมัครได้ — ระบบสร้างบัญชีให้พร้อมกับใบสมัคร"
          />
          {openSessions.length === 0 ? (
            <div className="relative overflow-hidden rounded-3xl bg-white px-6 py-12 text-center shadow-sm ring-1 ring-slate-200">
              <div aria-hidden className="absolute left-1/2 top-0 h-40 w-120 -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(99,102,241,0.12),transparent)]" />
              <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <Megaphone className="h-7 w-7" />
              </span>
              <p className="relative mt-4 text-lg font-bold text-slate-900">ยังไม่มีรุ่นที่เปิดรับสมัครในขณะนี้</p>
              <p className="relative mt-1 text-sm text-slate-500">สร้างบัญชีไว้ก่อน เมื่อเปิดรุ่นใหม่จะสมัครได้ทันทีจากหน้าของคุณ</p>
              <Link
                href="/register"
                className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700"
              >
                <UserPlus className="h-4 w-4" />
                สมัครบัญชีผู้ฝึกสอน
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {openSessions.map((s, i) => {
                const isGeneral = s.course.courseType === "GENERAL";
                const tone = levelTone(s.course.licenseType);
                const daysLeft = s.applicationDeadline ? Math.ceil((s.applicationDeadline.getTime() - now.getTime()) / 86_400_000) : null;
                const full = s.capacity != null && s._count.applications >= s.capacity;
                return (
                  <Reveal key={s.id} delay={i * 80} className="h-full">
                    <article className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-950/10">
                      <div className={`relative overflow-hidden bg-linear-to-br ${isGeneral ? "from-slate-700 to-slate-900" : tone.card} px-5 py-5 text-white`}>
                        <span
                          aria-hidden
                          className={`${display.className} absolute -bottom-6 -right-2 select-none text-8xl font-black leading-none text-white/10`}
                        >
                          {isGeneral ? "+" : s.course.licenseType}
                        </span>
                        <div className="relative flex items-center justify-between gap-2">
                          <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-white/20">
                            {isGeneral ? "อบรมทั่วไป" : `License ${s.course.licenseType}`}
                          </span>
                          {daysLeft != null && daysLeft >= 0 && (
                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${daysLeft <= 7 ? "bg-amber-400 text-amber-950" : "bg-black/20"}`}>
                              {daysLeft === 0 ? "ปิดรับวันนี้" : `ปิดรับใน ${daysLeft} วัน`}
                            </span>
                          )}
                        </div>
                        <p className="relative mt-4 text-lg font-extrabold leading-snug">{s.course.title}</p>
                        <p className="relative text-sm text-white/70">{s.name}</p>
                      </div>
                      <div className="flex flex-1 flex-col gap-2.5 p-5 text-sm text-slate-600">
                        {(s.startDate || s.endDate) && (
                          <p className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 flex-none text-indigo-500" />
                            {formatDate(s.startDate)} – {formatDate(s.endDate)}
                          </p>
                        )}
                        {s.venue && (
                          <p className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 flex-none text-indigo-500" />
                            {s.venue}
                          </p>
                        )}
                        {s.capacity != null && (
                          <div>
                            <p className="flex items-center gap-2">
                              <Users className="h-4 w-4 flex-none text-indigo-500" />
                              สมัครแล้ว {s._count.applications}/{s.capacity} คน
                            </p>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, (s._count.applications / s.capacity) * 100)}%` }} />
                            </div>
                          </div>
                        )}
                        {(s.applicationOpenDate || s.applicationDeadline) && (
                          <p className="flex items-center gap-2 text-xs text-slate-400">
                            <Clock className="h-3.5 w-3.5 flex-none" />
                            รับสมัคร {formatDate(s.applicationOpenDate) ?? "ตั้งแต่วันนี้"} – {formatDate(s.applicationDeadline) ?? "ไม่กำหนด"}
                          </p>
                        )}
                        <div className="mt-auto pt-3">
                          {full ? (
                            <span className="flex w-full items-center justify-center rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-500">เต็มแล้ว</span>
                          ) : (
                            <Link
                              href={`/apply/${s.id}`}
                              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
                            >
                              สมัครรุ่นนี้
                              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          )}
        </section>

        {/* ===== เส้นทางใบอนุญาต ===== */}
        <section>
          <SectionHead
            no="02"
            eyebrow="AFC Core Program"
            title="เส้นทางสู่ใบอนุญาตผู้ฝึกสอน"
            sub="ผ่านระดับก่อนหน้าแล้วจึงสมัครระดับถัดไป — ใบอนุญาต C ขึ้นไปมีอายุ 3 ปี ต่ออายุออนไลน์ได้"
            action={
              <Link href="/courses" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-900">
                รายละเอียดทุกหลักสูตร <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {coreProgramSteps.map((s, i) => {
              const tone = levelTone(s.level);
              return (
                <Reveal key={s.level} delay={i * 70} className="h-full">
                  <li className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div aria-hidden className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${tone.bar}`} />
                    <div className="flex items-center justify-between">
                      <span className={`${display.className} flex h-12 min-w-12 items-center justify-center rounded-2xl bg-linear-to-br px-2 text-lg font-black text-white shadow-sm ${tone.bar}`}>
                        {s.level}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">ขั้นที่ {i + 1}</span>
                    </div>
                    <p className="mt-4 font-bold leading-snug text-slate-900">{s.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{s.ageGroup}</p>
                    <div className="mt-auto flex gap-3 pt-4 text-xs font-semibold text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Clock className={`h-3.5 w-3.5 ${tone.text}`} />
                        {s.totalHours} ชม.
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className={`h-3.5 w-3.5 ${tone.text}`} />
                        {s.days} วัน
                      </span>
                    </div>
                  </li>
                </Reveal>
              );
            })}
          </ol>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {TRACKS.map(({ icon: Icon, title, text, tone }) => (
              <Link
                key={title}
                href="/courses"
                className="group flex items-center gap-4 overflow-hidden rounded-3xl bg-[#0d1433] p-5 text-white shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <span className={`flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-linear-to-br to-transparent ring-1 ring-white/10 ${tone}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">สายเฉพาะทาง</p>
                  <p className="font-bold">{title}</p>
                  <p className="text-sm text-white/60">{text}</p>
                </div>
                <ArrowRight className="h-4 w-4 flex-none text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-300" />
              </Link>
            ))}
          </div>
        </section>

        {/* ===== ขั้นตอน ===== */}
        <section>
          <SectionHead no="03" eyebrow="How it works" title="สมัครอบรมง่าย ๆ 3 ขั้นตอน" />
          <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 100} className="h-full">
                <li className="relative h-full overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <span aria-hidden className={`${display.className} absolute -right-1 -top-4 select-none text-8xl font-black leading-none text-slate-100`}>
                    {i + 1}
                  </span>
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                    <Icon className="h-6 w-6" />
                  </span>
                  <p className="relative mt-5 text-lg font-bold text-slate-900">{title}</p>
                  <p className="relative mt-1.5 text-sm leading-relaxed text-slate-500">{text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* ===== CTA ===== */}
        <Reveal>
          <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#070b1f] px-6 py-12 text-center text-white sm:px-12">
            <div aria-hidden className="absolute -left-20 -top-20 -z-10 h-72 w-72 rounded-full bg-indigo-600/40 blur-[90px]" />
            <div aria-hidden className="absolute -bottom-24 -right-16 -z-10 h-72 w-72 rounded-full bg-amber-400/25 blur-[90px]" />
            <p className={`${display.className} text-xs font-extrabold uppercase tracking-[0.3em] text-amber-300`}>Start your journey</p>
            <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">พร้อมก้าวสู่ผู้ฝึกสอนมืออาชีพแล้วหรือยัง?</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-white/60">
              มีบัญชีแล้ว เข้าสู่ระบบเพื่อดูใบอนุญาต ดาวน์โหลดใบประกาศ <Download className="inline h-3.5 w-3.5" /> และขอต่ออายุ{" "}
              <RefreshCw className="inline h-3.5 w-3.5" /> ได้ทันที
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/coach-center/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-900 hover:bg-slate-100">
                <LogIn className="h-4 w-4" />
                เข้าสู่ระบบ
              </Link>
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-amber-950 hover:bg-amber-300">
                <UserPlus className="h-4 w-4" />
                สมัครบัญชีผู้ฝึกสอน
              </Link>
            </div>
          </section>
        </Reveal>

        <div className="flex items-center justify-center gap-2">
          <BrandLogo tone="white" className="h-5" />
          <p className="text-xs text-slate-400">
            FA Thailand Technical · <BookOpen className="inline h-3 w-3" /> Coach Education
          </p>
        </div>
      </main>
    </div>
  );
}
