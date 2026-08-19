import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createTrainingArticle, deleteTrainingArticle } from "./actions";
import { Field, SelectField } from "@/components/FormField";
import { TRAINING_CENTRE_AREAS, labelFor } from "@/lib/constants";
import { LOGO_URL } from "@/lib/brand";
import { Database, Trash2, Plus, ArrowLeft, ImagePlus } from "lucide-react";

function formatDate(date: Date) {
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function TrainingCentreManagePage() {
  const currentUser = await getCurrentUser();
  if (
    !currentUser ||
    (currentUser.role !== "ADMIN" && currentUser.role !== "STAFF")
  ) {
    redirect("/training-centre");
  }

  const articles = await prisma.trainingArticle.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: true },
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
            <div>
              <p className="text-sm font-bold text-white">
                FA Thailand Technical
              </p>
              <p className="text-[11px] text-indigo-300">
                จัดการบทความ Training Centre
              </p>
            </div>
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

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            จัดการบทความ Training Centre
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            เพิ่มบทความวิเคราะห์เทคนิคและแนวทางการฝึกสอน แบ่งตามหมวด The Game /
            Practice / Environment
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Database className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-slate-900">เพิ่มบทความใหม่</h2>
          </div>
          <form
            action={createTrainingArticle}
            className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2"
          >
            <Field
              label="หัวข้อบทความ"
              name="title"
              required
              placeholder="Japan v. Sweden: Adapting attacking strategies mid-game"
            />
            <SelectField
              label="หมวด Area"
              name="area"
              options={TRAINING_CENTRE_AREAS}
              required
            />
            <Field label="ธีม / แท็ก" name="theme" placeholder="Possession / Transitions / Goalkeeping" />
            <Field label="กลุ่มอายุ" name="ageGroup" placeholder="U13-U15 / Senior / ทุกระดับ" />

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                รูปภาพหน้าปก
              </span>
              <input
                name="coverImage"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-600"
              />
            </label>

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                รายละเอียดย่อ (แสดงในการ์ด)
                <span className="text-red-500"> *</span>
              </span>
              <textarea
                name="excerpt"
                required
                rows={2}
                className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                เนื้อหาบทความฉบับเต็ม
              </span>
              <textarea
                name="content"
                rows={8}
                placeholder="หากไม่กรอก จะใช้รายละเอียดย่อแสดงในหน้าอ่านบทความแทน"
                className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                เพิ่มบทความ
              </button>
            </div>
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {articles.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-slate-400">
              ยังไม่มีบทความ
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {articles.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-4 px-6 py-5"
                >
                  <div className="flex items-start gap-4">
                    {item.coverImageUrl ? (
                      <Image
                        src={item.coverImageUrl}
                        alt={item.title}
                        width={64}
                        height={64}
                        className="h-16 w-16 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-400">
                        <ImagePlus className="h-6 w-6" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
                          {labelFor(TRAINING_CENTRE_AREAS, item.area)}
                        </span>
                        {item.theme && (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                            {item.theme}
                          </span>
                        )}
                        <p className="font-medium text-slate-900">
                          {item.title}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.excerpt}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        {formatDate(item.createdAt)}
                        {item.author && ` · โดย ${item.author.email}`}
                      </p>
                    </div>
                  </div>
                  <form action={deleteTrainingArticle}>
                    <input type="hidden" name="id" value={item.id} />
                    <button
                      type="submit"
                      aria-label="ลบบทความ"
                      className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
