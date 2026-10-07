import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  getNationalBracket,
  isGroupComplete,
  formatMatchTimeShort,
  toDateTimeLocalValue,
  type BracketTie,
} from "@/lib/g15";
import { REGION_ORDER, parseRegionGroup } from "@/lib/g15-region";
import {
  NATIONAL_GROUPS,
  NATIONAL_SEEDS,
  NATIONAL_ROUNDS,
  ROUND_GROUP_A,
  groupRound,
  isGroupRound,
  roundStyle,
  matchWinnerId,
} from "@/lib/g15-stage";
import {
  updateMatchScore,
  updateMatch,
  deleteMatch,
  createMatch,
  saveNationalGroups,
  generateKnockoutMatches,
} from "./actions";
import { QuickScoreRow } from "@/components/g15/QuickScoreRow";
import { ActionForm } from "@/components/g15/ActionForm";
import { FormWithToast } from "@/components/g15/FormWithToast";
import { ModalTrigger } from "@/components/Modal";
import { KnockoutBracket } from "@/components/g15/KnockoutBracket";
import { TeamBadge } from "@/components/g15/TeamBadge";
import { Field } from "@/components/FormField";
import { Pencil, Trash2, CalendarDays, GitBranch, Users, Check, Trophy, ChevronRight, Plus, Wand2 } from "lucide-react";

const BANGKOK_TZ = "Asia/Bangkok";
const JAIFA_VENUES = [
  "สนามกีฬาศูนย์ฝึกฟุตบอลใจฟ้าอคาเดมี่ 1 จังหวัดลพบุรี",
  "สนามกีฬาศูนย์ฝึกฟุตบอลใจฟ้าอคาเดมี่ 2 จังหวัดลพบุรี",
];

const selectClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

// ชื่อสนามเต็มยาวมาก ("สนามกีฬาศูนย์ฝึกฟุตบอลใจฟ้าอคาเดมี่ 1 จังหวัดลพบุรี") — ย่อให้พอดีแถวในหน้าจัดการ
function shortVenue(venue: string | null) {
  if (!venue) return null;
  return venue.replace(/^สนามกีฬาศูนย์ฝึกฟุตบอล/, "").replace(/\s*จังหวัด\S+$/, "").trim() || venue;
}

function dayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BANGKOK_TZ }).format(date);
}

