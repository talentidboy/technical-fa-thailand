"use client";

import { useState, type ReactNode } from "react";
import { User, BarChart3, Video, Activity } from "lucide-react";

const TABS = [
  { key: "overview", label: "ภาพรวม", icon: User },
  { key: "ratings", label: "คะแนนและเกรด", icon: BarChart3 },
  { key: "stats", label: "สถิติการแข่งขัน", icon: Activity },
  { key: "media", label: "สื่อ", icon: Video },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function PlayerTabs({
  overview,
  ratings,
  stats,
  media,
}: {
  overview: ReactNode;
  ratings: ReactNode;
  stats?: ReactNode;
  media: ReactNode;
}) {
  const [active, setActive] = useState<TabKey>("overview");
  const content: Record<TabKey, ReactNode> = { overview, ratings, stats, media };
  const tabs = stats ? TABS : TABS.filter((t) => t.key !== "stats");

  return (
    <div>
      <div className="mb-5 flex items-center gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-1 sm:inline-flex">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActive(key)}
            className={`inline-flex flex-none items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              active === key
                ? "bg-amber-400 text-indigo-950"
                : "text-indigo-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
      <div className="space-y-6">{content[active]}</div>
    </div>
  );
}
