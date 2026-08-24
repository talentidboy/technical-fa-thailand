"use client";

import { useState, type ReactNode } from "react";
import { Users, Trophy } from "lucide-react";

const TABS = [
  { key: "teams", label: "ทีม", icon: Users },
  { key: "matches", label: "นัดการแข่งขัน", icon: Trophy },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function ManageTabs({ teams, matches }: { teams: ReactNode; matches: ReactNode }) {
  const [active, setActive] = useState<TabKey>("teams");
  const content: Record<TabKey, ReactNode> = { teams, matches };

  return (
    <div>
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map(({ key, label, icon: Icon }) => (
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
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
      {content[active]}
    </div>
  );
}
