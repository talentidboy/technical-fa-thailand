import Link from "next/link";
import { requireCoach } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requestProfileEdit } from "./actions";
import { LICENSE_TYPES, RECORD_TYPES, labelFor } from "@/lib/constants";
import { getLicenseStatus, LICENSE_STATUS_STYLES } from "@/lib/license-status";
import {
  Mail,
  Phone,
  MapPin,
  IdCard,
  Download,
  FileBadge,
  Send,
  GraduationCap,
} from "lucide-react";

function formatDate(date: Date | null) {
  if (!date) return "-";
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "รอตรวจสอบ",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ปฏิเสธคำขอ",
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-600",
  APPROVED: "bg-emerald-50 text-emerald-600",
  REJECTED: "bg-red-50 text-red-600",
};

export default async function MyProfilePage() {
  const user = await requireCoach();
  const coachId = user.coachId!;

  const coach = await prisma.coach.findUnique({
    where: { id: coachId },
    include: {
      licenseRecords: { orderBy: { issueDate: "desc" } },
      employments: { orderBy: { createdAt: "desc" }, take: 1 },
      profileEditRequests: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!coach) {
    return <p className="text-sm text-red-600">ไม่พบข้อมูลผู้ฝึกสอนของคุณ</p>;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {coach.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coach.photoUrl}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-semibold text-indigo-700">
                {coach.nameTh.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {coach.nameTh} {coach.surnameTh}
              </h1>
              <p className="text-sm text-indigo-600">
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
          <div className="flex flex-wrap gap-2">
            <Link
              href="/me/courses"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700"
            >
              <GraduationCap className="h-4 w-4" />
              สมัครเข้าอบรม
            </Link>
            <Link
              href="/me/card"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <IdCard className="h-4 w-4" />
              บัตรประจำตัว
            </Link>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-3 border-t border-slate-100 pt-6 sm:grid-cols-2">
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
        </dl>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <FileBadge className="h-4 w-4" />
          </div>
          <h2 className="font-semibold text-slate-900">ใบอนุญาตของฉัน</h2>
        </div>
        {coach.licenseRecords.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-400">
            ยังไม่มีใบอนุญาต
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {coach.licenseRecords.map((record) => {
              const status = getLicenseStatus(record.expireDate);
              const style = LICENSE_STATUS_STYLES[status];
              return (
                <li
                  key={record.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {labelFor(LICENSE_TYPES, record.licenseType)}{" "}
                      <span className="text-xs text-slate-400">
                        ({labelFor(RECORD_TYPES, record.recordType)})
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      ออก {formatDate(record.issueDate)} · หมดอายุ{" "}
                      {formatDate(record.expireDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${style.className}`}
                    >
                      {style.label}
                    </span>
                    <a
                      href={`/me/certificate/${record.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      ใบประกาศ
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Send className="h-4 w-4" />
          </div>
          <h2 className="font-semibold text-slate-900">ขอแก้ไขข้อมูล</h2>
        </div>
        <form action={requestProfileEdit} className="space-y-4 p-6">
          <p className="text-sm text-slate-500">
            หากข้อมูลด้านล่างผิด แก้ไขให้ถูกต้องแล้วกดส่งคำขอ
            แอดมินจะตรวจสอบและอนุมัติ
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">
                อีเมล
              </span>
              <input
                name="email"
                type="email"
                defaultValue={coach.email ?? ""}
                className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">
                เบอร์โทร
              </span>
              <input
                name="telNo"
                defaultValue={coach.telNo ?? ""}
                className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">
                จังหวัดที่พำนัก
              </span>
              <input
                name="residence"
                defaultValue={coach.residence ?? ""}
                className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">
                สัญชาติ
              </span>
              <input
                name="nationality"
                defaultValue={coach.nationality ?? ""}
                className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">
              ข้อความเพิ่มเติม (ถ้ามี)
            </span>
            <textarea
              name="message"
              rows={3}
              className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
          >
            <Send className="h-4 w-4" />
            ส่งคำขอแก้ไข
          </button>
        </form>

        {coach.profileEditRequests.length > 0 && (
          <div className="border-t border-slate-100 px-6 py-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              ประวัติคำขอล่าสุด
            </p>
            <ul className="space-y-2">
              {coach.profileEditRequests.map((req) => (
                <li
                  key={req.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-slate-500">
                    {formatDate(req.createdAt)}
                    {req.message && ` · ${req.message}`}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[req.status]}`}
                  >
                    {STATUS_LABEL[req.status]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
