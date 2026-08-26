"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { REGION_ORDER, parseRegionGroup } from "@/lib/g15-region";

type TeamOption = { id: number; name: string; groupName: string | null };

const fieldClass =
  "w-full flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

export function MatchRegionFields({
  teams,
  defaultRound,
  defaultHomeTeamId,
  defaultAwayTeamId,
  regionRowSpansFull = false,
}: {
  teams: TeamOption[];
  defaultRound?: string;
  defaultHomeTeamId?: number;
  defaultAwayTeamId?: number;
  // ให้ช่อง "รอบการแข่งขัน / ภาค" กินเต็มแถวของตัวเอง แล้วดันทีมเหย้า/ทีมเยือนไปจับคู่กันแถวถัดไป
  // ใช้เฉพาะฟอร์มเพิ่มนัดที่เป็นกริด 2 คอลัมน์ — ฟอร์มแก้ไขนัด (กริด 6 คอลัมน์) ไม่ต้องการพฤติกรรมนี้
  regionRowSpansFull?: boolean;
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

  // ถ้ารอบเดิมตรงกับชื่อภาคพอดี (กรณีปกติของทุกนัดตอนนี้) ให้เริ่มโหมด "เลือกภาค" พร้อมตั้งค่าภาคนั้นไว้เลย
  const isRegionRound = !!defaultRound && regionOrder.includes(defaultRound);
  const [mode, setMode] = useState<"region" | "custom">(!defaultRound || isRegionRound ? "region" : "custom");
  const [region, setRegion] = useState(isRegionRound ? defaultRound! : "");

  const filteredTeams = useMemo(
    () => teams.filter((t) => parseRegionGroup(t.groupName)?.region === region),
    [teams, region],
  );

  return (
    <>
      <label className={`flex flex-col gap-1.5 ${regionRowSpansFull ? "sm:col-span-2" : ""}`}>
        <span className="text-sm font-medium text-slate-700">
          รอบการแข่งขัน / ภาค<span className="text-red-500"> *</span>
        </span>
        <div className="flex items-center gap-1.5">
          {mode === "region" ? (
            <select name="round" required value={region} onChange={(e) => setRegion(e.target.value)} className={fieldClass}>
              <option value="">เลือกภาค...</option>
              {regionOrder.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          ) : (
            <input
              name="round"
              required
              defaultValue={!isRegionRound ? (defaultRound ?? "") : ""}
              placeholder="เช่น รอบรองชนะเลิศ"
              className={fieldClass}
            />
          )}
          <button
            type="button"
            onClick={() => setMode((m) => (m === "region" ? "custom" : "region"))}
            title={mode === "region" ? "พิมพ์ชื่อรอบเอง (เช่น รอบรองชนะเลิศ)" : "เลือกจากรายชื่อภาค"}
            aria-label={mode === "region" ? "พิมพ์ชื่อรอบเอง" : "เลือกจากรายชื่อภาค"}
            className="flex-none rounded-lg border border-slate-200 p-2.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-rose-600"
          >
            {mode === "region" ? <Plus className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </button>
        </div>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">
          ทีมเหย้า<span className="text-red-500"> *</span>
        </span>
        <select
          name="homeTeamId"
          required
          defaultValue={defaultHomeTeamId ? String(defaultHomeTeamId) : ""}
          className={fieldClass}
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
          className={fieldClass}
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
