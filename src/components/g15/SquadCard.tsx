import Link from "next/link";
import { UserRound } from "lucide-react";

// การ์ดนักกีฬา/เจ้าหน้าที่แบบ Squad List — รูปไดคัท (พื้นโปร่งใส) วางบนพื้นม่วงของรายการ + เบอร์เสื้อตัวใหญ่มุมขวาบน
// รูปเก็บเป็น 600x800 ตัวคนชิดขอบล่าง จึงใช้ object-contain object-bottom ให้ไหล่ชนขอบล่างของกรอบรูปพอดีทุกใบ
export function SquadCard({
  href,
  photoUrl,
  number,
  name,
  nameEn,
  caption,
  tone = "player",
}: {
  href?: string;
  photoUrl: string | null;
  number?: number | null;
  name: string;
  nameEn?: string | null;
  caption: string;
  tone?: "player" | "staff";
}) {
  const body = (
    <div className="group h-full overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-g15-900/15">
      <div
        className={`relative aspect-[3/4] overflow-hidden ${
          tone === "player"
            ? "bg-linear-to-b from-g15-400 via-g15-600 to-g15-900"
            : "bg-linear-to-b from-slate-400 via-g15-700 to-g15-950"
        }`}
      >
        {/* ลายเส้นทแยงจางๆ ให้พื้นไม่เรียบเกินไป */}
        <div aria-hidden className="absolute -left-10 top-6 h-3 w-48 -rotate-[35deg] rounded-full bg-linear-to-r from-transparent via-pink-400/50 to-transparent" />
        <div aria-hidden className="absolute -right-12 top-1/3 h-2 w-44 -rotate-[35deg] rounded-full bg-linear-to-r from-transparent via-cyan-300/40 to-transparent" />
        {number != null && (
          <span className="absolute right-2 top-0 text-6xl font-black italic leading-none tracking-tighter text-white/85 drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)] sm:text-7xl">
            {number}
          </span>
        )}
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={name}
            loading="lazy"
            className="absolute inset-x-0 bottom-0 h-[92%] w-full object-contain object-bottom transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <UserRound className="absolute bottom-0 left-1/2 h-3/4 w-3/4 -translate-x-1/2 translate-y-[12%] text-white/25" strokeWidth={1.2} />
        )}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/5 bg-linear-to-t from-g15-950/40 to-transparent" />
      </div>
      <div className="space-y-0.5 px-3 py-2.5">
        {number != null && <p className="text-xs font-black text-g15-600">{number}</p>}
        <p className="line-clamp-2 text-[13px] font-bold leading-snug text-slate-900">{name}</p>
        {nameEn && <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400">{nameEn}</p>}
        <p className="truncate text-[11px] font-medium text-g15-500">{caption}</p>
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}
