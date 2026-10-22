"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchMergeCandidates, getMergePreview, mergeCoachAction, type MergeCandidate } from "@/app/(admin)/coaches/[id]/merge-actions";
import { Combine, Search, AlertTriangle, ArrowRight, KeyRound } from "lucide-react";

type Preview = Awaited<ReturnType<typeof getMergePreview>>;
type Side = Extract<Preview, { ok: true }>["source"];

function SideCard({ s, keep }: { s: Side; keep: boolean }) {
  return (
    <div className={`flex-1 rounded-xl p-3 text-sm ring-1 ${keep ? "bg-emerald-50 ring-emerald-300" : "bg-slate-50 ring-slate-200"}`}>
      <p className={`text-[11px] font-bold ${keep ? "text-emerald-700" : "text-slate-500"}`}>{keep ? "เก็บประวัตินี้ไว้" : "รวมเข้าแล้วลบ"}</p>
      <p className="mt-0.5 font-semibold text-slate-900">
        #{s.id} {s.name}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        ใบอนุญาต: {s.licenses.length ? s.licenses.join(", ") : "-"} · ทำงาน {s.employments} · ใบสมัคร {s.applications}
      </p>
      <p className="text-xs text-slate-500">
        {s.afcId ?? "ไม่มี AFC ID"} · {s.idTail ? `เลขบัตร …${s.idTail}` : "ไม่มีเลขบัตร"}
        {s.hasAccount && (
          <span className="ml-1 inline-flex items-center gap-0.5 text-emerald-700">
            <KeyRound className="h-3 w-3" />
            มีบัญชี
          </span>
        )}
      </p>
    </div>
  );
}

// รวมประวัติผู้ฝึกสอนที่ซ้ำ (หน้าประวัติโค้ช — แอดมิน) — ค้นหาอีกประวัติ → ดูตัวอย่าง → เลือกว่าเก็บประวัติไหน → ยืนยัน
export function MergeCoachPanel({ coachId, initialOtherId }: { coachId: number; initialOtherId?: number | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(!!initialOtherId);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<MergeCandidate[] | null>(null);
  const [otherId, setOtherId] = useState<number | null>(initialOtherId ?? null);
  const [keepThis, setKeepThis] = useState(true);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sourceId = keepThis ? otherId : coachId;
  const targetId = keepThis ? coachId : otherId;

  useEffect(() => {
    if (!otherId || sourceId == null || targetId == null) return;
    let cancelled = false;
    void getMergePreview(sourceId, targetId).then((p) => {
      if (!cancelled) setPreview(p);
    });
    return () => {
      cancelled = true;
    };
  }, [otherId, sourceId, targetId]);

  const search = () =>
    startTransition(async () => {
      setResults(await searchMergeCandidates(coachId, q));
    });

  const merge = () => {
    if (sourceId == null || targetId == null) return;
    if (!confirm(`รวมประวัติ #${sourceId} เข้ากับ #${targetId}? ใบอนุญาตทั้งหมดจะย้ายไปไว้ที่ #${targetId} แล้วประวัติ #${sourceId} จะถูกลบ`)) return;
    startTransition(async () => {
      const res = await mergeCoachAction(sourceId, targetId);
      if (res.ok) router.push(`/coaches/${res.targetId}`);
      else setError(res.error);
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-violet-700 ring-1 ring-violet-200 hover:bg-violet-50"
      >
        <Combine className="h-4 w-4" />
        รวมประวัติซ้ำ
      </button>
    );
  }

  const ready = preview?.ok === true;
  return (
    <div className="space-y-4 rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-semibold text-slate-900">
          <Combine className="h-4 w-4 text-violet-600" />
          รวมประวัติผู้ฝึกสอนที่ซ้ำกัน
        </p>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-500 hover:text-slate-800">
          ปิด
        </button>
      </div>
      <p className="text-xs text-slate-500">ใบอนุญาต ใบสมัคร ประวัติการทำงาน และบัญชีเข้าสู่ระบบ จะย้ายไปไว้ที่ประวัติที่เก็บไว้ ช่องที่ว่างจะเติมจากอีกประวัติ แล้วลบประวัติที่ซ้ำ (บันทึกสำเนาไว้ในบันทึกการแก้ไข)</p>

      {!otherId && (
        <>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search())}
                placeholder="ค้นชื่อ / AFC ID / เลขบัตร / รหัส #"
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <button type="button" onClick={search} disabled={pending} className="rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
              ค้นหา
            </button>
          </div>
          {results && (
            <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
              {results.length === 0 && <li className="px-3 py-3 text-center text-sm text-slate-400">ไม่พบ</li>}
              {results.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => setOtherId(r.id)} className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-violet-50">
                    <span>
                      <b>#{r.id}</b> {r.name}
                      <span className="ml-2 text-xs text-slate-400">
                        {r.afcId ?? ""} {r.idTail ? `…${r.idTail}` : ""} · ใบอนุญาต {r.licenses}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-violet-500" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {otherId && (
        <>
          {preview && !preview.ok && <p className="text-sm text-red-600">{preview.error}</p>}
          {ready && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="text-slate-500">เก็บประวัติ:</span>
                {[true, false].map((v) => (
                  <label key={String(v)} className={`cursor-pointer rounded-lg px-3 py-1 ring-1 ${keepThis === v ? "bg-emerald-50 font-semibold text-emerald-800 ring-emerald-300" : "ring-slate-200"}`}>
                    <input type="radio" className="sr-only" checked={keepThis === v} onChange={() => setKeepThis(v)} />#{v ? coachId : otherId}
                  </label>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <SideCard s={preview.target} keep />
                <SideCard s={preview.source} keep={false} />
              </div>
              {preview.conflicts.length > 0 && (
                <p className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
                  {preview.conflicts.join(" · ")}
                </p>
              )}
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={merge}
              disabled={pending || !ready || (preview?.ok === true && preview.conflicts.length > 0)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-40"
            >
              <Combine className="h-4 w-4" />
              {pending ? "กำลังรวม..." : "ยืนยันรวมประวัติ"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOtherId(null);
                setPreview(null);
                setError(null);
              }}
              className="rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
            >
              เลือกประวัติอื่น
            </button>
          </div>
        </>
      )}
    </div>
  );
}
