import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LOGO_URL, COVER_URL } from "@/lib/brand";
import { LICENSE_TYPES, labelFor } from "@/lib/constants";
import {
  ArrowLeft,
  LogIn,
  UserPlus,
  GraduationCap,
  ArrowRight,
  Megaphone,
  CalendarDays,
} from "lucide-react";

function formatDate(date: Date | null) {
  if (!date) return null;
  return date.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

// หน้าทางเข้าสาธารณะเฉพาะผู้ฝึกสอน — จุดแรกที่การ์ด "ศูนย์อบรมผู้ฝึกสอนฟุตบอล" ในหน้าแรกพาคนที่ยังไม่ล็อกอินมาที่นี่
// (แอดมิน/เจ้าหน้าที่ยังใช้ /login ตรงๆ ตามเดิม ไม่ผ่านหน้านี้)
// แสดงข้อมูลทั่วไป (รายชื่อหลักสูตร + ข่าวเปิดรับสมัคร) ให้เห็นทันทีโดยไม่ต้องล็อกอิน — แต่การสมัครจริงยังต้องเข้าสู่ระบบก่อนเสมอ
export default async function CoachCenterPage() {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    redirect(currentUser.role === "COACH" ? "/me" : "/");
  }

  const [courses, openSessions] = await Promise.all([
    prisma.course.findMany({
      where: { isActive: true },
      orderBy: [{ courseType: "asc" }, { licenseType: "asc" }],
      select: { id: true, title: true, courseType: true, licenseType: true },
    }),
    prisma.courseSession.findMany({
      where: { status: "OPEN" },
      include: { course: { select: { title: true, courseType: true, licenseType: true } } },
      orderBy: { applicationDeadline: "asc" },
    }),
  ]);

  const licenseCourses = courses.filter((c) => c.courseType !== "GENERAL");
  const generalCourses = courses.filter((c) => c.courseType === "GENERAL");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src={COVER_URL} alt="" fill priority className="object-cover" />
          <div className="absolute inset-0 bg-linear-to-br from-indigo-950/90 via-indigo-900/85 to-indigo-700/90" />
        </div>
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-600 via-amber-400 to-amber-600" />

        <div className="relative mx-auto max-w-5xl px-6 py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-200 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            กลับหน้าแรก
          </Link>

          <div className="mt-6 flex flex-col items-center gap-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <GraduationCap className="h-7 w-7 text-amber-300" />
            </div>
            <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              ศูนย์อบรมผู้ฝึกสอนฟุตบอล
            </h1>
            <p className="max-w-xl text-sm text-indigo-200">
              ระบบสำหรับผู้ฝึกสอนฟุตบอล — ใบอนุญาต AFC และคอร์สอบรม
            </p>
          </div>

          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/login"
              className="group flex items-center gap-3 rounded-xl bg-white p-4 shadow-lg transition-transform hover:-translate-y-0.5"
            >
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <LogIn className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">มีบัญชีอยู่แล้ว</p>
                <p className="text-xs text-slate-500">เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน</p>
              </div>
              <ArrowRight className="h-4 w-4 flex-none text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500" />
            </Link>

            <Link
              href="/register"
              className="group flex items-center gap-3 rounded-xl bg-white p-4 shadow-lg transition-transform hover:-translate-y-0.5"
            >
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <UserPlus className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">ยังไม่มีบัญชี</p>
                <p className="text-xs text-slate-500">สมัครสมาชิกผู้ฝึกสอนใหม่</p>
              </div>
              <ArrowRight className="h-4 w-4 flex-none text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-500" />
            </Link>
          </div>
        </div>

        <svg className="relative block w-full text-slate-50" viewBox="0 0 1440 60" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,32 C480,72 960,0 1440,32 L1440,60 L0,60 Z" />
        </svg>
      </div>

      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        {/* ข่าวประกาศเปิดรับสมัคร */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Megaphone className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-slate-900">ข่าวประกาศเปิดรับสมัครอบรม</h2>
          </div>
          {openSessions.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">
              ยังไม่มีรุ่นอบรมที่เปิดรับสมัครในขณะนี้
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {openSessions.map((session) => {
                const isGeneral = session.course.courseType === "GENERAL";
                return (
                  <li key={session.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {session.course.title}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          ({isGeneral ? "อบรมทั่วไป" : `ระดับ ${session.course.licenseType}`}) · {session.name}
                        </span>
                      </p>
                      {(session.applicationOpenDate || session.applicationDeadline) && (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                          <CalendarDays className="h-3.5 w-3.5" />
                          รับสมัคร {formatDate(session.applicationOpenDate) ?? "วันนี้"} -{" "}
                          {formatDate(session.applicationDeadline) ?? "ไม่กำหนด"}
                        </p>
                      )}
                    </div>
                    <span
                      className={`flex-none rounded-full px-2.5 py-1 text-xs font-medium ${
                        isGeneral ? "bg-slate-100 text-slate-600" : "bg-indigo-50 text-indigo-600"
                      }`}
                    >
                      {isGeneral ? "อบรมทั่วไป" : `License ${session.course.licenseType}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="border-t border-slate-100 px-6 py-3 text-center text-xs text-slate-400">
            ต้องเข้าสู่ระบบด้วยบัญชีผู้ฝึกสอนเพื่อสมัครเข้าอบรม
          </p>
        </div>

        {/* รายชื่อหลักสูตรทั้งหมด */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="font-semibold text-slate-900">หลักสูตรตามระดับใบอนุญาต</h2>
            </div>
            {licenseCourses.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-400">ยังไม่มีหลักสูตร</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {licenseCourses.map((c) => (
                  <li key={c.id} className="flex items-center justify-between px-6 py-3 text-sm">
                    <span className="text-slate-700">{c.title}</span>
                    <span className="flex-none rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
                      {labelFor(LICENSE_TYPES, c.licenseType) ?? c.licenseType}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="font-semibold text-slate-900">อบรมทั่วไป</h2>
              <p className="mt-0.5 text-xs text-slate-400">เปิดรับสมัครทุกระดับ ไม่จำกัดใบอนุญาต</p>
            </div>
            {generalCourses.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-400">ยังไม่มีหลักสูตรอบรมทั่วไป</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {generalCourses.map((c) => (
                  <li key={c.id} className="px-6 py-3 text-sm text-slate-700">
                    {c.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <Image src={LOGO_URL} alt="FA Thailand" width={20} height={20} className="h-5 w-5 rounded object-cover" />
          <p className="text-xs text-slate-400">FA Thailand Technical</p>
        </div>
      </div>
    </div>
  );
}
