import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseId } from "@/lib/route-id";
import { LOGO_URL } from "@/lib/brand";
import { LEVEL_META, LICENCE_STATUS, currentLicence, isLevel, licenceState, showPublicly, thaiDate, levelRank } from "@/lib/academy";
import { LEVEL_SUMMARY } from "@/lib/academy-criteria";
import { LevelBadge, LevelMedal, StateChip } from "@/components/academy/AcademyUi";
import { ArrowLeft, ArrowRight, MapPin, Building2, Globe, ShieldCheck, CalendarCheck, CalendarClock, Hash, Settings } from "lucide-react";

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
  const [academy, user] = await Promise.all([load((await params).id), getCurrentUser()]);
  const now = new Date();
  const current = academy ? currentLicence(academy.licences) : null;
  const state = licenceState(current, now);
  if (!academy || !showPublicly(academy.active, state)) notFound();
  const canManage = user?.role === "ADMIN" || user?.role === "STAFF";
  const level = current && isLevel(current.level) ? current.level : null;
  const history = [...academy.licences]
    .filter((l) => l.status !== "REVOKED")
    .sort((a, b) => (b.approvedAt?.getTime() ?? 0) - (a.approvedAt?.getTime() ?? 0) || levelRank(b.level) - levelRank(a.level) || b.id - a.id);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-white/10 bg-indigo-950">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/academies" className="flex items-center gap-2.5">
            <Image src={LOGO_URL} alt="FA Thailand" width={36} height={36} className="h-9 w-9 rounded-lg object-cover" />
            <p className="text-sm font-bold text-white">Academy Licensing</p>
          </Link>
          <div className="flex items-center gap-2">
            {canManage && (
              <Link
                href={`/academies/manage/${academy.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-indigo-950 hover:bg-amber-300"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">แก้ไข</span>
              </Link>
            )}
            <Link
              href="/academies"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-indigo-200 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">ทำเนียบอคาเดมี</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <section className="relative overflow-hidden rounded-4xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className={`h-2 bg-linear-to-r ${level ? LEVEL_META[level].medal : "from-slate-200 to-slate-300"}`} />
          <div className="flex flex-col items-center gap-5 p-6 text-center sm:flex-row sm:p-8 sm:text-left">
            <LevelMedal level={level} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <LevelBadge level={level} />
                <StateChip state={state} />
              </div>
              <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">{academy.nameEn}</h1>
              {academy.nameTh && <p className="mt-0.5 text-slate-500">{academy.nameTh}</p>}
              <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-slate-500 sm:justify-start">
                {academy.province && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {academy.province}
                  </span>
                )}
                {academy.parentClub && (
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {academy.parentClub}
                  </span>
                )}
                {academy.website && (
                  <a href={academy.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:underline">
                    <Globe className="h-4 w-4" />
                    เว็บไซต์
                  </a>
                )}
              </div>
            </div>
          </div>

          <dl className="grid border-t border-slate-100 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, label: "ระดับที่ได้รับ", value: level ? `FAT ${LEVEL_META[level].label} Level Academy` : "รอประกาศระดับ" },
              { icon: CalendarCheck, label: "วันที่อนุมัติ", value: thaiDate(current?.approvedAt, "long") },
              { icon: CalendarClock, label: "มีผลถึง", value: current?.expiresAt ? thaiDate(current.expiresAt, "long") : "ไม่ระบุ" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 border-slate-100 px-6 py-4 sm:border-l sm:first:border-l-0">
                <Icon className="h-5 w-5 flex-none text-indigo-500" />
                <div>
                  <dt className="text-xs text-slate-400">{label}</dt>
                  <dd className="text-sm font-semibold text-slate-800">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
          {current?.licenceNo && (
            <p className="flex items-center gap-1.5 border-t border-slate-100 px-6 py-3 text-xs text-slate-500">
              <Hash className="h-3.5 w-3.5" />
              เลขที่ใบอนุญาต {current.licenceNo}
            </p>
          )}
        </section>

        {history.length > 0 && (
          <section className="mt-6 rounded-4xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
            <h2 className="font-bold text-slate-900">ประวัติการรับรอง</h2>
            <ol className="mt-5 space-y-4 border-l-2 border-slate-100 pl-5">
              {history.map((l) => (
                <li key={l.id} className="relative">
                  <span className="absolute -left-[1.6rem] top-0.5">
                    <LevelMedal level={l.level} size="sm" />
                  </span>
                  <div className="ml-5 flex flex-wrap items-center gap-2">
                    <LevelBadge level={l.level} />
                    <span className="text-xs text-slate-400">{LICENCE_STATUS[l.status] ?? l.status}</span>
                  </div>
                  <p className="ml-5 mt-1 text-xs text-slate-500">
                    อนุมัติ {thaiDate(l.approvedAt)}
                    {l.expiresAt && ` · มีผลถึง ${thaiDate(l.expiresAt)}`}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {level && (
          <Link
            href={`/academies?criteria=${level}#criteria`}
            className="mt-6 flex items-center justify-between gap-3 rounded-3xl bg-indigo-950 px-6 py-4 text-sm text-indigo-100 transition-colors hover:bg-indigo-900"
          >
            <span>
              เกณฑ์มาตรฐานของ <span className="font-bold text-white">{LEVEL_SUMMARY[level].title}</span> — {LEVEL_SUMMARY[level].audience.th}
            </span>
            <ArrowRight className="h-4 w-4 flex-none" />
          </Link>
        )}

        {academy.aliases && <p className="mt-6 text-center text-xs text-slate-400">ชื่อเรียกอื่น: {academy.aliases}</p>}
        <p className="mt-3 text-center text-xs text-slate-400">
          ข้อมูล ณ วันที่ {thaiDate(now, "long")} จากทะเบียน Academy Licensing ของสมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์
        </p>
      </main>
    </div>
  );
}
