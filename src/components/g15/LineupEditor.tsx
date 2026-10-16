"use client";

import { useMemo, useState, useTransition } from "react";
import { Star, Check, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { TeamBadge } from "./TeamBadge";
import type { ActionResult } from "@/app/g15-womens-series/manage/actions";

type Status = "STARTING" | "SUBSTITUTE";
type Team = { name: string; logoUrl: string | null; groupName: string | null };
type Player = { id: number; name: string; number: number | null };

export type LineupInput = {
  matchId: number;
  entries: { playerId: number; status: Status }[];
  captains: { teamId: number; playerId: number }[];
};

const STATUS_BUTTONS: { value: Status | null; label: string; on: string }[] = [
  { value: "STARTING", label: "ตัวจริง", on: "bg-emerald-500 text-white shadow-sm" },
  { value: "SUBSTITUTE", label: "สำรอง", on: "bg-sky-500 text-white shadow-sm" },
  { value: null, label: "ไม่ลง", on: "bg-slate-600 text-white shadow-sm" },
];

const STARTERS = 11;

// แก้ไขไลน์อัพทั้งสองทีมในป็อปอัพเดียว — ค่าทั้งหมดเก็บใน state (ไม่ใช่ฟอร์มที่ React ล้างทิ้งหลังบันทึก) กดเลือกแล้วไม่เด้งกลับ
// กัปตันเลือกได้เฉพาะตัวจริง (ปุ่มดาวในแถว) — ย้ายกัปตันออกจากตัวจริงแล้วดาวหายเอง จึงไม่มีทางบันทึกแล้วติด error
export function LineupEditor({
  matchId,
  teams,
  initialStatus,
  initialCaptains,
  action,
}: {
  matchId: number;
  teams: { teamId: number; team: Team; players: Player[] }[];
  initialStatus: Record<number, Status>;
  initialCaptains: Record<number, number | null>;
  action: (input: LineupInput) => Promise<ActionResult>;
}) {
  const [status, setStatus] = useState<Record<number, Status | undefined>>(initialStatus);
  const [captains, setCaptains] = useState<Record<number, number | null>>(initialCaptains);
  const [saved, setSaved] = useState({ status: initialStatus as Record<number, Status | undefined>, captains: initialCaptains });
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = useMemo(() => {
    const ids = new Set([...Object.keys(status), ...Object.keys(saved.status)]);
    for (const id of ids) if ((status[Number(id)] ?? null) !== (saved.status[Number(id)] ?? null)) return true;
    return teams.some((t) => (captains[t.teamId] ?? null) !== (saved.captains[t.teamId] ?? null));
  }, [status, captains, saved, teams]);

  const setPlayer = (teamId: number, playerId: number, value: Status | null) => {
    setResult(null);
    setStatus((s) => {
      const next = { ...s };
      if (value) next[playerId] = value;
      else delete next[playerId];
      return next;
    });
    // กัปตันต้องเป็นตัวจริง — เปลี่ยนสถานะกัปตันเป็นอย่างอื่นแล้วล้างกัปตันของทีมนั้น
    if (value !== "STARTING" && captains[teamId] === playerId) setCaptains((c) => ({ ...c, [teamId]: null }));
  };

  const save = () => {
    const input: LineupInput = {
      matchId,
      entries: Object.entries(status)
        .filter((e): e is [string, Status] => e[1] != null)
        .map(([id, st]) => ({ playerId: Number(id), status: st })),
      captains: teams.flatMap((t) => (captains[t.teamId] != null ? [{ teamId: t.teamId, playerId: captains[t.teamId]! }] : [])),
    };
    startTransition(async () => {
      const res = await action(input);
      setResult(res);
      if (res.ok) setSaved({ status: { ...status }, captains: { ...captains } });
    });
  };

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-2">
        {teams.map(({ teamId, team, players }) => {
          const starters = players.filter((p) => status[p.id] === "STARTING").length;
          const subs = players.filter((p) => status[p.id] === "SUBSTITUTE").length;
          return (
            <section key={teamId} className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <TeamBadge team={team} size="sm" />
                <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">{team.name}</p>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    starters === STARTERS ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                  }`}
                  title={starters === STARTERS ? undefined : `ตัวจริงควรมี ${STARTERS} คน`}
                >
                  ตัวจริง {starters}/{STARTERS}
                </span>
                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-200">สำรอง {subs}</span>
              </div>

              {players.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-400">
                  ยังไม่มีนักกีฬาในทะเบียนของทีมนี้
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {players.map((p) => {
                    const st = status[p.id] ?? null;
                    const isCaptain = captains[teamId] === p.id;
                    return (
                      <li
                        key={p.id}
                        className={`flex items-center gap-2 px-2.5 py-2 sm:px-3 ${
                          st === "STARTING" ? "bg-emerald-50/50" : st === "SUBSTITUTE" ? "bg-sky-50/40" : ""
                        }`}
                      >
                        <span className="flex h-8 w-9 flex-none items-center justify-center rounded-lg bg-slate-100 font-mono text-xs font-black text-slate-600">
                          {p.number ?? "-"}
                        </span>
                        <span className={`min-w-0 flex-1 truncate text-sm ${st ? "font-semibold text-slate-900" : "text-slate-500"}`}>
                          {p.name}
                          {isCaptain && <span className="ml-1.5 rounded bg-amber-400 px-1 text-[10px] font-black text-amber-950">C</span>}
                        </span>
                        <button
                          type="button"
                          disabled={st !== "STARTING"}
                          onClick={() => setCaptains((c) => ({ ...c, [teamId]: isCaptain ? null : p.id }))}
                          aria-label={isCaptain ? `ยกเลิกกัปตัน ${p.name}` : `ตั้ง ${p.name} เป็นกัปตัน`}
                          title={st === "STARTING" ? "กัปตัน" : "กัปตันต้องเป็นตัวจริง"}
                          className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg transition-colors disabled:opacity-20 ${
                            isCaptain ? "bg-amber-400 text-amber-950" : "text-slate-300 hover:bg-amber-50 hover:text-amber-500"
                          }`}
                        >
                          <Star className={`h-4 w-4 ${isCaptain ? "fill-amber-950" : ""}`} />
                        </button>
                        <div className="flex flex-none rounded-lg bg-slate-100 p-0.5">
                          {STATUS_BUTTONS.map((b) => (
                            <button
                              key={b.label}
                              type="button"
                              onClick={() => setPlayer(teamId, p.id, b.value)}
                              aria-pressed={st === b.value}
                              className={`h-8 rounded-md px-2 text-xs font-bold transition-colors sm:px-2.5 ${
                                st === b.value ? b.on : "text-slate-500 hover:bg-white hover:text-slate-800"
                              }`}
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <button
          type="button"
          disabled={pending || !dirty}
          onClick={save}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-sky-200 transition-colors hover:bg-sky-700 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          บันทึกไลน์อัพ
        </button>
        {dirty && !pending && (
          <>
            <span className="text-xs font-semibold text-amber-600">ยังไม่ได้บันทึก</span>
            <button
              type="button"
              onClick={() => {
                setStatus(saved.status);
                setCaptains(saved.captains);
                setResult(null);
              }}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              ยกเลิกที่แก้
            </button>
          </>
        )}
        {result && !dirty && (
          <span
            role="status"
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
              result.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
          >
            {result.ok ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
            {result.ok ? "บันทึกไลน์อัพแล้ว" : result.error}
          </span>
        )}
        {result && !result.ok && dirty && (
          <span role="alert" className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
            <AlertCircle className="h-3.5 w-3.5" />
            {result.error}
          </span>
        )}
      </div>
    </div>
  );
}
