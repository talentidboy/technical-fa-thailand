import { Bebas_Neue } from "next/font/google";
import { Check, X, Trophy } from "lucide-react";
import { TeamBadge } from "./TeamBadge";
import { shootoutState, REGULATION_KICKS, type ShootoutKick, type KickSide } from "@/lib/g15-penalties";

const display = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap" });

type Team = { name: string; logoUrl: string | null; groupName?: string | null };
const badge = (t: Team) => ({ name: t.name, logoUrl: t.logoUrl, groupName: t.groupName ?? null });

// วงกลมของแต่ละลูก: เขียว = เข้า, แดง = พลาด, ยังไม่ยิง = เลขลูก · ลูกถัดไปของทีมที่ถึงตากะพริบสีทอง
function KickDot({ kick, index, next, size }: { kick?: ShootoutKick; index: number; next: boolean; size: "md" | "lg" }) {
  const box = size === "lg" ? "h-8 w-8 sm:h-9 sm:w-9" : "h-7 w-7";
  const icon = size === "lg" ? "h-4 w-4 sm:h-5 sm:w-5" : "h-3.5 w-3.5";
  if (kick) {
    return (
      <span
        title={`${kick.playerName ?? "ไม่ระบุคนยิง"} — ${kick.scored ? "เข้า" : "พลาด"}`}
        className={`flex ${box} flex-none items-center justify-center rounded-full text-white shadow-md ${
          kick.scored ? "bg-linear-to-br from-emerald-400 to-emerald-600 shadow-emerald-900/40" : "bg-linear-to-br from-red-400 to-red-600 shadow-red-900/40"
        }`}
      >
        {kick.scored ? <Check className={icon} strokeWidth={3.5} /> : <X className={icon} strokeWidth={3.5} />}
      </span>
    );
  }
  return (
    <span
      className={`flex ${box} flex-none items-center justify-center rounded-full font-mono text-[11px] font-bold ${
        next ? "animate-pulse bg-amber-400/20 text-amber-200 ring-2 ring-amber-300" : "bg-white/5 text-white/30 ring-1 ring-white/15"
      }`}
    >
      {index + 1}
    </span>
  );
}

