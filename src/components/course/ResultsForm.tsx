"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Loader2, AlertTriangle, UserRound } from "lucide-react";
import { nthCertificateNo, defaultExpiry, toDateInput } from "@/lib/course-workflow";
import { confirmResults, type ActionResult } from "@/app/(admin)/course-sessions/[sessionId]/actions";

export type ResultRow = { id: number; name: string; nameEn: string | null; photoUrl: string | null; warnings: string[] };

const input =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

// ยืนยันผลทั้งรุ่นในหน้าเดียว — ติ๊กออกเฉพาะคนที่ไม่ผ่าน ที่เหลือได้ใบอนุญาต + เลขที่ใบประกาศเรียงต่อกันอัตโนมัติ
export function ResultsForm({
  sessionId,
  licenseType,
  rows,
  defaultIssueDate,
  defaultStartNo,
  instructors,
}: {
  sessionId: number;
  licenseType: string | null;
  rows: ResultRow[];
  defaultIssueDate: string;
  defaultStartNo: string;
  instructors: { id: number; name: string }[];
}) {
  const issuesLicence = Boolean(licenseType);
  const [passed, setPassed] = useState<Set<number>>(new Set(rows.map((r) => r.id)));
  const [issueDate, setIssueDate] = useState(defaultIssueDate);
  const [expireDate, setExpireDate] = useState(toDateInput(defaultExpiry(licenseType, new Date(defaultIssueDate))));
  const [expiryTouched, setExpiryTouched] = useState(false);
  const [startNo, setStartNo] = useState(defaultStartNo);
  const [instructorId, setInstructorId] = useState("");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const passedRows = rows.filter((r) => passed.has(r.id));
  const failedRows = rows.filter((r) => !passed.has(r.id));
  const numberOf = new Map(passedRows.map((r, i) => [r.id, nthCertificateNo(startNo.trim(), i)]));

  const submit = () => {
    const summary = `ผ่าน ${passedRows.length} คน · ไม่ผ่าน ${failedRows.length} คน`;
    const extra = issuesLicence && passedRows.length ? `\nระบบจะออกใบอนุญาตระดับ ${licenseType} ให้ ${passedRows.length} คนทันที` : "";
    if (!confirm(`ยืนยันผลการอบรม: ${summary}${extra}`)) return;
    startTransition(async () => {
      const res = await confirmResults({
        sessionId,
        passedIds: passedRows.map((r) => r.id),
        failedIds: failedRows.map((r) => r.id),
        issueDate,
        expireDate,
        instructorId: instructorId ? Number(instructorId) : null,
        startNo,
      });
      setResult(res);
      // สำเร็จ → ไปขั้นใบประกาศ พร้อมข้อความสรุป
      if (res.ok) router.push(`/course-sessions/${sessionId}?tab=certificates&done=${encodeURIComponent(res.message ?? "")}`);
    });
  };

  return (
    <div className="space-y-5">
      {issuesLicence && (
        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">วันที่ออกใบ</span>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => {
                setIssueDate(e.target.value);
                if (!expiryTouched && e.target.value) {
                  setExpireDate(toDateInput(defaultExpiry(licenseType, new Date(e.target.value))));
                }
              }}
              className={input}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">วันหมดอายุ</span>
            <input
              type="date"
              value={expireDate}
              onChange={(e) => {
                setExpireDate(e.target.value);
                setExpiryTouched(true);
              }}
              className={input}
            />
            <span className="text-xs text-slate-400">{expireDate ? "ตั้งให้ 3 ปีอัตโนมัติ แก้ได้" : "เว้นว่าง = ไม่มีวันหมดอายุ"}</span>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">เลขที่ใบประกาศเริ่มต้น</span>
            <input value={startNo} onChange={(e) => setStartNo(e.target.value)} className={`${input} font-mono`} />
            <span className="text-xs text-slate-400">ต่อจากเลขล่าสุดในระบบ คนถัดไปบวกเพิ่มทีละ 1</span>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">วิทยากรผู้สอน</span>
            <select value={instructorId} onChange={(e) => setInstructorId(e.target.value)} className={input}>
              <option value="">ไม่ระบุ</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
          <p className="text-sm font-semibold text-slate-700">
            ติ๊ก = ผ่าน · เอาติ๊กออก = ไม่ผ่าน
          </p>
          <div className="flex gap-2 text-xs">
            <button type="button" onClick={() => setPassed(new Set(rows.map((r) => r.id)))} className="font-semibold text-indigo-600 hover:underline">
              ผ่านทุกคน
            </button>
            <span className="text-slate-300">|</span>
            <button type="button" onClick={() => setPassed(new Set())} className="font-semibold text-slate-500 hover:underline">
              ล้าง
            </button>
          </div>
        </div>
        <ul className="divide-y divide-slate-100">
          {rows.map((r, idx) => {
            const ok = passed.has(r.id);
            return (
              <li key={r.id}>
                <label className={`flex cursor-pointer items-center gap-3 px-5 py-3 ${ok ? "" : "bg-red-50/50"}`}>
                  <span className="w-6 flex-none text-right text-xs tabular-nums text-slate-400">{idx + 1}</span>
                  <input
                    type="checkbox"
                    checked={ok}
                    onChange={() =>
                      setPassed((prev) => {
                        const next = new Set(prev);
                        if (next.has(r.id)) next.delete(r.id);
                        else next.add(r.id);
                        return next;
                      })
                    }
                    className="h-5 w-5 flex-none rounded border-slate-300 accent-emerald-600"
                  />
                  {r.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.photoUrl} alt="" className="h-9 w-9 flex-none rounded-full object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <UserRound className="h-4 w-4" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{r.name}</p>
                    {r.nameEn && <p className="truncate text-xs uppercase text-slate-400">{r.nameEn}</p>}
                    {ok && r.warnings.length > 0 && (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-amber-700">
                        <AlertTriangle className="h-3 w-3" />
                        {r.warnings.join(" · ")}
                      </p>
                    )}
                  </div>
                  <span
                    className={`flex-none rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      ok ? "bg-emerald-50 font-mono text-emerald-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {ok ? (issuesLicence ? numberOf.get(r.id) : "ผ่าน") : "ไม่ผ่าน"}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      {result && (
        <p
          role="status"
          className={`rounded-lg px-4 py-3 text-sm ${
            result.ok ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"
          }`}
        >
          {result.ok ? result.message : result.error}
        </p>
      )}

      <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-3 rounded-2xl bg-slate-900 p-3 pl-5 text-white shadow-2xl">
        <p className="mr-auto text-sm">
          ผ่าน <b className="text-emerald-300">{passedRows.length}</b> คน · ไม่ผ่าน <b className="text-red-300">{failedRows.length}</b> คน
        </p>
        <button
          type="button"
          disabled={pending || rows.length === 0}
          onClick={submit}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
          {issuesLicence ? "ยืนยันผล + ออกใบอนุญาต" : "ยืนยันผล"}
        </button>
      </div>
    </div>
  );
}
