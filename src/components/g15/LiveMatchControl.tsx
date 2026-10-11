"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { Play, Pause, Square, Undo2, Minus, Plus, Loader2, AlertCircle, Flag, X, ArrowLeftRight, Goal, Pencil, Trash2, ListOrdered } from "lucide-react";
import { LiveClock } from "./LiveClock";
import { TeamBadge } from "./TeamBadge";
import { asPhase, readClock, formatMinute, minuteOrder, minuteInputValue, type ClockState } from "@/lib/g15-clock";
import { BallIcon } from "./BallIcon";
import type { ActionResult } from "@/app/g15-womens-series/manage/actions";

type Team = { name: string; logoUrl: string | null; groupName: string | null };
type Action = (fd: FormData) => Promise<ActionResult>;
type Side = "home" | "away";

// ผู้เล่นสำหรับป็อปอัพ — onPitch = อยู่ในสนามตอนนี้ (ตัวจริง + เปลี่ยนเข้า − เปลี่ยนออก), onBench = ตัวสำรองที่ยังไม่ได้ลง
// ทีมที่ยังไม่บันทึกไลน์อัพ: ทุกคนเป็นทั้ง onPitch และ onBench (ไม่รู้ว่าใครอยู่ไหน เลยให้เลือกได้หมด)
export type LivePlayer = { id: number; name: string; number: number | null; onPitch: boolean; onBench: boolean };
export type LiveOfficial = { id: number; name: string; role: string | null };
export type LiveRoster = { players: LivePlayer[]; officials: LiveOfficial[] };

// editId = แก้ไขเหตุการณ์เดิม (ไม่ใส่ = เพิ่มใหม่) · fromList = เปิดจากรายการเหตุการณ์ (เพิ่มย้อนหลังได้แม้ไม่ได้ใช้นาฬิกาเกม)
type Dialog =
  | { kind: "goal"; side: Side; editId?: number; fromList?: boolean }
  | { kind: "card"; side: Side; cardType: "YELLOW" | "RED"; editId?: number; fromList?: boolean }
  | { kind: "sub"; side: Side; editId?: number; fromList?: boolean }
  | null;

