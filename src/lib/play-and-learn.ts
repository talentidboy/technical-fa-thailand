import { prisma } from "./prisma";
import { PLAY_AND_LEARN_PASSPORT_URLS } from "./brand";

// เนื้อหาหน้า Play and Learn — ค่าเริ่มต้นมาจากเนื้อหาเดิมของหน้า แอดมินแก้ได้ที่ /play-and-learn/manage

export const PL_SETTING_DEFAULTS = {
  tagline: "Where Thai girls grow, play and shine",
  intro: [
    "PLAY AND LEARN เพลินให้สุดกับฟุตบอล คือโครงการที่สมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์ ได้รับแรงบันดาลใจมาจาก UEFA Playmakers ซึ่งเป็นหนึ่งในความมุ่งมั่นของ UEFA (สหภาพสมาคมฟุตบอลยุโรป) ที่อยากเปิดโอกาสให้เด็กผู้หญิงได้สัมผัสความสนุกสนาน และเสน่ห์ของกีฬาฟุตบอล พร้อมทั้งสร้างแรงบันดาลใจให้หันมาเล่นฟุตบอลมากขึ้น",
    "สมาคมกีฬาฟุตบอลแห่งประเทศไทยฯ จึงริเริ่มโครงการ PLAY AND LEARN เพลินให้สุดกับฟุตบอล ขึ้น โดยเลือก **“กุ๋งกิ๋ง”** ตัวละครเด็กผู้หญิงตัวกลม อารมณ์ดี วัย 5 ขวบ จากหนังสือนิทานชุด “กุ๋งกิ๋ง” ของบริษัท แปลน ฟอร์ คิดส์ จำกัด ซึ่งมียอดตีพิมพ์กว่า 5 ล้านเล่มและเป็นเพื่อนรักของเด็กไทยมายาวนานกว่า 20 ปี เป็นผู้นำทีมเด็กผู้หญิงก้าวสู่สนามฟุตบอลเป็นครั้งแรก",
    "PLAY AND LEARN เพลินให้สุดกับฟุตบอล ไม่ใช่เป็นเพียงโครงการที่ส่งเสริมกีฬาฟุตบอลสำหรับเด็กผู้หญิง แต่ยังช่วยปลุกพลังและสร้างความมั่นใจให้เด็กผู้หญิงได้แสดงศักยภาพในฐานะนักกีฬา เพื่อเติบโตสู่การเป็นนักฟุตบอลมืออาชีพในอนาคต",
    "สมาคมกีฬาฟุตบอลแห่งประเทศไทย มีความตั้งใจที่จะสนับสนุนฟุตบอลเด็กผู้หญิงผ่านการจัดกิจกรรม เพื่อให้เด็กผู้หญิงได้รู้จักกีฬาฟุตบอล สร้างพื้นที่ให้ได้แสดงออกและมีส่วนร่วมในกิจกรรมฟุตบอล ภายใต้สภาพแวดล้อมที่เป็นมิตร ปลอดภัย และสนุกสนาน มุ่งเสริมสร้างความมั่นใจ เปิดโอกาสให้ได้ทำความรู้จักเพื่อนใหม่ เรียนรู้ทักษะชีวิต และเปลี่ยนภาพจำของกีฬาฟุตบอลว่าเป็นกีฬาสำหรับทุกคน ไม่ใช่เฉพาะผู้ชายเท่านั้น และที่สำคัญ คือ **“เด็กผู้หญิง ไม่ว่าอยู่ที่ไหนก็สามารถเล่นฟุตบอลได้”**",
    "PLAY AND LEARN เพลินให้สุดกับฟุตบอลจึงเป็นอีกก้าวสำคัญในการสร้างแรงบันดาลใจและต่อยอดการพัฒนาฟุตบอลหญิงไทยอย่างยั่งยืน",
  ].join("\n\n"),
  // ตัวเลขเด่น (บรรทัดละ 1 รายการ: ตัวเลข|คำอธิบาย) — จำนวนศูนย์ฝึก/จังหวัดนับจากข้อมูลจริงให้อัตโนมัติ
  facts: ["5-8|ปี วัยของน้อง ๆ", "10|สัปดาห์ต่อหลักสูตร", "45|นาทีต่อครั้ง", "8|บทผจญภัยกับกุ๋งกิ๋ง"].join("\n"),
  centersIntro: "ดำเนินกิจกรรมฝึกสอนฟุตบอลระดับภูมิภาคใน 5 จังหวัดทั่วประเทศ ร่วมกับ 5 โรงเรียน/อคาเดมีฟุตบอล",
  ctaTitle: "พาลูกสาวมาเพลินให้สุดกับฟุตบอล",
  ctaText: "เลือกศูนย์ฝึกใกล้บ้าน แล้วกดรับสมัครได้เลย — เด็กผู้หญิงไม่ว่าอยู่ที่ไหนก็สามารถเล่นฟุตบอลได้",
  contactPhone: "",
  contactEmail: "",
  lineUrl: "",
  facebookUrl: "",
} as const;
export type PlSettings = { [K in keyof typeof PL_SETTING_DEFAULTS]: string };
export const PL_SETTING_KEYS = Object.keys(PL_SETTING_DEFAULTS) as (keyof PlSettings)[];

