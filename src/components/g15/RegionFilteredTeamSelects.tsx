"use client";

import { useMemo, useState } from "react";
import { REGION_ORDER, parseRegionGroup } from "@/lib/g15-region";

type TeamOption = { id: number; name: string; groupName: string | null };

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

export function RegionFilteredTeamSelects({
  teams,
  defaultRegion,
  defaultHomeTeamId,
  defaultAwayTeamId,
}: {
  teams: TeamOption[];
  defaultRegion?: string | null;
  defaultHomeTeamId?: number;
  defaultAwayTeamId?: number;
}) {
  const regionOrder = useMemo(() => {
    const present = new Set(
      teams.map((t) => parseRegionGroup(t.groupName)?.region).filter((r): r is string => !!r),
    );
    return [
      ...REGION_ORDER.filter((r) => present.has(r)),
      ...Array.from(present).filter((r) => !REGION_ORDER.includes(r)),
    ];
  }, [teams]);

  const [region, setRegion] = useState(defaultRegion && regionOrder.includes(defaultRegion) ? defaultRegion : "");

  const filteredTeams = useMemo(
    () => teams.filter((t) => parseRegionGroup(t.groupName)?.region === region),
    [teams, region],
  );

  return (
    <>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">ภาค (เพื่อกรองรายชื่อทีม)</span>
        <select value={region} onChange={(e) => setRegion(e.target.value)} className={selectClass}>
          <option value="">เลือกภาค...</option>
          {regionOrder.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">
          ทีมเหย้า<span className="text-red-500"> *</span>
        </span>
        <select
          name="homeTeamId"
          required
          defaultValue={defaultHomeTeamId ? String(defaultHomeTeamId) : ""}
          className={selectClass}
        >
          <option value="">{region ? "เลือกทีม..." : "เลือกภาคก่อน"}</option>
          {filteredTeams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">
          ทีมเยือน<span className="text-red-500"> *</span>
        </span>
        <select
          name="awayTeamId"
          required
          defaultValue={defaultAwayTeamId ? String(defaultAwayTeamId) : ""}
          className={selectClass}
        >
          <option value="">{region ? "เลือกทีม..." : "เลือกภาคก่อน"}</option>
          {filteredTeams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
