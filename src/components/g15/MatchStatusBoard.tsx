"use client";

import { useState, type ReactNode } from "react";
import { Trophy } from "lucide-react";

type MatchItem = { status: string; node: ReactNode };
type MatchGroup = { region: string; wrapperClassName: string; headerClassName: string; items: MatchItem[] };

const FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "FINISHED", label: "จบแล้ว" },
  { key: "SCHEDULED", label: "ยังไม่แข่ง" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export function MatchStatusBoard({ groups }: { groups: MatchGroup[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const allItems = groups.flatMap((g) => g.items);
  const counts: Record<FilterKey, number> = {
    all: allItems.length,
    FINISHED: allItems.filter((i) => i.status === "FINISHED").length,
    SCHEDULED: allItems.filter((i) => i.status === "SCHEDULED").length,
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === key
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {groups.map((g) => {
          const visible = filter === "all" ? g.items : g.items.filter((i) => i.status === filter);
          if (visible.length === 0) return null;
          return (
            <div key={g.region} className={g.wrapperClassName}>
              <div className={g.headerClassName}>
                <Trophy className="h-4 w-4 text-white" />
                <h3 className="font-bold text-white">{g.region}</h3>
                <span className="ml-auto text-xs font-medium text-white/80">{visible.length} นัด</span>
              </div>
              <div className="divide-y divide-slate-100">{visible.map((i) => i.node)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
