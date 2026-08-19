import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { TRAINING_CENTRE_AREAS, labelFor } from "@/lib/constants";
import { LOGO_URL } from "@/lib/brand";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Database,
  Settings,
  LayoutGrid,
  Target,
  Dumbbell,
  Globe2,
  Megaphone as ArticleIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const AREA_ICONS: Record<string, LucideIcon> = {
  THE_GAME: Target,
  PRACTICE: Dumbbell,
  ENVIRONMENT: Globe2,
};

function formatDate(date: Date) {
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function TrainingCentrePage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { area } = await searchParams;
  const activeArea = TRAINING_CENTRE_AREAS.some((a) => a.value === area)
    ? area
    : undefined;

  const [articles, totalCount] = await Promise.all([
    prisma.trainingArticle.findMany({
      where: activeArea ? { area: activeArea } : undefined,
      orderBy: { createdAt: "desc" },
    }),
    prisma.trainingArticle.count(),
  ]);

  const [featuredArticle, ...restArticles] = articles;
  const canManage = user.role === "ADMIN" || user.role === "STAFF";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-indigo-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={LOGO_URL}
              alt="FA Thailand"
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-cover"
            />
            <div>
              <p className="text-sm font-bold text-white">
                FA Thailand Technical
              </p>
              <p className="text-[11px] text-indigo-300">
                หมวด: Training Centre
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {canManage && (
              <Link
                href="/training-centre/manage"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Settings className="h-4 w-4" />
                จัดการบทความ
              </Link>
            )}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              กลับหน้าแรก
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-indigo-950 via-indigo-900 to-indigo-700">
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-600 via-amber-400 to-amber-600" />
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-indigo-400/30 blur-3xl" />
        <div className="absolute -right-16 top-1/3 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative mx-auto max-w-4xl px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Database className="h-7 w-7 text-amber-300" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Training Centre
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-indigo-200">
            ศูนย์รวบรวมข้อมูลและบทความวิเคราะห์ด้านเทคนิคและการฝึกอบรมของ
            ฝ่ายเทคนิค สมาคมกีฬาฟุตบอลแห่งประเทศไทย
          </p>

          <div className="mx-auto mt-8 grid max-w-xs grid-cols-2 gap-4 border-t border-amber-400/20 pt-6">
            <div>
              <p className="text-2xl font-bold text-amber-400">{totalCount}</p>
              <p className="text-xs text-indigo-300">บทความทั้งหมด</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">
                {TRAINING_CENTRE_AREAS.length}
              </p>
              <p className="text-xs text-indigo-300">หมวด Area</p>
            </div>
          </div>
        </div>

        <svg
          className="relative block w-full text-slate-50"
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
        >
          <path fill="currentColor" d="M0,32 C480,72 960,0 1440,32 L1440,60 L0,60 Z" />
        </svg>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-16">
        {/* Area filter tabs */}
        <div className="-mt-4 mb-10 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <Link
            href="/training-centre"
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              !activeArea
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            ทั้งหมด
          </Link>
          {TRAINING_CENTRE_AREAS.map((a) => {
            const AreaIcon = AREA_ICONS[a.value] ?? LayoutGrid;
            return (
              <Link
                key={a.value}
                href={`/training-centre?area=${a.value}`}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  activeArea === a.value
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <AreaIcon className="h-3.5 w-3.5" />
                {a.label}
              </Link>
            );
          })}
        </div>

        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
            <ArticleIcon className="h-8 w-8 text-slate-300" />
            <p className="font-medium text-slate-500">ยังไม่มีบทความในหมวดนี้</p>
            <p className="text-sm text-slate-400">
              อยู่ระหว่างการพัฒนา เร็วๆ นี้จะมีบทความวิเคราะห์เทคนิคเพิ่มเติม
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Featured article */}
            {featuredArticle && (
              <Link
                href={`/training-centre/${featuredArticle.id}`}
                className="group grid grid-cols-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-indigo-900/10 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-900/15 lg:grid-cols-2"
              >
                <div className="relative h-56 overflow-hidden lg:h-full">
                  {featuredArticle.coverImageUrl ? (
                    <Image
                      src={featuredArticle.coverImageUrl}
                      alt={featuredArticle.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-linear-to-br from-indigo-700 via-indigo-800 to-indigo-950" />
                  )}
                  <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-indigo-950">
                    บทความล่าสุด
                  </span>
                </div>
                <div className="flex flex-col justify-center p-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
                      {labelFor(TRAINING_CENTRE_AREAS, featuredArticle.area)}
                    </span>
                    {featuredArticle.theme && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        {featuredArticle.theme}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 text-xl font-bold text-slate-900 group-hover:text-indigo-700 sm:text-2xl">
                    {featuredArticle.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {featuredArticle.excerpt}
                  </p>
                  <div className="mt-5 flex items-center gap-1.5 border-t border-slate-100 pt-4 text-xs text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(featuredArticle.createdAt)}
                    {featuredArticle.ageGroup && ` · ${featuredArticle.ageGroup}`}
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 group-hover:gap-2.5">
                    อ่านบทความ
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            )}

            {restArticles.length > 0 && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {restArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/training-centre/${article.id}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="relative h-36 overflow-hidden">
                      {article.coverImageUrl ? (
                        <Image
                          src={article.coverImageUrl}
                          alt={article.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-linear-to-br from-indigo-600 to-indigo-900" />
                      )}
                      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-indigo-950/80 px-2.5 py-1 text-xs font-medium text-amber-300 backdrop-blur-sm">
                          {labelFor(TRAINING_CENTRE_AREAS, article.area)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      {article.theme && (
                        <span className="inline-flex w-fit rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
                          {article.theme}
                        </span>
                      )}
                      <h3 className="mt-3 font-semibold text-slate-900 group-hover:text-indigo-700">
                        {article.title}
                      </h3>
                      <p className="mt-2 flex-1 text-sm text-slate-500">
                        {article.excerpt}
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(article.createdAt)}
                          {article.ageGroup && ` · ${article.ageGroup}`}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-indigo-400 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
