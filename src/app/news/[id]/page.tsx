import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LOGO_URL } from "@/lib/brand";
import { isFacebookUrl } from "@/lib/facebook";
import { FacebookEmbed } from "@/components/FacebookEmbed";
import { ArrowLeft, Calendar, Megaphone, ExternalLink } from "lucide-react";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const announcement = await prisma.announcement.findUnique({
    where: { id: Number(id) },
    include: { author: true },
  });

  if (!announcement) notFound();

  // ระบุปฏิทินเป็นเกรกอเรียนตรงๆ (-u-ca-gregory) เพราะ th-TH ปกติจะแปลงปีเป็นพุทธศักราชอัตโนมัติ (เช่น 2569 แทน 2026)
  const date = announcement.createdAt.toLocaleDateString("th-TH-u-ca-gregory", {
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

      {/* Hero — รูปเต็มความกว้าง พร้อมไล่สีคลุมด้านล่างเพื่อวางแท็ก/วันที่/หัวข้อทับได้ */}
      <div className="relative h-64 w-full overflow-hidden sm:h-96">
        {announcement.imageUrl ? (
          <Image
            src={announcement.imageUrl}
            alt={announcement.title}
            fill
            priority
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-indigo-700 via-indigo-800 to-indigo-950" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-indigo-950/95 via-indigo-950/30 to-indigo-950/10" />
        {!announcement.imageUrl && (
          <Megaphone className="absolute right-8 top-8 h-16 w-16 text-amber-300/30" />
        )}

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-3xl px-6 pb-7 sm:pb-9">
            <div className="flex flex-wrap items-center gap-3">
              {announcement.tag && (
                <span className="inline-flex rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-amber-950">
                  {announcement.tag}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-200">
                <Calendar className="h-3.5 w-3.5" />
                {date}
              </span>
              {announcement.author && (
                <span className="text-xs font-medium text-indigo-300">โดย {announcement.author.email}</span>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-bold text-white drop-shadow-sm sm:text-4xl">
              {announcement.title}
            </h1>
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-6 py-10 sm:py-12">
        <p className="whitespace-pre-line text-base leading-loose text-slate-700">
          {announcement.content || announcement.excerpt}
        </p>

        {announcement.linkUrl && (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {isFacebookUrl(announcement.linkUrl) ? (
              <>
                <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <ExternalLink className="h-4 w-4" />
                  โพสต์ต้นฉบับ
                </p>
                <div className="flex justify-center">
                  <FacebookEmbed url={announcement.linkUrl} />
                </div>
              </>
            ) : (
              <a
                href={announcement.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
              >
                <ExternalLink className="h-4 w-4" />
                ดูลิงก์เพิ่มเติม
              </a>
            )}
          </div>
        )}

        <Link
          href="/#news"
          className="mt-10 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปดูข่าวอื่นๆ
        </Link>
      </article>
    </div>
  );
}
