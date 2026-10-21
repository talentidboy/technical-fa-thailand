"use client";

import { useTransition } from "react";
import { undoRenewal } from "@/app/(admin)/renewals/actions";
import { Undo2 } from "lucide-react";

export function UndoRenewalButton({ id }: { id: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("ยกเลิกการต่ออายุครั้งนี้ และคืนวันหมดอายุเดิม?")) return;
        startTransition(async () => {
          const res = await undoRenewal(id);
          if (!res.ok) alert(res.error);
        });
      }}
      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      <Undo2 className="h-3.5 w-3.5" />
      ยกเลิก
    </button>
  );
}
