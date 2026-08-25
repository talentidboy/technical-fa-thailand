import Link from "next/link";
import Image from "next/image";
import { Calendar, Megaphone, ArrowRight } from "lucide-react";

export type NewsItem = {
  id: number;
  title: string;
  excerpt: string;
  tag: string | null;
  date: string;
  imageUrl: string | null;
};

function NewsThumb({ item }: { item: NewsItem }) {
  return item.imageUrl ? (
    <Image
      src={item.imageUrl}
      alt={item.title}
      fill
      className="object-cover transition-transform duration-300 group-hover:scale-105"
    />
  ) : (
    <div className="h-full w-full bg-linear-to-br from-indigo-500 to-indigo-700" />
  );
}

export function NewsSection({ items }: { items: NewsItem[] }) {
  const [featured, ...rest] = items;
  const sideItems = rest.slice(0, 3);
  const moreItems = rest.slice(3);

  return (
    <section id="news" className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex items-center gap-2">
        <Megaphone className="h-5 w-5 text-indigo-600" />
        <h2 className="text-xl font-bold text-slate-900">ข่าวประกาศ</h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        ความเคลื่อนไหวและประกาศล่าสุดจากศูนย์พัฒนาผู้ฝึกสอน
      </p>

      {!featured ? (
        <p className="mt-8 text-sm text-slate-400">ยังไม่มีข่าวประกาศ</p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Link
              href={`/news/${featured.id}`}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg lg:col-span-2 lg:flex-row"
            >
              <div className="relative h-52 flex-none overflow-hidden lg:h-auto lg:w-1/2">
                <NewsThumb item={featured} />
                <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-amber-950">
                  ล่าสุด
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-center p-6 lg:p-8">
                {featured.tag && (
                  <span className="inline-flex w-fit rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
                    {featured.tag}
                  </span>
                )}
                <h3 className="mt-3 text-lg font-bold text-slate-900 group-hover:text-indigo-700 sm:text-xl">
                  {featured.title}
                </h3>
                <p className="mt-2 text-sm text-slate-500">{featured.excerpt}</p>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    {featured.date}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-medium text-indigo-600 group-hover:gap-1.5">
                    อ่านต่อ
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>

            <div className="flex flex-col gap-3.5">
              {sideItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.id}`}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="relative h-16 w-16 flex-none overflow-hidden rounded-xl">
                    <NewsThumb item={item} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-semibold text-slate-900 group-hover:text-indigo-700">
                      {item.title}
                    </h4>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="h-3 w-3" />
                      {item.date}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {moreItems.length > 0 && (
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {moreItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="relative h-32 overflow-hidden">
                    <NewsThumb item={item} />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    {item.tag && (
                      <span className="inline-flex w-fit rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
                        {item.tag}
                      </span>
                    )}
                    <h3 className="mt-3 font-semibold text-slate-900 group-hover:text-indigo-700">
                      {item.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm text-slate-500">{item.excerpt}</p>
                    <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {item.date}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
