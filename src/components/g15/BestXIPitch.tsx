import Link from "next/link";
import { Bebas_Neue } from "next/font/google";
import { UserRound } from "lucide-react";
import { TeamBadge } from "./TeamBadge";
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
  LW: { x: 16, y: 14 },
  ST: { x: 50, y: 11 },
  RW: { x: 84, y: 14 },
  LCM: { x: 30, y: 34 },
  RCM: { x: 70, y: 34 },
  DM: { x: 50, y: 52 },
  LB: { x: 12, y: 69 },
  LCB: { x: 37, y: 72 },
  RCB: { x: 63, y: 72 },
  RB: { x: 88, y: 69 },
  GK: { x: 50, y: 89 },
};

// การ์ดนักกีฬาสไตล์ทีมชีต (ขอบทอง รูป + เบอร์ + ตำแหน่ง + โลโก้ทีม + ชื่อ)
function PlayerCard({ pos, player }: { pos: string; player: BestXIPick["player"] | undefined }) {
  const frame = "w-[3.6rem] sm:w-[6.5rem]";
  if (!player) {
    return (
      <div className={`${frame} rounded-2xl bg-white/15 p-[1.5px]`}>
        <div className="flex aspect-[3/4] flex-col items-center justify-center rounded-[14px] bg-linear-to-b from-[#123b2f]/90 to-[#071a14]/90 backdrop-blur-sm">
          <UserRound className="h-6 w-6 text-white/25 sm:h-10 sm:w-10" />
          <span className={`${display.className} mt-1 text-sm text-white/40 sm:text-lg`}>{pos}</span>
        </div>
      </div>
    );
  }
  return (
    <Link href={`/g15-womens-series/players/${player.id}`} className={`${frame} group block`}>
      <div className="rounded-2xl bg-linear-to-b from-amber-100 via-amber-400 to-amber-700 p-[1.5px] shadow-[0_12px_28px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_40px_rgba(252,211,77,0.35)]">
        <div className="relative overflow-hidden rounded-[14px] bg-linear-to-b from-[#3a1d78] via-[#1b0d3d] to-[#0b0618]">
          {/* แสงทองมุมบน */}
          <div aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-amber-300/30 blur-xl" />
          <div className="relative aspect-[3/4]">
            {player.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={player.photoUrl} alt="" className="absolute inset-x-0 bottom-0 h-[82%] w-full object-cover object-top" />
            ) : (
              <span className={`${display.className} absolute inset-x-0 bottom-3 text-center text-5xl text-amber-200/80 sm:text-7xl`}>
                {player.jerseyNumber ?? "?"}
              </span>
            )}
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-[#0b0618] to-transparent" />
            <div className="absolute left-1.5 top-1 leading-none sm:left-2 sm:top-1.5">
              <span className={`${display.className} block text-lg text-amber-200 drop-shadow sm:text-3xl`}>{player.jerseyNumber ?? ""}</span>
              <span className="block text-[8px] font-black tracking-wider text-amber-100/90 sm:text-[11px]">{pos}</span>
            </div>
            <span className="absolute right-0.5 top-0.5 origin-top-right scale-75 rounded-full bg-white p-0.5 shadow sm:right-1.5 sm:top-1.5 sm:scale-100">
              <TeamBadge team={player.team} size="sm" />
            </span>
          </div>
          <div className="relative border-t border-amber-300/40 bg-linear-to-r from-amber-500/25 via-amber-300/30 to-amber-500/25 px-1 py-1 text-center sm:py-1.5">
            <p className="truncate text-[9px] font-extrabold leading-tight text-white sm:text-xs">{player.firstNameTh}</p>
            <p className="truncate text-[8px] leading-tight text-amber-100/70 sm:text-[10px]">{player.lastNameTh}</p>
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
    <div className="relative overflow-hidden rounded-[2rem] bg-[#04140f] shadow-2xl shadow-black/60 ring-1 ring-amber-300/20">
      <div className="relative aspect-[3/5.4] sm:aspect-[5/4.4]">
        {/* พื้นสนาม (เอียงเป็นมุมมองสามมิติ) */}
        <div className="absolute inset-x-[-6%] -bottom-[2%] -top-[12%] origin-bottom [transform:perspective(1600px)_rotateX(10deg)]">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(180deg,#0f6b4f_0px,#0f6b4f_9%,#0c5c43_9%,#0c5c43_18%)]" />
          {/* เส้นสนาม */}
          <div className={`absolute inset-[5%] rounded-sm border-2 ${line}`} />
          <div className={`absolute inset-x-[5%] top-1/2 border-t-2 ${line}`} />
          <div className={`absolute left-1/2 top-1/2 aspect-square w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${line}`} />
          <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50" />
          {/* กรอบเขตโทษ + เขตประตู บน/ล่าง */}
          <div className={`absolute left-1/2 top-[5%] h-[15%] w-[44%] -translate-x-1/2 border-2 border-t-0 ${line}`} />
          <div className={`absolute left-1/2 top-[5%] h-[6%] w-[20%] -translate-x-1/2 border-2 border-t-0 ${line}`} />
          <div className={`absolute left-1/2 top-[20%] aspect-[2/1] w-[16%] -translate-x-1/2 overflow-hidden`}>
            <div className={`absolute bottom-0 left-0 aspect-square w-full translate-y-1/2 rounded-full border-2 ${line}`} />
          </div>
          <div className={`absolute bottom-[5%] left-1/2 h-[15%] w-[44%] -translate-x-1/2 border-2 border-b-0 ${line}`} />
          <div className={`absolute bottom-[5%] left-1/2 h-[6%] w-[20%] -translate-x-1/2 border-2 border-b-0 ${line}`} />
          <div className={`absolute bottom-[20%] left-1/2 aspect-[2/1] w-[16%] -translate-x-1/2 overflow-hidden`}>
            <div className={`absolute left-0 top-0 aspect-square w-full -translate-y-1/2 rounded-full border-2 ${line}`} />
          </div>
        </div>

        {/* ไฟสปอตไลต์ + เงามุม */}
        <div aria-hidden className="pointer-events-none absolute -left-1/4 -top-1/4 h-3/4 w-3/4 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.22),transparent)]" />
        <div aria-hidden className="pointer-events-none absolute -right-1/4 -top-1/4 h-3/4 w-3/4 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.22),transparent)]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.55))]" />
        <span
          aria-hidden
          className={`${display.className} pointer-events-none absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2 select-none text-[22vw] leading-none text-white/4 sm:text-[11rem]`}
        >
          4-3-3
        </span>

        {/* การ์ดนักกีฬา */}
        {BEST_XI_SLOTS.map((s) => {
          const spot = SPOT[s.slot];
          return (
            <div
              key={s.slot}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
            >
              <PlayerCard pos={s.en} player={bySlot.get(s.slot)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
