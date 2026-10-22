"use client";

import { useEffect } from "react";
import Link from "next/link";
import { isStaleDeploymentError, reloadOnceForNewVersion, reportClientError } from "@/lib/client-error";
import { AlertTriangle, RotateCcw, Home, RefreshCw } from "lucide-react";

// หน้าแจ้งข้อผิดพลาดของทุกหน้า (แทนหน้าขาว/ข้อความภาษาอังกฤษ) — ส่งรายละเอียดไปบันทึกให้แอดมิน
// ถ้าเป็นหน้าเวอร์ชันเก่าหลังอัปเดตระบบ จะโหลดหน้าใหม่ให้อัตโนมัติ (มีปุ่มโหลดเองเผื่อไว้)
export default function ErrorPage({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  const stale = isStaleDeploymentError(error);

  useEffect(() => {
    if (stale) reloadOnceForNewVersion();
    else reportClientError(error);
  }, [error, stale]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white text-center shadow-xl shadow-slate-900/10 ring-1 ring-slate-200">
        <div className="h-1.5 bg-linear-to-r from-amber-500 via-amber-300 to-amber-500" />
        <div className="p-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
            {stale ? <RefreshCw className="h-7 w-7" /> : <AlertTriangle className="h-7 w-7" />}
          </span>
          <h1 className="mt-5 text-xl font-bold text-slate-900">{stale ? "ระบบเพิ่งอัปเดตเวอร์ชันใหม่" : "ขออภัย เกิดข้อผิดพลาดบางอย่าง"}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {stale
              ? "กำลังโหลดหน้าใหม่ให้อัตโนมัติ — ถ้าหน้ายังไม่เปลี่ยน กดปุ่มด้านล่าง แล้วทำรายการล่าสุดอีกครั้ง"
              : "ระบบบันทึกปัญหานี้ไว้ให้เจ้าหน้าที่แล้ว ลองกด “ลองใหม่” อีกครั้ง หากยังไม่ได้ กรุณาแจ้งเจ้าหน้าที่พร้อมรหัสอ้างอิงด้านล่าง"}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => (stale ? window.location.reload() : unstable_retry())}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700"
            >
              <RotateCcw className="h-4 w-4" />
              {stale ? "โหลดหน้าใหม่" : "ลองใหม่"}
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <Home className="h-4 w-4" />
              กลับหน้าแรก
            </Link>
          </div>
          {error.digest && <p className="mt-6 font-mono text-[11px] text-slate-400">รหัสอ้างอิง: {error.digest}</p>}
        </div>
      </div>
    </div>
  );
}
