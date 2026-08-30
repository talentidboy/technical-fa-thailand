import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { TeamsGrid } from "@/components/g15/TeamsGrid";
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
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">ทีมที่เข้าร่วม</h1>
          <p className="text-sm text-slate-400">Teams</p>
        </div>

        {teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Users className="h-8 w-8 text-slate-400" />
            <p className="text-sm text-slate-500">ยังไม่มีทีมเข้าร่วม</p>
            <p className="text-xs text-slate-400">No teams yet</p>
          </div>
        ) : (
          <TeamsGrid teams={teamsWithCounts} />
        )}
      </div>
    </div>
  );
}
