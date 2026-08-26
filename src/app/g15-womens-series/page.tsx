import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getStandings, formatMatchDateShort, formatMatchTimeShort } from "@/lib/g15";
import { REGION_STYLE, DEFAULT_REGION_STYLE, regionEn, groupTeamsByRegion, groupStandingsByRegion } from "@/lib/g15-region";
import { G15_IMAGE_URL } from "@/lib/brand";
import { G15Header } from "@/components/g15/G15Header";
import { G15Nav } from "@/components/g15/G15Nav";
import { TeamBadge } from "@/components/g15/TeamBadge";
import { StandingTable } from "@/components/g15/StandingTable";
import { MatchSpotlight } from "@/components/g15/MatchSpotlight";
import { Trophy, Calendar, MapPin, ChevronRight, Globe2, Award, Rocket, Users, CheckCircle2 } from "lucide-react";

const highlights = [
  {
    icon: Globe2,
    title: "ทีมเข้าร่วมทั่วประเทศ",
    titleEn: "Nationwide Teams",
    description: "เชื่อมนักฟุตบอลหญิงจากภาคเหนือ ใต้ กลาง และอีสาน ไว้ในเวทีเดียวกัน",
    descriptionEn: "Bringing together young female footballers from the North, South, Central, and Northeast.",
  },
  {
    icon: Award,
    title: "มาตรฐานระดับ FIFA",
    titleEn: "FIFA Standard",
    description: "จัดการแข่งขันภายใต้การสนับสนุนและกำกับดูแลจากผู้เชี่ยวชาญของ FIFA",
    descriptionEn: "Organised with support and oversight from FIFA development experts.",
  },
  {
    icon: Rocket,
    title: "เส้นทางสู่ความเป็นเลิศ",
    titleEn: "Path to Excellence",
    description: "ปูพื้นฐานและเก็บเกี่ยวประสบการณ์แข่งขันจริง สู่เส้นทางนักฟุตบอลอาชีพ",
    descriptionEn: "Building the foundations and match experience for a future in professional football.",
  },
];