// ประเภทเนื้อหา + ช่องที่ใช้ในฟอร์มแอดมิน (* = จำเป็น)
export type PlField = "title" | "body" | "imageUrl" | "url" | "date" | "extra";
export const PL_KINDS = {
  EVENT: { label: "กิจกรรม / ข่าวสาร", fields: { title: "หัวข้อ *", date: "วันที่", extra: "สถานที่ / ศูนย์ฝึก", body: "รายละเอียด", imageUrl: "รูปภาพ", url: "ลิงก์ (สมัคร / อ่านต่อ)" } },
  PHOTO: { label: "แกลเลอรี", fields: { imageUrl: "รูปภาพ *", title: "คำบรรยาย", extra: "อัลบั้ม", date: "วันที่ถ่าย" } },
  VIDEO: { label: "วิดีโอ", fields: { title: "ชื่อวิดีโอ *", url: "ลิงก์ YouTube / Facebook *", body: "คำอธิบาย" } },
  FAQ: { label: "คำถามที่พบบ่อย", fields: { title: "คำถาม *", body: "คำตอบ *" } },
  TESTIMONIAL: { label: "เสียงจากผู้ปกครอง", fields: { body: "ข้อความ *", title: "ชื่อ *", extra: "เป็นใคร เช่น คุณแม่น้องฟ้า", imageUrl: "รูป" } },
  PARTNER: { label: "พาร์ทเนอร์", fields: { title: "ชื่อ *", imageUrl: "โลโก้ *", url: "เว็บไซต์" } },
  PASSPORT: { label: "พาสปอร์ต", fields: { title: "ชื่อบท *", url: "ลิงก์ไฟล์ PDF", extra: "ฉากพื้นหลัง + ไอคอน" } },
} as const satisfies Record<string, { label: string; fields: Partial<Record<PlField, string>> }>;
export type PlKind = keyof typeof PL_KINDS;
export const PL_KIND_KEYS = Object.keys(PL_KINDS) as PlKind[];
export const isRequired = (kind: PlKind, field: PlField) => ((PL_KINDS[kind].fields as Partial<Record<PlField, string>>)[field] ?? "").endsWith("*");

