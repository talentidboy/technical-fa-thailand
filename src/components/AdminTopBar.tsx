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
  BookOpen,
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
      {/* แถบค้นหา + ปุ่มลัด + แจ้งเตือน บนพื้นกรมท่า */}
      <div className="relative overflow-visible rounded-3xl bg-linear-to-r from-indigo-900 via-indigo-800 to-indigo-700 p-3 shadow-xl shadow-indigo-950/15 sm:p-4">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-amber-400/15 blur-2xl" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />
        </div>
        <div className="relative flex flex-wrap items-center gap-2.5">
          <form action="/coaches" className="relative min-w-0 flex-[1_1_16rem]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="q"
              placeholder="ค้นหาผู้ฝึกสอน — ชื่อ, ID AFC, สโมสร..."
              className="h-11 w-full rounded-xl border-0 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-amber-300/40"
            />
          </form>

          <Link
            href="/coaches?new=1"
            className="inline-flex h-11 flex-none items-center gap-1.5 rounded-xl bg-amber-400 px-4 text-sm font-bold text-amber-950 shadow-sm transition-colors hover:bg-amber-300"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">เพิ่มผู้ฝึกสอน</span>
          </Link>
          <Link
            href="/coaches/export"
            className="inline-flex h-11 flex-none items-center gap-1.5 rounded-xl bg-white/10 px-4 text-sm font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-white/20"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">ส่งออก Excel</span>
          </Link>

          <div className="group relative flex-none">
            <button
              type="button"
              aria-label="การแจ้งเตือน"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20 transition-colors hover:bg-white/20"
            >
              <Bell className="h-4.5 w-4.5" />
              {notificationCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-indigo-800">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </button>
            <div className="invisible absolute right-0 z-30 mt-2 max-h-96 w-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white opacity-0 shadow-2xl transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
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
      </div>

      {/* การ์ดสถิติ — กดเพื่อไปหน้านั้น · ตัวที่ต้องจัดการ (ใกล้หมดอายุ/คำขอ) เน้นสีเมื่อมีรายการ */}
      <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1 ${role === "ADMIN" ? "lg:grid-cols-5" : ""}`}>
        <StatCard icon={Users} label="ผู้ฝึกสอน (มีใบอนุญาต)" value={coachCount} href="/coaches" tone="indigo" />
        <StatCard icon={GraduationCap} label="วิทยากรทั้งหมด" value={instructorCount} href="/instructors" tone="emerald" />
        <StatCard
          icon={AlertTriangle}
          label="ใบอนุญาตใกล้หมดอายุ (90 วัน)"
          value={expiringSoonCount}
          href="/dashboard#expiring"
          tone="amber"
          alert={expiringSoonCount > 0}
        />
        {role === "ADMIN" && (
          <>
            <StatCard icon={BookOpen} label="รอบอบรมทั้งหมด" value={courseSessionCount} href="/course-sessions" tone="violet" />
            <StatCard icon={Inbox} label="คำขอรอตรวจสอบ" value={pendingRequestCount} href="/requests" tone="red" alert={pendingRequestCount > 0} />
          </>
        )}
      </div>

      {/* แท็บมุมมองแดชบอร์ด (เฉพาะหน้าแดชบอร์ด) */}
      <AdminTabs />
    </div>
  );
}

const TONES = {
  indigo: { icon: "bg-indigo-50 text-indigo-600", ring: "hover:ring-indigo-300", alert: "" },
  emerald: { icon: "bg-emerald-50 text-emerald-600", ring: "hover:ring-emerald-300", alert: "" },
  amber: { icon: "bg-amber-50 text-amber-600", ring: "hover:ring-amber-300", alert: "bg-amber-50/60 ring-amber-300" },
  violet: { icon: "bg-violet-50 text-violet-600", ring: "hover:ring-violet-300", alert: "" },
  red: { icon: "bg-red-50 text-red-600", ring: "hover:ring-red-300", alert: "bg-red-50/60 ring-red-300" },
} as const;

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  tone,
  alert = false,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  href: string;
  tone: keyof typeof TONES;
  alert?: boolean;
}) {
  const t = TONES[tone];
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-2xl p-3.5 shadow-sm ring-1 transition-all hover:-translate-y-0.5 hover:shadow-md ${
        alert ? t.alert : `bg-white ring-slate-200 ${t.ring}`
      }`}
    >
      <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${t.icon}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xl font-extrabold leading-tight text-slate-900">{value.toLocaleString()}</span>
        <span className="block text-[11px] font-medium leading-snug text-slate-500">{label}</span>
      </span>
    </Link>
  );
}