export default async function G15WomensSeriesPage() {
  // หน้านี้เปิดให้ดูได้แบบสาธารณะไม่ต้องล็อกอิน — ต้องล็อกอินเฉพาะตอนจะ "จัดการข้อมูล" เท่านั้น
  const user = await getCurrentUser();

  const [teams, matches] = await Promise.all([
    prisma.g15Team.findMany({ orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
    prisma.g15Match.findMany({
      orderBy: [{ matchDate: "asc" }, { createdAt: "asc" }],
      include: { homeTeam: true, awayTeam: true },
    }),
  ]);

  const standingGroups = getStandings(teams, matches);
  const { regionOrder } = groupTeamsByRegion(teams);
  const { regionOrder: standingsRegionOrder, byRegion: standingsByRegion } = groupStandingsByRegion(standingGroups);

  const finishedMatches = matches.filter((m) => m.status === "FINISHED");

  // ผลการแข่งขันล่าสุด — ทุกนัดในระบบตอนนี้แข่งจบไปแล้ว (ไม่มีนัดที่ยังไม่ถึงวันแข่ง) จึงโชว์ผลล่าสุดแทน "นัดถัดไป"
  const recentResults = [...finishedMatches]
    .sort((a, b) => (b.matchDate?.getTime() ?? 0) - (a.matchDate?.getTime() ?? 0))
    .slice(0, 5);

  // การ์ดพิเศษด้านบน — นัดถัดไปที่ใกล้ที่สุด ถ้าไม่มีนัดที่ยังไม่ถึงวันแข่งเลย ใช้ผลล่าสุดแทน
  const now = new Date();
  const nextMatch = matches
    .filter((m) => m.status !== "FINISHED" && m.matchDate && m.matchDate.getTime() > now.getTime())
    .sort((a, b) => a.matchDate!.getTime() - b.matchDate!.getTime())[0];
  const spotlightMatch = nextMatch ?? recentResults[0] ?? null;
  const spotlightIsUpcoming = !!nextMatch;

  return (
    <div className="min-h-screen bg-slate-50">
      <G15Header user={user} />
      <G15Nav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-rose-950 via-rose-900 to-fuchsia-800">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-amber-600 via-amber-300 to-amber-600" />

        {/* จุดไฟหลายชั้นเพิ่มมิติความหรูหรา */}
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-rose-400/25 blur-3xl" />
        <div className="absolute -right-20 top-1/4 h-112 w-md rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />

        {/* ลายจุดแบบละเอียด เพิ่มพื้นผิวให้พื้นหลังไม่โล่งจนเกินไป */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* โลโก้ถ้วยรางวัลจางๆ เป็นลายน้ำด้านหลัง เพิ่มความยิ่งใหญ่ */}
        <Trophy className="pointer-events-none absolute -right-10 -top-10 h-72 w-72 rotate-12 text-white/4" />

        <div className="relative mx-auto max-w-4xl px-6 pb-28 pt-16 text-center sm:pb-32 sm:pt-20">
          <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-300 ring-1 ring-amber-400/30">
            <Trophy className="h-3.5 w-3.5" />
            FA Thailand
          </div>

          <div className="relative mx-auto mt-6 flex h-32 w-32 items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-white/10 blur-xl" />
            <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl bg-white/10 p-3 shadow-2xl ring-1 ring-white/25">
              <Image
                src={G15_IMAGE_URL}
                alt="G15 Women's Football Series"
                width={128}
                height={128}
                className="h-full w-full object-contain"
                priority
              />
            </div>
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-5xl">
            G15 Women&apos;s Football Series 2026
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-semibold text-amber-200">
            เปิดรับสมัครทีมฟุตบอลหญิง รุ่นอายุไม่เกิน 15 ปี จากทั่วประเทศ เข้าร่วมการแข่งขัน
          </p>
          <p className="mx-auto mt-1 max-w-2xl text-sm font-medium text-amber-200/70">
            Open call for U15 women&apos;s football teams nationwide
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-rose-100">
            เวทีการแข่งขันที่เปิดโอกาสให้น้องๆ นักกีฬาฟุตบอลหญิงอายุไม่เกิน 15 ปี ได้แสดงศักยภาพ พัฒนาฝีเท้า
            และเก็บเกี่ยวประสบการณ์การแข่งขันอย่างเต็มที่ ภายใต้การสนับสนุนและการกำกับดูแลจากผู้เชี่ยวชาญของ FIFA
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-rose-100/70">
            A tournament for U15 women footballers to showcase their skills, develop as players, and gain real
            match experience, supported and overseen by FIFA experts.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-20">
        {/* จุดเด่นของรายการ — ลอยทับรอยต่อ hero กับพื้นหลัง */}
        <div className="relative z-10 -mt-16 grid grid-cols-1 gap-6 sm:-mt-20 sm:grid-cols-3">
          {highlights.map(({ icon: Icon, title, titleEn, description, descriptionEn }) => (
            <div
              key={title}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-rose-950/10 transition-all hover:-translate-y-0.5 hover:shadow-2xl"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="text-xs font-medium text-rose-500">{titleEn}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">{description}</p>
                <p className="mt-1 text-xs text-slate-400">{descriptionEn}</p>
              </div>
            </div>
          ))}
        </div>

        {/* แถบสถิติจริงในระบบ */}
        <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-slate-200 shadow-sm ring-1 ring-black/5 sm:grid-cols-4">
          {[
            { label: "ทีมเข้าร่วม", en: "Teams", value: teams.length, icon: Users, color: "bg-rose-50 text-rose-600" },
            {
              label: "ภาคทั่วประเทศ",
              en: "Regions",
              value: regionOrder.length,
              icon: MapPin,
              color: "bg-fuchsia-50 text-fuchsia-600",
            },
            {
              label: "นัดการแข่งขัน",
              en: "Matches",
              value: matches.length,
              icon: Calendar,
              color: "bg-amber-50 text-amber-600",
            },
            {
              label: "นัดที่แข่งจบแล้ว",
              en: "Finished",
              value: finishedMatches.length,
              icon: CheckCircle2,
              color: "bg-emerald-50 text-emerald-600",
            },
          ].map((s) => (
            <div key={s.label} className="bg-white px-4 py-6 text-center sm:py-7">
              <div className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon className="h-4.5 w-4.5" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {s.label} <span className="text-slate-400">/ {s.en}</span>
              </p>
            </div>
          ))}
        </div>

        {spotlightMatch && (
          <div className="mt-8">
            <MatchSpotlight match={spotlightMatch} isUpcoming={spotlightIsUpcoming} />
          </div>
        )}

        {teams.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Trophy className="h-8 w-8 text-slate-400" />
            <p className="font-medium text-slate-600">กำหนดการและรายละเอียดการแข่งขัน</p>
            <p className="text-sm text-slate-500">
              อยู่ระหว่างการพัฒนา เร็วๆ นี้จะมีตารางแข่งขันและข้อมูลเพิ่มเติม
            </p>
            <p className="text-xs text-slate-400">Schedule and details coming soon</p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* ผลการแข่งขันล่าสุด */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">ผลการแข่งขันล่าสุด</h2>
                  <p className="text-xs text-slate-400">Latest Results</p>
                </div>
                <Link
                  href="/g15-womens-series/matches"
                  className="flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700"
                >
                  ดูทั้งหมด / View all
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {recentResults.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-400">
                  ยังไม่มีผลการแข่งขัน
                </p>
              ) : (
                <div className="space-y-3">
                  {recentResults.map((match) => {
                    const style = REGION_STYLE[match.round] ?? DEFAULT_REGION_STYLE;
                    return (
                      <div key={match.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-12 flex-none text-xs">
                            <p className="font-bold text-slate-900">{formatMatchDateShort(match.matchDate)}</p>
                            <p className="text-slate-400">{formatMatchTimeShort(match.matchDate)}</p>
                          </div>
                          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                            <span className="min-w-0 truncate text-sm font-semibold text-slate-800">
                              {match.homeTeam.name}
                            </span>
                            <TeamBadge team={match.homeTeam} size="sm" />
                          </div>
                          <div className="flex flex-none flex-col items-center gap-1 px-1">
                            <span className="text-base font-extrabold tabular-nums text-slate-900">
                              {match.homeScore}-{match.awayScore}
                            </span>
                            <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white">
                              Full time
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <TeamBadge team={match.awayTeam} size="sm" />
                            <span className="min-w-0 truncate text-sm font-semibold text-slate-800">
                              {match.awayTeam.name}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2.5 flex items-center gap-1.5 border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                          <span className={`flex-none rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white ${style.bg}`}>
                            {match.round}
                          </span>
                          {match.venue && <span className="truncate">• {match.venue}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ตารางคะแนน */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">ตารางคะแนน</h2>
                  <p className="text-xs text-slate-400">Current Standings</p>
                </div>
                <Link
                  href="/g15-womens-series/standings"
                  className="flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700"
                >
                  ดูทั้งหมด / View all
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {standingsRegionOrder.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-400">
                  ยังไม่มีตารางคะแนน
                </p>
              ) : (
                (() => {
                  const previewRegion = standingsRegionOrder[0];
                  const style = REGION_STYLE[previewRegion] ?? DEFAULT_REGION_STYLE;
                  const groupMap = standingsByRegion.get(previewRegion)!;
                  const letters = Array.from(groupMap.keys()).sort();
                  return (
                    <div
                      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ${style.ring}`}
                    >
                      <div className={`flex items-center gap-2.5 px-5 py-3 ${style.bg}`}>
                        <MapPin className="h-4 w-4 text-white" />
                        <h3 className="font-bold text-white">
                          {previewRegion} <span className="font-normal text-white/70">/ {regionEn(previewRegion)}</span>
                        </h3>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {letters.map((letter) => (
                          <div key={letter}>
                            <p className={`px-5 pt-3 text-xs font-bold ${style.text}`}>กลุ่ม {letter}</p>
                            <StandingTable group={groupMap.get(letter)!} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
