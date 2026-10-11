"use client";

import { Printer } from "lucide-react";

// ปุ่มบันทึกเป็น PDF — ใช้หน้าต่างพิมพ์ของเบราว์เซอร์ (เลือก "บันทึกเป็น PDF") ภาษาไทยออกครบถูกต้องทุกตัวอักษร
export function PrintButton({ label = "บันทึกเป็น PDF / พิมพ์" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-11 items-center gap-2 rounded-xl bg-g15-600 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-g15-700"
    >
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}
