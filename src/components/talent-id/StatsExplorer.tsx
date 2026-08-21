"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Trophy, Target } from "lucide-react";
import { POSITION_CATEGORY_LABEL, type MatchStatsRow } from "@/lib/talent-match-stats";

const POSITION_COLOR: Record<string, string> = {
  FW: "#fbbf24", // amber-400
  MF: "#38bdf8", // sky-400
  DF: "#34d399", // emerald-400
  GK: "#a78bfa", // violet-400
};
const DEFAULT_COLOR = "#818cf8"; // indigo-400

const POSITION_TABS: { key: "ALL" | "FW" | "MF" | "DF" | "GK"; label: string }[] = [
  { key: "ALL", label: "ทั้งหมด" },
  { key: "FW", label: "กองหน้า" },
  { key: "MF", label: "กองกลาง" },
  { key: "DF", label: "กองหลัง" },
  { key: "GK", label: "ผู้รักษาประตู" },
];

const SORT_OPTIONS: { key: string; label: string }[] = [
  { key: "NAME", label: "ชื่อ (ก-ฮ)" },
  { key: "GOAL", label: "ทำประตูสูงสุด" },
  { key: "ASSIST", label: "แอสซิสต์สูงสุด" },
  { key: "PASSING", label: "จ่ายบอลสูงสุด" },
  { key: "DEFENSIVE ACTION", label: "เกมรับสูงสุด" },
  { key: "TAKE ON 1V1", label: "เลี้ยงผ่าน 1v1 สูงสุด" },
];

function initials(name: string) {
  return name.trim().charAt(0) || "?";
}

function MiniLeaderboard({
  title,
  icon: Icon,
  data,
  statKey,
}: {
  title: string;
  icon: typeof Trophy;
  data: MatchStatsRow[];
  statKey: string;
}) {
  const rows = [...data]
    .map((row) => ({ row, value: row.stats[statKey] ?? 0 }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-indigo-400">ยังไม่มีข้อมูล</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map(({ row, value }, i) => {
            const rank = (
              <span
                className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11px] font-bold ${
                  i === 0
                    ? "bg-amber-400 text-amber-950"
                    : i === 1
                      ? "bg-slate-300 text-slate-900"
                      : i === 2
                        ? "bg-orange-400/80 text-orange-950"
                        : "bg-white/10 text-indigo-300"
                }`}
              >
                {i + 1}
              </span>
            );
            const content = (
              <>
                {rank}
                <span className="min-w-0 flex-1 truncate text-sm text-indigo-100">{row.name}</span>
                <span className="flex-none text-sm font-bold text-amber-300">{value}</span>
              </>
            );
            return (
              <li key={row.id}>
                {row.playerId ? (
                  <Link
                    href={`/talent-id/${row.playerId}`}
                    className="flex w-full items-center gap-2.5 rounded-lg transition-colors hover:bg-white/5"
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="flex w-full items-center gap-2.5 rounded-lg">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function PlayerCard({ row }: { row: MatchStatsRow }) {
  const color = row.positionCategory ? POSITION_COLOR[row.positionCategory] : DEFAULT_COLOR;
  const body = (
    <>
      <div className="mb-3 flex items-center gap-3">
        {row.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.photoUrl}
            alt=""
            className="h-12 w-12 flex-none rounded-full border-2 object-cover"
            style={{ borderColor: color }}
          />
        ) : (
          <div
            className="flex h-12 w-12 flex-none items-center justify-center rounded-full border-2 bg-indigo-950 text-sm font-semibold text-indigo-200"
            style={{ borderColor: color }}
          >
            {initials(row.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white group-hover:text-amber-300">
            {row.name}
          </p>
          <p className="truncate text-xs" style={{ color }}>
            {row.positionCategory ? POSITION_CATEGORY_LABEL[row.positionCategory] : row.position ?? "-"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1 border-t border-white/10 pt-3">
        {[
          { label: "ประตู", value: row.stats.GOAL ?? 0 },
          { label: "แอสซิสต์", value: row.stats.ASSIST ?? 0 },
          { label: "จ่าย", value: row.stats.PASSING ?? 0 },
          { label: "เกมรับ", value: row.stats["DEFENSIVE ACTION"] ?? 0 },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-sm font-bold text-white">{s.value}</p>
            <p className="text-[10px] uppercase tracking-wide text-indigo-400">{s.label}</p>
          </div>
        ))}
      </div>
    </>
  );

  const className =
    "group flex flex-col rounded-2xl border border-white/10 bg-linear-to-b from-white/7 to-white/2 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-amber-400/40";

  if (!row.playerId) {
    return <div className={className}>{body}</div>;
  }
  return (
    <Link href={`/talent-id/${row.playerId}`} className={className}>
      {body}
    </Link>
  );
}

export function StatsExplorer({ data }: { data: MatchStatsRow[] }) {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("ALL");
  const [positionTab, setPositionTab] = useState<"ALL" | "FW" | "MF" | "DF" | "GK">("ALL");
  const [sortKey, setSortKey] = useState("NAME");

  const regions = useMemo(
    () => Array.from(new Set(data.map((d) => d.region).filter((r): r is string => Boolean(r)))).sort(),
    [data],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = data.filter((row) => {
      const matchTab = positionTab === "ALL" || row.positionCategory === positionTab;
      const matchSearch = !q || row.name.toLowerCase().includes(q) || (row.school ?? "").toLowerCase().includes(q);
      const matchRegion = region === "ALL" || row.region === region;
      return matchTab && matchSearch && matchRegion;
    });

    if (sortKey === "NAME") {
      rows = [...rows].sort((a, b) => a.name.localeCompare(b.name, "th"));
    } else {
      rows = [...rows].sort((a, b) => (b.stats[sortKey] ?? 0) - (a.stats[sortKey] ?? 0));
    }
    return rows;
  }, [data, search, region, positionTab, sortKey]);

  return (
    <div>
      {/* ตัวกรอง */}
      <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 sm:flex-row sm:flex-wrap">
        <div className="relative flex-1 sm:min-w-55">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ, โรงเรียน..."
            className="w-full rounded-lg border border-white/15 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-indigo-400 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
          />
        </div>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="rounded-lg border border-white/15 bg-indigo-950 px-3 py-2.5 text-sm text-indigo-100 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20 sm:w-56"
        >
          <option value="ALL">ทุกภูมิภาค</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
          className="rounded-lg border border-white/15 bg-indigo-950 px-3 py-2.5 text-sm text-indigo-100 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20 sm:w-56"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* แท็บตำแหน่ง */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {POSITION_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setPositionTab(tab.key)}
            className={`flex-none rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
              positionTab === tab.key
                ? "border-amber-400 bg-amber-400/15 text-amber-300"
                : "border-white/15 bg-white/5 text-indigo-300 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:order-2 lg:w-72 lg:flex-none">
          <MiniLeaderboard title="ทำประตูสูงสุด" icon={Target} data={data} statKey="GOAL" />
          <MiniLeaderboard title="แอสซิสต์สูงสุด" icon={Trophy} data={data} statKey="ASSIST" />
        </div>

        <div className="min-w-0 flex-1 lg:order-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-16 text-center">
              <p className="text-sm text-indigo-300">ไม่พบนักเตะที่ตรงกับเงื่อนไขที่เลือก</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((row) => (
                <PlayerCard key={row.id} row={row} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
