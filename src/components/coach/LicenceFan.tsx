import Link from "next/link";
import { coreProgramSteps } from "@/lib/coach-program";
import { CoachCentreLogo } from "@/components/SectionLogos";
import { display, levelTone } from "./CoachUi";
import styles from "./coach.module.css";

// บัตรใบอนุญาต G → PRO วางเรียงแบบไพ่ในมือ — ชี้แล้วกางออก/ยกใบที่เลือก · กดไปที่รายละเอียดระดับนั้นในหน้าหลักสูตร
export function LicenceFan() {
  const mid = (coreProgramSteps.length - 1) / 2;
  return (
    <div className={styles.fan}>
      {coreProgramSteps.map((s, i) => {
        const tone = levelTone(s.level);
        const k = i - mid;
        return (
          <Link
            key={s.level}
            href={`/courses#level-${s.level}`}
            aria-label={`${s.title} — ${s.totalHours} ชั่วโมง`}
            className={`${styles.card} flex flex-col overflow-hidden rounded-2xl p-4 text-white`}
            style={
              {
                background: tone.hex,
                zIndex: i + 1,
                "--x": `${k * 4.25}rem`,
                "--r": `${k * 7}deg`,
                "--hx": `${k * 6}rem`,
                "--hr": `${k * 9}deg`,
              } as React.CSSProperties
            }
          >
            <span className="flex items-start justify-between gap-2">
              <span className="text-[9px] font-semibold uppercase leading-tight tracking-[0.2em] text-white/75">
                AFC Coaching
                <br />
                Licence
              </span>
              <CoachCentreLogo tone="white" className="h-4" />
            </span>
            {/* ชิปบัตร */}
            <span aria-hidden className="mt-5 grid h-8 w-11 grid-cols-3 gap-px overflow-hidden rounded-md bg-[#e3bb63] p-[3px] opacity-95">
              {Array.from({ length: 6 }).map((_, j) => (
                <span key={j} className="rounded-[2px] bg-[#c99b3b]" />
              ))}
            </span>
            <span className={`${display.className} mt-auto text-7xl font-semibold leading-none`}>{s.level}</span>
            <span className="mt-3 border-t border-white/25 pt-2.5">
              <span className="block truncate text-[13px] font-semibold">{s.title}</span>
              <span className="block text-[11px] text-white/70">
                {s.totalHours} ชม. · {s.days} วัน
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
