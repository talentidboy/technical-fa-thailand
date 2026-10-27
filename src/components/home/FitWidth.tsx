"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// ย่อภาพประกอบทั้งชิ้นให้พอดีคอลัมน์: วางเนื้อหาที่ความกว้างออกแบบ (width) แล้วย่อด้วย zoom เมื่อคอลัมน์แคบกว่า
// → บนมือถือได้ภาพเดียวกับบนคอม แค่เล็กลง (ไม่ต้องจัดวางใหม่) · คอลัมน์กว้างพอ = แสดงตามปกติเต็มคอลัมน์
export function FitWidth({ width, className = "", children }: { width: number; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, e.contentRect.width / width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  return (
    <div ref={ref} className={`min-w-0 ${className}`}>
      <div style={scale < 1 ? { width, zoom: scale } : undefined}>{children}</div>
    </div>
  );
}
