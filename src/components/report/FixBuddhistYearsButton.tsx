"use client";

import { useTransition } from "react";
import { fixBuddhistYears } from "@/app/(admin)/reports/actions";
import { Wrench } from "lucide-react";

export function FixBuddhistYearsButton({ count }: { count: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(`แก้ปี พ.ศ. เป็น ค.ศ. (ลบ 543 ปี) ให้ใบอนุญาต ${count} ใบ?`)) return;
        startTransition(async () => {
          const res = await fixBuddhistYears();
          alert(res.ok ? res.message : res.error);
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50"
    >
      <Wrench className="h-3.5 w-3.5" />
      {pending ? "กำลังแก้..." : `แก้ปี พ.ศ. → ค.ศ. (${count})`}
    </button>
  );
}