function dayLabel(date: Date) {
  return date.toLocaleDateString("th-TH-u-ca-gregory", {
    timeZone: BANGKOK_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export async function NationalManage() {
  const [teams, matches] = await Promise.all([
    prisma.g15Team.findMany({ orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
    prisma.g15Match.findMany({
      where: { stage: "NATIONAL" },
      orderBy: [{ matchDate: "asc" }, { matchNo: "asc" }, { createdAt: "asc" }],
      include: { homeTeam: true, awayTeam: true },
    }),
  ]);

  const nationalTeams = teams
    .filter((t) => t.nationalGroup)
    .sort((a, b) => (a.nationalGroup ?? "").localeCompare(b.nationalGroup ?? "") || (a.nationalSeed ?? 9) - (b.nationalSeed ?? 9));
  const bracket = getNationalBracket(teams, matches);
  const tie = (key: BracketTie["key"]) => bracket.find((t) => t.key === key)!;

  // ===== ความคืบหน้า — บอกแอดมินว่าตอนนี้ต้องทำอะไรต่อ =====
  const groupMatches = matches.filter((m) => isGroupRound(m.round));
  const groupFinished = groupMatches.filter((m) => m.status === "FINISHED").length;
  const groupsDone = NATIONAL_GROUPS.every((g) => isGroupComplete(g, matches));
  const semis = [tie("SF1"), tie("SF2")];
  const finals = [tie("THIRD"), tie("FINAL")];
  const semisCreated = semis.every((t) => t.matchId != null);
  const semisDecided = semis.every((t) => t.home.isWinner || t.away.isWinner);
  const finalsCreated = finals.every((t) => t.matchId != null);
  const finalTie = tie("FINAL");
  const champion = finalTie.home.isWinner ? finalTie.home.team : finalTie.away.isWinner ? finalTie.away.team : null;

  const steps = [
    { label: "จัดกลุ่ม A/B", done: nationalTeams.length === 8 },
    { label: `ผลรอบแบ่งกลุ่ม (${groupFinished}/${groupMatches.length || 12})`, done: groupsDone },
    { label: "สร้างคู่รอบรองฯ", done: semisCreated },
    { label: "ผลรอบรองฯ", done: semisDecided },
    { label: "สร้างนัดชิงฯ", done: finalsCreated },
    { label: "ผลนัดชิงฯ", done: !!champion },
  ];
  const currentStep = steps.findIndex((s) => !s.done);

  // ===== นัดการแข่งขัน จัดตามวันแข่ง (วันแข่งจริงแอดมินไล่กรอกผลตามวัน) =====
  const byDay = new Map<string, typeof matches>();
  const undated: typeof matches = [];
  for (const m of matches) {
    if (!m.matchDate) {
      undated.push(m);
      continue;
    }
    const key = dayKey(m.matchDate);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(m);
  }
  const dayKeys = Array.from(byDay.keys()).sort();
  const todayKey = dayKey(new Date());

  const venueOptions = Array.from(new Set([...JAIFA_VENUES, ...matches.map((m) => m.venue).filter((v): v is string => !!v)]));

  const venueDatalist = (
    <datalist id="national-venues">
      {venueOptions.map((v) => (
        <option key={v} value={v} />
      ))}
    </datalist>
  );

  const teamOptions = (list: typeof teams) =>
    list.map((t) => (
      <option key={t.id} value={t.id}>
        {t.nationalGroup ? `${t.nationalGroup}${t.nationalSeed ?? ""} · ` : ""}
        {t.name}
      </option>
    ));

  const matchFormFields = (m?: (typeof matches)[number]) => (
    <>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">
          รอบ<span className="text-red-500"> *</span>
        </span>
        <select name="round" required defaultValue={m?.round ?? ROUND_GROUP_A} className={selectClass}>
          {NATIONAL_ROUNDS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <Field label="นัดที่" name="matchNo" type="number" defaultValue={m?.matchNo != null ? String(m.matchNo) : ""} />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">
          ทีมเหย้า<span className="text-red-500"> *</span>
        </span>
        <select name="homeTeamId" required defaultValue={m ? String(m.homeTeamId) : ""} className={selectClass}>
          <option value="">เลือกทีม...</option>
          {teamOptions(nationalTeams.length > 0 ? nationalTeams : teams)}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">
          ทีมเยือน<span className="text-red-500"> *</span>
        </span>
        <select name="awayTeamId" required defaultValue={m ? String(m.awayTeamId) : ""} className={selectClass}>
          <option value="">เลือกทีม...</option>
          {teamOptions(nationalTeams.length > 0 ? nationalTeams : teams)}
        </select>
      </label>
      <Field
        label="วันเวลาแข่งขัน"
        name="matchDate"
        type="datetime-local"
        defaultValue={m ? toDateTimeLocalValue(m.matchDate) : ""}
      />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700">สนาม</span>
        <input
          name="venue"
          list="national-venues"
          defaultValue={m?.venue ?? ""}
          placeholder="เลือกหรือพิมพ์ชื่อสนาม"
          className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </label>
    </>
  );

  const matchRow = (m: (typeof matches)[number]) => (
    <QuickScoreRow
      key={m.id}
      action={updateMatchScore}
      detailsHref={`/g15-womens-series/manage/matches/${m.id}`}
      match={{
        id: m.id,
        round: m.round,
        matchNo: m.matchNo,
        status: m.status,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        homePenalty: m.homePenalty,
        awayPenalty: m.awayPenalty,
        timeLabel: m.matchDate ? `${formatMatchTimeShort(m.matchDate)} · ${m.round}` : m.round,
        venueLabel: shortVenue(m.venue),
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
      }}
      extra={
        <ModalTrigger
          label={`แก้ไขนัด${m.matchNo != null ? `ที่ ${m.matchNo}` : ""}: ${m.homeTeam.name} vs ${m.awayTeam.name}`}
          buttonContent={<Pencil className="h-3.5 w-3.5" />}
          buttonClassName="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <FormWithToast action={updateMatch} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={m.id} />
            {matchFormFields(m)}
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-emerald-200 transition-colors hover:bg-emerald-700"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </FormWithToast>
          <form action={deleteMatch} className="mt-6 border-t border-slate-100 pt-4">
            <input type="hidden" name="id" value={m.id} />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              ลบนัดนี้ (ลบผู้ทำประตู/ไลน์อัพของนัดนี้ด้วย)
            </button>
          </form>
        </ModalTrigger>
      }
    />
  );

  // ===== ฟอร์มสร้างนัดน็อกเอาต์อัตโนมัติ =====
  const generator = (phase: "SEMI" | "FINAL", ties: BracketTie[], enabled: boolean, hint: string) => (
    <ActionForm action={generateKnockoutMatches} successText="สร้างนัดเรียบร้อย" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <input type="hidden" name="phase" value={phase} />
      <div className="flex items-center gap-2">
        <Wand2 className="h-4 w-4 text-rose-600" />
        <h4 className="text-sm font-semibold text-slate-900">
          {phase === "SEMI" ? "สร้างคู่รอบรองชนะเลิศ (นัดที่ 13-14)" : "สร้างนัดชิงที่ 3 และชิงชนะเลิศ (นัดที่ 15-16)"}
        </h4>
      </div>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
      <div className="mt-4 space-y-3">
        {ties.map((t) => (
          <div key={t.key} className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">
              นัดที่ {t.matchNo} · {t.round}:{" "}
              <span className={t.home.team ? "text-slate-900" : "text-slate-400"}>{t.home.team?.name ?? t.home.placeholder}</span>
              {" vs "}
              <span className={t.away.team ? "text-slate-900" : "text-slate-400"}>{t.away.team?.name ?? t.away.placeholder}</span>
              {t.matchId != null && <span className="ml-1.5 text-emerald-600">✓ สร้างแล้ว</span>}
            </p>
            {t.matchId == null && (
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  type="datetime-local"
                  name={`matchDate_${t.key}`}
                  aria-label={`วันเวลา นัดที่ ${t.matchNo}`}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                />
                <input
                  name={`venue_${t.key}`}
                  list="national-venues"
                  placeholder="สนาม (เว้นว่างได้ แก้ทีหลังได้)"
                  aria-label={`สนาม นัดที่ ${t.matchNo}`}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400"
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <button
        type="submit"
        disabled={!enabled}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-rose-200 transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
      >
        <Wand2 className="h-4 w-4" />
        สร้างนัดจากผลการแข่งขัน
      </button>
    </ActionForm>
  );

  // ===== จัดกลุ่ม — เลือกทีมลงแต่ละตำแหน่ง A1-B4 (ตัวเลือกจัดตามภาคของรอบภูมิภาค) =====
  const teamsByRegion = REGION_ORDER.map((region) => ({
    region,
    teams: teams.filter((t) => parseRegionGroup(t.groupName)?.region === region),
  })).filter((r) => r.teams.length > 0);
  const otherTeams = teams.filter((t) => !REGION_ORDER.includes(parseRegionGroup(t.groupName)?.region ?? ""));
  const slotTeam = (group: string, seed: number) => teams.find((t) => t.nationalGroup === group && t.nationalSeed === seed);

  return (
    <div className="space-y-8">
      {venueDatalist}

      {/* ความคืบหน้า */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-slate-900">ความคืบหน้ารอบชิงแชมป์ประเทศ</h2>
          {champion && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              <Trophy className="h-3.5 w-3.5" />
              แชมป์: {champion.name}
            </span>
          )}
        </div>
        <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {steps.map((s, i) => {
            const isCurrent = i === currentStep;
            return (
              <li
                key={s.label}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium ${
                  s.done
                    ? "bg-emerald-50 text-emerald-700"
                    : isCurrent
                      ? "bg-rose-600 text-white shadow-sm shadow-rose-200"
                      : "bg-slate-50 text-slate-400"
                }`}
              >
                <span
                  className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[10px] font-bold ${
                    s.done ? "bg-emerald-500 text-white" : isCurrent ? "bg-white text-rose-600" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {s.done ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                {s.label}
              </li>
            );
          })}
        </ol>
      </div>

      {/* บันทึกผล — จัดตามวันแข่ง */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-rose-600" />
            <h2 className="text-lg font-bold text-slate-900">นัดการแข่งขันและผล</h2>
          </div>
          <ModalTrigger
            label="เพิ่มนัดการแข่งขัน (รอบชิงแชมป์ประเทศ)"
            buttonContent={
              <>
                <Plus className="h-4 w-4" />
                เพิ่มนัดเอง
              </>
            }
            buttonClassName="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <FormWithToast action={createMatch} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input type="hidden" name="stage" value="NATIONAL" />
              {matchFormFields()}
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-rose-200 transition-colors hover:bg-rose-700"
                >
                  เพิ่มนัด
                </button>
              </div>
            </FormWithToast>
          </ModalTrigger>
        </div>
        <p className="text-xs text-slate-500">
          กรอกสกอร์แล้วกด &quot;บันทึกผล&quot; ได้เลยทีละนัด (เว้นว่างทั้งสองช่อง = ยังไม่แข่ง) · นัดน็อกเอาต์ที่เสมอจะมีช่องจุดโทษให้กรอกเพิ่ม ·
          ไลน์อัพ/ผู้ทำประตู/ใบเหลือง-แดง กดปุ่ม &quot;ผู้ทำประตู/สถิติ&quot;
        </p>

        {matches.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
            ยังไม่มีนัดการแข่งขันรอบชิงแชมป์ประเทศ
          </p>
        ) : (
          <>
            {dayKeys.map((key) => {
              const dayMatches = byDay.get(key)!;
              const done = dayMatches.filter((m) => m.status === "FINISHED").length;
              const isToday = key === todayKey;
              return (
                <div
                  key={key}
                  className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${isToday ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200"}`}
                >
                  <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-2.5">
                    <p className="text-sm font-semibold text-slate-800">{dayLabel(dayMatches[0].matchDate!)}</p>
                    {isToday && <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">วันนี้</span>}
                    <span className={`ml-auto text-xs font-medium ${done === dayMatches.length ? "text-emerald-600" : "text-slate-400"}`}>
                      บันทึกผลแล้ว {done}/{dayMatches.length}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100">{dayMatches.map(matchRow)}</div>
                </div>
              );
            })}
            {undated.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-800">
                  ยังไม่กำหนดวันแข่ง
                </div>
                <div className="divide-y divide-slate-100">{undated.map(matchRow)}</div>
              </div>
            )}
          </>
        )}
      </section>

      {/* รอบน็อกเอาต์ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-rose-600" />
          <h2 className="text-lg font-bold text-slate-900">รอบน็อกเอาต์</h2>
        </div>
        <KnockoutBracket ties={bracket} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {generator(
            "SEMI",
            semis,
            groupsDone && !semisCreated,
            groupsDone
              ? "ทีมที่ 1-2 ของแต่ละกลุ่มคำนวณจากตารางคะแนนแล้ว (คะแนน → ผลต่างประตู → ประตูได้) ตรวจสอบก่อนกดสร้าง"
              : `บันทึกผลรอบแบ่งกลุ่มให้ครบก่อน (ตอนนี้ ${groupFinished}/${groupMatches.length}) ระบบจะดึงที่ 1-2 ของแต่ละกลุ่มมาจับคู่ให้อัตโนมัติ`,
          )}
          {generator(
            "FINAL",
            finals,
            semisDecided && !finalsCreated,
            semisDecided
              ? "ผู้ชนะรอบรองฯ ไปชิงชนะเลิศ ผู้แพ้ไปชิงที่ 3"
              : "บันทึกผลรอบรองฯ ให้ได้ผู้ชนะก่อน (เสมอให้กรอกจุดโทษ) แล้วจึงสร้างนัดชิงได้",
          )}
        </div>
      </section>

      {/* จัดกลุ่ม */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-rose-600" />
          <h2 className="text-lg font-bold text-slate-900">ทีมและการจัดกลุ่ม</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {NATIONAL_GROUPS.map((group) => {
            const style = roundStyle(groupRound(group));
            return (
              <div key={group} className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ${style.ring}`}>
                <div className={`px-5 py-2.5 text-sm font-bold text-white ${style.bg}`}>{groupRound(group)}</div>
                <ul className="divide-y divide-slate-100">
                  {NATIONAL_SEEDS.map((seed) => {
                    const t = slotTeam(group, seed);
                    const played = t
                      ? matches.filter((m) => m.homeTeamId === t.id || m.awayTeamId === t.id)
                      : [];
                    const wins = t ? played.filter((m) => matchWinnerId(m) === t.id).length : 0;
                    return (
                      <li key={seed}>
                        {t ? (
                          <Link
                            href={`/g15-womens-series/manage/teams/${t.id}`}
                            className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-slate-50"
                          >
                            <span className="w-6 flex-none text-xs font-extrabold text-slate-400">
                              {group}
                              {seed}
                            </span>
                            <TeamBadge team={t} size="sm" />
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{t.name}</span>
                            <span className="flex-none text-[10px] text-slate-400">
                              {played.length} นัด · ชนะ {wins}
                            </span>
                            <span className="flex flex-none items-center text-[11px] font-medium text-rose-600">
                              นักกีฬา
                              <ChevronRight className="h-3.5 w-3.5" />
                            </span>
                          </Link>
                        ) : (
                          <p className="px-5 py-2.5 text-xs text-slate-400">
                            {group}
                            {seed} — ยังไม่ได้เลือกทีม
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-700 [&::-webkit-details-marker]:hidden">
            <Pencil className="h-4 w-4 text-slate-400" />
            เปลี่ยนทีมในผังกลุ่ม (A1-B4)
            <ChevronRight className="ml-auto h-4 w-4 text-slate-400 transition-transform group-open:rotate-90" />
          </summary>
          <ActionForm action={saveNationalGroups} className="border-t border-slate-100 p-5">
            <p className="mb-4 text-xs text-slate-500">
              เปลี่ยนแค่ตำแหน่งในผัง — นัดการแข่งขันที่สร้างไว้แล้วไม่เปลี่ยนตาม (ถ้าสลับทีมหลังสร้างนัด ให้แก้ทีมในนัดนั้นด้วย)
            </p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {NATIONAL_GROUPS.map((group) => (
                <div key={group} className="space-y-2.5">
                  <p className="text-xs font-bold text-slate-700">{groupRound(group)}</p>
                  {NATIONAL_SEEDS.map((seed) => (
                    <label key={seed} className="flex items-center gap-2">
                      <span className="w-7 flex-none text-xs font-extrabold text-slate-500">
                        {group}
                        {seed}
                      </span>
                      <select
                        name={`slot_${group}_${seed}`}
                        defaultValue={slotTeam(group, seed)?.id.toString() ?? ""}
                        className={selectClass}
                      >
                        <option value="">— ว่าง —</option>
                        {teamsByRegion.map(({ region, teams: regionTeams }) => (
                          <optgroup key={region} label={region}>
                            {regionTeams.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                        {otherTeams.length > 0 && (
                          <optgroup label="อื่นๆ">
                            {otherTeams.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </label>
                  ))}
                </div>
              ))}
            </div>
            <button
              type="submit"
              className="mt-5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-emerald-200 transition-colors hover:bg-emerald-700"
            >
              บันทึกผังกลุ่ม
            </button>
          </ActionForm>
        </details>
      </section>
    </div>
  );
}
