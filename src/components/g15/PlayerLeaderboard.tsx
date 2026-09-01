"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TeamBadge } from "./TeamBadge";
import { ACCENT_STYLE, type LeaderboardAccent } from "./MiniLeaderboard";

export type PlayerLeaderboardRow = {
  key: string;
  playerName: string;
  jerseyNumber: number | null;
  teamName: string;
  teamLogoUrl: string | null;
  teamGroupName: string | null;
  goals: number;
};

const DEFAULT_VISIBLE = 8;

// เหมือน MiniLeaderboard แต่เป็นอันดับรายบุคคล (ผู้ทำประตู) ไม่ใช่รายทีม จึงแยกคอมโพเนนต์ต่างหาก
// เพราะ MiniLeaderboard ผูกชนิดข้อมูลไว้กับ StandingRow ของทีมโดยเฉพาะ
// รับ rows เต็มลิสต์เสมอ — คอมโพเนนต์เองเป็นคนจำกัดจำนวนที่โชว์เริ่มต้น + ปุ่ม "ดูเพิ่มเติม" ให้ข้อมูลไม่หายไปเฉยๆ
export function PlayerLeaderboard({
  title,
  icon,
  rows,
  accent = "rose",
}: {
  title: string;
  icon: React.ReactNode;
  rows: PlayerLeaderboardRow[];
  accent?: LeaderboardAccent;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleRows = expanded ? rows : rows.slice(0, DEFAULT_VISIBLE);
  const hiddenCount = rows.length - DEFAULT_VISIBLE;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-lg ${ACCENT_STYLE[accent]}`}>
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-400">ยังไม่มีข้อมูล / No data yet</p>
      ) : (
        <>
          <ul className="space-y-2.5">
            {visibleRows.map((row, i) => (
              <li key={row.key} className="flex items-center gap-2.5">
                <span
                  className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11px] font-bold ${
                    i === 0
                      ? "bg-amber-400 text-amber-950"
                      : i === 1
                        ? "bg-slate-300 text-slate-900"
                        : i === 2
                          ? "bg-orange-300 text-orange-950"
                          : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {i + 1}
                </span>
                <TeamBadge team={{ name: row.teamName, logoUrl: row.teamLogoUrl, groupName: row.teamGroupName }} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                  {row.playerName}
                  {row.jerseyNumber != null && <span className="ml-1 text-slate-400">#{row.jerseyNumber}</span>}
                  <span className="block truncate text-xs text-slate-400">{row.teamName}</span>
                </span>
                <span className="flex-none text-sm font-bold text-rose-600">{row.goals}</span>
              </li>
            ))}
          </ul>
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-slate-100 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            >
              {expanded ? (
                <>
                  แสดงน้อยลง <ChevronUp className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  ดูเพิ่มเติมอีก {hiddenCount} คน <ChevronDown className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
