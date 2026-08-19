import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { updateInstructor } from "../../actions";
import { Field, SelectField, CheckboxField } from "@/components/FormField";
import { LICENSE_TYPES } from "@/lib/constants";
import { ArrowLeft, Save } from "lucide-react";

export default async function EditInstructorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const instructorId = Number(id);

  const [instructor, user] = await Promise.all([
    prisma.instructor.findUnique({ where: { id: instructorId } }),
    getCurrentUser(),
  ]);

  if (!instructor) notFound();
  if (user?.role !== "ADMIN") redirect("/instructors");

  return (
    <div className="space-y-6">
      <Link
        href="/instructors"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปทำเนียบวิทยากร
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h1 className="font-semibold text-slate-900">
            แก้ไขข้อมูล {instructor.name}
          </h1>
        </div>
        <form action={updateInstructor} className="space-y-6 p-6">
          <input type="hidden" name="id" value={instructor.id} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
              <span className="text-sm font-medium text-slate-700">
                รูปถ่าย{" "}
                {instructor.photoUrl && (
                  <span className="text-slate-400">
                    (อัปโหลดใหม่เพื่อแทนที่รูปเดิม)
                  </span>
                )}
              </span>
              {instructor.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={instructor.photoUrl}
                  alt=""
                  className="h-16 w-16 rounded-full object-cover"
                />
              )}
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
              defaultValue={instructor.name}
            />
            <Field
              label="อีเมล"
              name="email"
              type="email"
              defaultValue={instructor.email ?? undefined}
            />
            <Field
              label="เบอร์โทร"
              name="telNo"
              defaultValue={instructor.telNo ?? undefined}
            />
            <Field
              label="สังกัด"
              name="affiliation"
              defaultValue={instructor.affiliation ?? undefined}
            />
            <Field
              label="เลขบัตร/ใบอนุญาตวิทยากร AFC"
              name="afcInstructorId"
              defaultValue={instructor.afcInstructorId ?? undefined}
            />
            <SelectField
              label="ระดับสูงสุดที่สอนได้"
              name="maxLevel"
              options={LICENSE_TYPES}
              defaultValue={instructor.maxLevel ?? undefined}
            />
            <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-3">
              <span className="text-sm font-medium text-slate-700">
                ความเชี่ยวชาญ
              </span>
              <div className="flex flex-wrap gap-4">
                <CheckboxField
                  label="AFC Core Program"
                  name="teachesCore"
                  defaultChecked={instructor.teachesCore}
                />
                <CheckboxField
                  label="AFC Goalkeeper Coaching"
                  name="teachesGoalkeeper"
                  defaultChecked={instructor.teachesGoalkeeper}
                />
                <CheckboxField
                  label="AFC Fitness Coaching"
                  name="teachesFitness"
                  defaultChecked={instructor.teachesFitness}
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
                defaultValue={instructor.note ?? undefined}
                className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </label>
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
          >
            <Save className="h-4 w-4" />
            บันทึกการแก้ไข
          </button>
        </form>
      </div>
    </div>
  );
}
