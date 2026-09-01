"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TeamBadge } from "./TeamBadge";
import type { StandingRow } from "@/lib/g15";

export type LeaderboardAccent = "rose" | "emerald" | "indigo" | "cyan" | "amber" | "fuchsia";

export const ACCENT_STYLE: Record<LeaderboardAccent, string> = {
  rose: "bg-rose-50 text-rose-600",
  emerald: "bg-emerald-50 text-emerald-600",
  indigo: "bg-indigo-50 text-indigo-600",
  cyan: "bg-cyan-50 text-cyan-600",
  amber: "bg-amber-50 text-amber-600",
  fuchsia: "bg-fuchsia-50 text-fuchsia-600",
};

const DEFAULT_VISIBLE = 5;

// รับ rows เต็มลิสต์เสมอ (ไม่ตัดมาจากหน้าเรียก) แล้วคอมโพเนนต์เองเป็นคนจำกัดจำนวนที่โชว์ + ปุ่ม "ดูเพิ่มเติม"
// เพื่อไม่ให้ข้อมูลจริงหายไปเฉยๆ เวลาทีมมีมากกว่า 5 ทีม
// icon รับเป็น ReactNode (element ที่ render แล้ว) ไม่ใช่ component reference — และ value คำนวณไว้ล่วงหน้าติดกับแต่ละแถวแล้ว
// เพราะคอมโพเนนต์นี้เป็น Client Component (มี useState) จึงส่งฟังก์ชัน/component type ข้าม server-client boundary ตรงๆ ไม่ได้
export function MiniLeaderboard<T extends StandingRow & { value: number }>({
  title,
  icon,
  rows,
  accent = "rose",
}: {
  title: string;
  icon: React.ReactNode;
  rows: T[];
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
              <li key={row.teamId} className="flex items-center gap-2.5">
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
                <TeamBadge team={{ name: row.teamName, logoUrl: row.logoUrl, groupName: row.groupName }} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{row.teamName}</span>
                <span className="flex-none text-sm font-bold text-rose-600">{row.value}</span>
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
                  ดูเพิ่มเติมอีก {hiddenCount} ทีม <ChevronDown className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
