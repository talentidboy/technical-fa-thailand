"use client";

import { useState, type ReactNode } from "react";
import { CalendarClock, ListOrdered, BarChart3, Users } from "lucide-react";

const TABS = [
  { key: "matches", label: "ตารางการแข่งขัน", en: "Matches", icon: CalendarClock },
  { key: "table", label: "ตารางคะแนน", en: "Table", icon: ListOrdered },
  { key: "stats", label: "สถิติ", en: "Stats", icon: BarChart3 },
  { key: "clubs", label: "ทีมที่เข้าร่วม", en: "Clubs", icon: Users },
] as const;

type TabKey = (typeof TABS)[number]["key"];

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
  const [active, setActive] = useState<TabKey>("matches");
  const content: Record<TabKey, ReactNode> = { matches, table, stats, clubs };

  return (
    <div>
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