// ไอคอน + ฉากพื้นหลังของบทพาสปอร์ต (ชื่อที่เก็บในฐานข้อมูล → คำอธิบายในฟอร์มแอดมิน)
// ตัวไอคอนอยู่ที่ components/play-and-learn/PassportIcon.tsx · ฉากอยู่ที่ PassportScene.tsx
export const PASSPORT_ICONS = {
  waves: "ทะเล — คลื่น เรือใบ ชายหาด",
  fish: "พิพิธภัณฑ์สัตว์น้ำ — ปลาว่าย ฟองน้ำ สาหร่าย",
  palm: "ภาคใต้ — ต้นมะพร้าว เกาะ เรือหางยาว",
  mountain: "ภาคเหนือ — ภูเขา หมอก เจดีย์บนดอย",
  temple: "ภาคอีสาน — ปราสาทหิน ทุ่งนา ต้นตาล",
  compass: "ภาคกลาง — วัด แม่น้ำ เรือ",
  droplets: "สงกรานต์ — สาดน้ำ ขันน้ำ พวงมาลัย",
  moon: "ลอยกระทง — พระจันทร์ กระทง โคมลอย",
  star: "ท้องฟ้ายามค่ำ — ดาวกะพริบ ดาวตก",
  ball: "สนามฟุตบอล — ประตู ลูกบอลเด้ง",
} as const;
export type PassportIconName = keyof typeof PASSPORT_ICONS;

// 8 บทเดิม (ใช้เมื่อยังไม่มีข้อมูลพาสปอร์ตในฐานข้อมูล)
export const DEFAULT_PASSPORT = [
  ["กุ๋งกิ๋งไปทะเล", "waves"],
  ["กุ๋งกิ๋งเที่ยวพิพิธภัณฑ์สัตว์น้ำ", "fish"],
  ["กุ๋งกิ๋งเที่ยวภาคใต้", "palm"],
  ["กุ๋งกิ๋งเที่ยวภาคเหนือ", "mountain"],
  ["กุ๋งกิ๋งเที่ยวภาคอีสาน", "temple"],
  ["กุ๋งกิ๋งเที่ยวภาคกลาง", "compass"],
  ["กุ๋งกิ๋ง สุขสันต์วันสงกรานต์", "droplets"],
  ["กุ๋งกิ๋ง สุขสันต์วันลอยกระทง", "moon"],
].map(([title, extra], i) => ({ title, extra, url: PLAY_AND_LEARN_PASSPORT_URLS[i] ?? null }));

export async function loadPlSettings(): Promise<PlSettings> {
  const rows = await prisma.playAndLearnSetting.findMany();
  const db = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return Object.fromEntries(PL_SETTING_KEYS.map((k) => [k, db[k] ?? PL_SETTING_DEFAULTS[k]])) as PlSettings;
}

// วันที่ตามเวลาไทยแบบ YYYY-MM-DD (ใช้เทียบวัน และเป็นค่าเริ่มต้นของช่อง input type=date)
export const bangkokDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(d);

export const thaiDate = (d: Date, month: "short" | "long" = "short") =>
  d.toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month, year: "numeric" });

// กิจกรรม: ที่กำลังจะมาถึงก่อน (ใกล้สุดก่อน) แล้วตามด้วยที่ผ่านมาแล้ว (ล่าสุดก่อน) · ไม่ระบุวันไว้ท้ายสุด
export function sortEvents<T extends { date: Date | null; id: number }>(events: T[], today: string) {
  const key = (e: T) => (e.date ? bangkokDay(e.date) : null);
  const upcoming = events.filter((e) => (key(e) ?? "") >= today).sort((a, b) => key(a)!.localeCompare(key(b)!));
  const past = events.filter((e) => key(e) && key(e)! < today).sort((a, b) => key(b)!.localeCompare(key(a)!));
  const undated = events.filter((e) => !e.date).sort((a, b) => b.id - a.id);
  return { upcoming, past: [...past, ...undated] };
}

// "5-8|ปี วัยของน้อง ๆ" → { value: "5-8", label: "ปี วัยของน้อง ๆ" }
export function parseFacts(text: string) {
  return text
    .split("\n")
    .map((line) => line.split("|").map((x) => x.trim()))
    .filter(([v, l]) => v && l)
    .map(([value, label]) => ({ value, label }));
}

// ข้อความย่อหน้า (เว้นบรรทัดว่างคั่น) และ **ตัวหนา**
export function paragraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => p.split(/(\*\*[^*]+\*\*)/g).map((part) => (part.startsWith("**") && part.endsWith("**") ? { bold: true, text: part.slice(2, -2) } : { bold: false, text: part })));
}
