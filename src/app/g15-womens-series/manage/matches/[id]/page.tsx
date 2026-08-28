import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  updateMatchOfficials,
  updateLineup,
  createGoalsBulk,
  updateGoal,
  deleteGoal,
  createSubstitutionsBulk,
  updateSubstitution,
  deleteSubstitution,
  createCardsBulk,
  updateCard,
  deleteCard,
} from "../../actions";
import { Field, SelectField } from "@/components/FormField";
import { TeamBadge } from "@/components/g15/TeamBadge";
import { GoalsBulkForm, SubstitutionsBulkForm, CardsBulkForm } from "@/components/g15/BulkStatForms";
import { LOGO_URL } from "@/lib/brand";
import { ArrowLeft, ClipboardList, Target, LogIn, Trash2, ChevronDown, ExternalLink, Users } from "lucide-react";

const fieldClass =
  "w-full flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

function TeamSelect({
  name,
  homeTeam,
  awayTeam,
  defaultValue,
  required = true,
}: {
  name: string;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  defaultValue?: number;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">
        ทีม{required && <span className="text-red-500"> *</span>}
      </span>
      <select name={name} required={required} defaultValue={defaultValue ? String(defaultValue) : ""} className={fieldClass}>
        <option value="">เลือกทีม...</option>
        <option value={homeTeam.id}>{homeTeam.name} (เหย้า)</option>
        <option value={awayTeam.id}>{awayTeam.name} (เยือน)</option>
      </select>
    </label>
  );
}

type RosterPlayer = {
  id: number;
  firstNameTh: string;
  lastNameTh: string;
  jerseyNumber: number | null;
};

