import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { LOGO_URL } from "@/lib/brand";
import { OfficialCountdown } from "@/components/g15/OfficialCountdown";
import { ArrowLeft, ClipboardList } from "lucide-react";

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
      <header className="sticky top-0 z-20 border-b border-white/10 bg-indigo-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
          <Link href="/g15-womens-series/manage" className="flex min-w-0 items-center gap-2">
            <Image src={LOGO_URL} alt="FA Thailand" width={36} height={36} className="h-9 w-9 flex-none rounded-lg object-cover" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">FA Thailand Technical</p>
              <p className="truncate text-[11px] text-indigo-300">Official Countdown · G15 Women&apos;s Football Series</p>
            </div>
          </Link>
          <Link
            href="/g15-womens-series/manage"
            className="inline-flex h-10 flex-none items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 px-3 text-sm font-medium text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 flex-none" />
            <span className="hidden sm:inline">กลับหน้าจัดการข้อมูล</span>
          </Link>
        </div>
      </header>

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
                  matchLabel={`${m.matchNo != null ? `Match ${m.matchNo} · ` : ""}${m.round}`}
                  title={`${m.matchNo != null ? `นัด ${m.matchNo} · ` : ""}${m.homeTeam.name} vs ${m.awayTeam.name}`}
                />
              ))}
            </section>
          ))
        )}
      </div>
    </div>
  );
}
