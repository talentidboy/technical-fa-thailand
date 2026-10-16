import { formatMinute, minuteOrder } from "@/lib/g15-clock";
import { ArrowLeftRight, Flag } from "lucide-react";
import { BallIcon } from "./BallIcon";

type GoalEv = { id: number; teamId: number; minute: number | null; addedMinute?: number | null; playerName: string; isOwnGoal?: boolean; assistName?: string | null };
type CardEv = { id: number; teamId: number; minute: number | null; addedMinute?: number | null; holderName: string; cardType: string };
type SubEv = { id: number; teamId: number; minute: number | null; addedMinute?: number | null; playerInName: string; playerOutName: string };

type Ev =
  | { kind: "goal"; key: string; minute: number | null; addedMinute?: number | null; side: "home" | "away"; title: string; no: number | null; score: string; og: boolean; assist: string | null }
  | { kind: "card"; key: string; minute: number | null; addedMinute?: number | null; side: "home" | "away"; title: string; no: number | null; red: boolean }
  | { kind: "sub"; key: string; minute: number | null; addedMinute?: number | null; side: "home" | "away"; inName: string; outName: string; inNo: number | null; outNo: number | null };

// เบอร์เสื้อหน้าชื่อผู้เล่น
function No({ n, tone = "slate" }: { n: number | null; tone?: "slate" | "emerald" | "red" }) {
  if (n == null) return null;
  const c = { slate: "bg-slate-100 text-slate-600", emerald: "bg-emerald-50 text-emerald-700", red: "bg-red-50 text-red-600" }[tone];
  return <span className={`mr-1 inline-block rounded px-1 font-mono text-[11px] font-black leading-4 ${c}`}>{n}</span>;
}

