import Link from "next/link";
import {
  Search,
  UserPlus,
  Download,
  Bell,
  Users,
  GraduationCap,
  AlertTriangle,
  Inbox,
  Clock,
} from "lucide-react";
import { AdminTabs } from "@/components/AdminTabs";
import { LICENSE_TYPES, labelFor } from "@/lib/constants";

type ExpiringLicense = {
  id: number;
  coachId: number;
  coachName: string;
  licenseType: string;
  expireDate: Date | null;
};

type PendingRequest = {
  id: number;
  coachName: string;
  createdAt: Date;
};

function formatDate(date: Date) {
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

export function AdminTopBar({
  role,
  coachCount,
  instructorCount,
  expiringSoonCount,
  expiringSoon,
  pendingRequestCount,
  pendingRequests,
}: {
  role: string;
  coachCount: number;
  instructorCount: number;
  expiringSoonCount: number;
  expiringSoon: ExpiringLicense[];
  pendingRequestCount: number;
  pendingRequests: PendingRequest[];
}) {
  const notificationCount =
    expiringSoonCount + (role === "ADMIN" ? pendingRequestCount : 0);

  return (
    <div className="mb-6 space-y-3">
      {/* แถวค้นหา + ปุ่มลัด + แจ้งเตือน */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <form action="/coaches" className="relative min-w-50 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            name="q"
            placeholder="ค้นหาชื่อ, ID AFC, สโมสร..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </form>

        <Link
          href="/coaches"
          className="inline-flex flex-none items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
        >
          <UserPlus className="h-4 w-4" />
          เพิ่มผู้ฝึกสอน
        </Link>
        <Link
          href="/coaches/export"
          className="inline-flex flex-none items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          ส่งออก Excel
        </Link>

        <div className="group relative flex-none">
          <button
            type="button"
            aria-label="การแจ้งเตือน"
            className="relative inline-flex items-center justify-center rounded-lg border border-slate-200 p-2.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <Bell className="h-4 w-4" />
            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>
          <div className="invisible absolute right-0 z-30 mt-1 max-h-96 w-80 overflow-y-auto rounded-xl border border-slate-200 bg-white opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
            {role === "ADMIN" && (
              <>
                <div className="border-b border-slate-100 px-4 py-2.5">
                  <p className="text-xs font-semibold text-slate-500">
                    คำขอแก้ไขข้อมูลที่รอตรวจสอบ ({pendingRequestCount})
                  </p>
                </div>
                {pendingRequests.length === 0 ? (
                  <p className="px-4 py-3 text-center text-xs text-slate-400">
                    ไม่มีคำขอค้างอยู่
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {pendingRequests.map((r) => (
                      <li key={r.id}>
                        <Link
                          href="/requests"
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50"
                        >
                          <Inbox className="h-3.5 w-3.5 flex-none text-amber-500" />
                          <span className="truncate text-xs text-slate-700">
                            {r.coachName}
                          </span>
                          <span className="ml-auto flex-none text-[11px] text-slate-400">
                            {formatDate(r.createdAt)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
            <div className="border-b border-t border-slate-100 px-4 py-2.5">
              <p className="text-xs font-semibold text-slate-500">
                ใบอนุญาตใกล้หมดอายุ ({expiringSoonCount})
              </p>
            </div>
            {expiringSoon.length === 0 ? (
              <p className="px-4 py-3 text-center text-xs text-slate-400">
                ไม่มีใบอนุญาตที่ใกล้หมดอายุ
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {expiringSoon.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/coaches/${r.coachId}`}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50"
                    >
                      <Clock className="h-3.5 w-3.5 flex-none text-red-500" />
                      <span className="truncate text-xs text-slate-700">
                        {r.coachName}
                      </span>
                      <span className="ml-auto flex-none text-[11px] text-slate-400">
                        {labelFor(LICENSE_TYPES, r.licenseType)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/dashboard"
              className="block border-t border-slate-100 px-4 py-2.5 text-center text-xs font-medium text-indigo-600 hover:bg-indigo-50"
            >
              ดูทั้งหมด
            </Link>
          </div>
        </div>
      </div>

      {/* แถวสถิติย่อ */}
      <div className="flex flex-wrap gap-2">
        <StatChip icon={Users} label="ผู้ฝึกสอนทั้งหมด" value={coachCount} href="/coaches" accent="text-indigo-600" />
        <StatChip
          icon={GraduationCap}
          label="วิทยากรทั้งหมด"
          value={instructorCount}
          href="/instructors"
          accent="text-emerald-600"
        />
        <StatChip
          icon={AlertTriangle}
          label="ใกล้หมดอายุ (90 วัน)"
          value={expiringSoonCount}
          href="/dashboard"
          accent="text-amber-600"
        />
        {role === "ADMIN" && (
          <StatChip
            icon={Inbox}
            label="คำขอรอตรวจสอบ"
            value={pendingRequestCount}
            href="/requests"
            accent="text-red-600"
          />
        )}
      </div>

      {/* แถวแท็บหมวดหมู่ */}
      <AdminTabs role={role} pendingRequestCount={pendingRequestCount} />
    </div>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
  href,
  accent,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  href: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-2.5 pr-3.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
    >
      <Icon className={`h-3.5 w-3.5 ${accent}`} />
      <span className={`font-bold ${accent}`}>{value.toLocaleString()}</span>
      {label}
    </Link>
  );
}
