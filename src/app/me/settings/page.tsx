import { coachInitial } from "@/lib/coach-name";
import Link from "next/link";
import { requireCoach } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logout } from "@/app/login/actions";
import { updateMyProfile } from "../actions";
import { changeMyPassword } from "./actions";
import { Field, SelectField } from "@/components/FormField";
import { ThaiAddressFields } from "@/components/ThaiAddressFields";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { GENDER_OPTIONS } from "@/lib/constants";
import { getCountryOptions, getFlagEmoji } from "@/lib/countries";
import { getProvinceOptions, getDistrictOptions, getSubdistrictOptions } from "@/lib/thai-address";
import { ArrowLeft, Save, UserRound, ShieldCheck, KeyRound, LogOut, CheckCircle2, Mail, BadgeCheck } from "lucide-react";

function formatDate(date: Date | null) {
  if (!date) return "-";
  return date.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
}

// แสดงเลขบัตรแค่ 4 ตัวท้าย (ข้อมูลอ่อนไหว)
function maskId(value: string | null) {
  if (!value) return "-";
  const digits = value.replace(/\s|-/g, "");
  return digits.length <= 4 ? "••••" : `${"•".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}

const SECTIONS = [
  { id: "profile", label: "ข้อมูลส่วนตัว", icon: UserRound },
  { id: "identity", label: "ข้อมูลยืนยันตัวตน", icon: BadgeCheck },
  { id: "security", label: "บัญชีและรหัสผ่าน", icon: KeyRound },
];

// ตั้งค่า — รวมข้อมูลทุกอย่างของผู้ฝึกสอนไว้ที่เดียว: แก้ไขข้อมูลส่วนตัว, ดูข้อมูลยืนยันตัวตน, บัญชี/เปลี่ยนรหัสผ่าน
export default async function CoachSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const user = await requireCoach();
  const { saved } = await searchParams;
  const coach = await prisma.coach.findUnique({ where: { id: user.coachId! } });
  if (!coach) return <p className="text-sm text-red-600">ไม่พบข้อมูลผู้ฝึกสอนของคุณ</p>;

  const countryOptions = getCountryOptions().map((c) => ({ value: c.code, label: `${getFlagEmoji(c.code) ?? ""} ${c.nameTh}`.trim() }));
  const provinces = getProvinceOptions();
  const initialDistricts = coach.provinceCode ? getDistrictOptions(coach.provinceCode) : [];
  const initialSubdistricts = coach.districtCode ? getSubdistrictOptions(coach.districtCode) : [];

  const card = "scroll-mt-24 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200";
  const head = (Icon: typeof UserRound, title: string, desc: string, tone: string) => (
    <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
      <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h2 className="font-bold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-sm text-slate-500">{desc}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/me" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          กลับหน้าแรก
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900">ตั้งค่า</h1>
        <p className="text-sm text-slate-500">จัดการข้อมูลส่วนตัว ข้อมูลยืนยันตัวตน และรหัสผ่านของคุณ</p>
      </div>

      {saved === "profile" && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 flex-none" />
          บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        {/* เมนูหมวด — จอใหญ่ติดด้านซ้าย, มือถือเป็นแถบเลื่อนแนวนอน */}
        <nav className="no-scrollbar flex min-w-0 gap-2 overflow-x-auto lg:sticky lg:top-24 lg:flex-col lg:self-start lg:overflow-visible">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className="inline-flex flex-none items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 transition-colors hover:text-indigo-700 hover:ring-indigo-200"
            >
              <Icon className="h-4 w-4" />
              {label}
            </a>
          ))}
          <form action={logout} className="flex-none lg:mt-2">
            <button
              type="submit"
              className="inline-flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </button>
          </form>
        </nav>

        <div className="min-w-0 space-y-6">
          {/* ข้อมูลส่วนตัว (แก้ไขได้) */}
          <section id="profile" className={card}>
            {head(UserRound, "ข้อมูลส่วนตัว", "รูปถ่าย ชื่อภาษาอังกฤษ ช่องทางติดต่อ และที่อยู่ — บันทึกแล้วมีผลทันที", "bg-indigo-50 text-indigo-600")}
            <form action={updateMyProfile} className="space-y-6 p-5 sm:p-6">
              <input type="hidden" name="from" value="settings" />
              <div className="flex flex-wrap items-center gap-4">
                {coach.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coach.photoUrl} alt="" className="h-20 w-20 rounded-2xl object-cover ring-1 ring-slate-200" />
                ) : (
                  <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 text-3xl font-bold text-indigo-700">
                    {coachInitial(coach)}
                  </span>
                )}
                <label className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-700">
                    รูปถ่าย {coach.photoUrl && <span className="font-normal text-slate-400">(เลือกไฟล์ใหม่เพื่อแทนรูปเดิม)</span>}
                  </span>
                  <input
                    name="photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-700"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="ชื่อ (อังกฤษ)" name="nameEn" defaultValue={coach.nameEn ?? undefined} placeholder="Somchai" />
                <Field label="นามสกุล (อังกฤษ)" name="familyNameEn" defaultValue={coach.familyNameEn ?? undefined} placeholder="Jaidee" />
                <SelectField label="เพศ" name="gender" options={GENDER_OPTIONS} defaultValue={coach.gender ?? undefined} />
                <Field label="เบอร์โทร" name="telNo" required defaultValue={coach.telNo ?? undefined} inputMode="tel" />
                <Field label="อีเมล (รับแจ้งเตือนใบอนุญาต/ผลอบรม)" name="email" type="email" defaultValue={coach.email ?? undefined} placeholder="name@example.com" />
                <SelectField label="สัญชาติ" name="nationalityCode" options={countryOptions} defaultValue={coach.nationalityCode ?? undefined} />
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
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-700 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-800"
              >
                <Save className="h-4 w-4" />
                บันทึกข้อมูลส่วนตัว
              </button>
            </form>
          </section>

          {/* ข้อมูลยืนยันตัวตน (ดูอย่างเดียว) */}
          <section id="identity" className={card}>
            {head(ShieldCheck, "ข้อมูลยืนยันตัวตน", "ข้อมูลนี้ใช้ยืนยันตัวตนและออกใบอนุญาต — หากไม่ถูกต้อง กรุณาติดต่อเจ้าหน้าที่เพื่อแก้ไข", "bg-emerald-50 text-emerald-600")}
            <dl className="grid grid-cols-1 divide-y divide-slate-100 text-sm sm:grid-cols-2 sm:divide-y-0">
              {[
                { label: "ชื่อ-นามสกุล (ไทย)", value: `${coach.nameTh} ${coach.surnameTh}` },
                { label: "AFC ID", value: coach.afcId ?? "ยังไม่มี" },
                { label: "เลขบัตรประชาชน", value: maskId(coach.idNumber) },
                { label: "หนังสือเดินทาง", value: maskId(coach.passportNumber) },
                { label: "วันเกิด", value: formatDate(coach.dob) },
              ].map((r) => (
                <div key={r.label} className="px-5 py-3.5 sm:px-6 sm:[&:nth-child(n+3)]:border-t sm:[&:nth-child(n+3)]:border-slate-100">
                  <dt className="text-xs text-slate-400">{r.label}</dt>
                  <dd className="mt-0.5 break-all font-semibold text-slate-800">{r.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* บัญชีและรหัสผ่าน */}
          <section id="security" className={card}>
            {head(KeyRound, "บัญชีและรหัสผ่าน", "อีเมลสำหรับเข้าสู่ระบบ และเปลี่ยนรหัสผ่าน", "bg-amber-50 text-amber-600")}
            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                <span className="inline-flex items-center gap-2 text-slate-600">
                  <Mail className="h-4 w-4 text-slate-400" />
                  เข้าสู่ระบบด้วย <b className="text-slate-900">{user.email}</b>
                </span>
                {user.lastLoginAt && <span className="text-xs text-slate-400">เข้าสู่ระบบล่าสุด {formatDate(user.lastLoginAt)}</span>}
              </div>
              <ChangePasswordForm action={changeMyPassword} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
