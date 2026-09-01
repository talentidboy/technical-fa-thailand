"use client";

import { useEffect, useRef, useState } from "react";

// นับตัวเลขไต่ขึ้นจาก 0 ตอนเลื่อนมาเห็น — ใช้กับแถบสถิติหน้าแรก (จำนวนทีม/ภาค/นัด ฯลฯ)
// decimals > 0 ใช้กับค่าที่มีทศนิยม เช่น ประตูเฉลี่ย/นัด
export function AnimatedCounter({ value, duration = 1200, decimals = 0 }: { value: number; duration?: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        function tick(now: number) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay((eased * value).toFixed(decimals));
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration, decimals]);

  return <span ref={ref}>{display}</span>;
}
