import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createInstructor, deleteInstructor } from "./actions";
import { Field, SelectField, CheckboxField } from "@/components/FormField";
import { LICENSE_TYPES, labelFor } from "@/lib/constants";
import { UserPlus, Users, Pencil, Trash2 } from "lucide-react";

export default async function InstructorsPage() {
  const [instructors, user] = await Promise.all([
    prisma.instructor.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { licenseRecords: true } } },
    }),
    getCurrentUser(),
  ]);
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">วิทยากร</h1>
        <p className="mt-1 text-sm text-slate-500">
          ทำเนียบวิทยากรผู้สอนหลักสูตรอบรมผู้ฝึกสอน
        </p>
      </div>

      {isAdmin && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <UserPlus className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-slate-900">เพิ่มวิทยากรใหม่</h2>
          </div>
          <form action={createInstructor} className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
                <span className="text-sm font-medium text-slate-700">
                  รูปถ่าย
                </span>
                <input
                  name="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-600"
                />
              </label>
              <Field
                label="ชื่อ-นามสกุล"
                name="name"
                required
                placeholder="วิทยากร สมมติ"
              />
              <Field label="อีเมล" name="email" type="email" />
              <Field label="เบอร์โทร" name="telNo" />
              <Field
                label="สังกัด"
                name="affiliation"
                placeholder="สมาคมกีฬาฟุตบอลแห่งประเทศไทย"
              />
              <Field
                label="เลขบัตร/ใบอนุญาตวิทยากร AFC"
                name="afcInstructorId"
              />
              <SelectField
                label="ระดับสูงสุดที่สอนได้"
                name="maxLevel"
                options={LICENSE_TYPES}
              />
              <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-3">
                <span className="text-sm font-medium text-slate-700">
                  ความเชี่ยวชาญ
                </span>
                <div className="flex flex-wrap gap-4">
                  <CheckboxField label="AFC Core Program" name="teachesCore" />
                  <CheckboxField
                    label="AFC Goalkeeper Coaching"
                    name="teachesGoalkeeper"
                  />
                  <CheckboxField
                    label="AFC Fitness Coaching"
                    name="teachesFitness"
                  />
                </div>
              </div>
              <label className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
                <span className="text-sm font-medium text-slate-700">
                  หมายเหตุ
                </span>
                <textarea
                  name="note"
                  rows={2}
                  className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </label>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
            >
              <UserPlus className="h-4 w-4" />
              เพิ่มวิทยากร
            </button>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {instructors.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Users className="h-6 w-6" />
            </div>
            <p className="text-sm text-slate-500">ยังไม่มีข้อมูลวิทยากร</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">ชื่อ-นามสกุล</th>
                  <th className="px-6 py-3.5">ความเชี่ยวชาญ</th>
                  <th className="px-6 py-3.5">ระดับสูงสุด</th>
                  <th className="px-6 py-3.5">ติดต่อ</th>
                  <th className="px-6 py-3.5">สอนแล้ว</th>
                  <th className="px-6 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {instructors.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/instructors/${inst.id}`}
                        className="flex items-center gap-3"
                      >
                        {inst.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={inst.photoUrl}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                            {inst.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900 hover:text-indigo-600">
                            {inst.name}
                          </p>
                          {inst.affiliation && (
                            <p className="text-xs text-slate-400">
                              {inst.affiliation}
                            </p>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {inst.teachesCore && (
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">
                            Core
                          </span>
                        )}
                        {inst.teachesGoalkeeper && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">
                            Goalkeeper
                          </span>
                        )}
                        {inst.teachesFitness && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-600">
                            Fitness
                          </span>
                        )}
                        {!inst.teachesCore &&
                          !inst.teachesGoalkeeper &&
                          !inst.teachesFitness && (
                            <span className="text-slate-400">-</span>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {inst.maxLevel
                        ? labelFor(LICENSE_TYPES, inst.maxLevel)
                        : "-"}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {inst.email ?? inst.telNo ?? "-"}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {inst._count.licenseRecords}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {isAdmin && (
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/instructors/${inst.id}/edit`}
                            aria-label="แก้ไขข้อมูลวิทยากร"
                            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <form action={deleteInstructor}>
                            <input type="hidden" name="id" value={inst.id} />
                            <button
                              type="submit"
                              aria-label="ลบวิทยากร"
                              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </form>
                        </div>
                      )}
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
