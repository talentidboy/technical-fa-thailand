import Link from "next/link";
import Image from "next/image";
import { Calendar, Megaphone } from "lucide-react";

export type NewsItem = {
  id: number;
  title: string;
  excerpt: string;
  tag: string | null;
  date: string;
  imageUrl: string | null;
};

export function NewsSection({ items }: { items: NewsItem[] }) {
  return (
    <section id="news" className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex items-center gap-2">
        <Megaphone className="h-5 w-5 text-indigo-600" />
        <h2 className="text-xl font-bold text-slate-900">ข่าวประกาศ</h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        ความเคลื่อนไหวและประกาศล่าสุดจากศูนย์พัฒนาผู้ฝึกสอน
      </p>

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-slate-400">ยังไม่มีข่าวประกาศ</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/news/${item.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative h-32 overflow-hidden">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-linear-to-br from-indigo-500 to-indigo-700" />
                )}
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
                <p className="mt-2 flex-1 text-sm text-slate-500">
                  {item.excerpt}
                </p>
                <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  {item.date}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