// เหตุการณ์ที่บันทึกแล้ว (สำหรับรายการแก้ไข/ลบ)
export type EventGoal = {
  id: number;
  teamId: number;
  minute: number | null;
  addedMinute: number | null;
  playerId: number | null;
  playerName: string;
  isOwnGoal: boolean;
  assistPlayerId: number | null;
  assistName: string | null;
};
export type EventCard = {
  id: number;
  teamId: number;
  minute: number | null;
  addedMinute: number | null;
  holderName: string;
  holderRole: string | null;
  cardType: string;
  reason: string | null;
};
export type EventSub = { id: number; teamId: number; minute: number | null; addedMinute: number | null; playerInName: string; playerOutName: string };
export type MatchEvents = { goals: EventGoal[]; cards: EventCard[]; subs: EventSub[] };
type TimelineRow =
  | { kind: "goal"; teamId: number; raw: EventGoal }
  | { kind: "card"; teamId: number; raw: EventCard }
  | { kind: "sub"; teamId: number; raw: EventSub };

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
  homeTeamId,
  events,
  editGoalAction,
  editCardAction,
  editSubAction,
  deleteEventAction,
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
  homeTeamId: number;
  events: MatchEvents;
  editGoalAction: Action;
  editCardAction: Action;
  editSubAction: Action;
  deleteEventAction: Action;
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
  // เปลี่ยนตัวหลายคู่ในครั้งเดียว (ได้ทั้งสองทีม) — เลือกออก+เข้าครบคู่แล้วเข้าคิวอัตโนมัติ กดบันทึกทีเดียว
  const [subSide, setSubSide] = useState<Side>("home");
  const [subQueue, setSubQueue] = useState<{ side: Side; outId: string; inId: string }[]>([]);

  const open = (
    d: NonNullable<Dialog>,
    preset?: { ownGoal?: boolean; pickA?: string | null; pickB?: string | null; minute?: string; reason?: string },
  ) => {
    setOwnGoal(preset?.ownGoal ?? false);
    setPickA(preset?.pickA ?? null);
    setPickB(preset?.pickB ?? null);
    setReason(preset?.reason ?? "");
    if (d.kind === "card") setCardType(d.cardType);
    setSubSide(d.side);
    setSubQueue([]);
    if (preset?.minute !== undefined) setMinute(preset.minute);
    else {
      // เติมนาทีจากนาฬิกาเกม — ช่วงทดเวลาเป็นแบบ 45+2 / 90+3
      const r = readClock(clock, new Date().getTime() + skew.current);
      setMinute(r.minute != null ? (r.added ? `${r.minute}+${r.added}` : String(r.minute)) : "");
    }
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

  const sideOf = (teamId: number): Side => (teamId === homeTeamId ? "home" : "away");
  // เพิ่มประตูแล้วสกอร์ขึ้นด้วยไหม — ถ้าสกอร์ที่ตั้งไว้มากกว่าจำนวนประตูที่บันทึกชื่อแล้ว (กรอกผลย้อนหลัง) แค่เติมชื่อผู้ทำประตู สกอร์คงเดิม
  const goalBumpsScore = (side: Side) => events.goals.filter((g) => sideOf(g.teamId) === side).length >= score[side];
  const findPlayer = (side: Side, name: string) => rosters[side].players.find((p) => p.name === name);
  const findOfficial = (side: Side, name: string) => rosters[side].officials.find((o) => o.name === name);

  const editEvent = (ev: TimelineRow) => {
    const side = sideOf(ev.teamId);
    if (ev.kind === "goal") {
      const g = ev.raw;
      open(
        { kind: "goal", side, editId: g.id },
        {
          ownGoal: g.isOwnGoal,
          pickA: g.playerId != null ? String(g.playerId) : null,
          pickB: g.assistPlayerId != null ? String(g.assistPlayerId) : null,
          minute: minuteInputValue(g.minute, g.addedMinute),
        },
      );
    } else if (ev.kind === "card") {
      const c = ev.raw;
      const p = c.holderRole === "OFFICIAL" ? null : findPlayer(side, c.holderName);
      const o = p ? null : findOfficial(side, c.holderName);
      open(
        { kind: "card", side, cardType: c.cardType === "RED" ? "RED" : "YELLOW", editId: c.id },
        {
          pickA: p ? `player:${p.id}` : o ? `official:${o.id}` : null,
          minute: minuteInputValue(c.minute, c.addedMinute),
          reason: c.reason ?? "",
        },
      );
    } else {
      const x = ev.raw;
      const out = findPlayer(side, x.playerOutName);
      const inn = findPlayer(side, x.playerInName);
      open(
        { kind: "sub", side, editId: x.id },
        { pickA: out ? String(out.id) : null, pickB: inn ? String(inn.id) : null, minute: minuteInputValue(x.minute, x.addedMinute) },
      );
    }
  };

  const removeEvent = (ev: TimelineRow) => {
    const side = sideOf(ev.teamId);
    const goalsOfSide = events.goals.filter((g) => sideOf(g.teamId) === side).length;
    const msg =
      ev.kind === "goal"
        ? `ลบประตูของ ${ev.raw.playerName}?${goalsOfSide === score[side] ? ` สกอร์ ${teams[side].name} จะลดลงเหลือ ${Math.max(0, score[side] - 1)}` : ""}`
        : ev.kind === "card"
          ? `ลบ${ev.raw.cardType === "RED" ? "ใบแดง" : "ใบเหลือง"}ของ ${ev.raw.holderName}?`
          : `ลบการเปลี่ยนตัว ${ev.raw.playerOutName} → ${ev.raw.playerInName}?`;
    run(
      deleteEventAction,
      { kind: ev.kind, eventId: String(ev.raw.id) },
      { confirm: msg, optimistic: ev.kind === "goal" && goalsOfSide === score[side] ? { side, delta: -1 } : undefined },
    );
  };

  const timeline: TimelineRow[] = [
    ...events.goals.map((g) => ({ kind: "goal" as const, teamId: g.teamId, raw: g })),
    ...events.cards.map((c) => ({ kind: "card" as const, teamId: c.teamId, raw: c })),
    ...events.subs.map((x) => ({ kind: "sub" as const, teamId: x.teamId, raw: x })),
  ].sort((a, b) => minuteOrder(a.raw.minute, a.raw.addedMinute) - minuteOrder(b.raw.minute, b.raw.addedMinute) || a.raw.id - b.raw.id);

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
      <div className="space-y-2">
        <label className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
          นาที
          <input
            type="text"
            inputMode="tel"
            value={minute}
            onChange={(e) => setMinute(e.target.value.replace(/[^\d+]/g, ""))}
            placeholder="เช่น 23"
            className="h-10 w-24 rounded-lg border border-slate-200 px-2 text-center font-mono text-base font-bold focus:border-g15-400 focus:outline-none focus:ring-2 focus:ring-g15-100"
          />
          <span className="text-xs font-normal text-slate-400">ทดเวลาพิมพ์ 45+2 / 90+3 (พิมพ์ 93 ก็ได้ = 90+3)</span>
        </label>
        {/* ปุ่มลัดช่วงทดเวลา */}
        <div className="flex flex-wrap gap-1.5">
          {["45+", "90+"].map((base) =>
            [1, 2, 3, 4, 5].map((a) => (
              <button
                key={base + a}
                type="button"
                onClick={() => setMinute(`${base}${a}`)}
                className={`h-8 rounded-lg px-2 font-mono text-xs font-bold ring-1 transition-colors ${
                  minute === `${base}${a}` ? "bg-g15-600 text-white ring-g15-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {base}
                {a}
              </button>
            )),
          )}
        </div>
      </div>
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
            <Goal className="h-5 w-5 text-emerald-600" /> {dialog.editId != null ? "แก้ไขประตู" : "ประตู!"} {team.name}
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
        submit: () => {
          const fields = { side, ownGoal: ownGoal ? "1" : "0", scorerId: pickA ?? "", assistId: ownGoal ? "" : (pickB ?? ""), minute };
          if (dialog.editId != null) return run(editGoalAction, { ...fields, eventId: String(dialog.editId) }, { onDone: close });
          const bump = goalBumpsScore(side);
          run(goalAction, { ...fields, bumpScore: bump ? "1" : "0" }, { onDone: close, optimistic: bump ? { side, delta: 1 } : undefined });
        },
        note:
          dialog.editId != null
            ? "แก้ไขประตู — สกอร์ไม่เปลี่ยน"
            : goalBumpsScore(side)
              ? `สกอร์ ${team.name} จะเพิ่มเป็น ${score[side] + 1}`
              : `สกอร์คงเดิม (สกอร์ ${score[side]} มีประตูที่ยังไม่ได้ระบุผู้ทำอยู่ — เพิ่มชื่อผู้ทำประตูอย่างเดียว)`,
        submitLabel: dialog.editId != null ? "บันทึกการแก้ไข" : "บันทึกประตู",
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
            {dialog.editId != null && "แก้ไข"}
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
        submit: () =>
          dialog.editId != null
            ? run(editCardAction, { eventId: String(dialog.editId), cardType, holder: pickA ?? "", minute, reason }, { onDone: close })
            : run(cardAction, { side, cardType, holder: pickA ?? "", minute, reason }, { onDone: close }),
        note: null,
        submitLabel: dialog.editId != null ? "บันทึกการแก้ไข" : `บันทึก${cardType === "RED" ? "ใบแดง" : "ใบเหลือง"}`,
        canSubmit: pickA != null || dialog.editId != null,
      };
    }

    // เปลี่ยนตัว — แก้ไขรายการเดิม = คู่เดียวของทีมเดิม
    if (dialog.editId != null) {
      const outs = sortPitchFirst(rosters[side].players).map((p) => ({ key: String(p.id), name: p.name, number: p.number }));
      const ins = sortPitchFirst(rosters[side].players.filter((p) => String(p.id) !== pickA), "bench").map((p) => ({ key: String(p.id), name: p.name, number: p.number }));
      return {
        title: (
          <>
            <ArrowLeftRight className="h-5 w-5 text-sky-500" /> แก้ไขการเปลี่ยนตัว — {team.name}
          </>
        ),
        body: (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-bold text-red-600">▼ ออก</p>
              <PlayerGrid players={outs} value={pickA} onChange={setPickA} tone="red" />
            </div>
            <div>
              <p className="mb-2 text-xs font-bold text-emerald-600">▲ เข้า</p>
              <PlayerGrid players={ins} value={pickB} onChange={setPickB} tone="emerald" />
            </div>
            {minuteField}
          </div>
        ),
        submit: () => run(editSubAction, { eventId: String(dialog.editId), outId: pickA ?? "", inId: pickB ?? "", minute }, { onDone: close }),
        note: null,
        submitLabel: "บันทึกการแก้ไข",
        canSubmit: true,
      };
    }

    // เพิ่มใหม่ — เลือกได้หลายคู่ สลับทีมได้ในป็อปอัพเดียว
    // เพิ่มย้อนหลัง (จากรายการ) เลือกได้ทุกคนในทีม เพราะสถานะในสนามตอนนี้ไม่ตรงกับช่วงเวลานั้น
    const anyone = !!dialog.fromList;
    const queuedOut = new Set(subQueue.filter((q) => q.side === subSide).map((q) => q.outId));
    const queuedIn = new Set(subQueue.filter((q) => q.side === subSide).map((q) => q.inId));
    const outs = sortPitchFirst(rosters[subSide].players.filter((p) => (anyone || p.onPitch) && !queuedOut.has(String(p.id)) && !queuedIn.has(String(p.id)))).map((p) => ({
      key: String(p.id),
      name: p.name,
      number: p.number,
    }));
    const ins = sortPitchFirst(
      rosters[subSide].players.filter((p) => (anyone || p.onBench) && String(p.id) !== pickA && !queuedIn.has(String(p.id)) && !queuedOut.has(String(p.id))),
      "bench",
    ).map((p) => ({ key: String(p.id), name: p.name, number: p.number }));
    const addPair = (outId: string, inId: string) => {
      setSubQueue((q) => [...q, { side: subSide, outId, inId }]);
      setPickA(null);
      setPickB(null);
    };
    const nameOf = (sd: Side, id: string) => rosters[sd].players.find((p) => String(p.id) === id);
    return {
      title: (
        <>
          <ArrowLeftRight className="h-5 w-5 text-sky-500" /> เปลี่ยนตัว
        </>
      ),
      body: (
        <div className="space-y-4">
          {/* เลือกทีม — สลับไปเพิ่มของอีกทีมได้เลย คู่ที่เลือกแล้วยังอยู่ในคิว */}
          <div className="flex gap-1.5 rounded-xl bg-slate-100 p-1">
            {(["home", "away"] as const).map((sd) => (
              <button
                key={sd}
                type="button"
                onClick={() => {
                  setSubSide(sd);
                  setPickA(null);
                  setPickB(null);
                }}
                className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold transition-colors ${
                  subSide === sd ? "bg-white text-slate-900 shadow" : "text-slate-500"
                }`}
              >
                <TeamBadge team={teams[sd]} size="sm" />
                <span className="truncate">{teams[sd].name}</span>
                {subQueue.some((q) => q.side === sd) && (
                  <span className="flex-none rounded-full bg-sky-500 px-1.5 text-[10px] text-white">{subQueue.filter((q) => q.side === sd).length}</span>
                )}
              </button>
            ))}
          </div>

          {subQueue.length > 0 && (
            <div className="space-y-1.5 rounded-xl bg-sky-50 p-2.5 ring-1 ring-sky-100">
              <p className="px-1 text-[11px] font-bold text-sky-700">จะบันทึก {subQueue.length} คู่</p>
              {subQueue.map((q, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 text-xs shadow-sm">
                  <TeamBadge team={teams[q.side]} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-red-600">▼ {nameOf(q.side, q.outId)?.name}</span>
                    <span className="block truncate font-semibold text-emerald-700">▲ {nameOf(q.side, q.inId)?.name}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSubQueue((all) => all.filter((_, j) => j !== i))}
                    aria-label="เอาคู่นี้ออก"
                    className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-bold text-red-600">▼ ออก {anyone ? "" : "(อยู่ในสนาม)"}</p>
            <PlayerGrid
              players={outs}
              value={pickA}
              onChange={(k) => {
                if (k && pickB) addPair(k, pickB);
                else setPickA(k);
              }}
              tone="red"
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold text-emerald-600">▲ เข้า {anyone ? "" : "(ตัวสำรอง)"}</p>
            {ins.length === 0 ? (
              <p className="text-xs text-slate-400">ไม่มีตัวสำรองเหลือ</p>
            ) : (
              <PlayerGrid
                players={ins}
                value={pickB}
                onChange={(k) => {
                  if (k && pickA) addPair(pickA, k);
                  else setPickB(k);
                }}
                tone="emerald"
              />
            )}
          </div>
          {minuteField}
        </div>
      ),
      submit: () =>
        run(
          subAction,
          { pairs: JSON.stringify(subQueue.map((q) => ({ side: q.side, outId: Number(q.outId), inId: Number(q.inId) }))), minute },
          { onDone: close },
        ),
      note: subQueue.length === 0 ? "แตะคนออก แล้วแตะคนเข้า = 1 คู่ (เพิ่มได้หลายคู่ ทั้งสองทีม แล้วกดบันทึกทีเดียว)" : null,
      submitLabel: subQueue.length > 1 ? `บันทึกการเปลี่ยนตัว (${subQueue.length} คู่)` : "บันทึกการเปลี่ยนตัว",
      canSubmit: subQueue.length > 0,
    };
  };
  const d = dialogBody();

  return (
    <>
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
              {d.note && <p className="text-xs font-medium text-slate-500">{d.note}</p>}
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

    {/* รายการเหตุการณ์ในเกม — เรียงตามเวลา แตะดินสอเพื่อแก้ / ถังขยะเพื่อลบ; ปุ่มด้านล่างเพิ่มย้อนหลังได้ (ไม่ต้องใช้นาฬิกาเกม) */}
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-g15-50 text-g15-600">
          <ListOrdered className="h-4 w-4" />
        </div>
        <h2 className="font-semibold text-slate-900">
          เหตุการณ์ในเกม <span className="font-normal text-slate-400">/ Match events ({timeline.length})</span>
        </h2>
      </div>
      {error && !dialog && (
        <p role="alert" className="mx-5 mt-3 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 sm:mx-6">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
      {timeline.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-slate-400">ยังไม่มีเหตุการณ์ — กดปุ่มด้านล่างเพื่อเพิ่ม</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {timeline.map((ev) => {
            const side = sideOf(ev.teamId);
            return (
              <li key={`${ev.kind}-${ev.raw.id}`} className="flex items-center gap-3 px-4 py-2.5 sm:px-6">
                <span className="w-14 flex-none text-center font-mono text-sm font-black text-g15-700">
                  {formatMinute(ev.raw.minute, ev.raw.addedMinute) || "-"}
                </span>
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-slate-50">
                  {ev.kind === "goal" ? (
                    <BallIcon className="h-4.5 w-4.5 text-emerald-600" />
                  ) : ev.kind === "card" ? (
                    <span className={`h-4.5 w-3.5 rounded-[3px] ${ev.raw.cardType === "RED" ? "bg-red-600" : "bg-amber-400"}`} />
                  ) : (
                    <ArrowLeftRight className="h-4 w-4 text-sky-500" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  {ev.kind === "goal" ? (
                    <>
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {ev.raw.playerName}
                        {ev.raw.isOwnGoal && <span className="ml-1 text-xs font-bold text-red-500">(OG)</span>}
                      </span>
                      {ev.raw.assistName && <span className="block truncate text-xs text-slate-400">แอสซิสต์: {ev.raw.assistName}</span>}
                    </>
                  ) : ev.kind === "card" ? (
                    <span className="block truncate text-sm font-semibold text-slate-900">
                      {ev.raw.holderName}
                      {ev.raw.holderRole === "OFFICIAL" && <span className="ml-1 text-xs font-normal text-slate-400">(เจ้าหน้าที่)</span>}
                    </span>
                  ) : (
                    <span className="block min-w-0 text-sm">
                      <span className="block truncate font-semibold text-emerald-700">▲ {ev.raw.playerInName}</span>
                      <span className="block truncate text-xs text-red-500">▼ {ev.raw.playerOutName}</span>
                    </span>
                  )}
                </span>
                <span className="hidden flex-none sm:block" title={teams[side].name}>
                  <TeamBadge team={teams[side]} size="sm" />
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => editEvent(ev)}
                  aria-label="แก้ไข"
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition-colors hover:bg-g15-50 hover:text-g15-700 disabled:opacity-40"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => removeEvent(ev)}
                  aria-label="ลบ"
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-slate-400 ring-1 ring-slate-200 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {/* เพิ่มเหตุการณ์ย้อนหลัง แยกตามทีม */}
      <div className="grid grid-cols-1 gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-4 sm:grid-cols-2 sm:px-6">
        {(["home", "away"] as const).map((side) => (
          <div key={side}>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <TeamBadge team={teams[side]} size="sm" />
              <span className="truncate">เพิ่ม — {teams[side].name}</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" disabled={pending} onClick={() => open({ kind: "goal", side, fromList: true }, { minute: "" })} className={`${actionBtn} bg-emerald-600 text-white hover:bg-emerald-500`}>
                <Plus className="h-3.5 w-3.5" /> ประตู
              </button>
              <button type="button" disabled={pending} onClick={() => open({ kind: "card", side, cardType: "YELLOW", fromList: true }, { minute: "" })} className={`${actionBtn} bg-amber-400 text-amber-950 hover:bg-amber-300`}>
                <Plus className="h-3.5 w-3.5" /> ใบเหลือง
              </button>
              <button type="button" disabled={pending} onClick={() => open({ kind: "card", side, cardType: "RED", fromList: true }, { minute: "" })} className={`${actionBtn} bg-red-600 text-white hover:bg-red-500`}>
                <Plus className="h-3.5 w-3.5" /> ใบแดง
              </button>
              <button type="button" disabled={pending} onClick={() => open({ kind: "sub", side, fromList: true }, { minute: "" })} className={`${actionBtn} bg-sky-500 text-white hover:bg-sky-400`}>
                <Plus className="h-3.5 w-3.5" /> เปลี่ยนตัว
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
