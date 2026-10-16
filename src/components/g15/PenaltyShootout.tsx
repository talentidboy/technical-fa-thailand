import { Check, X } from "lucide-react";
import { TeamBadge } from "./TeamBadge";
import { shootoutState, type ShootoutKick, type KickSide } from "@/lib/g15-penalties";

type Team = { name: string; logoUrl: string | null; groupName?: string | null };

// แถบดวลจุดโทษ: แต่ละทีมเป็นแถววงกลมตามลำดับลูก (เขียว = เข้า, แดง = พลาด, เทา = ยังไม่ยิง) + สกอร์รวม
// tone "dark" ใช้บนแผงควบคุมเกมสด (พื้นม่วงเข้ม), "light" ใช้หน้าเว็บผู้ชม
export function PenaltyShootout({
  kicks,
  home,
  away,
  tone = "light",
  showKickers = true,
}: {
  kicks: ShootoutKick[];
  home: Team;
  away: Team;
  tone?: "light" | "dark";
  showKickers?: boolean;
}) {
  const st = shootoutState(kicks);
  const dark = tone === "dark";
  const teams: Record<KickSide, Team> = { home, away };

  const row = (side: KickSide) => {
    const list = side === "home" ? st.home : st.away;
    const scored = side === "home" ? st.homeScored : st.awayScored;
    const won = st.winner === side;
    const isNext = st.nextSide === side;
    return (
      <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${won ? (dark ? "bg-emerald-500/20 ring-1 ring-emerald-400/50" : "bg-emerald-50 ring-1 ring-emerald-200") : ""}`}>
        <TeamBadge team={{ name: teams[side].name, logoUrl: teams[side].logoUrl, groupName: teams[side].groupName ?? null }} size="sm" />
        <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
          {teams[side].name}
          {isNext && (
            <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-bold ${dark ? "bg-amber-400 text-amber-950" : "bg-amber-100 text-amber-800"}`}>
              ถึงตายิง
            </span>
          )}
        </span>
        <span className="flex flex-wrap items-center justify-end gap-1">
          {Array.from({ length: st.slots }, (_, i) => {
            const k = list[i];
            return (
              <span
                key={i}
                title={k ? `${k.playerName ?? "ไม่ระบุคนยิง"} — ${k.scored ? "เข้า" : "พลาด"}` : undefined}
                className={`flex h-6 w-6 items-center justify-center rounded-full ${
                  !k
                    ? dark
                      ? "bg-white/10 ring-1 ring-white/20"
                      : "bg-slate-100 ring-1 ring-slate-200"
                    : k.scored
                      ? "bg-emerald-500 text-white"
                      : "bg-red-500 text-white"
                }`}
              >
                {k && (k.scored ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <X className="h-3.5 w-3.5" strokeWidth={3} />)}
              </span>
            );
          })}
        </span>
        <span className={`w-8 flex-none text-right font-mono text-2xl font-black tabular-nums ${dark ? "text-white" : "text-slate-900"}`}>
          {scored}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-1.5">
      {row("home")}
      {row("away")}
      {st.suddenDeath && !st.winner && (
        <p className={`text-center text-xs font-bold ${dark ? "text-amber-300" : "text-amber-700"}`}>ซัดเดนเดธ / Sudden death</p>
      )}
      {showKickers && st.kicks.length > 0 && (
        <ol className={`mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-2 ${dark ? "text-white/70" : "text-slate-600"}`}>
          {st.kicks.map((k, i) => (
            <li key={k.id} className="flex items-center gap-2">
              <span className={`w-5 text-right font-mono ${dark ? "text-white/40" : "text-slate-400"}`}>{i + 1}.</span>
              <span className={`h-2 w-2 flex-none rounded-full ${k.scored ? "bg-emerald-500" : "bg-red-500"}`} />
              <span className="min-w-0 truncate">
                {k.playerName ?? "ไม่ระบุคนยิง"} <span className={dark ? "text-white/40" : "text-slate-400"}>({teams[k.side].name})</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
