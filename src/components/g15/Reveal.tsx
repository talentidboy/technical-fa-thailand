"use client";

import { useEffect, useRef, useState } from "react";

// ห่อ section แล้วค่อยๆ เลื่อนขึ้น+จางเข้ามาตอนเลื่อนหน้าจอมาถึง (แทนที่จะโผล่มาทื่อๆ) — ใช้ IntersectionObserver
// ไม่ใช้ไลบรารีอนิเมชันเพิ่ม เพราะแค่ CSS transition + observer ก็พอสำหรับเอฟเฟกต์นี้ ไม่ต้องเพิ่ม dependency
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={`transition-all duration-700 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}
