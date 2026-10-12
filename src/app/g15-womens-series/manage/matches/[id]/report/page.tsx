import { Fragment } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatMatchDateTime } from "@/lib/g15";
import { stageInfo, matchdayMap, hasPenalties, type G15Stage } from "@/lib/g15-stage";
import { formatMinute, minuteOrder } from "@/lib/g15-clock";
import { LOGO_URL, G15_IMAGE_URL } from "@/lib/brand";
import { PrintButton } from "@/components/g15/PrintButton";
import { BallIcon } from "@/components/g15/BallIcon";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Match Report — G15" };

const OFFICIAL_ROLES = [
  { key: "referee", label: "ผู้ตัดสิน / Referee" },
  { key: "assistantReferee1", label: "ผู้ช่วยผู้ตัดสินที่ 1 / AR1" },
  { key: "assistantReferee2", label: "ผู้ช่วยผู้ตัดสินที่ 2 / AR2" },
  { key: "fourthOfficial", label: "ผู้ตัดสินที่ 4 / 4th Official" },
  { key: "matchCommissioner", label: "Match Commissioner" },
  { key: "refereeAssessor", label: "ผู้ประเมินผู้ตัดสิน / Referee Assessor" },
  { key: "generalCoordinator", label: "ผู้ประสานงานกลาง / General Coordinator" },
  { key: "assistantGeneralCoordinator", label: "ผู้ช่วยผู้ประสานงานกลาง" },
] as const;

