import Link from "next/link";
import { parseId } from "@/lib/route-id";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  updateMatchOfficials,
  saveLineup,
  updateMatchScore,
  controlMatchClock,
  setAddedTime,
  adjustLiveScore,
  recordLiveGoal,
  recordLiveCard,
  recordLiveSub,
  setPlayerOfMatch,
  updateLiveGoal,
  updateLiveCard,
  updateLiveSub,
  deleteLiveEvent,
  recordPenaltyKick,
  undoPenaltyKick,
  updateMatchLiveVideo,
} from "../../actions";
import { Field } from "@/components/FormField";
import { TeamBadge } from "@/components/g15/TeamBadge";
import { FormWithToast } from "@/components/g15/FormWithToast";
import { QuickScoreRow } from "@/components/g15/QuickScoreRow";
import { OfficialCountdown } from "@/components/g15/OfficialCountdown";
import { LiveMatchControl, type LiveRoster } from "@/components/g15/LiveMatchControl";
import { PlayerOfMatchPicker } from "@/components/g15/PlayerOfMatchPicker";
import { LineupEditor } from "@/components/g15/LineupEditor";
import { ActionForm } from "@/components/g15/ActionForm";
import { videoEmbed } from "@/lib/g15-video";
import { ManageDialogButton } from "@/components/g15/ManageDialogButton";
import { formatMatchDateTime } from "@/lib/g15";
import { stageInfo, isLive, matchdayMap, isKnockoutRound, type G15Stage } from "@/lib/g15-stage";
import { ClipboardList, ExternalLink, Users, Star, FileText, MonitorPlay } from "lucide-react";

type RosterPlayer = {
  id: number;
  firstNameTh: string;
  lastNameTh: string;
  jerseyNumber: number | null;
};

