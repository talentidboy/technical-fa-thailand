import { ExternalLink, FolderOpen, Images, Users, PlayCircle, Link2, Camera } from "lucide-react";

// แหล่งที่มาของลิงก์ (ดูจากโดเมน) — ใช้เลือกไอคอน/สี/ป้ายของการ์ดอัลบั้ม
export function albumSource(url: string) {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {}
  if (host.includes("drive.google")) return { name: "Google Drive", icon: FolderOpen, tone: "from-emerald-500 via-sky-500 to-amber-400" };
  if (host.includes("photos.google") || host.includes("photos.app.goo.gl")) return { name: "Google Photos", icon: Images, tone: "from-red-400 via-amber-400 to-sky-500" };
  if (host.includes("flickr") || host.includes("flic.kr")) return { name: "Flickr", icon: Camera, tone: "from-pink-500 via-g15-600 to-sky-500" };
  if (host.includes("facebook") || host.includes("fb.")) return { name: "Facebook", icon: Users, tone: "from-blue-600 to-blue-400" };
  if (host.includes("youtube") || host.includes("youtu.be")) return { name: "YouTube", icon: PlayCircle, tone: "from-red-600 to-red-400" };
  return { name: host || "ลิงก์", icon: Link2, tone: "from-g15-700 to-g15-400" };
}

export type GalleryAlbum = { id: number; title: string; url: string; coverUrl: string | null; matchLabel: string | null; dateLabel: string };

// การ์ดอัลบั้มแบบมีรูปปก (16:9) — ชื่อหัวข้อทับบนภาพด้านล่าง กดทั้งการ์ดเปิดลิงก์ในแท็บใหม่
// ไม่มีรูปปก → พื้นไล่สีตามแหล่งที่มา + ไอคอนใหญ่จางๆ
export function GalleryAlbumCard({ album, children }: { album: GalleryAlbum; children?: React.ReactNode }) {
  const src = albumSource(album.url);
  const Icon = src.icon;
  return (
    <div className="group min-w-0">
      <a
        href={album.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative isolate block aspect-video overflow-hidden rounded-3xl bg-g15-950 shadow-lg shadow-g15-950/15 ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-g15-950/25"
      >
        {album.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={album.coverUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className={`absolute inset-0 -z-10 bg-linear-to-br ${src.tone}`}>
            <Icon className="absolute -right-6 -top-6 h-48 w-48 text-white/15" />
          </div>
        )}
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-g15-950/95 via-g15-950/40 to-transparent" />

        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
          <Icon className="h-3.5 w-3.5" />
          {src.name}
        </span>
        <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-g15-700 shadow transition-colors group-hover:bg-amber-400 group-hover:text-amber-950">
          <ExternalLink className="h-4 w-4" />
        </span>

        <span className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          {album.matchLabel && <span className="mb-1 block truncate text-[11px] font-bold uppercase tracking-wide text-amber-300">{album.matchLabel}</span>}
          <span className="line-clamp-2 text-lg font-extrabold leading-snug text-white drop-shadow sm:text-xl">{album.title}</span>
          <span className="mt-1 block text-xs text-white/60">{album.dateLabel}</span>
        </span>
      </a>
      {children}
    </div>
  );
}
