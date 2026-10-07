import Image from "next/image";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { G15_IMAGE_URL } from "@/lib/brand";
import { TeamBadge } from "./TeamBadge";

type HeroTeam = { id: number; name: string; logoUrl: string | null; groupName: string | null; nationalGroup: string | null };

const BANGKOK_TZ = "Asia/Bangkok";

function dayMonth(date: Date) {
  return date.toLocaleDateString("en-GB", { timeZone: BANGKOK_TZ, day: "numeric", month: "short" });
}

// แบนเนอร์หน้าแรกของรอบชิงแชมป์ประเทศ — วาดด้วยโค้ดตามอาร์ตเวิร์กทางการ (ม่วง #3b1890 + เส้นแปรงชมพู/ฟ้า)
// แทนภาพแบนเนอร์รอบภูมิภาค: ชื่อรอบ, ช่วงวันแข่งจากโปรแกรมจริง, สนาม และโลโก้ 8 ทีมแยกกลุ่ม
export function NationalHero({
  teams,
  firstMatch,
  lastMatch,
  venue,
}: {
  teams: HeroTeam[];
  firstMatch: Date | null;
  lastMatch: Date | null;
  venue: string;
}) {
  const dateLabel =
    firstMatch && lastMatch && dayMonth(firstMatch) !== dayMonth(lastMatch)
      ? `${dayMonth(firstMatch)} – ${dayMonth(lastMatch)} 2026`
      : firstMatch
        ? `${dayMonth(firstMatch)} 2026`
        : "2026";

  return (
    <div className="relative isolate overflow-hidden px-6 pb-24 pt-10 sm:pb-32 sm:pt-14">
      {/* ลายดอกไม้/บอลจาง ๆ มุมขวาบน + ไฟส่องเวที */}
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-g15-400/25 blur-3xl" />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center text-center">
        <Image
          src={G15_IMAGE_URL}
          alt="G15 Women's Football Series"
          width={160}
          height={160}
          className="h-24 w-24 object-contain drop-shadow-2xl sm:h-32 sm:w-32"
          priority
        />
        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.3em] text-g15-200 sm:text-xs">
          FA Thailand G15 Women&apos;s Football Series 2026
        </p>
        <h1 className="mt-2 bg-linear-to-b from-white to-g15-200 bg-clip-text text-5xl font-black uppercase leading-none tracking-tight text-transparent sm:text-7xl">
          National Round
        </h1>
        <p className="mt-3 text-lg font-extrabold text-amber-300 sm:text-2xl">รอบชิงแชมป์ประเทศไทย</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-white sm:text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 ring-1 ring-white/20">
            <CalendarDays className="h-4 w-4 text-pink-300" />
            {dateLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 ring-1 ring-white/20">
            <MapPin className="h-4 w-4 text-cyan-300" />
            {venue}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 ring-1 ring-white/20">
            <Users className="h-4 w-4 text-amber-300" />
            {teams.length} ทีม · 4 ภาค
          </span>
        </div>

        {teams.length > 0 && (
          <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
            {["A", "B"].map((group) => (
              <div key={group} className="rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-g15-200">Group {group}</p>
                <div className="mt-2 flex items-center justify-center gap-3">
                  {teams
                    .filter((t) => t.nationalGroup === group)
                    .map((t) => (
                      <span key={t.id} title={t.name} className="transition-transform hover:scale-110">
                        <TeamBadge team={t} size="md" />
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
