import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import CalendarGrid from "./CalendarGrid";
import AddEventButton from "./AddEventButton";
import CalendarFilters from "./CalendarFilters";
import { LOGO_URL } from "@/lib/brand";
import { ArrowLeft } from "lucide-react";

const QUARTERS = [
  { q: 1, months: [1, 2, 3], label: "ไตรมาส 1 (ม.ค. - มี.ค.)" },
  { q: 2, months: [4, 5, 6], label: "ไตรมาส 2 (เม.ย. - มิ.ย.)" },
  { q: 3, months: [7, 8, 9], label: "ไตรมาส 3 (ก.ค. - ก.ย.)" },
  { q: 4, months: [10, 11, 12], label: "ไตรมาส 4 (ต.ค. - ธ.ค.)" },
];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; scope?: string; category?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (
    !currentUser ||
    (currentUser.role !== "ADMIN" && currentUser.role !== "STAFF")
  ) {
    redirect("/");
  }

  const { q, scope, category } = await searchParams;
  const now = new Date();
  const year = 2026;
  const selectedQuarter = q ? Number(q) : Math.ceil((now.getUTCMonth() + 1) / 3);
  const quarter = QUARTERS.find((item) => item.q === selectedQuarter) ?? QUARTERS[0];
  const firstMonth = quarter.months[0];
  const lastMonth = quarter.months[quarter.months.length - 1];
  const todayKey = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  const activeScopes = scope ? scope.split(",").filter(Boolean) : [];
  const activeCategories = category ? category.split(",").filter(Boolean) : [];

  const [quarterEvents, categoryRows] = await Promise.all([
    prisma.event.findMany({
      where: {
        startDate: {
          gte: new Date(Date.UTC(year, firstMonth - 1, 1)),
          lt: new Date(Date.UTC(year, lastMonth, 1)),
        },
      },
      orderBy: { startDate: "asc" },
    }),
    prisma.event.findMany({
      distinct: ["category"],
      select: { category: true, color: true },
      orderBy: { category: "asc" },
    }),
  ]);

  const filteredEvents = quarterEvents.filter((e) => {
    if (activeScopes.length > 0 && !activeScopes.includes(e.teamScope)) return false;
    if (activeCategories.length > 0 && !activeCategories.includes(e.category)) return false;
    return true;
  });

  function quarterHref(qValue: number) {
    const p = new URLSearchParams();
    p.set("q", String(qValue));
    if (scope) p.set("scope", scope);
    if (category) p.set("category", category);
    return `/calendar?${p.toString()}`;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-indigo-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-4">
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
              <p className="text-[11px] text-indigo-300">
                ปฏิทินกิจกรรมสมาคม
              </p>
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

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              ปฏิทินกิจกรรม 2026
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              กิจกรรมของสมาคมกีฬาฟุตบอลแห่งประเทศไทย — เห็นได้เฉพาะผู้ดูแลระบบและเจ้าหน้าที่
            </p>
          </div>
          <AddEventButton categoryRows={categoryRows} />
        </div>

        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {QUARTERS.map((item) => {
            const active = item.q === selectedQuarter;
            return (
              <Link
                key={item.q}
                href={quarterHref(item.q)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <CalendarFilters
          quarter={selectedQuarter}
          activeScopes={activeScopes}
          activeCategories={activeCategories}
          categoryRows={categoryRows}
        />

        {quarter.months.map((m) => (
          <CalendarGrid
            key={m}
            events={filteredEvents.filter(
              (e) => e.startDate.getUTCMonth() + 1 === m,
            )}
            categoryRows={categoryRows}
            year={year}
            selectedMonth={m}
            todayKey={todayKey}
          />
        ))}
      </div>
    </div>
  );
}
