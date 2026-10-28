import Link from "next/link";
import { Bebas_Neue } from "next/font/google";
import { Star, UserRound, ArrowRight } from "lucide-react";
import { TeamBadge } from "./TeamBadge";
import { BallIcon } from "./BallIcon";

const display = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap" });

// การ์ดผู้เล่นยอดเยี่ยมประจำนัด (หน้ารายละเอียดแมท) — ฉากสนามสีม่วง + รูปไดคัทชิดขอบล่าง + ชื่อตัวใหญ่แบบโปรไฟล์นักกีฬา
export function PlayerOfMatchCard({
  player,
  team,
  goals,
  assists,
}: {
  player: {
    id: number;
    firstNameTh: string;
    lastNameTh: string;
    firstNameEn: string | null;
    lastNameEn: string | null;
    jerseyNumber: number | null;
    position: string | null;
    photoUrl: string | null;
  };
  team: { name: string; logoUrl: string | null; groupName: string | null };
  goals: number;
  assists: number;
}) {
  const nameEn = [player.firstNameEn, player.lastNameEn].filter(Boolean).join(" ");
  return (
    <Link
      href={`/g15-womens-series/players/${player.id}`}
      className="group relative isolate block overflow-hidden rounded-3xl bg-g15-950 shadow-xl shadow-g15-950/20 ring-1 ring-g15-900/40"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/g15/player-profile-banner-v2-sm.webp"
        alt=""
        aria-hidden
        className="absolute inset-0 -z-10 h-full w-full object-cover object-[60%_50%] opacity-60"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-r from-g15-950 via-g15-900/85 to-g15-700/40" />
      <div className="absolute inset-x-0 top-0 h-1 animate-shimmer-slide bg-linear-to-r from-amber-600 via-amber-200 via-50% to-amber-600 bg-size-[200%_100%]" />
      {/* เบอร์เสื้อตัวใหญ่จางๆ ด้านหลัง */}
      {player.jerseyNumber != null && (
        <span
          aria-hidden
          className={`${display.className} pointer-events-none absolute -bottom-6 right-28 -z-10 select-none text-[11rem] leading-none text-white/[0.06] sm:right-52 sm:text-[14rem]`}
        >
          {player.jerseyNumber}
        </span>
      )}

      <div className="flex min-h-56 items-end sm:min-h-64">
        <div className="relative z-10 min-w-0 flex-1 self-center py-6 pl-5 pr-2 sm:py-8 sm:pl-8">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-amber-950 shadow-lg shadow-amber-500/20">
            <Star className="h-3 w-3 fill-amber-950" />
            Player of the Match
          </p>
          <h3 className={`${display.className} mt-3 text-4xl uppercase leading-[0.9] text-white drop-shadow sm:text-6xl`}>
            {nameEn || `${player.firstNameTh} ${player.lastNameTh}`}
          </h3>
          {nameEn && (
            <p className="mt-1 truncate text-sm font-semibold text-g15-100 sm:text-base">
              {player.firstNameTh} {player.lastNameTh}
            </p>
          )}
          <p className="mt-3 flex items-center gap-2 text-xs font-medium text-g15-200 sm:text-sm">
            <span className="rounded-full bg-white p-0.5">
              <TeamBadge team={team} size="sm" />
            </span>
            <span className="truncate">{team.name}</span>
            {player.jerseyNumber != null && <span className="flex-none text-amber-300">#{player.jerseyNumber}</span>}
          </p>
          {(goals > 0 || assists > 0) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {goals > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-white ring-1 ring-white/15">
                  <BallIcon className="h-3.5 w-3.5 text-amber-300" />
                  {goals} ประตู
                </span>
              )}
              {assists > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-white ring-1 ring-white/15">
                  <span className="text-[11px] font-black text-amber-300">A</span>
                  {assists} แอสซิสต์
                </span>
              )}
            </div>
          )}
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-amber-300 transition-transform group-hover:translate-x-1">
            ดูโปรไฟล์ <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>

        {/* รูปไดคัท — ชิดขอบล่าง มีแสงทองด้านหลัง */}
        <div className="relative h-56 w-36 flex-none self-end sm:h-72 sm:w-56">
          <div aria-hidden className="absolute inset-x-2 bottom-0 h-3/4 rounded-full bg-amber-400/25 blur-3xl" />
          {player.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={player.photoUrl}
              alt={`${player.firstNameTh} ${player.lastNameTh}`}
              className="absolute inset-0 h-full w-full object-contain object-bottom drop-shadow-2xl transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <UserRound className="absolute inset-x-0 bottom-6 mx-auto h-24 w-24 text-white/20" />
          )}
        </div>
      </div>
    </Link>
  );
}
