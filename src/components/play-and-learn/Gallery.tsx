"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import styles from "@/app/play-and-learn/pl.module.css";

export type GalleryPhoto = { id: number; src: string; title: string; album: string | null; date: string | null };

const PAGE = 12;

// แกลเลอรีรูปกิจกรรม — กรองตามอัลบั้ม · กดรูปเพื่อดูขนาดใหญ่ (ลูกศร/ปัดซ้ายขวาเพื่อดูรูปถัดไป, Esc ปิด)
export function Gallery({ photos }: { photos: GalleryPhoto[] }) {
  const albums = [...new Set(photos.map((p) => p.album).filter((a): a is string => !!a))];
  const [album, setAlbum] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [open, setOpen] = useState<number | null>(null);
  const touchX = useRef<number | null>(null);

  const list = album ? photos.filter((p) => p.album === album) : photos;
  const shown = list.slice(0, limit);
  const current = open === null ? null : list[open];

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % list.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + list.length) % list.length));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, list.length]);

  const step = (d: number) => setOpen((i) => (i === null ? i : (i + d + list.length) % list.length));

  return (
    <div>
      {albums.length > 1 && (
        <div className="mb-5 flex flex-wrap justify-center gap-2">
          {[null, ...albums].map((a) => (
            <button
              key={a ?? "all"}
              type="button"
              onClick={() => {
                setAlbum(a);
                setLimit(PAGE);
              }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                album === a ? "bg-linear-to-r from-pink-400 to-purple-400 text-white shadow-sm" : "bg-white text-purple-700 ring-1 ring-pink-100 hover:bg-pink-50"
              }`}
            >
              {a ?? "ทั้งหมด"}
            </button>
          ))}
        </div>
      )}

      <div className="grid auto-rows-[130px] grid-cols-2 gap-3 sm:auto-rows-[170px] sm:grid-cols-4">
        {shown.map((p, i) => (
          <button
            key={`${album ?? "all"}-${p.id}`}
            type="button"
            onClick={() => setOpen(i)}
            style={{ animationDelay: `${(i % PAGE) * 45}ms` }}
            className={`group relative overflow-hidden rounded-2xl bg-pink-100 shadow-sm ring-1 ring-white transition-shadow hover:shadow-lg ${styles.pop} ${
              i % 6 === 0 ? "col-span-2 row-span-2" : ""
            }`}
            aria-label={`ดูรูป${p.title ? ` ${p.title}` : ""}`}
          >
            <Image
              src={p.src}
              alt={p.title || "รูปกิจกรรม Play and Learn"}
              fill
              sizes={i % 6 === 0 ? "(min-width: 640px) 50vw, 100vw" : "(min-width: 640px) 25vw, 50vw"}
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <span className="absolute inset-0 flex items-end bg-linear-to-t from-purple-900/60 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="flex w-full items-center justify-between gap-2 text-left text-xs font-medium text-white">
                <span className="line-clamp-2">{p.title}</span>
                <ZoomIn className="h-4 w-4 flex-none" />
              </span>
            </span>
          </button>
        ))}
      </div>

      {list.length > limit && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setLimit((n) => n + PAGE)}
            className="rounded-full border border-purple-200 bg-white px-5 py-2.5 text-sm font-bold text-purple-700 transition-colors hover:bg-purple-50"
          >
            ดูรูปเพิ่มเติม ({list.length - limit})
          </button>
        </div>
      )}

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="ดูรูปขนาดใหญ่"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-purple-950/85 p-4 backdrop-blur-sm"
          onClick={() => setOpen(null)}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
          }}
        >
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label="ปิด"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative h-[72vh] w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Image key={current.id} src={current.src} alt={current.title || "รูปกิจกรรม Play and Learn"} fill sizes="100vw" className="object-contain" priority />
          </div>
          <div className="mt-4 text-center text-white" onClick={(e) => e.stopPropagation()}>
            {current.title && <p className="text-sm font-semibold">{current.title}</p>}
            <p className="mt-0.5 text-xs text-white/60">
              {[current.album, current.date].filter(Boolean).join(" · ")}
              {list.length > 1 && ` · ${(open ?? 0) + 1} / ${list.length}`}
            </p>
          </div>
          {list.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label="รูปก่อนหน้า"
                className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                aria-label="รูปถัดไป"
                className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
