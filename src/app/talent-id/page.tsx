import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTalentPlayers } from "@/lib/talent-id";
import { LOGO_URL } from "@/lib/brand";
import { ArrowLeft, Search, Target, Users, MapPin } from "lucide-react";

type SearchParams = {
  q?: string;
  province?: string;
  region?: string;
  position?: string;
  year?: string;
};

function distinctSorted(values: (string | null)[]) {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v)))).sort((a, b) =>
    a.localeCompare(b, "th"),
  );
}

export default async function TalentIdPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;

  let players: Awaited<ReturnType<typeof getTalentPlayers>> = [];
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

  const hasFilters = Boolean(
    params.q || params.province || params.region || params.position || params.year,
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-indigo-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={LOGO_URL}
              alt="FA Thailand"
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-cover"
            />
            <div>
              <p className="text-sm font-bold text-white">
                FA Thailand Technical
              </p>
              <p className="text-[11px] text-indigo-300">หมวด: Talent ID</p>
            </div>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับหน้าแรก
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
            <Target className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Talent ID</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            ศูนย์สืบค้นและคัดกรองนักฟุตบอลผู้มีความสามารถโดดเด่น — ข้อมูลซิงก์จาก Airtable
          </p>
        </div>

        {loadError ? (
          <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 px-6 py-10 text-center text-sm text-red-600">
            ดึงข้อมูลจาก Airtable ไม่สำเร็จ: {loadError}
          </div>
        ) : (
          <>
            {/* ตัวกรอง */}
            <form className="mb-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="q"
                  defaultValue={params.q}
                  placeholder="ค้นหาชื่อ, สโมสร, โรงเรียน..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                >
                  กรองข้อมูล
                </button>
                {hasFilters && (
                  <Link
                    href="/talent-id"
                    className="text-sm font-medium text-slate-500 hover:text-slate-700"
                  >
                    ล้างตัวกรอง
                  </Link>
                )}
                <span className="ml-auto text-xs text-slate-400">
                  พบ {filtered.length.toLocaleString()} จาก {players.length.toLocaleString()} คน
                </span>
              </div>
            </form>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <Users className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">
                  {players.length === 0
                    ? "ยังไม่มีข้อมูลนักกีฬาใน Airtable"
                    : "ไม่พบนักกีฬาที่ตรงกับเงื่อนไขที่เลือก"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.map((player) => (
                  <Link
                    key={player.id}
                    href={`/talent-id/${player.id}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="relative h-32 w-full overflow-hidden bg-indigo-50">
                      {player.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={player.photoUrl}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-indigo-300">
                          {player.fullNameTh.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-3.5">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {player.fullNameTh}
                      </p>
                      {player.nickname && (
                        <p className="truncate text-xs text-slate-400">
                          &quot;{player.nickname}&quot;
                        </p>
                      )}
                      <div className="mt-1 flex flex-wrap gap-1">
                        {player.position1 && (
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600">
                            {player.position1}
                          </span>
                        )}
                      </div>
                      <p className="mt-auto flex items-center gap-1 truncate pt-2 text-xs text-slate-400">
                        <MapPin className="h-3 w-3 flex-none" />
                        {player.club || player.school || "-"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
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
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <select
        name={name}
        defaultValue={value ?? ""}
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
