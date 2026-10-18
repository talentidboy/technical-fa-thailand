import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { LOGO_URL } from "@/lib/brand";
import { saveAwards } from "../actions";
import { ActionForm } from "@/components/g15/ActionForm";
import {
  INDIVIDUAL_AWARDS,
  TEAM_AWARDS,
  BEST_XI_SLOTS,
  POSITION_GROUP_LABEL,
  positionGroup,
  coachRank,
  type PositionGroup,
} from "@/lib/g15-awards";
import { loadAwards, awardSuggestions } from "@/lib/g15-awards-data";
import { ArrowLeft, Award, ExternalLink, Medal, Sparkles, Trophy, Users } from "lucide-react";

const select =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-g15-400 focus:outline-none focus:ring-2 focus:ring-g15-100";
const input =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-g15-400 focus:outline-none focus:ring-2 focus:ring-g15-100";

const GROUP_ORDER: PositionGroup[] = ["GK", "DF", "MF", "FW"];

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

  const playersById = new Map(teams.flatMap((t) => t.players.map((p) => [p.id, { ...p, teamName: t.name }] as const)));
  const officialsById = new Map(teams.flatMap((t) => t.officials.map((o) => [o.id, { ...o, teamName: t.name }] as const)));
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const playerLabel = (p: { jerseyNumber: number | null; firstNameTh: string; lastNameTh: string }) =>
    `#${p.jerseyNumber ?? "-"} ${p.firstNameTh} ${p.lastNameTh}`;

  const playerOptions = teams.map((t) => (
    <optgroup key={t.id} label={t.name}>
      {t.players.map((p) => (
        <option key={p.id} value={p.id}>
          {playerLabel(p)}
          {p.position ? ` · ${p.position}` : ""}
          {p.isActive ? "" : " (ไม่อยู่ในรายชื่อปัจจุบัน)"}
        </option>
      ))}
    </optgroup>
  ));
  const officialOptions = teams.map((t) => (
    <optgroup key={t.id} label={t.name}>
      {[...t.officials]
        .sort((a, b) => coachRank(a.role) - coachRank(b.role))
        .map((o) => (
          <option key={o.id} value={o.id}>
            {o.firstNameTh} {o.lastNameTh}
            {o.role ? ` — ${o.role}` : ""}
          </option>
        ))}
    </optgroup>
  ));
  // ตัวเลือก Best XI: ตำแหน่งตรงกับช่องขึ้นก่อน แล้วจึงตำแหน่งอื่น
  const xiOptions = (group: PositionGroup) =>
    [group, ...GROUP_ORDER.filter((g) => g !== group)].map((g) => (
      <optgroup key={g} label={`${POSITION_GROUP_LABEL[g]}${g === group ? " (ตรงตำแหน่ง)" : ""}`}>
        {teams.flatMap((t) =>
          t.players
            .filter((p) => positionGroup(p.position) === g)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {playerLabel(p)} — {t.name}
              </option>
            )),
        )}
      </optgroup>
    ));

  const savedId = (key: string) => {
    const a = awards.get(key);
    return a ? (a.playerId ?? a.officialId ?? a.teamId ?? null) : null;
  };
  const xiBySlot = new Map(xi.map((x) => [x.slot, x.playerId]));
  const anySaved = awards.size > 0 || xi.length > 0;

  const suggestion = (key: string) => {
    if (key in sugg.team) {
      const id = sugg.team[key];
      return id ? { id, label: teamById.get(id)?.name ?? "", note: null as string | null } : null;
    }
    const s = sugg.people[key];
    if (!s) return null;
    const p = playersById.get(s.id);
    return p ? { id: s.id, label: `${playerLabel(p)} (${p.teamName})`, note: s.note } : null;
  };

  const medal: Record<string, string> = {
    CHAMPION: "from-amber-300 to-amber-500 text-amber-950",
    RUNNER_UP: "from-slate-200 to-slate-400 text-slate-900",
    THIRD_PLACE: "from-orange-300 to-orange-500 text-orange-950",
  };

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
              เลือกผู้ได้รับรางวัลทั้งหมดแล้วกดบันทึกครั้งเดียว — ขึ้นหน้า &ldquo;รางวัล&rdquo; ของเว็บทันที · เว้นว่าง = ยังไม่ประกาศ
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

        <ActionForm action={saveAwards} successText="บันทึกรางวัลแล้ว — ขึ้นหน้า “รางวัล” ของเว็บแล้ว" className="space-y-8">
          {/* รางวัลทีม */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
              <Trophy className="h-5 w-5 text-amber-500" />
              รางวัลทีม <span className="font-normal text-slate-400">/ Team Awards</span>
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {TEAM_AWARDS.map((a) => {
                const sg = suggestion(a.key);
                return (
                  <label key={a.key} className="flex flex-col gap-2">
                    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full bg-linear-to-r px-3 py-1 text-xs font-black ${medal[a.key]}`}>
                      <Medal className="h-3.5 w-3.5" />
                      {a.th} <span className="font-semibold opacity-70">/ {a.en}</span>
                    </span>
                    <select name={`winner_${a.key}`} defaultValue={String(savedId(a.key) ?? sg?.id ?? "")} className={select}>
                      <option value="">— ยังไม่ประกาศ —</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    {sg && <span className="text-[11px] text-slate-400">จากผลการแข่งขัน: {sg.label}</span>}
                  </label>
                );
              })}
            </div>
          </section>

          {/* รางวัลส่วนบุคคล */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
              <Award className="h-5 w-5 text-amber-500" />
              รางวัลส่วนบุคคล <span className="font-normal text-slate-400">/ Individual Awards</span>
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {INDIVIDUAL_AWARDS.map((a, i) => {
                const sg = suggestion(a.key);
                const saved = awards.get(a.key);
                const current = savedId(a.key) ?? sg?.id ?? null;
                return (
                  <div key={a.key} className="space-y-2 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <p className="text-sm font-bold text-slate-900">
                      {i + 1}. {a.th}
                      <span className="block text-xs font-medium text-slate-400">{a.en}</span>
                    </p>
                    <select name={`winner_${a.key}`} defaultValue={String(current ?? "")} className={select}>
                      <option value="">— ยังไม่ประกาศ —</option>
                      {a.kind === "official" ? officialOptions : playerOptions}
                    </select>
                    <input
                      name={`note_${a.key}`}
                      defaultValue={saved ? (saved.note ?? "") : (sg?.note ?? "")}
                      placeholder="ข้อความประกอบ (ไม่บังคับ) เช่น 7 ประตู"
                      className={input}
                    />
                    {sg && <p className="text-[11px] text-slate-400">แนะนำจากสถิติ: {sg.label}{sg.note ? ` · ${sg.note}` : ""}</p>}
                    {a.kind === "official" && current && officialsById.get(current) && (
                      <p className="text-[11px] text-slate-400">{officialsById.get(current)!.teamName}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ทีมยอดเยี่ยม 4-3-3 holding */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-1 flex items-center gap-2 font-semibold text-slate-900">
              <Users className="h-5 w-5 text-emerald-600" />
              ทีมยอดเยี่ยม <span className="font-normal text-slate-400">/ Best XI · 4-3-3 (Holding)</span>
            </h2>
            <p className="mb-4 text-xs text-slate-500">ตัวเลือกเรียงนักกีฬาที่ตำแหน่งตรงกับช่องขึ้นก่อน (เลือกคนตำแหน่งอื่นได้)</p>
            <div className="space-y-3 rounded-2xl bg-linear-to-b from-emerald-600 to-emerald-700 p-3 sm:p-5">
              {[4, 3, 2, 1, 0].map((row) => {
                const slots = BEST_XI_SLOTS.filter((s) => s.row === row);
                return (
                  <div
                    key={row}
                    className={`mx-auto grid gap-2 ${
                      slots.length === 4 ? "max-w-4xl grid-cols-2 sm:grid-cols-4" : slots.length === 3 ? "max-w-3xl grid-cols-1 sm:grid-cols-3" : slots.length === 2 ? "max-w-xl grid-cols-1 sm:grid-cols-2" : "max-w-xs grid-cols-1"
                    }`}
                  >
                    {slots.map((s) => (
                      <label key={s.slot} className="flex flex-col gap-1 rounded-xl bg-white/95 p-2 shadow-sm">
                        <span className="text-[11px] font-black text-emerald-800">
                          {s.en} <span className="font-semibold text-slate-500">· {s.th}</span>
                        </span>
                        <select name={`xi_${s.slot}`} defaultValue={String(xiBySlot.get(s.slot) ?? "")} className={`${select} py-2 text-xs`}>
                          <option value="">— ยังไม่เลือก —</option>
                          {xiOptions(s.group)}
                        </select>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          </section>

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
