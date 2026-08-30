import { TeamBadge } from "./TeamBadge";
import type { StandingGroup } from "@/lib/g15";

const FORM_STYLE: Record<"W" | "D" | "L", string> = {
  W: "bg-emerald-500",
  D: "bg-amber-400",
  L: "bg-red-400",
};

// ใช้ร่วมกันทั้งคอลัมน์ Form ในตารางคะแนน และการ์ด "ข้อมูลก่อนแข่ง" ในหน้ารายละเอียดนัด — size ใหญ่ขึ้นสำหรับบริบทที่มีที่ว่างมากกว่า
export function FormPills({ results, size = "sm" }: { results: ("W" | "D" | "L")[]; size?: "sm" | "md" }) {
  if (results.length === 0) return <span className="text-xs text-slate-300">—</span>;
  const box = size === "md" ? "h-5 w-5 text-[10px]" : "h-4 w-4 text-[8px]";
  return (
    <div className="flex items-center justify-center gap-1">
      {results.map((r, i) => (
        <span key={i} className={`flex ${box} flex-none items-center justify-center rounded-full font-bold text-white ${FORM_STYLE[r]}`}>
          {r}
        </span>
      ))}
    </div>
  );
}

export function StandingTable({
  group,
  formByTeamId,
}: {
  group: StandingGroup;
  formByTeamId?: Map<number, ("W" | "D" | "L")[]>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-90 text-left text-sm">
        <thead className="bg-slate-50 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          <tr>
            <th className="w-10 px-3 py-2.5"></th>
            <th className="px-2 py-2.5">
              Team <span className="normal-case text-slate-400">/ ทีม</span>
            </th>
            <th className="px-2 py-2.5 text-center" title="แข่ง">
              P
            </th>
            <th className="px-2 py-2.5 text-center" title="ชนะ">
              W
            </th>
            <th className="hidden px-2 py-2.5 text-center sm:table-cell" title="เสมอ">
              D
            </th>
            <th className="hidden px-2 py-2.5 text-center sm:table-cell" title="แพ้">
              L
            </th>
            <th className="hidden px-2 py-2.5 text-center sm:table-cell" title="ผลต่าง">
              GD
            </th>
            <th className="px-4 py-2.5 text-center" title="คะแนน">
              Pts
            </th>
            {formByTeamId && (
              <th className="hidden px-2 py-2.5 text-center md:table-cell" title="ฟอร์ม 5 นัดล่าสุด">
                Form
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {group.rows.map((row, i) => {
            const rank = i + 1;
            const badge =
              rank === 1
                ? "bg-amber-400 text-amber-950"
                : rank === 2
                  ? "bg-slate-300 text-slate-900"
                  : rank === 3
                    ? "bg-orange-300 text-orange-950"
                    : "bg-slate-100 text-slate-400";
            return (
              <tr key={row.teamId}>
                <td className="px-3 py-2.5">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${badge}`}
                  >
                    {rank}
                  </span>
                </td>
                <td className="max-w-30 px-2 py-2.5 md:max-w-44">
                  <div className="flex items-center gap-2">
                    <TeamBadge team={{ name: row.teamName, logoUrl: row.logoUrl, groupName: row.groupName }} size="sm" />
                    <span className="truncate font-medium text-slate-900">{row.teamName}</span>
                  </div>
                </td>
                <td className="px-2 py-2.5 text-center text-slate-500">{row.played}</td>
                <td className="px-2 py-2.5 text-center text-slate-500">{row.won}</td>
                <td className="hidden px-2 py-2.5 text-center text-slate-500 sm:table-cell">{row.drawn}</td>
                <td className="hidden px-2 py-2.5 text-center text-slate-500 sm:table-cell">{row.lost}</td>
                <td className="hidden px-2 py-2.5 text-center text-slate-500 sm:table-cell">
                  {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                </td>
                <td className="px-4 py-2.5 text-center font-bold text-rose-600">{row.points}</td>
                {formByTeamId && (
                  <td className="hidden px-2 py-2.5 md:table-cell">
                    <FormPills results={formByTeamId.get(row.teamId) ?? []} />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
