import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatMatchDateTime } from "@/lib/g15";
import { REGION_STYLE, DEFAULT_REGION_STYLE } from "@/lib/g15-region";
import { G15Header } from "@/components/g15/G15Header";
import { G15Nav } from "@/components/g15/G15Nav";
import { TeamBadge } from "@/components/g15/TeamBadge";
import { MapPin, Calendar } from "lucide-react";

export default async function G15StadiumPage() {
  const [user, matches] = await Promise.all([
    getCurrentUser(),
    prisma.g15Match.findMany({
      where: { venue: { not: null } },
      orderBy: [{ matchDate: "desc" }, { createdAt: "desc" }],
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
      <G15Header user={user} />
      <G15Nav />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">สนามแข่งขัน</h1>
          <p className="text-sm text-slate-400">Stadium</p>
        </div>

        {venues.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <MapPin className="h-8 w-8 text-slate-400" />
            <p className="text-sm text-slate-500">ยังไม่มีข้อมูลสนามแข่งขัน</p>
            <p className="text-xs text-slate-400">No stadium information yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {venues.map(([venue, venueMatches]) => (
              <div key={venue} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2.5 bg-slate-900 px-5 py-3.5">
                  <MapPin className="h-4 w-4 flex-none text-amber-300" />
                  <h3 className="min-w-0 truncate font-bold text-white">{venue}</h3>
                  <span className="ml-auto flex-none text-xs font-medium text-white/70">
                    {venueMatches.length} นัด / matches
                  </span>
                </div>
                <ul className="divide-y divide-slate-100">
                  {venueMatches.map((match) => {
                    const isFinished =
                      match.status === "FINISHED" && match.homeScore != null && match.awayScore != null;
                    const style = REGION_STYLE[match.round] ?? DEFAULT_REGION_STYLE;
                    return (
                      <li key={match.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`flex-none rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${style.bg}`}>
                            {match.round}
                          </span>
                          <div className="flex items-center gap-2">
                            <TeamBadge team={match.homeTeam} size="sm" />
                            <span className="text-sm font-medium text-slate-900">{match.homeTeam.name}</span>
                          </div>
                          {isFinished ? (
                            <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
                              {match.homeScore} - {match.awayScore}
                            </span>
                          ) : (
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-400">
                              VS
                            </span>
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
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
