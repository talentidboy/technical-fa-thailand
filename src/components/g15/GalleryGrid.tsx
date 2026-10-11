"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, Trash2, X } from "lucide-react";
import type { ActionResult } from "@/app/g15-womens-series/manage/actions";

export type GalleryPhoto = {
  id: number;
  url: string;
  thumbUrl: string;
  width: number | null;
  height: number | null;
  caption: string | null;
  label: string | null;
};

// ตารางรูปแบบ masonry (คอลัมน์) + ดูภาพเต็มจอ เลื่อนซ้าย-ขวา/ปัดได้ · แอดมินลบรูปได้
export function GalleryGrid({
  photos,
  deleteAction,
}: {
  photos: GalleryPhoto[];
  deleteAction?: (fd: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [index, setIndex] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const touchX = useRef<number | null>(null);
  const open = index != null ? photos[index] : null;

  const go = (d: number) => setIndex((i) => (i == null ? i : (i + d + photos.length) % photos.length));

  useEffect(() => {
    if (index == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIndex(null);
      if (e.key === "ArrowRight") setIndex((i) => (i == null ? i : (i + 1) % photos.length));
      if (e.key === "ArrowLeft") setIndex((i) => (i == null ? i : (i - 1 + photos.length) % photos.length));
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [index, photos.length]);

  const remove = (id: number) => {
    if (!deleteAction || !window.confirm("ลบรูปนี้ออกจากแกลเลอรี?")) return;
    const fd = new FormData();
    fd.set("id", String(id));
    startTransition(async () => {
      const res = await deleteAction(fd);
      if (!res.ok) window.alert(res.error);
      else {
        setIndex(null);
        router.refresh();
      }
    });
  };

  return (
    <>
      <div className="columns-2 gap-2 sm:columns-3 sm:gap-3 lg:columns-4">
        {photos.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setIndex(i)}
            className="group relative mb-2 block w-full overflow-hidden rounded-xl bg-g15-100 sm:mb-3"
            style={p.width && p.height ? { aspectRatio: `${p.width} / ${p.height}` } : undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.thumbUrl}
              alt={p.caption ?? ""}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {p.caption && (
              <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-2.5 pb-2 pt-6 text-left text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                {p.caption}
              </span>
            )}
          </button>
        ))}
      </div>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="ดูรูป"
            className="fixed inset-0 z-50 flex flex-col bg-slate-950"
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX.current == null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
              touchX.current = null;
            }}
          >
            <div className="flex flex-none items-center gap-2 px-3 py-3 text-white sm:px-5">
              <span className="text-sm font-semibold tabular-nums text-white/70">
                {index! + 1} / {photos.length}
              </span>
              <span className="flex-1" />
              <a
                href={open.url}
                target="_blank"
                rel="noreferrer"
                download
                aria-label="ดาวน์โหลด"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              >
                <Download className="h-5 w-5" />
              </a>
              {deleteAction && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => remove(open.id)}
                  aria-label="ลบรูป"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-red-300 hover:bg-red-500/30 disabled:opacity-40"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIndex(null)}
                aria-label="ปิด"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div
              className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16"
              onClick={(e) => {
                if (e.target === e.currentTarget) setIndex(null);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={open.id} src={open.url} alt={open.caption ?? ""} className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" />
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    aria-label="รูปก่อนหน้า"
                    className="absolute left-2 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:flex"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    aria-label="รูปถัดไป"
                    className="absolute right-2 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:flex"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
            {(open.caption || open.label) && (
              <div className="flex-none px-4 py-3 text-center text-white">
                {open.caption && <p className="text-sm font-medium">{open.caption}</p>}
                {open.label && <p className="mt-0.5 text-xs text-white/50">{open.label}</p>}
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
