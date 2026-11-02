import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { coachName } from "@/lib/coach-name";
import { certNoVariants } from "@/lib/cert-no";
import { getLicenseStatus } from "@/lib/license-status";
import { LICENSE_RANK_ORDER, LICENSE_TYPES, labelFor } from "@/lib/constants";
import { CoachHeader } from "@/components/coach/CoachHeader";
import { display } from "@/components/coach/CoachUi";
import { pageMeta } from "@/lib/seo";
import { ArrowRight, Search, ShieldCheck, ShieldQuestion, ShieldX } from "lucide-react";

export const metadata = pageMeta({
  title: "ตรวจสอบใบอนุญาตผู้ฝึกสอน",
  description: "ค้นหาผู้ฝึกสอนฟุตบอลด้วยชื่อ เลขที่ใบอนุญาต หรือ AFC ID เพื่อตรวจสอบว่าถือใบอนุญาตระดับใด และยังมีผลอยู่หรือไม่",
  path: "/verify",
});

const LIMIT = 10;
const TZ = { timeZone: "Asia/Bangkok" } as const;
const day = (d: Date) => d.toLocaleDateString("th-TH", { ...TZ, day: "numeric", month: "short", year: "numeric" });
const rank = (t: string) => {
  const i = LICENSE_RANK_ORDER.indexOf(t);
  return i === -1 ? 999 : i;
};

// แปลงคำค้นเป็นเงื่อนไข — เลขที่ใบ / AFC ID ต้องตรงทั้งเลข · ชื่อต้องพิมพ์อย่างน้อย 3 ตัวอักษร (กันการไล่ดึงรายชื่อทั้งหมด)
function buildWhere(q: string): Prisma.CoachWhereInput | null {
  const hasDigit = /\d/.test(q);
  if (hasDigit) {
    return {
      OR: [
        { licenseRecords: { some: { certificateNo: { in: certNoVariants(q), mode: "insensitive" } } } },
        { afcId: { equals: q.replace(/\s+/g, ""), mode: "insensitive" } },
        ...(/^\d{5,7}$/.test(q) ? [{ afcId: { contains: `/${q}/`, mode: "insensitive" as const } }] : []),
      ],
    };
  }
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.join("").length < 3) return null;
  return {
    AND: tokens.map((t) => ({
      OR: [
        { nameTh: { contains: t } },
        { surnameTh: { contains: t } },
        { nameEn: { contains: t, mode: "insensitive" as const } },
        { familyNameEn: { contains: t, mode: "insensitive" as const } },
      ],
    })),
  };
}

