import { coachName } from "@/lib/coach-name";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { loadCurrentLicenses, matchesLevel, renewalGroup, searchCoachIds, type RenewalGroup } from "@/lib/license-renewal-data";
import { RENEWAL_STATUS, RENEWAL_WINDOW_DAYS, formatThaiDate } from "@/lib/license-renewal";
import { RenewalBoard, type RenewalRow } from "@/components/renewal/RenewalBoard";
import { UndoRenewalButton } from "@/components/renewal/UndoRenewalButton";
import { Inbox, Hourglass, CalendarX2, Archive, History, Search, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

const PAGE_SIZE = 50;
const LEVELS = ["PRO", "A", "B", "C", "G", "GK"];

type Tab = "requests" | RenewalGroup | "history";

const TABS: { key: Tab; label: string; hint: string; icon: typeof Inbox }[] = [
  { key: "requests", label: "คำขอจากโค้ช", hint: "โค้ชยื่นขอต่ออายุ รอตรวจสอบ", icon: Inbox },
  { key: "expiring", label: "ใกล้หมดอายุ", hint: `หมดอายุภายใน ${RENEWAL_WINDOW_DAYS / 30} เดือน`, icon: Hourglass },
  { key: "recent", label: "หมดอายุไม่เกิน 1 ปี", hint: "เพิ่งหมดอายุ ควรติดตามก่อน", icon: CalendarX2 },
  { key: "old", label: "หมดอายุเกิน 1 ปี", hint: "หมดอายุมานาน", icon: Archive },
  { key: "history", label: "ประวัติการต่ออายุ", hint: "ต่ออายุ/ไม่อนุมัติล่าสุด", icon: History },
];

const coachSelect = {
  id: true,
  nameTh: true,
  surnameTh: true,
  nameEn: true,
  familyNameEn: true,
  afcId: true,
  photoUrl: true,
  telNo: true,
  systemUser: { select: { id: true } },
} as const;

export default async function RenewalsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; level?: string; q?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/dashboard");
  const sp = await searchParams;
  const level = LEVELS.includes(sp.level ?? "") ? sp.level : undefined;
  const q = (sp.q ?? "").trim();
  const now = new Date();

  const [current, requests, coachIds] = await Promise.all([
    loadCurrentLicenses(),
    prisma.licenseRenewal.findMany({
      where: { status: "PENDING" },
      orderBy: { requestedAt: "asc" },
      include: { licenseRecord: { include: { coach: { select: coachSelect } } } },
    }),
    q ? searchCoachIds(q) : Promise.resolve(null),
  ]);

  const pendingRecordIds = new Set(requests.map((r) => r.licenseRecordId));
  const counts: Record<Tab, number> = { requests: requests.length, expiring: 0, recent: 0, old: 0, history: 0 };
  const groups = new Map<RenewalGroup, typeof current>([
    ["expiring", []],
    ["recent", []],
    ["old", []],
  ]);
  for (const r of current) {
    const g = renewalGroup(r.expireDate, now);
    if (!g) continue;
    counts[g]++;
    if (matchesLevel(r.licenseType, level) && (!coachIds || coachIds.has(r.coachId))) groups.get(g)!.push(r);
  }

  const requested = sp.tab as Tab | undefined;
  const tab: Tab = TABS.some((t) => t.key === requested) ? requested! : requests.length > 0 ? "requests" : "expiring";
  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { tab, level, q: q || undefined, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `/renewals?${p.toString()}`;
  };

  // ===== เนื้อหาแต่ละแท็บ =====
  let body: React.ReactNode;
  let pager: React.ReactNode = null;

  if (tab === "requests") {
    const shown = requests.filter((r) => matchesLevel(r.licenseRecord.licenseType, level) && (!coachIds || coachIds.has(r.licenseRecord.coachId)));
    const rows: RenewalRow[] = shown.map((r) => {
      const c = r.licenseRecord.coach;
      return {
        key: `req-${r.id}`,
        recordId: r.licenseRecordId,
        requestId: r.id,
        coachId: c.id,
        name: coachName(c),
        nameEn: [c.nameEn, c.familyNameEn].filter(Boolean).join(" ") || null,
        afcId: c.afcId,
        photoUrl: c.photoUrl,
        phone: c.telNo,
        hasAccount: !!c.systemUser,
        licenseType: r.licenseRecord.licenseType,
        certificateNo: r.licenseRecord.certificateNo,
        expireDate: (r.licenseRecord.expireDate ?? now).toISOString(),
        pendingRequest: true,
        note: r.note,
        evidenceUrl: r.evidenceUrl,
        requestedAt: r.requestedAt.toISOString(),
      };
    });
    body = <RenewalBoard key={`req-${level}-${q}`} rows={rows} mode="requests" nowIso={now.toISOString()} />;
  } else if (tab === "history") {
    const history = await prisma.licenseRenewal.findMany({
      where: { status: { in: ["APPROVED", "REJECTED"] } },
      orderBy: { reviewedAt: "desc" },
      take: 100,
      include: { licenseRecord: { include: { coach: { select: coachSelect } } } },
    });
    body =
      history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-500">ยังไม่มีประวัติการต่ออายุ</div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {history.map((h) => {
            const c = h.licenseRecord.coach;
            const st = RENEWAL_STATUS[h.status] ?? RENEWAL_STATUS.PENDING;
            const undoable = h.status === "APPROVED" && h.licenseRecord.expireDate?.getTime() === h.newExpireDate?.getTime();
            return (
              <li key={h.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/coaches/${c.id}`} className="font-semibold text-slate-900 hover:text-indigo-700">
                      {coachName(c)}
                    </Link>
                    <span className="rounded-md bg-indigo-600 px-1.5 py-0.5 text-[11px] font-black text-white">{h.licenseRecord.licenseType}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${st.className}`}>{st.label}</span>
                    {h.requestedByCoach && <span className="text-[11px] text-slate-400">คำขอจากโค้ช</span>}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {h.status === "APPROVED" ? (
                      <>
                        หมดอายุ {formatThaiDate(h.previousExpireDate)} <ArrowRight className="inline h-3 w-3" />{" "}
                        <b className="text-emerald-700">{formatThaiDate(h.newExpireDate)}</b>
                      </>
                    ) : (
                      <>เหตุผล: {h.reviewNote}</>
                    )}
                    {" · "}
                    {formatThaiDate(h.reviewedAt)} โดย {h.reviewedBy}
                  </p>
                  {(h.note || (h.status === "APPROVED" && h.reviewNote)) && (
                    <p className="mt-0.5 text-xs text-slate-400">{[h.note, h.status === "APPROVED" ? h.reviewNote : null].filter(Boolean).join(" · ")}</p>
                  )}
                </div>
                {undoable && <UndoRenewalButton id={h.id} />}
              </li>
            );
          })}
        </ul>
      );
  } else {
    const list = [...groups.get(tab)!].sort((a, b) =>
      tab === "expiring" ? a.expireDate.getTime() - b.expireDate.getTime() : b.expireDate.getTime() - a.expireDate.getTime(),
    );
    const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    const page = Math.min(Math.max(0, Number(sp.page ?? 1) - 1), pageCount - 1);
    const slice = list.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const coaches = await prisma.coach.findMany({ where: { id: { in: slice.map((r) => r.coachId) } }, select: coachSelect });
    const byId = new Map(coaches.map((c) => [c.id, c]));
    const rows: RenewalRow[] = slice.flatMap((r) => {
      const c = byId.get(r.coachId);
      if (!c) return [];
      return [
        {
          key: `rec-${r.id}`,
          recordId: r.id,
          requestId: null,
          coachId: c.id,
          name: coachName(c),
          nameEn: [c.nameEn, c.familyNameEn].filter(Boolean).join(" ") || null,
          afcId: c.afcId,
          photoUrl: c.photoUrl,
          phone: c.telNo,
          hasAccount: !!c.systemUser,
          licenseType: r.licenseType,
          certificateNo: r.certificateNo,
          expireDate: r.expireDate.toISOString(),
          pendingRequest: pendingRecordIds.has(r.id),
          note: null,
          evidenceUrl: null,
          requestedAt: null,
        },
      ];
    });
    body = <RenewalBoard key={`${tab}-${level}-${q}-${page}`} rows={rows} mode="licenses" nowIso={now.toISOString()} />;
    if (pageCount > 1) {
      pager = (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            {(page * PAGE_SIZE + 1).toLocaleString()}–{Math.min(list.length, (page + 1) * PAGE_SIZE).toLocaleString()} จาก {list.length.toLocaleString()} ใบ
          </span>
          <div className="flex gap-2">
            {page > 0 && (
              <Link href={href({ page: String(page) })} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50">
                <ChevronLeft className="h-4 w-4" />
                ก่อนหน้า
              </Link>
            )}
            {page < pageCount - 1 && (
              <Link href={href({ page: String(page + 2) })} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50">
                ถัดไป
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ต่ออายุใบอนุญาต</h1>
        <p className="mt-1 text-sm text-slate-500">
          ดูเฉพาะใบอนุญาตระดับสูงสุดของโค้ชแต่ละคน (ใบที่อัปเกรดไปแล้วไม่ต้องต่อ) · ติ๊กเลือกหลายใบแล้วกดต่ออายุทีเดียว เลขที่ใบอนุญาตเดิมไม่เปลี่ยน
        </p>
      </div>

      {/* แท็บกลุ่ม พร้อมจำนวน */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {TABS.map(({ key, label, hint, icon: Icon }) => {
          const active = tab === key;
          const alert = key === "requests" && counts.requests > 0;
          return (
            <Link
              key={key}
              href={href({ tab: key, page: undefined })}
              className={`rounded-2xl border p-4 transition-all ${
                active ? "border-indigo-300 bg-indigo-50 ring-2 ring-indigo-200" : "border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`h-5 w-5 ${alert ? "text-amber-500" : active ? "text-indigo-600" : "text-slate-400"}`} />
                {key !== "history" && (
                  <span className={`text-xl font-extrabold ${alert ? "text-amber-600" : "text-slate-900"}`}>{counts[key].toLocaleString()}</span>
                )}
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">{label}</p>
              <p className="text-[11px] text-slate-400">{hint}</p>
            </Link>
          );
        })}
      </div>

      {/* ตัวกรอง */}
      {tab !== "history" && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-1.5">
            {[undefined, ...LEVELS].map((lv) => (
              <Link
                key={lv ?? "all"}
                href={href({ level: lv, page: undefined })}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                  level === lv ? "bg-indigo-600 text-white ring-indigo-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {lv ?? "ทุกระดับ"}
              </Link>
            ))}
          </div>
          <form action="/renewals" className="relative sm:ml-auto sm:w-72">
            <input type="hidden" name="tab" value={tab} />
            {level && <input type="hidden" name="level" value={level} />}
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="ค้นชื่อ / AFC ID / เลขบัตร"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </form>
        </div>
      )}

      {body}
      {pager}
    </div>
  );
}
