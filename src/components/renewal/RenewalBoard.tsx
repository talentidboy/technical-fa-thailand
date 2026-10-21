"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { renewLicenses, rejectRenewal, type ActionResult } from "@/app/(admin)/renewals/actions";
import { renewedExpiry, thaiDate, todayThai, daysUntil, formatThaiDate, RENEWAL_YEARS } from "@/lib/license-renewal";
import { CalendarClock, Check, X, Phone, FileImage, KeyRound, ArrowRight, MessageSquareText } from "lucide-react";

export type RenewalRow = {
  key: string;
  recordId: number;
  requestId: number | null;
  coachId: number;
  name: string;
  nameEn: string | null;
  afcId: string | null;
  photoUrl: string | null;
  phone: string | null;
  hasAccount: boolean;
  licenseType: string;
  certificateNo: string | null;
  expireDate: string; // ISO
  pendingRequest: boolean;
  note: string | null;
  evidenceUrl: string | null;
  requestedAt: string | null;
};

function ExpiryBadge({ iso, now }: { iso: string; now: Date }) {
  const days = daysUntil(new Date(iso), now);
  const tone =
    days < 0
      ? "bg-red-50 text-red-700 ring-red-200"
      : days <= 90
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-sky-50 text-sky-700 ring-sky-200";
  const text = days < 0 ? `หมดอายุมาแล้ว ${Math.abs(days).toLocaleString()} วัน` : days === 0 ? "หมดอายุวันนี้" : `เหลืออีก ${days} วัน`;
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${tone}`}>{text}</span>;
}

// รายการใบอนุญาต/คำขอ + ติ๊กเลือกหลายใบ → ต่ออายุทีเดียว (มีพรีวิววันหมดอายุใหม่ของแต่ละใบ)
// nowIso มาจาก server (ห้ามเรียกเวลาปัจจุบันระหว่าง render)
export function RenewalBoard({ rows, mode, nowIso }: { rows: RenewalRow[]; mode: "licenses" | "requests"; nowIso: string }) {
  const now = new Date(nowIso);
  const today = todayThai(now);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [date, setDate] = useState(today);
  const [years, setYears] = useState(RENEWAL_YEARS);
  const [note, setNote] = useState("");
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  const renewDate = thaiDate(date);
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.key));
  const toggle = (key: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  const submit = () => {
    const chosen = rows.filter((r) => selected.has(r.key));
    startTransition(async () => {
      const res = await renewLicenses({
        recordIds: mode === "licenses" ? chosen.map((r) => r.recordId) : [],
        requestIds: mode === "requests" ? chosen.map((r) => r.requestId!).filter(Boolean) : [],
        date,
        years,
        note,
      });
      setResult(res);
      if (res.ok) {
        setSelected(new Set());
        setNote("");
      }
    });
  };

  const reject = (requestId: number) =>
    startTransition(async () => {
      const res = await rejectRenewal(requestId, reason);
      setResult(res);
      if (res.ok) {
        setRejecting(null);
        setReason("");
      }
    });

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-500">
        {mode === "requests" ? "ไม่มีคำขอต่ออายุที่รอตรวจสอบ" : "ไม่มีใบอนุญาตในกลุ่มนี้"}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {result && (
        <p
          role="status"
          className={`rounded-xl px-4 py-3 text-sm font-medium ring-1 ${result.ok ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-red-50 text-red-700 ring-red-200"}`}
        >
          {result.ok ? result.message : result.error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <label className="flex cursor-pointer items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={allOnPage}
            onChange={() => setSelected(allOnPage ? new Set() : new Set(rows.map((r) => r.key)))}
            className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
          />
          เลือกทั้งหมดในหน้านี้ ({rows.length})
        </label>
        <ul className="divide-y divide-slate-100">
          {rows.map((r) => {
            const on = selected.has(r.key);
            const next = on && renewDate ? renewedExpiry(new Date(r.expireDate), renewDate, years) : null;
            return (
              <li key={r.key} className={`px-4 py-3 transition-colors ${on ? "bg-indigo-50/60" : ""}`}>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(r.key)}
                    aria-label={`เลือก ${r.name}`}
                    className="mt-3 h-4 w-4 flex-none rounded border-slate-300 accent-indigo-600"
                  />
                  {r.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.photoUrl} alt="" className="h-10 w-10 flex-none rounded-full object-cover ring-1 ring-slate-200" />
                  ) : (
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
                      {r.name.replace(/^[เแโใไ]/, "").charAt(0)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Link href={`/coaches/${r.coachId}`} className="font-semibold text-slate-900 hover:text-indigo-700">
                        {r.name}
                      </Link>
                      {r.afcId && <span className="text-xs text-slate-400">{r.afcId}</span>}
                      {r.hasAccount && (
                        <span title="มีบัญชีเข้าสู่ระบบ" className="inline-flex items-center gap-0.5 text-[11px] text-emerald-600">
                          <KeyRound className="h-3 w-3" />
                          บัญชี
                        </span>
                      )}
                      {mode === "licenses" && r.pendingRequest && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">มีคำขอจากโค้ช</span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="rounded-md bg-indigo-600 px-1.5 py-0.5 text-[11px] font-black text-white">{r.licenseType}</span>
                      {r.certificateNo && <span>เลขที่ {r.certificateNo}</span>}
                      <span>หมดอายุ {formatThaiDate(new Date(r.expireDate))}</span>
                      <ExpiryBadge iso={r.expireDate} now={now} />
                      {next && (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                          <ArrowRight className="h-3 w-3" />
                          ใหม่ {formatThaiDate(next)}
                        </span>
                      )}
                      {r.phone && (
                        <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 hover:text-indigo-700">
                          <Phone className="h-3 w-3" />
                          {r.phone}
                        </a>
                      )}
                    </div>
                    {mode === "requests" && (
                      <div className="mt-2 space-y-2">
                        {r.note && (
                          <p className="flex gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            <MessageSquareText className="mt-0.5 h-4 w-4 flex-none text-slate-400" />
                            <span className="whitespace-pre-line">{r.note}</span>
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          {r.requestedAt && <span>ยื่นเมื่อ {formatThaiDate(new Date(r.requestedAt))}</span>}
                          {r.evidenceUrl && (
                            <a href={r.evidenceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline">
                              <FileImage className="h-3.5 w-3.5" />
                              ดูหลักฐาน
                            </a>
                          )}
                          {rejecting === r.requestId ? null : (
                            <button
                              type="button"
                              onClick={() => {
                                setRejecting(r.requestId);
                                setReason("");
                              }}
                              className="font-semibold text-red-600 hover:underline"
                            >
                              ไม่อนุมัติ
                            </button>
                          )}
                        </div>
                        {rejecting === r.requestId && (
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <input
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              placeholder="เหตุผล เช่น หลักฐาน CPD ไม่ครบ — โค้ชจะเห็นข้อความนี้"
                              className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => reject(r.requestId!)}
                                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                ยืนยันไม่อนุมัติ
                              </button>
                              <button type="button" onClick={() => setRejecting(null)} className="rounded-lg px-3 py-2 text-xs text-slate-500 hover:bg-slate-100">
                                ยกเลิก
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* แถบต่ออายุ — โผล่เมื่อเลือกอย่างน้อย 1 ใบ */}
      {selected.size > 0 && (
        <div className="sticky bottom-4 z-10 rounded-2xl bg-indigo-950 p-4 text-white shadow-xl shadow-indigo-950/30">
          <div className="flex flex-wrap items-end gap-3">
            <p className="flex items-center gap-2 font-semibold">
              <CalendarClock className="h-5 w-5 text-amber-300" />
              {mode === "requests" ? "อนุมัติคำขอ" : "ต่ออายุ"} {selected.size} ใบ
            </p>
            <label className="text-xs text-indigo-200">
              วันที่ต่ออายุ
              <input
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block rounded-lg border-0 bg-white/10 px-3 py-2 text-sm text-white [color-scheme:dark] focus:ring-2 focus:ring-amber-300"
              />
            </label>
            <label className="text-xs text-indigo-200">
              อายุใบอนุญาต
              <select
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="mt-1 block rounded-lg border-0 bg-white/10 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-300 [&>option]:text-slate-900"
              >
                {[1, 2, 3, 4, 5].map((y) => (
                  <option key={y} value={y}>
                    {y} ปี
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-48 flex-1 text-xs text-indigo-200">
              หมายเหตุ (ไม่บังคับ)
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เช่น ผ่านสัมมนา CPD ประจำปี 2569"
                className="mt-1 block w-full rounded-lg border-0 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-indigo-300/60 focus:ring-2 focus:ring-amber-300"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending || !renewDate}
                onClick={submit}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {pending ? "กำลังบันทึก..." : "ยืนยันต่ออายุ"}
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                aria-label="ยกเลิกการเลือก"
                className="rounded-xl bg-white/10 px-3 py-2.5 hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-indigo-300">
            ใบที่ยังไม่หมดอายุ ต่อจากวันหมดอายุเดิม · ใบที่หมดอายุแล้ว นับ {years} ปีจากวันที่ต่ออายุ — ดูวันหมดอายุใหม่ได้ในแต่ละแถว
          </p>
        </div>
      )}
    </div>
  );
}
