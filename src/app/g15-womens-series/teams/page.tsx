import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { TeamsGrid } from "@/components/g15/TeamsGrid";
import { Reveal } from "@/components/g15/Reveal";
import { Users } from "lucide-react";

export default async function G15TeamsPage() {
  const [user, teams, players, officials] = await Promise.all([
    getCurrentUser(),
    prisma.g15Team.findMany({ orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
    // แค่ตัวนับต่อทีมสำหรับหน้ารวม — รายละเอียดเต็มไปอยู่หน้าโปรไฟล์ทีมแทน
    prisma.g15Player.groupBy({ by: ["teamId"], _count: { id: true } }),
    prisma.g15Official.groupBy({ by: ["teamId"], _count: { id: true } }),
  ]);

  const playerCountByTeam = new Map(players.map((p) => [p.teamId, p._count.id]));
  const officialCountByTeam = new Map(officials.map((o) => [o.teamId, o._count.id]));

  const teamsWithCounts = teams.map((t) => ({
    id: t.id,
    name: t.name,
    logoUrl: t.logoUrl,
    groupName: t.groupName,
    playerCount: playerCountByTeam.get(t.id) ?? 0,
    officialCount: officialCountByTeam.get(t.id) ?? 0,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <G15Chrome user={user} />

      {/* ฮีโร่ไล่สีชุดเดียวกับหน้าอื่นๆ ของ G15 — เนื้อหาหลักลอยทับขอบล่างให้ภาษาภาพเป็นชุดเดียวกันทั้งเว็บ */}
      <section className="relative overflow-hidden bg-linear-to-br from-rose-950 via-rose-900 to-fuchsia-800 pb-20 pt-8 sm:pb-24">
        <div className="absolute inset-x-0 top-0 h-1.5 animate-shimmer-slide bg-linear-to-r from-amber-600 via-amber-200 via-50% to-amber-600 bg-size-[200%_100%]" />
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-rose-200">
            <Users className="h-3.5 w-3.5" />
            Teams
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
            ทีมที่เข้าร่วม <span className="text-base font-normal text-rose-200">/ Teams</span>
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-20">
        {teams.length === 0 ? (
          <div className="relative z-10 -mt-10 flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-xl shadow-rose-950/10 sm:-mt-14">
            <Users className="h-8 w-8 text-slate-400" />
            <p className="text-sm text-slate-500">ยังไม่มีทีมเข้าร่วม</p>
            <p className="text-xs text-slate-400">No teams yet</p>
          </div>
        ) : (
          <Reveal>
            <div className="relative z-10 -mt-10 sm:-mt-14">
              <TeamsGrid teams={teamsWithCounts} />
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
