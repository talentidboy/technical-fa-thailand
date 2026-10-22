import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { APPLICATION_KINDS, APPLICATION_STATUS } from "@/lib/academy-portal";
import { LEVEL_META, thaiDate } from "@/lib/academy";
import { ManageShell } from "@/components/academy/ManageShell";
import { LevelMedal } from "@/components/academy/AcademyUi";
import { ChevronRight } from "lucide-react";

const TABS = ["SUBMITTED", "NEEDS_FIX", "DRAFT", "APPROVED", "REJECTED"] as const;

export default async function ManageApplicationsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) redirect("/academies");
  const sp = await searchParams;
  const status = TABS.includes(sp.status as (typeof TABS)[number]) ? sp.status! : "SUBMITTED";
  const [counts, apps] = await Promise.all([
    prisma.academyApplication.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.academyApplication.findMany({
      where: { status },
      include: { academy: { select: { nameEn: true, nameTh: true, province: true } }, evidence: { select: { status: true } } },
      orderBy: status === "SUBMITTED" ? { submittedAt: "asc" } : { updatedAt: "desc" },
    }),
  ]);
  const n = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;

  return (
    <ManageShell active="applications">
      <main className="mx-auto max-w-7xl space-y-5 px-6 py-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ใบสมัคร</h1>
          <p className="mt-1 text-sm text-slate-500">ใบที่รอตรวจเรียงจากส่งก่อน — เปิดเพื่อตรวจหลักฐานทีละข้อ แล้วอนุมัติหรือส่งกลับให้แก้ไข</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {TABS.map((s) => (
            <Link
              key={s}
              href={`/academies/manage/applications?status=${s}`}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ${status === s ? "bg-indigo-700 text-white ring-indigo-700" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"}`}
            >
              {APPLICATION_STATUS[s].label} ({n(s)})
            </Link>
          ))}
        </div>
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          {apps.length === 0 ? (
            <p className="px-6 py-14 text-center text-sm text-slate-400">ไม่มีใบสมัครในสถานะนี้</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {apps.map((a) => {
                const reviewed = a.evidence.filter((e) => e.status !== "PENDING").length;
                return (
                  <li key={a.id}>
                    <Link href={`/academies/manage/applications/${a.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-indigo-50/40">
                      <LevelMedal level={a.level} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-slate-900">{a.academy.nameEn}</span>
                        <span className="block text-xs text-slate-500">
                          FAT {LEVEL_META[a.level as keyof typeof LEVEL_META]?.label} · {APPLICATION_KINDS[a.kind]}
                          {a.academy.province && ` · ${a.academy.province}`}
                        </span>
                      </span>
                      <span className="hidden text-right text-xs text-slate-500 sm:block">
                        {a.submittedAt ? `ส่ง ${thaiDate(a.submittedAt)}` : `เริ่ม ${thaiDate(a.createdAt)}`}
                        <span className="block">
                          ตรวจแล้ว {reviewed}/{a.evidence.length}
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </ManageShell>
  );
}