// รายงานการแข่งขัน (Match Report) — หน้าขนาด A4 สำหรับพิมพ์/บันทึกเป็น PDF จากหน้าจัดการแมท (แอดมิน/เจ้าหน้าที่เท่านั้น)
export default async function G15MatchReportPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" && user.role !== "STAFF") redirect("/g15-womens-series");

  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const match = await prisma.g15Match.findUnique({
    where: { id },
    include: {
      homeTeam: true,
      awayTeam: true,
      goals: true,
      cards: true,
      substitutions: true,
      lineups: { include: { player: { select: { firstNameTh: true, lastNameTh: true, jerseyNumber: true, position: true } } } },
      playerOfMatch: { select: { firstNameTh: true, lastNameTh: true, jerseyNumber: true, teamId: true } },
    },
  });
  if (!match) notFound();

  const [stageMatches, officials] = await Promise.all([
    prisma.g15Match.findMany({ where: { stage: match.stage }, select: { id: true, stage: true, round: true, matchDate: true } }),
    prisma.g15Official.findMany({
      where: { teamId: { in: [match.homeTeamId, match.awayTeamId] }, isActive: true },
      orderBy: [{ no: "asc" }],
      select: { teamId: true, firstNameTh: true, lastNameTh: true, role: true },
    }),
  ]);
  const matchday = matchdayMap(stageMatches).get(match.id) ?? null;
  const teamName = (teamId: number) => (teamId === match.homeTeamId ? match.homeTeam.name : match.awayTeam.name);
  const byTime = <T extends { minute: number | null; addedMinute: number | null; id: number }>(a: T, b: T) =>
    minuteOrder(a.minute, a.addedMinute) - minuteOrder(b.minute, b.addedMinute) || a.id - b.id;
  const goals = [...match.goals].sort(byTime);
  const cards = [...match.cards].sort(byTime);
  const subs = [...match.substitutions].sort(byTime);
  const min = (m: { minute: number | null; addedMinute: number | null }) => formatMinute(m.minute, m.addedMinute) || "-";
  const finished = match.homeScore != null && match.awayScore != null;
  const printedAt = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "medium", timeStyle: "short" });

  // สัญลักษณ์เหตุการณ์ในตารางไลน์อัพ (ไม่ใช้อีโมจิ — บางเครื่องพิมพ์ออกมาเป็นรูปอื่น)
  type Note = { k: "goal" | "og" | "assist" | "yellow" | "red" | "out" | "in"; m: string };
  const noteMark = (k: Note["k"]) =>
    k === "goal" ? (
      <BallIcon className="inline h-3 w-3 align-[-2px]" />
    ) : k === "og" ? (
      <b className="text-red-600">OG</b>
    ) : k === "assist" ? (
      <b className="text-sky-700">A</b>
    ) : k === "yellow" || k === "red" ? (
      <span className={`inline-block h-2.5 w-[7px] rounded-[1px] align-[-1px] ${k === "red" ? "bg-red-600" : "bg-amber-400"}`} />
    ) : k === "out" ? (
      <b className="text-red-600">▼</b>
    ) : (
      <b className="text-emerald-700">▲</b>
    );

  // ไลน์อัพของแต่ละทีม + เหตุการณ์ของแต่ละคน (ประตู/ใบ/เปลี่ยนตัว จับคู่ด้วย id หรือชื่อ)
  const lineupOf = (teamId: number) => {
    const rows = match.lineups
      .filter((l) => l.teamId === teamId)
      .map((l) => {
        const name = `${l.player.firstNameTh} ${l.player.lastNameTh}`;
        const notes: Note[] = [];
        for (const g of goals) if (g.playerId === l.playerId) notes.push({ k: g.isOwnGoal ? "og" : "goal", m: min(g) });
        for (const g of goals) if (g.assistPlayerId === l.playerId) notes.push({ k: "assist", m: min(g) });
        for (const c of cards) if (c.teamId === teamId && c.holderName === name) notes.push({ k: c.cardType === "RED" ? "red" : "yellow", m: min(c) });
        for (const s of subs) {
          if (s.teamId !== teamId) continue;
          if (s.playerOutName === name) notes.push({ k: "out", m: min(s) });
          if (s.playerInName === name) notes.push({ k: "in", m: min(s) });
        }
        return { ...l, name, notes };
      })
      .sort((a, b) => (a.player.jerseyNumber ?? 999) - (b.player.jerseyNumber ?? 999));
    return { starters: rows.filter((r) => r.status === "STARTING"), bench: rows.filter((r) => r.status !== "STARTING") };
  };

  const th = "border border-slate-300 bg-slate-100 px-2 py-1 text-left font-semibold";
  const td = "border border-slate-300 px-2 py-1 align-top";
  const tdc = "border border-slate-300 px-1.5 py-[2px] align-top leading-snug";
  const sectionTitle = "mb-1.5 mt-5 border-b-2 border-g15-700 pb-0.5 text-[12px] font-bold uppercase tracking-wide text-g15-800";

  const lineupTable = (teamId: number, teamLabel: string) => {
    const { starters, bench } = lineupOf(teamId);
    const staff = officials.filter((o) => o.teamId === teamId);
    const rows = (list: typeof starters) =>
      list.map((r) => (
        <tr key={r.id}>
          <td className={`${tdc} w-8 text-center font-bold`}>{r.player.jerseyNumber ?? "-"}</td>
          <td className={tdc}>
            {r.name}
            {r.isCaptain && <span className="ml-1 font-bold">(C)</span>}
          </td>
          <td className={`${tdc} whitespace-nowrap text-[10px]`}>
            {r.notes.map((n, i) => (
              <span key={i} className="mr-1.5 inline-flex items-center gap-0.5">
                {noteMark(n.k)} {n.m}
              </span>
            ))}
          </td>
        </tr>
      ));
    return (
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-[12px] font-bold">{teamLabel}</p>
        {starters.length + bench.length === 0 ? (
          <p className="text-[11px] text-slate-500">ยังไม่ได้บันทึกไลน์อัพ</p>
        ) : (
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr>
                <th className={`${th} text-center`}>#</th>
                <th className={th}>ตัวจริง / Starting</th>
                <th className={th}>เหตุการณ์</th>
              </tr>
            </thead>
            <tbody>{rows(starters)}</tbody>
            {bench.length > 0 && (
              <>
                <thead>
                  <tr>
                    <th className={`${th} text-center`}>#</th>
                    <th className={th} colSpan={2}>
                      ตัวสำรอง / Substitutes
                    </th>
                  </tr>
                </thead>
                <tbody>{rows(bench)}</tbody>
              </>
            )}
          </table>
        )}
        {staff.length > 0 && (
          <p className="mt-1.5 text-[10px] leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-800">เจ้าหน้าที่ทีม: </span>
            {staff.map((o) => `${o.firstNameTh} ${o.lastNameTh}${o.role ? ` (${o.role})` : ""}`).join(" · ")}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-200 py-6 print:bg-white print:py-0">
      {/* ตั้งค่าหน้ากระดาษ A4 + พิมพ์สีพื้นหลังตามจริง */}
      <style>{`@page { size: A4; margin: 10mm; } @media print { html, body { background: #fff !important; } * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>

      <div className="mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-2 px-4 print:hidden">
        <Link
          href={`/g15-womens-series/manage/matches/${match.id}`}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> กลับหน้าจัดการแมท
        </Link>
        <PrintButton />
        <p className="w-full text-xs text-slate-500">กดปุ่มแล้วเลือกเครื่องพิมพ์เป็น &quot;บันทึกเป็น PDF / Save as PDF&quot; · ขนาด A4</p>
      </div>

      <article className="mx-auto max-w-[210mm] bg-white px-[12mm] py-[10mm] text-slate-900 shadow-xl print:max-w-none print:p-0 print:shadow-none">
        {/* หัวรายงาน */}
        <header className="flex items-center gap-4 border-b-4 border-g15-700 pb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_URL} alt="FA Thailand" className="h-14 w-14 object-contain" />
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-g15-700">FA Thailand G15 Women&apos;s Football Series 2026</p>
            <h1 className="text-xl font-extrabold leading-tight">รายงานการแข่งขัน / MATCH REPORT</h1>
            <p className="text-[11px] text-slate-600">
              {stageInfo(match.stage as G15Stage).label}
              {matchday != null && ` · นัดที่ ${matchday}`} · {match.round}
              {match.matchNo != null && ` · คู่ที่ ${match.matchNo}`}
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={G15_IMAGE_URL} alt="G15" className="h-14 w-14 object-contain" />
        </header>

        <div className="mt-2 grid grid-cols-2 gap-x-6 text-[11px]">
          <p>
            <span className="font-semibold">วันเวลา / Date: </span>
            {formatMatchDateTime(match.matchDate)}
          </p>
          <p>
            <span className="font-semibold">สนาม / Venue: </span>
            {match.venue ?? "-"}
          </p>
        </div>

        {/* สกอร์ */}
        <section className="mt-3 flex items-center justify-center gap-4 rounded-lg border-2 border-slate-300 px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right">
            <span className="text-[15px] font-bold leading-tight">{match.homeTeam.name}</span>
            {match.homeTeam.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={match.homeTeam.logoUrl} alt="" className="h-12 w-12 flex-none object-contain" />
            )}
          </div>
          <div className="flex-none text-center">
            <p className="text-4xl font-black tabular-nums leading-none">
              {finished ? `${match.homeScore} - ${match.awayScore}` : "- : -"}
            </p>
            <p className="mt-1 text-[10px] text-slate-600">
              {match.firstHalfHomeScore != null && match.firstHalfAwayScore != null && `ครึ่งแรก ${match.firstHalfHomeScore}-${match.firstHalfAwayScore}`}
              {hasPenalties(match) && ` · จุดโทษ ${match.homePenalty}-${match.awayPenalty}`}
              {!finished && "ยังไม่มีผล"}
            </p>
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {match.awayTeam.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={match.awayTeam.logoUrl} alt="" className="h-12 w-12 flex-none object-contain" />
            )}
            <span className="text-[15px] font-bold leading-tight">{match.awayTeam.name}</span>
          </div>
        </section>

        {/* ทีมงานผู้ตัดสิน */}
        <h2 className={sectionTitle}>ทีมงานผู้ตัดสินและเจ้าหน้าที่การแข่งขัน / Match Officials</h2>
        <table className="w-full border-collapse text-[11px]">
          <tbody>
            {Array.from({ length: Math.ceil(OFFICIAL_ROLES.length / 2) }, (_, i) => OFFICIAL_ROLES.slice(i * 2, i * 2 + 2)).map((pair, i) => (
              <tr key={i}>
                {pair.map((r) => (
                  <Fragment key={r.key}>
                    <td className={`${td} w-[22%] bg-slate-50 font-semibold`}>{r.label}</td>
                    <td className={`${td} w-[28%]`}>{match[r.key] ?? "-"}</td>
                  </Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* ประตู */}
        <h2 className={sectionTitle}>ผู้ทำประตู / Goals</h2>
        {goals.length === 0 ? (
          <p className="text-[11px] text-slate-500">ไม่มีประตู</p>
        ) : (
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr>
                <th className={`${th} w-14 text-center`}>นาที</th>
                <th className={th}>ทีม</th>
                <th className={`${th} w-10 text-center`}>#</th>
                <th className={th}>ผู้ทำประตู</th>
                <th className={th}>แอสซิสต์</th>
              </tr>
            </thead>
            <tbody>
              {goals.map((g) => (
                <tr key={g.id}>
                  <td className={`${td} text-center font-bold`}>{min(g)}</td>
                  <td className={td}>
                    {/* OG: ทีมของผู้เล่นที่ทำเข้าประตูตัวเอง + ระบุทีมที่ได้ประตู */}
                    {g.isOwnGoal ? (
                      <>
                        {teamName(g.teamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId)}
                        <span className="block text-[10px] text-slate-500">ประตูให้ {teamName(g.teamId)}</span>
                      </>
                    ) : (
                      teamName(g.teamId)
                    )}
                  </td>
                  <td className={`${td} text-center`}>{g.jerseyNumber ?? "-"}</td>
                  <td className={td}>
                    {g.playerName}
                    {g.isOwnGoal && <span className="ml-1 font-bold">(OG)</span>}
                  </td>
                  <td className={td}>{g.assistName ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ใบเหลือง/ใบแดง */}
        <h2 className={sectionTitle}>ใบเหลือง / ใบแดง — Cautions &amp; Send-offs</h2>
        {cards.length === 0 ? (
          <p className="text-[11px] text-slate-500">ไม่มี</p>
        ) : (
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr>
                <th className={`${th} w-14 text-center`}>นาที</th>
                <th className={`${th} w-20`}>ใบ</th>
                <th className={th}>ทีม</th>
                <th className={`${th} w-10 text-center`}>#</th>
                <th className={th}>ชื่อ</th>
                <th className={th}>เหตุผล</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((c) => (
                <tr key={c.id}>
                  <td className={`${td} text-center font-bold`}>{min(c)}</td>
                  <td className={td}>
                    <span className={`mr-1 inline-block h-3 w-2 rounded-[1px] align-middle ${c.cardType === "RED" ? "bg-red-600" : "bg-amber-400"}`} />
                    {c.cardType === "RED" ? "แดง" : "เหลือง"}
                  </td>
                  <td className={td}>{teamName(c.teamId)}</td>
                  <td className={`${td} text-center`}>{c.holderNumber ?? "-"}</td>
                  <td className={td}>
                    {c.holderName}
                    {c.holderRole === "OFFICIAL" && " (เจ้าหน้าที่)"}
                  </td>
                  <td className={td}>{c.reason ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* เปลี่ยนตัว */}
        <h2 className={sectionTitle}>การเปลี่ยนตัว / Substitutions</h2>
        {subs.length === 0 ? (
          <p className="text-[11px] text-slate-500">ไม่มี</p>
        ) : (
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr>
                <th className={`${th} w-14 text-center`}>นาที</th>
                <th className={th}>ทีม</th>
                <th className={th}>▼ ออก / Out</th>
                <th className={th}>▲ เข้า / In</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id}>
                  <td className={`${td} text-center font-bold`}>{min(s)}</td>
                  <td className={td}>{teamName(s.teamId)}</td>
                  <td className={td}>
                    {s.playerOutNumber != null && <b className="mr-1">#{s.playerOutNumber}</b>}
                    {s.playerOutName}
                  </td>
                  <td className={td}>
                    {s.playerInNumber != null && <b className="mr-1">#{s.playerInNumber}</b>}
                    {s.playerInName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ไลน์อัพ */}
        <section className="break-inside-avoid">
          <h2 className={sectionTitle}>รายชื่อผู้เล่น / Line-ups</h2>
          <div className="flex gap-4">
            {lineupTable(match.homeTeamId, match.homeTeam.name)}
            {lineupTable(match.awayTeamId, match.awayTeam.name)}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[9px] text-slate-500">
            {(
              [
                ["goal", "ประตู"],
                ["og", "ทำเข้าประตูตัวเอง"],
                ["assist", "แอสซิสต์"],
                ["yellow", "ใบเหลือง"],
                ["red", "ใบแดง"],
                ["out", "เปลี่ยนตัวออก"],
                ["in", "เปลี่ยนตัวเข้า"],
              ] as const
            ).map(([k, label]) => (
              <span key={k} className="inline-flex items-center gap-1">
                {noteMark(k)} {label}
              </span>
            ))}
            <span>(C) กัปตัน</span>
          </p>
        </section>

        {match.playerOfMatch && (
          <p className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[12px]">
            <span className="font-bold">ผู้เล่นยอดเยี่ยมประจำนัด / Player of the Match: </span>
            {match.playerOfMatch.jerseyNumber != null && `#${match.playerOfMatch.jerseyNumber} `}
            {match.playerOfMatch.firstNameTh} {match.playerOfMatch.lastNameTh} ({teamName(match.playerOfMatch.teamId)})
          </p>
        )}

        {/* ลงนาม */}
        <section className="mt-7 grid grid-cols-3 gap-6 break-inside-avoid text-center text-[11px]">
          {[
            { role: "ผู้ตัดสิน / Referee", name: match.referee },
            { role: "Match Commissioner", name: match.matchCommissioner },
            { role: "ผู้ประสานงานกลาง / General Coordinator", name: match.generalCoordinator },
          ].map((s) => (
            <div key={s.role}>
              <div className="mx-auto h-10 w-full border-b border-dotted border-slate-500" />
              <p className="mt-1">({s.name ?? "........................................"})</p>
              <p className="font-semibold">{s.role}</p>
            </div>
          ))}
        </section>

        <footer className="mt-3 border-t border-slate-200 pt-1 text-[9px] text-slate-400">
          ออกรายงานเมื่อ {printedAt} · FA Thailand Technical · technical-fa-thailand.vercel.app/g15-womens-series/matches/{match.id}
        </footer>
      </article>
    </div>
  );
}
