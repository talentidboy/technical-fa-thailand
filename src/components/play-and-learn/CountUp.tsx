"use client";

import { useEffect, useRef, useState } from "react";

// ตัวเลขนับขึ้นตอนเลื่อนมาถึง — ข้อความอย่าง "5-8" นับทุกตัวเลขพร้อมกัน · ผู้ที่ตั้งค่าลดการเคลื่อนไหวเห็นตัวเลขจริงทันที
export function CountUp({ value, duration = 1400 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el || !/\d/.test(value) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let finish: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          setProgress(1 - (1 - t) ** 3);
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        // แท็บถูกพักไว้ (เฟรมอนิเมชันหยุด) → แสดงตัวเลขจริงเมื่อครบเวลา
        finish = setTimeout(() => {
          cancelAnimationFrame(frame);
          setProgress(1);
        }, duration + 300);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(finish);
    };
  }, [value, duration]);

  const shown = progress >= 1 ? value : value.replace(/\d+/g, (n) => String(Math.round(Number(n) * progress)));
  return (
    <span ref={ref} className="tabular-nums">
      {shown}
    </span>
  );
}
