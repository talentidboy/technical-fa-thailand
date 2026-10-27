import Link from "next/link";
import { daysUntil, thaiDate, compareAcademies, type AcademyState } from "@/lib/academy";
import { loadAcademies } from "@/lib/academy-data";
import { LevelBadge, StateChip } from "@/components/academy/AcademyUi";
import { Card, Empty, PageBody, PageHeader, TabLinks } from "@/components/academy/ManageUi";

const TABS: { key: AcademyState; label: string; hint: string }[] = [
  { key: "active", label: "มีผล", hint: "ใบอนุญาตที่ยังมีผล (เกิน 60 วันก่อนหมดอายุ หรือไม่ระบุวันหมดอายุ)" },
  { key: "expiring", label: "ใกล้หมดอายุ", hint: "หมดอายุภายใน 60 วัน — ควรแจ้งอคาเดมีให้ยื่นต่ออายุ" },
  { key: "expired", label: "หมดอายุ", hint: "พ้นวันหมดอายุแล้ว ยังไม่มีใบใหม่" },
  { key: "revoked", label: "พักใช้", hint: "ถูกพักใช้ / เพิกถอน — ไม่แสดงบนหน้าสาธารณะ" },
  { key: "pending", label: "รอระบุระดับ", hint: "มีใบอนุญาตแต่ยังไม่ระบุระดับ (ข้อมูลจากทะเบียนเดิม)" },
];

// ใบอนุญาตปัจจุบันของทุกอคาเดมี แยกตามสถานะ — ใช้ติดตามวันหมดอายุและการต่ออายุ
export default async function LicencesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const sp = await searchParams;
  const tab = TABS.find((t) => t.key === sp.tab) ?? TABS[0];
  const now = new Date();
  const rows = (await loadAcademies(now)).filter((a) => a.active && a.current);
  const count = (s: AcademyState) => rows.filter((a) => a.state === s).length;
  const byExpiry = tab.key === "expiring" || tab.key === "expired";
  const list = rows
    .filter((a) => a.state === tab.key)
    .sort((a, b) => (byExpiry ? (a.current!.expiresAt?.getTime() ?? 0) - (b.current!.expiresAt?.getTime() ?? 0) : compareAcademies(a, b)));

  return (
    <>
      <PageHeader title="ใบอนุญาต" description="ใบอนุญาตปัจจุบันของอคาเดมีที่เปิดใช้งาน — กดชื่อเพื่อต่ออายุ เปลี่ยนระดับ หรือพักใช้">
        <TabLinks
          active={tab.key}
          tabs={TABS.map((t) => ({ key: t.key, href: `/academies/manage/licences?tab=${t.key}`, label: t.label, count: count(t.key), alert: (t.key === "expiring" || t.key === "expired") && count(t.key) > 0 }))}
        />
      </PageHeader>
      <PageBody>
        <p className="text-sm text-slate-500">{tab.hint}</p>
        <Card flush tone="amber">
          {list.length === 0 ? (
            <Empty>ไม่มีรายการ</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-3xl text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">อคาเดมี</th>
                    <th className="px-3 py-2.5 font-medium">ระดับ</th>
                    <th className="px-3 py-2.5 font-medium">เลขที่</th>
                    <th className="px-3 py-2.5 font-medium">อนุมัติ</th>
                    <th className="px-3 py-2.5 font-medium">หมดอายุ</th>
                    <th className="px-3 py-2.5 font-medium">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.map((a) => {
                    const l = a.current!;
                    const d = l.expiresAt ? daysUntil(l.expiresAt, now) : null;
                    return (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="px-5 py-2.5">
                          <Link href={`/academies/manage/${a.id}?tab=licences`} className="font-semibold text-slate-900 hover:underline">
                            {a.nameEn}
                          </Link>
                          {a.province && <p className="text-xs text-slate-500">{a.province}</p>}
                        </td>
                        <td className="px-3 py-2.5">
                          <LevelBadge level={l.level} tier={l.tier} />
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">{l.licenceNo ?? "-"}</td>
                        <td className="px-3 py-2.5 text-slate-600">{thaiDate(l.approvedAt)}</td>
                        <td className="px-3 py-2.5 text-slate-600">
                          {thaiDate(l.expiresAt)}
                          {d !== null && byExpiry && <span className={`block text-xs ${d < 0 ? "text-red-600" : "text-amber-700"}`}>{d < 0 ? `เกินมา ${-d} วัน` : `อีก ${d} วัน`}</span>}
                        </td>
                        <td className="px-3 py-2.5">
                          <StateChip state={a.state} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </PageBody>
    </>
  );
}
