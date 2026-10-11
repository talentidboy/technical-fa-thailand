import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatMatchDateTime } from "@/lib/g15";
import { parseStage, stageInfo, matchdayMap } from "@/lib/g15-stage";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { HeroArt } from "@/components/g15/HeroArt";
import { StageSwitcher } from "@/components/g15/StageSwitcher";
import { TeamBadge } from "@/components/g15/TeamBadge";
import { GalleryGrid, type GalleryPhoto } from "@/components/g15/GalleryGrid";
import { GalleryUploader } from "@/components/g15/GalleryUploader";
import { uploadGalleryPhoto, deleteGalleryPhoto } from "../manage/actions";
import { Bebas_Neue } from "next/font/google";
import { Images, Camera, ArrowRight } from "lucide-react";

const display = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap" });

// แกลเลอรีภาพบรรยากาศ — จัดกลุ่มตามนัด (นัดล่าสุดก่อน) + ภาพทั่วไป · แอดมินอัปโหลด/ลบได้จากหน้านี้เลย
export default async function G15GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const stage = parseStage((await searchParams).stage);
  const [user, photos, matches] = await Promise.all([
    getCurrentUser(),
    prisma.g15Photo.findMany({ where: { stage }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] }),
    prisma.g15Match.findMany({
      where: { stage },
      orderBy: [{ matchDate: "asc" }, { id: "asc" }],
      include: { homeTeam: true, awayTeam: true },
    }),
  ]);
  const canManage = user?.role === "ADMIN" || user?.role === "STAFF";
  const matchdays = matchdayMap(matches);
  const matchLabel = (m: (typeof matches)[number]) =>
    `${matchdays.has(m.id) ? `นัดที่ ${matchdays.get(m.id)} · ` : ""}${m.round} · ${m.homeTeam.name} vs ${m.awayTeam.name}`;

  // กลุ่มตามนัด เรียงนัดล่าสุดก่อน แล้วต่อด้วยภาพทั่วไป
  const byMatch = new Map<number | null, typeof photos>();
  for (const p of photos) {
    const k = p.matchId ?? null;
    if (!byMatch.has(k)) byMatch.set(k, []);
    byMatch.get(k)!.push(p);
  }
  const matchById = new Map(matches.map((m) => [m.id, m]));
  const groups = [...byMatch.entries()]
    .map(([id, ps]) => ({ match: id != null ? (matchById.get(id) ?? null) : null, photos: ps }))
    .sort((a, b) => {
      if (!a.match) return 1;
      if (!b.match) return -1;
      return (b.match.matchDate?.getTime() ?? 0) - (a.match.matchDate?.getTime() ?? 0);
    });
  const toGrid = (ps: typeof photos, label: string | null): GalleryPhoto[] =>
    ps.map((p) => ({ id: p.id, url: p.url, thumbUrl: p.thumbUrl, width: p.width, height: p.height, caption: p.caption, label }));

  return (
    <div className="min-h-screen bg-slate-50">
      <G15Chrome user={user} stage={stage} />

      <section className="relative isolate overflow-hidden bg-linear-to-br from-g15-950 via-g15-800 to-g15-600 pb-20 pt-8 sm:pb-24">
        <div className="absolute inset-x-0 top-0 h-1.5 animate-shimmer-slide bg-linear-to-r from-amber-600 via-amber-200 via-50% to-amber-600 bg-size-[200%_100%]" />
        <HeroArt />
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-g15-200">
            <Images className="h-3.5 w-3.5" />
            Gallery
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
            แกลเลอรี <span className="text-base font-normal text-g15-200">/ {stageInfo(stage).label}</span>
          </h1>
          <StageSwitcher stage={stage} basePath="/g15-womens-series/gallery" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-4 pb-24 sm:px-6">
        <div className={canManage || photos.length === 0 ? "relative z-10 -mt-10 sm:-mt-14" : "pt-2"}>
          {canManage ? (
            <GalleryUploader stage={stage} matches={[...matches].reverse().map((m) => ({ id: m.id, label: matchLabel(m) }))} action={uploadGalleryPhoto} />
          ) : (
            photos.length === 0 && (
              <div className="rounded-3xl bg-white px-6 py-12 text-center shadow-xl shadow-g15-950/10 ring-1 ring-slate-200">
                <Camera className="mx-auto h-10 w-10 text-g15-300" />
                <p className="mt-3 text-sm text-slate-500">ยังไม่มีภาพในแกลเลอรี — ติดตามภาพบรรยากาศการแข่งขันได้เร็วๆ นี้</p>
                <p className="mt-0.5 text-xs text-slate-400">No photos yet</p>
              </div>
            )
          )}
        </div>

        {groups.map(({ match, photos: ps }) => (
          <section key={match?.id ?? "general"}>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              {match ? (
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-g15-500">
                    {matchdays.has(match.id) ? `นัดที่ ${matchdays.get(match.id)} · ` : ""}
                    {match.round} · {formatMatchDateTime(match.matchDate)}
                  </p>
                  <h2 className="mt-1 flex flex-wrap items-center gap-2 text-lg font-extrabold text-g15-950 sm:text-xl">
                    <TeamBadge team={match.homeTeam} size="sm" />
                    {match.homeTeam.name}
                    {match.homeScore != null && match.awayScore != null ? (
                      <span className={`${display.className} rounded-lg bg-g15-900 px-2 pt-0.5 text-xl leading-tight text-white`}>
                        {match.homeScore}:{match.awayScore}
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-slate-400">vs</span>
                    )}
                    {match.awayTeam.name}
                    <TeamBadge team={match.awayTeam} size="sm" />
                  </h2>
                </div>
              ) : (
                <h2 className={`${display.className} text-3xl uppercase leading-none text-g15-900`}>
                  Moments <span className="font-sans text-sm font-semibold normal-case text-slate-400">/ ภาพบรรยากาศ</span>
                </h2>
              )}
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{ps.length} รูป</span>
                {match && (
                  <Link href={`/g15-womens-series/matches/${match.id}`} className="inline-flex items-center gap-1 font-semibold text-g15-600 hover:underline">
                    ดูรายละเอียดนัด <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
            <GalleryGrid photos={toGrid(ps, match ? matchLabel(match) : null)} deleteAction={canManage ? deleteGalleryPhoto : undefined} />
          </section>
        ))}
      </div>
    </div>
  );
}
