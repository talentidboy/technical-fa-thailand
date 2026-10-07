import Link from "next/link";
import { STAGES, withStage, type G15Stage } from "@/lib/g15-stage";
import { Trophy, Map as MapIcon } from "lucide-react";

// สลับดูรอบชิงแชมป์ประเทศ / รอบภูมิภาค — ทุกหน้าที่มีสถิติใช้ตัวเดียวกันนี้ (วางบนฮีโร่สีเข้ม)
// เป็นลิงก์ธรรมดา (?stage=) ให้แชร์ลิงก์รอบที่ต้องการได้ และเซิร์ฟเวอร์กรองข้อมูลตามรอบได้ตั้งแต่ต้น
// variant "light" — สำหรับวางบนพื้นขาว/เทา (หน้าแรกที่ฮีโร่เป็นภาพแบนเนอร์ ไม่มีที่ว่างให้วางบนพื้นเข้ม)
export function StageSwitcher({
  stage,
  basePath,
  variant = "dark",
}: {
  stage: G15Stage;
  basePath: string;
  variant?: "dark" | "light";
}) {
  const light = variant === "light";
  return (
    <div
      className={`inline-flex rounded-2xl p-1 ${
        light ? "bg-white shadow-sm ring-1 ring-slate-200" : "mt-4 bg-black/25 ring-1 ring-white/15 backdrop-blur"
      }`}
    >
      {STAGES.map((s) => {
        const active = s.key === stage;
        const Icon = s.key === "NATIONAL" ? Trophy : MapIcon;
        return (
          <Link
            key={s.key}
            href={withStage(basePath, s.key)}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 transition-colors sm:px-4 ${
              active
                ? light
                  ? "bg-g15-600 text-white shadow"
                  : "bg-white text-g15-900 shadow"
                : light
                  ? "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  : "text-g15-100 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4 flex-none" />
            <span className="flex flex-col leading-tight">
              <span className="whitespace-nowrap text-sm font-bold">{s.label}</span>
              <span
                className={`whitespace-nowrap text-[10px] font-medium ${
                  active ? (light ? "text-g15-100" : "text-g15-500") : light ? "text-slate-400" : "text-g15-200/80"
                }`}
              >
                {s.en}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
