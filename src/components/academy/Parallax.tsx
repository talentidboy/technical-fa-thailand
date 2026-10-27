"use client";

import { useRef, type ReactNode } from "react";

// ฮีโร่ที่ขยับตามเมาส์: ตั้งค่า --mx / --my (−1 ถึง 1) ให้ลูกใช้กับ translate · ปิดเมื่อผู้ใช้ตั้งลดการเคลื่อนไหว
export function Parallax({ className = "", children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const set = (x: number, y: number) => {
    ref.current?.style.setProperty("--mx", x.toFixed(3));
    ref.current?.style.setProperty("--my", y.toFixed(3));
  };
  return (
    <div
      ref={ref}
      className={className}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const r = e.currentTarget.getBoundingClientRect();
        set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
      }}
      onPointerLeave={() => set(0, 0)}
    >
      {children}
    </div>
  );
}
