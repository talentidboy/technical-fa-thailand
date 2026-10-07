"use client";

import { useActionState, useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, AlertCircle, ChevronRight, Loader2, MapPin, Radio } from "lucide-react";
import { TeamBadge } from "./TeamBadge";
import { LivePill } from "./LivePill";
import { isKnockoutRound } from "@/lib/g15-stage";
import type { ActionResult } from "@/app/g15-womens-series/manage/actions";

type TeamLite = { name: string; logoUrl: string | null; groupName: string | null };

export type QuickScoreMatch = {
  id: number;
  round: string;
  matchNo: number | null;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homePenalty: number | null;
  awayPenalty: number | null;
  timeLabel: string;
  venueLabel: string | null;
  // อยู่ในช่วงเวลาแข่งตามโปรแกรม (คำนวณฝั่งเซิร์ฟเวอร์) — โชว์ปุ่ม "อัปเดตสด" ให้กรอกสกอร์ระหว่างเกม
  liveNow?: boolean;
  homeTeam: TeamLite;
  awayTeam: TeamLite;
};

const toStr = (n: number | null) => (n == null ? "" : String(n));

const scoreInput =
  "h-11 w-12 rounded-xl border border-slate-200 bg-white text-center text-lg font-bold tabular-nums text-slate-900 focus:border-g15-400 focus:outline-none focus:ring-2 focus:ring-g15-100 sm:w-14";
const penInput =
  "h-8 w-10 rounded-lg border border-slate-200 bg-white text-center text-sm font-semibold tabular-nums text-slate-700 focus:border-g15-400 focus:outline-none focus:ring-2 focus:ring-g15-100";

