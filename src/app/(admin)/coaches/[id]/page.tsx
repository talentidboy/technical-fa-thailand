import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { deleteCoach } from "../actions";
import {
  createLicenseRecord,
  confirmLicenseUpgrade,
  deleteLicenseRecord,
  createEmployment,
  deleteEmployment,
} from "./actions";
import { Field, SelectField, CheckboxField } from "@/components/FormField";
import {
  LICENSE_TYPES,
  RECORD_TYPES,
  GENDER_OPTIONS,
  labelFor,
} from "@/lib/constants";
import { getLicenseStatus, LICENSE_STATUS_STYLES } from "@/lib/license-status";
import { getHighestCoreLevel, getNextCoreLevel } from "@/lib/license-rank";
import {
  ArrowLeft,
  Trash2,
  FileBadge,
  Briefcase,
  Plus,
  Mail,
  Phone,
  MapPin,
  Cake,
  Flag,
  Pencil,
  IdCard,
  Download,
  ArrowUpCircle,
  Trophy,
} from "lucide-react";

function formatDate(date: Date | null) {
  if (!date) return "-";
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function CoachDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coachId = Number(id);

  const [coach, user, instructors] = await Promise.all([
    prisma.coach.findUnique({
      where: { id: coachId },
      include: {
        licenseRecords: {
          orderBy: { issueDate: "desc" },
          include: { instructor: true },
        },
        employments: { orderBy: { createdAt: "desc" } },
      },
    }),
    getCurrentUser(),
    prisma.instructor.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!coach) notFound();
  const isAdmin = user?.role === "ADMIN";
  const canConfirmUpgrade = user?.role === "ADMIN" || user?.role === "STAFF";

  const currentCoreLevel = getHighestCoreLevel(coach.licenseRecords);
  const nextCoreLevel = getNextCoreLevel(currentCoreLevel);
  const instructorOptions = instructors.map((inst) => ({
    value: String(inst.id),
    label: inst.name,
  }));

  return (
    <div className="space-y-8">
      <Link
        href="/coaches"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปรายชื่อผู้ฝึกสอน
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {coach.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coach.photoUrl}
                alt=""
                className="h-16 w-16 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-2xl font-semibold text-indigo-700">
                {coach.nameTh.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {coach.nameTh} {coach.surnameTh}
              </h1>
              {(coach.nameEn || coach.familyNameEn) && (
                <p className="text-sm text-slate-500">
                  {coach.nameEn} {coach.familyNameEn}
                </p>
              )}
              <p className="mt-1 text-sm text-indigo-600">
                {coach.afcId ?? "ไม่มี AFC ID"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/coaches/${coach.id}/card`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              <IdCard className="h-4 w-4" />
              บัตรประจำตัว
            </Link>
            {isAdmin && (
              <>
                <Link
                  href={`/coaches/${coach.id}/edit`}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <Pencil className="h-4 w-4" />
                  แก้ไขข้อมูล
                </Link>
                <form action={deleteCoach}>
                  <input type="hidden" name="id" value={coach.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    ลบผู้ฝึกสอน
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-2.5 text-sm">
            <Mail className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">{coach.email ?? "-"}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <Phone className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">{coach.telNo ?? "-"}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <MapPin className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">{coach.residence ?? "-"}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <Cake className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">{formatDate(coach.dob)}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <Flag className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">
              {coach.nationality ?? "-"} ·{" "}
              {labelFor(GENDER_OPTIONS, coach.gender) ?? "-"}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <span className="text-slate-400">เลขบัตร/พาสปอร์ต:</span>
            <span className="text-slate-600">
              {coach.idNumber ?? coach.passportNumber ?? "-"}
            </span>
          </div>
        </dl>
      </div>

      {/* Level upgrade */}
      {canConfirmUpgrade && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 shadow-sm">
          <div className="flex items-center gap-2 border-b border-amber-200 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              {nextCoreLevel ? (
                <ArrowUpCircle className="h-4 w-4" />
              ) : (
                <Trophy className="h-4 w-4" />
              )}
            </div>
            <h2 className="font-semibold text-slate-900">
              อัปเกรดระดับใบอนุญาต
            </h2>
          </div>

          {nextCoreLevel ? (
            <form
              action={confirmLicenseUpgrade}
              className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              <input type="hidden" name="coachId" value={coach.id} />
              <input type="hidden" name="licenseType" value={nextCoreLevel} />

              <div className="sm:col-span-2 lg:col-span-4">
                <p className="text-sm text-slate-600">
                  ระดับปัจจุบัน:{" "}
                  <span className="font-semibold text-slate-900">
                    {currentCoreLevel
                      ? labelFor(LICENSE_TYPES, currentCoreLevel)
                      : "ยังไม่มี"}
                  </span>{" "}
                  → อัปเกรดเป็นระดับ:{" "}
                  <span className="font-semibold text-amber-600">
                    {labelFor(LICENSE_TYPES, nextCoreLevel)}
                  </span>
                </p>
              </div>

              <SelectField
                label="ประเภทการได้มา"
                name="recordType"
                required
                options={RECORD_TYPES}
                defaultValue="TRAINING"
              />
              <SelectField
                label="วิทยากรผู้สอน"
                name="instructorId"
                options={instructorOptions}
              />
              <Field label="หมายเลขใบประกาศ" name="certificateNo" />
              <Field label="วันที่ออกใบ" name="issueDate" type="date" />
              <Field label="วันหมดอายุ" name="expireDate" type="date" />

              <div className="rounded-lg border border-amber-300 bg-white px-4 py-3 sm:col-span-2 lg:col-span-4">
                <CheckboxField
                  label="ยืนยันว่าผู้ฝึกสอนผ่านการอบรม/ประเมินระดับนี้แล้ว"
                  name="confirmedPass"
                  required
                />
                <p className="mt-1 pl-6 text-xs text-slate-500">
                  ระบบจะบันทึกชื่อผู้ยืนยัน ({user?.email}) ไว้กับใบอนุญาตนี้
                </p>
              </div>

              <div className="sm:col-span-2 lg:col-span-4">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-amber-200 transition-colors hover:bg-amber-700"
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  ยืนยันอัปเกรดเป็นระดับ {labelFor(LICENSE_TYPES, nextCoreLevel)}
                </button>
              </div>
            </form>
          ) : (
            <p className="px-6 py-6 text-sm text-slate-600">
              ผู้ฝึกสอนได้รับใบอนุญาตระดับสูงสุด (PRO) แล้ว ไม่มีระดับให้อัปเกรดเพิ่มเติม
            </p>
          )}
        </div>
      )}

      {/* License records */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <FileBadge className="h-4 w-4" />
          </div>
          <h2 className="font-semibold text-slate-900">ประวัติใบอนุญาต</h2>
        </div>

        {isAdmin && (
          <form
            action={createLicenseRecord}
            className="grid grid-cols-1 gap-4 border-b border-slate-100 p-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            <input type="hidden" name="coachId" value={coach.id} />
            <SelectField
              label="ระดับใบอนุญาต"
              name="licenseType"
              required
              options={LICENSE_TYPES}
            />
            <SelectField
              label="ประเภทการได้มา"
              name="recordType"
              required
              options={RECORD_TYPES}
            />
            <SelectField
              label="วิทยากรผู้สอน"
              name="instructorId"
              options={instructorOptions}
            />
            <Field label="หมายเลขใบประกาศ" name="certificateNo" />
            <Field label="วันที่ออกใบ" name="issueDate" type="date" />
            <Field label="วันหมดอายุ" name="expireDate" type="date" />
            <div className="flex items-center">
              <CheckboxField label="เป็นการอัปเกรดระดับ" name="isLevelUp" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-emerald-200 transition-colors hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                เพิ่มใบอนุญาต
              </button>
            </div>
          </form>
        )}

        {coach.licenseRecords.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-400">
            ยังไม่มีประวัติใบอนุญาต
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">ระดับ</th>
                  <th className="px-6 py-3">ประเภท</th>
                  <th className="px-6 py-3">เลขที่ใบประกาศ</th>
                  <th className="px-6 py-3">ออกเมื่อ</th>
                  <th className="px-6 py-3">หมดอายุ</th>
                  <th className="px-6 py-3">สถานะ</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coach.licenseRecords.map((record) => {
                  const status = getLicenseStatus(record.expireDate);
                  const style = LICENSE_STATUS_STYLES[status];
                  return (
                    <tr key={record.id}>
                      <td className="px-6 py-3 font-medium text-slate-900">
                        {labelFor(LICENSE_TYPES, record.licenseType)}
                        {record.isLevelUp && (
                          <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">
                            อัปเกรด
                          </span>
                        )}
                        {record.confirmedBy && (
                          <p className="mt-0.5 text-xs font-normal text-slate-400">
                            ยืนยันโดย {record.confirmedBy}
                          </p>
                        )}
                        {record.instructor && (
                          <p className="mt-0.5 text-xs font-normal text-slate-400">
                            วิทยากร: {record.instructor.name}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {labelFor(RECORD_TYPES, record.recordType)}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {record.certificateNo ?? "-"}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {formatDate(record.issueDate)}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {formatDate(record.expireDate)}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${style.className}`}
                        >
                          {style.label}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={`/coaches/${coach.id}/certificate/${record.id}`}
                            aria-label="ดาวน์โหลดใบประกาศ"
                            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          {isAdmin && (
                            <form action={deleteLicenseRecord}>
                              <input
                                type="hidden"
                                name="id"
                                value={record.id}
                              />
                              <input
                                type="hidden"
                                name="coachId"
                                value={coach.id}
                              />
                              <button
                                type="submit"
                                aria-label="ลบใบอนุญาต"
                                className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Employment history */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Briefcase className="h-4 w-4" />
          </div>
          <h2 className="font-semibold text-slate-900">ประวัติการทำงาน</h2>
        </div>

        {isAdmin && (
          <form
            action={createEmployment}
            className="grid grid-cols-1 gap-4 border-b border-slate-100 p-6 sm:grid-cols-3"
          >
            <input type="hidden" name="coachId" value={coach.id} />
            <Field label="สโมสร" name="clubName" required placeholder="..." />
            <Field label="ดิวิชัน" name="division" placeholder="..." />
            <Field label="ตำแหน่ง" name="position" placeholder="Head Coach" />
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-amber-200 transition-colors hover:bg-amber-600"
              >
                <Plus className="h-4 w-4" />
                เพิ่มประวัติการทำงาน
              </button>
            </div>
          </form>
        )}

        {coach.employments.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-400">
            ยังไม่มีประวัติการทำงาน
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">สโมสร</th>
                  <th className="px-6 py-3">ดิวิชัน</th>
                  <th className="px-6 py-3">ตำแหน่ง</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coach.employments.map((job) => (
                  <tr key={job.id}>
                    <td className="px-6 py-3 font-medium text-slate-900">
                      {job.clubName}
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {job.division ?? "-"}
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {job.position ?? "-"}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {isAdmin && (
                        <form action={deleteEmployment}>
                          <input type="hidden" name="id" value={job.id} />
                          <input
                            type="hidden"
                            name="coachId"
                            value={coach.id}
                          />
                          <button
                            type="submit"
                            aria-label="ลบประวัติการทำงาน"
                            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </form>
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
