import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { APPLICATION_KINDS, APPLICATION_STATUS } from "@/lib/academy-portal";
import { LEVEL_META, thaiDate } from "@/lib/academy";
import { LevelBadge } from "@/components/academy/AcademyUi";
import { Card, Empty, PageBody, PageHeader, TabLinks, btn } from "@/components/academy/ManageUi";
import { ChevronRight } from "lucide-react";

const TABS = ["SUBMITTED", "NEEDS_FIX", "DRAFT", "APPROVED", "REJECTED"] as const;

// แต่ละแท็บหมายความว่าอะไร และต้องทำอะไรต่อ · ข้อความเมื่อไม่มีรายการ
const TAB_INFO: Record<(typeof TABS)[number], { hint: string; empty: string }> = {
  SUBMITTED: { hint: "อคาเดมีส่งเอกสารมาแล้ว รอเจ้าหน้าที่ตรวจ — งานของคุณอยู่ที่แท็บนี้ กดรายการเพื่อเปิดตรวจ", empty: "ตอนนี้ไม่มีใบสมัครรอตรวจ ไม่ต้องทำอะไร เมื่ออคาเดมีส่งใบสมัครเข้ามา จะแสดงที่นี่และมีตัวเลขสีเหลืองขึ้นที่เมนูด้านซ้าย" },
  NEEDS_FIX: { hint: "ส่งกลับให้อคาเดมีแก้แล้ว รออคาเดมีแก้และส่งกลับมา — ยังไม่ต้องทำอะไร", empty: "ไม่มีใบสมัครที่รออคาเดมีแก้ไข" },
  DRAFT: { hint: "อคาเดมีกำลังกรอกและยังไม่ได้ส่ง — ยังตรวจไม่ได้ เปิดดูความคืบหน้าได้อย่างเดียว", empty: "ไม่มีใบสมัครที่กำลังกรอก" },
  APPROVED: { hint: "อนุมัติแล้ว ระบบออกใบอนุญาตให้แล้ว — เก็บไว้ดูย้อนหลัง", empty: "ยังไม่มีใบสมัครที่อนุมัติ" },
  REJECTED: { hint: "ไม่อนุมัติ — เก็บไว้ดูย้อนหลัง เปิดรายการเพื่อดูเหตุผลหรือเปิดให้แก้ใหม่", empty: "ไม่มีใบสมัครที่ไม่อนุมัติ" },
};

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
  const info = TAB_INFO[status as (typeof TABS)[number]];

  return (
    <>
      <PageHeader title="ใบสมัคร" description="เอกสารที่อคาเดมีส่งมาขอใบอนุญาต · ตรวจทีละข้อ แล้วอนุมัติ ส่งกลับให้แก้ไข หรือไม่อนุมัติ">
        <TabLinks
          active={status}
          tabs={TABS.map((s) => ({ key: s, href: `/academies/manage/applications?status=${s}`, label: APPLICATION_STATUS[s].label, count: n(s), alert: s === "SUBMITTED" && n(s) > 0 }))}
        />
      </PageHeader>
      <PageBody>
        <p className="text-sm text-slate-600">{info.hint}</p>
        <Card flush>
          {apps.length === 0 ? (
            <Empty>{info.empty}</Empty>
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
                      {status === "SUBMITTED" ? (
                        <span className={`${btn.primary} py-2`}>เปิดตรวจ</span>
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      )}
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
