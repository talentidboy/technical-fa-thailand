"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ClipboardList, ChevronDown, Check } from "lucide-react";
import { G15_IMAGE_URL } from "@/lib/brand";

const BANGKOK_TZ = "Asia/Bangkok";

// ลำดับขั้นตอนก่อนเริ่มเกมตามแบบฟอร์ม Official Countdown ของ FA Thailand — offset เป็นนาทีก่อนเวลาเตะ
// tone: amber = ฝ่ายจัดการแข่งขัน, green = จุดสำคัญของทีม (ตามสีในแบบฟอร์มต้นฉบับ)
const STEPS: { offset: number; label: string; text: string; tone?: "amber" | "green" }[] = [
  { offset: 180, label: "- 3 h 00'", text: "ฝ่ายจัดการแข่งขันถึงสนามแข่งขัน", tone: "amber" },
  { offset: 120, label: "- 2 h 00'", text: "ทีมเดินทางถึงสถานที่จัดการแข่งขัน", tone: "green" },
  { offset: 90, label: "- 1 h 30'", text: "ส่งใบรายชื่อผู้เล่น อย่างช้าที่สุด", tone: "green" },
  {
    offset: 60,
    label: "- 1 h 00'",
    text: "ออกใบประกบคู่แข่งขัน พร้อมแจกจ่ายให้ทีม สื่อมวลชน ทีมถ่ายทอดสด ผู้ประกาศในสนามแข่งขัน เจ้าหน้าที่จัดการแข่งขัน, วีไอพี และทีมงาน LOC",
  },
  { offset: 50, label: "- 50'", text: "นักกีฬาฟุตบอล และผู้รักษาประตูเริ่มการอบอุ่นร่างกาย" },
  { offset: 30, label: "- 30'", text: "ประกาศรายชื่อนักกีฬา และเจ้าหน้าที่จัดการแข่งขัน" },
  { offset: 20, label: "- 20'", text: "สิ้นสุดการอบอุ่นร่างกาย นักกีฬาฟุตบอลกลับเข้าสู่ห้องพักนักกีฬา" },
  { offset: 10, label: "- 10'", text: "นักกีฬาฟุตบอล และเจ้าหน้าที่จัดการแข่งขันพร้อมกันบริเวณทางเดินลงสู่สนามแข่งขัน", tone: "green" },
  { offset: 9, label: "- 9'", text: "ผู้ตัดสินตรวจสอบการแต่งกาย / อุปกรณ์ของนักกีฬาฟุตบอล และ AD CARD" },
  { offset: 6, label: "- 6'", text: "เปิดเพลงประจำการแข่งขัน ผู้ตัดสินและนักกีฬา เดินลงสู่สนามแข่งขัน" },
];

