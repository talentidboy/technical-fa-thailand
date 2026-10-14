"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Check, X, RotateCcw, AlertTriangle, Phone, Mail, Loader2, Merge, UserRound } from "lucide-react";
import { APPLICATION_STATUS } from "@/lib/course-workflow";
import { reviewApplications, mergeIntoExistingCoach, type ActionResult } from "@/app/(admin)/course-sessions/[sessionId]/actions";

export type ApplicantRow = {
  id: number;
  coachId: number;
  status: string;
  name: string;
  nameEn: string | null;
  photoUrl: string | null;
  idTail: string | null;
  telNo: string | null;
  email: string | null;
  level: string | null;
  appliedAt: string;
  addedByStaff: boolean;
  warnings: string[];
  matches: { coachId: number; name: string; level: string | null; certificateNo: string | null; idTail: string | null }[];
};

const FILTERS = [
  { key: "PENDING", label: "รออนุมัติ" },
  { key: "APPROVED", label: "อนุมัติแล้ว" },
  { key: "REJECTED", label: "ไม่อนุมัติ" },
  { key: "ALL", label: "ทั้งหมด" },
] as const;

export function ApplicantsBoard({ sessionId, rows }: { sessionId: number; rows: ApplicantRow[] }) {
  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);
  const [filter, setFilter] = useState<string>(counts.PENDING ? "PENDING" : "ALL");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = rows.filter((r) => filter === "ALL" || r.status === filter);
  // เลือกได้เฉพาะคนที่ยังไม่ได้ยืนยันผล
  const selectable = visible.filter((r) => !["PASSED", "FAILED"].includes(r.status));
  const allChecked = selectable.length > 0 && selectable.every((r) => selected.has(r.id));

  const run = (fn: () => Promise<ActionResult>) =>
    startTransition(async () => {
      const res = await fn();
      setResult(res);
      if (res.ok) setSelected(new Set());
    });
  const review = (ids: number[], decision: "APPROVED" | "REJECTED" | "PENDING") =>
    run(() => reviewApplications(sessionId, ids, decision));

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => {
              setFilter(f.key);
              setSelected(new Set());
            }}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {f.label}
            <span className={`rounded-full px-1.5 text-xs tabular-nums ${filter === f.key ? "bg-white/20" : "bg-slate-100"}`}>
              {counts[f.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {result && (
        <p
          role="status"
          className={`rounded-lg px-4 py-2.5 text-sm ${
            result.ok ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"
          }`}
        >
          {result.ok ? (result.message ?? "บันทึกแล้ว") : result.error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {visible.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-slate-400">ไม่มีรายชื่อในหมวดนี้</p>
        ) : (
          <>
            {selectable.length > 0 && (
              <label className="flex cursor-pointer items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-600 sm:px-5">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={() => setSelected(allChecked ? new Set() : new Set(selectable.map((r) => r.id)))}
                  className="h-5 w-5 rounded border-slate-300 accent-indigo-600"
                />
                เลือกทั้งหมดในหน้านี้ ({selectable.length} คน)
              </label>
            )}
            <ul className="divide-y divide-slate-100">
              {visible.map((r) => {
                const st = APPLICATION_STATUS[r.status] ?? APPLICATION_STATUS.CANCELLED;
                const canSelect = !["PASSED", "FAILED"].includes(r.status);
                return (
                  <li key={r.id} className={`px-4 py-4 sm:px-5 ${selected.has(r.id) ? "bg-indigo-50/60" : ""}`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        aria-label={`เลือก ${r.name}`}
                        disabled={!canSelect}
                        checked={selected.has(r.id)}
                        onChange={() => toggle(r.id)}
                        className="mt-3 h-5 w-5 flex-none rounded border-slate-300 accent-indigo-600 disabled:opacity-30"
                      />
                      {r.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.photoUrl} alt="" className="h-11 w-11 flex-none rounded-full object-cover ring-2 ring-white" />
                      ) : (
                        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <UserRound className="h-5 w-5" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <Link href={`/coaches/${r.coachId}`} className="font-semibold text-slate-900 hover:text-indigo-600">
                            {r.name}
                          </Link>
                          {r.nameEn && <span className="text-xs uppercase text-slate-400">{r.nameEn}</span>}
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${st.className}`}>{st.label}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>
                            ระดับปัจจุบัน: <b className="text-slate-700">{r.level ?? "ไม่มี"}</b>
                          </span>
                          {r.idTail && <span>บัตร ปชช. ••••{r.idTail}</span>}
                          {r.telNo && (
                            <a href={`tel:${r.telNo}`} className="inline-flex items-center gap-1 hover:text-indigo-600">
                              <Phone className="h-3 w-3" />
                              {r.telNo}
                            </a>
                          )}
                          {r.email && (
                            <span className="inline-flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {r.email}
                            </span>
                          )}
                          <span className="text-slate-400">{r.addedByStaff ? "เพิ่มโดยเจ้าหน้าที่" : `สมัคร ${r.appliedAt}`}</span>
                        </div>
                        {r.warnings.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {r.warnings.map((w) => (
                              <span
                                key={w}
                                className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200"
                              >
                                <AlertTriangle className="h-3 w-3" />
                                {w}
                              </span>
                            ))}
                          </div>
                        )}
                        {r.matches.length > 0 && (
                          <div className="mt-2.5 rounded-xl bg-sky-50 p-3 ring-1 ring-sky-200">
                            <p className="text-xs font-semibold text-sky-900">
                              พบประวัติเดิมชื่อเดียวกันในระบบ — ถ้าเป็นคนเดียวกัน กดรวมเพื่อใช้ใบอนุญาตเดิม
                            </p>
                            <ul className="mt-2 space-y-1.5">
                              {r.matches.map((m) => (
                                <li key={m.coachId} className="flex flex-wrap items-center justify-between gap-2 text-xs text-sky-900">
                                  <Link href={`/coaches/${m.coachId}`} className="hover:underline">
                                    {m.name} · ระดับ {m.level ?? "-"}
                                    {m.certificateNo && ` · ${m.certificateNo}`}
                                    {m.idTail && ` · บัตร ••••${m.idTail}`}
                                  </Link>
                                  <button
                                    type="button"
                                    disabled={pending}
                                    onClick={() => {
                                      if (confirm(`รวม "${r.name}" เข้ากับประวัติเดิม "${m.name}" ใช่ไหม?\nบัญชี ใบสมัคร และข้อมูลที่กรอกใหม่จะย้ายไปอยู่ที่ประวัติเดิม`)) {
                                        run(() => mergeIntoExistingCoach(sessionId, r.id, m.coachId));
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1 font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                                  >
                                    <Merge className="h-3.5 w-3.5" />
                                    คนเดียวกัน — รวมประวัติ
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      {r.status === "PENDING" && (
                        <div className="flex flex-none flex-col gap-1.5 sm:flex-row">
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => review([r.id], "APPROVED")}
                            className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                            อนุมัติ
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => review([r.id], "REJECTED")}
                            aria-label={`ไม่อนุมัติ ${r.name}`}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-2.5 py-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {selected.size > 0 && (
        <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-2 rounded-2xl bg-slate-900 p-3 text-white shadow-2xl sm:px-5">
          <span className="mr-auto text-sm font-semibold">เลือก {selected.size} คน</span>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          <button
            type="button"
            disabled={pending}
            onClick={() => review([...selected], "APPROVED")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            อนุมัติเข้าอบรม
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => review([...selected], "REJECTED")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            ไม่อนุมัติ
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => review([...selected], "PENDING")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            ย้อนเป็นรออนุมัติ
          </button>
          <button type="button" onClick={() => setSelected(new Set())} className="px-2 py-2 text-sm text-slate-300 hover:text-white">
            ล้าง
          </button>
        </div>
      )}
    </div>
  );
}
