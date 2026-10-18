import Link from "next/link";
import { Bebas_Neue } from "next/font/google";
import { UserRound } from "lucide-react";
import { BEST_XI_SLOTS } from "@/lib/g15-awards";

const display = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap" });

export type BestXIPick = {
  slot: string;
  player: {
    id: number;
    firstNameTh: string;
    lastNameTh: string;
    jerseyNumber: number | null;
    photoUrl: string | null;
    team: { name: string; logoUrl: string | null; groupName: string | null };
  };
};

// ตำแหน่งบนสนาม (กึ่งกลางการ์ด, % ของสนาม) ผัง 4-3-3 แบบมีกองกลางตัวรับ — แนวรุกบน, ผู้รักษาประตูล่าง
const SPOT: Record<string, { x: number; y: number }> = {
  LW: { x: 15, y: 13.5 },
  ST: { x: 50, y: 10 },
  RW: { x: 85, y: 13.5 },
  LCM: { x: 29, y: 32 },
  RCM: { x: 71, y: 32 },
  DM: { x: 50, y: 50.5 },
  LB: { x: 12, y: 67 },
  LCB: { x: 37, y: 70.5 },
  RCB: { x: 63, y: 70.5 },
  RB: { x: 88, y: 67 },
  GK: { x: 50, y: 89 },
};

// ขนาดทุกอย่างในการ์ดอิงความกว้างสนาม (cqw) — การ์ดใหญ่ที่สุดเท่าที่วางได้โดยไม่ทับกันทุกขนาดจอ
const CARD_W = "w-[17cqw] sm:w-[13.5cqw]";

