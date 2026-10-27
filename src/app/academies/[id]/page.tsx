import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getAcademyUser, getCurrentUser } from "@/lib/auth";
import { parseId } from "@/lib/route-id";
import { LEVEL_META, LICENCE_STATUS, currentLicence, isLevel, licenceState, showPublicly, thaiDate, tierLabel, levelRank, type AcademyLevel } from "@/lib/academy";
import { LEVEL_SUMMARY } from "@/lib/academy-criteria";
import { StateChip } from "@/components/academy/AcademyUi";
import { PublicFooter, PublicHeader } from "@/components/academy/PublicChrome";
import { COIN } from "@/components/academy/Podium";
import { AcademyCrest } from "@/components/academy/AcademyCrest";
import { InView } from "@/components/academy/InView";
import { AcademyLogo } from "@/components/SectionLogos";
import { academyFont, academyPoster } from "@/components/typefaces/academy";
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
const P = academyPoster.className;
const LEVEL_TEXT: Record<AcademyLevel, string> = { BRONZE: "#c14d14", SILVER: "#5b6b80", GOLD: "#a77700" };

// เหรียญระดับ (แบบเดียวกับแท่นในหน้าหลัก) — ยังไม่มีระดับ = เหรียญเทา
function Coin({ level, className = "" }: { level: AcademyLevel | null; className?: string }) {
  const c = level ? COIN[level] : { face: "#e2e8f0", side: "#94a3b8", ring: "#ffffff", ink: "#475569", letter: "–" };
  return (
    <svg viewBox="0 0 100 70" aria-hidden className={className}>
      <ellipse cx="50" cy="44" rx="44" ry="22" fill={c.side} />
      <rect x="6" y="30" width="88" height="14" fill={c.side} />
      <ellipse cx="50" cy="30" rx="44" ry="22" fill={c.face} />
      <ellipse cx="50" cy="30" rx="33" ry="16" fill="none" stroke={c.ring} strokeWidth="2.5" />
      <text x="50" y="38" textAnchor="middle" fontSize="22" fontWeight="800" fill={c.ink}>
        {c.letter}
      </text>
    </svg>
  );
}

