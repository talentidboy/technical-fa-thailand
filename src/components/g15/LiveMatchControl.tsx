"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { Play, Pause, Square, Undo2, Minus, Plus, Loader2, AlertCircle, Flag, X, ArrowLeftRight, Goal } from "lucide-react";
import { LiveClock } from "./LiveClock";
import { TeamBadge } from "./TeamBadge";
import { asPhase, readClock, type ClockState } from "@/lib/g15-clock";
import type { ActionResult } from "@/app/g15-womens-series/manage/actions";

type Team = { name: string; logoUrl: string | null; groupName: string | null };
type Action = (fd: FormData) => Promise<ActionResult>;
type Side = "home" | "away";

// ผู้เล่นสำหรับป็อปอัพ — onPitch = อยู่ในสนามตอนนี้ (ตัวจริง + เปลี่ยนเข้า − เปลี่ยนออก), onBench = ตัวสำรองที่ยังไม่ได้ลง
// ทีมที่ยังไม่บันทึกไลน์อัพ: ทุกคนเป็นทั้ง onPitch และ onBench (ไม่รู้ว่าใครอยู่ไหน เลยให้เลือกได้หมด)
export type LivePlayer = { id: number; name: string; number: number | null; onPitch: boolean; onBench: boolean };
export type LiveOfficial = { id: number; name: string; role: string | null };
export type LiveRoster = { players: LivePlayer[]; officials: LiveOfficial[] };

type Dialog = { kind: "goal"; side: Side } | { kind: "card"; side: Side; cardType: "YELLOW" | "RED" } | { kind: "sub"; side: Side } | null;

const NEXT_STEP = {
  PRE: { op: "START_1", label: "เริ่มครึ่งแรก", sub: "Kick-off", icon: Play, tone: "bg-emerald-600 hover:bg-emerald-700" },
  FIRST_HALF: { op: "END_1", label: "จบครึ่งแรก", sub: "Half-time", icon: Pause, tone: "bg-amber-500 hover:bg-amber-600" },
  HALF_TIME: { op: "START_2", label: "เริ่มครึ่งหลัง", sub: "Second half", icon: Play, tone: "bg-emerald-600 hover:bg-emerald-700" },
  SECOND_HALF: { op: "END_2", label: "จบเกม", sub: "Full-time", icon: Square, tone: "bg-red-600 hover:bg-red-700" },
  FULL_TIME: null,
} as const;

