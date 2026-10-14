"use client";

import { useRef, useState, useTransition } from "react";
import { Search, Plus, Check, Loader2 } from "lucide-react";
import { searchCoaches, addParticipants, type CoachSearchRow } from "@/app/(admin)/course-sessions/[sessionId]/actions";

// เพิ่มผู้เข้าอบรมเองจากรายชื่อในระบบ (คนที่ไม่ได้สมัครออนไลน์) — ค้นด้วยชื่อ, เลขบัตร, AFC ID หรือเลขที่ใบประกาศ
export function AddParticipants({ sessionId }: { sessionId: number }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<CoachSearchRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [added, setAdded] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef("");

  const onChange = (value: string) => {
    setQ(value);
    latest.current = value;
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setRows([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setSearching(true);
      const found = await searchCoaches(sessionId, value);
      if (latest.current === value) {
        setRows(found);
        setSearching(false);
      }
    }, 300);
  };

  const add = (id: number) =>
    startTransition(async () => {
      const res = await addParticipants(sessionId, [id]);
      if (res.ok) setAdded((prev) => new Set(prev).add(id));
      else setError(res.error);
    });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          autoFocus
          value={q}
          onChange={(e) => onChange(e.target.value)}
          placeholder="พิมพ์ชื่อ นามสกุล / เลขบัตรประชาชน / AFC ID / เลขที่ใบประกาศ"
          className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        {searching && <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />}
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {q.trim().length >= 2 && !searching && rows.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-400">ไม่พบรายชื่อ — ให้ผู้เข้าอบรมกรอกฟอร์มสมัครจากลิงก์ของรุ่นนี้แทน</p>
      )}

      <ul className="divide-y divide-slate-100">
        {rows.map((r) => {
          const done = r.inSession || added.has(r.id);
          return (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {r.name} {r.nameEn && <span className="text-xs font-normal uppercase text-slate-400">{r.nameEn}</span>}
                </p>
                <p className="text-xs text-slate-500">
                  ระดับ {r.level ?? "-"}
                  {r.certificateNo && ` · ${r.certificateNo}`}
                  {r.idTail && ` · บัตร ••••${r.idTail}`}
                </p>
              </div>
              <button
                type="button"
                disabled={done || pending}
                onClick={() => add(r.id)}
                className={`inline-flex flex-none items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  done ? "bg-emerald-50 text-emerald-700" : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {done ? "อยู่ในรุ่นแล้ว" : "เพิ่ม"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
