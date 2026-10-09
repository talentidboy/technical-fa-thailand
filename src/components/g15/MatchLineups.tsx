import Link from "next/link";
import { ArrowDown, ArrowUp, UserRound } from "lucide-react";
import { TeamBadge } from "./TeamBadge";
import { BallIcon } from "./BallIcon";

type Team = { id: number; name: string; logoUrl: string | null; groupName: string | null };
type LineupRow = {
  id: number;
  teamId: number;
  playerId: number;
  status: string;
  isCaptain: boolean;
  player: { firstNameTh: string; lastNameTh: string; jerseyNumber: number | null; photoUrl: string | null };
};
type GoalRow = { teamId: number; playerId: number | null; isOwnGoal: boolean; assistPlayerId: number | null };
type CardRow = { teamId: number; holderName: string; holderRole: string; cardType: string };
type SubRow = { teamId: number; minute: number | null; playerInName: string; playerOutName: string };

// ไอคอนเหตุการณ์ข้างชื่อผู้เล่น: ประตู (นับ OG ที่ผู้เล่นคนนี้ทำเข้าตัวเองแยก), แอสซิสต์, ใบเหลือง/แดง, เปลี่ยนตัวเข้า-ออก
// ใบเหลือง/แดงและเปลี่ยนตัวเก็บเป็นชื่อ จึงจับคู่ด้วยชื่อ-นามสกุล (ในทีมเดียวกัน)
function EventIcons({
  goals,
  ownGoals,
  assists,
  yellow,
  red,
  subIn,
  subOut,
}: {
  goals: number;
  ownGoals: number;
  assists: number;
  yellow: number;
  red: number;
  subIn: number | null | undefined;
  subOut: number | null | undefined;
}) {
  return (
    <span className="flex flex-none items-center gap-1.5">
      {goals > 0 && (
        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-slate-700" title="ประตู">
          <BallIcon className="h-3.5 w-3.5 text-slate-800" />
          {goals > 1 && <span>×{goals}</span>}
        </span>
      )}
      {ownGoals > 0 && (
        <span className="rounded bg-red-50 px-1 text-[10px] font-bold text-red-600" title="ทำเข้าประตูตัวเอง">
          OG{ownGoals > 1 && `×${ownGoals}`}
        </span>
      )}
      {assists > 0 && (
        <span className="rounded bg-sky-50 px-1 text-[10px] font-bold text-sky-600" title="แอสซิสต์">
          A{assists > 1 && `×${assists}`}
        </span>
      )}
      {yellow > 0 && <span className="h-3.5 w-2.5 rounded-[2px] bg-amber-400 shadow-sm" title="ใบเหลือง" />}
      {(red > 0 || yellow > 1) && <span className="h-3.5 w-2.5 rounded-[2px] bg-red-500 shadow-sm" title="ใบแดง" />}
      {subIn !== undefined && (
        <span className="inline-flex items-center text-[11px] font-bold text-emerald-600" title="เปลี่ยนตัวเข้า">
          <ArrowUp className="h-3 w-3" />
          {subIn != null && `${subIn}'`}
        </span>
      )}
      {subOut !== undefined && (
        <span className="inline-flex items-center text-[11px] font-bold text-red-500" title="เปลี่ยนตัวออก">
          <ArrowDown className="h-3 w-3" />
          {subOut != null && `${subOut}'`}
        </span>
      )}
    </span>
  );
}

