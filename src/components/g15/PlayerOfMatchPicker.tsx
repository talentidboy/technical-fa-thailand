"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Loader2, Star, UserRound, X, AlertCircle, Check } from "lucide-react";
import { TeamBadge } from "./TeamBadge";
import type { ActionResult } from "@/app/g15-womens-series/manage/actions";

export type PotmCandidate = {
  id: number;
  name: string;
  number: number | null;
  photoUrl: string | null;
  starter: boolean;
};

type Team = { id: number; name: string; logoUrl: string | null; groupName: string | null };

// เลือกผู้เล่นยอดเยี่ยมประจำนัด — แตะการ์ดนักกีฬาแล้วบันทึกทันที (แตะคนเดิมซ้ำ หรือกด "ล้าง" = ยกเลิก)
export function PlayerOfMatchPicker({
  matchId,
  selectedId,
  teams,
  action,
}: {
  matchId: number;
  selectedId: number | null;
  teams: { team: Team; players: PotmCandidate[] }[];
  action: (formData: FormData) => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic(selectedId);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = (playerId: number | null) => {
    const fd = new FormData();
    fd.set("id", String(matchId));
    fd.set("playerId", playerId != null ? String(playerId) : "");
    setError(null);
    setSaved(false);
    startTransition(async () => {
      setCurrent(playerId);
      const res = await action(fd);
      if (!res.ok) setError(res.error);
      else setSaved(true);
    });
  };

  const chosen = teams.flatMap((t) => t.players.map((p) => ({ ...p, team: t.team }))).find((p) => p.id === current);

  return (
    <div className="space-y-5 p-6">
      {/* คนที่เลือกอยู่ตอนนี้ */}
      <div className="flex items-center gap-4 rounded-2xl bg-linear-to-r from-g15-900 via-g15-700 to-g15-600 p-4 text-white">
        <div className="relative h-16 w-14 flex-none overflow-hidden rounded-xl bg-white/10">
          {chosen?.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={chosen.photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
          ) : (
            <UserRound className="absolute inset-0 m-auto h-7 w-7 text-white/40" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-amber-300 sm:text-[11px]">Player of the Match</p>
          {chosen ? (
            <>
              <p className="truncate text-lg font-bold">{chosen.name}</p>
              <p className="flex items-center gap-1.5 truncate text-xs text-g15-200">
                <TeamBadge team={chosen.team} size="sm" />
                {chosen.team.name}
                {chosen.number != null && ` · #${chosen.number}`}
              </p>
            </>
          ) : (
            <p className="text-sm text-g15-200">ยังไม่ได้เลือก — แตะการ์ดนักกีฬาด้านล่าง</p>
          )}
        </div>
        {pending ? (
          <Loader2 className="h-5 w-5 flex-none animate-spin text-white/70" />
        ) : (
          current != null && (
            <button
              type="button"
              onClick={() => save(null)}
              className="inline-flex flex-none items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold hover:bg-white/25"
            >
              <X className="h-3.5 w-3.5" /> ล้าง
            </button>
          )
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}
      {saved && !pending && !error && (
        <p className="flex w-fit items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
          <Check className="h-3.5 w-3.5" /> บันทึกสำเร็จ
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {teams.map(({ team, players }) => (
          <div key={team.id}>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <TeamBadge team={team} size="sm" />
              {team.name}
            </p>
            {players.length === 0 ? (
              <p className="text-xs text-slate-400">ไม่มีรายชื่อนักกีฬา</p>
            ) : (
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {players.map((p) => {
                  const active = p.id === current;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={pending}
                      onClick={() => save(active ? null : p.id)}
                      aria-pressed={active}
                      className={`group relative flex flex-col overflow-hidden rounded-xl text-left ring-1 transition-all disabled:opacity-60 ${
                        active
                          ? "bg-g15-600 text-white ring-2 ring-amber-400 shadow-lg shadow-g15-200"
                          : `bg-white ring-slate-200 hover:ring-g15-400 ${p.starter ? "" : "opacity-80"}`
                      }`}
                    >
                      <div className={`relative aspect-[3/4] w-full ${active ? "bg-g15-700" : "bg-g15-50"}`}>
                        {p.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.photoUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-top" />
                        ) : (
                          <UserRound className={`absolute inset-0 m-auto h-8 w-8 ${active ? "text-white/40" : "text-g15-200"}`} />
                        )}
                        {p.number != null && (
                          <span
                            className={`absolute left-1 top-1 rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums ${
                              active ? "bg-amber-400 text-amber-950" : "bg-white/90 text-g15-800"
                            }`}
                          >
                            {p.number}
                          </span>
                        )}
                        {active && <Star className="absolute right-1 top-1 h-4 w-4 fill-amber-400 text-amber-400" />}
                      </div>
                      <span className="line-clamp-2 px-1 py-1 text-[10px] font-semibold leading-tight sm:px-1.5 sm:text-[11px]">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400">แสดงเฉพาะนักกีฬาในไลน์อัพนัดนี้ (ถ้ายังไม่ได้บันทึกไลน์อัพ แสดงทั้งทีม) · ตัวสำรองแสดงจางลงเล็กน้อย</p>
    </div>
  );
}
