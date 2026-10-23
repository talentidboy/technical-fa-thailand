import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getAcademyUser, getCurrentUser } from "@/lib/auth";
import { parseId } from "@/lib/route-id";
import { LEVEL_META, LICENCE_STATUS, currentLicence, isLevel, licenceState, showPublicly, thaiDate, tierLabel, levelRank } from "@/lib/academy";
import { LEVEL_SUMMARY } from "@/lib/academy-criteria";
import { StateChip } from "@/components/academy/AcademyUi";
import { PublicFooter, PublicHeader } from "@/components/academy/PublicChrome";
import { Medal } from "@/components/academy/Medal";
import { BrandLogo } from "@/components/BrandLogo";
import { AcademyLogo } from "@/components/SectionLogos";
import { academySerif } from "@/components/typefaces/academy";
import theme from "@/components/academy/public.module.css";
import { ArrowLeft, ArrowRight, Building2, Globe, MapPin } from "lucide-react";

async function load(rawId: string) {
  const id = parseId(rawId);
  if (!id) return null;
  return prisma.academy.findUnique({ where: { id }, include: { licences: true } });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const academy = await load((await params).id);
  return { title: academy ? `${academy.nameEn} — Academy Licensing | FA Thailand` : "ไม่พบอคาเดมี" };
}

