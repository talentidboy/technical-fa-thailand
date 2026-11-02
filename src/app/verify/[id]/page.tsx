import Link from "next/link";
import { coachName, coachInitial } from "@/lib/coach-name";
import { prisma } from "@/lib/prisma";
import { parseId } from "@/lib/route-id";
import { getHighestLicense } from "@/lib/license-rank";
import { getLicenseStatus, type LicenseStatus } from "@/lib/license-status";
import { LICENSE_RANK_ORDER, LICENSE_TYPES, labelFor } from "@/lib/constants";
import { coreProgramSteps } from "@/lib/coach-program";
import { BrandLogo } from "@/components/BrandLogo";
import { CoachCentreLogo } from "@/components/SectionLogos";
import { HomeButton } from "@/components/HomeButton";
import { display, levelTone } from "@/components/coach/CoachUi";
import { BadgeCheck, Clock, Search, ShieldAlert, ShieldCheck, ShieldQuestion, ShieldX } from "lucide-react";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "ตรวจสอบใบอนุญาตผู้ฝึกสอน",
  description: "ตรวจสอบความถูกต้องของใบอนุญาตผู้ฝึกสอนฟุตบอลที่ออกโดยสมาคมกีฬาฟุตบอลแห่งประเทศไทย",
  path: "/verify",
  noindex: true,
});

const TZ = { timeZone: "Asia/Bangkok" } as const;
const day = (d: Date | null) => (d ? d.toLocaleDateString("th-TH", { ...TZ, day: "numeric", month: "long", year: "numeric" }) : "ไม่ระบุ");
const rank = (t: string) => {
  const i = LICENSE_RANK_ORDER.indexOf(t);
  return i === -1 ? 999 : i;
};
// ชื่อเต็มของใบอนุญาต เช่น AFC "C" Diploma
const licenceTitle = (t: string) => coreProgramSteps.find((s) => s.level === t)?.title ?? labelFor(LICENSE_TYPES, t);

// ผลการตรวจ: สีและข้อความตามสถานะของใบระดับสูงสุด
const VERDICT: Record<LicenseStatus, { label: string; en: string; sub: string; icon: typeof ShieldCheck; band: string; text: string }> = {
  active: { label: "ใบอนุญาตมีผล", en: "VALID", sub: "ข้อมูลตรงกับทะเบียนผู้ฝึกสอนของสมาคมฯ", icon: ShieldCheck, band: "bg-emerald-600", text: "text-emerald-700" },
  expiring: { label: "ใบอนุญาตมีผล", en: "VALID", sub: "ข้อมูลตรงกับทะเบียนของสมาคมฯ · ใกล้ถึงวันหมดอายุ", icon: ShieldAlert, band: "bg-emerald-600", text: "text-emerald-700" },
  expired: { label: "ใบอนุญาตหมดอายุ", en: "EXPIRED", sub: "มีรายชื่อในทะเบียนของสมาคมฯ แต่ใบอนุญาตพ้นวันหมดอายุแล้ว", icon: ShieldX, band: "bg-red-600", text: "text-red-700" },
  unknown: { label: "ไม่พบวันหมดอายุในทะเบียน", en: "UNVERIFIED", sub: "มีรายชื่อในทะเบียนของสมาคมฯ — ติดต่อฝ่ายเทคนิคเพื่อยืนยันสถานะ", icon: ShieldQuestion, band: "bg-slate-600", text: "text-slate-700" },
};

const TOKEN = /^[0-9a-f]{16}$/;