// ตารางไลน์อัพของทีมเดียว — ตัวจริง/ตัวสำรอง เป็นปุ่มเลือกแบบ segmented (radio ที่ซ่อนไว้ + label สไตล์ปุ่ม) กัปตันเป็นไอคอนดาวกดติด/ดับ
// อยู่ในฟอร์มเดียวกับอีกทีม บันทึกครั้งเดียวทั้งคู่

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
  const id = parseId(idParam);
  if (id == null) notFound();

  const match = await prisma.g15Match.findUnique({
    where: { id },
    include: {
      homeTeam: true,
      awayTeam: true,
      goals: { orderBy: [{ minute: "asc" }, { id: "asc" }] },
      substitutions: { orderBy: [{ minute: "asc" }, { id: "asc" }] },
      cards: { orderBy: [{ minute: "asc" }, { id: "asc" }] },
      lineups: true,
      penaltyKicks: { orderBy: { order: "asc" } },
    },
  });
  if (!match) notFound();
  const penaltyKicks = match.penaltyKicks.map((k) => ({
    id: k.id,
    side: k.teamId === match.homeTeamId ? ("home" as const) : ("away" as const),
    scored: k.scored,
    order: k.order,
    playerName: k.playerName,
  }));

  const teamById = (teamId: number) => (teamId === match.homeTeamId ? match.homeTeam : match.awayTeam);
  // สถานะนาฬิกาเกมสด — ส่งให้แผงควบคุมและฟอร์มผู้ทำประตู/ใบเหลือง/เปลี่ยนตัว (เติมนาทีอัตโนมัติ)
  const clock = {
    clockPhase: match.clockPhase,
    firstHalfStartedAt: match.firstHalfStartedAt?.toISOString() ?? null,
    secondHalfStartedAt: match.secondHalfStartedAt?.toISOString() ?? null,
    firstHalfAddedTime: match.firstHalfAddedTime,
    secondHalfAddedTime: match.secondHalfAddedTime,
  };
  const serverNow = new Date().getTime();
  // "นัดที่" = วันแข่งของรอบแบ่งกลุ่ม (คำนวณจากวันที่ของทุกนัดในรอบเดียวกัน)
  const stageMatchDates = await prisma.g15Match.findMany({
    where: { stage: match.stage },
    select: { id: true, stage: true, round: true, matchDate: true },
  });
  const matchday = matchdayMap(stageMatchDates).get(match.id) ?? null;

  const [rosterPlayers, rosterOfficials] = await Promise.all([
    // คนที่ไม่อยู่ในรายชื่อปัจจุบันไม่ต้องให้เลือก ยกเว้นคนที่อยู่ในไลน์อัพนัดนี้อยู่แล้ว (นัดรอบก่อน) — ไม่งั้นกดบันทึกไลน์อัพซ้ำแล้วคนนั้นจะหลุด
    prisma.g15Player.findMany({
      where: {
        teamId: { in: [match.homeTeamId, match.awayTeamId] },
        OR: [{ isActive: true }, { lineups: { some: { matchId: id } } }],
      },
      orderBy: [{ jerseyNumber: { sort: "asc", nulls: "last" } }, { no: "asc" }],
      select: { id: true, teamId: true, firstNameTh: true, lastNameTh: true, jerseyNumber: true, photoUrl: true },
    }),
    prisma.g15Official.findMany({
      where: { teamId: { in: [match.homeTeamId, match.awayTeamId] }, isActive: true },
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


  // รายชื่อสำหรับป็อปอัพในแผงควบคุมเกมสด — คำนวณว่าใครอยู่ในสนาม/บนม้านั่ง จากไลน์อัพ + การเปลี่ยนตัวที่บันทึกแล้ว
  // (การเปลี่ยนตัวเก็บเป็นชื่อ จึงจับคู่ด้วยชื่อ-นามสกุล) ทีมที่ยังไม่มีไลน์อัพ = ทุกคนที่ยังไม่ถูกเปลี่ยนออกเลือกได้หมด
  const liveRoster = (teamId: number, players: RosterPlayer[], officials: typeof homeOfficials): LiveRoster => {
    const hasLineup = match.lineups.some((l) => l.teamId === teamId);
    const subs = match.substitutions.filter((x) => x.teamId === teamId);
    const subbedIn = new Set(subs.map((x) => x.playerInName));
    const subbedOut = new Set(subs.map((x) => x.playerOutName));
    return {
      players: players.map((p) => {
        const name = `${p.firstNameTh} ${p.lastNameTh}`;
        const status = lineupByPlayerId.get(p.id)?.status;
        const out = subbedOut.has(name);
        return {
          id: p.id,
          name,
          number: p.jerseyNumber,
          onPitch: !out && (!hasLineup || status === "STARTING" || subbedIn.has(name)),
          onBench: !out && !subbedIn.has(name) && (!hasLineup || status === "SUBSTITUTE"),
        };
      }),
      officials: officials.map((o) => ({ id: o.id, name: `${o.firstNameTh} ${o.lastNameTh}`, role: o.role })),
    };
  };
  const rosters = {
    home: liveRoster(match.homeTeamId, homePlayers, homeOfficials),
    away: liveRoster(match.awayTeamId, awayPlayers, awayOfficials),
  };

  const lineupPlayer = (p: RosterPlayer) => ({ id: p.id, name: `${p.firstNameTh} ${p.lastNameTh}`, number: p.jerseyNumber });

  const potmPlayer = rosterPlayers.find((p) => p.id === match.playerOfMatchId);
  // ตัวเลือก Player of the Match — คนในไลน์อัพนัดนี้ (ตัวจริงก่อน) ถ้ายังไม่มีไลน์อัพใช้ทั้งทีม
  const potmCandidates = (players: (RosterPlayer & { photoUrl: string | null })[]) =>
    players
      .map((p) => ({
        id: p.id,
        name: `${p.firstNameTh} ${p.lastNameTh}`,
        number: p.jerseyNumber,
        photoUrl: p.photoUrl,
        starter: lineupByPlayerId.get(p.id)?.status !== "SUBSTITUTE",
      }))
      .sort((a, b) => Number(b.starter) - Number(a.starter));

  return (
    <div className="min-h-screen bg-slate-50">

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
            {stageInfo(match.stage as G15Stage).label} · {matchday != null && `นัดที่ ${matchday} · `}
            {match.round} · ไลน์อัพ ทีมงานผู้ตัดสิน ผู้ทำประตู เปลี่ยนตัว และใบเหลือง-ใบแดง ของนัดนี้
            <Link
              href={`/g15-womens-series/matches/${match.id}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-g15-600 hover:underline"
            >
              ดูหน้าสาธารณะ <ExternalLink className="h-3 w-3" />
            </Link>
          </p>
          <Link
            href={`/g15-womens-series/manage/matches/${match.id}/report`}
            target="_blank"
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-g15-600 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-g15-700"
          >
            <FileText className="h-4 w-4" />
            รายงานการแข่งขัน (PDF)
          </Link>
        </div>

        {/* ควบคุมเกมสด — นาฬิกา/ทดเวลา/สกอร์ ขึ้นหน้าเว็บแบบเรียลไทม์ */}
        <LiveMatchControl
          matchId={match.id}
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          homeScore={match.homeScore}
          awayScore={match.awayScore}
          clock={clock}
          serverNow={serverNow}
          rosters={rosters}
          controlAction={controlMatchClock}
          addedTimeAction={setAddedTime}
          scoreAction={adjustLiveScore}
          goalAction={recordLiveGoal}
          cardAction={recordLiveCard}
          subAction={recordLiveSub}
          homeTeamId={match.homeTeamId}
          events={{ goals: match.goals, cards: match.cards, subs: match.substitutions }}
          editGoalAction={updateLiveGoal}
          editCardAction={updateLiveCard}
          editSubAction={updateLiveSub}
          deleteEventAction={deleteLiveEvent}
          isKnockout={isKnockoutRound(match.round)}
          penaltyKicks={penaltyKicks}
          penaltyAction={recordPenaltyKick}
          undoPenaltyAction={undoPenaltyKick}
        />

        {/* ไลน์อัพ / ผู้เล่นยอดเยี่ยมประจำนัด / ทีมงานผู้ตัดสิน — ปุ่มการ์ด กดแล้วเปิดป็อปอัพ */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ManageDialogButton
            title="ไลน์อัพ"
            subtitle="Lineups"
            tone="sky"
            icon={<Users className="h-5 w-5" />}
            summary={
              match.lineups.length > 0
                ? `${match.homeTeam.name} ${homeInLineup.size} คน · ${match.awayTeam.name} ${awayInLineup.size} คน`
                : "ยังไม่ได้บันทึกไลน์อัพ"
            }
          >
              <LineupEditor
                matchId={match.id}
                action={saveLineup}
                teams={[
                  { teamId: match.homeTeamId, team: match.homeTeam, players: homePlayers.map(lineupPlayer) },
                  { teamId: match.awayTeamId, team: match.awayTeam, players: awayPlayers.map(lineupPlayer) },
                ]}
                initialStatus={Object.fromEntries(
                  match.lineups
                    .filter((l) => l.status === "STARTING" || l.status === "SUBSTITUTE")
                    .map((l) => [l.playerId, l.status as "STARTING" | "SUBSTITUTE"]),
                )}
                initialCaptains={{
                  [match.homeTeamId]: match.lineups.find((l) => l.teamId === match.homeTeamId && l.isCaptain)?.playerId ?? null,
                  [match.awayTeamId]: match.lineups.find((l) => l.teamId === match.awayTeamId && l.isCaptain)?.playerId ?? null,
                }}
              />
          </ManageDialogButton>
          <ManageDialogButton
            title="Player of the Match"
            subtitle="ผู้เล่นยอดเยี่ยม"
            tone="amber"
            icon={<Star className="h-5 w-5 fill-amber-400" />}
            summary={
              potmPlayer
                ? `${potmPlayer.firstNameTh} ${potmPlayer.lastNameTh} · ${teamById(potmPlayer.teamId).name}`
                : match.playerOfMatchId
                  ? "เลือกแล้ว"
                  : "ยังไม่ได้เลือก"
            }
          >
              <PlayerOfMatchPicker
                matchId={match.id}
                selectedId={match.playerOfMatchId}
                action={setPlayerOfMatch}
                teams={[
                  { team: match.homeTeam, players: potmCandidates(eligibleHomePlayers) },
                  { team: match.awayTeam, players: potmCandidates(eligibleAwayPlayers) },
                ]}
              />
          </ManageDialogButton>
          <ManageDialogButton
            title="ไลฟ์ / วิดีโอ"
            subtitle="Live video"
            tone="amber"
            icon={<MonitorPlay className="h-5 w-5" />}
            summary={match.liveVideoUrl ? `${videoEmbed(match.liveVideoUrl)?.provider === "youtube" ? "YouTube" : videoEmbed(match.liveVideoUrl)?.provider === "facebook" ? "Facebook" : "ลิงก์"} · ${match.liveVideoUrl}` : "ยังไม่ได้ใส่ลิงก์"}
          >
            <ActionForm action={updateMatchLiveVideo} successText="บันทึกลิงก์แล้ว — ขึ้นในหน้ารายละเอียดนัดทันที" className="space-y-4 p-6">
              <input type="hidden" name="id" value={match.id} />
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">ลิงก์ถ่ายทอดสด / วิดีโอของนัดนี้</span>
                <input
                  name="liveVideoUrl"
                  type="url"
                  inputMode="url"
                  defaultValue={match.liveVideoUrl ?? ""}
                  placeholder="https://www.youtube.com/live/... หรือ https://www.facebook.com/.../videos/..."
                  className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <span className="text-xs text-slate-400">
                  ลิงก์ YouTube และ Facebook จะเล่นในหน้ารายละเอียดนัดได้เลย ลิงก์อื่นแสดงเป็นปุ่มเปิดลิงก์ · เว้นว่างแล้วบันทึก = ลบลิงก์
                </span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600"
                >
                  บันทึกลิงก์
                </button>
                {match.liveVideoUrl && (
                  <a
                    href={`/g15-womens-series/matches/${match.id}#match-video`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                    ดูในหน้าสาธารณะ
                  </a>
                )}
              </div>
            </ActionForm>
          </ManageDialogButton>
          <ManageDialogButton
            title="ทีมงานผู้ตัดสิน"
            subtitle="สกอร์ตามใบรายงาน"
            icon={<ClipboardList className="h-5 w-5" />}
            summary={match.referee ? `ผู้ตัดสิน: ${match.referee}` : "ยังไม่ได้กรอก"}
          >
              <FormWithToast action={updateMatchOfficials} className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
                <input type="hidden" name="id" value={match.id} />
                <div className="sm:col-span-2 lg:col-span-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="ผู้ตัดสิน" name="referee" defaultValue={match.referee ?? ""} />
                  <Field label="ผู้ช่วยผู้ตัดสินที่ 1" name="assistantReferee1" defaultValue={match.assistantReferee1 ?? ""} />
                  <Field label="ผู้ช่วยผู้ตัดสินที่ 2" name="assistantReferee2" defaultValue={match.assistantReferee2 ?? ""} />
                  <Field label="ผู้ตัดสินที่ 4" name="fourthOfficial" defaultValue={match.fourthOfficial ?? ""} />
                  <Field label="Match Commissioner" name="matchCommissioner" defaultValue={match.matchCommissioner ?? ""} />
                  <Field label="ผู้ประเมินผู้ตัดสิน" name="refereeAssessor" defaultValue={match.refereeAssessor ?? ""} />
                  <Field label="ผู้ประสานงานกลาง" name="generalCoordinator" defaultValue={match.generalCoordinator ?? ""} />
                  <Field
                    label="ผู้ช่วยผู้ประสานงานกลาง"
                    name="assistantGeneralCoordinator"
                    defaultValue={match.assistantGeneralCoordinator ?? ""}
                  />
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
                    className="inline-flex items-center gap-2 rounded-lg bg-g15-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-g15-200 transition-colors hover:bg-g15-700"
                  >
                    บันทึก
                  </button>
                </div>
              </FormWithToast>
          </ManageDialogButton>
        </div>

        {/* แก้ผลด้วยตนเอง — สำหรับกรอกผลย้อนหลัง/แก้สกอร์ (ไม่ได้ใช้นาฬิกาเกมสด) */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-3 text-sm font-semibold text-slate-900">
            แก้ผลด้วยตนเอง <span className="font-normal text-slate-400">(กรอกผลย้อนหลัง / แก้สกอร์)</span>
          </div>
          {/* key ตามสกอร์/สถานะ — สกอร์เปลี่ยนจากแผงควบคุมเกมสดแล้วให้ช่องกรอกโหลดค่าใหม่ (ไม่ค้างค่าเก่าที่อาจถูกกดบันทึกทับ) */}
          <QuickScoreRow
            key={`${match.homeScore}-${match.awayScore}-${match.homePenalty}-${match.awayPenalty}-${match.status}`}
            action={updateMatchScore}
            detailsHref={`/g15-womens-series/matches/${match.id}`}
            detailsLabel="ดูหน้าสาธารณะ"
            match={{
              id: match.id,
              round: match.round,
              matchNo: matchday,
              status: match.status,
              homeScore: match.homeScore,
              awayScore: match.awayScore,
              homePenalty: match.homePenalty,
              awayPenalty: match.awayPenalty,
              timeLabel: formatMatchDateTime(match.matchDate),
              venueLabel: match.venue,
              liveNow: isLive(match),
              homeTeam: match.homeTeam,
              awayTeam: match.awayTeam,
            }}
          />
        </div>

        {/* กำหนดการก่อนเริ่มเกม (เฉพาะแอดมิน) */}
        {match.matchDate && (
          <OfficialCountdown
            kickoff={match.matchDate.toISOString()}
            homeTeam={match.homeTeam.name}
            awayTeam={match.awayTeam.name}
            venue={match.venue}
            matchLabel={`${matchday != null ? `Matchday ${matchday} · ` : ""}${match.round}`}
          />
        )}
      </div>
    </div>
  );
}
