import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { PlayAndLearnCenter, PlayAndLearnItem } from "@/generated/prisma/client";
import {
  createCenter,
  updateCenter,
  deleteCenter,
  saveSettings,
  createItem,
  updateItem,
  deleteItem,
  togglePublished,
  moveItem,
  importDefaultPassport,
} from "./actions";
import { Field } from "@/components/FormField";
import { PlForm } from "@/components/play-and-learn/PlForm";
import { PhotoUploader } from "@/components/play-and-learn/PhotoUploader";
import { PassportIcon } from "@/components/play-and-learn/PassportIcon";
import { PassportScene } from "@/components/play-and-learn/PassportScene";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import {
  PL_KINDS,
  PL_SETTING_DEFAULTS,
  PASSPORT_ICONS,
  DEFAULT_PASSPORT,
  isRequired,
  loadPlSettings,
  bangkokDay,
  thaiDate,
  sortEvents,
  type PlField,
  type PlKind,
} from "@/lib/play-and-learn";
import {
  Plus,
  Trash2,
  Save,
  MapPin,
  ExternalLink,
  FileText,
  BookOpen,
  CalendarHeart,
  Images,
  Clapperboard,
  CircleHelp,
  Quote,
  Handshake,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Pencil,
  Download,
} from "lucide-react";
import { AdminFrame } from "@/components/admin/AdminFrame";

const inputClass =
  "rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";
const fileClass =
  "rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white";
const iconButton = "inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900";

