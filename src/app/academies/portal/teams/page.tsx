import Link from "next/link";
import type { Metadata } from "next";
import { requireAcademy } from "@/lib/academy-portal";
import { loadTeams } from "@/lib/academy-data";
import { teamCheck, minPlayers } from "@/lib/academy-checks";
import { ResultForm } from "@/components/ResultForm";
import { GENDERS, TeamFields } from "@/components/academy/TeamFields";
import { addTeam } from "../actions";
import { Card, btn } from "@/components/academy/ManageUi";
import { PortalTitle, Progress } from "@/components/academy/PortalUi";
import { academyPoster } from "@/components/typefaces/academy";
import { ChevronRight, CheckCircle2, Plus, TriangleAlert } from "lucide-react";

export const metadata: Metadata = { title: "ทีมและนักเตะ | พอร์ทัลอคาเดมี" };

export default async function PortalTeamsPage() {
  const { member } = await requireAcademy();
  const teams = await loadTeams(member.academyId);

  return (
    <div className="space-y-6">
      <PortalTitle
        title="ทีมและนักเตะ"
        description="เกณฑ์ข้อ 1.6: นักเตะอย่างน้อย 18 คนต่อรุ่น (รุ่น U12 ลงไป 12 คน) และมีผู้รักษาประตู 2 คน · ข้อมูลนักเตะเห็นเฉพาะอคาเดมีและสมาคมฯ"
      />

      {teams.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-[#9fd0f0] bg-white px-6 py-10 text-center text-sm text-slate-500">ยังไม่มีทีม — เพิ่มทีมแรกด้านล่าง</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => {
            const c = teamCheck({ name: t.name, ageGroup: t.ageGroup, players: t.players });
            const gk = t.players.filter((p) => p.position === "GK").length;
            return (
              <li key={t.id}>
                <Link href={`/academies/portal/teams/${t.id}`} className={`group flex h-full flex-col rounded-2xl border border-t-4 border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgb(15_23_42/0.04)] transition hover:-translate-y-0.5 hover:shadow-md ${c.ok ? "border-t-emerald-500" : "border-t-amber-400"}`}>
                  <div className="flex items-center justify-between">
                    <p className={`${academyPoster.className} text-2xl font-bold text-[#0b1220]`}>{t.name}</p>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#1e96dc]" />
                  </div>
                  <p className="text-xs text-slate-500">
                    U{t.ageGroup} · {GENDERS[t.gender] ?? t.gender}
                  </p>
                  <Progress value={t.players.length} max={minPlayers(t.ageGroup)} className="mt-4" />
                  <p className="mt-2 flex items-center gap-1.5 text-sm">
                    {c.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <TriangleAlert className="h-4 w-4 text-amber-500" />}
                    <span className="text-slate-700">
                      นักเตะ {t.players.length}/{minPlayers(t.ageGroup)} · ผู้รักษาประตู {gk}/2
                    </span>
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Card title="เพิ่มทีม" icon={Plus} tone="emerald">
        <ResultForm action={addTeam} resetOnSuccess successText="เพิ่มทีมแล้ว">
          <TeamFields />
          <button type="submit" className={`${btn.primary} mt-4`}>
            <Plus className="h-4 w-4" />
            เพิ่มทีม
          </button>
        </ResultForm>
      </Card>
    </div>
  );
}
