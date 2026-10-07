import { TeamBadge } from "./TeamBadge";

type Side = {
  team: { name: string; logoUrl: string | null; groupName: string | null };
  score: number | null;
  penalty?: number | null;
  won: boolean;
};

// ทีมเหย้า/ทีมเยือนเรียงบน-ล่าง สกอร์ชิดขวา (แบบแอปผลบอลทั่วไป) — ใช้บนจอโทรศัพท์แทนแถวซ้าย-ขวา
// เพราะชื่อทีมไทยยาว ("โรงเรียนกีฬาจังหวัด...") ถ้าวางคู่กันจะถูกตัดจนแยกไม่ออกว่าทีมไหน — ที่นี่ให้ขึ้นได้ 2 บรรทัด
export function StackedTeams({
  home,
  away,
  live = false,
  size = "md",
}: {
  home: Side;
  away: Side;
  live?: boolean;
  size?: "sm" | "md";
}) {
  const decided = home.won || away.won;
  return (
    <div className="min-w-0 flex-1 space-y-2">
      {[home, away].map((s, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <TeamBadge team={s.team} size={size === "sm" ? "sm" : "md"} />
          <span
            className={`line-clamp-2 min-w-0 flex-1 leading-snug ${size === "sm" ? "text-[13px]" : "text-sm"} ${
              s.won ? "font-bold text-slate-900" : decided ? "text-slate-500" : "font-medium text-slate-800"
            }`}
          >
            {s.team.name}
          </span>
          {s.score != null && (
            <span
              className={`flex-none text-lg font-extrabold tabular-nums ${
                live ? "text-red-600" : decided && !s.won ? "text-slate-400" : "text-slate-900"
              }`}
            >
              {s.score}
              {s.penalty != null && <span className="ml-1 text-xs font-semibold text-slate-400">({s.penalty})</span>}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
