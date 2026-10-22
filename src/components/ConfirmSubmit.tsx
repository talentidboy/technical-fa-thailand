"use client";

// ปุ่มส่งฟอร์มที่ต้องกดยืนยันก่อน (ใช้กับการลบข้อมูลที่ย้อนกลับไม่ได้)
export function ConfirmSubmit({
  message,
  className,
  children,
  ariaLabel,
}: {
  message: string;
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <button
      type="submit"
      aria-label={ariaLabel}
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
