import { ExternalLink, MonitorPlay, PlayCircle } from "lucide-react";
import { videoEmbed } from "@/lib/g15-video";

// วิดีโอ/ถ่ายทอดสดของนัด — YouTube / Facebook เล่นในหน้าได้เลย, ลิงก์อื่นเป็นปุ่มเปิดลิงก์
export function MatchVideo({ url, live }: { url: string; live: boolean }) {
  const embed = videoEmbed(url);
  const provider = embed?.provider === "youtube" ? "YouTube" : embed?.provider === "facebook" ? "Facebook" : null;

  return (
    <section id="match-video" className="mt-8 scroll-mt-28">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-red-50 text-red-600">
          <MonitorPlay className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-semibold text-slate-900">
          {live ? "ถ่ายทอดสด" : "วิดีโอการแข่งขัน"} <span className="font-normal text-slate-400">/ {live ? "Live stream" : "Match video"}</span>
        </h2>
        {live && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Live
          </span>
        )}
      </div>

      {embed ? (
        <div className="overflow-hidden rounded-2xl bg-slate-950 shadow-xl shadow-slate-900/20 ring-1 ring-slate-900/10">
          <div className="relative aspect-video w-full">
            <iframe
              src={embed.src}
              title={live ? "ถ่ายทอดสด" : "วิดีโอการแข่งขัน"}
              className="absolute inset-0 h-full w-full"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write"
              allowFullScreen
              loading="lazy"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 px-4 py-2.5">
            <span className="text-xs text-white/60">ดูผ่าน {provider} · กดเต็มจอที่มุมเครื่องเล่น</span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20"
            >
              เปิดใน {provider}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 rounded-2xl bg-linear-to-r from-red-600 to-red-500 p-5 text-white shadow-lg shadow-red-900/20 transition-transform hover:-translate-y-0.5"
        >
          <PlayCircle className="h-12 w-12 flex-none" />
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-black">{live ? "ดูถ่ายทอดสด" : "ดูวิดีโอการแข่งขัน"}</span>
            <span className="block truncate text-xs text-white/80">{url}</span>
          </span>
          <ExternalLink className="h-5 w-5 flex-none opacity-80 transition-transform group-hover:translate-x-0.5" />
        </a>
      )}
    </section>
  );
}