// หน้าโปรไฟล์อคาเดมี (สาธารณะ): ตรา/โลโก้ + บัตรใบอนุญาตแบบโปสเตอร์ + ประวัติการรับรอง · ไม่แสดงข้อมูลติดต่อส่วนบุคคล
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

  return (
    <div className={`${theme.theme} ${academyFont.className} min-h-screen overflow-x-clip`}>
      <PublicHeader viewer={viewer} manageHref={`/academies/manage/${academy.id}`} />

      <main>
        {/* ===== ฮีโร่ฟ้า: ตรา + ชื่อ + บัตรใบอนุญาต ===== */}
        <section className="relative isolate overflow-hidden bg-(--sky)">
          <span aria-hidden className="absolute -right-20 -top-20 -z-10 h-72 w-72 rounded-full bg-white/15" />
          <span aria-hidden className="absolute bottom-8 left-[40%] -z-10 hidden h-24 w-24 rounded-full border-2 border-dashed border-white/50 lg:block" />
          <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-center lg:pb-20">
            <div className="lg:col-span-2">
              <Link href="/academies#directory" className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-1.5 text-sm font-bold text-(--ink) hover:bg-white">
                <ArrowLeft className="h-4 w-4" />
                ทำเนียบอคาเดมี
              </Link>
            </div>
            <div>
              <div className={theme.rise} style={i(0)}>
                <AcademyCrest name={academy.nameEn} logoUrl={academy.logoUrl} level={level} size="lg" className="ring-4 ring-white" />
              </div>
              <h1 className={`${theme.rise} ${P} mt-7 text-4xl font-extrabold leading-[1.05] text-(--ink) sm:text-6xl`} style={i(1)}>
                {academy.nameEn}
              </h1>
              {academy.nameTh && (
                <p className={`${theme.rise} mt-2 text-lg font-semibold text-white sm:text-xl`} style={i(2)}>
                  {academy.nameTh}
                </p>
              )}
              <div className={`${theme.rise} mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-(--ink)`} style={i(3)}>
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
                  <a href={academy.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 underline decoration-(--ink)/30 underline-offset-4 hover:decoration-(--ink)">
                    <Globe className="h-4 w-4" />
                    เว็บไซต์
                  </a>
                )}
              </div>
            </div>

            {/* บัตรใบอนุญาตแบบโปสเตอร์ */}
            <div className={theme.rise} style={i(2)}>
              <div className="overflow-hidden rounded-3xl bg-white shadow-[8px_8px_0_var(--ink)] ring-2 ring-(--ink)">
                <div className="flex items-start justify-between gap-4 bg-(--ink) px-6 py-4 text-white">
                  <span className="text-[10px] font-bold uppercase leading-tight tracking-[0.22em] text-(--yellow)">
                    FAT Academy
                    <br />
                    Licence
                  </span>
                  <AcademyLogo className="h-8" />
                </div>
                <div className="px-6 pb-6 pt-5">
                  <div className="flex items-center gap-4">
                    <Coin level={level} className="h-16 w-22 flex-none" />
                    <p className={`${P} text-2xl font-extrabold leading-[0.95] text-(--ink)`}>
                      {level ? (
                        <>
                          FAT <span style={{ color: LEVEL_TEXT[level] }}>{LEVEL_META[level].label}</span> Level Academy
                        </>
                      ) : (
                        "รอประกาศระดับ"
                      )}
                    </p>
                  </div>
                  {level && <p className="mt-2 text-sm font-medium text-(--ink-soft)">{LEVEL_SUMMARY[level].th}</p>}
                  <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl bg-(--yellow) p-4 text-sm text-(--ink)">
                    <div className="col-span-2 flex flex-col-reverse">
                      <dt className="text-[11px] font-semibold text-(--ink)/65">เลขที่ใบอนุญาต</dt>
                      <dd className="font-mono text-base font-bold tracking-wider">{current?.licenceNo ?? "—"}</dd>
                    </div>
                    <div className="flex flex-col-reverse">
                      <dt className="text-[11px] font-semibold text-(--ink)/65">วันที่อนุมัติ</dt>
                      <dd className="font-bold">{thaiDate(current?.approvedAt, "long")}</dd>
                    </div>
                    <div className="flex flex-col-reverse">
                      <dt className="text-[11px] font-semibold text-(--ink)/65">มีผลถึง</dt>
                      <dd className="font-bold">{current?.expiresAt ? thaiDate(current.expiresAt, "long") : "ไม่ระบุ"}</dd>
                    </div>
                    {current?.tier && (
                      <div className="col-span-2 flex flex-col-reverse">
                        <dt className="text-[11px] font-semibold text-(--ink)/65">ลีกของสโมสร</dt>
                        <dd className="font-bold">{tierLabel(current.tier)}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          {history.length > 0 && (
            <InView as="section" className="rounded-3xl bg-white p-6 ring-2 ring-(--ink)/10 sm:p-10">
              <p className={`${theme.up} text-[11px] font-bold uppercase tracking-[0.26em] text-(--sky-deep)`}>Licence history</p>
              <h2 className={`${theme.up} ${P} mt-2 text-3xl font-extrabold text-(--ink)`} style={i(1)}>
                ประวัติการรับรอง
              </h2>
              <ol className="relative mt-8 space-y-5 before:absolute before:bottom-6 before:left-[1.85rem] before:top-6 before:w-1 before:rounded-full before:bg-(--sky-soft)">
                {history.map((l, n) => (
                  <li key={l.id} className={`${theme.up} relative flex items-center gap-5`} style={i(n + 2)}>
                    <Coin level={isLevel(l.level) ? l.level : null} className="relative h-11 w-15 flex-none" />
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
            <Link href={`/academies?criteria=${level}#criteria`} className="group mt-6 flex items-center justify-between gap-4 rounded-3xl bg-(--ink) px-7 py-6 text-sm text-white/75 transition-transform hover:-translate-y-0.5">
              <span>
                เกณฑ์มาตรฐานของ <span className="font-bold text-white">{LEVEL_SUMMARY[level].title}</span> — {LEVEL_SUMMARY[level].audience.th}
              </span>
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-(--yellow) text-(--ink) transition-transform group-hover:-rotate-45">
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
