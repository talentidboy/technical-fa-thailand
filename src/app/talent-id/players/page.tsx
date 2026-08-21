import Link from "next/link";
import { getTalentPlayers, type TalentPlayer } from "@/lib/talent-id";
import { Search, Users } from "lucide-react";

export const fetchCache = "default-cache";

type SearchParams = {
  q?: string;
  province?: string;
  region?: string;
  position?: string;
  year?: string;
  sort?: string;
  dir?: string;
};

type SortKey = "name" | "position" | "club" | "age" | "height" | "weight" | "rating";

const SORT_LABELS: Record<SortKey, string> = {
  name: "ชื่อ",
  position: "ตำแหน่ง",
  club: "สโมสร/โรงเรียน",
  age: "อายุ",
  height: "ส่วนสูง",
  weight: "น้ำหนัก",
  rating: "คะแนน",
};

function bestRating(p: TalentPlayer): number | null {
  return p.avgRatingCamp2026 ?? p.avgRatingLeg2 ?? p.avgRatingLeg1 ?? null;
}

function bestGrade(p: TalentPlayer): string | null {
  return p.gradeCamp2026 ?? p.gradeLeg2 ?? p.gradeLeg1 ?? null;
}

function sortValue(p: TalentPlayer, key: SortKey): string | number {
  switch (key) {
    case "name":
      return p.fullNameTh;
    case "position":
      return p.position1 ?? "";
    case "club":
      return p.club ?? p.school ?? "";
    case "age":
      return p.age ?? -1;
    case "height":
      return p.height ?? -1;
    case "weight":
      return p.weight ?? -1;
    case "rating":
      return bestRating(p) ?? -1;
  }
}

function distinctSorted(values: (string | null)[]) {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v)))).sort((a, b) =>
    a.localeCompare(b, "th"),
  );
}

