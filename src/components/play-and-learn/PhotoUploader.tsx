"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Check, AlertCircle } from "lucide-react";
import { addPhoto } from "@/app/play-and-learn/manage/actions";

// อัปโหลดรูปแกลเลอรีหลายรูปพร้อมกัน — ส่งทีละรูป (รูปถูกย่อให้อัตโนมัติตอนเลือกไฟล์ใน instrumentation-client.ts)
export function PhotoUploader({ albums }: { albums: string[] }) {
  const router = useRouter();
  const [progress, setProgress] = useState<{ done: number; total: number; errors: string[] } | null>(null);
  const busy = progress !== null && progress.done < progress.total;

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const files = Array.from((form.elements.namedItem("images") as HTMLInputElement).files ?? []);
        if (!files.length) return;
        const album = String(new FormData(form).get("extra") ?? "");
        const errors: string[] = [];
        setProgress({ done: 0, total: files.length, errors });
        for (const [i, f] of files.entries()) {
          const fd = new FormData();
          fd.set("image", f);
          fd.set("extra", album);
          const res = await addPhoto(fd).catch(() => ({ ok: false as const, error: "เชื่อมต่อไม่สำเร็จ" }));
          if (!res.ok) errors.push(`${f.name}: ${res.error}`);
          setProgress({ done: i + 1, total: files.length, errors: [...errors] });
        }
        form.reset();
        router.refresh();
      }}
      className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_220px_auto] sm:items-end"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">
          เลือกรูป (เลือกได้หลายรูป)<span className="text-red-500"> *</span>
        </span>
        <input
          name="images"
          type="file"
          multiple
          required
          accept="image/jpeg,image/png,image/webp"
          className="rounded-lg border border-dashed border-pink-300 bg-pink-50/40 px-3 py-2.5 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-pink-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">อัลบั้ม</span>
        <input
          name="extra"
          list="pl-albums"
          placeholder="เช่น ศูนย์ชลบุรี 2569"
          className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <datalist id="pl-albums">
          {albums.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
      </label>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-pink-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-pink-200 transition-colors hover:bg-pink-600 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        อัปโหลด
      </button>

      {progress && (
        <div className="space-y-2 sm:col-span-3">
          <div className="h-2 overflow-hidden rounded-full bg-pink-100">
            <div className="h-full rounded-full bg-linear-to-r from-pink-400 to-purple-400 transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
          <p role="status" className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            {busy ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                กำลังอัปโหลด {progress.done}/{progress.total} รูป...
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                อัปโหลดเสร็จ {progress.total - progress.errors.length}/{progress.total} รูป
              </>
            )}
          </p>
          {progress.errors.map((err) => (
            <p key={err} role="alert" className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              <AlertCircle className="h-3.5 w-3.5 flex-none" />
              {err}
            </p>
          ))}
        </div>
      )}
    </form>
  );
}
