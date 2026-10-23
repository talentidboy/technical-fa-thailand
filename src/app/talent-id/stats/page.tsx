import { getAllMatchStats } from "@/lib/talent-match-stats";
import { Users } from "lucide-react";
import { Breadcrumb } from "@/components/talent-id/Breadcrumb";
import { StatsExplorer } from "@/components/talent-id/StatsExplorer";
import { ScoreStrip, TalentPageHead } from "@/components/talent-id/TalentUi";

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
      <TalentPageHead eyebrow="Match statistics" title="สถิติการแข่งขัน" sub="สรุปเชิงลึกจากสถิติการแข่งขันจริง (Individual Stats Leg 2 / 2026) — จัดอันดับผู้เล่นในแต่ละหมวด" />

      {loadError ? (
        <div className="rounded-xl border border-dashed border-red-400/30 bg-red-400/5 px-6 py-10 text-center text-sm text-red-300">
          ดึงข้อมูลจาก Airtable ไม่สำเร็จ: {loadError}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/15 px-6 py-16 text-center">
          <Users className="h-8 w-8 text-indigo-400" />
          <p className="text-sm text-indigo-300">ยังไม่มีข้อมูลสถิติการแข่งขันใน Airtable</p>
        </div>
      ) : (
        <div className="space-y-8">
          <ScoreStrip
            className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
            items={[
              { label: "ผู้เล่นที่มีข้อมูลสถิติ", value: data.length.toLocaleString() },
              ...headline.map((x) => ({ label: x.title, value: x.value.toLocaleString(), tone: "amber" as const })),
            ]}
          />

          <StatsExplorer data={data} />
        </div>
      )}
    </div>
  );
}
