"use client";

import { useTransition } from "react";
import { Undo2, Loader2 } from "lucide-react";
import { undoResult } from "@/app/(admin)/course-sessions/[sessionId]/actions";

// ยกเลิกผลของคนเดียว (กดผิด) — ใบอนุญาตที่ออกจากรุ่นนี้จะถูกลบ แล้วกลับไปรอยืนยันผลใหม่
export function UndoResultButton({ sessionId, applicationId, name }: { sessionId: number; applicationId: number; name: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      title="ยกเลิกผล"
      aria-label={`ยกเลิกผลของ ${name}`}
      onClick={() => {
        if (!confirm(`ยกเลิกผลของ ${name}?\nใบอนุญาตที่ออกจากรุ่นนี้จะถูกลบ และกลับไปอยู่ในขั้นยืนยันผล`)) return;
        startTransition(async () => {
          const res = await undoResult(sessionId, applicationId);
          if (!res.ok) alert(res.error);
        });
      }}
      className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
    </button>
  );
}
