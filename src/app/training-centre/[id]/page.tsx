import Link from "next/link";
import { parseId } from "@/lib/route-id";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { TRAINING_CENTRE_AREAS, labelFor } from "@/lib/constants";
import { ArrowLeft, Calendar } from "lucide-react";
import { display } from "@/components/fonts";
import { ModuleHeader } from "@/components/ModuleHeader";

export default async function TrainingArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

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
  });

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f5f4f0] text-slate-900">
      <ModuleHeader
        title="Training Centre"
        subtitle="ศูนย์ข้อมูลการฝึกสอน · FA Thailand"
        accent="#b45309"
        actions={
          <Link
            href="/training-centre"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">กลับหน้า Training Centre</span>
          </Link>
        }
      />

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:pt-14">
        {/* หัวบทความ */}
        <header className="max-w-3xl">
          <p className="flex flex-wrap items-center gap-x-2 text-sm text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">{labelFor(TRAINING_CENTRE_AREAS, article.area)}</span>
            {article.theme && <span>· {article.theme}</span>}
            {article.ageGroup && <span>· {article.ageGroup}</span>}
          </p>
          <h1 className={`${display.className} mt-4 text-4xl font-semibold leading-tight text-[#073c5e] sm:text-5xl`}>{article.title}</h1>
          <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            {date}
          </p>
        </header>

        {article.coverImageUrl && (
          <div className="relative mt-8 aspect-video overflow-hidden rounded-xl bg-slate-200">
            <Image src={article.coverImageUrl} alt={article.title} fill priority sizes="(min-width: 1152px) 72rem, 100vw" className="object-cover" />
          </div>
        )}

        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
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
            <h2 className="border-b border-slate-300 pb-3 text-sm font-semibold text-slate-500">บทความอื่นๆ</h2>
            {otherArticles.length === 0 ? (
              <p className="pt-4 text-sm text-slate-400">ยังไม่มีบทความอื่น</p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {otherArticles.map((item) => (
                  <li key={item.id}>
                    <Link href={`/training-centre/${item.id}`} className="group flex items-start gap-3 py-4">
                      {item.coverImageUrl ? (
                        <Image src={item.coverImageUrl} alt={item.title} width={56} height={56} className="h-14 w-14 shrink-0 rounded-md object-cover" />
                      ) : (
                        <span className="h-14 w-14 shrink-0 rounded-md bg-[#073c5e]" />
                      )}
                      <span className="min-w-0">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">{labelFor(TRAINING_CENTRE_AREAS, item.area)}</span>
                        <span className="mt-0.5 block text-sm font-medium leading-snug text-slate-900 group-hover:text-[#073c5e]">{item.title}</span>
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
  );
}