function timeAt(kickoff: Date, minutesBefore: number) {
  return new Date(kickoff.getTime() - minutesBefore * 60_000).toLocaleTimeString("en-GB", {
    timeZone: BANGKOK_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// เวลาที่เหลือก่อนถึงขั้นนั้น — "1 วัน 02:14:05" / "02:14:05"
function remainingLabel(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86_400);
  const pad = (n: number) => String(n).padStart(2, "0");
  const hms = `${pad(Math.floor((totalSec % 86_400) / 3600))}:${pad(Math.floor((totalSec % 3600) / 60))}:${pad(totalSec % 60)}`;
  return days > 0 ? `${days} วัน ${hms}` : hms;
}

function StepTimer({ target, now, isNext }: { target: number; now: number | null; isNext: boolean }) {
  if (now == null) return null;
  const ms = target - now;
  if (ms <= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
        <Check className="h-3 w-3" />
        ผ่านแล้ว
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
        isNext ? "bg-g15-600 text-white" : "bg-white/70 text-g15-700 ring-1 ring-g15-200"
      }`}
    >
      {isNext && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}
      อีก {remainingLabel(ms)}
    </span>
  );
}

// กำหนดการก่อนเริ่มเกม (Official Countdown) — ซ่อนไว้หลังปุ่ม กดแล้วค่อยแสดง เวลาทุกขั้นคำนวณจากเวลาเตะจริงของนัด
export function OfficialCountdown({
  kickoff,
  homeTeam,
  awayTeam,
  venue,
  matchLabel,
}: {
  kickoff: string;
  homeTeam: string;
  awayTeam: string;
  venue: string | null;
  matchLabel: string;
}) {
  const [open, setOpen] = useState(false);
  // นาฬิกาสำหรับนับถอยหลังแต่ละขั้น — เริ่มเดินตอนกดเปิดเท่านั้น (ปิดอยู่ไม่ต้องอัปเดตทุกวินาที)
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open]);
  const ko = new Date(kickoff);
  const stepTimes = [...STEPS.map((st) => ko.getTime() - st.offset * 60_000), ko.getTime()];
  // ขั้นถัดไปที่ยังไม่ถึงเวลา — ไฮไลต์ให้เห็นว่าตอนนี้ต้องเตรียมอะไร
  const nextIndex = now == null ? -1 : stepTimes.findIndex((t) => t > now);
  const dateLabel = ko.toLocaleDateString("en-GB", { timeZone: BANGKOK_TZ, weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const koLabel = timeAt(ko, 0);

  return (
    <section className="mt-8">
      <button
        type="button"
        onClick={() => {
          setNow(Date.now());
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition-colors hover:border-g15-200 hover:bg-g15-50/40"
      >
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-g15-600 text-white">
          <ClipboardList className="h-4.5 w-4.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-slate-900">Official Countdown</span>
          <span className="block text-xs text-slate-500">กำหนดการก่อนเริ่มการแข่งขัน · เตะ {koLabel} น.</span>
        </span>
        <span className="flex flex-none items-center gap-1 text-xs font-semibold text-g15-600">
          {open ? "ซ่อน" : "แสดง"}
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-g15-950 px-5 py-2.5 text-center text-base font-extrabold uppercase tracking-widest text-white">
            Official Countdown
          </div>

          <div className="flex items-start gap-4 border-b border-slate-200 px-5 py-4">
            <Image src={G15_IMAGE_URL} alt="" width={64} height={64} className="h-14 w-14 flex-none object-contain" />
            <div className="min-w-0 text-xs text-slate-500">
              <p className="text-sm font-bold text-slate-900">FA THAILAND</p>
              <p>286 Ramkhamhaeng RD., Hua Mak, Bang Kapi Bangkok 10240</p>
              <p>Tel.: +662-089-0741 · Email: info@thaileague.co.th</p>
            </div>
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-b border-slate-200 px-5 py-4 text-sm sm:grid-cols-[auto_1fr_auto_1fr]">
            <dt className="font-bold text-slate-900">COMPETITION</dt>
            <dd className="text-slate-700 sm:col-span-3">FA Thailand G15 Women&apos;s Football Series 2026 · {matchLabel}</dd>
            <dt className="font-bold text-slate-900">TEAM A</dt>
            <dd className="text-slate-700">{homeTeam}</dd>
            <dt className="font-bold text-slate-900">TEAM B</dt>
            <dd className="text-slate-700">{awayTeam}</dd>
            <dt className="font-bold text-slate-900">VENUE</dt>
            <dd className="text-slate-700 sm:col-span-3">{venue ?? "-"}</dd>
            <dt className="font-bold text-slate-900">DATE</dt>
            <dd className="text-slate-700">{dateLabel}</dd>
            <dt className="font-bold text-slate-900">KICK-OFF TIME</dt>
            <dd className="text-lg font-extrabold leading-none text-g15-600">{koLabel}</dd>
          </dl>

          <ol className="divide-y divide-slate-100 text-sm">
            {STEPS.map((s, i) => (
              <li
                key={s.offset}
                className={`grid grid-cols-[4.5rem_1fr_auto] items-start gap-3 px-5 py-2.5 ${
                  s.tone === "amber" ? "bg-amber-50" : s.tone === "green" ? "bg-lime-100/70" : ""
                } ${i === nextIndex ? "relative ring-2 ring-inset ring-g15-500" : ""} ${
                  now != null && stepTimes[i] <= now ? "opacity-55" : ""
                }`}
              >
                <span className="font-bold tabular-nums text-slate-900">{s.label}</span>
                <span className="text-slate-700">{s.text}</span>
                <span className="flex flex-col items-end gap-1">
                  <span className="whitespace-nowrap font-semibold tabular-nums text-slate-900">
                    <span className="mr-2 text-xs font-normal text-slate-400">at</span>
                    {timeAt(ko, s.offset)}
                  </span>
                  <StepTimer target={stepTimes[i]} now={now} isNext={i === nextIndex} />
                </span>
              </li>
            ))}
            <li
              className={`grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 border-t-2 border-slate-900 bg-lime-200/80 px-5 py-3 ${
                nextIndex === STEPS.length ? "ring-2 ring-inset ring-g15-500" : ""
              }`}
            >
              <span className="font-extrabold tabular-nums text-slate-900">- 0&apos;</span>
              <span className="font-bold text-slate-900">เริ่มทำการแข่งขัน</span>
              <span className="flex flex-col items-end gap-1">
                <span className="whitespace-nowrap text-lg font-extrabold tabular-nums text-slate-900">
                  <span className="mr-2 text-xs font-normal text-slate-500">at</span>
                  {koLabel}
                </span>
                <StepTimer target={stepTimes[STEPS.length]} now={now} isNext={nextIndex === STEPS.length} />
              </span>
            </li>
          </ol>

          <div className="space-y-2 border-t border-slate-200 px-5 py-4 text-xs leading-relaxed text-slate-600">
            <p>พักครึ่งเวลา 15 นาที จากเสียงนกหวีดถึงเสียงนกหวีด</p>
            <p>
              โดยทีมต้องออกจากห้องพักนักกีฬา เพื่อเตรียมความพร้อมก่อนเวลาเริ่มแข่งขันในครึ่งหลัง 4 นาที และเดินลงสู่สนามพร้อมกับผู้ตัดสิน
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
