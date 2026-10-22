"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";

export type PlVideo = { id: number; title: string; body: string | null; src: string; provider: "youtube" | "facebook"; thumb: string | null };

// วิดีโอ — แสดงภาพตัวอย่างก่อน กดแล้วค่อยโหลดตัวเล่น (หน้าเว็บไม่ต้องโหลด iframe ทุกตัวตั้งแต่แรก)
export function VideoGrid({ videos }: { videos: PlVideo[] }) {
  const [playing, setPlaying] = useState<number | null>(null);

  return (
    <div className={`grid grid-cols-1 gap-5 ${videos.length > 1 ? "sm:grid-cols-2" : "mx-auto max-w-3xl"}`}>
      {videos.map((v) => (
        <div key={v.id} className="overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-lg shadow-pink-200/40">
          <div className="relative aspect-video bg-linear-to-br from-pink-200 via-fuchsia-100 to-purple-200">
            {playing === v.id ? (
              <iframe
                src={`${v.src}${v.provider === "youtube" ? "&autoplay=1" : "&autoplay=true"}`}
                title={v.title}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            ) : (
              <button type="button" onClick={() => setPlaying(v.id)} className="group absolute inset-0" aria-label={`เล่นวิดีโอ ${v.title}`}>
                {v.thumb && <Image src={v.thumb} alt="" fill unoptimized sizes="(min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />}
                <span className="absolute inset-0 bg-purple-900/10 transition-colors group-hover:bg-purple-900/25" />
                <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-pink-500 shadow-xl transition-transform group-hover:scale-110">
                  <span className="absolute inset-0 rounded-full bg-white/50 motion-safe:animate-ping" />
                  <Play className="relative h-7 w-7 translate-x-0.5 fill-current" />
                </span>
              </button>
            )}
          </div>
          <div className="p-5">
            <p className="font-bold text-slate-900">{v.title}</p>
            {v.body && <p className="mt-1 whitespace-pre-line text-sm text-slate-500">{v.body}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
