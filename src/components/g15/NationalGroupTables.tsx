import Link from "next/link";
import { Bebas_Neue } from "next/font/google";
import { LivePill } from "./LivePill";
import { TeamBadge } from "./TeamBadge";
import { FormPills } from "./StandingTable";
import type { StandingGroup } from "@/lib/g15";

const display = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap" });

// สีประจำกลุ่ม (ชุดเดียวกับหน้าทีมที่เข้าร่วม)
const GROUP_TONE: Record<string, string> = {
  A: "from-indigo-800 via-indigo-600 to-indigo-500",
  B: "from-fuchsia-800 via-fuchsia-600 to-fuchsia-500",
};

// ตารางคะแนนกลุ่ม A/B ของรอบชิงแชมป์ประเทศ — ที่ 1-2 ของแต่ละกลุ่มเข้ารอบรองชนะเลิศ
// แบนเนอร์สีกลุ่ม + แถวใหญ่ อันดับ/แต้มตัวโต ไฮไลต์ทีมที่อยู่ในโซนเข้ารอบ
export function NationalGroupTables({
  groups,
  formByTeamId,
  columns = 2,
  live = false,
  compact = false,
}: {
  groups: StandingGroup[];
  formByTeamId?: Map<number, ("W" | "D" | "L")[]>;
  columns?: 1 | 2;
  // ตารางคะแนนสด — groups คำนวณโดยนับนัดที่กำลังแข่งเหมือนจบตามสกอร์ปัจจุบัน (projectLive)
  live?: boolean;
  // compact = วางในคอลัมน์แคบ (หน้าแรก) — ซ่อนได้:เสีย และฟอร์ม ให้ชื่อทีมมีที่พอ
  compact?: boolean;
}) {
  const QUALIFY = 2;
  // คอลัมน์รอง: ชนะ/เสมอ/แพ้ โชว์ตั้งแต่จอกลาง · ได้:เสีย/ฟอร์ม โชว์เฉพาะจอใหญ่ (และไม่โชว์ในโหมด compact)
  const wide = compact ? "hidden" : columns === 2 ? "hidden xl:table-cell" : "hidden lg:table-cell";
  const mid = "hidden sm:table-cell";

  return (
    <div className="space-y-3">
      {live && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
          <LivePill />
          ตารางคะแนนสด — ถ้าจบตามสกอร์ตอนนี้ / Live table: as it stands
        </div>
      )}
      <div className={`grid grid-cols-1 gap-6 ${columns === 2 ? "lg:grid-cols-2" : ""}`}>
        {groups.map((group) => {
          const letter = group.groupName.trim().slice(-1).toUpperCase();
          const grad = GROUP_TONE[letter] ?? "from-g15-800 via-g15-600 to-g15-500";
          const played = group.rows.reduce((s, r) => s + r.played, 0) / 2;
          return (
            <section key={group.groupName} className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-g15-950/10 ring-1 ring-slate-200">
              {/* แบนเนอร์กลุ่ม */}
              <div className={`relative isolate flex items-end justify-between gap-3 overflow-hidden bg-linear-to-r ${grad} px-5 py-4`}>
                <span aria-hidden className={`${display.className} pointer-events-none absolute -bottom-7 right-3 -z-10 select-none text-[8rem] leading-none text-white/10`}>
                  {letter}
                </span>
                <div>
                  <p className="text-xs font-semibold text-white/75">
                    รอบชิงแชมป์ประเทศ <span className="hidden sm:inline">/ National Round</span>
                  </p>
                  <h3 className={`${display.className} text-4xl leading-none text-white`}>
                    Group {letter} <span className="font-sans text-base font-bold">/ กลุ่ม {letter}</span>
                  </h3>
                </div>
                <span className="flex-none whitespace-nowrap rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white ring-1 ring-white/25">
                  แข่งแล้ว {Math.round(played)} นัด
                </span>
              </div>

              <table className="w-full table-fixed text-left">
                <thead className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="w-12 py-2.5 pl-4 text-center">#</th>
                    <th className="py-2.5 pl-1">Team / ทีม</th>
                    <th className="w-9 py-2.5 text-center" title="แข่ง">
                      P
                    </th>
                    <th className={`w-9 py-2.5 text-center ${mid}`} title="ชนะ">
                      W
                    </th>
                    <th className={`w-9 py-2.5 text-center ${mid}`} title="เสมอ">
                      D
                    </th>
                    <th className={`w-9 py-2.5 text-center ${mid}`} title="แพ้">
                      L
                    </th>
                    <th className={`w-14 py-2.5 text-center ${wide}`} title="ได้-เสีย">
                      GF:GA
                    </th>
                    <th className="w-10 py-2.5 text-center" title="ผลต่างประตู">
                      GD
                    </th>
                    <th className="w-16 py-2.5 pr-2 text-center" title="คะแนน">
                      Pts
                    </th>
                    {formByTeamId && (
                      <th className={`w-32 py-2.5 pr-4 text-center ${wide}`} title="ฟอร์มล่าสุด">
                        Form
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row, i) => {
                    const rank = i + 1;
                    const q = rank <= QUALIFY;
                    return (
                      <tr key={row.teamId} className={`group border-b border-slate-100 last:border-0 ${q ? "bg-linear-to-r from-emerald-50 to-transparent" : ""}`}>
                        <td className={`relative py-3 pl-4 text-center ${display.className}`}>
                          {q && <span aria-hidden className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-emerald-500" />}
                          <span className={`text-3xl leading-none ${q ? "text-emerald-600" : "text-slate-300"}`}>{rank}</span>
                        </td>
                        <td className="py-3 pl-1 pr-2">
                          <Link href={`/g15-womens-series/teams/${row.teamId}`} className="flex items-center gap-2.5">
                            <span className="flex-none rounded-full bg-white p-0.5 shadow-sm ring-1 ring-slate-200 transition-transform group-hover:scale-105">
                              <TeamBadge team={{ name: row.teamName, logoUrl: row.logoUrl, groupName: row.groupName }} size="md" />
                            </span>
                            <span className="min-w-0">
                              <span className="line-clamp-2 text-[13px] font-bold leading-snug text-g15-950 group-hover:text-g15-700 sm:text-sm">{row.teamName}</span>
                              {q && row.played > 0 && <span className="text-[10px] font-semibold text-emerald-600">โซนเข้ารอบรองฯ</span>}
                            </span>
                          </Link>
                        </td>
                        <td className="py-3 text-center text-sm text-slate-500">{row.played}</td>
                        <td className={`py-3 text-center text-sm text-slate-500 ${mid}`}>{row.won}</td>
                        <td className={`py-3 text-center text-sm text-slate-500 ${mid}`}>{row.drawn}</td>
                        <td className={`py-3 text-center text-sm text-slate-500 ${mid}`}>{row.lost}</td>
                        <td className={`py-3 text-center text-sm text-slate-500 ${wide}`}>
                          {row.goalsFor}:{row.goalsAgainst}
                        </td>
                        <td className={`py-3 text-center text-sm font-semibold ${row.goalDiff > 0 ? "text-emerald-600" : row.goalDiff < 0 ? "text-red-500" : "text-slate-500"}`}>
                          {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                        </td>
                        <td className="py-3 pr-2 text-center">
                          <span
                            className={`${display.className} inline-flex h-10 w-11 items-center justify-center rounded-xl pt-0.5 text-2xl leading-none ${
                              q ? "bg-g15-700 text-white shadow-sm shadow-g15-900/30" : "bg-slate-100 text-g15-900"
                            }`}
                          >
                            {row.points}
                          </span>
                        </td>
                        {formByTeamId && (
                          <td className={`py-3 pr-4 ${wide}`}>
                            <FormPills results={formByTeamId.get(row.teamId) ?? []} size="md" />
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          );
        })}
      </div>
      <p className="flex items-center gap-2 text-[11px] text-slate-500">
        <span className="h-3 w-1 flex-none rounded-full bg-emerald-500" />
        ที่ 1-2 ของกลุ่มเข้ารอบรองชนะเลิศ / Top 2 advance to the semi-finals
      </p>
    </div>
  );
}
