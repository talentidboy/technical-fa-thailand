import Link from "next/link";
import { requireCoach } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateMyProfile } from "../actions";
import { Field, SelectField } from "@/components/FormField";
import { ThaiAddressFields } from "@/components/ThaiAddressFields";
import { GENDER_OPTIONS } from "@/lib/constants";
import { getCountryOptions, getFlagEmoji } from "@/lib/countries";
import { getProvinceOptions, getDistrictOptions, getSubdistrictOptions } from "@/lib/thai-address";
import { ArrowLeft, Save } from "lucide-react";

export default async function EditMyProfilePage() {
  const user = await requireCoach();
  const coachId = user.coachId!;

  const coach = await prisma.coach.findUnique({ where: { id: coachId } });
  if (!coach) {
    return <p className="text-sm text-red-600">ไม่พบข้อมูลผู้ฝึกสอนของคุณ</p>;
  }

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
        href="/me"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปหน้าโปรไฟล์
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h1 className="font-semibold text-slate-900">แก้ไขข้อมูลส่วนตัว</h1>
          <p className="mt-1 text-sm text-slate-500">
            บันทึกมีผลทันที — ชื่อภาษาไทย เลขบัตรประชาชน และวันเกิด เป็นข้อมูลยืนยันตัวตน
            หากผิดพลาดกรุณาติดต่อผู้ดูแลระบบ
          </p>
        </div>

        <form action={updateMyProfile} className="space-y-6 p-6">
          <label className="flex flex-col gap-1.5 sm:w-64">
            <span className="text-sm font-medium text-slate-700">
              รูปถ่าย{" "}
              {coach.photoUrl && <span className="text-slate-400">(อัปโหลดใหม่เพื่อแทนที่รูปเดิม)</span>}
            </span>
            {coach.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coach.photoUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
            )}
            <input
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-600"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="ชื่อ (อังกฤษ)" name="nameEn" defaultValue={coach.nameEn ?? undefined} placeholder="Somchai" />
            <Field
              label="นามสกุล (อังกฤษ)"
              name="familyNameEn"
              defaultValue={coach.familyNameEn ?? undefined}
              placeholder="Jaidee"
            />
            <SelectField label="เพศ" name="gender" options={GENDER_OPTIONS} defaultValue={coach.gender ?? undefined} />
            <Field label="เบอร์โทร" name="telNo" required defaultValue={coach.telNo ?? undefined} />
            <SelectField
              label="สัญชาติ"
              name="nationalityCode"
              options={countryOptions}
              defaultValue={coach.nationalityCode ?? undefined}
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">ที่อยู่ปัจจุบัน</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ThaiAddressFields
                provinces={provinces}
                initialProvinceCode={coach.provinceCode ?? ""}
                initialDistrictCode={coach.districtCode ?? ""}
                initialSubdistrictCode={coach.subdistrictCode ?? ""}
                initialDistricts={initialDistricts}
                initialSubdistricts={initialSubdistricts}
                legacyResidence={coach.residence}
              />
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
          >
            <Save className="h-4 w-4" />
            บันทึกการเปลี่ยนแปลง
          </button>
        </form>
      </div>
    </div>
  );
}