// ปุ่มเลือกผู้เล่นแบบกดที่เบอร์/ชื่อ (เร็วกว่า dropdown ตอนหน้างาน)
function PlayerGrid({
  players,
  value,
  onChange,
  emptyLabel,
  tone = "g15",
}: {
  players: { key: string; name: string; number: number | null; dim?: boolean; caption?: string }[];
  value: string | null;
  onChange: (key: string | null) => void;
  emptyLabel?: string;
  tone?: "g15" | "red" | "emerald";
}) {
  const active = { g15: "bg-g15-600 text-white ring-g15-600", red: "bg-red-600 text-white ring-red-600", emerald: "bg-emerald-600 text-white ring-emerald-600" }[tone];
  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
      {emptyLabel && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`rounded-lg px-2.5 py-2 text-left text-xs font-semibold ring-1 transition-colors ${
            value == null ? active : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50"
          }`}
        >
          {emptyLabel}
        </button>
      )}
      {players.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => onChange(p.key)}
          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left ring-1 transition-colors ${
            value === p.key ? active : `bg-white ring-slate-200 hover:bg-slate-50 ${p.dim ? "opacity-50" : ""}`
          }`}
        >
          <span
            className={`flex h-7 w-7 flex-none items-center justify-center rounded-md text-xs font-black ${
              value === p.key ? "bg-white/20" : "bg-slate-100 text-slate-700"
            }`}
          >
            {p.number ?? "-"}
          </span>
          <span className="min-w-0">
            <span className="line-clamp-2 text-xs font-semibold leading-tight">{p.name}</span>
            {p.caption && <span className={`block truncate text-[10px] ${value === p.key ? "text-white/70" : "text-slate-400"}`}>{p.caption}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

const sortPitchFirst = (ps: LivePlayer[], prefer: "pitch" | "bench" = "pitch") =>
  [...ps].sort(
    (a, b) =>
      Number(prefer === "pitch" ? b.onPitch : b.onBench) - Number(prefer === "pitch" ? a.onPitch : a.onBench) ||
      (a.number ?? 999) - (b.number ?? 999),
  );

export function LiveMatchControl({
  matchId,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  clock,
  serverNow,
  rosters,
  controlAction,
  addedTimeAction,
  scoreAction,
  goalAction,
  cardAction,
  subAction,
}: {
  matchId: number;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  clock: ClockState;
  serverNow: number;
  rosters: Record<Side, LiveRoster>;
  controlAction: Action;
  addedTimeAction: Action;
  scoreAction: Action;
  goalAction: Action;
  cardAction: Action;
  subAction: Action;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // สกอร์บนจอแอดมินเปลี่ยนทันทีที่กด (optimistic) ไม่ต้องรอเซิร์ฟเวอร์ — ถ้าบันทึกไม่สำเร็จจะเด้งกลับค่าจริงเอง
  const [score, bumpScore] = useOptimistic(
    { home: homeScore ?? 0, away: awayScore ?? 0 },
    (cur, { side, delta }: { side: Side; delta: number }) => ({ ...cur, [side]: Math.max(0, cur[side] + delta) }),
  );
  const [dialog, setDialog] = useState<Dialog>(null);
  const skew = useRef(0);
  useEffect(() => {
    skew.current = serverNow - Date.now();
  }, [serverNow]);
  const phase = asPhase(clock.clockPhase);
  const next = NEXT_STEP[phase];
  const teams: Record<Side, Team> = { home: homeTeam, away: awayTeam };

  // ค่าในป็อปอัพ
  const [ownGoal, setOwnGoal] = useState(false);
  const [pickA, setPickA] = useState<string | null>(null); // ผู้ทำประตู / ผู้รับใบ / คนออก
  const [pickB, setPickB] = useState<string | null>(null); // แอสซิสต์ / คนเข้า
  const [minute, setMinute] = useState("");
  const [cardType, setCardType] = useState<"YELLOW" | "RED">("YELLOW");
  const [reason, setReason] = useState("");

  const open = (d: NonNullable<Dialog>) => {
    setOwnGoal(false);
    setPickA(null);
    setPickB(null);
    setReason("");
    if (d.kind === "card") setCardType(d.cardType);
    const m = readClock(clock, Date.now() + skew.current).minute;
    setMinute(m != null ? String(m) : "");
    setError(null);
    setDialog(d);
  };
  const close = () => setDialog(null);

  const run = (
    action: Action,
    fields: Record<string, string>,
    opts?: { confirm?: string; onDone?: () => void; optimistic?: { side: Side; delta: number } },
  ) => {
    if (opts?.confirm && !window.confirm(opts.confirm)) return;
    const fd = new FormData();
    fd.set("id", String(matchId));
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    setError(null);
    startTransition(async () => {
      if (opts?.optimistic) bumpScore(opts.optimistic);
      // ป็อปอัพปิดทันที (ข้อมูลกำลังบันทึกเบื้องหลัง) — ถ้าผิดพลาดจะแสดงข้อความเตือนบนแผงควบคุม
      if (opts?.optimistic) opts.onDone?.();
      const res = await action(fd);
      if (!res.ok) setError(res.error);
      else if (!opts?.optimistic) opts?.onDone?.();
    });
  };

  const actionBtn = "inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors disabled:opacity-30";

  const scoreBox = (side: Side, score: number | null) => {
    const team = teams[side];
    return (
      <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
        <TeamBadge team={team} size="md" />
        <span className="line-clamp-2 text-xs font-semibold leading-snug text-white/90 sm:text-sm">{team.name}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pending || (score ?? 0) === 0}
            onClick={() => run(scoreAction, { side, delta: "-1" }, { confirm: `ลดสกอร์ ${team.name} ลง 1? (ประตูล่าสุดของทีมนี้จะถูกลบด้วย)`, optimistic: { side, delta: -1 } })}
            aria-label={`ลดสกอร์ ${team.name}`}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-12 text-center font-mono text-5xl font-black tabular-nums text-white">{score ?? 0}</span>
          <button
            type="button"
            disabled={pending || phase === "PRE"}
            onClick={() => open({ kind: "goal", side })}
            aria-label={`เพิ่มประตู ${team.name}`}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition-colors hover:bg-emerald-400 disabled:opacity-30"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        {/* ใบเหลือง / ใบแดง / เปลี่ยนตัว ของทีมนี้ */}
        <div className="flex flex-wrap justify-center gap-1.5">
          <button type="button" disabled={pending || phase === "PRE"} onClick={() => open({ kind: "card", side, cardType: "YELLOW" })} className={`${actionBtn} bg-amber-400 text-amber-950 hover:bg-amber-300`}>
            <span className="h-3.5 w-2.5 rounded-[2px] bg-amber-950/20 ring-1 ring-amber-950/30" />
            ใบเหลือง
          </button>
          <button type="button" disabled={pending || phase === "PRE"} onClick={() => open({ kind: "card", side, cardType: "RED" })} className={`${actionBtn} bg-red-600 text-white hover:bg-red-500`}>
            <span className="h-3.5 w-2.5 rounded-[2px] bg-white/30 ring-1 ring-white/40" />
            ใบแดง
          </button>
          <button type="button" disabled={pending || phase === "PRE"} onClick={() => open({ kind: "sub", side })} className={`${actionBtn} bg-sky-500 text-white hover:bg-sky-400`}>
            <ArrowLeftRight className="h-3.5 w-3.5" />
            เปลี่ยนตัว
          </button>
        </div>
      </div>
    );
  };

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
          <button type="button" disabled={pending} onClick={() => run(addedTimeAction, { half, minutes: "" })} className="h-9 rounded-lg px-2.5 text-xs text-white/50 hover:bg-white/10">
            ล้าง
          </button>
        )}
      </div>
    </div>
  );

  // ===== เนื้อหาป็อปอัพ =====
  const dialogBody = () => {
    if (!dialog) return null;
    const side = dialog.side;
    const other: Side = side === "home" ? "away" : "home";
    const team = teams[side];
    const minuteField = (
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        นาที
        <input
          type="number"
          min={0}
          value={minute}
          onChange={(e) => setMinute(e.target.value)}
          className="h-10 w-20 rounded-lg border border-slate-200 px-2 text-center font-mono text-base font-bold focus:border-g15-400 focus:outline-none focus:ring-2 focus:ring-g15-100"
        />
        <span className="text-xs font-normal text-slate-400">(เติมจากนาฬิกาเกม แก้ได้)</span>
      </label>
    );

    if (dialog.kind === "goal") {
      const scorerPool = ownGoal ? rosters[other].players : rosters[side].players;
      const scorers = sortPitchFirst(scorerPool).map((p) => ({ key: String(p.id), name: p.name, number: p.number, dim: !p.onPitch }));
      const assists = sortPitchFirst(rosters[side].players)
        .filter((p) => String(p.id) !== pickA)
        .map((p) => ({ key: String(p.id), name: p.name, number: p.number, dim: !p.onPitch }));
      return {
        title: (
          <>
            <Goal className="h-5 w-5 text-emerald-600" /> ประตู! {team.name}
          </>
        ),
        body: (
          <div className="space-y-4">
            <div className="flex gap-1.5 rounded-xl bg-slate-100 p-1">
              {[
                { v: false, label: "ยิงปกติ" },
                { v: true, label: "ทำเข้าประตูตัวเอง (OG)" },
              ].map((o) => (
                <button
                  key={String(o.v)}
                  type="button"
                  onClick={() => {
                    setOwnGoal(o.v);
                    setPickA(null);
                    setPickB(null);
                  }}
                  className={`flex-1 rounded-lg py-2 text-xs font-bold transition-colors ${ownGoal === o.v ? "bg-white text-slate-900 shadow" : "text-slate-500"}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <div>
              <p className="mb-2 text-xs font-bold text-slate-500">
                {ownGoal ? `ผู้เล่น ${teams[other].name} ที่ทำเข้าประตูตัวเอง` : "ผู้ทำประตู"}
              </p>
              <PlayerGrid players={scorers} value={pickA} onChange={setPickA} emptyLabel="ไม่ระบุ" tone="emerald" />
            </div>
            {!ownGoal && (
              <div>
                <p className="mb-2 text-xs font-bold text-slate-500">
                  แอสซิสต์ <span className="font-normal text-slate-400">(ไม่บังคับ)</span>
                </p>
                <PlayerGrid players={assists} value={pickB} onChange={setPickB} emptyLabel="ไม่มี" />
              </div>
            )}
            {minuteField}
          </div>
        ),
        submit: () =>
          run(
            goalAction,
            { side, ownGoal: ownGoal ? "1" : "0", scorerId: pickA ?? "", assistId: ownGoal ? "" : (pickB ?? ""), minute },
            { onDone: close, optimistic: { side, delta: 1 } },
          ),
        submitLabel: "บันทึกประตู",
        canSubmit: true,
      };
    }

    if (dialog.kind === "card") {
      const holders = [
        ...sortPitchFirst(rosters[side].players).map((p) => ({ key: `player:${p.id}`, name: p.name, number: p.number, dim: !p.onPitch && !p.onBench })),
        ...rosters[side].officials.map((o) => ({ key: `official:${o.id}`, name: o.name, number: null, caption: o.role ?? "เจ้าหน้าที่ทีม" })),
      ];
      return {
        title: (
          <>
            <span className={`h-5 w-3.5 rounded-[3px] ${cardType === "RED" ? "bg-red-600" : "bg-amber-400"}`} />
            {cardType === "RED" ? "ใบแดง" : "ใบเหลือง"} — {team.name}
          </>
        ),
        body: (
          <div className="space-y-4">
            <div className="flex gap-1.5 rounded-xl bg-slate-100 p-1">
              {(["YELLOW", "RED"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCardType(t)}
                  className={`flex-1 rounded-lg py-2 text-xs font-bold transition-colors ${
                    cardType === t ? (t === "RED" ? "bg-red-600 text-white" : "bg-amber-400 text-amber-950") : "text-slate-500"
                  }`}
                >
                  {t === "RED" ? "ใบแดง" : "ใบเหลือง"}
                </button>
              ))}
            </div>
            <div>
              <p className="mb-2 text-xs font-bold text-slate-500">ใครได้รับใบ</p>
              <PlayerGrid players={holders} value={pickA} onChange={setPickA} tone={cardType === "RED" ? "red" : "g15"} />
            </div>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="เหตุผล (ไม่บังคับ)"
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-g15-400 focus:outline-none focus:ring-2 focus:ring-g15-100"
            />
            {minuteField}
          </div>
        ),
        submit: () => run(cardAction, { side, cardType, holder: pickA ?? "", minute, reason }, { onDone: close }),
        submitLabel: `บันทึก${cardType === "RED" ? "ใบแดง" : "ใบเหลือง"}`,
        canSubmit: pickA != null,
      };
    }

    // เปลี่ยนตัว
    const outs = sortPitchFirst(rosters[side].players.filter((p) => p.onPitch)).map((p) => ({ key: String(p.id), name: p.name, number: p.number }));
    const ins = sortPitchFirst(rosters[side].players.filter((p) => p.onBench && String(p.id) !== pickA), "bench").map((p) => ({
      key: String(p.id),
      name: p.name,
      number: p.number,
    }));
    return {
      title: (
        <>
          <ArrowLeftRight className="h-5 w-5 text-sky-500" /> เปลี่ยนตัว — {team.name}
        </>
      ),
      body: (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-bold text-red-600">▼ ออก (อยู่ในสนาม)</p>
            <PlayerGrid players={outs} value={pickA} onChange={setPickA} tone="red" />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold text-emerald-600">▲ เข้า (ตัวสำรอง)</p>
            {ins.length === 0 ? (
              <p className="text-xs text-slate-400">ไม่มีตัวสำรองเหลือ</p>
            ) : (
              <PlayerGrid players={ins} value={pickB} onChange={setPickB} tone="emerald" />
            )}
          </div>
          {minuteField}
        </div>
      ),
      submit: () => run(subAction, { side, outId: pickA ?? "", inId: pickB ?? "", minute }, { onDone: close }),
      submitLabel: "บันทึกการเปลี่ยนตัว",
      canSubmit: pickA != null && pickB != null,
    };
  };
  const d = dialogBody();

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
            onClick={() => run(controlAction, { op: "UNDO" }, { confirm: "ย้อนกลับขั้นล่าสุด? (ใช้เมื่อกดผิด)" })}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Undo2 className="h-3.5 w-3.5" />
            ย้อนขั้น
          </button>
        )}
      </div>

      <div className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-3">
          {scoreBox("home", score.home)}
          <div className="flex-none pt-2">
            <LiveClock state={clock} serverNow={serverNow} variant="big" />
          </div>
          {scoreBox("away", score.away)}
        </div>

        {next ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(controlAction, { op: next.op }, {
                confirm: next.op === "END_2" ? `จบเกมด้วยสกอร์ ${score.home}-${score.away}? ผลนี้จะนับในตารางคะแนน` : undefined,
              })
            }
            className={`flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-lg font-black shadow-lg transition-colors disabled:opacity-60 ${next.tone}`}
          >
            {pending && !dialog ? <Loader2 className="h-6 w-6 animate-spin" /> : <next.icon className="h-6 w-6" />}
            {next.label}
            <span className="text-sm font-semibold opacity-75">/ {next.sub}</span>
          </button>
        ) : (
          <p className="rounded-2xl bg-white/10 py-4 text-center text-sm font-semibold text-white/80">
            จบเกมแล้ว — ผล {homeScore ?? 0}-{awayScore ?? 0} บันทึกเป็นผลทางการ (กด &quot;ย้อนขั้น&quot; ถ้าต้องแก้)
          </p>
        )}

        {error && !dialog && (
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
          นาฬิกาเดินจากเวลาที่กดเริ่ม แม้ปิดหน้านี้ไปก็ยังเดินต่อ · กด ＋ / ใบเหลือง / ใบแดง / เปลี่ยนตัว แล้วเลือกผู้เล่นในป็อปอัพ — บันทึกลงรายการด้านล่างและขึ้นหน้าเว็บทันที
        </p>
      </div>

      {/* ป็อปอัพบันทึกเหตุการณ์ (overlay ควบคุมด้วย state — แตะพื้นหลังเพื่อปิด) */}
      {d && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4"
        >
          <div className="flex max-h-[92vh] w-full max-w-[640px] flex-col rounded-t-2xl bg-white text-slate-900 shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
              <h3 className="flex items-center gap-2 text-base font-bold">{d.title}</h3>
              <button type="button" onClick={close} aria-label="ปิด" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4">{d.body}</div>
            <div className="space-y-2 border-t border-slate-100 px-5 py-3.5">
              {error && (
                <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={close} className="h-11 rounded-xl px-4 text-sm font-semibold text-slate-500 hover:bg-slate-100">
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={pending || !d.canSubmit}
                  onClick={d.submit}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-g15-600 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-g15-700 disabled:opacity-40"
                >
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {d.submitLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
