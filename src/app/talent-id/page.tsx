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
    <div className="min-h-screen bg-indigo-950 text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-indigo-950/90 backdrop-blur">
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

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <div className="pointer-events-none absolute -left-24 -top-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-40 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30">
            <Target className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">Talent ID</h1>
          <p className="mt-1 max-w-xl text-sm text-indigo-300">
            ศูนย์สืบค้นและคัดกรองนักฟุตบอลผู้มีความสามารถโดดเด่น — ข้อมูลซิงก์จาก Airtable
          </p>
        </div>

        {loadError ? (
          <div className="relative rounded-2xl border border-dashed border-red-400/30 bg-red-400/5 px-6 py-10 text-center text-sm text-red-300">
            ดึงข้อมูลจาก Airtable ไม่สำเร็จ: {loadError}
          </div>
        ) : (
          <>
            {/* ตัวกรอง */}
            <form className="relative mb-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
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
                    href="/talent-id"
                    className="text-sm font-medium text-indigo-300 hover:text-white"
                  >
                    ล้างตัวกรอง
                  </Link>
                )}
                <span className="ml-auto text-xs text-indigo-400">
                  พบ {filtered.length.toLocaleString()} จาก {players.length.toLocaleString()} คน
                </span>
              </div>
            </form>

            {filtered.length === 0 ? (
              <div className="relative flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-16 text-center">
                <Users className="h-8 w-8 text-indigo-400" />
                <p className="text-sm text-indigo-300">
                  {players.length === 0
                    ? "ยังไม่มีข้อมูลนักกีฬาใน Airtable"
                    : "ไม่พบนักกีฬาที่ตรงกับเงื่อนไขที่เลือก"}
                </p>
              </div>
            ) : (
              <div className="relative grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.map((player) => (
                  <Link
                    key={player.id}
                    href={`/talent-id/${player.id}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all hover:-translate-y-1 hover:border-amber-400/30 hover:bg-white/10"
                  >
                    <div className="relative h-32 w-full overflow-hidden bg-indigo-900">
                      {player.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={player.photoUrl}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-indigo-400">
                          {player.fullNameTh.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-3.5">
                      <p className="truncate text-sm font-semibold text-white">
                        {player.fullNameTh}
                      </p>
                      {player.nickname && (
                        <p className="truncate text-xs text-indigo-400">
                          &quot;{player.nickname}&quot;
                        </p>
                      )}
                      <div className="mt-1 flex flex-wrap gap-1">
                        {player.position1 && (
                          <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                            {player.position1}
                          </span>
                        )}
                      </div>
                      <p className="mt-auto flex items-center gap-1 truncate pt-2 text-xs text-indigo-400">
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
