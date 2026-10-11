import Link from "next/link";
import { Bebas_Neue } from "next/font/google";
import { MapPin, ChevronRight } from "lucide-react";
import { TeamBadge } from "./TeamBadge";
import { LivePill } from "./LivePill";
import { LiveClock } from "./LiveClock";
import { BallIcon } from "./BallIcon";
import { isClockLive, formatMinute, minuteOrder } from "@/lib/g15-clock";
import { roundStyle, roundEn, hasPenalties, isLive, hasLiveScore } from "@/lib/g15-stage";

const display = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap" });

const TZ = "Asia/Bangkok";
const timeLabel = (d: Date) => d.toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
const dateLabel = (d: Date) => d.toLocaleDateString("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });

type Team = { id: number; name: string; logoUrl: string | null; groupName: string | null };
type Goal = { teamId: number; playerName: string; minute: number | null; addedMinute?: number | null; isOwnGoal?: boolean };

export type MatchCardData = {
  id: number;
  round: string;
  // เลขนัดที่แสดง (วันแข่งของรอบแบ่งกลุ่ม)
  matchNo?: number | null;
  matchDate: Date | null;
  venue: string | null;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homePenalty?: number | null;
  awayPenalty?: number | null;
  homeTeam: Team;
  awayTeam: Team;
  goals?: Goal[];
  clockPhase?: string;
  firstHalfStartedAt?: Date | null;
  secondHalfStartedAt?: Date | null;
  firstHalfAddedTime?: number | null;
  secondHalfAddedTime?: number | null;
};

// ผู้ทำประตูของทีมหนึ่ง รวมนาทีต่อคน เช่น "จิตตาพัฒน์ 83', 90+2'"
function scorers(goals: Goal[], teamId: number) {
  const byName = new Map<string, string[]>();
  for (const g of [...goals].sort((a, b) => minuteOrder(a.minute, a.addedMinute) - minuteOrder(b.minute, b.addedMinute))) {
    if (g.teamId !== teamId) continue;
    const label = g.isOwnGoal ? `${g.playerName} (OG)` : g.playerName;
    if (!byName.has(label)) byName.set(label, []);
    if (g.minute != null) byName.get(label)!.push(formatMinute(g.minute, g.addedMinute));
  }
  return [...byName.entries()].map(([name, mins]) => ({ name, mins: mins.join(", ") }));
}

// การ์ดนัดการแข่งขัน — ใช้ทั้งหน้ารายการแข่งและหน้าแรก
// แถบสีกลุ่มด้านบน · โลโก้ใหญ่ + ชื่อทีมใต้โลโก้ · สกอร์ตัวโตตรงกลาง (ยังไม่แข่ง = เวลาเตะ) · ผู้ทำประตู · สนาม
export function MatchCard({ match, now, showDate = false }: { match: MatchCardData; now: Date; showDate?: boolean }) {
  const style = roundStyle(match.round);
  const finished = match.status === "FINISHED" && match.homeScore != null && match.awayScore != null;
  const live = isLive(match, now);
  const liveScore = hasLiveScore(match);
  const pens = finished && hasPenalties(match);
  const homeWon = finished && (match.homeScore! > match.awayScore! || (pens && match.homePenalty! > match.awayPenalty!));
  const awayWon = finished && (match.awayScore! > match.homeScore! || (pens && match.awayPenalty! > match.homePenalty!));
  const showScore = finished || liveScore;
  const goals = match.goals ?? [];
  const homeGoals = showScore ? scorers(goals, match.homeTeam.id) : [];
  const awayGoals = showScore ? scorers(goals, match.awayTeam.id) : [];
  const clock =
    match.clockPhase && isClockLive(match.clockPhase) ? (
      <LiveClock
        serverNow={now.getTime()}
        state={{
          clockPhase: match.clockPhase,
          firstHalfStartedAt: match.firstHalfStartedAt ? new Date(match.firstHalfStartedAt).toISOString() : null,
          secondHalfStartedAt: match.secondHalfStartedAt ? new Date(match.secondHalfStartedAt).toISOString() : null,
          firstHalfAddedTime: match.firstHalfAddedTime ?? null,
          secondHalfAddedTime: match.secondHalfAddedTime ?? null,
        }}
      />
    ) : null;

  const teamCol = (t: Team, won: boolean, lost: boolean) => (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <span className={`rounded-full bg-white p-1 shadow-md ring-1 ring-slate-200 transition-transform duration-300 group-hover:scale-105 ${lost ? "opacity-70" : ""}`}>
        <TeamBadge team={t} size="lg" />
      </span>
      <span className={`line-clamp-3 text-[13px] leading-snug sm:line-clamp-2 sm:text-sm ${won ? "font-extrabold text-g15-950" : lost ? "font-semibold text-slate-400" : "font-bold text-slate-800"}`}>
        {t.name}
      </span>
    </div>
  );

  return (
    <Link
      href={`/g15-womens-series/matches/${match.id}`}
      className={`group relative block overflow-hidden rounded-3xl bg-white shadow-sm ring-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-g15-950/10 ${
        live ? "ring-2 ring-red-400" : "ring-slate-200 hover:ring-g15-300"
      }`}
    >
      <span aria-hidden className={`absolute inset-x-0 top-0 h-1.5 ${style.bg}`} />

      {/* แถวบน: กลุ่ม/นัด · สถานะ */}
      <div className="flex items-center gap-2 px-4 pt-4 sm:px-5">
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white ${style.bg}`}>
          {match.round}
          {roundEn(match.round) && <span className="font-medium opacity-80"> / {roundEn(match.round)}</span>}
        </span>
        {match.matchNo != null && <span className="text-[11px] font-semibold text-slate-400">นัดที่ {match.matchNo}</span>}
        <span className="ml-auto flex-none">
          {finished ? (
            <span className="rounded-md bg-g15-950 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">Full time</span>
          ) : live ? (
            (clock ?? <LivePill />)
          ) : (
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Upcoming</span>
          )}
        </span>
      </div>

      {/* ทีม — สกอร์ — ทีม */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 px-3 pb-4 pt-4 sm:gap-4 sm:px-5">
        {teamCol(match.homeTeam, homeWon, awayWon)}
        <div className="flex min-w-24 flex-col items-center pt-3">
          {showScore ? (
            <>
              <span className={`${display.className} text-5xl leading-none tabular-nums ${liveScore && !finished ? "text-red-600" : "text-g15-950"}`}>
                {match.homeScore}
                <span className="mx-1.5 text-slate-300">:</span>
                {match.awayScore}
              </span>
              {pens && (
                <span className="mt-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  จุดโทษ {match.homePenalty}-{match.awayPenalty}
                </span>
              )}
            </>
          ) : (
            <>
              <span className={`${display.className} rounded-xl bg-g15-50 px-3 pt-1 text-4xl leading-tight text-g15-700`}>
                {match.matchDate ? timeLabel(match.matchDate) : "TBD"}
              </span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Kick-off</span>
            </>
          )}
          {showDate && match.matchDate && <span className="mt-1.5 text-[11px] font-medium text-slate-400">{dateLabel(match.matchDate)}</span>}
        </div>
        {teamCol(match.awayTeam, awayWon, homeWon)}
      </div>

      {/* ผู้ทำประตู */}
      {(homeGoals.length > 0 || awayGoals.length > 0) && (
        <div className="mx-4 grid grid-cols-2 gap-4 border-t border-dashed border-slate-200 py-2.5 text-[11px] leading-snug text-slate-500 sm:mx-5">
          <ul className="space-y-0.5 text-right">
            {homeGoals.map((g) => (
              <li key={g.name} className="flex items-start justify-end gap-1">
                <span className="min-w-0">
                  {g.name} <b className="text-g15-600">{g.mins}</b>
                </span>
                <BallIcon className="mt-0.5 h-3 w-3 flex-none text-slate-400" />
              </li>
            ))}
          </ul>
          <ul className="space-y-0.5">
            {awayGoals.map((g) => (
              <li key={g.name} className="flex items-start gap-1">
                <BallIcon className="mt-0.5 h-3 w-3 flex-none text-slate-400" />
                <span className="min-w-0">
                  {g.name} <b className="text-g15-600">{g.mins}</b>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* สนาม · ลิงก์ */}
      <div className="flex items-center gap-1.5 border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 text-[11px] text-slate-500 sm:px-5">
        {match.venue ? (
          <>
            <MapPin className="h-3.5 w-3.5 flex-none text-g15-400" />
            <span className="min-w-0 truncate">{match.venue}</span>
          </>
        ) : (
          <span />
        )}
        <span className="ml-auto inline-flex flex-none items-center gap-0.5 font-semibold text-g15-600">
          รายละเอียด <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
