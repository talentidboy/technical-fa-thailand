import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { registerCoach } from "./actions";
import { Field, SelectField } from "@/components/FormField";
import { ThaiAddressFields } from "@/components/ThaiAddressFields";
import { GENDER_OPTIONS } from "@/lib/constants";
import { getCountryOptions, getFlagEmoji } from "@/lib/countries";
import { getProvinceOptions } from "@/lib/thai-address";
import { LOGO_URL, COVER_URL } from "@/lib/brand";
import { ArrowLeft, UserPlus } from "lucide-react";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    redirect(currentUser.role === "COACH" ? "/me" : "/");
  }

  const { error } = await searchParams;

  const countryOptions = getCountryOptions().map((c) => ({
    value: c.code,
    label: `${getFlagEmoji(c.code) ?? ""} ${c.nameTh}`.trim(),
  }));
  const provinces = getProvinceOptions();

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-10">
      <div className="fixed inset-0 -z-10">
        <Image
          src={COVER_URL}
          alt="สำนักงานสมาคมกีฬาฟุตบอลแห่งประเทศไทย"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-br from-indigo-950/90 via-indigo-900/85 to-indigo-700/90" />
      </div>
      <div className="fixed inset-x-0 top-0 h-1 bg-linear-to-r from-amber-600 via-amber-400 to-amber-600" />

      <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="h-1.5 bg-linear-to-r from-amber-500 via-amber-300 to-amber-500" />
        <div className="p-8">
          <Link
            href="/coach-center/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            กลับไปเข้าสู่ระบบ
          </Link>

          <div className="mt-4 flex flex-col items-center gap-2 text-center">
            <Image
              src={LOGO_URL}
              alt="FA Thailand"
              width={48}
              height={48}
              className="h-12 w-12 rounded-xl shadow-sm ring-4 ring-amber-400/30"
            />
            <h2 className="mt-2 text-lg font-bold text-slate-900">
              FA Thailand Technical
            </h2>
            <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
              สมัครสมาชิกผู้ฝึกสอน
            </p>
            <p className="max-w-lg text-sm text-slate-500">
              ระบบจะยืนยันตัวตนกับข้อมูลผู้ฝึกสอนที่มีอยู่ในระบบอยู่แล้ว (นำเข้าโดยเจ้าหน้าที่) กรุณากรอกเลขบัตรประชาชน
              พร้อมเบอร์โทรและวันเกิดให้ตรงกับข้อมูลเดิม ส่วนข้อมูลอื่นๆ กรอกเพิ่มเติมเพื่อความสมบูรณ์ของโปรไฟล์
            </p>
          </div>

          <form action={registerCoach} className="mt-6 space-y-6">
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">ข้อมูลยืนยันตัวตน</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="ชื่อ (ไทย)" name="nameTh" required placeholder="สมชาย" />
                <Field label="นามสกุล (ไทย)" name="surnameTh" required placeholder="ใจดี" />
                <Field
                  label="เลขบัตรประชาชน"
                  name="idNumber"
                  required
                  inputMode="numeric"
                  maxLength={13}
                  placeholder="13 หลัก"
                />
                <Field label="เบอร์โทรศัพท์" name="telNo" type="tel" required placeholder="08x-xxx-xxxx" />
                <Field label="วันเกิด" name="dob" type="date" required />
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">ข้อมูลส่วนตัวเพิ่มเติม</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700">รูปถ่าย</span>
                  <input
                    name="photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-600"
                  />
                </label>
                <Field label="ชื่อ (อังกฤษ)" name="nameEn" placeholder="Somchai" />
                <Field label="นามสกุล (อังกฤษ)" name="familyNameEn" placeholder="Jaidee" />
                <SelectField label="เพศ" name="gender" options={GENDER_OPTIONS} />
                <SelectField label="สัญชาติ" name="nationalityCode" options={countryOptions} defaultValue="TH" />
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">ที่อยู่ปัจจุบัน</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ThaiAddressFields provinces={provinces} />
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">บัญชีเข้าสู่ระบบ</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="อีเมล" name="email" type="email" required placeholder="coach@example.com" />
                <Field label="รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)" name="password" type="password" required />
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
            >
              <UserPlus className="h-4 w-4" />
              สมัครสมาชิก
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
