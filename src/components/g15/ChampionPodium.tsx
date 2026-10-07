import Link from "next/link";
import { Trophy, Medal, Sparkles, Goal } from "lucide-react";
import { TeamBadge } from "./TeamBadge";
import { HeroArt } from "./HeroArt";
import type { BracketTeam } from "@/lib/g15";

type Scorer = { playerName: string; teamName: string; goals: number } | null;

// ประกาศผลหลังจบนัดชิงชนะเลิศ — แชมป์ / รองแชมป์ / ที่ 3 + ดาวซัลโวของรอบ
// โชว์บนสุดของหน้าแรก (รอบชิงแชมป์ประเทศ) แทนการ์ดนัดถัดไป เมื่อทัวร์นาเมนต์จบแล้ว
export function ChampionPodium({
  champion,
  runnerUp,
  third,
  topScorer,
}: {
  champion: BracketTeam;
  runnerUp: BracketTeam | null;
  third: BracketTeam | null;
  topScorer: Scorer;
}) {
  const place = (team: BracketTeam | null, rank: 2 | 3) =>
    team && (
      <Link
        href={`/g15-womens-series/teams/${team.id}`}
        className={`flex flex-col items-center gap-2 rounded-2xl bg-white/10 px-3 pb-4 pt-5 text-center ring-1 ring-white/15 transition-colors hover:bg-white/15 ${
          rank === 2 ? "sm:mt-8" : "sm:mt-12"
        }`}
      >
        <Medal className={`h-6 w-6 ${rank === 2 ? "text-slate-200" : "text-orange-300"}`} />
        <TeamBadge team={team} size="md" />
        <p className="line-clamp-2 text-sm font-bold text-white">{team.name}</p>
        <p className="text-[11px] font-medium text-g15-200">{rank === 2 ? "รองแชมป์ / Runner-up" : "อันดับ 3 / Third"}</p>
      </Link>
    );

  return (
    <div className="relative isolate overflow-hidden rounded-3xl bg-linear-to-br from-g15-950 via-g15-800 to-g15-600 p-6 shadow-2xl shadow-g15-900/30 sm:p-8">
      <div className="absolute inset-x-0 top-0 h-1.5 animate-shimmer-slide bg-linear-to-r from-amber-600 via-amber-200 via-50% to-amber-600 bg-size-[200%_100%]" />
      <HeroArt />
      <Sparkles className="animate-float-y absolute left-6 top-8 h-5 w-5 text-amber-300/70" />
      <Sparkles className="animate-float-y absolute right-8 top-14 h-4 w-4 text-white/50" style={{ animationDelay: "1s" }} />

      <p className="text-center text-xs font-bold uppercase tracking-[0.25em] text-amber-300">
        Champion · FA Thailand G15 Women&apos;s Football Series 2026
      </p>

      <div className="mt-6 grid grid-cols-1 items-start gap-4 sm:grid-cols-[1fr_1.3fr_1fr]">
        <div className="order-2 sm:order-1">{place(runnerUp, 2)}</div>
        <Link
          href={`/g15-womens-series/teams/${champion.id}`}
          className="order-1 flex flex-col items-center gap-3 rounded-3xl bg-linear-to-b from-amber-300 to-amber-500 px-4 pb-6 pt-6 text-center text-amber-950 shadow-xl shadow-amber-500/30 transition-transform hover:-translate-y-1 sm:order-2"
        >
          <Trophy className="h-10 w-10 drop-shadow" />
          <TeamBadge team={champion} size="lg" />
          <p className="text-lg font-extrabold leading-tight sm:text-xl">{champion.name}</p>
          <p className="text-xs font-bold uppercase tracking-widest">แชมป์ประเทศไทย / Champion</p>
        </Link>
        <div className="order-3">{place(third, 3)}</div>
      </div>

      {topScorer && (
        <div className="mx-auto mt-6 flex w-fit items-center gap-2.5 rounded-full bg-white/10 px-4 py-2 text-sm text-white ring-1 ring-white/15">
          <Goal className="h-4 w-4 text-amber-300" />
          <span className="text-g15-200">ดาวซัลโว / Top scorer:</span>
          <span className="font-bold">{topScorer.playerName}</span>
          <span className="text-g15-200">({topScorer.teamName})</span>
          <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-extrabold text-amber-950">{topScorer.goals} ประตู</span>
        </div>
      )}
    </div>
  );
}
