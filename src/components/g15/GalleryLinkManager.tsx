"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link2, Loader2, AlertCircle, Pencil, Trash2, Plus, X, ImagePlus } from "lucide-react";
import { GalleryAlbumCard, type GalleryAlbum } from "./GalleryAlbumCard";
import type { ActionResult } from "@/app/g15-womens-series/manage/actions";

type Album = GalleryAlbum & { matchId: number | null };

// ย่อรูปปกในเบราว์เซอร์เป็น WebP ด้านยาวไม่เกิน 1600px (รูปจากมือถือหลาย MB เหลือไม่กี่ร้อย KB)
async function resizeCover(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("แปลงรูปไม่สำเร็จ"))), "image/webp", 0.85),
  );
  return new File([blob], "cover.webp", { type: "image/webp" });
}

// สำหรับแอดมิน: ฟอร์มเพิ่ม/แก้อัลบั้ม (หัวข้อ + ลิงก์ + ผูกนัด) และปุ่มแก้/ลบบนการ์ด
export function GalleryLinkManager({
  stage,
  albums,
  matches,
  saveAction,
  deleteAction,
}: {
  stage: string;
  albums: Album[];
  matches: { id: number; label: string }[];
  saveAction: (fd: FormData) => Promise<ActionResult>;
  deleteAction: (fd: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editId, setEditId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [matchId, setMatchId] = useState("");
  const [error, setError] = useState<string | null>(null);
  // รูปปก: cover = ไฟล์ใหม่ที่เลือก, existingCover = ปกเดิม (ตอนแก้ไข), removeCover = กดเอาปกเดิมออก
  const [cover, setCover] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [existingCover, setExistingCover] = useState<string | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [fileKey, setFileKey] = useState(0);

  const setCoverFile = (f: File | null) => {
    setCover(f);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return f ? URL.createObjectURL(f) : null;
    });
  };

  const reset = () => {
    setEditId(null);
    setTitle("");
    setUrl("");
    setMatchId("");
    setError(null);
    setCoverFile(null);
    setExistingCover(null);
    setRemoveCover(false);
    setFileKey((k) => k + 1);
  };

  const pickCover = async (file: File | undefined) => {
    if (!file) return;
    try {
      setCoverFile(await resizeCover(file));
      setRemoveCover(false);
    } catch {
      setError("อ่านไฟล์รูปไม่ได้ ลองเลือกรูปอื่น");
    }
  };
  const shownCover = preview ?? (removeCover ? null : existingCover);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    if (editId != null) fd.set("id", String(editId));
    fd.set("title", title);
    fd.set("url", url);
    fd.set("matchId", matchId);
    fd.set("stage", stage);
    if (cover) fd.set("cover", cover);
    if (removeCover) fd.set("removeCover", "1");
    setError(null);
    startTransition(async () => {
      const res = await saveAction(fd);
      if (!res.ok) setError(res.error);
      else {
        reset();
        router.refresh();
      }
    });
  };

  const remove = (a: Album) => {
    if (!window.confirm(`ลบอัลบั้ม "${a.title}"?`)) return;
    const fd = new FormData();
    fd.set("id", String(a.id));
    startTransition(async () => {
      const res = await deleteAction(fd);
      if (!res.ok) setError(res.error);
      else {
        if (editId === a.id) reset();
        router.refresh();
      }
    });
  };

  const field =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-g15-400 focus:outline-none focus:ring-2 focus:ring-g15-100";

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="rounded-3xl bg-white p-5 shadow-xl shadow-g15-950/10 ring-1 ring-slate-200 sm:p-6">
        <p className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
          <Link2 className="h-4 w-4 text-g15-600" />
          {editId != null ? "แก้ไขอัลบั้ม" : "เพิ่มอัลบั้ม"} <span className="font-normal text-slate-400">(เฉพาะแอดมิน)</span>
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ชื่อหัวข้อ เช่น ภาพบรรยากาศวันที่ 10 ต.ค." className={field} required />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="วางลิงก์ เช่น https://drive.google.com/..." className={field} inputMode="url" required />
          <select value={matchId} onChange={(e) => setMatchId(e.target.value)} className={`${field} sm:col-span-2`}>
            <option value="">ไม่ผูกกับนัด (อัลบั้มทั่วไป)</option>
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        {/* รูปปก (ไม่บังคับ) — ตัวอย่างสัดส่วน 16:9 แบบเดียวกับการ์ด */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="relative aspect-video w-40 flex-none overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
            {shownCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shownCover} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[11px] text-slate-400">ยังไม่มีรูปปก</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <ImagePlus className="h-4 w-4 text-g15-600" />
              {shownCover ? "เปลี่ยนรูปปก" : "เลือกรูปปก"}
              <input key={fileKey} type="file" accept="image/*" className="sr-only" onChange={(e) => pickCover(e.target.files?.[0])} />
            </label>
            {shownCover && (
              <button
                type="button"
                onClick={() => {
                  setCoverFile(null);
                  setFileKey((k) => k + 1);
                  if (existingCover) setRemoveCover(true);
                }}
                className="inline-flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-4 w-4" /> เอารูปปกออก
              </button>
            )}
          </div>
          <p className="w-full text-[11px] text-slate-400">แนะนำรูปแนวนอน · ไม่ใส่ก็ได้ (จะใช้ปกสีตามแหล่งที่มาของลิงก์)</p>
        </div>
        {error && (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600">
            <AlertCircle className="h-3.5 w-3.5" /> {error}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-g15-600 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-g15-700 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {editId != null ? "บันทึกการแก้ไข" : "เพิ่มอัลบั้ม"}
          </button>
          {editId != null && (
            <button type="button" onClick={reset} className="inline-flex h-11 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-slate-500 hover:bg-slate-100">
              <X className="h-4 w-4" /> ยกเลิก
            </button>
          )}
        </div>
      </form>

      {albums.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {albums.map((a) => (
            <GalleryAlbumCard key={a.id} album={a}>
              <div className="mt-1.5 flex justify-end gap-1">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setEditId(a.id);
                    setTitle(a.title);
                    setUrl(a.url);
                    setMatchId(a.matchId != null ? String(a.matchId) : "");
                    setCoverFile(null);
                    setExistingCover(a.coverUrl);
                    setRemoveCover(false);
                    setFileKey((k) => k + 1);
                    setError(null);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-slate-500 hover:bg-g15-50 hover:text-g15-700"
                >
                  <Pencil className="h-3.5 w-3.5" /> แก้ไข
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => remove(a)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" /> ลบ
                </button>
              </div>
            </GalleryAlbumCard>
          ))}
        </div>
      )}
    </div>
  );
}