// การ์ดนักกีฬาสไตล์ทีมชีต — ขอบทอง รูป เบอร์ ตำแหน่ง โลโก้ทีม ชื่อ
function PlayerCard({ pos, player }: { pos: string; player: BestXIPick["player"] | undefined }) {
  if (!player) {
    return (
      <div className={`${CARD_W} rounded-[1.6cqw] bg-linear-to-b from-amber-200/45 via-amber-500/20 to-amber-900/30 p-[0.25cqw] shadow-[0_1.5cqw_3cqw_rgba(0,0,0,0.45)]`}>
        <div className="relative flex aspect-[4/5.6] flex-col items-center justify-center overflow-hidden rounded-[1.4cqw] bg-linear-to-b from-[#1f1147]/90 via-[#130a2e]/90 to-[#0a0618]/95">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-[radial-gradient(ellipse_at_top,rgba(252,211,77,0.18),transparent_70%)]" />
          <UserRound className="relative h-[7cqw] w-[7cqw] text-amber-200/35 sm:h-[5.5cqw] sm:w-[5.5cqw]" strokeWidth={1.5} />
          <span className={`${display.className} relative mt-[0.6cqw] text-[4.2cqw] leading-none tracking-wide text-amber-200/70 sm:text-[3.2cqw]`}>{pos}</span>
          <span className="relative mt-[0.4cqw] text-[1.9cqw] font-bold text-white/35 sm:text-[1.15cqw]">รอประกาศ</span>
        </div>
      </div>
    );
  }
  return (
    <Link href={`/g15-womens-series/players/${player.id}`} className={`${CARD_W} group block`}>
      <div className="rounded-[1.6cqw] bg-linear-to-b from-amber-50 via-amber-400 to-amber-700 p-[0.3cqw] shadow-[0_1.5cqw_3.5cqw_rgba(0,0,0,0.6),0_0_2.5cqw_rgba(252,211,77,0.35)] transition-all duration-300 group-hover:-translate-y-[0.8cqw] group-hover:shadow-[0_2.5cqw_5cqw_rgba(0,0,0,0.6),0_0_4cqw_rgba(252,211,77,0.6)]">
        <div className="relative overflow-hidden rounded-[1.35cqw] bg-linear-to-b from-[#4b2496] via-[#24104f] to-[#0b0618]">
          <div aria-hidden className="pointer-events-none absolute -right-[3cqw] -top-[3cqw] h-[9cqw] w-[9cqw] rounded-full bg-amber-300/35 blur-[2cqw]" />
          {/* แสงวิ่งผ่านการ์ดตอนชี้ */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 -left-full z-10 w-1/2 -skew-x-12 bg-linear-to-r from-transparent via-white/30 to-transparent transition-all duration-700 group-hover:left-[130%]" />
          <div className="relative aspect-[4/4.4]">
            {player.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={player.photoUrl} alt="" className="absolute inset-x-0 bottom-0 h-[86%] w-full object-cover object-top" />
            ) : (
              <span className={`${display.className} absolute inset-x-0 bottom-[1cqw] text-center text-[9cqw] leading-none text-amber-200/80 sm:text-[7cqw]`}>
                {player.jerseyNumber ?? "?"}
              </span>
            )}
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-[#0b0618] via-[#0b0618]/50 to-transparent" />
            <div className="absolute left-[1.2cqw] top-[0.8cqw] leading-none sm:left-[0.9cqw] sm:top-[0.6cqw]">
              <span className={`${display.className} block text-[5.4cqw] text-amber-200 drop-shadow-[0_0.3cqw_0.6cqw_rgba(0,0,0,0.6)] sm:text-[4.2cqw]`}>
                {player.jerseyNumber ?? ""}
              </span>
              <span className="block text-[2cqw] font-black tracking-wider text-amber-100 sm:text-[1.4cqw]">{pos}</span>
            </div>
            <span className="absolute right-[1cqw] top-[1cqw] flex h-[5cqw] w-[5cqw] items-center justify-center overflow-hidden rounded-full bg-white p-[0.3cqw] shadow sm:right-[0.8cqw] sm:top-[0.8cqw] sm:h-[3.6cqw] sm:w-[3.6cqw]">
              {player.team.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={player.team.logoUrl} alt={player.team.name} className="h-full w-full object-contain" />
              ) : (
                <span className="text-[2cqw] font-black text-g15-700 sm:text-[1.4cqw]">{player.team.name.charAt(0)}</span>
              )}
            </span>
          </div>
          <div className="relative border-t border-amber-300/50 bg-linear-to-r from-amber-600/40 via-amber-300/40 to-amber-600/40 px-[0.8cqw] py-[0.9cqw] text-center sm:py-[0.7cqw]">
            <p className="truncate text-[2.5cqw] font-extrabold leading-tight text-white drop-shadow sm:text-[1.6cqw]">{player.firstNameTh}</p>
            <p className="truncate text-[2cqw] leading-tight text-amber-50/80 sm:text-[1.25cqw]">{player.lastNameTh}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ทีมยอดเยี่ยม (Best XI) บนสนามกลางคืนแบบเอียงมีมิติ — การ์ดวางตามตำแหน่งจริงของผัง 4-3-3 (holding)
export function BestXIPitch({ picks }: { picks: BestXIPick[] }) {
  const bySlot = new Map(picks.map((p) => [p.slot, p.player]));
  const line = "border-white/25";

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-[#04140f] shadow-2xl shadow-black/60 ring-1 ring-amber-300/25">
      <div className="@container relative aspect-[3/5.4] sm:aspect-[5/6.2]">
        {/* พื้นสนาม (เอียงเป็นมุมมองสามมิติ) */}
        <div className="absolute inset-x-[-6%] -bottom-[2%] -top-[12%] origin-bottom [transform:perspective(1600px)_rotateX(10deg)]">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(180deg,#0f6b4f_0px,#0f6b4f_9%,#0c5c43_9%,#0c5c43_18%)]" />
          <div className={`absolute inset-[5%] rounded-sm border-2 ${line}`} />
          <div className={`absolute inset-x-[5%] top-1/2 border-t-2 ${line}`} />
          <div className={`absolute left-1/2 top-1/2 aspect-square w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${line}`} />
          <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50" />
          <div className={`absolute left-1/2 top-[5%] h-[15%] w-[44%] -translate-x-1/2 border-2 border-t-0 ${line}`} />
          <div className={`absolute left-1/2 top-[5%] h-[6%] w-[20%] -translate-x-1/2 border-2 border-t-0 ${line}`} />
          <div className="absolute left-1/2 top-[20%] aspect-[2/1] w-[16%] -translate-x-1/2 overflow-hidden">
            <div className={`absolute bottom-0 left-0 aspect-square w-full translate-y-1/2 rounded-full border-2 ${line}`} />
          </div>
          <div className={`absolute bottom-[5%] left-1/2 h-[15%] w-[44%] -translate-x-1/2 border-2 border-b-0 ${line}`} />
          <div className={`absolute bottom-[5%] left-1/2 h-[6%] w-[20%] -translate-x-1/2 border-2 border-b-0 ${line}`} />
          <div className="absolute bottom-[20%] left-1/2 aspect-[2/1] w-[16%] -translate-x-1/2 overflow-hidden">
            <div className={`absolute left-0 top-0 aspect-square w-full -translate-y-1/2 rounded-full border-2 ${line}`} />
          </div>
        </div>

        {/* ไฟสปอตไลต์ + เงามุม */}
        <div aria-hidden className="pointer-events-none absolute -left-1/4 -top-1/4 h-3/4 w-3/4 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.22),transparent)]" />
        <div aria-hidden className="pointer-events-none absolute -right-1/4 -top-1/4 h-3/4 w-3/4 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.22),transparent)]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.55))]" />
        <span
          aria-hidden
          className={`${display.className} pointer-events-none absolute left-1/2 top-[50%] -translate-x-1/2 -translate-y-1/2 select-none text-[24cqw] leading-none text-white/4 sm:text-[18cqw]`}
        >
          4-3-3
        </span>

        {/* การ์ดนักกีฬา */}
        {BEST_XI_SLOTS.map((s) => {
          const spot = SPOT[s.slot];
          return (
            <div key={s.slot} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${spot.x}%`, top: `${spot.y}%` }}>
              <PlayerCard pos={s.en} player={bySlot.get(s.slot)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
