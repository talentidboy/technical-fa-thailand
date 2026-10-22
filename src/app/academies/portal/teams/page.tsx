import Link from "next/link";
import type { Metadata } from "next";
import { requireAcademy } from "@/lib/academy-portal";
import { loadTeams } from "@/lib/academy-data";
import { teamCheck, minPlayers } from "@/lib/academy-checks";
import { ResultForm } from "@/components/ResultForm";
import { GENDERS, TeamFields } from "@/components/academy/TeamFields";
import { addTeam } from "../actions";
import { ChevronRight, CheckCircle2, Plus, TriangleAlert } from "lucide-react";

export const metadata: Metadata = { title: "ทีมและนักเตะ | พอร์ทัลอคาเดมี" };

export default async function PortalTeamsPage() {
  const { member } = await requireAcademy();
  const teams = await loadTeams(member.academyId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">ทีมและนักเตะ</h1>
        <p className="mt-1 text-sm text-slate-500">
          เกณฑ์ข้อ 1.6: นักเตะอย่างน้อย 18 คนต่อรุ่น (รุ่น U12 ลงไป 12 คน) และมีผู้รักษาประตู 2 คน · ข้อมูลนักเตะเห็นเฉพาะอคาเดมีและสมาคมฯ
        </p>
      </div>

      {teams.length === 0 ? (
        <p className="rounded-3xl border-2 border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-400">ยังไม่มีทีม — เพิ่มทีมแรกด้านล่าง</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => {
            const c = teamCheck({ name: t.name, ageGroup: t.ageGroup, players: t.players });
            const gk = t.players.filter((p) => p.position === "GK").length;
            return (
              <li key={t.id}>
                <Link href={`/academies/portal/teams/${t.id}`} className="group flex h-full flex-col rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-slate-900">{t.name}</p>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500" />
                  </div>
                  <p className="text-xs text-slate-500">
                    U{t.ageGroup} · {GENDERS[t.gender] ?? t.gender}
                  </p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${c.ok ? "bg-emerald-500" : "bg-amber-400"}`} style={{ width: `${Math.min(100, (t.players.length / minPlayers(t.ageGroup)) * 100)}%` }} />
                  </div>
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

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-semibold text-slate-900">เพิ่มทีม</h2>
        <ResultForm action={addTeam} resetOnSuccess successText="เพิ่มทีมแล้ว" className="mt-4">
          <TeamFields />
          <button type="submit" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800">
            <Plus className="h-4 w-4" />
            เพิ่มทีม
          </button>
        </ResultForm>
      </section>
    </div>
  );
}
