"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";

// ฟอร์มที่ขึ้นข้อความ "บันทึกสำเร็จ" ชั่วครู่หลังส่ง — ใช้ห่อฟอร์ม server action เดิม (ตัวฟอร์มเองยัง render จาก server component ได้ปกติ
// เพราะ children เป็นแค่ JSX ธรรมดา ไม่ใช่ฟังก์ชัน) ไม่งั้นก่อนหน้านี้กดบันทึกแล้วมีแค่หน้ารีเฟรชข้อมูลใหม่เฉยๆ ไม่รู้ว่าสำเร็จหรือเปล่า
export function FormWithToast({
  id,
  action,
  className,
  children,
}: {
  id?: string;
  action: (formData: FormData) => void | Promise<void>;
  className?: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState(async (_prev: number, formData: FormData) => {
    await action(formData);
    return Date.now();
  }, 0);
  const showToast = state !== 0;

  return (
    <form id={id} action={formAction} className={className}>
      {children}
      {showToast && (
        <div className="mt-3 flex w-fit items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
          <Check className="h-3.5 w-3.5" />
          บันทึกสำเร็จ
        </div>
      )}
    </form>
  );
}
