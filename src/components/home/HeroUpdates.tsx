import Link from "next/link";
import Image from "next/image";
import { G15_IMAGE_URL } from "@/lib/brand";
import { formatMatchDateShort, formatMatchTimeShort } from "@/lib/g15";
import coachCentreLogo from "@/assets/sections/coach-centre-logo.png";
import type { G15Board, OpenSession } from "./DepartmentShowcases";
import styles from "./showcase.module.css";
import { ArrowUpRight } from "lucide-react";

const TZ = { timeZone: "Asia/Bangkok" } as const;

export type HeroNews = { id: number; title: string; imageUrl: string | null; date: Date } | null;

// การ์ด "อัปเดตล่าสุด" ในฮีโร่หน้าแรก: G15 (กำลังแข่ง / แชมป์ / นัดถัดไป / ผลล่าสุด) · รุ่นอบรมที่เปิดรับสมัคร · ข่าวล่าสุด
// พื้นขาวทึบ (ไม่ใช้กระจกฝ้า) อ่านง่ายบนทุกภาพพื้นหลัง
export function HeroUpdates({ board, session, news }: { board: G15Board; session: OpenSession | null; news: HeroNews }) {
  return (
    <aside aria-label="อัปเดตล่าสุด" className="overflow-hidden rounded-2xl bg-white text-slate-900 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.65)] ring-1 ring-black/5">
      <p className="px-4 pb-1 pt-3.5 text-xs font-semibold text-slate-500 sm:px-5 sm:pt-4">อัปเดตล่าสุด</p>
      <ul className="divide-y divide-slate-100">
        <G15Row board={board} />
        {session ? (
          <Row
            href={`/apply/${session.id}`}
            media={
              session.start ? (
                <span className="flex h-full w-full flex-col items-center justify-center bg-[#073c5e] text-white">
                  <span className="text-base font-semibold leading-none">{session.start.toLocaleDateString("th-TH", { ...TZ, day: "numeric" })}</span>
                  <span className="mt-0.5 text-[11px] leading-none">{session.start.toLocaleDateString("th-TH", { ...TZ, month: "short" })}</span>
                </span>
              ) : (
                <Image src={coachCentreLogo} alt="" className="h-auto w-9" />
              )
            }
            label={
              <>
                เปิดรับสมัครอบรม
                {session.daysLeft !== null && <span className={session.daysLeft <= 7 ? "text-red-700" : ""}> · ปิดรับในอีก {session.daysLeft} วัน</span>}
              </>
            }
            title={`${session.course} · ${session.name}`}
          />
        ) : (
          <Row href="/courses" media={<Image src={coachCentreLogo} alt="" className="h-auto w-9" />} label="หลักสูตรอบรมผู้ฝึกสอน" title="ใบอนุญาตผู้ฝึกสอน AFC ตั้งแต่ระดับ G ถึง PRO" />
        )}
        {news && (
          <Row
            href={`/news/${news.id}`}
            media={
              news.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={news.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center bg-slate-100 text-slate-700">
                  <span className="text-base font-semibold leading-none">{news.date.toLocaleDateString("th-TH", { ...TZ, day: "numeric" })}</span>
                  <span className="mt-0.5 text-[11px] leading-none">{news.date.toLocaleDateString("th-TH", { ...TZ, month: "short" })}</span>
                </span>
              )
            }
            label={`ข่าวประกาศ · ${news.date.toLocaleDateString("th-TH", { ...TZ, day: "numeric", month: "short", year: "2-digit" })}`}
            title={news.title}
          />
        )}
      </ul>
    </aside>
  );
}

function G15Row({ board }: { board: G15Board }) {
  const media = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={G15_IMAGE_URL} alt="" className="h-full w-full object-cover" />
  );
  if (board.mode === "none" || !board.home || !board.away) {
    return <Row href="/g15-womens-series" media={media} label="G15 Women's Series" title="ตาราง ผลการแข่งขัน และสถิติ" />;
  }
  const score = board.homeScore != null && board.awayScore != null ? `${board.homeScore}–${board.awayScore}` : null;
  const pens = board.homePenalty != null && board.awayPenalty != null ? ` (จุดโทษ ${board.homePenalty}–${board.awayPenalty})` : "";
  const label =
    board.mode === "live" ? (
      <span className="inline-flex items-center gap-1.5 text-red-700">
        <span className={`h-2 w-2 rounded-full bg-red-500 ${styles.pulse}`} />
        G15 · กำลังแข่ง
      </span>
    ) : board.mode === "champion" ? (
      "G15 · นัดชิงชนะเลิศ"
    ) : board.mode === "result" ? (
      `G15 · ผลล่าสุด · ${board.round}`
    ) : (
      `G15 · นัดถัดไป · ${formatMatchDateShort(board.date ?? null)} ${formatMatchTimeShort(board.date ?? null)}`.trim()
    );
  const title =
    board.mode === "champion" && board.champion
      ? `แชมป์: ${board.champion.name}`
      : board.mode !== "next" && score
        ? `${board.home.name} ${score} ${board.away.name}${pens}`
        : `${board.home.name} พบ ${board.away.name}`;
  return <Row href={`/g15-womens-series/matches/${board.id}`} media={media} label={label} title={title} />;
}

function Row({ href, media, label, title }: { href: string; media: React.ReactNode; label: React.ReactNode; title: string }) {
  return (
    <li>
      <Link href={href} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 sm:gap-3.5 sm:px-5 sm:py-3.5">
        <span className="flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-lg ring-1 ring-slate-200">{media}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11px] font-semibold text-slate-500">{label}</span>
          <span className="mt-0.5 line-clamp-2 text-[13px] font-semibold leading-snug sm:text-sm">{title}</span>
        </span>
        <ArrowUpRight className="h-4 w-4 flex-none text-slate-400 transition-colors group-hover:text-slate-900" />
      </Link>
    </li>
  );
}
