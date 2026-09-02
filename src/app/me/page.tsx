import Link from "next/link";
import { requireCoach } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateMyProfile } from "./actions";
import { LICENSE_TYPES, RECORD_TYPES, GENDER_OPTIONS, labelFor } from "@/lib/constants";
import { getLicenseStatus, LICENSE_STATUS_STYLES } from "@/lib/license-status";
import { Field, SelectField } from "@/components/FormField";
import { ThaiAddressFields } from "@/components/ThaiAddressFields";
import { getCountryOptions, getCountryByCode, getFlagEmoji } from "@/lib/countries";
import { getProvinceOptions, getDistrictOptions, getSubdistrictOptions, formatThaiAddress } from "@/lib/thai-address";
import {
  Mail,
  Phone,
  MapPin,
  IdCard,
  Download,
  FileBadge,
  Save,
  GraduationCap,
  ShieldCheck,
  Clock3,
  AlertTriangle,
  ChevronDown,
  CheckCircle2,
  UserCircle2,
} from "lucide-react";

function formatDate(date: Date | null) {
  if (!date) return "-";
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function MyProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireCoach();
  const coachId = user.coachId!;
  const { saved } = await searchParams;

  const coach = await prisma.coach.findUnique({
    where: { id: coachId },
    include: {
      licenseRecords: { orderBy: { issueDate: "desc" } },
      employments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!coach) {
    return <p className="text-sm text-red-600">ไม่พบข้อมูลผู้ฝึกสอนของคุณ</p>;
  }

  const licenseStatuses = coach.licenseRecords.map((r) =>
    getLicenseStatus(r.expireDate)
  );
  const stats = [
    {
      label: "ใบอนุญาตทั้งหมด",
      value: coach.licenseRecords.length,
      icon: FileBadge,
      className: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "ใช้งานได้",
      value: licenseStatuses.filter((s) => s === "active").length,
      icon: ShieldCheck,
      className: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "ใกล้หมดอายุ",
      value: licenseStatuses.filter((s) => s === "expiring").length,
      icon: Clock3,
      className: "bg-amber-50 text-amber-600",
    },
    {
      label: "หมดอายุแล้ว",
      value: licenseStatuses.filter((s) => s === "expired").length,
      icon: AlertTriangle,
      className: "bg-red-50 text-red-600",
    },
  ];

  const countryOptions = getCountryOptions().map((c) => ({
    value: c.code,
    label: `${getFlagEmoji(c.code) ?? ""} ${c.nameTh}`.trim(),
  }));
  const provinces = getProvinceOptions();
  const initialDistricts = coach.provinceCode ? getDistrictOptions(coach.provinceCode) : [];
  const initialSubdistricts = coach.districtCode ? getSubdistrictOptions(coach.districtCode) : [];
  const country = getCountryByCode(coach.nationalityCode);
  const fullNameEn = [coach.nameEn, coach.familyNameEn].filter(Boolean).join(" ");

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative h-24 bg-linear-to-r from-indigo-700 via-indigo-600 to-indigo-800">
          <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-500 via-amber-300 to-amber-500" />
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4 px-6 pb-6">
          <div className="-mt-12 flex items-end gap-4">
            {coach.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coach.photoUrl}
                alt=""
                className="h-24 w-24 rounded-full object-cover ring-4 ring-white"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-indigo-100 text-3xl font-semibold text-indigo-700 ring-4 ring-white">
                {coach.nameTh.charAt(0)}
              </div>
            )}
            <div className="pb-1">
              <h1 className="text-xl font-bold text-slate-900">
                {coach.nameTh} {coach.surnameTh}
              </h1>
              {fullNameEn && <p className="text-sm text-slate-400">{fullNameEn}</p>}
              <p className="mt-0.5 text-sm font-medium text-indigo-600">
                {coach.afcId ?? "ไม่มี AFC ID"}
              </p>
              {coach.employments[0] && (
                <p className="text-sm text-slate-500">
                  {coach.employments[0].clubName}
                  {coach.employments[0].position &&
                    ` · ${coach.employments[0].position}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              href="/me/courses"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
            >
              <GraduationCap className="h-4 w-4" />
              สมัครเข้าอบรม
            </Link>
            <Link
              href="/me/card"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              <IdCard className="h-4 w-4" />
              บัตรประจำตัว
            </Link>
          </div>
        </div>

        {(country || coach.gender) && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-6 py-3">
            {country && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                {getFlagEmoji(coach.nationalityCode)} {country.nameTh}
              </span>
            )}
            {coach.gender && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                <UserCircle2 className="h-3.5 w-3.5" />
                {labelFor(GENDER_OPTIONS, coach.gender)}
              </span>
            )}
          </div>
        )}

        <dl className="grid grid-cols-1 gap-3 border-t border-slate-100 px-6 py-5 sm:grid-cols-3">
          <div className="flex items-center gap-2.5 text-sm">
            <Mail className="h-4 w-4 flex-none text-slate-400" />
            <span className="truncate text-slate-600">
              {coach.email ?? "-"}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <Phone className="h-4 w-4 flex-none text-slate-400" />
            <span className="text-slate-600">{coach.telNo ?? "-"}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <MapPin className="h-4 w-4 flex-none text-slate-400" />
            <span className="text-slate-600">
              {formatThaiAddress(coach) ?? coach.residence ?? "-"}
            </span>
          </div>
        </dl>
      </div>

      {saved && (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 flex-none" />
          บันทึกข้อมูลเรียบร้อยแล้ว
        </p>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, className }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div
              className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${className}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold leading-tight text-slate-900">
                {value}
              </p>
              <p className="truncate text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Licenses */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <FileBadge className="h-4 w-4" />
          </div>
          <h2 className="font-semibold text-slate-900">ใบอนุญาตของฉัน</h2>
        </div>
        {coach.licenseRecords.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-400">
            ยังไม่มีใบอนุญาต
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            {coach.licenseRecords.map((record) => {
              const status = getLicenseStatus(record.expireDate);
              const style = LICENSE_STATUS_STYLES[status];
              return (
                <div
                  key={record.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">
                        {labelFor(LICENSE_TYPES, record.licenseType)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {labelFor(RECORD_TYPES, record.recordType)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex flex-none items-center rounded-full px-2.5 py-1 text-xs font-medium ${style.className}`}
                    >
                      {style.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    ออก {formatDate(record.issueDate)} · หมดอายุ{" "}
                    {formatDate(record.expireDate)}
                  </p>
                  <a
                    href={`/me/certificate/${record.id}`}
                    className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    ใบประกาศ
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* แก้ไขข้อมูลส่วนตัว — บันทึกได้ทันทีโดยไม่ต้องรอแอดมินอนุมัติ */}
      <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm" open>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Save className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-slate-900">แก้ไขข้อมูลส่วนตัว</h2>
          </div>
          <ChevronDown className="h-4 w-4 flex-none text-slate-400 transition-transform group-open:rotate-180" />
        </summary>

        <div className="border-t border-slate-100">
          <form action={updateMyProfile} className="space-y-6 p-6">
            <p className="text-sm text-slate-500">
              แก้ไขข้อมูลด้านล่างแล้วกดบันทึก — มีผลทันที (ชื่อภาษาไทย เลขบัตรประชาชน และวันเกิด
              เป็นข้อมูลยืนยันตัวตน หากผิดพลาดกรุณาติดต่อผู้ดูแลระบบ)
            </p>

            <label className="flex flex-col gap-1.5 sm:w-64">
              <span className="text-sm font-medium text-slate-700">
                รูปถ่าย{" "}
                {coach.photoUrl && <span className="text-slate-400">(อัปโหลดใหม่เพื่อแทนที่รูปเดิม)</span>}
              </span>
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
      </details>
    </div>
  );
}