export default async function TalentIdPlayersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  let players: TalentPlayer[] = [];
  let loadError: string | null = null;
  try {
    players = await getTalentPlayers();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "ไม่สามารถดึงข้อมูลจาก Airtable ได้";
  }

  const provinces = distinctSorted(players.map((p) => p.province));
  const regions = distinctSorted(players.map((p) => p.region));
  const positions = distinctSorted(players.map((p) => p.position1));
  const years = distinctSorted(players.map((p) => p.yearOfBirth));

  const q = (params.q ?? "").trim().toLowerCase();
  const filtered = players.filter((p) => {
    if (params.province && p.province !== params.province) return false;
    if (params.region && p.region !== params.region) return false;
    if (params.position && p.position1 !== params.position) return false;
    if (params.year && p.yearOfBirth !== params.year) return false;
    if (q) {
      const haystack = `${p.fullNameTh} ${p.fullNameEn ?? ""} ${p.nickname ?? ""} ${p.club ?? ""} ${p.school ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const sortKey: SortKey = (params.sort as SortKey) in SORT_LABELS ? (params.sort as SortKey) : "name";
  const sortAsc = params.dir !== "desc";
  const sorted = [...filtered].sort((a, b) => {
    const va = sortValue(a, sortKey);
    const vb = sortValue(b, sortKey);
    const cmp =
      typeof va === "number" && typeof vb === "number"
        ? va - vb
        : String(va).localeCompare(String(vb), "th");
    return sortAsc ? cmp : -cmp;
  });

  const hasFilters = Boolean(
    params.q || params.province || params.region || params.position || params.year,
  );

  function sortHref(key: SortKey) {
    const q2 = new URLSearchParams();
    if (params.q) q2.set("q", params.q);
    if (params.province) q2.set("province", params.province);
    if (params.region) q2.set("region", params.region);
    if (params.position) q2.set("position", params.position);
    if (params.year) q2.set("year", params.year);
    q2.set("sort", key);
    if (sortKey === key && sortAsc) q2.set("dir", "desc");
    return `/talent-id/players?${q2.toString()}`;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">ผู้เล่นทั้งหมด</h1>
        <p className="mt-1 max-w-xl text-sm text-indigo-300">
          ค้นหาและกรองรายชื่อนักกีฬาในระบบ Talent ID
        </p>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-dashed border-red-400/30 bg-red-400/5 px-6 py-10 text-center text-sm text-red-300">
          ดึงข้อมูลจาก Airtable ไม่สำเร็จ: {loadError}
        </div>
      ) : (
        <>
          {/* ตัวกรอง */}
          <form className="mb-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
              <input
                type="text"
                name="q"
                defaultValue={params.q}
                placeholder="ค้นหาชื่อ, สโมสร, โรงเรียน..."
                className="w-full rounded-lg border border-white/15 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-indigo-400 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <FilterSelect label="จังหวัด" name="province" options={provinces} value={params.province} />
              <FilterSelect label="ภูมิภาค" name="region" options={regions} value={params.region} />
              <FilterSelect label="ตำแหน่ง" name="position" options={positions} value={params.position} />
              <FilterSelect label="ปีเกิด" name="year" options={years} value={params.year} />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-indigo-950 hover:bg-amber-300"
              >
                กรองข้อมูล
              </button>
              {hasFilters && (
                <Link
                  href="/talent-id/players"
                  className="text-sm font-medium text-indigo-300 hover:text-white"
                >
                  ล้างตัวกรอง
                </Link>
              )}
              <span className="ml-auto text-xs text-indigo-400">
                พบ {sorted.length.toLocaleString()} จาก {players.length.toLocaleString()} คน
              </span>
            </div>
          </form>

          {sorted.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-16 text-center">
              <Users className="h-8 w-8 text-indigo-400" />
              <p className="text-sm text-indigo-300">
                {players.length === 0
                  ? "ยังไม่มีข้อมูลนักกีฬาใน Airtable"
                  : "ไม่พบนักกีฬาที่ตรงกับเงื่อนไขที่เลือก"}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/20 text-[11px] font-medium uppercase tracking-wide text-indigo-300">
                    <tr>
                      <th className="px-4 py-3">
                        <SortHeader href={sortHref("name")} active={sortKey === "name"} asc={sortAsc}>
                          {SORT_LABELS.name}
                        </SortHeader>
                      </th>
                      <th className="px-4 py-3">
                        <SortHeader href={sortHref("position")} active={sortKey === "position"} asc={sortAsc}>
                          {SORT_LABELS.position}
                        </SortHeader>
                      </th>
                      <th className="px-4 py-3">
                        <SortHeader href={sortHref("club")} active={sortKey === "club"} asc={sortAsc}>
                          {SORT_LABELS.club}
                        </SortHeader>
                      </th>
                      <th className="px-4 py-3 text-center">
                        <SortHeader href={sortHref("age")} active={sortKey === "age"} asc={sortAsc}>
                          {SORT_LABELS.age}
                        </SortHeader>
                      </th>
                      <th className="px-4 py-3 text-center">
                        <SortHeader href={sortHref("height")} active={sortKey === "height"} asc={sortAsc}>
                          {SORT_LABELS.height}
                        </SortHeader>
                      </th>
                      <th className="px-4 py-3 text-center">
                        <SortHeader href={sortHref("weight")} active={sortKey === "weight"} asc={sortAsc}>
                          {SORT_LABELS.weight}
                        </SortHeader>
                      </th>
                      <th className="px-4 py-3 text-center">
                        <SortHeader href={sortHref("rating")} active={sortKey === "rating"} asc={sortAsc}>
                          {SORT_LABELS.rating}
                        </SortHeader>
                      </th>
                      <th className="px-4 py-3 text-center">เกรด</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {sorted.map((player) => {
                      const rating = bestRating(player);
                      const grade = bestGrade(player);
                      return (
                        <tr key={player.id} className="transition-colors hover:bg-white/5">
                          <td className="px-4 py-3">
                            <Link href={`/talent-id/${player.id}`} className="flex items-center gap-3">
                              {player.photoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={player.photoUrl}
                                  alt=""
                                  className="h-8 w-8 flex-none rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-indigo-800 text-xs font-semibold text-indigo-200">
                                  {player.fullNameTh.charAt(0)}
                                </div>
                              )}
                              <span className="font-medium text-white hover:text-amber-300">
                                {player.fullNameTh}
                              </span>
                            </Link>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-indigo-200">
                            {player.position1 ?? "-"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-indigo-200">
                            {player.club || player.school || "-"}
                          </td>
                          <td className="px-4 py-3 text-center text-indigo-200">
                            {player.age ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-center text-indigo-200">
                            {player.height ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-center text-indigo-200">
                            {player.weight ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {rating != null ? (
                              <span className="rounded-md bg-amber-400/15 px-2 py-0.5 text-xs font-bold text-amber-300">
                                {rating.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-indigo-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-indigo-200">
                            {grade ?? "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SortHeader({
  href,
  active,
  asc,
  children,
}: {
  href: string;
  active: boolean;
  asc: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1 hover:text-white ${active ? "text-amber-300" : ""}`}
    >
      {children}
      {active && <span>{asc ? "▲" : "▼"}</span>}
    </Link>
  );
}

function FilterSelect({
  label,
  name,
  options,
  value,
}: {
  label: string;
  name: string;
  options: string[];
  value?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-400">
        {label}
      </span>
      <select
        name={name}
        defaultValue={value ?? ""}
        className="rounded-lg border border-white/15 bg-indigo-950 px-2.5 py-2 text-xs text-indigo-100 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
      >
        <option value="">ทั้งหมด</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
