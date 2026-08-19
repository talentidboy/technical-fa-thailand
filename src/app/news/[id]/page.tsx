import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LOGO_URL } from "@/lib/brand";
import { ArrowLeft, Calendar, Megaphone } from "lucide-react";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const announcement = await prisma.announcement.findUnique({
    where: { id: Number(id) },
  });

  if (!announcement) notFound();

  const date = announcement.createdAt.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-indigo-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
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
            href="/#news"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับหน้าข่าว
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-10">
        {announcement.imageUrl ? (
          <div className="relative h-56 w-full overflow-hidden rounded-2xl sm:h-80">
            <Image
              src={announcement.imageUrl}
              alt={announcement.title}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex h-40 w-full items-center justify-center rounded-2xl bg-linear-to-br from-indigo-600 to-indigo-900">
            <Megaphone className="h-10 w-10 text-amber-300" />
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          {announcement.tag && (
            <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
              {announcement.tag}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="h-3.5 w-3.5" />
            {date}
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
          {announcement.title}
        </h1>

        <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-slate-700">
          {announcement.content || announcement.excerpt}
        </p>
      </article>
    </div>
  );
}