// ไทม์ไลน์เหตุการณ์ในเกม — นาทีอยู่กลาง ทีมเหย้าซ้าย ทีมเยือนขวา
// กำลังแข่ง = ล่าสุดอยู่บน (แบบไลฟ์สกอร์), จบแล้ว = เรียงตามเวลา; มีเส้นคั่นพักครึ่ง (HT) และเริ่มเกม/จบเกม
export function MatchTimeline({
  homeTeamId,
  goals,
  cards,
  substitutions,
  live,
  finished,
  halfTimeScore,
  numbers,
}: {
  homeTeamId: number;
  goals: GoalEv[];
  cards: CardEv[];
  substitutions: SubEv[];
  live: boolean;
  finished: boolean;
  halfTimeScore: string | null;
  // เบอร์เสื้อ: key = "<teamId>|<ชื่อ นามสกุล>"
  numbers?: Record<string, number>;
}) {
  const sideOf = (teamId: number) => (teamId === homeTeamId ? "home" : "away") as "home" | "away";
  const noOf = (teamId: number | null, name: string) => (teamId != null ? (numbers?.[`${teamId}|${name}`] ?? null) : null);
  const teamIds = [...new Set([...goals, ...cards, ...substitutions].map((e) => e.teamId))];
  // ทำเข้าประตูตัวเอง: คนยิงเป็นผู้เล่นทีมตรงข้ามกับทีมที่ได้ประตู
  const otherTeam = (teamId: number) => teamIds.find((t) => t !== teamId) ?? null;
  const byMinute = <T extends { minute: number | null; addedMinute?: number | null; id: number }>(a: T, b: T) =>
    minuteOrder(a.minute, a.addedMinute) - minuteOrder(b.minute, b.addedMinute) || a.id - b.id;

  // สกอร์หลังแต่ละประตู (เรียงตามนาที)
  let h = 0;
  let a = 0;
  const goalEvents: Ev[] = [...goals].sort(byMinute).map((g) => {
    const side = sideOf(g.teamId);
    if (side === "home") h++;
    else a++;
    return {
      kind: "goal",
      key: `g${g.id}`,
      minute: g.minute,
      addedMinute: g.addedMinute,
      side,
      title: g.playerName,
      no: noOf(g.isOwnGoal ? otherTeam(g.teamId) : g.teamId, g.playerName),
      score: `${h}-${a}`,
      og: !!g.isOwnGoal,
      assist: g.assistName ?? null,
    };
  });
  const events: Ev[] = [
    ...goalEvents,
    ...cards.map((c) => ({
      kind: "card" as const,
      key: `c${c.id}`,
      minute: c.minute,
      addedMinute: c.addedMinute,
      side: sideOf(c.teamId),
      title: c.holderName,
      no: noOf(c.teamId, c.holderName),
      red: c.cardType === "RED",
    })),
    ...substitutions.map((s) => ({
      kind: "sub" as const,
      key: `s${s.id}`,
      minute: s.minute,
      addedMinute: s.addedMinute,
      side: sideOf(s.teamId),
      inName: s.playerInName,
      outName: s.playerOutName,
      inNo: noOf(s.teamId, s.playerInName),
      outNo: noOf(s.teamId, s.playerOutName),
    })),
  ].sort((x, y) => minuteOrder(x.minute, x.addedMinute) - minuteOrder(y.minute, y.addedMinute));

  if (events.length === 0 && !live) return null;

  // แทรกเส้นพักครึ่งระหว่างนาที ≤45 กับ >45 (ถ้ามีเหตุการณ์ครึ่งหลังแล้ว หรือมีสกอร์ครึ่งแรก)
  type Row = Ev | { kind: "marker"; key: string; label: string };
  const rows: Row[] = [{ kind: "marker", key: "ko", label: "เริ่มเกม / Kick-off" }];
  let htInserted = false;
  for (const e of events) {
    if (!htInserted && (e.minute ?? 0) > 45 && halfTimeScore) {
      rows.push({ kind: "marker", key: "ht", label: `พักครึ่ง / HT ${halfTimeScore}` });
      htInserted = true;
    }
    rows.push(e);
  }
  if (!htInserted && halfTimeScore) rows.push({ kind: "marker", key: "ht", label: `พักครึ่ง / HT ${halfTimeScore}` });
  if (finished) rows.push({ kind: "marker", key: "ft", label: "จบเกม / Full-time" });
  if (live) rows.reverse();

  const body = (e: Ev) => {
    if (e.kind === "goal")
      return (
        <span className="flex items-center gap-2">
          <BallIcon className="h-4 w-4 flex-none text-emerald-600" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-slate-900">
              <No n={e.no} />
              {e.title}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600">
              {e.og ? "ทำเข้าประตูตัวเอง (OG)" : "ประตู!"} {e.score}
            </span>
            {e.assist && <span className="block truncate text-[11px] text-slate-400">แอสซิสต์: {e.assist}</span>}
          </span>
        </span>
      );
    if (e.kind === "card")
      return (
        <span className="flex items-center gap-2">
          <span className={`h-4 w-3 flex-none rounded-[2px] shadow-sm ${e.red ? "bg-red-500" : "bg-amber-400"}`} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-slate-800">
              <No n={e.no} />
              {e.title}
            </span>
            <span className="text-[11px] text-slate-400">{e.red ? "ใบแดง / Red card" : "ใบเหลือง / Yellow card"}</span>
          </span>
        </span>
      );
    return (
      <span className="flex items-center gap-2">
        <ArrowLeftRight className="h-4 w-4 flex-none text-sky-500" />
        <span className="min-w-0 text-[13px] leading-snug">
          <span className="block truncate font-semibold text-emerald-700">
            ▲ <No n={e.inNo} tone="emerald" />
            {e.inName}
          </span>
          <span className="block truncate text-red-500">
            ▼ <No n={e.outNo} tone="red" />
            {e.outName}
          </span>
        </span>
      </span>
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ol className="relative py-3">
        <span aria-hidden className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-200" />
        {rows.map((r) =>
          r.kind === "marker" ? (
            <li key={r.key} className="relative my-2 flex justify-center">
              <span className="flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold text-white">
                <Flag className="h-3 w-3" />
                {r.label}
              </span>
            </li>
          ) : (
            <li key={r.key} className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2 sm:gap-4 sm:px-5">
              <div className="flex min-w-0 justify-end text-right">{r.side === "home" && body(r)}</div>
              <span
                className={`relative z-10 flex h-9 w-12 items-center justify-center rounded-full text-xs font-black tabular-nums ring-4 ring-white ${
                  r.kind === "goal" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {formatMinute(r.minute, r.addedMinute) || "-"}
              </span>
              <div className="flex min-w-0 justify-start">{r.side === "away" && body(r)}</div>
            </li>
          ),
        )}
      </ol>
    </div>
  );
}