// ตรวจสอบใบอนุญาตผู้ฝึกสอนแบบค้นหา (สาธารณะ) — สำหรับสโมสร อคาเดมี และผู้ปกครอง
// แสดงเฉพาะชื่อ AFC ID ระดับใบอนุญาต เลขที่ และวันหมดอายุ — ไม่แสดงข้อมูลส่วนตัว (เลขบัตร วันเกิด ที่อยู่ เบอร์โทร)
export default async function VerifySearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 80);
  const where = q ? buildWhere(q) : null;
  const found = where
    ? await prisma.coach.findMany({
        where: { AND: [where, { licenseRecords: { some: {} } }] },
        select: { id: true, verifyToken: true, nameTh: true, surnameTh: true, nameEn: true, familyNameEn: true, afcId: true, licenseRecords: { select: { licenseType: true, certificateNo: true, expireDate: true } } },
        orderBy: [{ nameTh: "asc" }, { nameEn: "asc" }],
        take: LIMIT + 1,
      })
    : [];
  const more = found.length > LIMIT;
  const coaches = found.slice(0, LIMIT);

  return (
    <div className="min-h-screen bg-[#f6f4ef]">
      <CoachHeader links={[{ href: "/coach-center", label: "ศูนย์อบรมผู้ฝึกสอน" }, { href: "/courses", label: "หลักสูตร" }]} />

      <section className="bg-[#031a2c] text-white">
        <div className="mx-auto max-w-3xl px-4 pb-10 pt-10 sm:px-6 sm:pt-14">
          <h1 className={`${display.className} text-3xl font-semibold sm:text-5xl`}>ตรวจสอบใบอนุญาตผู้ฝึกสอน</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/70 sm:text-base">ค้นหาด้วยชื่อ-นามสกุล เลขที่ใบอนุญาต หรือ AFC ID เพื่อดูว่าผู้ฝึกสอนถือใบอนุญาตระดับใด และยังมีผลอยู่หรือไม่</p>
          <form action="/verify" className="mt-6 flex gap-2">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">ชื่อ เลขที่ใบอนุญาต หรือ AFC ID</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={q}
                autoFocus={!q}
                placeholder="เช่น สมชาย ใจดี · C-24/0012 · AFC/120643/THA"
                className="h-12 w-full rounded-xl border-0 bg-white pl-11 pr-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#e3bb63]/50"
              />
            </label>
            <button type="submit" className="h-12 flex-none rounded-xl bg-[#e3bb63] px-5 text-sm font-semibold text-[#031a2c] hover:bg-[#ecc97b] sm:px-7">
              ตรวจสอบ
            </button>
          </form>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {!q ? (
          <p className="text-sm text-slate-500">พิมพ์ชื่ออย่างน้อย 3 ตัวอักษร หรือเลขที่ใบอนุญาตเต็ม · ถ้ามีบัตรผู้ฝึกสอน สแกน QR บนบัตรเพื่อตรวจได้ทันที</p>
        ) : !where ? (
          <p className="text-sm text-amber-700">กรุณาพิมพ์ชื่ออย่างน้อย 3 ตัวอักษร</p>
        ) : coaches.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
            <ShieldQuestion className="mx-auto h-9 w-9 text-slate-400" />
            <p className="mt-3 font-semibold text-slate-900">ไม่พบผู้ฝึกสอนที่ตรงกับ “{q}”</p>
            <p className="mt-1 text-sm text-slate-500">ลองตรวจตัวสะกดชื่อ หรือพิมพ์เลขที่ใบอนุญาตให้ครบทุกตัว เช่น C-24/0012</p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-500">
              {more ? `พบมากกว่า ${LIMIT} คน แสดง ${LIMIT} คนแรก — พิมพ์นามสกุลด้วยเพื่อให้ตรงขึ้น` : `พบ ${coaches.length} คน`}
            </p>
            <ul className="space-y-3">
              {coaches.map((c) => {
                const recs = [...c.licenseRecords].sort((a, b) => rank(a.licenseType) - rank(b.licenseType));
                const valid = recs.some((r) => {
                  const s = getLicenseStatus(r.expireDate);
                  return s === "active" || s === "expiring";
                });
                const thai = `${c.nameTh} ${c.surnameTh}`.trim();
                const en = [c.nameEn, c.familyNameEn].filter(Boolean).join(" ");
                return (
                  <li key={c.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                    <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{coachName(c)}</p>
                        {thai && en && <p className="text-xs text-slate-500">{en}</p>}
                        <p className="text-xs text-slate-500">{c.afcId ?? "ไม่มี AFC ID"}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${valid ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        {valid ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldX className="h-3.5 w-3.5" />}
                        {valid ? "มีใบอนุญาตที่ยังมีผล" : "ไม่มีใบที่ยังมีผล"}
                      </span>
                    </div>
                    <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100 text-sm">
                      {recs.map((r, i) => {
                        const s = getLicenseStatus(r.expireDate);
                        return (
                          <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-5 py-2.5">
                            <span className="w-24 flex-none font-semibold text-slate-900">{labelFor(LICENSE_TYPES, r.licenseType)}</span>
                            <span className="min-w-0 flex-1 text-slate-500">{r.certificateNo ?? "ไม่ระบุเลขที่"}</span>
                            <span className={`text-xs font-semibold ${s === "expired" ? "text-red-600" : s === "unknown" ? "text-slate-400" : "text-emerald-700"}`}>
                              {s === "expired" ? `หมดอายุ ${day(r.expireDate!)}` : s === "unknown" ? "ไม่ระบุวันหมดอายุ" : `มีผลถึง ${day(r.expireDate!)}`}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <Link href={`/verify/${c.verifyToken}`} className="flex items-center justify-end gap-1 border-t border-slate-100 bg-slate-50 px-5 py-2 text-xs font-semibold text-[#073c5e] hover:bg-slate-100">
                      หน้าตรวจสอบของผู้ฝึกสอนคนนี้
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        <p className="mt-8 text-xs leading-relaxed text-slate-400">
          ข้อมูลจากทะเบียนผู้ฝึกสอนของสมาคมกีฬาฟุตบอลแห่งประเทศไทยฯ · แสดงเฉพาะชื่อและข้อมูลใบอนุญาต · หากข้อมูลไม่ถูกต้อง ติดต่อฝ่ายเทคนิค technical@fathailand.org
        </p>
      </main>
    </div>
  );
}
