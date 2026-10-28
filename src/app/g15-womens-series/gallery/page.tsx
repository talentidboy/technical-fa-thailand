import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatMatchDateShort } from "@/lib/g15";
import { parseStage, matchdayMap } from "@/lib/g15-stage";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { HeroArt } from "@/components/g15/HeroArt";
import { GalleryAlbumCard } from "@/components/g15/GalleryAlbumCard";
import { GalleryLinkManager } from "@/components/g15/GalleryLinkManager";
import { saveGalleryLink, deleteGalleryLink } from "../manage/actions";
import { Images, Camera } from "lucide-react";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "แกลเลอรี — G15 Women's Football Series", description: "อัลบั้มภาพการแข่งขัน G15 Women's Football Series 2026", path: "/g15-womens-series/gallery" });

// แกลเลอรี = รายการอัลบั้ม (หัวข้อ + ลิงก์ เช่น Google Drive) ล่าสุดก่อน · ไม่แยกรอบ (รวมทุกอัลบั้มในหน้าเดียว)
// แอดมินเพิ่ม/แก้/ลบได้จากหน้านี้ · stage ใน URL ใช้แค่ให้เมนูด้านบนพารอบเดิมไปหน้าอื่นต่อ
export default async function G15GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const stage = parseStage((await searchParams).stage);
  const [user, links, matches] = await Promise.all([
    getCurrentUser(),
    prisma.g15GalleryLink.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }] }),
    prisma.g15Match.findMany({
      orderBy: [{ matchDate: "asc" }, { id: "asc" }],
      include: { homeTeam: true, awayTeam: true },
    }),
  ]);
  const canManage = user?.role === "ADMIN" || user?.role === "STAFF";
  const matchdays = matchdayMap(matches);
  const matchById = new Map(matches.map((m) => [m.id, m]));
  const matchLabel = (m: (typeof matches)[number]) =>
    `${m.stage === "REGIONAL" ? "รอบภูมิภาค · " : ""}${matchdays.has(m.id) ? `นัดที่ ${matchdays.get(m.id)} · ` : ""}${m.round} · ${m.homeTeam.name} vs ${m.awayTeam.name}`;
  const albums = links.map((l) => {
    const m = l.matchId != null ? matchById.get(l.matchId) : undefined;
    return {
      id: l.id,
      title: l.title,
      url: l.url,
      coverUrl: l.coverUrl,
      matchId: l.matchId,
      matchLabel: m ? matchLabel(m) : null,
      dateLabel: formatMatchDateShort(l.createdAt),
    };
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <G15Chrome user={user} stage={stage} />

      <section className="relative isolate overflow-hidden bg-linear-to-br from-g15-950 via-g15-800 to-g15-600 pb-20 pt-8 sm:pb-24">
        <div className="absolute inset-x-0 top-0 h-1.5 animate-shimmer-slide bg-linear-to-r from-amber-600 via-amber-200 via-50% to-amber-600 bg-size-[200%_100%]" />
        <HeroArt />
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-g15-200">
            <Images className="h-3.5 w-3.5" />
            Gallery
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">แกลเลอรี</h1>
          <p className="mt-1 text-sm text-g15-200">อัลบั้มภาพบรรยากาศการแข่งขัน — กดเพื่อเปิดดูภาพทั้งหมด</p>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-10 max-w-5xl px-4 pb-24 sm:-mt-14 sm:px-6">
        {canManage ? (
          <GalleryLinkManager
            stage={stage}
            albums={albums}
            matches={[...matches].reverse().map((m) => ({ id: m.id, label: matchLabel(m) }))}
            saveAction={saveGalleryLink}
            deleteAction={deleteGalleryLink}
          />
        ) : albums.length === 0 ? (
          <div className="rounded-3xl bg-white px-6 py-12 text-center shadow-xl shadow-g15-950/10 ring-1 ring-slate-200">
            <Camera className="mx-auto h-10 w-10 text-g15-300" />
            <p className="mt-3 text-sm text-slate-500">ยังไม่มีอัลบั้มภาพ — ติดตามภาพบรรยากาศการแข่งขันได้เร็วๆ นี้</p>
            <p className="mt-0.5 text-xs text-slate-400">No albums yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {albums.map((a) => (
              <GalleryAlbumCard key={a.id} album={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
