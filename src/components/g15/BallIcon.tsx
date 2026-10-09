// ไอคอนลูกฟุตบอลแบบเส้น (วาดเอง) — ใช้แทน emoji ⚽ ที่หน้าตาต่างกันไปตามเครื่อง/ระบบปฏิบัติการ
// สีตาม currentColor: กำหนดสีด้วย text-* ได้เหมือนไอคอน lucide
export function BallIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <circle cx="12" cy="12" r="9.25" />
      {/* ห้าเหลี่ยมกลาง + เส้นแยกไปขอบ */}
      <path d="M12 7.6l3.6 2.6-1.4 4.2H9.8l-1.4-4.2z" fill="currentColor" stroke="none" />
      <path d="M12 7.6V2.9M15.6 10.2l4.4-1.5M14.2 14.4l2.8 3.9M9.8 14.4L7 18.3M8.4 10.2L4 8.7" strokeLinecap="round" />
    </svg>
  );
}
