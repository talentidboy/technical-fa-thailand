import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { updateCoach } from "../../actions";
import { Field, SelectField } from "@/components/FormField";
import { ThaiAddressFields } from "@/components/ThaiAddressFields";
import { GENDER_OPTIONS } from "@/lib/constants";
import { getCountryOptions, getFlagEmoji } from "@/lib/countries";
import { getProvinceOptions, getDistrictOptions, getSubdistrictOptions } from "@/lib/thai-address";
import { ArrowLeft, Save } from "lucide-react";

function toDateInput(date: Date | null) {
  if (!date) return undefined;
  return date.toISOString().slice(0, 10);
}

export default async function EditCoachPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coachId = Number(id);

  const [coach, user] = await Promise.all([
    prisma.coach.findUnique({ where: { id: coachId } }),
    getCurrentUser(),
  ]);

  if (!coach) notFound();
  if (user?.role !== "ADMIN") redirect(`/coaches/${coachId}`);

  const countryOptions = getCountryOptions().map((c) => ({
    value: c.code,
    label: `${getFlagEmoji(c.code) ?? ""} ${c.nameTh}`.trim(),
  }));
  const provinces = getProvinceOptions();
  const initialDistricts = coach.provinceCode ? getDistrictOptions(coach.provinceCode) : [];
  const initialSubdistricts = coach.districtCode ? getSubdistrictOptions(coach.districtCode) : [];

  return (
    <div className="space-y-6">
      <Link
        href={`/coaches/${coach.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปหน้าโปรไฟล์
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h1 className="font-semibold text-slate-900">
            แก้ไขข้อมูล {coach.nameTh} {coach.surnameTh}
          </h1>
        </div>
        <form action={updateCoach} className="space-y-6 p-6">
          <input type="hidden" name="id" value={coach.id} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
              <span className="text-sm font-medium text-slate-700">
                รูปถ่าย{" "}
                {coach.photoUrl && (
                  <span className="text-slate-400">
                    (อัปโหลดใหม่เพื่อแทนที่รูปเดิม)
                  </span>
                )}
              </span>
              {coach.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coach.photoUrl}
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
              label="ชื่อ (ไทย)"
              name="nameTh"
              required
              defaultValue={coach.nameTh}
            />
            <Field
              label="นามสกุล (ไทย)"
              name="surnameTh"
              required
              defaultValue={coach.surnameTh}
            />
            <Field
              label="ชื่อ (อังกฤษ)"
              name="nameEn"
              defaultValue={coach.nameEn ?? undefined}
            />
            <Field
              label="นามสกุล (อังกฤษ)"
              name="familyNameEn"
              defaultValue={coach.familyNameEn ?? undefined}
            />
            <SelectField
              label="เพศ"
              name="gender"
              options={GENDER_OPTIONS}
              defaultValue={coach.gender ?? undefined}
            />
            <Field
              label="วันเกิด"
              name="dob"
              type="date"
              defaultValue={toDateInput(coach.dob)}
            />
            <div className="flex flex-col gap-1.5">
              <SelectField
                label="สัญชาติ"
                name="nationalityCode"
                options={countryOptions}
                defaultValue={coach.nationalityCode ?? undefined}
              />
              {!coach.nationalityCode && coach.nationality && (
                <span className="text-xs text-slate-400">
                  ข้อมูลเดิม: {coach.nationality} (ยังไม่ได้ระบุในรูปแบบใหม่)
                </span>
              )}
            </div>
            <ThaiAddressFields
              provinces={provinces}
              initialProvinceCode={coach.provinceCode ?? ""}
              initialDistrictCode={coach.districtCode ?? ""}
              initialSubdistrictCode={coach.subdistrictCode ?? ""}
              initialDistricts={initialDistricts}
              initialSubdistricts={initialSubdistricts}
              legacyResidence={coach.residence}
            />
            <Field
              label="AFC ID"
              name="afcId"
              defaultValue={coach.afcId ?? undefined}
            />
            <Field
              label="เลขบัตรประชาชน"
              name="idNumber"
              defaultValue={coach.idNumber ?? undefined}
            />
            <Field
              label="เลขพาสปอร์ต"
              name="passportNumber"
              defaultValue={coach.passportNumber ?? undefined}
            />
            <Field
              label="อีเมล"
              name="email"
              type="email"
              defaultValue={coach.email ?? undefined}
            />
            <Field
              label="เบอร์โทร"
              name="telNo"
              defaultValue={coach.telNo ?? undefined}
            />
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
