import { ExternalLink, FolderOpen, Images, Users, PlayCircle, Link2 } from "lucide-react";

// แหล่งที่มาของลิงก์ (ดูจากโดเมน) — ใช้เลือกไอคอน/สี/ป้ายของการ์ดอัลบั้ม
export function albumSource(url: string) {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {}
  if (host.includes("drive.google")) return { name: "Google Drive", icon: FolderOpen, tone: "from-emerald-500 via-sky-500 to-amber-400" };
  if (host.includes("photos.google") || host.includes("photos.app.goo.gl")) return { name: "Google Photos", icon: Images, tone: "from-red-400 via-amber-400 to-sky-500" };
  if (host.includes("facebook") || host.includes("fb.")) return { name: "Facebook", icon: Users, tone: "from-blue-600 to-blue-400" };
  if (host.includes("youtube") || host.includes("youtu.be")) return { name: "YouTube", icon: PlayCircle, tone: "from-red-600 to-red-400" };
  return { name: host || "ลิงก์", icon: Link2, tone: "from-g15-700 to-g15-400" };
}

export type GalleryAlbum = { id: number; title: string; url: string; matchLabel: string | null; dateLabel: string };

// การ์ดอัลบั้ม — กดทั้งการ์ดเปิดลิงก์ในแท็บใหม่
export function GalleryAlbumCard({ album, children }: { album: GalleryAlbum; children?: React.ReactNode }) {
  const src = albumSource(album.url);
  const Icon = src.icon;
  return (
    <div className="group min-w-0">
      <a
        href={album.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 items-center gap-3 rounded-2xl sm:gap-4 bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-g15-300"
      >
        <span className={`flex h-16 w-16 flex-none items-center justify-center rounded-2xl bg-linear-to-br ${src.tone} text-white shadow-md`}>
          <Icon className="h-8 w-8" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-base font-bold leading-snug text-g15-950">{album.title}</span>
          {album.matchLabel && <span className="mt-0.5 block truncate text-xs font-medium text-g15-600">{album.matchLabel}</span>}
          <span className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-400">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">{src.name}</span>
            {album.dateLabel}
          </span>
        </span>
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-g15-50 text-g15-600 transition-colors group-hover:bg-g15-600 group-hover:text-white">
          <ExternalLink className="h-4.5 w-4.5" />
        </span>
      </a>
      {children}
    </div>
  );
}
