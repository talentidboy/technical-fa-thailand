import { coachName, coachInitial } from "@/lib/coach-name";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Users, ArrowUpRight, Bell } from "lucide-react";
import { DashboardHero } from "@/components/DashboardHero";
import { LICENSE_TYPES, labelFor, CORE_LICENSE_PROGRESSION } from "@/lib/constants";
import { getLicenseStatus, LICENSE_STATUS_STYLES } from "@/lib/license-status";
import { getHeroSummary } from "@/lib/coach-query";

type DashboardSearchParams = {
  window?: string;
};

const CORE_TIERS_TOP_DOWN = [...CORE_LICENSE_PROGRESSION].reverse();
const SIDE_LICENSE_TYPES = LICENSE_TYPES.map((t) => t.value).filter(
  (v) => !CORE_LICENSE_PROGRESSION.includes(v),
);

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const params = await searchParams;
  const alertWindowMonths = params.window === "6" ? 6 : 3;

  const now = new Date();
  const alertWindowDate = new Date(now);
  alertWindowDate.setMonth(alertWindowDate.getMonth() + alertWindowMonths);

  const [recentCoaches, expiringLicenses, heroSummary] = await Promise.all([
    prisma.coach.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { licenseRecords: true } } },
    }),
    prisma.licenseRecord.findMany({
      where: { expireDate: { gte: now, lte: alertWindowDate } },
      orderBy: { expireDate: "asc" },
      include: { coach: true },
      take: 20,
    }),
    getHeroSummary(CORE_TIERS_TOP_DOWN, SIDE_LICENSE_TYPES),
  ]);

  return (
    <div className="space-y-8">
      <DashboardHero summary={heroSummary} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
      {/* ใบอนุญาตใกล้หมดอายุ */}
      <div id="expiring" className="scroll-mt-24 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 xl:col-span-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Bell className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">ใบอนุญาตใกล้หมดอายุ</h2>
              <p className="text-xs text-slate-400">{expiringLicenses.length} รายการ ภายใน {alertWindowMonths} เดือน</p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 text-sm">
            <Link
              href="/dashboard?window=3"
              className={`rounded-md px-3 py-1 font-medium ${
                alertWindowMonths === 3
                  ? "bg-white shadow-sm text-slate-900"
                  : "text-slate-500"
              }`}
            >
              3 เดือน
            </Link>
            <Link
              href="/dashboard?window=6"
              className={`rounded-md px-3 py-1 font-medium ${
                alertWindowMonths === 6
                  ? "bg-white shadow-sm text-slate-900"
                  : "text-slate-500"
              }`}
            >
              6 เดือน
            </Link>
          </div>
        </div>

        {expiringLicenses.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-400">
            ไม่มีใบอนุญาตที่ใกล้หมดอายุภายใน {alertWindowMonths} เดือนนี้
          </p>
        ) : (
          <ul className="max-h-128 divide-y divide-slate-100 overflow-y-auto overscroll-contain">
            {expiringLicenses.map((record) => {
              const style =
                LICENSE_STATUS_STYLES[getLicenseStatus(record.expireDate)];
              const daysLeft = Math.ceil(
                (record.expireDate!.getTime() - now.getTime()) /
                  (1000 * 60 * 60 * 24),
              );
              return (
                <li key={record.id}>
                  <Link
                    href={`/coaches/${record.coachId}`}
                    className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-slate-50"
                  >
                    <span
                      className={`flex h-11 w-11 flex-none flex-col items-center justify-center rounded-xl leading-none ${
                        daysLeft <= 30 ? "bg-red-50 text-red-600" : daysLeft <= 90 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <span className="text-base font-extrabold">{daysLeft}</span>
                      <span className="text-[9px] font-semibold">วัน</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {coachName(record.coach)}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {labelFor(LICENSE_TYPES, record.licenseType)} · หมดอายุ{" "}
                        {record.expireDate!.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <span className={`flex-none rounded-full px-2.5 py-1 text-xs font-medium ${style.className}`}>{style.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ผู้ฝึกสอนที่เพิ่มล่าสุด */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 xl:col-span-2">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="h-4.5 w-4.5" />
            </div>
            <h2 className="font-bold text-slate-900">ผู้ฝึกสอนที่เพิ่มล่าสุด</h2>
          </div>
          <Link
            href="/coaches"
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            ดูทั้งหมด
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentCoaches.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-400">
            ยังไม่มีข้อมูลผู้ฝึกสอน — เริ่มเพิ่มข้อมูลแรกของคุณได้เลย
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentCoaches.map((coach) => (
              <li
                key={coach.id}
                className="flex items-center justify-between gap-3 px-6 py-3.5 transition-colors hover:bg-slate-50"
              >
                <Link
                  href={`/coaches/${coach.id}`}
                  className="flex min-w-0 items-center gap-3"
                >
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-linear-to-br from-indigo-600 to-indigo-800 text-sm font-bold text-white">
                    {coachInitial(coach)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 hover:text-indigo-600">
                      {coachName(coach)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {coach.afcId ?? "ไม่มี AFC ID"}
                    </p>
                  </div>
                </Link>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {coach._count.licenseRecords} ใบอนุญาต
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>
    </div>
  );
}
