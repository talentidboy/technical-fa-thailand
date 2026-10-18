import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { LOGO_URL } from "@/lib/brand";
import { saveAwards } from "../actions";
import { ActionForm } from "@/components/g15/ActionForm";
import { AwardsEditor } from "@/components/g15/AwardsEditor";
import { ALL_AWARDS, BEST_XI_SLOTS, positionGroup, coachRank } from "@/lib/g15-awards";
import { loadAwards, awardSuggestions } from "@/lib/g15-awards-data";
import { ArrowLeft, Award, ExternalLink, Sparkles } from "lucide-react";

// เลือกผู้ได้รับรางวัลทั้งหมด + ทีมยอดเยี่ยม 4-3-3 (holding) ในหน้าเดียว แล้วบันทึกครั้งเดียว
export default async function G15AwardsManagePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" && user.role !== "STAFF") redirect("/g15-womens-series");

  const [teams, { awards, xi }, sugg] = await Promise.all([
    prisma.g15Team.findMany({
      where: { nationalGroup: { not: null } },
      orderBy: [{ nationalGroup: "asc" }, { nationalSeed: "asc" }],
      include: {
        players: { orderBy: [{ jerseyNumber: { sort: "asc", nulls: "last" } }, { no: "asc" }] },
        officials: { orderBy: [{ no: "asc" }] },
      },
    }),
    loadAwards(),
    awardSuggestions(),
  ]);

  const anySaved = awards.size > 0 || xi.length > 0;
  // ยังไม่เคยบันทึก = ใส่ค่าแนะนำจากผลการแข่งขันไว้ให้ก่อน (แก้ได้ก่อนบันทึก)
  const initialWinners: Record<string, number[]> = {};
  const initialNotes: Record<string, string> = {};
  for (const a of ALL_AWARDS) {
    const saved = awards.get(a.key) ?? [];
    const teamSg = sugg.team[a.key];
    const sgIds = a.kind === "team" ? (teamSg != null ? [teamSg] : []) : (sugg.people[a.key]?.ids ?? []);
    initialWinners[a.key] =
      saved.length > 0 ? saved.map((r) => (r.playerId ?? r.officialId ?? r.teamId)!).filter((x) => x != null) : anySaved ? [] : sgIds;
    initialNotes[a.key] = saved.length > 0 ? (saved[0].note ?? "") : anySaved ? "" : (sugg.people[a.key]?.note ?? "");
  }
  const initialXi = Object.fromEntries(BEST_XI_SLOTS.map((s) => [s.slot, xi.find((x) => x.slot === s.slot)?.playerId ?? null]));
  const suggestions = Object.fromEntries(
    ALL_AWARDS.map((a) => {
      if (a.kind === "team") {
        const id = sugg.team[a.key] ?? null;
        return [a.key, id ? { ids: [id], note: null } : null];
      }
      return [a.key, sugg.people[a.key] ?? null];
    }),
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-indigo-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/g15-womens-series/manage" className="flex min-w-0 items-center gap-2">
            <Image src={LOGO_URL} alt="FA Thailand" width={36} height={36} className="h-9 w-9 flex-none rounded-lg object-cover" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">FA Thailand Technical</p>
              <p className="truncate text-[11px] text-indigo-300">จัดการรางวัล G15</p>
            </div>
          </Link>
          <Link
            href="/g15-womens-series/manage"
            className="inline-flex flex-none items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-indigo-200 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">กลับหน้าจัดการข้อมูล</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Award className="h-6 w-6 text-amber-500" />
              รางวัล &amp; ทีมยอดเยี่ยม
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              กดการ์ดเพื่อเลือกผู้ได้รับรางวัล แล้วกดบันทึกครั้งเดียว — ขึ้นหน้า &ldquo;รางวัล&rdquo; ของเว็บทันที · ว่าง = ยังไม่ประกาศ
            </p>
          </div>
          <a
            href="/g15-womens-series/awards"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <ExternalLink className="h-4 w-4" />
            ดูหน้ารางวัล
          </a>
        </div>

        {!anySaved && (
          <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
            <Sparkles className="mt-0.5 h-4 w-4 flex-none" />
            ยังไม่ได้บันทึกรางวัล — ช่องที่มีค่าอยู่แล้วคือค่าแนะนำจากผลการแข่งขัน (ตรวจแล้วแก้ได้ก่อนบันทึก)
          </p>
        )}

        <ActionForm action={saveAwards} successText="บันทึกรางวัลแล้ว — ขึ้นหน้า “รางวัล” ของเว็บแล้ว" className="space-y-6">
          <AwardsEditor
            teams={teams.map((t) => ({ id: t.id, name: t.name, logoUrl: t.logoUrl, groupName: t.groupName }))}
            players={teams.flatMap((t) =>
              t.players.map((p) => ({
                id: p.id,
                teamId: t.id,
                name: `${p.firstNameTh} ${p.lastNameTh}`,
                number: p.jerseyNumber,
                photoUrl: p.photoUrl,
                group: positionGroup(p.position),
                position: p.position,
                active: p.isActive,
              })),
            )}
            officials={teams.flatMap((t) =>
              t.officials.map((o) => ({ id: o.id, teamId: t.id, name: `${o.firstNameTh} ${o.lastNameTh}`, role: o.role, rank: coachRank(o.role) })),
            )}
            initialWinners={initialWinners}
            initialNotes={initialNotes}
            initialXi={initialXi}
            suggestions={suggestions}
          />
          <div className="sticky bottom-4 z-10 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-g15-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-g15-900/30 hover:bg-g15-700"
            >
              <Award className="h-4 w-4" />
              บันทึกรางวัลทั้งหมด
            </button>
          </div>
        </ActionForm>
      </main>
    </div>
  );
}
