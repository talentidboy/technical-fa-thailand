import Link from "next/link";
import { House } from "lucide-react";

// ปุ่มกลับหน้าแรก — ทุกหมวดวางไว้ "มุมขวาบนสุด" ของแถบบน หน้าตาเดียวกันทุกหมวด (tone ตามสีของแถบ)
export function HomeButton({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <Link
      href="/"
      aria-label="กลับหน้าแรก"
      className={`inline-flex h-10 flex-none items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-colors ${
        tone === "dark" ? "border-white/25 text-white hover:bg-white/10" : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
      } ${className}`}
    >
      <House className="h-4 w-4" />
      <span className="hidden sm:inline">หน้าแรก</span>
    </Link>
  );
}
