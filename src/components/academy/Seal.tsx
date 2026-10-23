import { academySerif } from "@/components/typefaces/academy";
import styles from "./public.module.css";

// ตราประทับรับรอง: วงตัวอักษร "FA THAILAND · ACADEMY LICENSING · GROW TOGETHER" หมุนช้าๆ · ตรงกลาง = จำนวนอคาเดมีที่ได้รับการรับรอง
// (ไม่ใช้ <g> ใน SVG — การทดสอบแผนที่อ้าง "svg g" ตัวแรกของหน้าเป็นกลุ่มซูมของแผนที่)
export function Seal({ count, className = "" }: { count: number; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 200 200" aria-hidden className={`${styles.seal} absolute inset-0 h-full w-full`}>
        <defs>
          <path id="academy-seal-ring" d="M100 100 m-79 0 a79 79 0 1 1 158 0 a79 79 0 1 1 -158 0" />
        </defs>
        <circle cx="100" cy="100" r="99" fill="#d9b45a" />
        <circle cx="100" cy="100" r="93" fill="none" stroke="#071530" strokeOpacity="0.4" strokeWidth="1" />
        <circle cx="100" cy="100" r="63" fill="#071530" />
        <circle cx="100" cy="100" r="58" fill="none" stroke="#d9b45a" strokeOpacity="0.55" strokeWidth="1" />
        <text fontSize="12.5" fontWeight="700" fill="#071530">
          <textPath href="#academy-seal-ring" textLength="490" lengthAdjust="spacing">
            FA THAILAND • ACADEMY LICENSING • GROW TOGETHER •
          </textPath>
        </text>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`${academySerif.className} text-[1.6rem] font-bold leading-none text-white sm:text-3xl`}>{count.toLocaleString()}</span>
        <span className="mt-1 text-[8px] leading-tight text-white/75 sm:text-[9px]">
          อคาเดมีที่
          <br />
          ได้รับการรับรอง
        </span>
      </div>
    </div>
  );
}
