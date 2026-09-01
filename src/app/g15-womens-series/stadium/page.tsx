import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatMatchDateTime, formatMatchDateShort } from "@/lib/g15";
import { REGION_STYLE, DEFAULT_REGION_STYLE } from "@/lib/g15-region";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { TeamBadge } from "@/components/g15/TeamBadge";
import { Reveal } from "@/components/g15/Reveal";
import { MapPin, Calendar, Trophy, Goal } from "lucide-react";

const BANGKOK_TZ = "Asia/Bangkok";

function bangkokDayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BANGKOK_TZ }).format(date);
}

export default async function G15StadiumPage() {
  const [user, matches] = await Promise.all([
    getCurrentUser(),
    prisma.g15Match.findMany({
      where: { venue: { not: null } },
      orderBy: [{ matchDate: "asc" }, { createdAt: "asc" }],
      include: { homeTeam: true, awayTeam: true },
    }),
  ]);

  // จัดกลุ่มตามชื่อสนาม (ตัดช่องว่างหัวท้าย) — ยังไม่มีข้อมูลสนามแบบเต็มรูปแบบ (ที่อยู่/ความจุ/รูปภาพ)
  // จึงอิงจากชื่อสนามที่กรอกไว้ในแต่ละแมทช์แทน แล้วเรียงสนามที่มีนัดแข่งเยอะสุดขึ้นก่อน
  const byVenue = new Map<string, typeof matches>();
  for (const m of matches) {
    const venue = m.venue?.trim();
    if (!venue) continue;
    if (!byVenue.has(venue)) byVenue.set(venue, []);
    byVenue.get(venue)!.push(m);
  }
  const venues = Array.from(byVenue.entries()).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="min-h-screen bg-slate-50">
      <G15Chrome user={user} />

      {/* ฮีโร่ไล่สีชุดเดียวกับหน้าอื่นๆ ของ G15 — เนื้อหาหลักลอยทับขอบล่างให้ภาษาภาพเป็นชุดเดียวกันทั้งเว็บ */}
      <section className="relative overflow-hidden bg-linear-to-br from-rose-950 via-rose-900 to-fuchsia-800 pb-20 pt-8 sm:pb-24">
        <div className="absolute inset-x-0 top-0 h-1.5 animate-shimmer-slide bg-linear-to-r from-amber-600 via-amber-200 via-50% to-amber-600 bg-size-[200%_100%]" />
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-rose-200">
            <MapPin className="h-3.5 w-3.5" />
            Stadium
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
            สนามแข่งขัน <span className="text-base font-normal text-rose-200">/ Stadium</span>
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-20">
        {venues.length === 0 ? (
          <div className="relative z-10 -mt-10 flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-xl shadow-rose-950/10 sm:-mt-14">
            <MapPin className="h-8 w-8 text-slate-400" />
            <p className="text-sm text-slate-500">ยังไม่มีข้อมูลสนามแข่งขัน</p>
            <p className="text-xs text-slate-400">No stadium information yet</p>
          </div>
        ) : (
          <div className="relative z-10 -mt-10 space-y-6 sm:-mt-14">
            {venues.map(([venue, venueMatches], venueIndex) => {
              const finished = venueMatches.filter((m) => m.status === "FINISHED" && m.homeScore != null && m.awayScore != null);
              const totalGoals = finished.reduce((s, m) => s + m.homeScore! + m.awayScore!, 0);

              // จัดกลุ่มนัดในสนามนี้ตามวัน (เวลาไทย) — สนามที่มีนัดข้ามหลายวัน (เช่น สนามพิจิตร สเตเดียม) จะได้อ่านง่ายขึ้น
              const byDay = new Map<string, typeof venueMatches>();
              const undated: typeof venueMatches = [];
              for (const m of venueMatches) {
                if (!m.matchDate) {
                  undated.push(m);
                  continue;
                }
                const key = bangkokDayKey(m.matchDate);
                if (!byDay.has(key)) byDay.set(key, []);
                byDay.get(key)!.push(m);
              }
              const dayKeys = Array.from(byDay.keys()).sort();

              return (
                <Reveal key={venue} delay={Math.min(venueIndex * 60, 300)}>
                <div
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="relative overflow-hidden bg-linear-to-br from-slate-900 via-slate-900 to-slate-800 px-5 py-5">
                    <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-500 via-amber-300 to-amber-500" />
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                        <MapPin className="h-5 w-5 text-amber-300" />
                      </div>
                      <h3 className="min-w-0 truncate text-base font-bold text-white">{venue}</h3>
                    </div>
                    <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/70">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {venueMatches.length} นัด / matches
                      </span>
                      {finished.length > 0 && (
                        <>
                          <span className="flex items-center gap-1">
                            <Trophy className="h-3.5 w-3.5" />
                            {finished.length} จบแล้ว / finished
                          </span>
                          <span className="flex items-center gap-1">
                            <Goal className="h-3.5 w-3.5" />
                            {totalGoals} ประตูรวม / goals
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {dayKeys.map((dayKey) => (
                    <div key={dayKey}>
                      <p className="border-t border-slate-100 bg-slate-50 px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {formatMatchDateShort(byDay.get(dayKey)![0].matchDate)}
                      </p>
                      <ul className="divide-y divide-slate-100">
                        {byDay.get(dayKey)!.map((match) => (
                          <VenueMatchRow key={match.id} match={match} />
                        ))}
                      </ul>
                    </div>
                  ))}

                  {undated.length > 0 && (
                    <div>
                      <p className="border-t border-slate-100 bg-slate-50 px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        TBD
                      </p>
                      <ul className="divide-y divide-slate-100">
                        {undated.map((match) => (
                          <VenueMatchRow key={match.id} match={match} />
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function VenueMatchRow({
  match,
}: {
  match: {
    id: number;
    round: string;
    matchDate: Date | null;
    status: string;
    homeScore: number | null;
    awayScore: number | null;
    homeTeam: { name: string; logoUrl: string | null; groupName: string | null };
    awayTeam: { name: string; logoUrl: string | null; groupName: string | null };
  };
}) {
  const isFinished = match.status === "FINISHED" && match.homeScore != null && match.awayScore != null;
  const style = REGION_STYLE[match.round] ?? DEFAULT_REGION_STYLE;
  return (
    <li>
      <Link
        href={`/g15-womens-series/matches/${match.id}`}
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className={`flex-none rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${style.bg}`}>
            {match.round}
          </span>
          <div className="flex items-center gap-2">
            <TeamBadge team={match.homeTeam} size="sm" />
            <span className="text-sm font-medium text-slate-900">{match.homeTeam.name}</span>
          </div>
          {isFinished ? (
            <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold tabular-nums text-white">
              {match.homeScore} - {match.awayScore}
            </span>
          ) : (
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-400">VS</span>
          )}
          <div className="flex items-center gap-2">
            <TeamBadge team={match.awayTeam} size="sm" />
            <span className="text-sm font-medium text-slate-900">{match.awayTeam.name}</span>
          </div>
        </div>
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <Calendar className="h-3.5 w-3.5" />
          {formatMatchDateTime(match.matchDate)}
        </span>
      </Link>
    </li>
  );
}
