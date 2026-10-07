import { Trophy } from "lucide-react";
import { StandingTable } from "./StandingTable";
import { roundStyle, roundEn } from "@/lib/g15-stage";
import type { StandingGroup } from "@/lib/g15";

// ตารางคะแนนกลุ่ม A/B ของรอบชิงแชมป์ประเทศ — ที่ 1-2 ของแต่ละกลุ่มเข้ารอบรองชนะเลิศ
export function NationalGroupTables({
  groups,
  formByTeamId,
  columns = 2,
}: {
  groups: StandingGroup[];
  formByTeamId?: Map<number, ("W" | "D" | "L")[]>;
  columns?: 1 | 2;
}) {
  return (
    <div className="space-y-3">
      <div className={`grid grid-cols-1 gap-6 ${columns === 2 ? "lg:grid-cols-2" : ""}`}>
        {groups.map((group) => {
          const style = roundStyle(group.groupName);
          return (
            <div
              key={group.groupName}
              className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ${style.ring}`}
            >
              <div className={`flex items-center gap-2.5 px-5 py-3 ${style.bg}`}>
                <Trophy className="h-4 w-4 text-white" />
                <h3 className="font-bold text-white">
                  {group.groupName} <span className="font-normal text-white/70">/ {roundEn(group.groupName)}</span>
                </h3>
              </div>
              <StandingTable group={group} formByTeamId={formByTeamId} qualifyCount={2} />
            </div>
          );
        })}
      </div>
      <p className="flex items-center gap-2 text-[11px] text-slate-400">
        <span className="h-3 w-1 flex-none rounded-full bg-emerald-500" />
        ที่ 1-2 ของกลุ่มเข้ารอบรองชนะเลิศ / Top 2 advance to the semi-finals
      </p>
    </div>
  );
}
