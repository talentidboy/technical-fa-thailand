import Link from "next/link";
import { TeamBadge } from "./TeamBadge";
import { BEST_XI_SLOTS } from "@/lib/g15-awards";

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

// ทีมยอดเยี่ยม (Best XI) บนสนามผัง 4-3-3 แบบมีกองกลางตัวรับ — แนวรุกบนสุด, DM อยู่หน้ากองหลังแถวเดียว, ผู้รักษาประตูล่างสุด
export function BestXIPitch({ picks }: { picks: BestXIPick[] }) {
  const bySlot = new Map(picks.map((p) => [p.slot, p.player]));

  return (
    <div className="overflow-hidden rounded-3xl shadow-xl shadow-emerald-950/20 ring-1 ring-emerald-900/20">
      <div className="relative bg-[repeating-linear-gradient(180deg,#059669_0px,#059669_56px,#047857_56px,#047857_112px)] px-2 py-7 sm:px-8 sm:py-9">
        {/* เส้นสนาม */}
        <div aria-hidden className="pointer-events-none absolute inset-3 rounded-xl border-2 border-white/30" />
        <div aria-hidden className="pointer-events-none absolute inset-x-3 top-1/2 border-t-2 border-white/30" />
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30" />
        <div aria-hidden className="pointer-events-none absolute bottom-3 left-1/2 h-16 w-48 -translate-x-1/2 border-2 border-b-0 border-white/30" />
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-3 h-16 w-48 -translate-x-1/2 border-2 border-t-0 border-white/30" />

        <div className="relative space-y-5 sm:space-y-7">
          {[4, 3, 2, 1, 0].map((row) => {
            const slots = BEST_XI_SLOTS.filter((s) => s.row === row);
            return (
              <div key={row} className={`mx-auto flex justify-evenly gap-1 ${slots.length === 2 ? "max-w-md" : slots.length === 1 ? "max-w-xs" : "max-w-3xl"}`}>
                {slots.map((s) => {
                  const p = bySlot.get(s.slot);
                  return (
                    <div key={s.slot} className="flex w-20 flex-col items-center text-center sm:w-28">
                      {p ? (
                        <Link href={`/g15-womens-series/players/${p.id}`} className="group flex flex-col items-center">
                          <span className="relative">
                            {p.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.photoUrl}
                                alt=""
                                className="h-14 w-14 rounded-full object-cover shadow-lg ring-[3px] ring-amber-300 transition-transform group-hover:scale-105 sm:h-16 sm:w-16"
                              />
                            ) : (
                              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white font-mono text-xl font-black text-emerald-800 shadow-lg ring-[3px] ring-amber-300 sm:h-16 sm:w-16">
                                {p.jerseyNumber ?? "-"}
                              </span>
                            )}
                            <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 shadow">
                              <TeamBadge team={p.team} size="sm" />
                            </span>
                          </span>
                          <span className="mt-2 line-clamp-2 rounded-md bg-emerald-950/55 px-1.5 py-0.5 text-[11px] font-bold leading-tight text-white backdrop-blur sm:text-xs">
                            {p.jerseyNumber != null && <span className="mr-1 text-amber-300">{p.jerseyNumber}</span>}
                            {p.firstNameTh} {p.lastNameTh}
                          </span>
                        </Link>
                      ) : (
                        <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-white/50 text-xs font-bold text-white/70 sm:h-16 sm:w-16">
                          ?
                        </span>
                      )}
                      <span className="mt-1 text-[10px] font-black uppercase tracking-wider text-amber-200">{s.en}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
