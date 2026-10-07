"use client";

import { useActionState } from "react";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import type { ActionResult } from "@/app/g15-womens-series/manage/actions";

// ฟอร์มสำหรับ server action ที่คืน ActionResult — แสดง "บันทึกสำเร็จ" หรือข้อความผิดพลาดจริงจากเซิร์ฟเวอร์ใต้ฟอร์ม
// (ต่างจาก FormWithToast ที่รองรับเฉพาะ action แบบ throw ซึ่งตอน production ผู้ใช้จะไม่เห็นข้อความผิดพลาด)
export function ActionForm({
  action,
  className,
  successText = "บันทึกสำเร็จ",
  children,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  className?: string;
  successText?: string;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: (ActionResult & { at: number }) | null, formData: FormData) => ({ ...(await action(formData)), at: Date.now() }),
    null,
  );

  return (
    <form action={formAction} className={className} aria-busy={pending}>
      {children}
      {pending && (
        <div role="status" className="mt-3 flex w-fit items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          กำลังบันทึก...
        </div>
      )}
      {state && !pending && (
        <div
          key={state.at}
          role={state.ok ? "status" : "alert"}
          className={`mt-3 flex w-fit items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${
            state.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {state.ok ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
          {state.ok ? successText : state.error}
        </div>
      )}
    </form>
  );
}
