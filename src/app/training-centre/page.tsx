import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { TRAINING_CENTRE_AREAS, labelFor } from "@/lib/constants";
import { display } from "@/components/fonts";
import { ModuleHeader } from "@/components/ModuleHeader";
import { ArrowRight, Plus, Settings } from "lucide-react";

const h = display.className;
const ACCENT = "#b45309";

// คำอธิบายสั้นของแต่ละหมวด (แสดงบนการ์ดหมวด)
const AREA_INFO: Record<string, { th: string; text: string }> = {
  THE_GAME: { th: "เกมการแข่งขัน", text: "หลักการเล่น การวิเคราะห์เกม และรูปแบบการเล่นในแต่ละช่วงของเกม" },
  PRACTICE: { th: "การฝึกซ้อม", text: "การออกแบบแบบฝึก การจัดการฝึกซ้อม และกิจกรรมที่เหมาะกับแต่ละช่วงวัย" },
  ENVIRONMENT: { th: "สภาพแวดล้อม", text: "บทบาทผู้ฝึกสอน บรรยากาศการเรียนรู้ และการดูแลผู้เล่นทั้งในและนอกสนาม" },
};

function formatDate(date: Date) {
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ป้ายหมวด + ธีม + กลุ่มอายุ เป็นบรรทัดเดียว
function Meta({ area, theme, ageGroup }: { area: string; theme: string | null; ageGroup: string | null }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: ACCENT }}>
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
  const user = await getCurrentUser();
  if (!user) redirect("/login");

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
  const canManage = user.role === "ADMIN" || user.role === "STAFF";

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f5f4f0] text-slate-900">
      <ModuleHeader
        title="Training Centre"
        subtitle="ศูนย์ข้อมูลการฝึกสอน · FA Thailand"
        accent={ACCENT}
        links={[
          { href: "#areas", label: "หมวด Area" },
          { href: "#articles", label: "บทความ" },
        ]}
        actions={
          canManage ? (
            <Link
              href="/training-centre/manage"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">จัดการบทความ</span>
            </Link>
          ) : undefined
        }
      />

      {/* ===== ฮีโร่ ===== */}
      <section className="px-4 pb-14 pt-10 sm:px-6 lg:pt-16">
        <div className="mx-auto grid max-w-6xl items-end gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
          <div>
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: ACCENT }}>
              <span className="h-px w-10" style={{ background: ACCENT }} />
              Technical Department · FA Thailand
            </p>
            <h1 className={`${h} mt-6 text-6xl font-semibold leading-none tracking-tight text-[#073c5e] sm:text-8xl`}>Training Centre</h1>
            <p className={`${h} mt-3 text-2xl font-medium text-slate-400 sm:text-3xl`}>ศูนย์ข้อมูลและบทความด้านเทคนิค</p>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              ศูนย์รวบรวมข้อมูลและบทความวิเคราะห์ด้านเทคนิคและการฝึกอบรมของ ฝ่ายเทคนิค สมาคมกีฬาฟุตบอลแห่งประเทศไทย
            </p>
          </div>
          <dl className="flex divide-x divide-slate-300 border-y border-slate-300 py-4 lg:mb-2">
            <div className="pr-8">
              <dd className={`${h} text-5xl font-semibold tabular-nums text-[#073c5e]`}>{totalCount}</dd>
              <dt className="mt-1 text-xs text-slate-500">บทความทั้งหมด</dt>
            </div>
            <div className="pl-8">
              <dd className={`${h} text-5xl font-semibold tabular-nums text-[#073c5e]`}>{TRAINING_CENTRE_AREAS.length}</dd>
              <dt className="mt-1 text-xs text-slate-500">หมวด Area</dt>
            </div>
          </dl>
        </div>
      </section>

      {/* ===== หมวด ===== */}
      <section id="areas" className="scroll-mt-20 px-4 sm:px-6">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-px overflow-hidden rounded-xl border border-slate-300 bg-slate-300 md:grid-cols-3">
          {TRAINING_CENTRE_AREAS.map((a, i) => {
            const info = AREA_INFO[a.value];
            const active = activeArea === a.value;
            const n = areaCount(a.value);
            return (
              <Link
                key={a.value}
                href={active ? "/training-centre#articles" : `/training-centre?area=${a.value}#articles`}
                aria-current={active ? "page" : undefined}
                className={`group flex flex-col p-6 transition-colors sm:p-7 ${active ? "bg-[#073c5e] text-white" : "bg-white hover:bg-[#fbfaf7]"}`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className={`${h} text-sm font-semibold ${active ? "text-amber-300" : "text-slate-400"}`}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={`text-xs ${active ? "text-white/70" : "text-slate-500"}`}>{n} บทความ</span>
                </div>
                <p className={`${h} mt-6 text-3xl font-semibold leading-none ${active ? "text-white" : "text-[#073c5e]"}`}>{a.label}</p>
                {info && (
                  <>
                    <p className={`mt-1.5 text-sm font-semibold ${active ? "text-amber-200" : ""}`} style={active ? undefined : { color: ACCENT }}>
                      {info.th}
                    </p>
                    <p className={`mt-3 text-sm leading-relaxed ${active ? "text-white/75" : "text-slate-600"}`}>{info.text}</p>
                  </>
                )}
                <span className={`mt-6 inline-flex items-center gap-1.5 text-sm font-semibold ${active ? "text-white" : "text-[#073c5e]"}`}>
                  {active ? "แสดงทุกหมวด" : "ดูบทความในหมวดนี้"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ===== บทความ ===== */}
      <section id="articles" className="scroll-mt-20 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-300 pb-4">
            <h2 className={`${h} text-3xl font-semibold text-[#073c5e]`}>{activeArea ? labelFor(TRAINING_CENTRE_AREAS, activeArea) : "บทความล่าสุด"}</h2>
            <nav aria-label="หมวดบทความ" className="flex flex-wrap gap-1 text-sm">
              {[{ value: undefined, label: "ทั้งหมด" }, ...TRAINING_CENTRE_AREAS].map((a) => {
                const active = activeArea === a.value;
                return (
                  <Link
                    key={a.label}
                    href={a.value ? `/training-centre?area=${a.value}#articles` : "/training-centre#articles"}
                    className={`rounded-full px-3.5 py-1.5 font-medium transition-colors ${active ? "bg-[#073c5e] text-white" : "text-slate-600 hover:bg-white hover:text-slate-900"}`}
                  >
                    {a.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {articles.length === 0 ? (
            <div className="grid gap-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 sm:p-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div>
                <p className={`${h} text-2xl font-semibold text-slate-900`}>ยังไม่มีบทความในหมวดนี้</p>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-500">อยู่ระหว่างการพัฒนา เร็วๆ นี้จะมีบทความวิเคราะห์เทคนิคเพิ่มเติม</p>
              </div>
              {canManage && (
                <Link
                  href="/training-centre/manage"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#073c5e] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0a4a73]"
                >
                  <Plus className="h-4 w-4" />
                  เพิ่มบทความ
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-12">
              {featuredArticle && (
                <Link href={`/training-centre/${featuredArticle.id}`} className="group grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-10">
                  <div className="relative aspect-16/10 overflow-hidden rounded-xl bg-[#073c5e]">
                    {featuredArticle.coverImageUrl ? (
                      <Image
                        src={featuredArticle.coverImageUrl}
                        alt={featuredArticle.title}
                        fill
                        sizes="(min-width: 1024px) 40rem, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span className={`${h} absolute bottom-5 left-6 text-4xl font-semibold text-white/90`}>{labelFor(TRAINING_CENTRE_AREAS, featuredArticle.area)}</span>
                    )}
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-xs font-semibold text-amber-700">บทความล่าสุด</p>
                    <div className="mt-3">
                      <Meta area={featuredArticle.area} theme={featuredArticle.theme} ageGroup={featuredArticle.ageGroup} />
                    </div>
                    <h3 className={`${h} mt-3 text-3xl font-semibold leading-snug text-slate-900 group-hover:text-[#073c5e] sm:text-4xl`}>{featuredArticle.title}</h3>
                    <p className="mt-3 text-base leading-relaxed text-slate-600">{featuredArticle.excerpt}</p>
                    <p className="mt-6 flex items-center justify-between gap-3 border-t border-slate-300 pt-4 text-sm">
                      <span className="text-slate-500">{formatDate(featuredArticle.createdAt)}</span>
                      <span className="inline-flex items-center gap-1.5 font-semibold text-[#073c5e]">
                        อ่านบทความ
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </p>
                  </div>
                </Link>
              )}

              {restArticles.length > 0 && (
                <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                  {restArticles.map((article) => (
                    <Link key={article.id} href={`/training-centre/${article.id}`} className="group flex flex-col">
                      <div className="relative aspect-16/10 overflow-hidden rounded-lg bg-[#073c5e]">
                        {article.coverImageUrl ? (
                          <Image
                            src={article.coverImageUrl}
                            alt={article.title}
                            fill
                            sizes="(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <span className={`${h} absolute bottom-3 left-4 text-xl font-semibold text-white/90`}>{labelFor(TRAINING_CENTRE_AREAS, article.area)}</span>
                        )}
                      </div>
                      <div className="mt-4">
                        <Meta area={article.area} theme={article.theme} ageGroup={article.ageGroup} />
                      </div>
                      <h3 className={`${h} mt-2 text-xl font-semibold leading-snug text-slate-900 group-hover:text-[#073c5e]`}>{article.title}</h3>
                      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">{article.excerpt}</p>
                      <p className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-500">{formatDate(article.createdAt)}</p>
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
