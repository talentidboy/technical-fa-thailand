import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { REGION_ORDER } from "@/lib/g15-region";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { PublicMatchesBoard } from "@/components/g15/PublicMatchesBoard";

export default async function G15MatchesPage() {
  const [user, matches] = await Promise.all([
    getCurrentUser(),
    prisma.g15Match.findMany({
      orderBy: [{ matchDate: "asc" }, { createdAt: "asc" }],
      include: {
        homeTeam: true,
        awayTeam: true,
        goals: { orderBy: [{ minute: "asc" }, { id: "asc" }] },
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <G15Chrome user={user} />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">ตารางการแข่งขันและผลการแข่งขัน</h1>
          <p className="text-sm text-slate-400">Matches &amp; Results</p>
        </div>
        <PublicMatchesBoard matches={matches} regionOrder={REGION_ORDER} />
      </div>
    </div>
  );
}
