import Link from "next/link";
import { Trophy, Medal, Calendar, Sparkles, Swords } from "lucide-react";
import { TeamBadge } from "./TeamBadge";
import { formatMatchDateTime, type BracketTie, type BracketSide } from "@/lib/g15";

type Variant = "semi" | "final" | "third";

// โทนสีของแต่ละรอบ: รอบรองฯ = ม่วงประจำรายการ, ชิงชนะเลิศ = ทอง, ชิงที่ 3 = บรอนซ์
const VARIANT = {
  semi: {
    frame: "bg-linear-to-br from-g15-300 via-g15-500 to-g15-700",
    inner: "bg-white",
    header: "bg-linear-to-r from-g15-700 via-g15-600 to-g15-700 text-white",
    sub: "text-g15-200",
    winRow: "bg-g15-50",
    placeholderDot: "border-g15-300 text-g15-400",
    footer: "bg-g15-50/60 text-g15-400",
    shadow: "shadow-lg shadow-g15-900/10",
  },
  final: {
    frame: "bg-linear-to-br from-amber-200 via-amber-500 to-amber-700",
    inner: "bg-amber-50/50",
    header: "animate-shimmer-slide bg-linear-to-r from-amber-600 via-amber-200 via-50% to-amber-600 bg-size-[200%_100%] text-amber-950",
    sub: "text-amber-900/80",
    winRow: "bg-amber-100/80",
    placeholderDot: "border-amber-400 text-amber-500",
    footer: "bg-amber-50 text-amber-700/70",
    shadow: "shadow-2xl shadow-amber-500/30",
  },
  third: {
    frame: "bg-linear-to-br from-orange-300 via-orange-700 to-orange-900",
    inner: "bg-white",
    header: "bg-linear-to-r from-orange-900 via-orange-700 to-orange-900 text-white",
    sub: "text-orange-200",
    winRow: "bg-orange-50",
    placeholderDot: "border-orange-300 text-orange-400",
    footer: "bg-orange-50/60 text-orange-700/60",
    shadow: "shadow-lg shadow-orange-900/10",
  },
} as const;

function SideRow({ side, decided, variant }: { side: BracketSide; decided: boolean; variant: Variant }) {
  const v = VARIANT[variant];
  const dim = decided && !side.isWinner;
  const big = variant === "final";
  return (
    <div className={`flex items-center gap-3 px-4 ${big ? "py-3.5" : "py-3"} ${side.isWinner ? v.winRow : ""}`}>
      {side.team ? (
        <>
          <TeamBadge team={side.team} size={big ? "md" : "sm"} />
          <span
            className={`line-clamp-2 min-w-0 flex-1 leading-snug ${big ? "text-[15px]" : "text-sm"} ${
              side.isWinner ? "font-extrabold text-slate-900" : dim ? "text-slate-400" : "font-semibold text-slate-800"
            }`}
          >
            {side.team.name}
          </span>
        </>
      ) : (
        <>
          <span
            className={`flex flex-none items-center justify-center rounded-full border-2 border-dashed text-xs font-bold ${v.placeholderDot} ${
              big ? "h-8 w-8" : "h-6 w-6"
            }`}
          >
            ?
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className={`block font-semibold text-slate-500 ${big ? "text-sm" : "text-[13px]"}`}>{side.placeholder}</span>
            <span className="block text-[11px] text-slate-400">{side.placeholderEn}</span>
          </span>
        </>
      )}
      {side.score != null && (
        <span className={`flex-none font-black tabular-nums ${big ? "text-2xl" : "text-lg"} ${dim ? "text-slate-300" : "text-slate-900"}`}>
          {side.score}
          {side.penalty != null && <span className="ml-1 text-xs font-semibold text-slate-400">({side.penalty})</span>}
        </span>
      )}
      {side.isWinner && variant === "final" && <Trophy className="h-5 w-5 flex-none text-amber-500" />}
    </div>
  );
}

