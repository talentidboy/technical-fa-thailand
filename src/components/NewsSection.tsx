import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Megaphone } from "lucide-react";
import { display } from "@/components/fonts";

export type NewsItem = {
  id: number;
  title: string;
  excerpt: string;
  tag: string | null;
  date: string;
  imageUrl: string | null;
};

function NewsThumb({ item, sizes }: { item: NewsItem; sizes: string }) {
  return item.imageUrl ? (
    <Image src={item.imageUrl} alt={item.title} fill sizes={sizes} className="object-cover transition-transform duration-500 group-hover:scale-105" />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-[#073c5e]">
      <Megaphone className="h-8 w-8 text-white/30" />
    </div>
  );
}

// ข่าวประกาศหน้าแรก: ข่าวเด่น 1 ข่าว (ภาพใหญ่) + รายการข่าวถัดไป
export function NewsSection({ items }: { items: NewsItem[] }) {
  const [lead, ...rest] = items;

  return (
    <section id="news" className="scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700">News</p>
        <h2 className={`${display.className} mt-2 text-4xl font-semibold tracking-tight text-[#073c5e] sm:text-5xl`}>ข่าวประกาศ</h2>

        {!lead ? (
          <p className="mt-8 text-sm text-slate-400">ยังไม่มีข่าวประกาศ</p>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Link href={`/news/${lead.id}`} className="group block">
              <div className="relative aspect-16/10 overflow-hidden rounded-xl bg-slate-200">
                <NewsThumb item={lead} sizes="(min-width: 1024px) 60vw, 100vw" />
              </div>
              <p className="mt-5 flex items-center gap-2 text-xs text-slate-500">
                {lead.tag && <span className="font-semibold uppercase tracking-wider text-amber-700">{lead.tag}</span>}
                {lead.tag && <span className="h-3 w-px bg-slate-300" />}
                {lead.date}
              </p>
              <h3 className={`${display.className} mt-2 text-2xl font-semibold leading-snug text-slate-900 group-hover:text-[#073c5e] sm:text-3xl`}>{lead.title}</h3>
              <p className="mt-2 line-clamp-3 text-slate-600">{lead.excerpt}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#073c5e]">
                อ่านต่อ
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            <div className="border-t-2 border-[#073c5e]">
              {rest.length === 0 ? (
                <p className="py-6 text-sm text-slate-400">ข่าวถัดไปจะแสดงที่นี่</p>
              ) : (
                <ul className="divide-y divide-slate-200">
                  {rest.map((item) => (
                    <li key={item.id}>
                      <Link href={`/news/${item.id}`} className="group flex gap-4 py-5">
                        <div className="relative h-20 w-28 flex-none overflow-hidden rounded-lg bg-slate-200">
                          <NewsThumb item={item} sizes="112px" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-slate-500">
                            {item.tag && <span className="mr-2 font-semibold text-amber-700">{item.tag}</span>}
                            {item.date}
                          </p>
                          <h4 className="mt-1 line-clamp-2 font-semibold leading-snug text-slate-900 group-hover:text-[#073c5e]">{item.title}</h4>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
