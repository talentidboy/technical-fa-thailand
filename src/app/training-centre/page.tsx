import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { TRAINING_CENTRE_AREAS, labelFor } from "@/lib/constants";
import { dataCenterBg } from "@/lib/section-images";
import { markerFont, trainingFont } from "@/components/typefaces/training";
import { TrainingHeader } from "@/components/training/TrainingHeader";
import { TacticsBoard } from "@/components/training/TacticsBoard";
import { DataCentreLogo } from "@/components/SectionLogos";
import styles from "@/components/training/training.module.css";
import { AREA_INFO, areaColor } from "@/components/training/areas";
import { ArrowRight, Plus, Settings } from "lucide-react";

const t = trainingFont.className;
const m = markerFont.className;
const INK = "#111827";

function formatDate(date: Date) {
  return date.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Bangkok" });
}

// ป้ายหมวด + ธีม + กลุ่มอายุ เป็นบรรทัดเดียว
function Meta({ area, theme, ageGroup }: { area: string; theme: string | null; ageGroup: string | null }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: areaColor(area) }}>
        {labelFor(TRAINING_CENTRE_AREAS, area)}
      </span>
      {theme && <span>· {theme}</span>}
      {ageGroup && <span>· {ageGroup}</span>}
    </p>
  );
}

