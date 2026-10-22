"use client";

import { startTransition, useActionState, useRef } from "react";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import type { PlResult } from "@/app/play-and-learn/manage/actions";

// ฟอร์มจัดการหน้า Play and Learn — แสดงผลบันทึก/ข้อผิดพลาดใต้ฟอร์ม
// resetOnSuccess = ล้างฟอร์มหลังเพิ่มรายการใหม่สำเร็จ · quiet = ปุ่มเล็ก (ลบ/ซ่อน/เลื่อน) แสดงเฉพาะข้อผิดพลาด
export function PlForm({
  action,
  className,
  successText = "บันทึกแล้ว",
  resetOnSuccess = false,
  quiet = false,
  children,
}: {
  action: (formData: FormData) => Promise<PlResult>;
  className?: string;
  successText?: string;
  resetOnSuccess?: boolean;
  quiet?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (_prev: (PlResult & { at: number }) | null, formData: FormData) => {
    const res = await action(formData);
    if (res.ok && resetOnSuccess) ref.current?.reset();
    return { ...res, at: Date.now() };
  }, null);

  return (
    <form
      ref={ref}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
        startTransition(() => formAction(fd));
      }}
      className={`${className ?? ""} ${pending && quiet ? "pointer-events-none opacity-50" : ""}`}
      aria-busy={pending}
    >
      {children}
      {pending && !quiet && (
        <p role="status" className="mt-3 flex w-fit items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          กำลังบันทึก...
        </p>
      )}
      {state && !pending && (!quiet || !state.ok) && (
        <p
          key={state.at}
          role={state.ok ? "status" : "alert"}
          className={`flex w-fit items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${quiet ? "mt-1" : "mt-3"} ${state.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
        >
          {state.ok ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
          {state.ok ? successText : state.error}
        </p>
      )}
    </form>
  );
}
