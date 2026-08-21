import Link from "next/link";
import {
  getTalentPlayersPage,
  POSITIONS,
  REGIONS,
  YEARS_OF_BIRTH,
  PROVINCES,
  type TalentSortKey,
} from "@/lib/talent-id";
import { Search, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { Breadcrumb } from "@/components/talent-id/Breadcrumb";

export const fetchCache = "default-cache";

type SearchParams = {
  q?: string;
  province?: string;
  region?: string;
  position?: string;
  year?: string;
  sort?: string;
  dir?: string;
  c?: string | string[];
};

const SORT_LABELS: Record<TalentSortKey, string> = {
  name: "ชื่อ",
  position: "ตำแหน่ง",
  club: "สโมสร",
  age: "อายุ",
  height: "ส่วนสูง",
  weight: "น้ำหนัก",
  rating: "คะแนน (Camp 2026)",
};

const SORT_KEYS = Object.keys(SORT_LABELS) as TalentSortKey[];

function toArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export default async function TalentIdPlayersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const sortKey: TalentSortKey = SORT_KEYS.includes(params.sort as TalentSortKey)
    ? (params.sort as TalentSortKey)
    : "name";
  const sortAsc = params.dir !== "desc";
  const cursors = toArray(params.c);
  const currentOffset = cursors[cursors.length - 1];
  const pageNum = cursors.length + 1;

  let players: Awaited<ReturnType<typeof getTalentPlayersPage>>["players"] = [];
  let nextOffset: string | undefined;
  let loadError: string | null = null;
  try {
    const result = await getTalentPlayersPage({
      search: params.q,
      province: params.province,
      region: params.region,
      position: params.position,
      year: params.year,
      sortKey,
      sortAsc,
      offset: currentOffset,
      pageSize: 50,
    });
    players = result.players;
    nextOffset = result.offset;
  } catch (err) {
    loadError = err instanceof Error ? err.message : "ไม่สามารถดึงข้อมูลจาก Airtable ได้";
  }

  const hasFilters = Boolean(
    params.q || params.province || params.region || params.position || params.year,
  );

  function baseParams() {
    const q = new URLSearchParams();
    if (params.q) q.set("q", params.q);
    if (params.province) q.set("province", params.province);
    if (params.region) q.set("region", params.region);
    if (params.position) q.set("position", params.position);
    if (params.year) q.set("year", params.year);
    return q;
  }

  function sortHref(key: TalentSortKey) {
    const q = baseParams();
    q.set("sort", key);
    if (sortKey === key && sortAsc) q.set("dir", "desc");
    return `/talent-id/players?${q.toString()}`;
  }

  function pageHref(newCursors: string[]) {
    const q = baseParams();
    if (sortKey !== "name") q.set("sort", sortKey);
    if (!sortAsc) q.set("dir", "desc");
    for (const c of newCursors) q.append("c", c);
    return `/talent-id/players?${q.toString()}`;
  }

  return (
    <div>
      <Breadcrumb items={[{ label: "Talent ID", href: "/talent-id" }, { label: "ผู้เล่นทั้งหมด" }]} />
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">ผู้เล่นทั้งหมด</h1>
        <p className="mt-1 max-w-xl text-sm text-indigo-300">
          ค้นหาและกรองรายชื่อนักกีฬาในระบบ Talent ID — ดึงข้อมูลตรงจาก Airtable ทุกครั้ง
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
              <FilterSelect label="จังหวัด" name="province" options={PROVINCES} value={params.province} />
              <FilterSelect label="ภูมิภาค" name="region" options={REGIONS} value={params.region} />
              <FilterSelect label="ตำแหน่ง" name="position" options={POSITIONS} value={params.position} />
              <FilterSelect label="ปีเกิด" name="year" options={YEARS_OF_BIRTH} value={params.year} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
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
              <div className="ml-auto flex flex-wrap items-center gap-1.5 text-xs text-indigo-400">
                เรียงตาม:
                {SORT_KEYS.map((key) => (
                  <Link
                    key={key}
                    href={sortHref(key)}
                    className={`rounded-md px-2 py-1 font-medium ${
                      sortKey === key ? "bg-amber-400/15 text-amber-300" : "hover:text-white"
                    }`}
                  >
                    {SORT_LABELS[key]}
                    {sortKey === key && (sortAsc ? " ▲" : " ▼")}
                  </Link>
                ))}
              </div>
            </div>
          </form>

          {players.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-16 text-center">
              <Users className="h-8 w-8 text-indigo-400" />
              <p className="text-sm text-indigo-300">
                {pageNum === 1
                  ? "ไม่พบนักกีฬาที่ตรงกับเงื่อนไขที่เลือก"
                  : "ไม่มีข้อมูลในหน้านี้แล้ว"}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/20 text-[11px] font-medium uppercase tracking-wide text-indigo-300">
                    <tr>
                      <th className="px-4 py-3">ชื่อ</th>
                      <th className="px-4 py-3">ตำแหน่ง</th>
                      <th className="hidden px-4 py-3 md:table-cell">สโมสร/โรงเรียน</th>
                      <th className="hidden px-4 py-3 text-center sm:table-cell">อายุ</th>
                      <th className="hidden px-4 py-3 text-center md:table-cell">ส่วนสูง</th>
                      <th className="hidden px-4 py-3 text-center md:table-cell">น้ำหนัก</th>
                      <th className="px-4 py-3 text-center">คะแนน</th>
                      <th className="hidden px-4 py-3 text-center sm:table-cell">เกรด</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {players.map((player) => {
                      const rating =
                        player.avgRatingCamp2026 ?? player.avgRatingLeg2 ?? player.avgRatingLeg1;
                      const grade = player.gradeCamp2026 ?? player.gradeLeg2 ?? player.gradeLeg1;
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
                          <td className="hidden whitespace-nowrap px-4 py-3 text-indigo-200 md:table-cell">
                            {player.club || player.school || "-"}
                          </td>
                          <td className="hidden px-4 py-3 text-center text-indigo-200 sm:table-cell">
                            {player.age ?? "-"}
                          </td>
                          <td className="hidden px-4 py-3 text-center text-indigo-200 md:table-cell">
                            {player.height ?? "-"}
                          </td>
                          <td className="hidden px-4 py-3 text-center text-indigo-200 md:table-cell">
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
                          <td className="hidden px-4 py-3 text-center text-indigo-200 sm:table-cell">
                            {grade ?? "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
                {cursors.length > 0 ? (
                  <Link
                    href={pageHref(cursors.slice(0, -1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-indigo-200 hover:bg-white/10"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    ก่อนหน้า
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-xs text-indigo-400">หน้า {pageNum}</span>
                {nextOffset ? (
                  <Link
                    href={pageHref([...cursors, nextOffset])}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-indigo-200 hover:bg-white/10"
                  >
                    ถัดไป
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
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
