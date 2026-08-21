import { getAllMatchStats, buildLeaderboards, STAT_GROUPS } from "@/lib/talent-match-stats";
import { Activity, Users } from "lucide-react";

export const fetchCache = "default-cache";

export default async function TalentIdStatsPage() {
  let data: Awaited<ReturnType<typeof getAllMatchStats>> = [];
  let loadError: string | null = null;
  try {
    data = await getAllMatchStats();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "ไม่สามารถดึงข้อมูลจาก Airtable ได้";
  }

  const headline = [
    { label: "GOAL", title: "ประตูรวม" },
    { label: "ASSIST", title: "แอสซิสต์รวม" },
    { label: "TACKLE", title: "แท็กเกิลรวม" },
    { label: "PASSING", title: "จ่ายบอลรวม" },
  ].map(({ label, title }) => ({
    title,
    value: data.reduce((s, r) => s + (r.stats[label] ?? 0), 0),
  }));

  return (
    <div>
      <div className="mb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30">
          <Activity className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-white">สถิติการแข่งขัน</h1>
        <p className="mt-1 max-w-xl text-sm text-indigo-300">
          สรุปเชิงลึกจากสถิติการแข่งขันจริง (Individual Stats Leg 2 / 2026) — จัดอันดับผู้เล่นในแต่ละหมวด
        </p>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-dashed border-red-400/30 bg-red-400/5 px-6 py-10 text-center text-sm text-red-300">
          ดึงข้อมูลจาก Airtable ไม่สำเร็จ: {loadError}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-16 text-center">
          <Users className="h-8 w-8 text-indigo-400" />
          <p className="text-sm text-indigo-300">ยังไม่มีข้อมูลสถิติการแข่งขันใน Airtable</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* KPI */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:col-span-1">
              <p className="text-xs text-indigo-300">ผู้เล่นที่มีข้อมูลสถิติ</p>
              <p className="mt-1 text-3xl font-bold text-white">{data.length}</p>
            </div>
            {headline.map((h) => (
              <div key={h.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs text-indigo-300">{h.title}</p>
                <p className="mt-1 text-3xl font-bold text-amber-300">{h.value}</p>
              </div>
            ))}
          </div>

          {/* จัดอันดับตามหมวด */}
          {STAT_GROUPS.map((group) => {
            const leaderboards = buildLeaderboards(data, group.stats, 5);
            if (leaderboards.length === 0) return null;
            return (
              <section key={group.title}>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-indigo-300">
                  {group.title}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {leaderboards.map((lb) => (
                    <div
                      key={lb.stat}
                      className="rounded-2xl border border-white/10 bg-white/5 p-5"
                    >
                      <h3 className="mb-3 text-xs font-bold text-amber-300">{lb.stat}</h3>
                      <ul className="space-y-2">
                        {lb.rows.map((r, i) => (
                          <li key={r.row.id} className="flex items-center gap-2.5 text-sm">
                            <span className="w-4 flex-none text-xs font-bold text-indigo-400">
                              {i + 1}
                            </span>
                            {r.row.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={r.row.photoUrl}
                                alt=""
                                className="h-6 w-6 flex-none rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-indigo-800 text-[10px] font-semibold text-indigo-200">
                                {r.row.name.charAt(0)}
                              </div>
                            )}
                            <span className="min-w-0 flex-1 truncate text-indigo-100">
                              {r.row.name}
                            </span>
                            <span className="flex-none font-bold text-white">{r.value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
