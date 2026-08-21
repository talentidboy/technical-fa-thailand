import { getAllMatchStats } from "@/lib/talent-match-stats";
import { Activity, Users } from "lucide-react";
import { Breadcrumb } from "@/components/talent-id/Breadcrumb";
import { StatsExplorer } from "@/components/talent-id/StatsExplorer";

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
      <Breadcrumb items={[{ label: "Talent ID", href: "/talent-id" }, { label: "สถิติการแข่งขัน" }]} />
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

          <StatsExplorer data={data} />
        </div>
      )}
    </div>
  );
}
