"use client";

import { useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarClock, ListOrdered, BarChart3, Users } from "lucide-react";

const TABS = [
  { key: "matches", label: "ตารางการแข่งขัน", en: "Matches", icon: CalendarClock },
  { key: "table", label: "ตารางคะแนน", en: "Table", icon: ListOrdered },
  { key: "stats", label: "สถิติ", en: "Stats", icon: BarChart3 },
  { key: "clubs", label: "ทีมที่เข้าร่วม", en: "Clubs", icon: Users },
] as const;

type TabKey = (typeof TABS)[number]["key"];
const TAB_KEYS = TABS.map((t) => t.key) as readonly string[];

export function G15Tabs({
  matches,
  table,
  stats,
  clubs,
}: {
  matches: ReactNode;
  table: ReactNode;
  stats: ReactNode;
  clubs: ReactNode;
}) {
  // อ่าน ?tab=... จาก URL เพื่อให้ลิงก์ "ดูทั้งหมด" จากส่วนอื่นของหน้าพาผู้ใช้มาเปิดแท็บที่ถูกต้องได้เลย
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const initialTab = requestedTab && TAB_KEYS.includes(requestedTab) ? (requestedTab as TabKey) : "matches";
  const [active, setActive] = useState<TabKey>(initialTab);
  const content: Record<TabKey, ReactNode> = { matches, table, stats, clubs };

  return (
    <div id="tournament-tabs" className="scroll-mt-20">
      <div className="mb-8 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map(({ key, label, en, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActive(key)}
            className={`flex flex-none items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              active === key
                ? "border-rose-600 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Icon className="h-4 w-4 flex-none" />
            <span className="flex flex-col items-start leading-tight">
              <span>{label}</span>
              <span className="text-[10px] font-normal uppercase tracking-wide opacity-60">{en}</span>
            </span>
          </button>
        ))}
      </div>
      {content[active]}
    </div>
  );
}
