"use client";

import { useEffect, useRef, useState } from "react";

// ใส่ data-inview="true" เมื่อกล่องนี้เลื่อนมาถึงจอ (ครั้งเดียว) — อนิเมชันจริงอยู่ใน public.module.css (.up .line .grow .pop)
export function InView({ as: Tag = "div", children, className = "", id }: { as?: "div" | "section" | "ol" | "ul"; children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref as React.Ref<never>} id={id} data-inview={seen} className={className}>
      {children}
    </Tag>
  );
}
