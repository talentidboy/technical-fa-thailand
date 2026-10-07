import Link from "next/link";
import { Trophy, Medal, Calendar } from "lucide-react";
import { TeamBadge } from "./TeamBadge";
import { formatMatchDateTime, type BracketTie, type BracketSide } from "@/lib/g15";
import { roundStyle, roundEn } from "@/lib/g15-stage";

function SideRow({ side, decided }: { side: BracketSide; decided: boolean }) {
  const dim = decided && !side.isWinner;
  return (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 ${side.isWinner ? "bg-amber-50/60" : ""}`}>
      {side.team ? (
        <>
          <TeamBadge team={side.team} size="sm" />
          <span className={`min-w-0 flex-1 truncate text-sm ${side.isWinner ? "font-bold text-slate-900" : dim ? "text-slate-400" : "font-medium text-slate-700"}`}>
            {side.team.name}
          </span>
        </>
      ) : (
        <>
          <span className="h-6 w-6 flex-none rounded-full border border-dashed border-slate-300 bg-slate-50" />
          <span className="min-w-0 flex-1 truncate text-xs text-slate-400">
            {side.placeholder} <span className="text-slate-300">/ {side.placeholderEn}</span>
          </span>
        </>
      )}
      {side.score != null && (
        <span className={`flex-none text-sm font-extrabold tabular-nums ${dim ? "text-slate-400" : "text-slate-900"}`}>
          {side.score}
          {side.penalty != null && <span className="ml-1 text-[11px] font-semibold text-slate-400">({side.penalty})</span>}
        </span>
      )}
    </div>
  );
}

function TieCard({ tie, highlight = false }: { tie: BracketTie; highlight?: boolean }) {
  const style = roundStyle(tie.round);
  const decided = tie.home.isWinner || tie.away.isWinner;
  const body = (
    <div
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
        highlight ? "border-amber-300 shadow-amber-200/60 ring-2 ring-amber-200" : "border-slate-200"
      } ${tie.matchId ? "hover:-translate-y-0.5 hover:shadow-md" : ""}`}
    >
      <div className={`flex items-center justify-between gap-2 px-4 py-2 text-white ${style.bg}`}>
        <span className="text-[11px] font-bold uppercase tracking-wide">นัดที่ {tie.matchNo}</span>
        <span className="text-[11px] font-medium text-white/85">
          {tie.round} / {roundEn(tie.round)}
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        <SideRow side={tie.home} decided={decided} />
        <SideRow side={tie.away} decided={decided} />
      </div>
      <div className="flex items-center gap-1.5 border-t border-slate-100 bg-slate-50/60 px-4 py-1.5 text-[11px] text-slate-400">
        <Calendar className="h-3 w-3 flex-none" />
        <span className="truncate">{tie.matchId ? formatMatchDateTime(tie.matchDate) : "รอผลรอบก่อนหน้า / TBD"}</span>
      </div>
    </div>
  );
  return tie.matchId ? (
    <Link href={`/g15-womens-series/matches/${tie.matchId}`} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

// สายการแข่งขันรอบน็อกเอาต์ของรอบชิงแชมป์ประเทศ — รอบรองฯ (2 คู่) → ชิงชนะเลิศ / ชิงที่ 3
export function KnockoutBracket({ ties }: { ties: BracketTie[] }) {
  const sf1 = ties.find((t) => t.key === "SF1")!;
  const sf2 = ties.find((t) => t.key === "SF2")!;
  const third = ties.find((t) => t.key === "THIRD")!;
  const final = ties.find((t) => t.key === "FINAL")!;
  const champion = final.home.isWinner ? final.home.team : final.away.isWinner ? final.away.team : null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.15fr_1fr] lg:items-center">
      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">รอบรองชนะเลิศ / Semi-finals</p>
        <TieCard tie={sf1} />
        <TieCard tie={sf2} />
      </div>

      <div className="space-y-4">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-g15-600">
          <Trophy className="h-3.5 w-3.5" />
          ชิงชนะเลิศ / Final
        </p>
        <TieCard tie={final} highlight />
        {champion && (
          <div className="flex items-center gap-3 rounded-2xl bg-linear-to-r from-amber-400 to-amber-300 px-4 py-3 text-amber-950 shadow-sm">
            <Trophy className="h-6 w-6 flex-none" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest">แชมป์ประเทศไทย / Champion</p>
              <p className="truncate text-sm font-extrabold">{champion.name}</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-700">
          <Medal className="h-3.5 w-3.5" />
          ชิงอันดับที่ 3 / 3rd Place
        </p>
        <TieCard tie={third} />
      </div>
    </div>
  );
}
