import Link from "next/link";
import { parseId } from "@/lib/route-id";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TRAINING_CENTRE_AREAS, labelFor } from "@/lib/constants";
import { markerFont, trainingFont } from "@/components/typefaces/training";
import { TrainingHeader } from "@/components/training/TrainingHeader";
import { ArrowLeft, Calendar } from "lucide-react";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  const a = id ? await prisma.trainingArticle.findUnique({ where: { id }, select: { id: true, title: true, excerpt: true, coverImageUrl: true } }) : null;
  if (!a) return { title: "ไม่พบบทความ" };
  return pageMeta({ title: a.title, description: a.excerpt, path: `/training-centre/${a.id}`, image: a.coverImageUrl });
}

// สีปากกาประจำหมวด (ตรงกับแฟ้มในหน้าศูนย์ข้อมูลและบทความ)
const AREA_COLOR: Record<string, string> = { THE_GAME: "#1d4ed8", PRACTICE: "#dc2626", ENVIRONMENT: "#15803d" };

export default async function TrainingArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await prisma.trainingArticle.findUnique({
    where: { id: parseId(id) ?? 0 },
  });

  if (!article) notFound();

  const otherArticles = await prisma.trainingArticle.findMany({
    where: { id: { not: article.id } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const date = article.createdAt.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Bangkok",
  });
  const color = AREA_COLOR[article.area] ?? "#111827";

  return (
    <div className={`${trainingFont.className} min-h-screen overflow-x-clip bg-[#eceff2] text-slate-900`}>
      <TrainingHeader
        actions={
          <Link href="/training-centre" className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-white">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">กลับหน้าศูนย์ข้อมูลและบทความ</span>
          </Link>
        }
      />

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:pt-14">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <span className="block h-2" style={{ background: color }} />
          {/* หัวบทความ */}
          <header className="px-6 pt-8 sm:px-10 sm:pt-10">
            <p className="flex flex-wrap items-center gap-x-2 text-sm text-slate-500">
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em]" style={{ color }}>
                {labelFor(TRAINING_CENTRE_AREAS, article.area)}
              </span>
              {article.theme && <span>· {article.theme}</span>}
              {article.ageGroup && <span>· {article.ageGroup}</span>}
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight text-[#111827] sm:text-5xl">{article.title}</h1>
            <p className="mt-4 inline-flex items-center gap-1.5 font-mono text-sm text-slate-500">
              <Calendar className="h-3.5 w-3.5" />
              {date}
            </p>
          </header>

          {article.coverImageUrl && (
            <div className="relative mx-6 mt-8 aspect-video overflow-hidden rounded-xl bg-slate-200 sm:mx-10">
              <Image src={article.coverImageUrl} alt={article.title} fill priority sizes="(min-width: 1152px) 68rem, 100vw" className="object-cover" />
            </div>
          )}

          <div className="grid grid-cols-1 gap-12 px-6 pb-10 pt-10 sm:px-10 lg:grid-cols-[minmax(0,1fr)_17rem]">
            <article className="max-w-3xl">
              {(article.content || article.excerpt).split(/\n\s*\n/).map((paragraph, index) => (
                <p
                  key={index}
                  className={`whitespace-pre-line leading-relaxed ${index === 0 ? "text-xl font-medium text-slate-800" : "mt-6 text-[1.05rem] text-slate-700"}`}
                >
                  {paragraph}
                </p>
              ))}
            </article>

            <aside>
              <h2 className={`${markerFont.className} -rotate-1 text-2xl text-[#dc2626]`}>บทความอื่นๆ</h2>
              {otherArticles.length === 0 ? (
                <p className="pt-3 text-sm text-slate-400">ยังไม่มีบทความอื่น</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {otherArticles.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/training-centre/${item.id}`}
                        className="group flex items-start gap-3 rounded-lg border-l-4 bg-[#f6f7f9] p-3 transition-colors hover:bg-[#eef1f5]"
                        style={{ borderColor: AREA_COLOR[item.area] ?? "#111827" }}
                      >
                        {item.coverImageUrl && <Image src={item.coverImageUrl} alt={item.title} width={56} height={56} className="h-14 w-14 shrink-0 rounded-md object-cover" />}
                        <span className="min-w-0">
                          <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: AREA_COLOR[item.area] ?? "#111827" }}>
                            {labelFor(TRAINING_CENTRE_AREAS, item.area)}
                          </span>
                          <span className="mt-0.5 block text-sm font-semibold leading-snug text-slate-900">{item.title}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
