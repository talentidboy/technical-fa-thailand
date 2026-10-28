"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";

// โหลด Facebook JS SDK แบบ lazy (ครั้งเดียวต่อหน้า) แล้วสั่ง parse ปุ่ม/โพสต์ fb-post ที่ฝังไว้
// ใช้ SDK แทน iframe ตรงๆ เพราะ SDK จะปรับความสูงให้พอดีเนื้อหาโพสต์เองอัตโนมัติ
// ความกว้างวัดจากพื้นที่จริง (Facebook รับ 350–750px) — จอมือถือจะไม่ล้นแนวนอน
export function FacebookEmbed({ url }: { url: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const w = box.current?.clientWidth ?? 552;
    const t = window.setTimeout(() => setWidth(Math.max(350, Math.min(552, Math.floor(w)))), 0);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (width === null) return;
    const win = window as typeof window & {
      FB?: { XFBML: { parse: () => void } };
    };

    if (win.FB) {
      win.FB.XFBML.parse();
      return;
    }

    if (!document.getElementById("fb-root")) {
      const root = document.createElement("div");
      root.id = "fb-root";
      document.body.prepend(root);
    }

    if (document.getElementById("facebook-jssdk")) return;

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/th_TH/sdk.js#xfbml=1&version=v19.0";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, [url, width]);

  return (
    <div ref={box} className="flex w-full max-w-full flex-col items-center gap-2 overflow-hidden">
      {width !== null && <div key={width} className="fb-post max-w-full" data-href={url} data-width={width} data-show-text="true" />}
      {/* Facebook บางลิงก์ (โดยเฉพาะลิงก์ share/ ที่คัดลอกจากมือถือ) ฝังโพสต์ไม่ได้ — ใส่ลิงก์สำรองไว้เสมอ */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-10 items-center gap-1.5 px-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        ดูโพสต์ต้นฉบับบน Facebook
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
