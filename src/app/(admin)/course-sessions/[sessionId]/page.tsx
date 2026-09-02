import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { approveApplication, rejectApplication } from "./actions";
import { ArrowLeft, Check, X } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "รอตรวจสอบ",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ไม่ผ่าน",
  CANCELLED: "ยกเลิก",
};
const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-600",
  APPROVED: "bg-emerald-50 text-emerald-600",
  REJECTED: "bg-red-50 text-red-600",
  CANCELLED: "bg-slate-100 text-slate-500",
};

function formatDate(date: Date | null) {
  if (!date) return "-";
  return date.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

export default async function CourseSessionApplicationsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await prisma.courseSession.findUnique({
    where: { id: Number(sessionId) },
    include: {
      course: true,
      applications: {
        orderBy: { appliedAt: "asc" },
        include: { coach: true },
      },
    },
  });

  if (!session) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/course-sessions"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปหน้าจัดการหลักสูตร
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {session.course.title} · {session.name}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {session.course.licenseType ? `ระดับ ${session.course.licenseType}` : "อบรมทั่วไป"} · ผู้สมัคร{" "}
          {session.applications.length} คน
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {session.applications.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-slate-400">ยังไม่มีผู้สมัคร</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {session.applications.map((app) => (
              <li key={app.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div>
                  <Link
                    href={`/coaches/${app.coachId}`}
                    className="text-sm font-medium text-slate-900 hover:text-indigo-600"
                  >
                    {app.coach.nameTh} {app.coach.surnameTh}
                  </Link>
                  <p className="text-xs text-slate-400">
                    สมัครเมื่อ {formatDate(app.appliedAt)}
                    {app.reviewedAt && ` · ตรวจสอบเมื่อ ${formatDate(app.reviewedAt)} โดย ${app.reviewedBy}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[app.status]}`}>
                    {STATUS_LABEL[app.status]}
                  </span>
                  {app.status === "PENDING" && (
                    <>
                      <form action={approveApplication}>
                        <input type="hidden" name="id" value={app.id} />
                        <button className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
                          <Check className="h-3.5 w-3.5" />
                          อนุมัติ
                        </button>
                      </form>
                      <form action={rejectApplication}>
                        <input type="hidden" name="id" value={app.id} />
                        <button className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50">
                          <X className="h-3.5 w-3.5" />
                          ไม่ผ่าน
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