// เลือกผู้ทำประตูจากทะเบียนนักกีฬาของทั้งสองทีม — เลือกแล้วจะผูก player_id ให้อัตโนมัติ
// เว้นว่างไว้ได้ถ้าหาไม่เจอในทะเบียน แล้วไปกรอกทีม/ชื่อเองด้านล่างแทน (ใช้กับฟอร์มแก้ไขรายการเดิม)
function PlayerSelect({
  homeTeam,
  awayTeam,
  homePlayers,
  awayPlayers,
  defaultValue,
}: {
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  homePlayers: RosterPlayer[];
  awayPlayers: RosterPlayer[];
  defaultValue?: number | null;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">เลือกจากทะเบียนนักกีฬา</span>
      <select name="playerId" defaultValue={defaultValue ? String(defaultValue) : ""} className={fieldClass}>
        <option value="">— ไม่พบในทะเบียน / กรอกเองด้านล่าง —</option>
        <optgroup label={homeTeam.name}>
          {homePlayers.map((p) => (
            <option key={p.id} value={p.id}>
              #{p.jerseyNumber ?? "-"} {p.firstNameTh} {p.lastNameTh}
            </option>
          ))}
        </optgroup>
        <optgroup label={awayTeam.name}>
          {awayPlayers.map((p) => (
            <option key={p.id} value={p.id}>
              #{p.jerseyNumber ?? "-"} {p.firstNameTh} {p.lastNameTh}
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  );
}

// ตารางไลน์อัพของทีมเดียว — ตัวจริง/ตัวสำรอง/กัปตัน เป็น radio/checkbox ในฟอร์มเดียวกับอีกทีม บันทึกครั้งเดียวทั้งคู่
function LineupTeamTable({
  team,
  players,
  lineupByPlayerId,
}: {
  team: { id: number; name: string };
  players: RosterPlayer[];
  lineupByPlayerId: Map<number, { status: string; isCaptain: boolean }>;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-slate-500">{team.name}</p>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-2 py-1.5 text-left">ผู้เล่น</th>
              <th className="px-2 py-1.5 text-center">ไม่ลง</th>
              <th className="px-2 py-1.5 text-center">ตัวจริง</th>
              <th className="px-2 py-1.5 text-center">สำรอง</th>
              <th className="px-2 py-1.5 text-center">กัปตัน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {players.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-2 py-4 text-center text-slate-400">
                  ยังไม่มีนักกีฬาในทะเบียนของทีมนี้
                </td>
              </tr>
            ) : (
              players.map((p) => {
                const current = lineupByPlayerId.get(p.id);
                return (
                  <tr key={p.id}>
                    <td className="max-w-32 truncate px-2 py-1.5 text-slate-700 sm:max-w-none">
                      #{p.jerseyNumber ?? "-"} {p.firstNameTh} {p.lastNameTh}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input type="radio" name={`status_${p.id}`} value="" defaultChecked={!current} />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input
                        type="radio"
                        name={`status_${p.id}`}
                        value="STARTING"
                        defaultChecked={current?.status === "STARTING"}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input
                        type="radio"
                        name={`status_${p.id}`}
                        value="SUBSTITUTE"
                        defaultChecked={current?.status === "SUBSTITUTE"}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <input type="checkbox" name={`captain_${p.id}`} defaultChecked={current?.isCaptain ?? false} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function G15ManageMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  if (currentUser.role !== "ADMIN" && currentUser.role !== "STAFF") {
    redirect("/g15-womens-series");
  }

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const match = await prisma.g15Match.findUnique({
    where: { id },
    include: {
      homeTeam: true,
      awayTeam: true,
      goals: { orderBy: [{ minute: "asc" }, { id: "asc" }] },
      substitutions: { orderBy: [{ minute: "asc" }, { id: "asc" }] },
      cards: { orderBy: [{ minute: "asc" }, { id: "asc" }] },
      lineups: true,
    },
  });
  if (!match) notFound();

  const teamById = (teamId: number) => (teamId === match.homeTeamId ? match.homeTeam : match.awayTeam);

  const [rosterPlayers, rosterOfficials] = await Promise.all([
    prisma.g15Player.findMany({
      where: { teamId: { in: [match.homeTeamId, match.awayTeamId] } },
      orderBy: [{ jerseyNumber: { sort: "asc", nulls: "last" } }, { no: "asc" }],
      select: { id: true, teamId: true, firstNameTh: true, lastNameTh: true, jerseyNumber: true },
    }),
    prisma.g15Official.findMany({
      where: { teamId: { in: [match.homeTeamId, match.awayTeamId] } },
      orderBy: [{ no: "asc" }],
      select: { id: true, teamId: true, firstNameTh: true, lastNameTh: true, role: true },
    }),
  ]);
  const homePlayers = rosterPlayers.filter((p) => p.teamId === match.homeTeamId);
  const awayPlayers = rosterPlayers.filter((p) => p.teamId === match.awayTeamId);
  const homeOfficials = rosterOfficials.filter((o) => o.teamId === match.homeTeamId);
  const awayOfficials = rosterOfficials.filter((o) => o.teamId === match.awayTeamId);

  const lineupByPlayerId = new Map(match.lineups.map((l) => [l.playerId, { status: l.status, isCaptain: l.isCaptain }]));
  // เหลือเฉพาะคนที่อยู่ในไลน์อัพจริงสำหรับช่องเลือกในตารางเพิ่มผู้ทำประตู/เปลี่ยนตัว — เช็กเป็นรายทีม
  // ถ้าทีมนั้นยังไม่ได้บันทึกไลน์อัพเลย ใช้ทั้งทีมไปก่อนกันติดล็อก (ไม่งั้นทีมที่ยังไม่กรอกไลน์อัพจะกลายเป็นช่องว่างเปล่าๆ)
  const homeInLineup = new Set(match.lineups.filter((l) => l.teamId === match.homeTeamId).map((l) => l.playerId));
  const awayInLineup = new Set(match.lineups.filter((l) => l.teamId === match.awayTeamId).map((l) => l.playerId));
  const eligibleHomePlayers = homeInLineup.size > 0 ? homePlayers.filter((p) => homeInLineup.has(p.id)) : homePlayers;
  const eligibleAwayPlayers = awayInLineup.size > 0 ? awayPlayers.filter((p) => awayInLineup.has(p.id)) : awayPlayers;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-indigo-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
          <Link href="/g15-womens-series/manage" className="flex min-w-0 items-center gap-2">
            <Image
              src={LOGO_URL}
              alt="FA Thailand"
              width={36}
              height={36}
              className="h-9 w-9 flex-none rounded-lg object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">FA Thailand Technical</p>
              <p className="truncate text-[11px] text-indigo-300">จัดการรายละเอียดนัดการแข่งขัน G15</p>
            </div>
          </Link>
          <Link
            href="/g15-womens-series/manage"
            className="inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 px-2.5 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-white/10 hover:text-white sm:px-3"
          >
            <ArrowLeft className="h-4 w-4 flex-none" />
            <span className="hidden sm:inline">กลับหน้าจัดการข้อมูล</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <TeamBadge team={match.homeTeam} size="sm" />
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              {match.homeTeam.name} vs {match.awayTeam.name}
            </h1>
            <TeamBadge team={match.awayTeam} size="sm" />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            {match.round} · ไลน์อัพ ทีมงานผู้ตัดสิน ผู้ทำประตู เปลี่ยนตัว และใบเหลือง-ใบแดง ของนัดนี้
            <Link
              href={`/g15-womens-series/matches/${match.id}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-rose-600 hover:underline"
            >
              ดูหน้าสาธารณะ <ExternalLink className="h-3 w-3" />
            </Link>
          </p>
        </div>

        {/* ไลน์อัพ */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <Users className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-slate-900">ไลน์อัพ ({match.lineups.length})</h2>
          </div>
          <form action={updateLineup} className="p-6">
            <input type="hidden" name="matchId" value={match.id} />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <LineupTeamTable team={match.homeTeam} players={homePlayers} lineupByPlayerId={lineupByPlayerId} />
              <LineupTeamTable team={match.awayTeam} players={awayPlayers} lineupByPlayerId={lineupByPlayerId} />
            </div>
            <button
              type="submit"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-sky-200 transition-colors hover:bg-sky-700"
            >
              บันทึกไลน์อัพ
            </button>
          </form>
        </div>

        {/* ทีมงานผู้ตัดสิน + สกอร์แยกครึ่งเวลา */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <ClipboardList className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-slate-900">ทีมงานผู้ตัดสิน &amp; สกอร์ตามใบรายงาน</h2>
          </div>
          <form action={updateMatchOfficials} className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
            <input type="hidden" name="id" value={match.id} />
            <div className="sm:col-span-2 lg:col-span-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="ผู้ตัดสิน" name="referee" defaultValue={match.referee ?? ""} />
              <Field label="ผู้ช่วยผู้ตัดสินที่ 1" name="assistantReferee1" defaultValue={match.assistantReferee1 ?? ""} />
              <Field label="ผู้ช่วยผู้ตัดสินที่ 2" name="assistantReferee2" defaultValue={match.assistantReferee2 ?? ""} />
              <Field label="ผู้ตัดสินที่ 4" name="fourthOfficial" defaultValue={match.fourthOfficial ?? ""} />
              <Field label="Match Commissioner" name="matchCommissioner" defaultValue={match.matchCommissioner ?? ""} />
              <Field label="ผู้ประเมินผู้ตัดสิน" name="refereeAssessor" defaultValue={match.refereeAssessor ?? ""} />
              <Field label="ผู้ประสานงานกลาง" name="generalCoordinator" defaultValue={match.generalCoordinator ?? ""} />
            </div>
            <p className="sm:col-span-2 lg:col-span-4 -mb-2 text-xs text-slate-400">
              สกอร์แยกครึ่งเวลาตามใบรายงานผู้ตัดสิน (แสดงอ้างอิงในหน้าสาธารณะเท่านั้น ไม่กระทบผลการแข่งขัน/ตารางคะแนนที่ตั้งไว้ในแท็บ &quot;นัดการแข่งขัน&quot;)
            </p>
            <Field
              label="ครึ่งแรก (เหย้า)"
              name="firstHalfHomeScore"
              type="number"
              defaultValue={match.firstHalfHomeScore?.toString() ?? ""}
            />
            <Field
              label="ครึ่งแรก (เยือน)"
              name="firstHalfAwayScore"
              type="number"
              defaultValue={match.firstHalfAwayScore?.toString() ?? ""}
            />
            <Field
              label="ครึ่งหลัง (เหย้า)"
              name="secondHalfHomeScore"
              type="number"
              defaultValue={match.secondHalfHomeScore?.toString() ?? ""}
            />
            <Field
              label="ครึ่งหลัง (เยือน)"
              name="secondHalfAwayScore"
              type="number"
              defaultValue={match.secondHalfAwayScore?.toString() ?? ""}
            />
            <div className="sm:col-span-2 lg:col-span-4">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-rose-200 transition-colors hover:bg-rose-700"
              >
                บันทึก
              </button>
            </div>
          </form>
        </div>

        {/* ผู้ทำประตู */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Target className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-slate-900">ผู้ทำประตู ({match.goals.length})</h2>
          </div>

          {match.goals.length > 0 && (
            <ul className="divide-y divide-slate-100 border-b border-slate-100">
              {match.goals.map((g) => (
                <li key={g.id}>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-6 py-3 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                      <ChevronDown className="h-3.5 w-3.5 flex-none text-slate-400 transition-transform group-open:rotate-180" />
                      <span className="w-9 flex-none text-center text-xs font-bold text-emerald-600">
                        {g.minute != null ? `${g.minute}'` : "-"}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
                        {g.playerName}
                        {g.jerseyNumber != null && <span className="ml-1.5 text-slate-400">#{g.jerseyNumber}</span>}
                        {g.playerId == null && (
                          <span className="ml-1.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                            ไม่ได้ผูกทะเบียน
                          </span>
                        )}
                      </span>
                      <span className="hidden flex-none text-xs text-slate-400 sm:block">{teamById(g.teamId).name}</span>
                    </summary>
                    <div className="border-t border-slate-100 px-6 py-4">
                      <form id={`goal-form-${g.id}`} action={updateGoal} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <input type="hidden" name="id" value={g.id} />
                        <input type="hidden" name="matchId" value={match.id} />
                        <div className="col-span-2 sm:col-span-4">
                          <PlayerSelect
                            homeTeam={match.homeTeam}
                            awayTeam={match.awayTeam}
                            homePlayers={homePlayers}
                            awayPlayers={awayPlayers}
                            defaultValue={g.playerId}
                          />
                        </div>
                        <TeamSelect name="teamId" homeTeam={match.homeTeam} awayTeam={match.awayTeam} defaultValue={g.teamId} required={false} />
                        <Field label="ชื่อผู้ทำประตู (กรอกเองถ้าไม่ได้เลือกจากทะเบียน)" name="playerName" defaultValue={g.playerName} />
                        <Field label="เบอร์เสื้อ" name="jerseyNumber" type="number" defaultValue={g.jerseyNumber?.toString() ?? ""} />
                        <Field label="นาที" name="minute" type="number" defaultValue={g.minute?.toString() ?? ""} />
                      </form>
                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                        <form action={deleteGoal}>
                          <input type="hidden" name="id" value={g.id} />
                          <input type="hidden" name="matchId" value={match.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            ลบ
                          </button>
                        </form>
                        <button
                          type="submit"
                          form={`goal-form-${g.id}`}
                          className="rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-slate-800"
                        >
                          บันทึก
                        </button>
                      </div>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}

          <div className="border-b border-slate-100 px-6 pt-4">
            <p className="text-xs text-slate-400">แยกตามทีม กดเพิ่มแถวเองตามจำนวนที่ต้องการ — เลือกจากไลน์อัพของนัดนี้</p>
          </div>
          <GoalsBulkForm
            matchId={match.id}
            action={createGoalsBulk}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            homePlayers={eligibleHomePlayers}
            awayPlayers={eligibleAwayPlayers}
          />
        </div>

        {/* การเปลี่ยนตัวผู้เล่น */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <LogIn className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-slate-900">การเปลี่ยนตัวผู้เล่น ({match.substitutions.length})</h2>
          </div>

          {match.substitutions.length > 0 && (
            <ul className="divide-y divide-slate-100 border-b border-slate-100">
              {match.substitutions.map((s) => (
                <li key={s.id}>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-6 py-3 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                      <ChevronDown className="h-3.5 w-3.5 flex-none text-slate-400 transition-transform group-open:rotate-180" />
                      <span className="w-9 flex-none text-center text-xs font-bold text-slate-500">
                        {s.minute != null ? `${s.minute}'` : "-"}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-900">
                        <span className="text-emerald-700">↑ {s.playerInName}</span>{" "}
                        <span className="text-red-600">↓ {s.playerOutName}</span>
                      </span>
                      <span className="hidden flex-none text-xs text-slate-400 sm:block">{teamById(s.teamId).name}</span>
                    </summary>
                    <div className="border-t border-slate-100 px-6 py-4">
                      <form
                        id={`sub-form-${s.id}`}
                        action={updateSubstitution}
                        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                      >
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="matchId" value={match.id} />
                        <TeamSelect name="teamId" homeTeam={match.homeTeam} awayTeam={match.awayTeam} defaultValue={s.teamId} />
                        <Field label="นาที" name="minute" type="number" defaultValue={s.minute?.toString() ?? ""} />
                        <div />
                        <Field label="ผู้เล่นเข้า" name="playerInName" required defaultValue={s.playerInName} />
                        <Field
                          label="เบอร์เสื้อ (เข้า)"
                          name="playerInNumber"
                          type="number"
                          defaultValue={s.playerInNumber?.toString() ?? ""}
                        />
                        <div />
                        <Field label="ผู้เล่นออก" name="playerOutName" required defaultValue={s.playerOutName} />
                        <Field
                          label="เบอร์เสื้อ (ออก)"
                          name="playerOutNumber"
                          type="number"
                          defaultValue={s.playerOutNumber?.toString() ?? ""}
                        />
                      </form>
                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                        <form action={deleteSubstitution}>
                          <input type="hidden" name="id" value={s.id} />
                          <input type="hidden" name="matchId" value={match.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            ลบ
                          </button>
                        </form>
                        <button
                          type="submit"
                          form={`sub-form-${s.id}`}
                          className="rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-slate-800"
                        >
                          บันทึก
                        </button>
                      </div>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}

          <div className="border-b border-slate-100 px-6 pt-4">
            <p className="text-xs text-slate-400">แยกตามทีม กดเพิ่มแถวเองตามจำนวนที่ต้องการ — แต่ละแถวเลือกทั้งผู้เล่นเข้าและออก</p>
          </div>
          <SubstitutionsBulkForm
            matchId={match.id}
            action={createSubstitutionsBulk}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            homePlayers={eligibleHomePlayers}
            awayPlayers={eligibleAwayPlayers}
          />
        </div>

        {/* ใบเหลือง / ใบแดง */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <span className="h-3.5 w-2.5 rounded-sm bg-amber-400" />
            </div>
            <h2 className="font-semibold text-slate-900">ใบเหลือง / ใบแดง ({match.cards.length})</h2>
          </div>

          {match.cards.length > 0 && (
            <ul className="divide-y divide-slate-100 border-b border-slate-100">
              {match.cards.map((c) => (
                <li key={c.id}>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-6 py-3 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                      <ChevronDown className="h-3.5 w-3.5 flex-none text-slate-400 transition-transform group-open:rotate-180" />
                      <span
                        className={`h-4 w-3 flex-none rounded-sm ${c.cardType === "RED" ? "bg-red-600" : "bg-amber-400"}`}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">{c.holderName}</span>
                      <span className="hidden flex-none text-xs text-slate-400 sm:block">{teamById(c.teamId).name}</span>
                    </summary>
                    <div className="border-t border-slate-100 px-6 py-4">
                      <form id={`card-form-${c.id}`} action={updateCard} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="matchId" value={match.id} />
                        <TeamSelect name="teamId" homeTeam={match.homeTeam} awayTeam={match.awayTeam} defaultValue={c.teamId} />
                        <Field label="ชื่อ" name="holderName" required defaultValue={c.holderName} />
                        <Field label="เบอร์เสื้อ" name="holderNumber" type="number" defaultValue={c.holderNumber?.toString() ?? ""} />
                        <SelectField
                          label="สถานะ"
                          name="holderRole"
                          defaultValue={c.holderRole}
                          options={[
                            { value: "PLAYER", label: "นักกีฬา" },
                            { value: "OFFICIAL", label: "เจ้าหน้าที่ทีม" },
                          ]}
                        />
                        <SelectField
                          label="ประเภทใบ"
                          name="cardType"
                          required
                          defaultValue={c.cardType}
                          options={[
                            { value: "YELLOW", label: "ใบเหลือง" },
                            { value: "RED", label: "ใบแดง" },
                          ]}
                        />
                        <Field label="นาที" name="minute" type="number" defaultValue={c.minute?.toString() ?? ""} />
                        <div className="col-span-2 sm:col-span-3">
                          <Field label="เหตุผล" name="reason" defaultValue={c.reason ?? ""} />
                        </div>
                      </form>
                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                        <form action={deleteCard}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="matchId" value={match.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            ลบ
                          </button>
                        </form>
                        <button
                          type="submit"
                          form={`card-form-${c.id}`}
                          className="rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-slate-800"
                        >
                          บันทึก
                        </button>
                      </div>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}

          <div className="border-b border-slate-100 px-6 pt-4">
            <p className="text-xs text-slate-400">แยกตามทีม กดเพิ่มแถวเองตามจำนวนที่ต้องการ — เลือกผู้รับได้ทั้งนักกีฬาในไลน์อัพและเจ้าหน้าที่ทีม</p>
          </div>
          <CardsBulkForm
            matchId={match.id}
            action={createCardsBulk}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            homePlayers={eligibleHomePlayers}
            awayPlayers={eligibleAwayPlayers}
            homeOfficials={homeOfficials}
            awayOfficials={awayOfficials}
          />
        </div>
      </div>
    </div>
  );
}
