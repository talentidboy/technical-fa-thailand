import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { TRAINING_CENTRE_AREAS, labelFor } from "@/lib/constants";
import { LOGO_URL } from "@/lib/brand";
import { ArrowLeft, Calendar, Database } from "lucide-react";

export default async function TrainingArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const article = await prisma.trainingArticle.findUnique({
    where: { id: Number(id) },
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
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-indigo-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <Link href="/training-centre" className="flex items-center gap-2">
            <Image
              src={LOGO_URL}
              alt="FA Thailand"
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-cover"
            />
            <p className="text-sm font-bold text-white">
              FA Thailand Technical
            </p>
          </Link>
          <Link
            href="/training-centre"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับหน้า Training Centre
          </Link>
        </div>
      </header>

      {/* Cover banner */}
      <section className="relative overflow-hidden">
        {article.coverImageUrl ? (
          <div className="relative h-64 w-full sm:h-96">
            <Image
              src={article.coverImageUrl}
              alt={article.title}
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-indigo-950/90 via-indigo-950/30 to-transparent" />
          </div>
        ) : (
          <div className="relative flex h-56 w-full items-center justify-center bg-linear-to-br from-indigo-700 via-indigo-800 to-indigo-950 sm:h-72">
            <Database className="h-12 w-12 text-amber-300/60" />
            <div className="absolute inset-0 bg-linear-to-t from-indigo-950/80 via-transparent to-transparent" />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-4xl px-6 pb-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-indigo-950">
                {labelFor(TRAINING_CENTRE_AREAS, article.area)}
              </span>
              {article.theme && (
                <span className="inline-flex rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white ring-1 ring-white/20 backdrop-blur-sm">
                  {article.theme}
                </span>
              )}
              {article.ageGroup && (
                <span className="inline-flex rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white ring-1 ring-white/20 backdrop-blur-sm">
                  {article.ageGroup}
                </span>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white drop-shadow-sm sm:text-4xl">
              {article.title}
            </h1>
            <span className="mt-3 inline-flex items-center gap-1.5 text-sm text-indigo-200">
              <Calendar className="h-3.5 w-3.5" />
              {date}
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-10 lg:grid-cols-[1fr_320px]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          {(article.content || article.excerpt)
            .split(/\n\s*\n/)
            .map((paragraph, index) => (
              <p
                key={index}
                className={`whitespace-pre-line leading-relaxed text-slate-700 ${
                  index === 0
                    ? "text-lg font-medium text-slate-800"
                    : "mt-5 text-base"
                }`}
              >
                {paragraph}
              </p>
            ))}
        </article>

        <aside className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            <Database className="h-4 w-4" />
            บทความอื่นๆ
          </h2>
          {otherArticles.length === 0 ? (
            <p className="text-sm text-slate-400">ยังไม่มีบทความอื่น</p>
          ) : (
            <div className="space-y-3">
              {otherArticles.map((item) => (
                <Link
                  key={item.id}
                  href={`/training-centre/${item.id}`}
                  className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  {item.coverImageUrl ? (
                    <Image
                      src={item.coverImageUrl}
                      alt={item.title}
                      width={56}
                      height={56}
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-400">
                      <Database className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-900 group-hover:text-indigo-700">
                      {item.title}
                    </p>
                    <p className="mt-1 inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                      {labelFor(TRAINING_CENTRE_AREAS, item.area)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
