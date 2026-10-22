import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { resolveError, resolveAllErrors, purgeOldErrors } from "./actions";
import { ShieldCheck, Server, MonitorSmartphone, Check, Trash2, Mail } from "lucide-react";

const dt = (d: Date) =>
  d.toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" });

// บันทึกข้อผิดพลาดของระบบ — error ฝั่งเซิร์ฟเวอร์ (instrumentation) และหน้าที่ผู้ใช้เห็นหน้าแจ้งข้อผิดพลาด
export default async function ErrorsPage({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/dashboard");
  const { all } = await searchParams;
  const showAll = all === "1";

  const [logs, openCount] = await Promise.all([
    prisma.errorLog.findMany({
      where: showAll ? {} : { resolved: false },
      orderBy: { lastSeenAt: "desc" },
      take: 200,
    }),
    prisma.errorLog.count({ where: { resolved: false } }),
  ]);
  const alertEmail = !!process.env.ERROR_ALERT_EMAIL;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">บันทึกข้อผิดพลาด</h1>
          <p className="mt-1 text-sm text-slate-500">
            ทุกครั้งที่ระบบเกิดข้อผิดพลาด (ทั้งฝั่งเซิร์ฟเวอร์และหน้าที่ผู้ใช้เห็น) จะถูกบันทึกที่นี่ — error เดิมภายใน 1 ชั่วโมงรวมเป็นรายการเดียว
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {openCount > 0 && (
            <form action={resolveAllErrors}>
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                <Check className="h-4 w-4" />
                แก้แล้วทั้งหมด ({openCount})
              </button>
            </form>
          )}
          <form action={purgeOldErrors}>
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">
              <Trash2 className="h-4 w-4" />
              ลบที่แก้แล้วเกิน 30 วัน
            </button>
          </form>
        </div>
      </div>

      <p className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ring-1 ${alertEmail ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-amber-50 text-amber-800 ring-amber-200"}`}>
        <Mail className="mt-0.5 h-4 w-4 flex-none" />
        {alertEmail
          ? "เปิดแจ้งเตือนทางอีเมลแล้ว — มี error ใหม่จะส่งอีเมลไปที่ ERROR_ALERT_EMAIL (ไม่เกิน 1 ฉบับต่อ 10 นาที)"
          : "ยังไม่ได้ตั้งอีเมลแจ้งเตือน — ตั้งค่า ERROR_ALERT_EMAIL ใน Vercel (Settings → Environment Variables) เพื่อรับอีเมลทันทีที่มี error ใหม่"}
      </p>

      <div className="flex gap-1.5">
        {[
          { label: `ยังไม่แก้ (${openCount})`, href: "/errors", on: !showAll },
          { label: "ทั้งหมด", href: "/errors?all=1", on: showAll },
        ].map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 ${t.on ? "bg-indigo-600 text-white ring-indigo-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <ShieldCheck className="h-10 w-10 text-emerald-500" />
          <p className="font-semibold text-slate-700">{showAll ? "ยังไม่มีบันทึกข้อผิดพลาด" : "ไม่มีข้อผิดพลาดที่ยังไม่แก้"}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {logs.map((e) => (
            <li key={e.id} className={`rounded-2xl border bg-white p-4 shadow-sm ${e.resolved ? "border-slate-200 opacity-60" : "border-red-200"}`}>
              <div className="flex flex-wrap items-start gap-3">
                <span
                  className={`inline-flex flex-none items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    e.source === "SERVER" ? "bg-violet-50 text-violet-700" : "bg-sky-50 text-sky-700"
                  }`}
                >
                  {e.source === "SERVER" ? <Server className="h-3 w-3" /> : <MonitorSmartphone className="h-3 w-3" />}
                  {e.source === "SERVER" ? "เซิร์ฟเวอร์" : "หน้าเว็บ"}
                  {e.routeType ? ` · ${e.routeType}` : ""}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-slate-500">{e.path ?? "-"}</p>
                  <p className="mt-1 wrap-break-word text-sm font-semibold text-slate-900">{e.message}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    เกิด <b className="text-slate-600">{e.count.toLocaleString()}</b> ครั้ง · ครั้งแรก {dt(e.firstSeenAt)} · ล่าสุด {dt(e.lastSeenAt)}
                    {e.digest && <> · รหัสอ้างอิง <span className="font-mono">{e.digest}</span></>}
                  </p>
                  {(e.stack || e.userAgent) && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-semibold text-indigo-600">รายละเอียดทางเทคนิค</summary>
                      {e.userAgent && <p className="mt-2 text-[11px] text-slate-400">{e.userAgent}</p>}
                      {e.stack && <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-200">{e.stack}</pre>}
                    </details>
                  )}
                </div>
                {!e.resolved && (
                  <form action={resolveError}>
                    <input type="hidden" name="id" value={e.id} />
                    <button type="submit" className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50">
                      <Check className="h-3.5 w-3.5" />
                      แก้แล้ว
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
