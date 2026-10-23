import Link from "next/link";
import { Search, UserPlus, Download, Bell, Inbox, Clock } from "lucide-react";
import { AdminTabs } from "@/components/AdminTabs";
import { display } from "@/components/fonts";
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
  courseSessionCount,
  expiringSoonCount,
  expiringSoon,
  pendingRequestCount,
  pendingRequests,
}: {
  role: string;
  coachCount: number;
  instructorCount: number;
  courseSessionCount: number;
  expiringSoonCount: number;
  expiringSoon: ExpiringLicense[];
  pendingRequestCount: number;
  pendingRequests: PendingRequest[];
}) {
  const notificationCount =
    expiringSoonCount + (role === "ADMIN" ? pendingRequestCount : 0);

  return (
    <div className="mb-8 space-y-4">
      {/* แถบค้นหา + ปุ่มลัด + แจ้งเตือน */}
      <div className="rounded-xl border border-slate-200 bg-white p-2.5 sm:p-3">
        <div className="flex flex-wrap items-center gap-2">
          <form action="/coaches" className="relative min-w-0 flex-[1_1_16rem]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="q"
              placeholder="ค้นหาผู้ฝึกสอน — ชื่อ, ID AFC, สโมสร..."
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#073c5e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#073c5e]/15"
            />
          </form>

          <Link
            href="/coaches?new=1"
            className="inline-flex h-11 flex-none items-center gap-1.5 rounded-lg bg-[#073c5e] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0a4a73]"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">เพิ่มผู้ฝึกสอน</span>
          </Link>
          <Link
            href="/coaches/export"
            className="inline-flex h-11 flex-none items-center gap-1.5 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">ส่งออก Excel</span>
          </Link>

          <div className="group relative flex-none">
            <button
              type="button"
              aria-label="การแจ้งเตือน"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <Bell className="h-4.5 w-4.5" />
              {notificationCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </button>
            <div className="invisible absolute right-0 z-30 mt-2 max-h-96 w-80 overflow-y-auto rounded-xl border border-slate-200 bg-white opacity-0 shadow-xl transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
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
                className="block border-t border-slate-100 px-4 py-2.5 text-center text-xs font-semibold text-[#073c5e] hover:bg-slate-50"
              >
                ดูทั้งหมด
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ตัวเลขหลัก — กดเพื่อไปหน้านั้น · ตัวที่ต้องจัดการ (ใกล้หมดอายุ/คำขอ) ขึ้นสีเตือนเมื่อมีรายการ */}
      <div
        className={`grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-3 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1 ${role === "ADMIN" ? "lg:grid-cols-5" : ""}`}
      >
        <StatCard label="ผู้ฝึกสอน (มีใบอนุญาต)" value={coachCount} href="/coaches" />
        <StatCard label="วิทยากรทั้งหมด" value={instructorCount} href="/instructors" />
        <StatCard label="ใบอนุญาตใกล้หมดอายุ (90 วัน)" value={expiringSoonCount} href="/dashboard#expiring" alert={expiringSoonCount > 0 ? "amber" : undefined} />
        {role === "ADMIN" && (
          <>
            <StatCard label="รอบอบรมทั้งหมด" value={courseSessionCount} href="/course-sessions" />
            <StatCard label="คำขอรอตรวจสอบ" value={pendingRequestCount} href="/requests" alert={pendingRequestCount > 0 ? "red" : undefined} />
          </>
        )}
      </div>

      {/* แท็บมุมมองแดชบอร์ด (เฉพาะหน้าแดชบอร์ด) */}
      <AdminTabs />
    </div>
  );
}

const ALERT = {
  amber: { bar: "bg-amber-500", text: "text-amber-700" },
  red: { bar: "bg-red-600", text: "text-red-700" },
} as const;

function StatCard({ label, value, href, alert }: { label: string; value: number; href: string; alert?: keyof typeof ALERT }) {
  const a = alert ? ALERT[alert] : null;
  return (
    <Link href={href} className="group relative flex flex-col justify-between gap-1 bg-white px-4 py-3.5 transition-colors hover:bg-slate-50">
      {a && <span className={`absolute inset-x-0 top-0 h-0.5 ${a.bar}`} />}
      <span className={`block text-[11px] font-medium leading-snug ${a ? a.text : "text-slate-500"}`}>{label}</span>
      <span className={`${display.className} block text-2xl font-semibold leading-tight tabular-nums ${a ? a.text : "text-slate-900"}`}>{value.toLocaleString()}</span>
    </Link>
  );
}
