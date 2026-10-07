"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const UNITS = [
  { key: "d", label: "วัน", en: "Days", ms: 86_400_000 },
  { key: "h", label: "ชั่วโมง", en: "Hrs", ms: 3_600_000 },
  { key: "m", label: "นาที", en: "Min", ms: 60_000 },
  { key: "s", label: "วินาที", en: "Sec", ms: 1_000 },
] as const;

// นับถอยหลังถึงเวลาเตะ — serverNow มาจากเซิร์ฟเวอร์ ให้ HTML รอบแรกตรงกันทั้งสองฝั่ง (ไม่เกิด hydration mismatch)
// แล้วค่อยเดินต่อด้วยนาฬิกาเครื่องผู้ชม พอถึงเวลาเตะจะรีเฟรชหน้าเองหนึ่งครั้ง ให้การ์ดเปลี่ยนเป็นสถานะ "กำลังแข่ง"
export function Countdown({ target, serverNow }: { target: string; serverNow: number }) {
  const router = useRouter();
  const targetMs = new Date(target).getTime();
  const [now, setNow] = useState(serverNow);
  const remaining = Math.max(0, targetMs - now);

  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= targetMs) {
        clearInterval(id);
        router.refresh();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [targetMs, router]);

  // แต่ละหน่วย = เศษที่เหลือจากหน่วยใหญ่กว่า หารด้วยขนาดหน่วยนั้น (วันไม่มีหน่วยใหญ่กว่า จึงไม่ต้องหาเศษ)
  const values = UNITS.map((u, i) => {
    const parent = i === 0 ? Infinity : UNITS[i - 1].ms;
    return { ...u, value: Math.floor((remaining % parent) / u.ms) };
  });

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3" role="timer" aria-live="off">
      {values.map((u, i) => (
        <div key={u.key} className="flex items-center gap-2 sm:gap-3">
          <div className="flex w-14 flex-col items-center rounded-2xl bg-linear-to-b from-g15-600 to-g15-800 px-2 py-2.5 text-white shadow-lg shadow-g15-600/30 sm:w-18 sm:py-3">
            <span className="text-2xl font-extrabold tabular-nums sm:text-3xl">{String(u.value).padStart(2, "0")}</span>
            <span className="text-[10px] font-medium text-g15-200">
              {u.label} <span className="hidden sm:inline">/ {u.en}</span>
            </span>
          </div>
          {i < values.length - 1 && <span className="text-xl font-bold text-g15-300">:</span>}
        </div>
      ))}
    </div>
  );
}
