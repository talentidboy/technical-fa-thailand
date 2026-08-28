import { TeamBadge } from "./TeamBadge";

export type PlayerLeaderboardRow = {
  key: string;
  playerName: string;
  jerseyNumber: number | null;
  teamName: string;
  teamLogoUrl: string | null;
  teamGroupName: string | null;
  goals: number;
};

// เหมือน MiniLeaderboard แต่เป็นอันดับรายบุคคล (ผู้ทำประตู) ไม่ใช่รายทีม จึงแยกคอมโพเนนต์ต่างหาก
// เพราะ MiniLeaderboard ผูกชนิดข้อมูลไว้กับ StandingRow ของทีมโดยเฉพาะ
export function PlayerLeaderboard({
  title,
  icon: Icon,
  rows,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  rows: PlayerLeaderboardRow[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-rose-600" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-400">ยังไม่มีข้อมูล / No data yet</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((row, i) => (
            <li key={row.key} className="flex items-center gap-2.5">
              <span
                className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11px] font-bold ${
                  i === 0
                    ? "bg-amber-400 text-amber-950"
                    : i === 1
                      ? "bg-slate-300 text-slate-900"
                      : i === 2
                        ? "bg-orange-300 text-orange-950"
                        : "bg-slate-100 text-slate-400"
                }`}
              >
                {i + 1}
              </span>
              <TeamBadge team={{ name: row.teamName, logoUrl: row.teamLogoUrl, groupName: row.teamGroupName }} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                {row.playerName}
                {row.jerseyNumber != null && <span className="ml-1 text-slate-400">#{row.jerseyNumber}</span>}
                <span className="block truncate text-xs text-slate-400">{row.teamName}</span>
              </span>
              <span className="flex-none text-sm font-bold text-rose-600">{row.goals}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
