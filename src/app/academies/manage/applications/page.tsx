import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { APPLICATION_KINDS, APPLICATION_STATUS } from "@/lib/academy-portal";
import { LEVEL_META, thaiDate } from "@/lib/academy";
import { LevelBadge } from "@/components/academy/AcademyUi";
import { Card, Empty, PageBody, PageHeader, TabLinks } from "@/components/academy/ManageUi";
import { ChevronRight } from "lucide-react";

const TABS = ["SUBMITTED", "NEEDS_FIX", "DRAFT", "APPROVED", "REJECTED"] as const;

// คิวใบสมัคร — ใบที่รอตรวจเรียงจากส่งก่อน
export default async function ManageApplicationsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
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
    <>
      <PageHeader title="ใบสมัคร" description="เปิดใบสมัครเพื่อตรวจหลักฐานทีละข้อ แล้วอนุมัติ ส่งกลับให้แก้ไข หรือไม่อนุมัติ">
        <TabLinks
          active={status}
          tabs={TABS.map((s) => ({ key: s, href: `/academies/manage/applications?status=${s}`, label: APPLICATION_STATUS[s].label, count: n(s), alert: s === "SUBMITTED" && n(s) > 0 }))}
        />
      </PageHeader>
      <PageBody>
        <Card flush>
          {apps.length === 0 ? (
            <Empty>ไม่มีใบสมัครในสถานะนี้</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {apps.map((a) => {
                const reviewed = a.evidence.filter((e) => e.status !== "PENDING").length;
                return (
                  <li key={a.id}>
                    <Link href={`/academies/manage/applications/${a.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50">
                      <LevelBadge level={a.level} />
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
        </Card>
      </PageBody>
    </>
  );
}