const TABS = [
  { key: "general", label: "ข้อความทั่วไป", icon: FileText, nav: "file" },
  { key: "centers", label: "ศูนย์ฝึก", icon: MapPin, nav: "pin" },
  { key: "PASSPORT", label: "พาสปอร์ต", icon: BookOpen, nav: "book" },
  { key: "EVENT", label: "กิจกรรม / ข่าวสาร", icon: CalendarHeart, nav: "calendarHeart" },
  { key: "PHOTO", label: "แกลเลอรี", icon: Images, nav: "images" },
  { key: "VIDEO", label: "วิดีโอ", icon: Clapperboard, nav: "clapper" },
  { key: "FAQ", label: "คำถามที่พบบ่อย", icon: CircleHelp, nav: "help" },
  { key: "TESTIMONIAL", label: "เสียงจากผู้ปกครอง", icon: Quote, nav: "quote" },
  { key: "PARTNER", label: "พาร์ทเนอร์", icon: Handshake, nav: "handshake" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const isKind = (tab: Tab): tab is PlKind => tab in PL_KINDS;

export default async function PlayAndLearnManagePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    redirect("/play-and-learn");
  }
  const { tab: rawTab } = await searchParams;
  const tab: Tab = TABS.find((t) => t.key === rawTab)?.key ?? "general";

  const [kindCounts, centerCount] = await Promise.all([
    prisma.playAndLearnItem.groupBy({ by: ["kind"], _count: { _all: true } }),
    prisma.playAndLearnCenter.count(),
  ]);
  const count = (key: Tab) =>
    key === "centers" ? centerCount : key === "general" ? null : (kindCounts.find((k) => k.kind === key)?._count._all ?? 0);

  return (
    <AdminFrame
      area="play"
      title="Play and Learn"
      user={user}
      publicHref="/play-and-learn"
      publicLabel="ดูหน้า Play and Learn"
      items={TABS.map(({ key, label, nav }) => ({ href: `/play-and-learn/manage?tab=${key}`, label, icon: nav, badge: count(key), active: key === tab }))}
    >
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div>
          <p className="text-sm font-semibold text-pink-600">จัดการหน้า Play and Learn</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{TABS.find((t) => t.key === tab)?.label}</h1>
          <p className="mt-1 text-sm text-slate-500">
            เลือกหมวดจากแถบซ้าย · บันทึกแล้วแสดงผลทันที · หมวดที่ยังไม่มีรายการ (หรือซ่อนไว้ทั้งหมด) จะไม่แสดงบนหน้าเว็บ
          </p>
        </div>

        {/* มือถือ: แถบเลือกหมวดเลื่อนแนวนอน (จอใหญ่ใช้แถบซ้าย) */}
        <nav aria-label="หมวดที่จัดการ" className="-mx-6 mt-5 overflow-x-auto px-6 pb-1 lg:hidden">
          <div className="flex w-max gap-2">
            {TABS.map(({ key, label }) => (
              <Link
                key={key}
                href={`/play-and-learn/manage?tab=${key}`}
                aria-current={key === tab ? "page" : undefined}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${key === tab ? "border-pink-500 bg-pink-500 text-white" : "border-slate-200 bg-white text-slate-600"}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="mt-6">
          {tab === "general" && <SettingsTab />}
          {tab === "centers" && <CentersTab />}
          {isKind(tab) && (tab === "PHOTO" ? <PhotosTab /> : <ItemsTab kind={tab} />)}
        </div>
      </div>
    </div>
    </AdminFrame>
  );
}

function Card({ title, hint, children }: { title: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-3.5">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function TextArea({ label, name, defaultValue, rows = 3, required, hint, placeholder }: { label: string; name: string; defaultValue?: string | null; rows?: number; required?: boolean; hint?: string; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1.5 sm:col-span-2">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <textarea name={name} rows={rows} required={required} defaultValue={defaultValue ?? ""} placeholder={placeholder} className={inputClass} />
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

function SubmitButton({ children, tone = "pink" }: { children: React.ReactNode; tone?: "pink" | "indigo" }) {
  return (
    <button
      type="submit"
      className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors ${
        tone === "pink" ? "bg-pink-500 shadow-pink-200 hover:bg-pink-600" : "bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700"
      }`}
    >
      {children}
    </button>
  );
}

function ImageInput({ current, required, label = "รูปภาพ" }: { current?: string | null; required?: boolean; label?: string }) {
  return (
    <div className="flex flex-col gap-1.5 sm:col-span-2">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && !current && <span className="text-red-500"> *</span>}
      </span>
      <div className="flex flex-wrap items-center gap-3">
        {current && (
          <span className="relative h-16 w-16 flex-none overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <Image src={current} alt="รูปปัจจุบัน" fill sizes="64px" className="object-cover" />
          </span>
        )}
        <input name="image" type="file" accept="image/jpeg,image/png,image/webp" required={required && !current} className={`${fileClass} min-w-0 flex-1`} />
      </div>
      {current && !required && (
        <label className="flex w-fit items-center gap-2 text-xs text-slate-500">
          <input type="checkbox" name="removeImage" className="h-3.5 w-3.5 rounded border-slate-300" />
          ลบรูปนี้
        </label>
      )}
      {current && <span className="text-xs text-slate-400">เลือกไฟล์ใหม่เพื่อเปลี่ยนรูป · ไม่เลือก = ใช้รูปเดิม</span>}
    </div>
  );
}

// ===================== ข้อความทั่วไป =====================
async function SettingsTab() {
  const s = await loadPlSettings();
  return (
    <PlForm action={saveSettings} className="space-y-6">
      <Card title="ข้อความหลักของหน้า" hint="ปล่อยช่องว่างแล้วบันทึก = กลับไปใช้ข้อความเดิม">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="คำขวัญ (แสดงใต้ภาพหน้าแรก)" name="tagline" defaultValue={s.tagline} placeholder={PL_SETTING_DEFAULTS.tagline} />
          </div>
          <TextArea
            label="แนะนำโครงการ"
            name="intro"
            rows={12}
            defaultValue={s.intro}
            hint="เว้นบรรทัดว่าง 1 บรรทัด = ขึ้นย่อหน้าใหม่ · ครอบข้อความด้วย **ดอกจัน 2 ตัว** = ตัวหนา"
          />
          <TextArea
            label="ตัวเลขเด่น"
            name="facts"
            rows={5}
            defaultValue={s.facts}
            hint="บรรทัดละ 1 รายการ รูปแบบ ตัวเลข|คำอธิบาย เช่น 10|สัปดาห์ต่อหลักสูตร — จำนวนศูนย์ฝึกและจังหวัดนับจากข้อมูลศูนย์ฝึกให้อัตโนมัติ"
          />
          <TextArea label="คำอธิบายหัวข้อศูนย์ฝึก" name="centersIntro" rows={2} defaultValue={s.centersIntro} />
        </div>
      </Card>

      <Card title="ส่วนชวนสมัคร (ท้ายหน้า)">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="หัวข้อ" name="ctaTitle" defaultValue={s.ctaTitle} placeholder={PL_SETTING_DEFAULTS.ctaTitle} />
          </div>
          <TextArea label="ข้อความ" name="ctaText" rows={2} defaultValue={s.ctaText} />
        </div>
      </Card>

      <Card title="ช่องทางติดต่อ" hint="ช่องที่ว่างจะไม่แสดงบนหน้าเว็บ">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="เบอร์โทร" name="contactPhone" defaultValue={s.contactPhone} placeholder="02-xxx-xxxx" />
          <Field label="อีเมล" name="contactEmail" type="email" defaultValue={s.contactEmail} placeholder="playandlearn@..." />
          <Field label="ลิงก์ LINE (Official Account)" name="lineUrl" type="url" defaultValue={s.lineUrl} placeholder="https://lin.ee/..." />
          <Field label="ลิงก์ Facebook" name="facebookUrl" type="url" defaultValue={s.facebookUrl} placeholder="https://facebook.com/..." />
        </div>
      </Card>

      <SubmitButton>
        <Save className="h-4 w-4" />
        บันทึกข้อความทั้งหมด
      </SubmitButton>
    </PlForm>
  );
}

// ===================== ศูนย์ฝึก =====================
function CenterFields({ center }: { center?: PlayAndLearnCenter }) {
  return (
    <>
      <Field label="ชื่อศูนย์ฝึก" name="name" required defaultValue={center?.name} placeholder="CHR Football Academy" />
      <Field label="เบอร์โทร" name="tel" required defaultValue={center?.tel} placeholder="098-426-3341" />
      <Field label="จังหวัด (ไทย)" name="province" required defaultValue={center?.province} placeholder="กรุงเทพมหานคร" />
      <Field label="จังหวัด (English)" name="provinceEn" required defaultValue={center?.provinceEn} placeholder="Bangkok" />
      <TextArea label="ที่อยู่" name="address" required rows={2} defaultValue={center?.address} />
      <TextArea label="โค้ช (1 คนต่อบรรทัด)" name="coaches" rows={2} defaultValue={center?.coaches} placeholder={"นายก ข (ชื่อเล่น)\nนางสาว ค ง (ชื่อเล่น)"} />
      <Field label="ผู้ประสานงาน" name="coordinator" required defaultValue={center?.coordinator} placeholder="คุณบอลลูน" />
      <Field label="ลำดับการแสดง" name="sortOrder" type="number" defaultValue={center ? String(center.sortOrder) : undefined} placeholder="1" />
      <TextArea label="ตารางเวลา (แสดงเป็นป้ายในการ์ด ถ้ามี)" name="schedule" rows={2} defaultValue={center?.schedule} />
      <Field label="ลิงก์รับสมัคร (Google Form) — ว่าง = แสดง “เร็วๆ นี้”" name="registerUrl" type="url" defaultValue={center?.registerUrl ?? ""} placeholder="https://forms.gle/..." />
      <Field label="ลิงก์ Google Maps — ว่าง = ค้นหาจากที่อยู่ให้อัตโนมัติ" name="mapUrl" type="url" defaultValue={center?.mapUrl ?? ""} placeholder="https://maps.app.goo.gl/..." />
      <ImageInput current={center?.imageUrl} label="รูปสนาม / ศูนย์ฝึก" />
    </>
  );
}

async function CentersTab() {
  const centers = await prisma.playAndLearnCenter.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  return (
    <div className="space-y-5">
      <details className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer items-center gap-2 px-6 py-4 text-sm font-semibold text-slate-900">
          <Plus className="h-4 w-4 text-pink-500" />
          เพิ่มศูนย์ฝึกใหม่
        </summary>
        <PlForm action={createCenter} resetOnSuccess successText="เพิ่มศูนย์ฝึกแล้ว" className="grid grid-cols-1 gap-4 border-t border-slate-100 p-6 sm:grid-cols-2">
          <CenterFields />
          <div className="sm:col-span-2">
            <SubmitButton tone="indigo">
              <Plus className="h-4 w-4" />
              เพิ่มศูนย์ฝึก
            </SubmitButton>
          </div>
        </PlForm>
      </details>

      {centers.length === 0 ? (
        <Empty>ยังไม่มีศูนย์ฝึก</Empty>
      ) : (
        centers.map((center) => (
          <div key={center.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 px-6 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <Thumb src={center.imageUrl}>
                  <MapPin className="h-5 w-5 text-pink-400" />
                </Thumb>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{center.name}</p>
                  <p className="text-xs text-slate-500">
                    {center.province} · {center.registerUrl ? "เปิดรับสมัคร" : "ยังไม่มีลิงก์รับสมัคร"}
                  </p>
                </div>
              </div>
              <PlForm action={deleteCenter} quiet>
                <input type="hidden" name="id" value={center.id} />
                <ConfirmSubmit
                  message={`ลบศูนย์ฝึก “${center.name}” ใช่ไหม?`}
                  ariaLabel={`ลบศูนย์ฝึก ${center.name}`}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  ลบ
                </ConfirmSubmit>
              </PlForm>
            </div>
            <details className="border-t border-slate-100">
              <summary className="flex cursor-pointer items-center gap-1.5 px-6 py-2.5 text-xs font-semibold text-indigo-600 hover:bg-slate-50">
                <Pencil className="h-3.5 w-3.5" />
                แก้ไขข้อมูลศูนย์ฝึก
              </summary>
              <PlForm action={updateCenter} className="grid grid-cols-1 gap-4 border-t border-slate-100 p-6 sm:grid-cols-2">
                <input type="hidden" name="id" value={center.id} />
                <CenterFields center={center} />
                <div className="sm:col-span-2">
                  <SubmitButton>
                    <Save className="h-4 w-4" />
                    บันทึกการแก้ไข
                  </SubmitButton>
                </div>
              </PlForm>
            </details>
          </div>
        ))
      )}
    </div>
  );
}

// ===================== เนื้อหาแต่ละประเภท =====================
const WIDE_TITLE: PlKind[] = ["EVENT", "VIDEO", "FAQ", "PASSPORT"];

function ItemFields({ kind, item }: { kind: PlKind; item?: PlayAndLearnItem }) {
  const fields = PL_KINDS[kind].fields as Partial<Record<PlField, string>>;
  const label = (f: PlField) => fields[f]!.replace(" *", "");
  return (
    <>
      {(Object.keys(fields) as PlField[]).map((f) => {
        const required = isRequired(kind, f);
        switch (f) {
          case "title":
            return (
              <div key={f} className={WIDE_TITLE.includes(kind) ? "sm:col-span-2" : ""}>
                <Field label={label(f)} name="title" required={required} defaultValue={item?.title} />
              </div>
            );
          case "body":
            return <TextArea key={f} label={label(f)} name="body" required={required} rows={kind === "FAQ" || kind === "TESTIMONIAL" ? 4 : 3} defaultValue={item?.body} />;
          case "extra":
            if (kind === "PASSPORT") {
              return (
                <label key={f} className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-700">{label(f)}</span>
                  <select name="extra" defaultValue={item?.extra ?? "star"} className={inputClass}>
                    {Object.entries(PASSPORT_ICONS).map(([value, text]) => (
                      <option key={value} value={value}>
                        {text}
                      </option>
                    ))}
                  </select>
                </label>
              );
            }
            return (
              <label key={f} className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">{label(f)}</span>
                <input name="extra" defaultValue={item?.extra ?? ""} list={kind === "PHOTO" ? "pl-albums-edit" : undefined} className={inputClass} />
              </label>
            );
          case "url":
            return (
              <div key={f} className={kind === "PASSPORT" ? "flex flex-col gap-3 sm:col-span-2" : ""}>
                <Field label={label(f)} name="url" type="url" required={required} defaultValue={item?.url ?? ""} placeholder="https://..." />
                {kind === "PASSPORT" && (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700">หรืออัปโหลดไฟล์ PDF ใหม่ (ไม่เกิน 4MB — ใช้แทนลิงก์ด้านบน)</span>
                    <input name="pdf" type="file" accept="application/pdf" className={fileClass} />
                  </label>
                )}
              </div>
            );
          case "date":
            return <Field key={f} label={label(f)} name="date" type="date" defaultValue={item?.date ? bangkokDay(item.date) : undefined} />;
          case "imageUrl":
            return <ImageInput key={f} current={item?.imageUrl} required={required} label={label(f)} />;
        }
      })}
    </>
  );
}

function Thumb({ src, children }: { src?: string | null; children: React.ReactNode }) {
  return (
    <span className="relative flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-xl bg-pink-50">
      {src ? <Image src={src} alt="" fill sizes="48px" className="object-cover" /> : children}
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-400">{children}</p>;
}

function ItemControls({ item, index, total, sortable }: { item: PlayAndLearnItem; index: number; total: number; sortable: boolean }) {
  const name = item.title || PL_KINDS[item.kind as PlKind].label;
  return (
    <div className="flex flex-none items-center gap-0.5">
      {sortable && (
        <>
          <PlForm action={moveItem} quiet>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="dir" value="up" />
            <button type="submit" disabled={index === 0} aria-label={`เลื่อน ${name} ขึ้น`} className={`${iconButton} disabled:opacity-30`}>
              <ChevronUp className="h-4 w-4" />
            </button>
          </PlForm>
          <PlForm action={moveItem} quiet>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="dir" value="down" />
            <button type="submit" disabled={index === total - 1} aria-label={`เลื่อน ${name} ลง`} className={`${iconButton} disabled:opacity-30`}>
              <ChevronDown className="h-4 w-4" />
            </button>
          </PlForm>
        </>
      )}
      <PlForm action={togglePublished} quiet>
        <input type="hidden" name="id" value={item.id} />
        <button type="submit" aria-label={item.published ? `ซ่อน ${name}` : `แสดง ${name}`} title={item.published ? "ซ่อนจากหน้าเว็บ" : "แสดงบนหน้าเว็บ"} className={iconButton}>
          {item.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-amber-500" />}
        </button>
      </PlForm>
      <PlForm action={deleteItem} quiet>
        <input type="hidden" name="id" value={item.id} />
        <ConfirmSubmit message={`ลบ “${name}” ใช่ไหม?`} ariaLabel={`ลบ ${name}`} className={`${iconButton} text-red-400 hover:bg-red-50 hover:text-red-600`}>
          <Trash2 className="h-4 w-4" />
        </ConfirmSubmit>
      </PlForm>
    </div>
  );
}

function itemLines(item: PlayAndLearnItem): [string, string | null] {
  switch (item.kind as PlKind) {
    case "EVENT":
      return [item.title, [item.date ? thaiDate(item.date) : "ไม่ระบุวัน", item.extra].filter(Boolean).join(" · ")];
    case "TESTIMONIAL":
      return [`“${item.body}”`, `— ${[item.title, item.extra].filter(Boolean).join(", ")}`];
    case "PASSPORT":
      return [item.title, item.url ? "มีไฟล์ PDF" : "ยังไม่มีไฟล์"];
    case "FAQ":
    case "VIDEO":
      return [item.title, item.body];
    default:
      return [item.title, item.url];
  }
}

function ItemSummary({ item }: { item: PlayAndLearnItem }) {
  const kind = item.kind as PlKind;
  const KindIcon = TABS.find((t) => t.key === kind)?.icon ?? FileText;
  const [main, sub] = itemLines(item);
  return (
    <div className="flex min-w-0 items-center gap-3">
      {kind === "PASSPORT" ? (
        <span className="relative flex h-12 w-20 flex-none items-center justify-center overflow-hidden rounded-xl">
          <PassportScene name={item.extra} />
          <PassportIcon name={item.extra} className="relative h-5 w-5 text-white drop-shadow" />
        </span>
      ) : (
        <Thumb src={item.imageUrl}>
          <KindIcon className="h-5 w-5 text-pink-400" />
        </Thumb>
      )}
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="truncate">{main}</span>
          {!item.published && <span className="flex-none rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">ซ่อนอยู่</span>}
        </p>
        {sub && <p className="truncate text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

async function ItemsTab({ kind }: { kind: PlKind }) {
  const items = await prisma.playAndLearnItem.findMany({ where: { kind }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  // กิจกรรมเรียงตามวันที่อัตโนมัติ (กำลังจะมาถึงก่อน) — ประเภทอื่นเรียงตามที่แอดมินจัด
  const sortable = kind !== "EVENT";
  const list = sortable ? items : (({ upcoming, past }) => [...upcoming, ...past])(sortEvents(items, bangkokDay(new Date())));
  const { label } = PL_KINDS[kind];

  return (
    <div className="space-y-5">
      {kind === "PASSPORT" && items.length === 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-purple-200 bg-purple-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-purple-900">
            ตอนนี้หน้าเว็บแสดงพาสปอร์ต {DEFAULT_PASSPORT.length} บทเดิมอยู่ — นำเข้ามาเพื่อแก้ไขชื่อบท ไอคอน หรือเปลี่ยนไฟล์ PDF ได้
          </p>
          <PlForm action={importDefaultPassport} successText="นำเข้าแล้ว">
            <button type="submit" className="inline-flex flex-none items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
              <Download className="h-4 w-4" />
              นำเข้า {DEFAULT_PASSPORT.length} บทเดิม
            </button>
          </PlForm>
        </div>
      )}
      {kind === "EVENT" && <p className="text-xs text-slate-500">กิจกรรมเรียงตามวันที่ให้อัตโนมัติ — ที่กำลังจะมาถึงขึ้นก่อน ตามด้วยที่ผ่านมาแล้ว</p>}

      <details open={kind !== "PASSPORT"} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer items-center gap-2 px-6 py-4 text-sm font-semibold text-slate-900">
          <Plus className="h-4 w-4 text-pink-500" />
          เพิ่ม{label}
        </summary>
        <PlForm action={createItem} resetOnSuccess successText="เพิ่มแล้ว" className="grid grid-cols-1 gap-4 border-t border-slate-100 p-6 sm:grid-cols-2">
          <input type="hidden" name="kind" value={kind} />
          <ItemFields kind={kind} />
          <div className="sm:col-span-2">
            <SubmitButton tone="indigo">
              <Plus className="h-4 w-4" />
              เพิ่ม
            </SubmitButton>
          </div>
        </PlForm>
      </details>

      {list.length === 0 ? (
        <Empty>ยังไม่มี{label} — หมวดนี้จะไม่แสดงบนหน้าเว็บจนกว่าจะเพิ่มรายการ</Empty>
      ) : (
        <div className="space-y-3">
          {list.map((item, i) => (
            <div key={item.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${item.published ? "border-slate-200" : "border-amber-200 bg-amber-50/30"}`}>
              <div className="flex items-center justify-between gap-3 px-5 py-3">
                <ItemSummary item={item} />
                <ItemControls item={item} index={i} total={list.length} sortable={sortable} />
              </div>
              <details className="border-t border-slate-100">
                <summary className="flex cursor-pointer items-center gap-1.5 px-5 py-2 text-xs font-semibold text-indigo-600 hover:bg-slate-50">
                  <Pencil className="h-3.5 w-3.5" />
                  แก้ไข
                  {kind === "PASSPORT" && item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 font-medium text-slate-500 hover:text-slate-900">
                      <ExternalLink className="h-3 w-3" />
                      เปิดไฟล์
                    </a>
                  )}
                </summary>
                <PlForm action={updateItem} className="grid grid-cols-1 gap-4 border-t border-slate-100 p-5 sm:grid-cols-2">
                  <input type="hidden" name="id" value={item.id} />
                  <ItemFields kind={kind} item={item} />
                  <div className="sm:col-span-2">
                    <SubmitButton>
                      <Save className="h-4 w-4" />
                      บันทึกการแก้ไข
                    </SubmitButton>
                  </div>
                </PlForm>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===================== แกลเลอรี =====================
async function PhotosTab() {
  const photos = await prisma.playAndLearnItem.findMany({ where: { kind: "PHOTO" }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  const albums = [...new Set(photos.map((p) => p.extra).filter((a): a is string => !!a))];

  return (
    <div className="space-y-5">
      <Card title="อัปโหลดรูปเข้าแกลเลอรี" hint="เลือกได้ทีละหลายรูป รูปใหญ่จะถูกย่อให้อัตโนมัติ · ใส่ชื่ออัลบั้มเพื่อให้ผู้ชมกรองดูตามศูนย์/กิจกรรมได้">
        <PhotoUploader albums={albums} />
      </Card>
      <datalist id="pl-albums-edit">
        {albums.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>

      {photos.length === 0 ? (
        <Empty>ยังไม่มีรูปในแกลเลอรี</Empty>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, i) => (
            <div key={photo.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${photo.published ? "border-slate-200" : "border-amber-300"}`}>
              <div className="relative aspect-4/3 bg-slate-100">
                {photo.imageUrl && <Image src={photo.imageUrl} alt={photo.title || "รูปกิจกรรม"} fill sizes="(min-width: 1024px) 240px, 50vw" className={`object-cover ${photo.published ? "" : "opacity-50"}`} />}
                {!photo.published && <span className="absolute left-2 top-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">ซ่อนอยู่</span>}
              </div>
              <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                <p className="min-w-0 truncate px-1 text-xs text-slate-500">{[photo.title, photo.extra].filter(Boolean).join(" · ") || "ไม่มีคำบรรยาย"}</p>
                <ItemControls item={photo} index={i} total={photos.length} sortable />
              </div>
              <details className="border-t border-slate-100">
                <summary className="flex cursor-pointer items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-slate-50">
                  <Pencil className="h-3.5 w-3.5" />
                  แก้ไข
                </summary>
                <PlForm action={updateItem} className="grid grid-cols-1 gap-3 border-t border-slate-100 p-3">
                  <input type="hidden" name="id" value={photo.id} />
                  <ItemFields kind="PHOTO" item={photo} />
                  <SubmitButton>
                    <Save className="h-4 w-4" />
                    บันทึก
                  </SubmitButton>
                </PlForm>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
