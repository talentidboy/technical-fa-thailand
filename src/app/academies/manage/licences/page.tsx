import Link from "next/link";
import { daysUntil, thaiDate, compareAcademies, type AcademyState } from "@/lib/academy";
import { loadAcademies } from "@/lib/academy-data";
import { LevelBadge, StateChip } from "@/components/academy/AcademyUi";
import { Card, Empty, PageBody, PageHeader, TabLinks, btn } from "@/components/academy/ManageUi";

// เรียงแท็บที่มีงานไว้ก่อน
const TABS: { key: AcademyState; label: string; hint: string; empty: string }[] = [
  { key: "expired", label: "หมดอายุ", hint: "พ้นวันหมดอายุแล้ว ยังไม่มีใบใหม่ — กด “ต่ออายุ” ท้ายแถว ถ้าอคาเดมีผ่านการประเมินแล้ว", empty: "ไม่มีใบอนุญาตที่หมดอายุ" },
  { key: "expiring", label: "ใกล้หมดอายุ", hint: "หมดอายุภายใน 60 วัน — ควรแจ้งอคาเดมีให้เตรียมยื่นต่ออายุ", empty: "ไม่มีใบอนุญาตที่จะหมดอายุใน 60 วัน" },
  { key: "active", label: "มีผล", hint: "ใบอนุญาตที่ยังใช้ได้ตามปกติ ไม่ต้องทำอะไร", empty: "ไม่มีรายการ" },
  { key: "revoked", label: "พักใช้", hint: "ถูกพักใช้หรือเพิกถอน จึงไม่แสดงบนหน้าสาธารณะ — กด “จัดการ” เพื่อคืนสถานะหรือออกใบใหม่", empty: "ไม่มีใบอนุญาตที่ถูกพักใช้" },
  { key: "pending", label: "รอระบุระดับ", hint: "มีใบอนุญาตแต่ยังไม่รู้ระดับ (ข้อมูลจากทะเบียนเดิม) — กด “จัดการ” แล้วเลือกแก้ไขรายละเอียดเพื่อใส่ระดับ", empty: "ไม่มีใบอนุญาตที่รอระบุระดับ" },
];

// ใบอนุญาตปัจจุบันของทุกอคาเดมี แยกตามสถานะ — ใช้ติดตามวันหมดอายุและการต่ออายุ
export default async function LicencesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const sp = await searchParams;
  const now = new Date();
  const rows = (await loadAcademies(now)).filter((a) => a.active && a.current);
  const count = (s: AcademyState) => rows.filter((a) => a.state === s).length;
  // เปิดหน้ามาเจอแท็บที่มีงานก่อน
  const tab = TABS.find((t) => t.key === sp.tab) ?? TABS.find((t) => (t.key === "expired" || t.key === "expiring") && count(t.key) > 0) ?? TABS[2];
  const byExpiry = tab.key === "expiring" || tab.key === "expired";
  const list = rows
    .filter((a) => a.state === tab.key)
    .sort((a, b) => (byExpiry ? (a.current!.expiresAt?.getTime() ?? 0) - (b.current!.expiresAt?.getTime() ?? 0) : compareAcademies(a, b)));
  const canRenew = tab.key === "expired" || tab.key === "expiring" || tab.key === "active";

  return (
    <>
      <PageHeader title="ใบอนุญาต" description="ใบอนุญาตปัจจุบันของแต่ละอคาเดมี · ดูวันหมดอายุ แล้วกดปุ่มท้ายแถวเพื่อต่ออายุหรือจัดการ">
        <TabLinks
          active={tab.key}
          tabs={TABS.map((t) => ({ key: t.key, href: `/academies/manage/licences?tab=${t.key}`, label: t.label, count: count(t.key), alert: (t.key === "expiring" || t.key === "expired") && count(t.key) > 0 }))}
        />
      </PageHeader>
      <PageBody>
        <p className="text-sm text-slate-600">{tab.hint}</p>
        <Card flush tone="amber">
          {list.length === 0 ? (
            <Empty>{tab.empty}</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-3xl text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">อคาเดมี</th>
                    <th className="px-3 py-2.5 font-medium">ระดับ</th>
                    <th className="px-3 py-2.5 font-medium">เลขที่ใบอนุญาต</th>
                    <th className="px-3 py-2.5 font-medium">วันที่อนุมัติ</th>
                    <th className="px-3 py-2.5 font-medium">วันหมดอายุ</th>
                    <th className="px-3 py-2.5 font-medium">สถานะ</th>
                    <th className="px-5 py-2.5 font-medium">
                      <span className="sr-only">จัดการ</span>
                    </th>
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
                        <td className="px-5 py-2.5 text-right">
                          <Link href={`/academies/manage/${a.id}?tab=licences${canRenew ? "&do=renew" : ""}`} className={`${canRenew && byExpiry ? btn.primary : btn.secondary} whitespace-nowrap px-3 py-1.5 text-xs`}>
                            {canRenew ? "ต่ออายุ" : "จัดการ"}
                          </Link>
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