function TeamLineup({
  team,
  lineups,
  goals,
  cards,
  subs,
  accent,
}: {
  team: Team;
  lineups: LineupRow[];
  goals: GoalRow[];
  cards: CardRow[];
  subs: SubRow[];
  accent: "home" | "away";
}) {
  const byNumber = (a: LineupRow, b: LineupRow) => (a.player.jerseyNumber ?? 999) - (b.player.jerseyNumber ?? 999);
  const starting = lineups.filter((l) => l.status === "STARTING").sort(byNumber);
  const bench = lineups.filter((l) => l.status === "SUBSTITUTE").sort(byNumber);
  const teamSubs = subs.filter((s) => s.teamId === team.id);
  const teamCards = cards.filter((c) => c.teamId === team.id && c.holderRole === "PLAYER");

  const row = (l: LineupRow, isBench: boolean) => {
    const name = `${l.player.firstNameTh} ${l.player.lastNameTh}`;
    const inSub = teamSubs.find((s) => s.playerInName === name);
    const outSub = teamSubs.find((s) => s.playerOutName === name);
    const scored = goals.some((g) => g.playerId === l.playerId || g.assistPlayerId === l.playerId);
    const booked = teamCards.some((c) => c.holderName === name);
    // ตัวสำรองที่มีเหตุการณ์ในเกม (ยิง/แอสซิสต์/โดนใบ) ถือว่าได้ลงเล่น แม้ไม่ได้บันทึกการเปลี่ยนตัวไว้
    const played = !isBench || !!inSub || scored || booked;
    return (
      <li key={l.id}>
        <Link
          href={`/g15-womens-series/players/${l.playerId}`}
          className={`group flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-50 ${played ? "" : "opacity-60"}`}
        >
          <span className="relative h-10 w-10 flex-none overflow-hidden rounded-full bg-linear-to-b from-g15-300 to-g15-600 ring-2 ring-white shadow-sm">
            {l.player.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.player.photoUrl} alt="" loading="lazy" className="h-[125%] w-full object-cover object-top" />
            ) : (
              <UserRound className="absolute bottom-0 left-1/2 h-4/5 w-4/5 -translate-x-1/2 text-white/60" />
            )}
          </span>
          <span
            className={`w-7 flex-none text-center text-sm font-black tabular-nums ${accent === "home" ? "text-g15-600" : "text-pink-600"}`}
          >
            {l.player.jerseyNumber ?? "-"}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-slate-800 group-hover:text-g15-700">{name}</span>
              {l.isCaptain && (
                <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-amber-400 text-[9px] font-black text-amber-950" title="กัปตัน">
                  C
                </span>
              )}
            </span>
          </span>
          <EventIcons
            goals={goals.filter((g) => g.playerId === l.playerId && !g.isOwnGoal).length}
            ownGoals={goals.filter((g) => g.playerId === l.playerId && g.isOwnGoal).length}
            assists={goals.filter((g) => g.assistPlayerId === l.playerId).length}
            yellow={teamCards.filter((c) => c.holderName === name && c.cardType === "YELLOW").length}
            red={teamCards.filter((c) => c.holderName === name && c.cardType === "RED").length}
            subIn={inSub ? inSub.minute : undefined}
            subOut={outSub ? outSub.minute : undefined}
          />
        </Link>
      </li>
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div
        className={`flex items-center gap-3 px-4 py-3 text-white ${
          accent === "home" ? "bg-linear-to-r from-g15-700 to-g15-500" : "bg-linear-to-r from-pink-600 to-fuchsia-500"
        }`}
      >
        <span className="rounded-full bg-white p-0.5">
          <TeamBadge team={team} size="sm" />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-bold">{team.name}</span>
        <span className="text-[11px] font-semibold text-white/75">{accent === "home" ? "เหย้า / Home" : "เยือน / Away"}</span>
      </div>
      {starting.length === 0 && bench.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-slate-400">ยังไม่มีไลน์อัพของทีมนี้</p>
      ) : (
        <>
          {starting.length > 0 && (
            <div className="px-2 py-3">
              <p className="mb-1 px-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                ตัวจริง <span className="font-medium">/ Starting XI</span>
              </p>
              <ul>{starting.map((l) => row(l, false))}</ul>
            </div>
          )}
          {bench.length > 0 && (
            <div className="border-t border-dashed border-slate-200 bg-slate-50/60 px-2 py-3">
              <p className="mb-1 px-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                ตัวสำรอง <span className="font-medium">/ Substitutes</span>
              </p>
              <ul>{bench.map((l) => row(l, true))}</ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ไลน์อัพสองทีมเคียงกัน พร้อมรูปนักกีฬาและไอคอนเหตุการณ์ในเกม
export function MatchLineups({
  homeTeam,
  awayTeam,
  lineups,
  goals,
  cards,
  substitutions,
}: {
  homeTeam: Team;
  awayTeam: Team;
  lineups: LineupRow[];
  goals: GoalRow[];
  cards: CardRow[];
  substitutions: SubRow[];
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TeamLineup team={homeTeam} lineups={lineups.filter((l) => l.teamId === homeTeam.id)} goals={goals} cards={cards} subs={substitutions} accent="home" />
        <TeamLineup team={awayTeam} lineups={lineups.filter((l) => l.teamId === awayTeam.id)} goals={goals} cards={cards} subs={substitutions} accent="away" />
      </div>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <BallIcon className="h-3 w-3 text-slate-600" /> ประตู
        </span>
        <span className="font-bold text-sky-600">A</span>
        <span className="-ml-3">แอสซิสต์</span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-2 rounded-[2px] bg-amber-400" /> ใบเหลือง
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-2 rounded-[2px] bg-red-500" /> ใบแดง
        </span>
        <span className="flex items-center gap-0.5 text-emerald-600">
          <ArrowUp className="h-3 w-3" /> <span className="text-slate-400">เปลี่ยนเข้า</span>
        </span>
        <span className="flex items-center gap-0.5 text-red-500">
          <ArrowDown className="h-3 w-3" /> <span className="text-slate-400">เปลี่ยนออก</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-[8px] font-black text-amber-950">C</span> กัปตัน
        </span>
      </p>
    </div>
  );
}

// แถบเปรียบเทียบสถิติเกมสองฝั่ง (ประตู / ใบเหลือง / ใบแดง / เปลี่ยนตัว)
export function MatchStatBars({ rows }: { rows: { label: string; home: number; away: number }[] }) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {rows.map((r) => {
        const total = r.home + r.away;
        const hp = total === 0 ? 50 : (r.home / total) * 100;
        return (
          <div key={r.label}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className={`w-8 font-black tabular-nums ${r.home > r.away ? "text-g15-700" : "text-slate-500"}`}>{r.home}</span>
              <span className="text-xs font-semibold text-slate-500">{r.label}</span>
              <span className={`w-8 text-right font-black tabular-nums ${r.away > r.home ? "text-pink-600" : "text-slate-500"}`}>{r.away}</span>
            </div>
            <div className="flex h-2 gap-1 overflow-hidden">
              <div className="flex flex-1 justify-end overflow-hidden rounded-l-full bg-slate-100">
                <div className="h-full rounded-l-full bg-g15-600" style={{ width: total === 0 ? "0%" : `${hp}%` }} />
              </div>
              <div className="flex-1 overflow-hidden rounded-r-full bg-slate-100">
                <div className="h-full rounded-r-full bg-pink-500" style={{ width: total === 0 ? "0%" : `${100 - hp}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
