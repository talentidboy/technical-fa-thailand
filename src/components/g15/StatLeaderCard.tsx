"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowRight, UserRound, X } from "lucide-react";
import { TeamBadge } from "./TeamBadge";

export type StatLeaderRow = {
  key: string;
  playerId: number | null;
  nameTh: string;
  nameEn: string | null;
  photoUrl: string | null;
  team: { name: string; logoUrl: string | null; groupName: string | null };
  value: number;
  // ใช้กับการ์ดสถิติทีม: ลิงก์ไปหน้าทีม + ข้อความรองใต้ชื่อ (เช่น ภาค/กลุ่ม)
  href?: string;
  subtitle?: string;
};

const PREVIEW = 4;

// อันดับแบบเท่ากันได้ที่เดียวกัน (1, 2, 2, 4) — คนคะแนนเท่ากันได้อันดับเดียวกัน
function withRanks(rows: StatLeaderRow[]) {
  let rank = 0;
  return rows.map((r, i) => {
    if (i === 0 || r.value !== rows[i - 1].value) rank = i + 1;
    return { ...r, rank };
  });
}

function RankBadge({ rank, solid }: { rank: number; solid: boolean }) {
  return (
    <span
      className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-black tabular-nums ${
        solid ? "bg-g15-600 text-white shadow-md shadow-g15-600/30" : "bg-white text-slate-500 ring-1 ring-slate-300"
      }`}
    >
      {rank}
    </span>
  );
}

function PlayerLink({
  playerId,
  href,
  children,
  className,
}: {
  playerId: number | null;
  href?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const to = href ?? (playerId != null ? `/g15-womens-series/players/${playerId}` : null);
  return to ? (
    <Link href={to} className={className}>
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
}

// การ์ดอันดับสถิติรายบุคคล — แบนเนอร์อันดับ 1 (ชื่อใหญ่ + รูปบนฉากสนาม) แล้วตามด้วยตารางอันดับถัดไป กด "ดูทั้งหมด" เพื่อขยาย
export function StatLeaderCard({
  rows,
  unit,
  unitTh,
  displayFont,
  kind = "player",
  title,
}: {
  rows: StatLeaderRow[];
  unit: string; // เช่น "Goals"
  unitTh: string; // เช่น "ประตู"
  displayFont: string; // className ของฟอนต์ตัวแคบสูง (โหลดจากหน้า server)
  // team = แบนเนอร์ใช้โลโก้ทีมแทนรูปนักกีฬา และชื่อทีม (ภาษาไทย) ใช้ฟอนต์ไทยตัวหนาแทนฟอนต์แคบสูงที่ไม่มีอักษรไทย
  kind?: "player" | "team";
  // หัวข้อของป็อปอัพ "ดูทั้งหมด" เช่น "Top Scorers / ดาวซัลโว"
  title?: string;
}) {
  const isTeam = kind === "team";
  // "ดูทั้งหมด" เปิดเป็นป็อปอัพ (เลื่อนดูในป็อปอัพ) แทนการขยายการ์ด — การ์ดในหน้าจะได้สูงเท่าเดิมเสมอ
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const ranked = withRanks(rows);
  const [leader, ...rest] = ranked;
  const visible = rest.slice(0, PREVIEW);

  // ยังไม่มีข้อมูล — การ์ดสั้นเท่าแบนเนอร์อันดับ 1 บนฉากสนาม (ไม่ยืดเป็นกล่องว่างสูงเท่าการ์ดข้างๆ)
  if (!leader) {
    return (
      <div className="relative h-56 overflow-hidden rounded-2xl shadow-sm ring-1 ring-slate-200 sm:h-60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/g15/player-profile-banner-v2-sm.webp"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-[35%_50%]"
        />
        <div aria-hidden className="absolute inset-0 bg-linear-to-r from-white/90 via-white/60 to-white/10" />
        <div className="relative flex h-full flex-col justify-center p-6">
          <p className={`${displayFont} text-3xl uppercase leading-none text-g15-900/40`}>Awaiting data</p>
          <p className="mt-1.5 text-sm font-semibold text-slate-500">ยังไม่มีข้อมูล{unitTh}</p>
          <p className="mt-0.5 text-xs text-slate-400">จะแสดงอันดับเมื่อมีการบันทึกในเกม</p>
        </div>
      </div>
    );
  }

  const rankRow = (r: (typeof ranked)[number]) => (
              <li key={r.key}>
                <PlayerLink playerId={r.playerId} href={r.href} className="flex items-center gap-3 py-2.5 transition-colors hover:bg-slate-50">
                  <RankBadge rank={r.rank} solid={r.rank === 1} />
                  {isTeam ? (
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white ring-1 ring-slate-200">
                      <TeamBadge team={r.team} size="md" />
                    </span>
                  ) : (
                  <span className="relative h-11 w-11 flex-none overflow-hidden rounded-full bg-linear-to-b from-g15-200 to-g15-500">
                    {r.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.photoUrl} alt="" loading="lazy" className="h-[125%] w-full object-cover object-top" />
                    ) : (
                      <UserRound className="absolute bottom-0 left-1/2 h-4/5 w-4/5 -translate-x-1/2 text-white/70" />
                    )}
                  </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold uppercase text-slate-900">{r.nameEn || r.nameTh}</span>
                    {isTeam ? (
                      r.subtitle && <span className="block truncate text-[11px] font-semibold text-slate-400">{r.subtitle}</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        <TeamBadge team={r.team} size="sm" />
                        <span className="truncate">{r.team.name}</span>
                      </span>
                    )}
                  </span>
                  <span className={`${displayFont} w-8 flex-none text-right text-2xl text-slate-900`}>{r.value}</span>
                </PlayerLink>
              </li>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      {/* แบนเนอร์อันดับ 1 */}
      <PlayerLink playerId={leader.playerId} href={leader.href} className="group relative block h-56 overflow-hidden sm:h-60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/g15/player-profile-banner-v2-sm.webp"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-[35%_50%]"
        />
        <div aria-hidden className="absolute inset-0 bg-linear-to-r from-white/85 via-white/50 to-transparent" />
        {isTeam ? (
          <span className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center justify-center">
            <span aria-hidden className="absolute h-44 w-44 rounded-full bg-white/50 blur-2xl" />
            <span className="relative rounded-full bg-white p-2 shadow-2xl shadow-g15-950/40 ring-4 ring-white/60 transition-transform duration-500 group-hover:scale-105">
              <TeamBadge team={leader.team} size="xl" />
            </span>
          </span>
        ) : leader.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={leader.photoUrl}
            alt={leader.nameTh}
            className="absolute bottom-0 right-0 h-[92%] w-[52%] object-contain object-bottom drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <UserRound className="absolute -bottom-3 right-4 h-44 w-44 text-white/60" strokeWidth={1.2} />
        )}
        <div className={`relative flex h-full flex-col justify-between p-5 ${isTeam ? "max-w-[56%]" : "max-w-[58%]"}`}>
          <RankBadge rank={1} solid />
          <div>
            {isTeam ? (
              <p className="line-clamp-3 text-lg font-black leading-tight text-g15-900">{leader.nameTh}</p>
            ) : (
              <p className={`${displayFont} line-clamp-2 text-[2.1rem] uppercase leading-[0.9] text-g15-900`}>
                {leader.nameEn || leader.nameTh}
              </p>
            )}
            {!isTeam && leader.nameEn && <p className="mt-1 truncate text-xs font-semibold text-g15-700/70">{leader.nameTh}</p>}
            {isTeam ? (
              leader.subtitle && (
                <p className="mt-1.5 truncate text-[11px] font-bold uppercase tracking-wide text-slate-500">{leader.subtitle}</p>
              )
            ) : (
              <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <TeamBadge team={leader.team} size="sm" />
                <span className="truncate">{leader.team.name}</span>
              </p>
            )}
            <p className="mt-3 flex items-baseline gap-1.5">
              <span className={`${displayFont} text-4xl leading-none text-g15-700`}>{leader.value}</span>
              <span className="text-sm font-bold text-slate-700">{unit}</span>
              <span className="text-xs text-slate-400">/ {unitTh}</span>
            </p>
          </div>
        </div>
      </PlayerLink>

      {/* ตารางอันดับถัดไป */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          <span className="w-8 text-center">Rank</span>
          <span className="flex-1">{isTeam ? "Team" : "Player"}</span>
          <span>{unit}</span>
        </div>
        {visible.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">มีผู้นำเพียงคนเดียว</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visible.map((r) => rankRow(r))}
          </ul>
        )}
        {rest.length > PREVIEW && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-auto flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-g15-600 py-2.5 text-xs font-bold uppercase tracking-wide text-g15-700 transition-colors hover:bg-g15-600 hover:text-white"
          >
            ดูทั้งหมด ({ranked.length}) / View all <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ป็อปอัพรายชื่อเต็ม — โทรศัพท์เป็นแผ่นเลื่อนขึ้นจากด้านล่าง, จอใหญ่อยู่กลางจอ; รายชื่อเลื่อนภายในป็อปอัพ
          render ผ่าน portal ไปที่ body: การ์ดอยู่ใน Reveal ที่มี transform ซึ่งจะทำให้ position:fixed ยึดกับการ์ดแทนหน้าจอ */}
      {open &&
        createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title ?? unit}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="relative flex-none overflow-hidden bg-linear-to-r from-g15-900 via-g15-700 to-g15-600 px-5 py-4 text-white">
              <p className={`${displayFont} pr-10 text-3xl uppercase leading-none`}>{title ?? unit}</p>
              <p className="mt-1 text-xs text-g15-200">
                ทั้งหมด {ranked.length} {isTeam ? "ทีม" : "คน"} · เรียงตาม{unitTh}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="ปิด"
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-none items-center gap-3 border-b border-slate-100 px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <span className="w-8 text-center">Rank</span>
              <span className="flex-1">{isTeam ? "Team" : "Player"}</span>
              <span>{unit}</span>
            </div>
            <ul className="divide-y divide-slate-100 overflow-y-auto overscroll-contain px-5 pb-4">
              {ranked.map((r) => rankRow(r))}
            </ul>
          </div>
        </div>,
          document.body,
        )}
    </div>
  );
}
