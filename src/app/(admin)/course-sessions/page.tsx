import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createCourse, createCourseSession, setCourseSessionStatus } from "./actions";
import { CORE_LICENSE_PROGRESSION } from "@/lib/constants";
import { Field, SelectField } from "@/components/FormField";
import { BookOpen, Plus, Users } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "เปิดรับสมัคร",
  CLOSED: "ปิดรับสมัคร",
  COMPLETED: "จบรุ่นแล้ว",
};
const STATUS_STYLE: Record<string, string> = {
  OPEN: "bg-emerald-50 text-emerald-600",
  CLOSED: "bg-slate-100 text-slate-500",
  COMPLETED: "bg-indigo-50 text-indigo-600",
};

function formatDate(date: Date | null) {
  if (!date) return "-";
  return date.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: { id: "asc" },
    include: {
      sessions: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { applications: true } } },
      },
    },
  });

  const licenseOptions = CORE_LICENSE_PROGRESSION.map((v) => ({ value: v, label: v }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">จัดการหลักสูตรอบรม</h1>
        <p className="mt-1 text-sm text-slate-500">
          สร้างหลักสูตรตามระดับใบอนุญาต (G, C, B, A, PRO) แล้วเปิดรุ่นอบรมให้โค้ชสมัคร
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <BookOpen className="h-4 w-4" />
          </div>
          <h2 className="font-semibold text-slate-900">สร้างหลักสูตรใหม่</h2>
        </div>
        <form action={createCourse} className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <SelectField label="ระดับใบอนุญาต" name="licenseType" options={licenseOptions} />
          <Field label="ชื่อหลักสูตร" name="title" required placeholder="AFC C Diploma" />
          <Field label="คำอธิบาย" name="description" />
          <Field label="คุณสมบัติผู้สมัคร" name="requirement" />
          <button
            type="submit"
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 sm:col-span-2"
          >
            <Plus className="h-4 w-4" />
            สร้างหลักสูตร
          </button>
        </form>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-sm text-slate-400">ยังไม่มีหลักสูตรในระบบ</p>
        </div>
      ) : (
        courses.map((course) => (
          <div key={course.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">
                  {course.title}{" "}
                  <span className="text-xs font-normal text-slate-400">({course.licenseType})</span>
                </h2>
                {course.description && (
                  <p className="mt-0.5 text-xs text-slate-500">{course.description}</p>
                )}
              </div>
            </div>

            <div className="border-b border-slate-100 p-6">
              <form action={createCourseSession} className="space-y-5">
                <input type="hidden" name="courseId" value={course.id} />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="ชื่อรุ่น" name="name" required placeholder="รุ่นที่ 1/2569" />
                  <Field
                    label="สถานที่จัดอบรม"
                    name="venue"
                    required
                    placeholder="เช่น สนามศุภชลาศัย, กรุงเทพฯ"
                  />
                  <Field label="รับจำนวน (เว้นว่าง = ไม่จำกัด)" name="capacity" type="number" />
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    ช่วงเวลาจัดอบรม
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="วันเริ่มอบรม" name="startDate" type="date" />
                    <Field label="วันจบอบรม" name="endDate" type="date" />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    ช่วงเวลารับสมัคร
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="วันเปิดรับสมัคร" name="applicationOpenDate" type="date" />
                    <Field label="วันปิดรับสมัคร" name="applicationDeadline" type="date" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                  เปิดรุ่นใหม่
                </button>
              </form>
            </div>

            {course.sessions.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-400">ยังไม่มีรุ่นอบรม</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {course.sessions.map((session) => (
                  <li key={session.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{session.name}</p>
                      <p className="text-xs text-slate-500">
                        อบรม {formatDate(session.startDate)} - {formatDate(session.endDate)}
                        {session.venue && ` · ${session.venue}`}
                      </p>
                      <p className="text-xs text-slate-400">
                        รับสมัคร {formatDate(session.applicationOpenDate)} - {formatDate(session.applicationDeadline)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[session.status]}`}>
                        {STATUS_LABEL[session.status]}
                      </span>
                      <Link
                        href={`/course-sessions/${session.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        <Users className="h-3.5 w-3.5" />
                        ผู้สมัคร ({session._count.applications})
                      </Link>
                      {session.status !== "CLOSED" && (
                        <form action={setCourseSessionStatus}>
                          <input type="hidden" name="id" value={session.id} />
                          <input type="hidden" name="status" value="CLOSED" />
                          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50">
                            ปิดรับสมัคร
                          </button>
                        </form>
                      )}
                      {session.status === "CLOSED" && (
                        <form action={setCourseSessionStatus}>
                          <input type="hidden" name="id" value={session.id} />
                          <input type="hidden" name="status" value="OPEN" />
                          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50">
                            เปิดรับสมัครอีกครั้ง
                          </button>
                        </form>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))
      )}
    </div>
  );
}
