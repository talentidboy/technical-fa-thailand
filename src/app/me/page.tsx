import Link from "next/link";
import { requireCoach } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LICENSE_TYPES, RECORD_TYPES, GENDER_OPTIONS, labelFor } from "@/lib/constants";
import { getLicenseStatus, LICENSE_STATUS_STYLES } from "@/lib/license-status";
import { getCountryByCode, getFlagEmoji } from "@/lib/countries";
import { formatThaiAddress } from "@/lib/thai-address";
import { Reveal } from "@/components/g15/Reveal";
import { AnimatedCounter } from "@/components/g15/AnimatedCounter";
import {
  Mail,
  Phone,
  MapPin,
  IdCard,
  Download,
  FileBadge,
  Pencil,
  GraduationCap,
  ShieldCheck,
  Clock3,
  AlertTriangle,
  CheckCircle2,
  UserCircle2,
  Briefcase,
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
      employments: { orderBy: { createdAt: "desc" } },
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

  const country = getCountryByCode(coach.nationalityCode);
  const fullNameEn = [coach.nameEn, coach.familyNameEn].filter(Boolean).join(" ");

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <Reveal>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-24 overflow-hidden bg-linear-to-r from-indigo-700 via-indigo-600 to-indigo-800">
            <div className="absolute inset-x-0 top-0 h-1 animate-shimmer-slide bg-linear-to-r from-amber-600 via-amber-200 via-50% to-amber-600 bg-size-[200%_100%]" />
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
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md"
              >
                <GraduationCap className="h-4 w-4" />
                สมัครเข้าอบรม
              </Link>
              <Link
                href="/me/card"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm"
              >
                <IdCard className="h-4 w-4" />
                บัตรประจำตัว
              </Link>
              <Link
                href="/me/edit"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm"
              >
                <Pencil className="h-4 w-4" />
                แก้ไขข้อมูล
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
      </Reveal>

      {saved && (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 flex-none" />
          บันทึกข้อมูลเรียบร้อยแล้ว
        </p>
      )}

      {/* Quick stats */}
      <Reveal delay={80}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, className }) => (
            <div
              key={label}
              className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${className}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-tight text-slate-900">
                  <AnimatedCounter value={value} />
                </p>
                <p className="truncate text-xs text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Licenses */}
      <Reveal delay={120}>
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
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
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
                      เลขที่ใบประกาศ: {record.certificateNo ?? "-"}
                    </p>
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
      </Reveal>

      {/* Employment history */}
      <Reveal delay={160}>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Briefcase className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-slate-900">ประวัติการทำงาน</h2>
          </div>
          {coach.employments.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">
              ยังไม่มีประวัติการทำงาน
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {coach.employments.map((emp) => (
                <li
                  key={emp.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 transition-colors hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">{emp.clubName}</p>
                    <p className="text-xs text-slate-500">
                      {[emp.division, emp.position].filter(Boolean).join(" · ") || "-"}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(emp.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Reveal>
    </div>
  );
}
