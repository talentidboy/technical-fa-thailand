import { prisma } from "@/lib/prisma";
import { getHighestLicense } from "@/lib/license-rank";
import { getLicenseStatus } from "@/lib/license-status";
import { LICENSE_TYPES, labelFor } from "@/lib/constants";
import { ShieldCheck, ShieldX, ShieldQuestion } from "lucide-react";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coach = await prisma.coach.findUnique({
    where: { id: Number(id) },
    include: { licenseRecords: true },
  });

  if (!coach) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <ShieldQuestion className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-4 font-semibold text-slate-900">ไม่พบข้อมูล</p>
          <p className="mt-1 text-sm text-slate-500">
            รหัสบัตรนี้ไม่มีอยู่ในระบบ
          </p>
        </div>
      </div>
    );
  }

  const highest = getHighestLicense(coach.licenseRecords);
  const status = highest ? getLicenseStatus(highest.expireDate) : "unknown";
  const isValid = status === "active" || status === "expiring";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        {coach.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coach.photoUrl}
            alt=""
            className="mx-auto h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700">
            {coach.nameTh.charAt(0)}
          </div>
        )}

        <h1 className="mt-4 text-lg font-bold text-slate-900">
          {coach.nameTh} {coach.surnameTh}
        </h1>
        <p className="text-sm text-slate-500">{coach.afcId ?? "ไม่มี AFC ID"}</p>

        <div
          className={`mt-5 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
            isValid
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {isValid ? (
            <ShieldCheck className="h-5 w-5" />
          ) : (
            <ShieldX className="h-5 w-5" />
          )}
          {isValid
            ? "บัตรนี้เป็นของจริง และใบอนุญาตยังไม่หมดอายุ"
            : "ใบอนุญาตของผู้ฝึกสอนนี้หมดอายุแล้ว"}
        </div>

        {highest && (
          <p className="mt-4 text-sm text-slate-600">
            ระดับใบอนุญาตสูงสุด:{" "}
            <span className="font-semibold text-slate-900">
              {labelFor(LICENSE_TYPES, highest.licenseType)}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
