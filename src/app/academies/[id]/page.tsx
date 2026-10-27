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
import { MEDAL, Medal } from "@/components/academy/Medal";
import { AcademyCrest } from "@/components/academy/AcademyCrest";
import { InView } from "@/components/academy/InView";
import { AcademyLogo } from "@/components/SectionLogos";
import { academyFont } from "@/components/typefaces/academy";
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

const i = (n: number) => ({ "--i": n }) as React.CSSProperties;

// หน้าโปรไฟล์อคาเดมี (สาธารณะ): ตรา/โลโก้ + บัตรใบอนุญาตดิจิทัล + ประวัติการรับรอง · ไม่แสดงข้อมูลติดต่อส่วนบุคคล
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
  const metal = level ? `linear-gradient(125deg, ${MEDAL[level].ribbon}, ${MEDAL[level].face} 40%, ${MEDAL[level].ring} 65%, ${MEDAL[level].face})` : "linear-gradient(125deg, #334155, #64748b)";
  const ink = level === "SILVER" ? "#0a1630" : "#fff";

  return (
    <div className={`${theme.theme} ${academyFont.className} min-h-screen overflow-x-clip`}>
      <PublicHeader viewer={viewer} manageHref={`/academies/manage/${academy.id}`} />

      <main>
        {/* ===== ฮีโร่: ตรา + ชื่อ + บัตรใบอนุญาต ===== */}
        <section className="relative isolate overflow-hidden bg-(--night) text-white">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-center lg:pb-20">
            <div className="lg:col-span-2">
              <Link href="/academies#directory" className="inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                ทำเนียบอคาเดมี
              </Link>
            </div>
            <div>
              <div className={theme.rise} style={i(0)}>
                <AcademyCrest name={academy.nameEn} logoUrl={academy.logoUrl} level={level} size="lg" className="shadow-[0_20px_50px_-20px_rgb(0_0_0/0.8)]" />
              </div>
              <h1 className={`${theme.rise} mt-7 text-4xl font-bold leading-[1.08] sm:text-6xl`} style={i(1)}>
                {academy.nameEn}
              </h1>
              {academy.nameTh && (
                <p className={`${theme.rise} mt-2 text-lg text-white/70 sm:text-xl`} style={i(2)}>
                  {academy.nameTh}
                </p>
              )}
              <div className={`${theme.rise} mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/70`} style={i(3)}>
                <StateChip state={state} />
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
                  <a href={academy.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-(--gold)">
                    <Globe className="h-4 w-4" />
                    เว็บไซต์
                  </a>
                )}
              </div>
            </div>

            {/* บัตรใบอนุญาตดิจิทัล */}
            <div className={theme.rise} style={i(2)}>
              <div className={`${theme.shine} rounded-3xl p-6 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9)] sm:p-7`} style={{ background: metal, color: ink }}>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[10px] font-bold uppercase leading-tight tracking-[0.22em] opacity-80">
                    FAT Academy
                    <br />
                    Licence
                  </span>
                  <AcademyLogo className="h-8" />
                </div>
                <div className="mt-8 flex items-center gap-4">
                  <Medal level={level} size="md" />
                  <div className="min-w-0">
                    <p className="text-xl font-bold leading-tight">{level ? `FAT ${LEVEL_META[level].label} Level Academy` : "รอประกาศระดับ"}</p>
                    {level && <p className="text-sm opacity-80">{LEVEL_SUMMARY[level].th}</p>}
                  </div>
                </div>
                {current?.tier && <p className="mt-4 inline-flex rounded-md bg-black/15 px-2.5 py-1 text-xs font-semibold">{tierLabel(current.tier)}</p>}
                <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-current/20 pt-4 text-sm">
                  <div className="col-span-2 flex flex-col-reverse">
                    <dt className="text-[11px] opacity-70">เลขที่ใบอนุญาต</dt>
                    <dd className="font-mono text-base font-semibold tracking-wider">{current?.licenceNo ?? "—"}</dd>
                  </div>
                  <div className="flex flex-col-reverse">
                    <dt className="text-[11px] opacity-70">วันที่อนุมัติ</dt>
                    <dd className="font-semibold">{thaiDate(current?.approvedAt, "long")}</dd>
                  </div>
                  <div className="flex flex-col-reverse">
                    <dt className="text-[11px] opacity-70">มีผลถึง</dt>
                    <dd className="font-semibold">{current?.expiresAt ? thaiDate(current.expiresAt, "long") : "ไม่ระบุ"}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          {history.length > 0 && (
            <InView as="section" className="rounded-3xl bg-white p-6 ring-1 ring-(--line) sm:p-10">
              <p className={`${theme.up} text-[11px] font-semibold uppercase tracking-[0.26em] text-(--accent)`}>Licence history</p>
              <h2 className={`${theme.up} mt-2 text-3xl font-bold text-(--ink)`} style={i(1)}>
                ประวัติการรับรอง
              </h2>
              <ol className="relative mt-8 space-y-6 before:absolute before:bottom-3 before:left-5 before:top-3 before:w-0.5 before:bg-(--line)">
                {history.map((l, n) => (
                  <li key={l.id} className={`${theme.up} relative flex items-center gap-5`} style={i(n + 2)}>
                    <span className="relative rounded-full bg-white p-0.5">
                      <Medal level={l.level} size="sm" />
                    </span>
                    <span className="min-w-0 flex-1 rounded-2xl bg-(--paper) px-5 py-3.5">
                      <span className="block font-bold text-(--ink)">{isLevel(l.level) ? `${LEVEL_META[l.level].label} · ${LEVEL_META[l.level].th}` : "ยังไม่ระบุระดับ"}</span>
                      <span className="block text-sm text-(--ink-soft)">
                        อนุมัติ {thaiDate(l.approvedAt)}
                        {l.expiresAt && ` · มีผลถึง ${thaiDate(l.expiresAt)}`} · {LICENCE_STATUS[l.status] ?? l.status}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </InView>
          )}

          {level && (
            <Link href={`/academies?criteria=${level}#criteria`} className="group mt-6 flex items-center justify-between gap-4 rounded-3xl bg-(--night) px-7 py-6 text-sm text-white/75 transition-transform hover:-translate-y-0.5">
              <span>
                เกณฑ์มาตรฐานของ <span className="font-semibold text-white">{LEVEL_SUMMARY[level].title}</span> — {LEVEL_SUMMARY[level].audience.th}
              </span>
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-(--gold) text-(--night) transition-transform group-hover:-rotate-45">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          )}

          {academy.aliases && <p className="mt-6 text-xs text-(--ink-soft)">ชื่อเรียกอื่น: {academy.aliases}</p>}
          <p className="mt-2 text-xs text-(--ink-soft)">ข้อมูล ณ วันที่ {thaiDate(now, "long")} จากทะเบียน Academy Licensing ของสมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์</p>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
