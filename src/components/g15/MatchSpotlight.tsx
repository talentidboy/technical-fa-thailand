import Link from "next/link";
import { Trophy, Clock, Calendar, MapPin, ChevronRight } from "lucide-react";
import { TeamBadge } from "./TeamBadge";
import { LivePill } from "./LivePill";
import { Countdown } from "./Countdown";
import { LiveClock } from "./LiveClock";
import { isClockLive } from "@/lib/g15-clock";
import { roundStyle, roundEn, hasPenalties, hasLiveScore } from "@/lib/g15-stage";
import { formatMatchDateTime } from "@/lib/g15";

export type SpotlightMatch = {
  id?: number;
  round: string;
  matchNo?: number | null;
  matchDate: Date | null;
  venue: string | null;
  homeTeam: { name: string; logoUrl: string | null; groupName: string | null };
  awayTeam: { name: string; logoUrl: string | null; groupName: string | null };
  homeScore: number | null;
  awayScore: number | null;
  homePenalty?: number | null;
  awayPenalty?: number | null;
  status: string;
  // นาฬิกาเกมสด (ถ้าแอดมินใช้แผงควบคุมเกม)
  clockPhase?: string;
  firstHalfStartedAt?: Date | null;
  secondHalfStartedAt?: Date | null;
  firstHalfAddedTime?: number | null;
  secondHalfAddedTime?: number | null;
};

export type SpotlightMode = "upcoming" | "live" | "result";

// การ์ดเด่นหน้าแรก — นัดถัดไป (พร้อมนับถอยหลัง) / กำลังแข่ง (สกอร์สด) / ผลล่าสุด
export function MatchSpotlight({
  match,
  mode,
  serverNow,
}: {
  match: SpotlightMatch;
  mode: SpotlightMode;
  // เวลาฝั่งเซิร์ฟเวอร์สำหรับนับถอยหลัง (ต้องส่งมาเมื่อ mode = "upcoming")
  serverNow?: number;
}) {
  const isFinished = match.status === "FINISHED" && match.homeScore != null && match.awayScore != null;
  const liveScore = mode === "live" && hasLiveScore(match);
  const style = roundStyle(match.round);
  const regionEnLabel = roundEn(match.round);

  return (
    <div
      className={`overflow-hidden rounded-3xl border bg-white shadow-lg ring-1 ${
        mode === "live" ? "border-red-200 ring-red-300/40" : `border-slate-200 ${style.ring}`
      }`}
    >
      <div className={`flex flex-wrap items-center justify-between gap-2 px-5 py-3 ${mode === "live" ? "bg-red-600" : style.bg}`}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white ring-1 ring-white/30">
          {mode === "upcoming" ? (
            <>
              <Clock className="h-3.5 w-3.5" />
              นัดถัดไป / Next Match
            </>
          ) : mode === "live" ? (
            <>
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              กำลังแข่ง / Live Now
            </>
          ) : (
            <>
              <Trophy className="h-3.5 w-3.5" />
              ผลล่าสุด / Latest Result
            </>
          )}
        </span>
        <span className="text-xs font-medium text-white/85">
          {match.matchNo != null && `นัดที่ ${match.matchNo} · `}
          {match.round}
          {regionEnLabel && <span className="opacity-80"> / {regionEnLabel}</span>}
        </span>
      </div>

      <div className="px-6 py-8 sm:px-10 sm:py-10">
        <div className="flex items-center justify-center gap-4 sm:gap-10">
          <div className="flex flex-1 flex-col items-center gap-3 text-center">
            <TeamBadge team={match.homeTeam} size="lg" />
            <span className="line-clamp-3 max-w-32 text-sm font-bold leading-snug text-slate-900 sm:max-w-48 sm:text-base">
              {match.homeTeam.name}
            </span>
          </div>

          <div className="flex flex-none flex-col items-center gap-2">
            {isFinished || liveScore ? (
              <>
                <div
                  className={`rounded-2xl px-4 py-3 text-2xl font-extrabold tabular-nums text-white sm:px-6 sm:text-3xl ${
                    liveScore ? "bg-red-600" : "bg-slate-900"
                  }`}
                >
                  {match.homeScore} - {match.awayScore}
                </div>
                {liveScore &&
                  (match.clockPhase && isClockLive(match.clockPhase) && serverNow != null ? (
                    <LiveClock
                      serverNow={serverNow}
                      state={{
                        clockPhase: match.clockPhase,
                        firstHalfStartedAt: match.firstHalfStartedAt?.toISOString() ?? null,
                        secondHalfStartedAt: match.secondHalfStartedAt?.toISOString() ?? null,
                        firstHalfAddedTime: match.firstHalfAddedTime ?? null,
                        secondHalfAddedTime: match.secondHalfAddedTime ?? null,
                      }}
                    />
                  ) : (
                    <LivePill />
                  ))}
                {isFinished && hasPenalties(match) && (
                  <p className="text-xs font-semibold text-slate-500">
                    จุดโทษ {match.homePenalty}-{match.awayPenalty}
                  </p>
                )}
              </>
            ) : mode === "live" ? (
              <LivePill size="md" />
            ) : (
              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-lg font-bold text-slate-400 sm:px-6 sm:text-xl">VS</div>
            )}
          </div>

          <div className="flex flex-1 flex-col items-center gap-3 text-center">
            <TeamBadge team={match.awayTeam} size="lg" />
            <span className="line-clamp-3 max-w-32 text-sm font-bold leading-snug text-slate-900 sm:max-w-48 sm:text-base">
              {match.awayTeam.name}
            </span>
          </div>
        </div>

        {mode === "upcoming" && match.matchDate && serverNow != null && (
          <div className="mt-8">
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-g15-600">
              เริ่มเตะใน / Kick-off in
            </p>
            <Countdown target={match.matchDate.toISOString()} serverNow={serverNow} />
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-slate-100 pt-5 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formatMatchDateTime(match.matchDate)}
          </span>
          {match.venue && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {match.venue}
            </span>
          )}
          {match.id != null && (
            <Link
              href={`/g15-womens-series/matches/${match.id}`}
              className="flex items-center gap-0.5 font-medium text-g15-600 hover:text-g15-700"
            >
              รายละเอียดนัด / Match centre
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
