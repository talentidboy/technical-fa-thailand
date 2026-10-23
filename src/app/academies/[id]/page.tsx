import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getAcademyUser, getCurrentUser } from "@/lib/auth";
import { parseId } from "@/lib/route-id";
import { LEVEL_META, LICENCE_STATUS, currentLicence, isLevel, licenceState, showPublicly, thaiDate, tierLabel, levelRank } from "@/lib/academy";
import { LEVEL_SUMMARY } from "@/lib/academy-criteria";
import { LevelMark, StateChip } from "@/components/academy/AcademyUi";
import { PublicFooter, PublicHeader } from "@/components/academy/PublicChrome";
import { display } from "@/components/academy/fonts";
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

// หน้าโปรไฟล์อคาเดมี (สาธารณะ) — ใช้ตรวจสอบว่าได้รับการรับรองระดับใด มีผลถึงเมื่อไร · ไม่แสดงข้อมูลติดต่อส่วนบุคคล
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
  const h = display.className;

  return (
    <div className={`${theme.theme} min-h-screen`}>
      <PublicHeader viewer={viewer} manageHref={`/academies/manage/${academy.id}`} />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link href="/academies#directory" className="inline-flex items-center gap-1 text-sm text-(--ink-soft) hover:text-(--ink)">
          <ArrowLeft className="h-4 w-4" />
          ทำเนียบอคาเดมี
        </Link>

        <section className="mt-5 border border-(--line) bg-white">
          <div className="h-2" style={{ background: level ? LEVEL_META[level].hex : "#cbd5e1" }} />
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <LevelMark level={level} />
              <StateChip state={state} />
            </div>
            <h1 className={`${h} mt-3 text-3xl font-semibold leading-tight tracking-tight text-(--ink) sm:text-4xl`}>{academy.nameEn}</h1>
            {academy.nameTh && <p className="mt-1 text-(--ink-soft)">{academy.nameTh}</p>}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-(--ink-soft)">
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

          <dl className="grid border-t border-(--line) sm:grid-cols-3">
            {[
              { label: "ระดับที่ได้รับ", value: level ? `FAT ${LEVEL_META[level].label} Level Academy` : "รอประกาศระดับ", sub: current?.tier ? tierLabel(current.tier) : null },
              { label: "วันที่อนุมัติ", value: thaiDate(current?.approvedAt, "long"), sub: null },
              { label: "มีผลถึง", value: current?.expiresAt ? thaiDate(current.expiresAt, "long") : "ไม่ระบุ", sub: current?.licenceNo ? `เลขที่ ${current.licenceNo}` : null },
            ].map((d, i) => (
              <div key={d.label} className={`border-(--line) px-6 py-4 sm:px-8 ${i ? "border-t sm:border-l sm:border-t-0" : ""}`}>
                <dt className="text-xs font-semibold text-(--ink-soft)">{d.label}</dt>
                <dd className={`${h} mt-1 text-lg font-semibold text-(--ink)`}>{d.value}</dd>
                {d.sub && <dd className="text-xs text-(--ink-soft)">{d.sub}</dd>}
              </div>
            ))}
          </dl>
        </section>

        {history.length > 0 && (
          <section className="mt-6 border border-(--line) bg-white p-6 sm:p-8">
            <h2 className={`${h} text-xl font-semibold text-(--ink)`}>ประวัติการรับรอง</h2>
            <ol className="mt-4 divide-y divide-(--line) border-y border-(--line)">
              {history.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                  <LevelMark level={l.level} className="w-24" />
                  <span className="flex-1 text-sm text-(--ink)">
                    อนุมัติ {thaiDate(l.approvedAt)}
                    {l.expiresAt && ` · มีผลถึง ${thaiDate(l.expiresAt)}`}
                  </span>
                  <span className="text-xs text-(--ink-soft)">{LICENCE_STATUS[l.status] ?? l.status}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {level && (
          <Link href={`/academies?criteria=${level}#criteria`} className="group mt-6 flex items-center justify-between gap-4 bg-(--ink) px-6 py-5 text-sm text-white/75 hover:bg-(--ink)/90">
            <span>
              เกณฑ์มาตรฐานของ <span className="font-semibold text-white">{LEVEL_SUMMARY[level].title}</span> — {LEVEL_SUMMARY[level].audience.th}
            </span>
            <ArrowRight className="h-4 w-4 flex-none transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}

        {academy.aliases && <p className="mt-6 text-xs text-(--ink-soft)">ชื่อเรียกอื่น: {academy.aliases}</p>}
        <p className="mt-2 text-xs text-(--ink-soft)">ข้อมูล ณ วันที่ {thaiDate(now, "long")} จากทะเบียน Academy Licensing ของสมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์</p>
      </main>

      <PublicFooter />
    </div>
  );
}
