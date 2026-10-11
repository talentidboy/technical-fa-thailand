"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, AlertCircle, Check } from "lucide-react";
import type { ActionResult } from "@/app/g15-womens-series/manage/actions";

// ย่อรูปในเบราว์เซอร์เป็น WebP ก่อนส่ง — รูปจากมือถือ 5-10MB เหลือราว 300-600KB (โหลดเร็ว + ไม่ติดลิมิตขนาดของ Server Action)
async function resize(file: File, maxSide: number, quality: number) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("แปลงรูปไม่สำเร็จ"))), "image/webp", quality),
  );
  return { file: new File([blob], "photo.webp", { type: "image/webp" }), width: w, height: h };
}

export function GalleryUploader({
  stage,
  matches,
  action,
}: {
  stage: string;
  matches: { id: number; label: string }[];
  action: (fd: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [matchId, setMatchId] = useState("");
  const [caption, setCaption] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [finished, setFinished] = useState<number | null>(null);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setErrors([]);
    setFinished(null);
    setProgress({ done: 0, total: list.length });
    let ok = 0;
    // ทีละรูป — มือถือหน่วยความจำน้อย และเห็นความคืบหน้าชัด
    for (let i = 0; i < list.length; i++) {
      try {
        const full = await resize(list[i], 2000, 0.85);
        const thumb = await resize(list[i], 640, 0.8);
        const fd = new FormData();
        fd.set("photo", full.file);
        fd.set("thumb", thumb.file);
        fd.set("width", String(full.width));
        fd.set("height", String(full.height));
        fd.set("stage", stage);
        fd.set("matchId", matchId);
        fd.set("caption", caption);
        const res = await action(fd);
        if (res.ok) ok++;
        else setErrors((e) => [...e, `${list[i].name}: ${res.error}`]);
      } catch (err) {
        setErrors((e) => [...e, `${list[i].name}: ${err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ"}`]);
      }
      setProgress({ done: i + 1, total: list.length });
    }
    setProgress(null);
    setFinished(ok);
    if (input.current) input.current.value = "";
    router.refresh();
  };

  const busy = progress != null;
  const field =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-g15-400 focus:outline-none focus:ring-2 focus:ring-g15-100";

  return (
    <div className="rounded-3xl bg-white p-5 shadow-xl shadow-g15-950/10 ring-1 ring-slate-200 sm:p-6">
      <p className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
        <ImagePlus className="h-4 w-4 text-g15-600" />
        อัปโหลดรูป <span className="font-normal text-slate-400">(เฉพาะแอดมิน · เลือกได้หลายรูปพร้อมกัน)</span>
      </p>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <select value={matchId} onChange={(e) => setMatchId(e.target.value)} disabled={busy} className={field}>
          <option value="">ภาพทั่วไป (ไม่ผูกกับนัด)</option>
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <input value={caption} onChange={(e) => setCaption(e.target.value)} disabled={busy} placeholder="คำบรรยายภาพ (ไม่บังคับ)" className={field} />
        <label
          className={`inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-g15-600 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-g15-700 ${
            busy ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {busy ? `กำลังอัปโหลด ${progress.done}/${progress.total}` : "เลือกรูป"}
          <input ref={input} type="file" accept="image/*" multiple className="sr-only" disabled={busy} onChange={(e) => upload(e.target.files)} />
        </label>
      </div>
      {busy && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-g15-500 transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
        </div>
      )}
      {finished != null && finished > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <Check className="h-3.5 w-3.5" /> อัปโหลดสำเร็จ {finished} รูป
        </p>
      )}
      {errors.map((e) => (
        <p key={e} className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5 flex-none" /> {e}
        </p>
      ))}
    </div>
  );
}
