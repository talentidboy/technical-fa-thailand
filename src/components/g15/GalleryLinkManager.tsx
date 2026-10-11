"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link2, Loader2, AlertCircle, Pencil, Trash2, Plus, X } from "lucide-react";
import { GalleryAlbumCard, type GalleryAlbum } from "./GalleryAlbumCard";
import type { ActionResult } from "@/app/g15-womens-series/manage/actions";

type Album = GalleryAlbum & { matchId: number | null };

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

  const reset = () => {
    setEditId(null);
    setTitle("");
    setUrl("");
    setMatchId("");
    setError(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    if (editId != null) fd.set("id", String(editId));
    fd.set("title", title);
    fd.set("url", url);
    fd.set("matchId", matchId);
    fd.set("stage", stage);
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
