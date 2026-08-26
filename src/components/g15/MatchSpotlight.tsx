import { Trophy, Clock, Calendar, MapPin } from "lucide-react";
import { TeamBadge } from "./TeamBadge";
import { regionStyle, regionEn } from "@/lib/g15-region";
import { formatMatchDateTime } from "@/lib/g15";

export type SpotlightMatch = {
  round: string;
  matchDate: Date | null;
  venue: string | null;
  homeTeam: { name: string; logoUrl: string | null; groupName: string | null };
  awayTeam: { name: string; logoUrl: string | null; groupName: string | null };
  homeScore: number | null;
  awayScore: number | null;
  status: string;
};

export function MatchSpotlight({ match, isUpcoming }: { match: SpotlightMatch; isUpcoming: boolean }) {
  const isFinished = match.status === "FINISHED" && match.homeScore != null && match.awayScore != null;
  const style = regionStyle(match.round);
  const regionEnLabel = regionEn(match.round);

  return (
    <div className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg ring-1 ${style.ring}`}>
      <div className={`flex flex-wrap items-center justify-between gap-2 px-5 py-3 ${style.bg}`}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white ring-1 ring-white/30">
          {isUpcoming ? (
            <>
              <Clock className="h-3.5 w-3.5" />
              นัดถัดไป / Next Match
            </>
          ) : (
            <>
              <Trophy className="h-3.5 w-3.5" />
              ผลล่าสุด / Latest Result
            </>
          )}
        </span>
        <span className="text-xs font-medium text-white/85">
          {match.round}
          {regionEnLabel && <span className="opacity-80"> / {regionEnLabel}</span>}
        </span>
      </div>

      <div className="px-6 py-8 sm:px-10 sm:py-10">
        <div className="flex items-center justify-center gap-4 sm:gap-10">
          <div className="flex flex-1 flex-col items-center gap-3 text-center">
            <TeamBadge team={match.homeTeam} size="lg" />
            <span className="max-w-28 truncate text-sm font-bold text-slate-900 sm:max-w-40 sm:text-base">
              {match.homeTeam.name}
            </span>
          </div>

          <div className="flex flex-none flex-col items-center">
            {isFinished ? (
              <div className="rounded-2xl bg-slate-900 px-4 py-3 text-2xl font-extrabold tabular-nums text-white sm:px-6 sm:text-3xl">
                {match.homeScore} - {match.awayScore}
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-lg font-bold text-slate-400 sm:px-6 sm:text-xl">
                VS
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col items-center gap-3 text-center">
            <TeamBadge team={match.awayTeam} size="lg" />
            <span className="max-w-28 truncate text-sm font-bold text-slate-900 sm:max-w-40 sm:text-base">
              {match.awayTeam.name}
            </span>
          </div>
        </div>

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
        </div>
      </div>
    </div>
  );
}