export default async function TrainingCentrePage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  // อ่านบทความได้ทุกคน · ปุ่มจัดการบทความแสดงเฉพาะผู้ดูแลระบบ/เจ้าหน้าที่
  const user = await getCurrentUser();

  const { area } = await searchParams;
  const activeArea = TRAINING_CENTRE_AREAS.some((a) => a.value === area) ? area : undefined;

  const [articles, byArea] = await Promise.all([
    prisma.trainingArticle.findMany({
      where: activeArea ? { area: activeArea } : undefined,
      orderBy: { createdAt: "desc" },
    }),
    prisma.trainingArticle.groupBy({ by: ["area"], _count: { _all: true } }),
  ]);
  const areaCount = (value: string) => byArea.find((a) => a.area === value)?._count._all ?? 0;
  const totalCount = byArea.reduce((s, a) => s + a._count._all, 0);

  const [featuredArticle, ...restArticles] = articles;
  const canManage = user?.role === "ADMIN" || user?.role === "STAFF";

  return (
    <div className={`${t} min-h-screen overflow-x-clip bg-[#eceff2] text-slate-900`}>
      <TrainingHeader
        links={[
          { href: "#areas", label: "หมวด Area" },
          { href: "#articles", label: "บทความ" },
        ]}
        actions={
          canManage ? (
            <Link
              href="/training-centre/manage"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#111827] px-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#1f2937]"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">จัดการบทความ</span>
            </Link>
          ) : undefined
        }
      />

      {/* ===== ไวท์บอร์ดแทคติก ===== */}
      <section className="px-4 pb-16 pt-8 sm:px-6 lg:pt-12">
        <div className="mx-auto max-w-7xl">
          <div className="relative rounded-2xl border-[10px] border-[#cfd6de] bg-[#fdfdfb] shadow-[0_40px_70px_-40px_rgb(15_23_42/0.45)] sm:border-[14px]">
            <div className="grid grid-cols-1 gap-10 p-6 sm:p-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
              <div className="flex flex-col">
                <div className="flex items-center gap-4">
                  <DataCentreLogo className="h-16 sm:h-20" />
                  <p className="font-mono text-[11px] font-semibold uppercase leading-relaxed tracking-[0.22em] text-slate-500">
                    FA Thailand
                    <br />
                    Technical Department
                  </p>
                </div>
                <h1 className="mt-6 text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl" style={{ color: INK }}>
                  Technical Data
                  <br />& Articles Centre
                </h1>
                <p className={`${m} mt-5 -rotate-2 text-2xl text-[#dc2626] sm:text-3xl`}>ศูนย์ข้อมูลและบทความด้านเทคนิค</p>
                <p className="mt-5 max-w-md text-base leading-relaxed text-slate-600">
                  ศูนย์รวบรวมข้อมูลและบทความวิเคราะห์ด้านเทคนิคและการฝึกอบรมของ ฝ่ายเทคนิค สมาคมกีฬาฟุตบอลแห่งประเทศไทย
                </p>
                <div className="mt-8 flex flex-wrap items-end gap-6 lg:mt-auto lg:pt-8">
                  <dl className="flex flex-wrap gap-4">
                    {[
                      { v: totalCount, l: "บทความทั้งหมด", c: "#1d4ed8" },
                      { v: TRAINING_CENTRE_AREAS.length, l: "หมวด Area", c: "#dc2626" },
                    ].map((s) => (
                      <div key={s.l} className="flex min-w-32 flex-col-reverse rounded-xl border-2 px-5 py-3" style={{ borderColor: s.c }}>
                        <dt className="text-xs text-slate-500">{s.l}</dt>
                        <dd className={`${m} text-4xl leading-tight`} style={{ color: s.c }}>
                          {s.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {/* รูปที่แปะแม่เหล็กไว้มุมกระดาน */}
                  <figure className="relative z-10 ml-auto hidden w-48 rotate-3 bg-white p-2 pb-8 shadow-xl sm:block lg:-mb-14 lg:-mr-4">
                    <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full bg-[#dc2626] shadow-md ring-2 ring-white" />
                    <span className="relative block aspect-4/3 overflow-hidden">
                      <Image src={dataCenterBg} alt="ผู้ฝึกสอนอธิบายแผนการฝึกบนกระดาน" fill priority placeholder="blur" sizes="12rem" className="object-cover object-[40%_40%]" />
                    </span>
                    <figcaption className={`${m} absolute inset-x-0 bottom-1.5 text-center text-sm text-slate-600`}>Coaching session · Group 1</figcaption>
                  </figure>
                </div>
              </div>

              <div className="self-center">
                <TacticsBoard />
              </div>
            </div>
            {/* รางวางปากกาใต้กระดาน */}
            <div aria-hidden className="absolute -bottom-[22px] left-1/2 flex h-3 w-2/3 -translate-x-1/2 items-end justify-center gap-3 rounded-full bg-[#b8c1cb] sm:-bottom-[26px]">
              {["#1d4ed8", "#dc2626", "#111827"].map((c, i) => (
                <span key={c} className="-mb-0.5 flex h-3 w-16 items-center rounded-full bg-white shadow" style={{ transform: `translateX(${(i - 1) * 6}px)` }}>
                  <span className="h-full w-4 rounded-l-full" style={{ background: c }} />
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== หมวด: แฟ้มเอกสาร 3 สี ===== */}
      <section id="areas" className="scroll-mt-20 px-4 pt-6 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: INK }}>
              หมวด Area
            </h2>
            <p className={`${m} text-lg text-slate-500`}>เลือกแฟ้มเพื่อดูบทความในหมวด</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {TRAINING_CENTRE_AREAS.map((a, i) => {
              const info = AREA_INFO[a.value];
              const active = activeArea === a.value;
              const color = info?.color ?? INK;
              return (
                <Link
                  key={a.value}
                  href={active ? "/training-centre#articles" : `/training-centre?area=${a.value}#articles`}
                  aria-current={active ? "page" : undefined}
                  className={`${styles.folder} relative block pt-7`}
                >
                  <span className="absolute left-0 top-0 flex h-8 items-center rounded-t-xl px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white" style={{ background: color }}>
                    {String(i + 1).padStart(2, "0")} · {a.label}
                  </span>
                  <span className={`relative flex min-h-56 flex-col rounded-2xl rounded-tl-none p-6 text-white ${active ? "ring-4 ring-amber-300 ring-offset-4 ring-offset-[#eceff2]" : ""}`} style={{ background: color }}>
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-3xl font-bold leading-none">{a.label}</span>
                      <span className={`${m} flex-none text-lg text-white/85`}>{areaCount(a.value)} บทความ</span>
                    </span>
                    {info && (
                      <>
                        <span className="mt-1.5 text-sm font-semibold text-white/85">{info.th}</span>
                        <span className="mt-3 text-sm leading-relaxed text-white/80">{info.text}</span>
                      </>
                    )}
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold">
                      {active ? "แสดงทุกหมวด" : "เปิดแฟ้มนี้"}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== บทความ ===== */}
      <section id="articles" className="scroll-mt-20 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-2 border-slate-300 pb-4">
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: INK }}>
              {activeArea ? labelFor(TRAINING_CENTRE_AREAS, activeArea) : "บทความล่าสุด"}
            </h2>
            <nav aria-label="หมวดบทความ" className="flex flex-wrap gap-1 text-sm">
              {[{ value: undefined, label: "ทั้งหมด" }, ...TRAINING_CENTRE_AREAS].map((a) => {
                const active = activeArea === a.value;
                return (
                  <Link
                    key={a.label}
                    href={a.value ? `/training-centre?area=${a.value}#articles` : "/training-centre#articles"}
                    className={`rounded-lg px-3.5 py-1.5 font-semibold transition-colors ${active ? "bg-[#111827] text-white" : "text-slate-600 hover:bg-white hover:text-slate-900"}`}
                  >
                    {a.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {articles.length === 0 ? (
            <div className="relative grid gap-6 rounded-2xl border-[8px] border-[#cfd6de] bg-[#fdfdfb] p-8 sm:p-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div>
                <p className={`${m} -rotate-1 text-3xl text-[#1d4ed8]`}>ยังไม่มีบทความในหมวดนี้</p>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-500">อยู่ระหว่างการพัฒนา เร็วๆ นี้จะมีบทความวิเคราะห์เทคนิคเพิ่มเติม</p>
              </div>
              {canManage && (
                <Link href="/training-centre/manage" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#111827] px-5 text-sm font-semibold text-white hover:bg-[#1f2937]">
                  <Plus className="h-4 w-4" />
                  เพิ่มบทความ
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-10">
              {featuredArticle && (
                <Link
                  href={`/training-centre/${featuredArticle.id}`}
                  className={`${styles.card} group grid grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]`}
                >
                  <div className="relative aspect-16/10 bg-[#111827] lg:aspect-auto">
                    {featuredArticle.coverImageUrl ? (
                      <Image
                        src={featuredArticle.coverImageUrl}
                        alt={featuredArticle.title}
                        fill
                        sizes="(min-width: 1024px) 40rem, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span className={`${m} absolute bottom-5 left-6 text-4xl text-white/90`}>{labelFor(TRAINING_CENTRE_AREAS, featuredArticle.area)}</span>
                    )}
                  </div>
                  <div className="flex flex-col border-t-4 p-7 sm:p-9 lg:border-l-4 lg:border-t-0" style={{ borderColor: areaColor(featuredArticle.area) }}>
                    <p className="font-mono text-xs text-slate-400">#01 · บทความล่าสุด</p>
                    <div className="mt-3">
                      <Meta area={featuredArticle.area} theme={featuredArticle.theme} ageGroup={featuredArticle.ageGroup} />
                    </div>
                    <h3 className="mt-3 text-3xl font-bold leading-snug text-slate-900 sm:text-4xl">
                      <span className={styles.highlight}>{featuredArticle.title}</span>
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-slate-600">{featuredArticle.excerpt}</p>
                    <p className="mt-auto flex items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm">
                      <span className="font-mono text-slate-500">{formatDate(featuredArticle.createdAt)}</span>
                      <span className="inline-flex items-center gap-1.5 font-semibold text-[#1d4ed8]">
                        อ่านบทความ
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </p>
                  </div>
                </Link>
              )}

              {restArticles.length > 0 && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {restArticles.map((article, i) => (
                    <Link
                      key={article.id}
                      href={`/training-centre/${article.id}`}
                      className={`${styles.card} group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md`}
                    >
                      <span className="h-1.5" style={{ background: areaColor(article.area) }} />
                      <div className="relative aspect-16/9 bg-[#111827]">
                        {article.coverImageUrl ? (
                          <Image
                            src={article.coverImageUrl}
                            alt={article.title}
                            fill
                            sizes="(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <span className={`${m} absolute bottom-3 left-4 text-2xl text-white/90`}>{labelFor(TRAINING_CENTRE_AREAS, article.area)}</span>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <p className="font-mono text-[11px] text-slate-400">#{String(i + 2).padStart(2, "0")}</p>
                        <div className="mt-1.5">
                          <Meta area={article.area} theme={article.theme} ageGroup={article.ageGroup} />
                        </div>
                        <h3 className="mt-2 text-xl font-bold leading-snug text-slate-900">
                          <span className={styles.highlight}>{article.title}</span>
                        </h3>
                        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">{article.excerpt}</p>
                        <p className="mt-4 border-t border-slate-100 pt-3 font-mono text-xs text-slate-500">{formatDate(article.createdAt)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
