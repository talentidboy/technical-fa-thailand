"use client";

import { useState, useTransition } from "react";
import { Play, Pause, Square, Undo2, Minus, Plus, Loader2, AlertCircle, Flag } from "lucide-react";
import { LiveClock } from "./LiveClock";
import { TeamBadge } from "./TeamBadge";
import { asPhase, type ClockState } from "@/lib/g15-clock";
import type { ActionResult } from "@/app/g15-womens-series/manage/actions";

type Team = { name: string; logoUrl: string | null; groupName: string | null };
type Action = (fd: FormData) => Promise<ActionResult>;

// ปุ่มหลักตามจังหวะเกม — กดทีละขั้น (เริ่มครึ่งแรก → จบครึ่งแรก → เริ่มครึ่งหลัง → จบเกม)
const NEXT_STEP = {
  PRE: { op: "START_1", label: "เริ่มครึ่งแรก", sub: "Kick-off", icon: Play, tone: "bg-emerald-600 hover:bg-emerald-700" },
  FIRST_HALF: { op: "END_1", label: "จบครึ่งแรก", sub: "Half-time", icon: Pause, tone: "bg-amber-500 hover:bg-amber-600" },
  HALF_TIME: { op: "START_2", label: "เริ่มครึ่งหลัง", sub: "Second half", icon: Play, tone: "bg-emerald-600 hover:bg-emerald-700" },
  SECOND_HALF: { op: "END_2", label: "จบเกม", sub: "Full-time", icon: Square, tone: "bg-red-600 hover:bg-red-700" },
  FULL_TIME: null,
} as const;

// แผงควบคุมเกมสดของแอดมิน: นาฬิกา + ปุ่มเริ่ม/จบแต่ละครึ่ง + ทดเวลาบาดเจ็บ + ปุ่ม +/- สกอร์
// ทุกปุ่มบันทึกทันที หน้าเว็บสาธารณะดึงข้อมูลใหม่เองทุก 10 วินาที
export function LiveMatchControl({
  matchId,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  clock,
  serverNow,
  controlAction,
  addedTimeAction,
  scoreAction,
}: {
  matchId: number;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  clock: ClockState;
  serverNow: number;
  controlAction: Action;
  addedTimeAction: Action;
  scoreAction: Action;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const phase = asPhase(clock.clockPhase);
  const next = NEXT_STEP[phase];

  const run = (action: Action, fields: Record<string, string>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    const fd = new FormData();
    fd.set("id", String(matchId));
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    setError(null);
    startTransition(async () => {
      const res = await action(fd);
      if (!res.ok) setError(res.error);
    });
  };

  const scoreBox = (side: "home" | "away", team: Team, score: number | null) => (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
      <TeamBadge team={team} size="md" />
      <span className="line-clamp-2 text-xs font-semibold leading-snug text-white/90 sm:text-sm">{team.name}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pending || (score ?? 0) === 0}
          onClick={() => run(scoreAction, { side, delta: "-1" }, `ลดสกอร์ ${team.name} ลง 1?`)}
          aria-label={`ลดสกอร์ ${team.name}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-12 text-center font-mono text-5xl font-black tabular-nums text-white">{score ?? 0}</span>
        <button
          type="button"
          disabled={pending || phase === "PRE"}
          onClick={() => run(scoreAction, { side, delta: "1" })}
          aria-label={`เพิ่มประตู ${team.name}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition-colors hover:bg-emerald-400 disabled:opacity-30"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  const addedTime = (half: "1" | "2", value: number | null, label: string) => (
    <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
      <p className="mb-2 text-xs font-semibold text-white/70">
        ทดเวลา{label} <span className="text-white/40">/ Added time</span>
        {value != null && value > 0 && <span className="ml-2 rounded bg-emerald-500 px-1.5 py-0.5 font-mono text-[11px] font-black text-white">+{value}</span>}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7].map((m) => (
          <button
            key={m}
            type="button"
            disabled={pending}
            onClick={() => run(addedTimeAction, { half, minutes: String(m) })}
            className={`h-9 min-w-9 rounded-lg px-2 font-mono text-sm font-bold transition-colors ${
              value === m ? "bg-emerald-500 text-white" : "bg-white/10 text-white/80 hover:bg-white/20"
            }`}
          >
            +{m}
          </button>
        ))}
        {value != null && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(addedTimeAction, { half, minutes: "" })}
            className="h-9 rounded-lg px-2.5 text-xs text-white/50 hover:bg-white/10"
          >
            ล้าง
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-2xl bg-linear-to-br from-g15-950 via-g15-900 to-g15-700 text-white shadow-xl">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-5 py-3">
        <p className="flex items-center gap-2 text-sm font-bold">
          <Flag className="h-4 w-4 text-amber-300" />
          ควบคุมเกมสด <span className="font-normal text-white/50">/ Live match control</span>
        </p>
        {phase !== "PRE" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(controlAction, { op: "UNDO" }, "ย้อนกลับขั้นล่าสุด? (ใช้เมื่อกดผิด)")}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Undo2 className="h-3.5 w-3.5" />
            ย้อนขั้น
          </button>
        )}
      </div>

      <div className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-3">
          {scoreBox("home", homeTeam, homeScore)}
          <div className="flex-none pt-2">
            <LiveClock state={clock} serverNow={serverNow} variant="big" />
          </div>
          {scoreBox("away", awayTeam, awayScore)}
        </div>

        {next ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(
                controlAction,
                { op: next.op },
                next.op === "END_2" ? `จบเกมด้วยสกอร์ ${homeScore ?? 0}-${awayScore ?? 0}? ผลนี้จะนับในตารางคะแนน` : undefined,
              )
            }
            className={`flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-lg font-black shadow-lg transition-colors disabled:opacity-60 ${next.tone}`}
          >
            {pending ? <Loader2 className="h-6 w-6 animate-spin" /> : <next.icon className="h-6 w-6" />}
            {next.label}
            <span className="text-sm font-semibold opacity-75">/ {next.sub}</span>
          </button>
        ) : (
          <p className="rounded-2xl bg-white/10 py-4 text-center text-sm font-semibold text-white/80">
            จบเกมแล้ว — ผล {homeScore ?? 0}-{awayScore ?? 0} บันทึกเป็นผลทางการ (กด &quot;ย้อนขั้น&quot; ถ้าต้องแก้)
          </p>
        )}

        {error && (
          <p role="alert" className="flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-2 text-xs font-medium text-red-100">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {addedTime("1", clock.firstHalfAddedTime, "ครึ่งแรก")}
          {addedTime("2", clock.secondHalfAddedTime, "ครึ่งหลัง")}
        </div>
        <p className="text-[11px] text-white/45">
          นาฬิกาเดินจากเวลาที่กดเริ่ม แม้ปิดหน้านี้ไปก็ยังเดินต่อ · ประตูที่กด + จะขึ้นสกอร์ทันที ใส่ชื่อผู้ทำประตู/ใบเหลือง-แดง/เปลี่ยนตัวในฟอร์มด้านล่าง (ช่องนาทีเติมให้อัตโนมัติ)
        </p>
      </div>
    </div>
  );
}
