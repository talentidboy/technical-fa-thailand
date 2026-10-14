import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getHighestCoreLevel, getNextCoreLevel } from "@/lib/license-rank";
import { LIVE_APPLICATION_STATUSES, APPLICATION_STATUS } from "@/lib/course-workflow";
import { applyToSession } from "@/app/me/courses/actions";
import { LOGO_URL, COVER_URL } from "@/lib/brand";
import { ApplyForm } from "./ApplyForm";
import { ArrowLeft, CalendarDays, MapPin, Users, Clock, LogIn, CheckCircle2, Lock, Send } from "lucide-react";

function formatDate(date: Date | null) {
  if (!date) return null;
  return date.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

// หน้าสมัครอบรมสาธารณะของแต่ละรุ่น — ลิงก์นี้แอดมินคัดลอกไปประกาศได้เลย (Facebook / LINE)
export default async function ApplyPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const id = Number(sessionId);
  if (!Number.isInteger(id)) notFound();

  const [session, user] = await Promise.all([
    prisma.courseSession.findUnique({
      where: { id },
      include: {
        course: true,
        _count: { select: { applications: { where: { status: { in: LIVE_APPLICATION_STATUSES } } } } },
      },
    }),
    getCurrentUser(),
  ]);
  if (!session) notFound();

  const now = new Date();
  const isGeneral = session.course.courseType === "GENERAL";
  const full = session.capacity != null && session._count.applications >= session.capacity;
  const closedReason =
    session.status !== "OPEN"
      ? "รุ่นนี้ปิดรับสมัครแล้ว"
      : session.applicationOpenDate && session.applicationOpenDate > now
        ? `เปิดรับสมัครวันที่ ${formatDate(session.applicationOpenDate)}`
        : session.applicationDeadline && session.applicationDeadline < now
          ? "หมดเขตรับสมัครแล้ว"
          : full
            ? "รุ่นนี้รับสมัครเต็มแล้ว"
            : null;

  // ผู้ฝึกสอนที่ล็อกอินอยู่แล้ว: กดสมัครได้ปุ่มเดียว
  let coachBlock: React.ReactNode = null;
  if (user?.role === "COACH" && user.coachId) {
    const [records, mine] = await Promise.all([
      prisma.licenseRecord.findMany({ where: { coachId: user.coachId }, select: { licenseType: true } }),
      prisma.application.findUnique({
        where: { coachId_courseSessionId: { coachId: user.coachId, courseSessionId: id } },
      }),
    ]);
    const next = getNextCoreLevel(getHighestCoreLevel(records));
    const eligible = isGeneral || session.course.licenseType === next;
    coachBlock =
      mine && LIVE_APPLICATION_STATUSES.includes(mine.status) ? (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200">
          <CheckCircle2 className="h-5 w-5 flex-none" />
          <span>
            คุณสมัครรุ่นนี้แล้ว — สถานะ: <b>{APPLICATION_STATUS[mine.status]?.label}</b>{" "}
            <Link href="/me/courses" className="font-semibold underline">
              ดูใบสมัครของฉัน
            </Link>
          </span>
        </div>
      ) : !eligible ? (
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-200">
          <Lock className="h-5 w-5 flex-none" />
          {next ? `ตามประวัติของคุณ สมัครได้ที่ระดับ ${next} — หลักสูตรนี้ต้องผ่านระดับก่อนหน้าก่อน` : "คุณผ่านระดับสูงสุดแล้ว"}
        </div>
      ) : (
        <form action={applyToSession} className="space-y-3">
          <input type="hidden" name="courseSessionId" value={id} />
          <p className="text-sm text-slate-600">
            เข้าสู่ระบบในชื่อ <b>{user.email}</b> — ใช้ข้อมูลในโปรไฟล์ของคุณสมัครได้ทันที
          </p>
          <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700">
            <Send className="h-5 w-5" />
            ยืนยันสมัครรุ่นนี้
          </button>
        </form>
      );
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:py-12">
      <div className="fixed inset-0 -z-10">
        <Image src={COVER_URL} alt="" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-linear-to-br from-indigo-950/90 via-indigo-900/85 to-indigo-700/90" />
      </div>
      <div className="fixed inset-x-0 top-0 h-1 bg-linear-to-r from-amber-600 via-amber-400 to-amber-600" />

      <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-linear-to-br from-indigo-900 to-indigo-700 px-6 py-7 text-white sm:px-8">
          <Link
            href="/coach-center"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-200 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            ศูนย์อบรมผู้ฝึกสอน
          </Link>
          <div className="mt-4 flex items-start gap-4">
            <Image
              src={LOGO_URL}
              alt="FA Thailand"
              width={52}
              height={52}
              className="h-13 w-13 flex-none rounded-xl ring-4 ring-amber-400/30"
            />
            <div className="min-w-0">
              <span className="inline-block rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-amber-950">
                {isGeneral ? "อบรมทั่วไป" : `License ${session.course.licenseType}`}
              </span>
              <h1 className="mt-1.5 text-xl font-bold leading-snug sm:text-2xl">{session.course.title}</h1>
              <p className="text-sm text-indigo-200">{session.name}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-2 text-sm text-indigo-100 sm:grid-cols-2">
            {(session.startDate || session.endDate) && (
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 flex-none text-amber-300" />
                อบรม {formatDate(session.startDate)} – {formatDate(session.endDate)}
              </span>
            )}
            {session.venue && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-none text-amber-300" />
                {session.venue}
              </span>
            )}
            {session.applicationDeadline && (
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 flex-none text-amber-300" />
                สมัครได้ถึง {formatDate(session.applicationDeadline)}
              </span>
            )}
            {session.capacity != null && (
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4 flex-none text-amber-300" />
                รับ {session.capacity} คน · เหลือ {Math.max(0, session.capacity - session._count.applications)} ที่
              </span>
            )}
          </div>
          {session.course.requirement && (
            <p className="mt-4 rounded-lg bg-white/10 px-3 py-2 text-xs text-indigo-100">
              คุณสมบัติ: {session.course.requirement}
            </p>
          )}
        </div>

        <div className="p-6 sm:p-8">
          {closedReason ? (
            <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-500 ring-1 ring-slate-200">
              {closedReason}
            </p>
          ) : coachBlock ? (
            coachBlock
          ) : user ? (
            <p className="rounded-xl bg-amber-50 px-4 py-4 text-sm text-amber-800 ring-1 ring-amber-200">
              คุณเข้าสู่ระบบด้วยบัญชีเจ้าหน้าที่ — ผู้สมัครจะเห็นฟอร์มสมัครที่หน้านี้
            </p>
          ) : (
            <>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
                <span>มีบัญชีผู้ฝึกสอนอยู่แล้ว?</span>
                <Link
                  href="/coach-center/login"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm hover:bg-indigo-100"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  เข้าสู่ระบบแล้วกดสมัคร
                </Link>
              </div>
              <ApplyForm sessionId={session.id} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