// ดวลจุดโทษ — "board" = กระดานใหญ่หน้าเว็บผู้ชม (สไตล์ถ่ายทอดสด), "compact" = แถบในแผงควบคุมเกมสดของแอดมิน
export function PenaltyShootout({
  kicks,
  home,
  away,
  variant = "board",
  live = false,
}: {
  kicks: ShootoutKick[];
  home: Team;
  away: Team;
  variant?: "board" | "compact";
  live?: boolean;
}) {
  const st = shootoutState(kicks);
  const teams: Record<KickSide, Team> = { home, away };
  const listOf = (side: KickSide) => (side === "home" ? st.home : st.away);
  const scoreOf = (side: KickSide) => (side === "home" ? st.homeScored : st.awayScored);

  const dots = (side: KickSide, size: "md" | "lg") => {
    const list = listOf(side);
    return (
      <span className="flex flex-wrap items-center gap-1.5">
        {Array.from({ length: st.slots }, (_, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {/* เส้นคั่นก่อนลูกซัดเดนเดธ */}
            {i === REGULATION_KICKS && <span className="mx-0.5 h-6 w-px bg-amber-300/40" aria-hidden />}
            <KickDot kick={list[i]} index={i} next={st.nextSide === side && i === list.length} size={size} />
          </span>
        ))}
      </span>
    );
  };

  // ===== แผงแอดมิน =====
  if (variant === "compact") {
    return (
      <div className="space-y-1.5">
        {(["home", "away"] as const).map((side) => {
          const won = st.winner === side;
          return (
            <div
              key={side}
              className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl px-3 py-2.5 ${won ? "bg-emerald-500/20 ring-1 ring-emerald-400/50" : "bg-white/5"}`}
            >
              <TeamBadge team={badge(teams[side])} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{teams[side].name}</span>
              {dots(side, "md")}
              <span className={`${display.className} w-8 flex-none text-right text-3xl leading-none ${won ? "text-amber-300" : "text-white"}`}>
                {scoreOf(side)}
              </span>
            </div>
          );
        })}
        {st.suddenDeath && !st.winner && <p className="text-center text-xs font-bold text-amber-300">ซัดเดนเดธ / Sudden death</p>}
      </div>
    );
  }

  // ===== กระดานหน้าเว็บผู้ชม =====
  const rounds = Math.max(st.home.length, st.away.length);
  const winnerTeam = st.winner ? teams[st.winner] : null;

  const cell = (k: ShootoutKick | undefined, align: "left" | "right") =>
    k ? (
      <span className={`flex min-w-0 items-center gap-2 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
        <span
          className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-white ${k.scored ? "bg-emerald-500" : "bg-red-500"}`}
        >
          {k.scored ? <Check className="h-3 w-3" strokeWidth={3.5} /> : <X className="h-3 w-3" strokeWidth={3.5} />}
        </span>
        <span className={`truncate text-xs sm:text-sm ${k.scored ? "text-white" : "text-white/50 line-through decoration-red-400/70"}`}>
          {k.playerName ?? (k.scored ? "ยิงเข้า" : "ยิงพลาด")}
        </span>
      </span>
    ) : (
      <span className={`text-xs text-white/20 ${align === "right" ? "text-right" : ""}`}>—</span>
    );

  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-b from-g15-900 via-g15-950 to-g15-950 text-white shadow-2xl shadow-black/40 ring-1 ring-amber-300/30">
      <div className="h-1 bg-linear-to-r from-amber-600 via-amber-300 to-amber-600" />
      {/* แสงทองจาง ๆ ด้านบน */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(252,211,77,0.18),transparent_70%)]" />

      <div className="relative px-4 pb-5 pt-4 sm:px-7 sm:pb-7 sm:pt-5">
        {/* หัวข้อ */}
        <div className="flex flex-col items-center gap-1.5">
          {live && !st.winner ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              Live · กำลังดวลจุดโทษ
            </span>
          ) : (
            <span className="rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-amber-300 ring-1 ring-amber-300/30">
              Penalty Shoot-out
            </span>
          )}
          <h3 className={`${display.className} text-3xl leading-none tracking-wide text-white sm:text-4xl`}>ดวลจุดโทษ</h3>
        </div>

        {/* ทีม — สกอร์จุดโทษ — ทีม */}
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-6">
          {(["home", "away"] as const).map((side, idx) => {
            const won = st.winner === side;
            const teamBlock = (
              <div key={side} className={`flex min-w-0 flex-col items-center gap-2 text-center ${idx === 1 ? "order-3" : ""}`}>
                <span className={`rounded-full bg-white p-1 shadow-lg ${won ? "ring-4 ring-amber-300" : "ring-2 ring-white/20"}`}>
                  <TeamBadge team={badge(teams[side])} size="md" />
                </span>
                <span className={`line-clamp-2 text-xs font-bold leading-snug sm:text-sm ${won ? "text-amber-200" : "text-white/85"}`}>
                  {teams[side].name}
                </span>
                {st.first === side && <span className="text-[11px] font-semibold text-white/40">ยิงก่อน</span>}
              </div>
            );
            return teamBlock;
          })}
          <div className="order-2 flex items-center gap-2 sm:gap-3">
            <span className={`${display.className} text-6xl leading-none tabular-nums sm:text-7xl ${st.winner === "home" ? "text-amber-300 drop-shadow-[0_0_18px_rgba(252,211,77,0.45)]" : st.winner ? "text-white/50" : "text-white"}`}>
              {st.homeScored}
            </span>
            <span className={`${display.className} text-3xl text-white/30 sm:text-4xl`}>–</span>
            <span className={`${display.className} text-6xl leading-none tabular-nums sm:text-7xl ${st.winner === "away" ? "text-amber-300 drop-shadow-[0_0_18px_rgba(252,211,77,0.45)]" : st.winner ? "text-white/50" : "text-white"}`}>
              {st.awayScored}
            </span>
          </div>
        </div>

        {/* วงกลมทีละลูก */}
        <div className="mt-5 space-y-2.5 rounded-2xl bg-black/20 p-3 ring-1 ring-white/10 sm:p-4">
          {(["home", "away"] as const).map((side) => (
            <div key={side} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="flex min-w-0 items-center gap-2 sm:w-44 sm:flex-none">
                <TeamBadge team={badge(teams[side])} size="sm" />
                <span className="truncate text-xs font-semibold text-white/80">{teams[side].name}</span>
                {st.nextSide === side && (
                  <span className="flex-none rounded bg-amber-400 px-1.5 py-0.5 text-[11px] font-black text-amber-950">ถึงตา</span>
                )}
              </span>
              {dots(side, "lg")}
            </div>
          ))}
          {st.suddenDeath && !st.winner && (
            <p className="pt-1 text-center text-xs font-black uppercase tracking-wider text-amber-300">ซัดเดนเดธ · Sudden death</p>
          )}
        </div>

        {/* ผู้ชนะ */}
        {winnerTeam && (
          <div className="mt-4 flex items-center justify-center gap-2.5 rounded-2xl bg-linear-to-r from-amber-500 via-amber-300 to-amber-500 px-4 py-3 text-amber-950 shadow-lg shadow-amber-900/30">
            <Trophy className="h-5 w-5 flex-none" />
            <span className="text-center text-sm font-black sm:text-base">
              {winnerTeam.name} ชนะจุดโทษ {Math.max(st.homeScored, st.awayScored)}-{Math.min(st.homeScored, st.awayScored)}
            </span>
          </div>
        )}

        {/* ผู้ยิงทีละรอบ */}
        {rounds > 0 && (
          <div className="mt-4">
            <div className="mb-1.5 grid grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-wider text-white/40">
              <span className="truncate text-right">{home.name}</span>
              <span className="text-center">รอบ</span>
              <span className="truncate">{away.name}</span>
            </div>
            <ul className="divide-y divide-white/5 overflow-hidden rounded-xl bg-white/3 ring-1 ring-white/10">
              {Array.from({ length: rounds }, (_, i) => (
                <li key={i} className={`grid grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] items-center gap-2 px-3 py-2 ${i >= REGULATION_KICKS ? "bg-amber-400/6" : ""}`}>
                  {cell(st.home[i], "right")}
                  <span className="flex justify-center">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] font-bold ${i >= REGULATION_KICKS ? "bg-amber-400/20 text-amber-200" : "bg-white/10 text-white/60"}`}>
                      {i + 1}
                    </span>
                  </span>
                  {cell(st.away[i], "left")}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
