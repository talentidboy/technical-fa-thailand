import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createTeam, deleteTeam, createMatch, deleteMatch, updateMatch } from "./actions";
import { Field, SelectField } from "@/components/FormField";
import { LOGO_URL } from "@/lib/brand";
import { toDateTimeLocalValue } from "@/lib/g15";
import { REGION_ORDER, REGION_STYLE, DEFAULT_REGION_STYLE, parseRegionGroup } from "@/lib/g15-region";
import { ManageTabs } from "@/components/g15/ManageTabs";
import { ModalTrigger } from "@/components/g15/Modal";
import { Trophy, Trash2, ArrowLeft, MapPin, ChevronRight, ChevronDown } from "lucide-react";

export default async function G15ManagePage() {
  const currentUser = await getCurrentUser();
  if (
    !currentUser ||
    (currentUser.role !== "ADMIN" && currentUser.role !== "STAFF")
  ) {
    redirect("/g15-womens-series");
  }

  const [teams, matches, playerCounts, officialCounts] = await Promise.all([
    prisma.g15Team.findMany({ orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
    prisma.g15Match.findMany({
      orderBy: [{ matchDate: "asc" }, { createdAt: "asc" }],
      include: { homeTeam: true, awayTeam: true },
    }),
    prisma.g15Player.groupBy({ by: ["teamId"], _count: { id: true } }),
    prisma.g15Official.groupBy({ by: ["teamId"], _count: { id: true } }),
  ]);

  const playerCountByTeam = new Map(playerCounts.map((p) => [p.teamId, p._count.id]));
  const officialCountByTeam = new Map(officialCounts.map((o) => [o.teamId, o._count.id]));

  const teamOptions = teams.map((t) => ({
    value: String(t.id),
    label: t.groupName ? `${t.name} (${t.groupName})` : t.name,
  }));

  // จัดทีมเป็นกลุ่มตามภูมิภาค → กลุ่มย่อย (A/B) เหมือนหน้าสาธารณะ เพื่อให้จัดการง่ายขึ้นแทนลิสต์ยาว 43 ทีมรวด
  const teamsByRegion = new Map<string, Map<string, typeof teams>>();
  const ungroupedTeams: typeof teams = [];
  for (const team of teams) {
    const parsed = parseRegionGroup(team.groupName);
    if (!parsed) {
      ungroupedTeams.push(team);
      continue;
    }
    if (!teamsByRegion.has(parsed.region)) teamsByRegion.set(parsed.region, new Map());
    const groupMap = teamsByRegion.get(parsed.region)!;
    if (!groupMap.has(parsed.letter)) groupMap.set(parsed.letter, []);
    groupMap.get(parsed.letter)!.push(team);
  }
  const regionOrder = [
    ...REGION_ORDER.filter((r) => teamsByRegion.has(r)),
    ...Array.from(teamsByRegion.keys()).filter((r) => !REGION_ORDER.includes(r)),
  ];

  // จัดนัดการแข่งขันเป็นกลุ่มตาม round (ส่วนใหญ่คือชื่อภาค) แล้วพับแต่ละนัดไว้ในกล่องพับ/ขยาย
  const matchesByRound = matches.reduce<Record<string, typeof matches>>((acc, match) => {
    (acc[match.round] ??= []).push(match);
    return acc;
  }, {});

  const addTeamForm = (
    <form action={createTeam} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="ชื่อทีม" name="name" required placeholder="สโมสร A" />
      <Field label="กลุ่ม" name="groupName" placeholder="ภาคใต้ - กลุ่ม A" />
      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-sm font-medium text-slate-700">โลโก้ทีม</span>
        <input
          name="logo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-rose-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-rose-600"
        />
      </label>
      <div className="sm:col-span-2">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-rose-200 transition-colors hover:bg-rose-700"
        >
          เพิ่มทีม
        </button>
      </div>
    </form>
  );

  const addMatchForm =
    teams.length < 2 ? (
      <p className="text-sm text-slate-400">ต้องมีทีมอย่างน้อย 2 ทีมก่อนจึงจะเพิ่มนัดการแข่งขันได้</p>
    ) : (
      <form action={createMatch} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="รอบการแข่งขัน"
          name="round"
          required
          placeholder="ภาคใต้ / กลุ่ม A - นัดที่ 1 / รอบรองชนะเลิศ"
        />
        <Field label="วันเวลาแข่งขัน" name="matchDate" type="datetime-local" />
        <Field label="สนาม" name="venue" placeholder="สนามกีฬาแห่งชาติ" />
        <SelectField label="ทีมเหย้า" name="homeTeamId" options={teamOptions} required />
        <SelectField label="ทีมเยือน" name="awayTeamId" options={teamOptions} required />
        <div className="flex items-end sm:col-span-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-amber-200 transition-colors hover:bg-amber-600"
          >
            เพิ่มนัดการแข่งขัน
          </button>
        </div>
      </form>
    );

  const teamsContent = (
    <div className="space-y-6">
      <ModalTrigger
        label="เพิ่มทีมใหม่"
        buttonClassName="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-rose-200 transition-colors hover:bg-rose-700"
      >
        {addTeamForm}
      </ModalTrigger>

      {regionOrder.map((region) => {
        const style = REGION_STYLE[region] ?? DEFAULT_REGION_STYLE;
        const groupMap = teamsByRegion.get(region)!;
        const letters = Array.from(groupMap.keys()).sort();
        const regionTotal = letters.reduce((s, l) => s + groupMap.get(l)!.length, 0);

        return (
          <div
            key={region}
            className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ${style.ring}`}
          >
            <div className={`flex items-center gap-2.5 px-5 py-3 ${style.bg}`}>
              <MapPin className="h-4 w-4 text-white" />
              <h3 className="font-bold text-white">{region}</h3>
              <span className="ml-auto text-xs font-medium text-white/80">{regionTotal} ทีม</span>
            </div>
            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
              {letters.map((letter) => (
                <div key={letter}>
                  <p className={`mb-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${style.light} ${style.text}`}>
                    กลุ่ม {letter}
                  </p>
                  <ul className="space-y-1">
                    {groupMap.get(letter)!.map((team) => {
                      const playerCount = playerCountByTeam.get(team.id) ?? 0;
                      const officialCount = officialCountByTeam.get(team.id) ?? 0;
                      const badge = team.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={team.logoUrl} alt="" className="h-6 w-6 flex-none rounded-full object-cover" />
                      ) : (
                        <span
                          className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-[10px] font-bold text-white ${style.bg}`}
                        >
                          {team.name.charAt(0)}
                        </span>
                      );

                      return (
                        <li key={team.id} className="flex items-center gap-2 rounded-lg hover:bg-slate-50">
                          <Link
                            href={`/g15-womens-series/manage/teams/${team.id}`}
                            className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5 py-1.5 text-sm text-slate-700"
                          >
                            {badge}
                            <span className="min-w-0 flex-1 truncate">{team.name}</span>
                            <span className="flex-none text-[10px] text-slate-400">
                              {playerCount} นักกีฬา · {officialCount} จนท.
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 flex-none text-slate-400" />
                          </Link>
                          <form action={deleteTeam} className="flex-none pr-1.5">
                            <input type="hidden" name="id" value={team.id} />
                            <button
                              type="submit"
                              aria-label="ลบทีม"
                              className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </form>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {ungroupedTeams.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3">
            <h3 className="font-semibold text-slate-900">ยังไม่จัดกลุ่ม</h3>
          </div>
          <ul className="divide-y divide-slate-100">
            {ungroupedTeams.map((team) => (
              <li key={team.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <Link
                  href={`/g15-womens-series/manage/teams/${team.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <span className="font-medium text-slate-900">{team.name}</span>
                  <ChevronRight className="h-3.5 w-3.5 flex-none text-slate-400" />
                </Link>
                <form action={deleteTeam}>
                  <input type="hidden" name="id" value={team.id} />
                  <button
                    type="submit"
                    aria-label="ลบทีม"
                    className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const matchesContent = (
    <div className="space-y-6">
      <ModalTrigger
        label="เพิ่มนัดการแข่งขัน"
        buttonClassName="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-amber-200 transition-colors hover:bg-amber-600"
      >
        {addMatchForm}
      </ModalTrigger>

      {matches.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
          ยังไม่มีนัดการแข่งขัน
        </p>
      ) : (
        Object.entries(matchesByRound).map(([round, roundMatches]) => {
          const style = REGION_STYLE[round] ?? DEFAULT_REGION_STYLE;
          return (
            <div
              key={round}
              className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ${style.ring}`}
            >
              <div className={`flex items-center gap-2.5 px-5 py-3 ${style.bg}`}>
                <Trophy className="h-4 w-4 text-white" />
                <h3 className="font-bold text-white">{round}</h3>
                <span className="ml-auto text-xs font-medium text-white/80">{roundMatches.length} นัด</span>
              </div>
              <div className="divide-y divide-slate-100">
                {roundMatches.map((match) => (
                  <details key={match.id} className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                      <ChevronDown className="h-3.5 w-3.5 flex-none text-slate-400 transition-transform group-open:rotate-180" />
                      <span className="min-w-0 flex-1 truncate text-sm">
                        <span className="font-medium text-slate-900">{match.homeTeam.name}</span>
                        <span className="mx-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold tabular-nums text-slate-700">
                          {match.homeScore ?? "-"} - {match.awayScore ?? "-"}
                        </span>
                        <span className="font-medium text-slate-900">{match.awayTeam.name}</span>
                      </span>
                      <span
                        className={`flex-none rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          match.status === "FINISHED"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {match.status === "FINISHED" ? "จบแล้ว" : "ยังไม่แข่ง"}
                      </span>
                    </summary>

                    <div className="border-t border-slate-100 px-5 py-4">
                      <form action={updateMatch} className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                        <input type="hidden" name="id" value={match.id} />
                        <div className="col-span-2">
                          <Field label="รอบการแข่งขัน" name="round" required defaultValue={match.round} />
                        </div>
                        <SelectField
                          label="ทีมเหย้า"
                          name="homeTeamId"
                          options={teamOptions}
                          required
                          defaultValue={String(match.homeTeamId)}
                        />
                        <SelectField
                          label="ทีมเยือน"
                          name="awayTeamId"
                          options={teamOptions}
                          required
                          defaultValue={String(match.awayTeamId)}
                        />
                        <Field
                          label="วันเวลาแข่งขัน"
                          name="matchDate"
                          type="datetime-local"
                          defaultValue={toDateTimeLocalValue(match.matchDate)}
                        />
                        <Field label="สนาม" name="venue" defaultValue={match.venue ?? ""} />
                        <div className="flex flex-col gap-1.5">
                          <span className="text-sm font-medium text-slate-700">ผลสกอร์</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              name="homeScore"
                              min={0}
                              defaultValue={match.homeScore ?? ""}
                              placeholder="-"
                              className="w-14 rounded-lg border border-slate-200 px-2 py-2.5 text-center text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                            <span className="text-slate-400">:</span>
                            <input
                              type="number"
                              name="awayScore"
                              min={0}
                              defaultValue={match.awayScore ?? ""}
                              placeholder="-"
                              className="w-14 rounded-lg border border-slate-200 px-2 py-2.5 text-center text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                          </div>
                        </div>
                        <div className="col-span-2 flex items-end gap-2 sm:col-span-4 lg:col-span-7">
                          <button
                            type="submit"
                            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                          >
                            บันทึก
                          </button>
                        </div>
                      </form>
                      <form action={deleteMatch} className="mt-2">
                        <input type="hidden" name="id" value={match.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          ลบนัดนี้
                        </button>
                      </form>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-indigo-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <Link href="/g15-womens-series" className="flex items-center gap-2">
            <Image
              src={LOGO_URL}
              alt="FA Thailand"
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-cover"
            />
            <div>
              <p className="text-sm font-bold text-white">
                FA Thailand Technical
              </p>
              <p className="text-[11px] text-indigo-300">
                จัดการข้อมูล G15 Women&apos;s Football Series
              </p>
            </div>
          </Link>
          <Link
            href="/g15-womens-series"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับหน้า G15
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            จัดการข้อมูล G15 Women&apos;s Football Series
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            ทีม ({teams.length}) และนัดการแข่งขัน ({matches.length}) จัดกลุ่มตามภาคให้จัดการง่ายขึ้น — กดชื่อทีมเพื่อแก้ไขนักกีฬาและเจ้าหน้าที่
          </p>
        </div>

        <ManageTabs teams={teamsContent} matches={matchesContent} />
      </div>
    </div>
  );
}