function TieCard({ tie, variant }: { tie: BracketTie; variant: Variant }) {
  const v = VARIANT[variant];
  const decided = tie.home.isWinner || tie.away.isWinner;
  const title = variant === "final" ? "ชิงชนะเลิศ / Final" : variant === "third" ? "ชิงอันดับที่ 3 / 3rd Place" : "รอบรองชนะเลิศ / Semi-final";
  const body = (
    // กรอบไล่สี 2px รอบการ์ด (frame) + ตัวการ์ดด้านใน — ให้ขอบดูเป็นโลหะ ทอง/ม่วง/บรอนซ์ ตามรอบ
    <div className={`rounded-2xl p-[2px] ${v.frame} ${v.shadow} transition-transform ${tie.matchId ? "hover:-translate-y-0.5" : ""}`}>
      <div className={`overflow-hidden rounded-[14px] ${v.inner}`}>
        <div className={`flex items-center justify-between gap-2 px-4 py-2.5 ${v.header}`}>
          <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider">
            {variant === "final" ? <Trophy className="h-4 w-4" /> : variant === "third" ? <Medal className="h-4 w-4" /> : <Swords className="h-3.5 w-3.5" />}
            นัดที่ {tie.matchNo}
          </span>
          <span className={`text-[11px] font-semibold ${v.sub}`}>{title}</span>
        </div>
        <div className="divide-y divide-slate-100">
          <SideRow side={tie.home} decided={decided} variant={variant} />
          <SideRow side={tie.away} decided={decided} variant={variant} />
        </div>
        <div className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium ${v.footer}`}>
          <Calendar className="h-3 w-3 flex-none" />
          <span className="truncate">{tie.matchId && tie.matchDate ? formatMatchDateTime(tie.matchDate) : "รอผลรอบก่อนหน้า / TBD"}</span>
        </div>
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

// สายการแข่งขันรอบน็อกเอาต์ของรอบชิงแชมป์ประเทศ — รอบรองฯ (2 คู่) → ชิงชนะเลิศ (ทอง) / ชิงที่ 3 (บรอนซ์)
// จอใหญ่: มีเส้นสายเชื่อมจากรอบรองฯ ทั้งสองคู่เข้าหานัดชิง เหมือนผังการแข่งขันจริง
export function KnockoutBracket({ ties }: { ties: BracketTie[] }) {
  const sf1 = ties.find((t) => t.key === "SF1")!;
  const sf2 = ties.find((t) => t.key === "SF2")!;
  const third = ties.find((t) => t.key === "THIRD")!;
  const final = ties.find((t) => t.key === "FINAL")!;
  const champion = final.home.isWinner ? final.home.team : final.away.isWinner ? final.away.team : null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1.15fr)] lg:gap-0">
        {/* รอบรองชนะเลิศ */}
        <div className="flex flex-col gap-5">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-g15-600">
            <Swords className="h-3.5 w-3.5" />
            รอบรองชนะเลิศ / Semi-finals
          </p>
          <div className="relative flex flex-col gap-5">
            <TieCard tie={sf1} variant="semi" />
            <TieCard tie={sf2} variant="semi" />
          </div>
        </div>

        {/* เส้นสายเชื่อม (เฉพาะจอใหญ่) — วงเล็บจากกึ่งกลางการ์ดรอบรองฯ ทั้งสอง แล้วลากเส้นตรงเข้าหานัดชิง */}
        <div aria-hidden className="relative hidden pt-9 lg:block">
          <div className="relative h-full">
            <div className="absolute inset-y-[25%] left-0 w-1/2 rounded-r-2xl border-y-2 border-r-2 border-amber-300" />
            <div className="absolute left-1/2 right-0 top-1/2 border-t-2 border-amber-300" />
            <span className="absolute -right-1 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-amber-400 ring-4 ring-amber-100" />
          </div>
        </div>

        {/* ชิงชนะเลิศ — จัดกึ่งกลางแนวตั้งให้ตรงกับเส้นเชื่อม */}
        <div className="flex flex-col lg:pt-9">
          <div className="flex flex-1 flex-col justify-center gap-3">
            <div className="flex items-center justify-center gap-2.5">
              <span className="relative flex h-11 w-11 flex-none items-center justify-center rounded-full bg-linear-to-br from-amber-200 via-amber-400 to-amber-600 shadow-lg shadow-amber-500/40 ring-4 ring-amber-100">
                <Trophy className="h-5.5 w-5.5 text-amber-950" />
                <Sparkles className="animate-float-y absolute -right-2 -top-1 h-4 w-4 text-amber-400" />
              </span>
              <p className="bg-linear-to-r from-amber-700 via-amber-400 to-amber-700 bg-clip-text text-xl font-black uppercase tracking-widest text-transparent">
                ชิงชนะเลิศ · Final
              </p>
            </div>
            <TieCard tie={final} variant="final" />
            {/* ถ่วงความสูงเท่าหัวข้อ "ชิงชนะเลิศ" ด้านบน ให้การ์ดนัดชิงอยู่ตรงเส้นเชื่อมพอดี (มีแถบแชมป์แล้วไม่ต้องถ่วง) */}
            {!champion && <div aria-hidden className="hidden h-11 lg:block" />}
            {champion && (
              <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-amber-500 via-amber-300 to-amber-500 px-5 py-3.5 text-amber-950 shadow-lg shadow-amber-500/30">
                <div className="absolute inset-0 animate-shimmer-slide bg-linear-to-r from-transparent via-white/40 to-transparent bg-size-[200%_100%]" />
                <div className="relative flex items-center gap-3">
                  <Trophy className="h-7 w-7 flex-none" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest">แชมป์ประเทศไทย / Champion</p>
                    <p className="truncate text-base font-black">{champion.name}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ชิงอันดับที่ 3 — แถวล่าง ใต้นัดชิง */}
      <div className="lg:ml-auto lg:w-[calc((100%-3.5rem)*1.15/2.15)]">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-orange-800">
          <Medal className="h-3.5 w-3.5" />
          ชิงอันดับที่ 3 / 3rd Place
        </p>
        <TieCard tie={third} variant="third" />
      </div>
    </div>
  );
}
