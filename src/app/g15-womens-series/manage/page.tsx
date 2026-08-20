import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  createTeam,
  deleteTeam,
  createMatch,
  deleteMatch,
  recordMatchResult,
} from "./actions";
import { Field, SelectField } from "@/components/FormField";
import { LOGO_URL } from "@/lib/brand";
import {
  Trophy,
  Users,
  CalendarPlus,
  Trash2,
  ArrowLeft,
  Shield,
} from "lucide-react";

function formatDateTime(date: Date | null) {
  if (!date) return "ยังไม่กำหนด";
  return date.toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function G15ManagePage() {
  const currentUser = await getCurrentUser();
  if (
    !currentUser ||
    (currentUser.role !== "ADMIN" && currentUser.role !== "STAFF")
  ) {
    redirect("/g15-womens-series");
  }

  const [teams, matches] = await Promise.all([
    prisma.g15Team.findMany({ orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
    prisma.g15Match.findMany({
      orderBy: [{ matchDate: "asc" }, { createdAt: "asc" }],
      include: { homeTeam: true, awayTeam: true },
    }),
  ]);

  const teamOptions = teams.map((t) => ({
    value: String(t.id),
    label: t.groupName ? `${t.name} (${t.groupName})` : t.name,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-indigo-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <Link href="/g15-womens-series" className="flex items-center gap-2">
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
                จัดการข้อมูล G15 Women&apos;s Football Series
              </p>
            </div>
          </Link>
          <Link
            href="/g15-womens-series"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับหน้า G15
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            จัดการข้อมูล G15 Women&apos;s Football Series
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            เพิ่มทีม จัดตารางการแข่งขัน และบันทึกผล — ระบบจะคำนวณตารางคะแนนให้อัตโนมัติ
          </p>
        </div>

        {/* เพิ่มทีม */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <Shield className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-slate-900">เพิ่มทีมใหม่</h2>
          </div>
          <form
            action={createTeam}
            className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            <Field label="ชื่อทีม" name="name" required placeholder="สโมสร A" />
            <Field label="กลุ่ม" name="groupName" placeholder="กลุ่ม A" />
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">โลโก้ทีม</span>
              <input
                name="logo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-rose-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-rose-600"
              />
            </label>
            <div className="sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-rose-200 transition-colors hover:bg-rose-700"
              >
                <Shield className="h-4 w-4" />
                เพิ่มทีม
              </button>
            </div>
          </form>
        </div>

        {/* รายชื่อทีม */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-slate-900">
              ทีมทั้งหมด ({teams.length})
            </h2>
          </div>
          {teams.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">
              ยังไม่มีทีม
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {teams.map((team) => (
                <li
                  key={team.id}
                  className="flex items-center justify-between gap-3 px-6 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    {team.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={team.logoUrl}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-xs font-semibold text-rose-700">
                        {team.name.charAt(0)}
                      </div>
                    )}
                    <span className="font-medium text-slate-900">{team.name}</span>
                    {team.groupName && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                        {team.groupName}
                      </span>
                    )}
                  </div>
                  <form action={deleteTeam}>
                    <input type="hidden" name="id" value={team.id} />
                    <button
                      type="submit"
                      aria-label="ลบทีม"
                      className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* เพิ่มนัดการแข่งขัน */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <CalendarPlus className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-slate-900">เพิ่มนัดการแข่งขัน</h2>
          </div>
          {teams.length < 2 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">
              ต้องมีทีมอย่างน้อย 2 ทีมก่อนจึงจะเพิ่มนัดการแข่งขันได้
            </p>
          ) : (
            <form
              action={createMatch}
              className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              <Field
                label="รอบการแข่งขัน"
                name="round"
                required
                placeholder="กลุ่ม A - นัดที่ 1 / รอบรองชนะเลิศ"
              />
              <Field label="วันเวลาแข่งขัน" name="matchDate" type="datetime-local" />
              <Field label="สนาม" name="venue" placeholder="สนามกีฬาแห่งชาติ" />
              <SelectField label="ทีมเหย้า" name="homeTeamId" options={teamOptions} required />
              <SelectField label="ทีมเยือน" name="awayTeamId" options={teamOptions} required />
              <div className="flex items-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-amber-200 transition-colors hover:bg-amber-600"
                >
                  <CalendarPlus className="h-4 w-4" />
                  เพิ่มนัดการแข่งขัน
                </button>
              </div>
            </form>
          )}
        </div>

        {/* รายการนัดการแข่งขัน + บันทึกผล */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Trophy className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-slate-900">
              นัดการแข่งขันทั้งหมด ({matches.length})
            </h2>
          </div>
          {matches.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">
              ยังไม่มีนัดการแข่งขัน
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {matches.map((match) => (
                <li key={match.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
                  <div className="min-w-48 flex-1">
                    <p className="text-xs font-medium text-indigo-600">{match.round}</p>
                    <p className="font-medium text-slate-900">
                      {match.homeTeam.name} vs {match.awayTeam.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDateTime(match.matchDate)}
                      {match.venue && ` · ${match.venue}`}
                    </p>
                  </div>

                  <form
                    action={recordMatchResult}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="id" value={match.id} />
                    <input
                      type="number"
                      name="homeScore"
                      min={0}
                      defaultValue={match.homeScore ?? ""}
                      placeholder="0"
                      className="w-14 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <span className="text-slate-400">:</span>
                    <input
                      type="number"
                      name="awayScore"
                      min={0}
                      defaultValue={match.awayScore ?? ""}
                      placeholder="0"
                      className="w-14 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                    >
                      บันทึกผล
                    </button>
                  </form>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      match.status === "FINISHED"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {match.status === "FINISHED" ? "แข่งจบแล้ว" : "ยังไม่แข่ง"}
                  </span>

                  <form action={deleteMatch}>
                    <input type="hidden" name="id" value={match.id} />
                    <button
                      type="submit"
                      aria-label="ลบนัดการแข่งขัน"
                      className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
