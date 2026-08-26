import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from "./actions";
import { Field } from "@/components/FormField";
import { ModalTrigger } from "@/components/Modal";
import { LOGO_URL } from "@/lib/brand";
import { Megaphone, Trash2, Plus, ArrowLeft, ImagePlus, Link2, Pencil } from "lucide-react";

function formatDate(date: Date) {
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function AnnouncementFormFields({
  defaultTitle,
  defaultTag,
  defaultLinkUrl,
  defaultExcerpt,
  defaultContent,
  hasImage,
}: {
  defaultTitle?: string;
  defaultTag?: string;
  defaultLinkUrl?: string;
  defaultExcerpt?: string;
  defaultContent?: string;
  hasImage?: boolean;
}) {
  return (
    <>
      <Field
        label="หัวข้อข่าว"
        name="title"
        required
        placeholder="เปิดรับสมัครอบรมผู้ฝึกสอน C License รุ่นที่ 13"
        defaultValue={defaultTitle}
      />
      <Field label="แท็ก" name="tag" placeholder="อบรม / ประกาศผล / ระบบ" defaultValue={defaultTag} />

      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-sm font-medium text-slate-700">ลิงก์ (ถ้ามี)</span>
        <input
          name="linkUrl"
          type="url"
          defaultValue={defaultLinkUrl}
          placeholder="https://www.facebook.com/ชื่อเพจ/posts/... — ถ้าเป็นลิงก์โพสต์เฟซบุ๊ก ระบบจะแสดงโพสต์นั้นให้อัตโนมัติ"
          className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <span className="text-xs text-slate-400">
          ใช้ลิงก์โพสต์จริง (เปิดโพสต์บนคอมพิวเตอร์แล้วคัดลอกลิงก์จากวันที่ใต้โพสต์) — ลิงก์แบบ
          facebook.com/share/... ที่คัดลอกจากมือถือมักฝังโพสต์ไม่ได้
        </span>
      </label>

      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-sm font-medium text-slate-700">รูปภาพประกอบข่าว</span>
        <input
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-600"
        />
        {hasImage && (
          <span className="text-xs text-slate-400">มีรูปอยู่แล้ว — เลือกไฟล์ใหม่เพื่อแทนที่ หรือเว้นว่างไว้เพื่อคงรูปเดิม</span>
        )}
      </label>

      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-sm font-medium text-slate-700">
          รายละเอียดย่อ (แสดงในการ์ดหน้าหลัก)
          <span className="text-red-500"> *</span>
        </span>
        <textarea
          name="excerpt"
          required
          rows={2}
          defaultValue={defaultExcerpt}
          className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </label>

      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-sm font-medium text-slate-700">เนื้อหาข่าวฉบับเต็ม (แสดงในหน้าอ่านข่าว)</span>
        <textarea
          name="content"
          rows={6}
          defaultValue={defaultContent}
          placeholder="หากไม่กรอก จะใช้รายละเอียดย่อแสดงในหน้าอ่านข่าวแทน"
          className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </label>
    </>
  );
}

export default async function AnnouncementsPage() {
  const currentUser = await getCurrentUser();
  if (
    !currentUser ||
    (currentUser.role !== "ADMIN" && currentUser.role !== "STAFF")
  ) {
    redirect("/");
  }

  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: true },
  });

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
                จัดการข่าวประกาศหน้าหลัก
              </p>
            </div>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับหน้าแรก
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ข่าวประกาศ</h1>
          <p className="mt-1 text-sm text-slate-500">
            จัดการข่าวประกาศที่แสดงบนหน้าหลักสาธารณะ ของ FA Thailand Technical
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Megaphone className="h-4 w-4" />
            </div>
            <h2 className="font-semibold text-slate-900">เพิ่มข่าวประกาศใหม่</h2>
          </div>
          <form
            action={createAnnouncement}
            className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2"
          >
            <AnnouncementFormFields />

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                เพิ่มข่าวประกาศ
              </button>
            </div>
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {announcements.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-slate-400">
              ยังไม่มีข่าวประกาศ
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {announcements.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-4 px-6 py-5"
                >
                  <div className="flex items-start gap-4">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
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
                        {item.tag && (
                          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
                            {item.tag}
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
                  <div className="flex flex-none items-center gap-1">
                    {item.linkUrl && (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="เปิดลิงก์"
                        title={item.linkUrl}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <Link2 className="h-4 w-4" />
                      </a>
                    )}
                    <ModalTrigger
                      label={`แก้ไขข่าวประกาศ: ${item.title}`}
                      buttonContent={<Pencil className="h-4 w-4" />}
                      buttonClassName="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <form
                        action={updateAnnouncement}
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                      >
                        <input type="hidden" name="id" value={item.id} />
                        <AnnouncementFormFields
                          defaultTitle={item.title}
                          defaultTag={item.tag ?? ""}
                          defaultLinkUrl={item.linkUrl ?? ""}
                          defaultExcerpt={item.excerpt}
                          defaultContent={item.content}
                          hasImage={!!item.imageUrl}
                        />
                        <div className="sm:col-span-2">
                          <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
                          >
                            บันทึกการแก้ไข
                          </button>
                        </div>
                      </form>
                    </ModalTrigger>
                    <form action={deleteAnnouncement}>
                      <input type="hidden" name="id" value={item.id} />
                      <button
                        type="submit"
                        aria-label="ลบข่าวประกาศ"
                        className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