// หน้าโปรไฟล์อคาเดมี (สาธารณะ) ในรูปแบบใบรับรอง — ใช้ตรวจสอบว่าได้รับการรับรองระดับใด มีผลถึงเมื่อไร · ไม่แสดงข้อมูลติดต่อส่วนบุคคล
export default async function AcademyProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [academy, user, academyUser] = await Promise.all([load((await params).id), getCurrentUser(), getAcademyUser()]);
  const now = new Date();
  const current = academy ? currentLicence(academy.licences) : null;
  const state = licenceState(current, now);
  if (!academy || !showPublicly(academy.active, state)) notFound();
  const canManage = user?.role === "ADMIN" || user?.role === "STAFF";
  const viewer = canManage ? "admin" : academyUser ? "academy" : user ? "staff-other" : "guest";
  const level = current && isLevel(current.level) ? current.level : null;
  const history = [...academy.licences]
    .filter((l) => l.status !== "REVOKED")
    .sort((a, b) => (b.approvedAt?.getTime() ?? 0) - (a.approvedAt?.getTime() ?? 0) || levelRank(b.level) - levelRank(a.level) || b.id - a.id);
  const s = academySerif.className;
  const metal = level ? LEVEL_META[level].hex : "#cbd5e1";

  return (
    <div className={`${theme.theme} min-h-screen overflow-x-clip`}>
      <PublicHeader viewer={viewer} manageHref={`/academies/manage/${academy.id}`} />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link href="/academies#directory" className="inline-flex items-center gap-1 text-sm text-(--ink-soft) hover:text-(--ink)">
          <ArrowLeft className="h-4 w-4" />
          ทำเนียบอคาเดมี
        </Link>

        {/* ===== ใบรับรอง ===== */}
        <section className="mt-5 bg-white p-2 shadow-[0_30px_60px_-35px_rgb(11_31_68/0.45)] sm:p-3">
          <div className="border-2 p-1" style={{ borderColor: metal }}>
            <div className="relative border px-6 py-10 text-center sm:px-12 sm:py-12" style={{ borderColor: metal }}>
              <div className="flex items-center justify-center gap-3">
                <BrandLogo tone="navy" className="h-10" />
                <span className="h-8 w-px bg-(--line)" />
                <AcademyLogo className="h-10" />
              </div>
              <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.3em] text-(--ink-soft)">Certificate of Academy Licensing</p>
              <p className="mt-2 text-sm text-(--ink-soft)">สมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์ รับรองว่า</p>

              <h1 className={`${s} mt-6 text-3xl font-bold leading-tight text-(--ink) sm:text-5xl`}>{academy.nameEn}</h1>
              {academy.nameTh && <p className={`${s} mt-2 text-lg text-(--ink-soft)`}>{academy.nameTh}</p>}

              <div className="mt-8 flex flex-col items-center">
                <Medal level={level} size="lg" />
                <p className={`${s} mt-12 text-2xl font-bold`} style={{ color: level ? metal : "#64748b" }}>
                  {level ? `FAT ${LEVEL_META[level].label} Level Academy` : "รอประกาศระดับ"}
                </p>
                {level && <p className="mt-1 text-sm text-(--ink-soft)">{LEVEL_SUMMARY[level].th}</p>}
                {current?.tier && <p className="mt-1 text-sm font-semibold text-(--ink)">{tierLabel(current.tier)}</p>}
                <div className="mt-3">
                  <StateChip state={state} />
                </div>
              </div>

              <dl className="mx-auto mt-10 grid max-w-2xl grid-cols-1 border-y border-(--line) sm:grid-cols-3">
                {[
                  { label: "วันที่อนุมัติ", value: thaiDate(current?.approvedAt, "long") },
                  { label: "มีผลถึง", value: current?.expiresAt ? thaiDate(current.expiresAt, "long") : "ไม่ระบุ" },
                  { label: "เลขที่ใบอนุญาต", value: current?.licenceNo ?? "—" },
                ].map((d, i) => (
                  <div key={d.label} className={`flex flex-col-reverse border-(--line) px-4 py-4 ${i ? "border-t sm:border-l sm:border-t-0" : ""}`}>
                    <dt className="text-xs text-(--ink-soft)">{d.label}</dt>
                    <dd className={`${s} text-lg font-semibold text-(--ink)`}>{d.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-sm text-(--ink-soft)">
                {academy.province && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {academy.province}
                  </span>
                )}
                {academy.parentClub && (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" />
                    {academy.parentClub}
                  </span>
                )}
                {academy.website && (
                  <a href={academy.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-(--ink) underline decoration-(--line) underline-offset-4 hover:decoration-(--accent)">
                    <Globe className="h-4 w-4" />
                    เว็บไซต์
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {history.length > 0 && (
          <section className="mt-8 rounded-2xl bg-white p-6 ring-1 ring-(--line) sm:p-8">
            <h2 className={`${s} text-2xl font-bold text-(--ink)`}>ประวัติการรับรอง</h2>
            <ol className="mt-6 divide-y divide-(--line) border-y border-(--line)">
              {history.map((l) => (
                <li key={l.id} className="flex items-center gap-4 py-4">
                  <Medal level={l.level} size="sm" />
                  <span className="min-w-0">
                    <span className={`${s} block font-bold text-(--ink)`}>{isLevel(l.level) ? `${LEVEL_META[l.level].label} · ${LEVEL_META[l.level].th}` : "ยังไม่ระบุระดับ"}</span>
                    <span className="block text-sm text-(--ink-soft)">
                      อนุมัติ {thaiDate(l.approvedAt)}
                      {l.expiresAt && ` · มีผลถึง ${thaiDate(l.expiresAt)}`} · {LICENCE_STATUS[l.status] ?? l.status}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {level && (
          <Link href={`/academies?criteria=${level}#criteria`} className="group mt-6 flex items-center justify-between gap-4 rounded-2xl bg-(--night) px-6 py-5 text-sm text-white/75 hover:bg-(--ink)">
            <span>
              เกณฑ์มาตรฐานของ <span className="font-semibold text-white">{LEVEL_SUMMARY[level].title}</span> — {LEVEL_SUMMARY[level].audience.th}
            </span>
            <ArrowRight className="h-4 w-4 flex-none text-[#d9b45a] transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}

        {academy.aliases && <p className="mt-6 text-xs text-(--ink-soft)">ชื่อเรียกอื่น: {academy.aliases}</p>}
        <p className="mt-2 text-xs text-(--ink-soft)">ข้อมูล ณ วันที่ {thaiDate(now, "long")} จากทะเบียน Academy Licensing ของสมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์</p>
      </main>

      <PublicFooter />
    </div>
  );
}
