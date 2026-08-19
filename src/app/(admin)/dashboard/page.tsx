import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Users,
  FileBadge,
  AlertTriangle,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Bell,
  BarChart3,
} from "lucide-react";
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
  const ninetyDaysFromNow = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 90);
  const alertWindowDate = new Date(now);
  alertWindowDate.setMonth(alertWindowDate.getMonth() + alertWindowMonths);

  const [
    coachCount,
    licenseCount,
    expiringSoonCount,
    recentCoaches,
    expiringLicenses,
    heroSummary,
  ] = await Promise.all([
    prisma.coach.count(),
    prisma.licenseRecord.count(),
    prisma.licenseRecord.count({
      where: { expireDate: { gte: now, lte: ninetyDaysFromNow } },
    }),
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

  const stats = [
    {
      label: "ผู้ฝึกสอนทั้งหมด",
      value: coachCount,
      icon: Users,
      accent: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "ใบอนุญาตทั้งหมด",
      value: licenseCount,
      icon: FileBadge,
      accent: "bg-slate-100 text-slate-600",
    },
    {
      label: "ใบอนุญาตใกล้หมดอายุ (90 วัน)",
      value: expiringSoonCount,
      icon: AlertTriangle,
      accent: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="space-y-8">
      <DashboardHero summary={heroSummary} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            แดชบอร์ดภาพรวม
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            สรุปข้อมูลผู้ฝึกสอนและใบอนุญาตทั้งหมดในระบบ
          </p>
        </div>
        <Link
          href="/coaches"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          เพิ่มผู้ฝึกสอน
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, accent }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className={`inline-flex rounded-xl p-2.5 ${accent}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Alert dashboard */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Bell className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-slate-900">
              ใบอนุญาตที่ใกล้หมดอายุ
            </h2>
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
          <ul className="divide-y divide-slate-100">
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
                    className="flex items-center justify-between px-6 py-3 hover:bg-slate-50/60"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {record.coach.nameTh} {record.coach.surnameTh}
                      </p>
                      <p className="text-xs text-slate-400">
                        {labelFor(LICENSE_TYPES, record.licenseType)} · เหลือ{" "}
                        {daysLeft} วัน
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${style.className}`}
                    >
                      {style.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Link
        href="/dashboard/report"
        className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-linear-to-r from-indigo-600 to-indigo-700 p-6 shadow-sm shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-white/15 text-white">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-white">รายงานเชิงลึกผู้ฝึกสอน</h2>
            <p className="mt-0.5 text-sm text-indigo-200">
              กรอง ค้นหา และดูกราฟวิเคราะห์ข้อมูลผู้ฝึกสอนทั้งระบบแบบละเอียด
            </p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 flex-none text-indigo-200 transition-transform group-hover:translate-x-1" />
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">ผู้ฝึกสอนล่าสุด</h2>
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
                className="flex items-center justify-between px-6 py-4"
              >
                <Link
                  href={`/coaches/${coach.id}`}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                    {coach.nameTh.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 hover:text-indigo-600">
                      {coach.nameTh} {coach.surnameTh}
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
  );
}
