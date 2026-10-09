import Link from "next/link";
import { Star } from "lucide-react";
import { TeamBadge } from "./TeamBadge";
import { TEAM_OF_ROUND_SLOTS } from "@/lib/g15-stage";

export type TeamOfRoundPick = {
  slot: string;
  player: {
    id: number;
    firstNameTh: string;
    lastNameTh: string;
    jerseyNumber: number | null;
    photoUrl?: string | null;
    team: { name: string; logoUrl: string | null; groupName: string | null };
  };
};

// ทีมยอดเยี่ยมประจำรอบ วางบนสนามผัง 4-3-3 (กองหน้าอยู่บน ผู้รักษาประตูอยู่ล่าง) — ตำแหน่งที่ยังไม่เลือกจะไม่แสดง
export function TeamOfRoundPitch({ picks, title }: { picks: TeamOfRoundPick[]; title: string }) {
  const bySlot = new Map(picks.map((p) => [p.slot, p.player]));
  const lines = [3, 2, 1, 0].map((line) => TEAM_OF_ROUND_SLOTS.filter((s) => s.line === line && bySlot.has(s.slot)));

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <Star className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="ml-auto text-[11px] text-slate-400">4-3-3</span>
      </div>
      <div className="relative bg-linear-to-b from-emerald-600 to-emerald-700 px-2 py-6 sm:px-6">
        {/* เส้นสนาม */}
        <div aria-hidden className="pointer-events-none absolute inset-3 rounded-lg border-2 border-white/25" />
        <div aria-hidden className="pointer-events-none absolute inset-x-3 top-1/2 border-t-2 border-white/25" />
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/25" />
        <div aria-hidden className="pointer-events-none absolute bottom-3 left-1/2 h-14 w-40 -translate-x-1/2 border-2 border-b-0 border-white/25" />

        <div className="relative space-y-6">
          {lines.map((slots, i) =>
            slots.length === 0 ? null : (
              <div key={i} className="flex justify-around gap-1">
                {slots.map((s) => {
                  const p = bySlot.get(s.slot)!;
                  return (
                    <Link
                      key={s.slot}
                      href={`/g15-womens-series/players/${p.id}`}
                      className="group flex w-20 flex-col items-center gap-1 text-center sm:w-24"
                    >
                      <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-b from-g15-400 to-g15-700 text-sm font-extrabold text-white shadow-lg ring-2 ring-white transition-transform group-hover:scale-110 sm:h-14 sm:w-14">
                        {/* ตัดขอบวงกลมเฉพาะรูป — โลโก้ทีมที่มุมล่างขวาต้องล้นออกนอกวงได้ */}
                        {p.photoUrl ? (
                          <span className="absolute inset-0 overflow-hidden rounded-full">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.photoUrl} alt="" className="h-[125%] w-full object-cover object-top" />
                          </span>
                        ) : (
                          p.jerseyNumber ?? "-"
                        )}
                        <span className="absolute -bottom-1 -right-1">
                          <TeamBadge team={p.team} size="sm" />
                        </span>
                      </span>
                      <span className="line-clamp-2 rounded bg-black/30 px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-white sm:text-[11px]">
                        {p.firstNameTh} {p.lastNameTh}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
