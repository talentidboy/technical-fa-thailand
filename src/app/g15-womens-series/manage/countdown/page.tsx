import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { OfficialCountdown } from "@/components/g15/OfficialCountdown";
import { matchdayMap } from "@/lib/g15-stage";
import { ClipboardList } from "lucide-react";

const BANGKOK_TZ = "Asia/Bangkok";

function dayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BANGKOK_TZ }).format(date);
}

// หมวด Official Countdown (เฉพาะแอดมิน/เจ้าหน้าที่) — กำหนดการก่อนเริ่มเกมของทุกนัดรอบชิงแชมป์ประเทศ จัดตามวันแข่ง
// นัดถัดไปที่ยังไม่แข่งเปิดไว้ให้อัตโนมัติ นัดอื่นกดเปิดดูได้
export default async function G15CountdownPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" && user.role !== "STAFF") redirect("/g15-womens-series");

  const matches = await prisma.g15Match.findMany({
    where: { stage: "NATIONAL", matchDate: { not: null } },
    orderBy: [{ matchDate: "asc" }, { matchNo: "asc" }],
    include: { homeTeam: true, awayTeam: true },
  });

  const now = new Date();
  const matchdays = matchdayMap(matches);
  // นัดถัดไป = นัดแรกที่ยังไม่จบและเวลาเตะยังไม่ผ่านไปเกิน 2 ชั่วโมง (เผื่อกำลังแข่งอยู่)
  const nextMatch = matches.find(
    (m) => m.status !== "FINISHED" && m.matchDate!.getTime() + 2 * 3600_000 > now.getTime(),
  );

  const byDay = new Map<string, typeof matches>();
  for (const m of matches) {
    const key = dayKey(m.matchDate!);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(m);
  }
  const todayKey = dayKey(now);

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-g15-600 text-white">
            <ClipboardList className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Official Countdown</h1>
            <p className="mt-1 text-sm text-slate-500">
              กำหนดการก่อนเริ่มการแข่งขันของแต่ละนัด (รอบชิงแชมป์ประเทศ) — เวลาคำนวณจากเวลาเตะจริง แก้เวลาเตะในหน้าจัดการนัดแล้วตารางนี้เปลี่ยนตาม ·
              เฉพาะแอดมิน/เจ้าหน้าที่
            </p>
          </div>
        </div>

        {matches.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
            ยังไม่มีนัดที่กำหนดเวลาเตะ
          </p>
        ) : (
          Array.from(byDay.entries()).map(([key, dayMatches]) => (
            <section key={key} className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-700">
                {dayMatches[0].matchDate!.toLocaleDateString("th-TH-u-ca-gregory", {
                  timeZone: BANGKOK_TZ,
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
                {key === todayKey && <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">วันนี้</span>}
              </h2>
              {dayMatches.map((m) => (
                <OfficialCountdown
                  key={m.id}
                  defaultOpen={m.id === nextMatch?.id}
                  kickoff={m.matchDate!.toISOString()}
                  homeTeam={m.homeTeam.name}
                  awayTeam={m.awayTeam.name}
                  venue={m.venue}
                  matchLabel={`${matchdays.has(m.id) ? `Matchday ${matchdays.get(m.id)} · ` : ""}${m.round}`}
                  title={`${matchdays.has(m.id) ? `นัด ${matchdays.get(m.id)} · ` : ""}${m.homeTeam.name} vs ${m.awayTeam.name}`}
                />
              ))}
            </section>
          ))
        )}
      </div>
    </div>
  );
}
