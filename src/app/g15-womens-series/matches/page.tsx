import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { REGION_ORDER } from "@/lib/g15-region";
import { G15Chrome } from "@/components/g15/G15Chrome";
import { PublicMatchesBoard } from "@/components/g15/PublicMatchesBoard";
import { Reveal } from "@/components/g15/Reveal";
import { Calendar } from "lucide-react";

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

      {/* ฮีโร่ไล่สีชุดเดียวกับหน้าอื่นๆ ของ G15 — เนื้อหาหลักลอยทับขอบล่างให้ภาษาภาพเป็นชุดเดียวกันทั้งเว็บ */}
      <section className="relative overflow-hidden bg-linear-to-br from-rose-950 via-rose-900 to-fuchsia-800 pb-20 pt-8 sm:pb-24">
        <div className="absolute inset-x-0 top-0 h-1.5 animate-shimmer-slide bg-linear-to-r from-amber-600 via-amber-200 via-50% to-amber-600 bg-size-[200%_100%]" />
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-rose-200">
            <Calendar className="h-3.5 w-3.5" />
            Matches &amp; Results
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
            ตารางการแข่งขันและผลการแข่งขัน <span className="text-base font-normal text-rose-200">/ Matches &amp; Results</span>
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-20">
        <Reveal>
          <div className="relative z-10 -mt-10 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-rose-950/10 sm:-mt-14 sm:p-6">
            <PublicMatchesBoard matches={matches} regionOrder={REGION_ORDER} />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