// หน้าตรวจสอบใบอนุญาตจาก QR บนบัตรผู้ฝึกสอน (สาธารณะ) — แสดงเฉพาะชื่อ รูป และข้อมูลใบอนุญาต ไม่แสดงข้อมูลส่วนตัวอื่น
// ลิงก์ใหม่ใช้รหัสสุ่ม 16 ตัว (/verify/<รหัส>) · ลิงก์แบบเดิมเป็นเลขลำดับ (/verify/123) ยังเปิดได้ แต่ไม่แสดงรูปและ AFC ID เพราะไล่เปลี่ยนเลขได้
export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const legacy = !TOKEN.test(id);
  const coach = await prisma.coach.findUnique({
    where: legacy ? { id: parseId(id) ?? 0 } : { verifyToken: id },
    select: {
      id: true,
      nameTh: true,
      surnameTh: true,
      nameEn: true,
      familyNameEn: true,
      afcId: true,
      photoUrl: true,
      licenseRecords: { select: { licenseType: true, certificateNo: true, issueDate: true, expireDate: true } },
    },
  });
  const checkedAt = new Date().toLocaleString("th-TH", { ...TZ, dateStyle: "long", timeStyle: "short" });
  const highest = coach ? getHighestLicense(coach.licenseRecords) : null;
  const status: LicenseStatus = highest ? getLicenseStatus(highest.expireDate) : "unknown";
  const v = VERDICT[status];
  const others = coach ? [...coach.licenseRecords].filter((r) => r !== highest).sort((a, b) => rank(a.licenseType) - rank(b.licenseType)) : [];
  const thai = coach ? `${coach.nameTh} ${coach.surnameTh}`.trim() : "";
  const en = coach ? [coach.nameEn, coach.familyNameEn].filter(Boolean).join(" ") : "";
  const tone = levelTone(highest?.licenseType);

  return (
    <div className="min-h-screen bg-[#f3f1ea] text-slate-900">
      {/* แถบหัวทางการ: โลโก้สมาคมฯ + ศูนย์อบรม · ปุ่มหน้าแรกมุมขวาบน */}
      <header className="bg-[#031a2c] text-white">
        <div className="mx-auto flex h-16 max-w-xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo tone="white" className="h-9" />
            <span className="h-7 w-px flex-none bg-white/20" />
            <CoachCentreLogo tone="white" className="h-5" />
          </div>
          <HomeButton tone="dark" />
        </div>
        <div className="h-1 bg-[#e3bb63]" />
      </header>

      <main className="mx-auto max-w-xl px-4 pb-10 pt-6">
        <p className="text-center text-xs font-semibold text-slate-500">ระบบตรวจสอบใบอนุญาตผู้ฝึกสอนฟุตบอล</p>
        <p className="text-center text-[11px] uppercase tracking-[0.2em] text-slate-400">Coach Licence Verification</p>

        {!coach ? (
          <section className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-3 bg-slate-700 px-5 py-4 text-white">
              <ShieldQuestion className="h-7 w-7 flex-none" />
              <div>
                <p className={`${display.className} text-lg font-semibold leading-tight`}>ไม่พบข้อมูลในทะเบียน</p>
                <p className="text-[11px] font-semibold tracking-[0.2em] text-white/70">NOT FOUND</p>
              </div>
            </div>
            <p className="px-5 py-5 text-sm leading-relaxed text-slate-600">
              รหัสจาก QR นี้ไม่ตรงกับผู้ฝึกสอนคนใดในทะเบียนของสมาคมฯ บัตรอาจไม่ถูกต้อง หรือข้อมูลถูกเปลี่ยนแปลง — ค้นหาด้วยชื่อหรือเลขที่ใบอนุญาตแทนได้
            </p>
          </section>
        ) : (
          <section className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            {/* ผลการตรวจ */}
            <div className={`flex items-center gap-3 px-5 py-4 text-white ${v.band}`}>
              <v.icon className="h-8 w-8 flex-none" />
              <div className="min-w-0">
                <p className={`${display.className} text-xl font-semibold leading-tight`}>{v.label}</p>
                <p className="text-[11px] font-semibold tracking-[0.2em] text-white/75">{v.en}</p>
              </div>
            </div>
            <p className={`border-b border-slate-100 px-5 py-2.5 text-xs font-medium ${v.text}`}>{v.sub}</p>

            {/* ผู้ถือใบอนุญาต */}
            <div className="flex items-center gap-4 px-5 py-5">
              {coach.photoUrl && !legacy ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coach.photoUrl} alt={`รูปของ ${coachName(coach)}`} className="h-28 w-[5.5rem] flex-none rounded-lg object-cover ring-1 ring-slate-200" />
              ) : (
                <div className="flex h-28 w-[5.5rem] flex-none items-center justify-center rounded-lg bg-slate-100 text-3xl font-bold text-slate-400 ring-1 ring-slate-200">{coachInitial(coach)}</div>
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-400">ผู้ถือใบอนุญาต</p>
                <h1 className={`${display.className} text-2xl font-semibold leading-tight text-[#031a2c]`}>{coachName(coach)}</h1>
                {thai && en && <p className="mt-0.5 text-sm font-medium uppercase text-slate-500">{en}</p>}
                {!legacy && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    AFC ID <span className="font-semibold text-slate-700">{coach.afcId ?? "—"}</span>
                  </p>
                )}
              </div>
            </div>

            {/* ใบอนุญาตระดับสูงสุด */}
            {highest && (
              <div className="mx-5 mb-5 overflow-hidden rounded-xl ring-1 ring-slate-200">
                <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ background: tone.hex }}>
                  <span className="flex items-center gap-2 text-white">
                    <BadgeCheck className="h-5 w-5 flex-none" />
                    <span className={`${display.className} text-lg font-semibold leading-tight`}>{licenceTitle(highest.licenseType)}</span>
                  </span>
                  <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-bold text-white">ระดับสูงสุด</span>
                </div>
                <dl className="grid grid-cols-2 gap-px bg-slate-200 text-sm">
                  {[
                    { k: "เลขที่ใบอนุญาต", v: highest.certificateNo ?? "ไม่ระบุ" },
                    { k: "สถานะ", v: v.label, cls: v.text },
                    { k: "วันที่ออก", v: day(highest.issueDate) },
                    { k: "วันหมดอายุ", v: day(highest.expireDate), cls: status === "expired" ? "text-red-700" : undefined },
                  ].map((x) => (
                    <div key={x.k} className="bg-white px-4 py-3">
                      <dt className="text-[11px] text-slate-400">{x.k}</dt>
                      <dd className={`mt-0.5 font-semibold ${x.cls ?? "text-slate-900"}`}>{x.v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* ใบอื่นที่ถือ */}
            {others.length > 0 && (
              <div className="border-t border-slate-100 px-5 py-4">
                <p className="text-xs font-semibold text-slate-500">ใบอนุญาตอื่นในทะเบียน</p>
                <ul className="mt-2 divide-y divide-slate-100 text-sm">
                  {others.map((r, i) => {
                    const s = getLicenseStatus(r.expireDate);
                    return (
                      <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2">
                        <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: levelTone(r.licenseType).hex }} />
                        <span className="min-w-0 flex-1 font-medium text-slate-800">{licenceTitle(r.licenseType)}</span>
                        <span className={`text-xs ${s === "expired" ? "text-red-600" : s === "unknown" ? "text-slate-400" : "text-emerald-700"}`}>
                          {s === "expired" ? "หมดอายุ" : s === "unknown" ? "ไม่ระบุวันหมดอายุ" : `มีผลถึง ${day(r.expireDate)}`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {legacy && (
              <p className="border-t border-amber-100 bg-amber-50 px-5 py-3 text-xs leading-relaxed text-amber-800">
                QR นี้เป็นรูปแบบเดิม จึงแสดงข้อมูลแบบย่อ — ผู้ฝึกสอนเปิดบัตรใหม่ได้ที่หน้า “บัตรประจำตัว” ในระบบ (QR แบบใหม่แสดงรูปและข้อมูลครบ)
              </p>
            )}
            <p className="flex items-center gap-1.5 border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5 flex-none" />
              ตรวจสอบจากทะเบียนจริงเมื่อ {checkedAt} น.
            </p>
          </section>
        )}

        <Link href="/verify" className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#031a2c] ring-1 ring-slate-200 hover:bg-slate-50">
          <Search className="h-4 w-4" />
          ค้นหาผู้ฝึกสอนคนอื่น
        </Link>

        <footer className="mt-8 text-center text-xs leading-relaxed text-slate-500">
          <p className="font-semibold text-slate-600">ฝ่ายเทคนิค สมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์</p>
          <p className="mt-1">ข้อมูลในหน้านี้ดึงจากทะเบียนผู้ฝึกสอนของสมาคมฯ ทุกครั้งที่เปิด · หากพบข้อมูลไม่ถูกต้อง ติดต่อ technical@fathailand.org</p>
        </footer>
      </main>
    </div>
  );
}
