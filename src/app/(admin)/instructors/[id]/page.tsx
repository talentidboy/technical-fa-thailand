import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { deleteInstructor } from "../actions";
import { LICENSE_TYPES, RECORD_TYPES, labelFor } from "@/lib/constants";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Building2,
  IdCard,
  GraduationCap,
  Users,
} from "lucide-react";

function formatDate(date: Date | null) {
  if (!date) return "-";
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function InstructorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const instructorId = Number(id);

  const [instructor, user] = await Promise.all([
    prisma.instructor.findUnique({
      where: { id: instructorId },
      include: {
        licenseRecords: {
          orderBy: { issueDate: "desc" },
          include: { coach: true },
        },
      },
    }),
    getCurrentUser(),
  ]);

  if (!instructor) notFound();
  const isAdmin = user?.role === "ADMIN";

  const expertiseTags = [
    instructor.teachesCore && { label: "AFC Core Program", className: "bg-indigo-50 text-indigo-600" },
    instructor.teachesGoalkeeper && { label: "AFC Goalkeeper Coaching", className: "bg-emerald-50 text-emerald-600" },
    instructor.teachesFitness && { label: "AFC Fitness Coaching", className: "bg-amber-50 text-amber-600" },
  ].filter(Boolean) as { label: string; className: string }[];

  return (
    <div className="space-y-8">
      <Link
        href="/instructors"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปทำเนียบวิทยากร
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {instructor.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={instructor.photoUrl}
                alt=""
                className="h-16 w-16 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-2xl font-semibold text-indigo-700">
                {instructor.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {instructor.name}
              </h1>
              {instructor.affiliation && (
                <p className="text-sm text-slate-500">
                  {instructor.affiliation}
                </p>
              )}
              {instructor.maxLevel && (
                <p className="mt-1 text-sm text-indigo-600">
                  สอนได้สูงสุดระดับ {labelFor(LICENSE_TYPES, instructor.maxLevel)}
                </p>
              )}
            </div>
          </div>
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/instructors/${instructor.id}/edit`}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" />
                แก้ไขข้อมูล
              </Link>
              <form action={deleteInstructor}>
                <input type="hidden" name="id" value={instructor.id} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  ลบวิทยากร
                </button>
              </form>
            </div>
          )}
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-2.5 text-sm">
            <Mail className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">{instructor.email ?? "-"}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <Phone className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">{instructor.telNo ?? "-"}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <Building2 className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">
              {instructor.affiliation ?? "-"}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <IdCard className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">
              {instructor.afcInstructorId ?? "-"}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-sm sm:col-span-2 lg:col-span-2">
            <GraduationCap className="h-4 w-4 shrink-0 text-slate-400" />
            <div className="flex flex-wrap gap-1.5">
              {expertiseTags.length === 0 ? (
                <span className="text-slate-400">-</span>
              ) : (
                expertiseTags.map((tag) => (
                  <span
                    key={tag.label}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${tag.className}`}
                  >
                    {tag.label}
                  </span>
                ))
              )}
            </div>
          </div>
        </dl>

        {instructor.note && (
          <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {instructor.note}
          </p>
        )}
      </div>

      {/* Teaching history */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Users className="h-4 w-4" />
          </div>
          <h2 className="font-semibold text-slate-900">
            ประวัติการสอน ({instructor.licenseRecords.length})
          </h2>
        </div>

        {instructor.licenseRecords.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-400">
            ยังไม่มีประวัติการสอน
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">ผู้ฝึกสอน</th>
                  <th className="px-6 py-3">ระดับ</th>
                  <th className="px-6 py-3">ประเภท</th>
                  <th className="px-6 py-3">วันที่ออกใบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {instructor.licenseRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-3">
                      <Link
                        href={`/coaches/${record.coachId}`}
                        className="font-medium text-slate-900 hover:text-indigo-600"
                      >
                        {record.coach.nameTh} {record.coach.surnameTh}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {labelFor(LICENSE_TYPES, record.licenseType)}
                      {record.isLevelUp && (
                        <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">
                          อัปเกรด
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {labelFor(RECORD_TYPES, record.recordType)}
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {formatDate(record.issueDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