// แถวนัดการแข่งขันที่กรอกสกอร์ได้ทันที — ไม่ต้องกดขยาย/เปิดฟอร์มแก้ไขก่อน (วันแข่งจริงแอดมินกรอกผลทีละนัดเร็วๆ)
// ช่องจุดโทษโผล่เฉพาะนัดน็อกเอาต์ที่สกอร์เสมอกัน, ปุ่มบันทึกเด่นขึ้นเมื่อมีการแก้ไขที่ยังไม่ได้บันทึก
export function QuickScoreRow({
  match,
  action,
  detailsHref,
  detailsLabel = "ผู้ทำประตู/สถิติ",
  extra,
}: {
  match: QuickScoreMatch;
  action: (formData: FormData) => Promise<ActionResult>;
  detailsHref: string;
  detailsLabel?: string;
  extra?: ReactNode;
}) {
  const [home, setHome] = useState(toStr(match.homeScore));
  const [away, setAway] = useState(toStr(match.awayScore));
  const [homePen, setHomePen] = useState(toStr(match.homePenalty));
  const [awayPen, setAwayPen] = useState(toStr(match.awayPenalty));

  const [state, formAction, pending] = useActionState(
    async (_prev: (ActionResult & { at: number }) | null, formData: FormData) => ({ ...(await action(formData)), at: Date.now() }),
    null,
  );

  const showPens = isKnockoutRound(match.round) && home !== "" && home === away;
  const dirty =
    home !== toStr(match.homeScore) ||
    away !== toStr(match.awayScore) ||
    (showPens && (homePen !== toStr(match.homePenalty) || awayPen !== toStr(match.awayPenalty)));
  const isFinished = match.status === "FINISHED";
  const isLiveStatus = match.status === "LIVE";
  const showLiveButton = isLiveStatus || !!match.liveNow;
  const bothFilled = home !== "" && away !== "";
  // ช่องกรอกผูกกับฟอร์มด้วย attribute form= แทนการห่อทั้งแถวด้วย <form> — เพราะ extra (โมดัลแก้ไขนัด) มีฟอร์มของตัวเอง ห้ามซ้อนฟอร์ม
  const formId = `score-form-${match.id}`;

  return (
    <div className="px-4 py-3.5 sm:px-5">
      <form id={formId} action={formAction}>
        <input type="hidden" name="id" value={match.id} />
      </form>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        {/* นัดที่ / เวลา / สนาม */}
        <div className="flex items-center gap-2 text-xs lg:w-36 lg:flex-none lg:flex-col lg:items-start lg:gap-0.5">
          {match.matchNo != null && (
            <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white">นัด {match.matchNo}</span>
          )}
          <span className="font-semibold text-slate-700">{match.timeLabel}</span>
          {match.venueLabel && (
            <span className="flex min-w-0 items-center gap-1 truncate text-slate-400">
              <MapPin className="h-3 w-3 flex-none" />
              <span className="truncate">{match.venueLabel}</span>
            </span>
          )}
        </div>

        {/* ทีม + ช่องสกอร์ */}
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right">
            <span className="min-w-0 truncate text-sm font-semibold text-slate-800">{match.homeTeam.name}</span>
            <TeamBadge team={match.homeTeam} size="sm" />
          </div>
          <div className="flex flex-none flex-col items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              <input
                name="homeScore"
                form={formId}
                type="number"
                min={0}
                inputMode="numeric"
                value={home}
                onChange={(e) => setHome(e.target.value)}
                aria-label={`สกอร์ ${match.homeTeam.name}`}
                placeholder="-"
                className={scoreInput}
              />
              <span className="font-bold text-slate-300">:</span>
              <input
                name="awayScore"
                form={formId}
                type="number"
                min={0}
                inputMode="numeric"
                value={away}
                onChange={(e) => setAway(e.target.value)}
                aria-label={`สกอร์ ${match.awayTeam.name}`}
                placeholder="-"
                className={scoreInput}
              />
            </div>
            {showPens && (
              <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1">
                <input
                  name="homePenalty"
                  form={formId}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={homePen}
                  onChange={(e) => setHomePen(e.target.value)}
                  aria-label={`จุดโทษ ${match.homeTeam.name}`}
                  className={penInput}
                />
                <span className="text-[10px] font-bold text-amber-700">จุดโทษ</span>
                <input
                  name="awayPenalty"
                  form={formId}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={awayPen}
                  onChange={(e) => setAwayPen(e.target.value)}
                  aria-label={`จุดโทษ ${match.awayTeam.name}`}
                  className={penInput}
                />
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <TeamBadge team={match.awayTeam} size="sm" />
            <span className="min-w-0 truncate text-sm font-semibold text-slate-800">{match.awayTeam.name}</span>
          </div>
        </div>

        {/* สถานะ + ปุ่ม */}
        <div className="flex flex-none items-center justify-end gap-2">
          {state && !pending && !dirty ? (
            state.ok ? (
              <span role="status" className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <Check className="h-3.5 w-3.5" />
                บันทึกแล้ว
              </span>
            ) : null
          ) : (
            !dirty &&
            (isLiveStatus ? (
              <LivePill />
            ) : (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  isFinished ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                }`}
              >
                {isFinished ? "จบแล้ว" : "ยังไม่แข่ง"}
              </span>
            ))
          )}
          {/* อัปเดตสด = สกอร์ระหว่างเกม (LIVE) ยังไม่นับในตารางคะแนน / บันทึกผลจบเกม = ผลทางการ (FINISHED) */}
          {showLiveButton && (
            <button
              type="submit"
              form={formId}
              name="final"
              value="0"
              disabled={pending || !dirty || !bothFilled}
              title="โชว์สกอร์สดบนหน้าเว็บ ยังไม่นับในตารางคะแนน"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                dirty && bothFilled ? "bg-red-600 text-white hover:bg-red-700" : "bg-slate-100 text-slate-400"
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              อัปเดตสด
            </button>
          )}
          <button
            type="submit"
            form={formId}
            name="final"
            value="1"
            disabled={pending || !(dirty || isLiveStatus)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
              dirty || isLiveStatus
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200 hover:bg-emerald-700"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {showLiveButton ? "จบเกม" : "บันทึกผล"}
          </button>
          <Link
            href={detailsHref}
            className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
            title="ไลน์อัพ ผู้ทำประตู เปลี่ยนตัว ใบเหลือง-แดง ผู้ตัดสิน"
          >
            {detailsLabel}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
          {extra}
        </div>
      </div>
      {state && !state.ok && !pending && (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {state.error}
        </p>
      )}
    </div>
  );
}
