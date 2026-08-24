"use client";

import { useState, type ReactNode } from "react";
import { CalendarClock, ListOrdered, BarChart3, Users } from "lucide-react";

const TABS = [
  { key: "matches", label: "ตารางการแข่งขัน", icon: CalendarClock },
  { key: "table", label: "ตารางคะแนน", icon: ListOrdered },
  { key: "stats", label: "สถิติ", icon: BarChart3 },
  { key: "clubs", label: "ทีมที่เข้าร่วม", icon: Users },
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
      <div className="mb-8 flex gap-1 overflow-x-auto border-b border-white/10">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActive(key)}
            className={`flex flex-none items-center gap-1.5 border-b-2 px-4 py-3.5 text-sm font-semibold transition-colors ${
              active === key
                ? "border-cyan-400 text-white"
                : "border-transparent text-violet-300 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
      {content[active]}
    </div>
  );
}
