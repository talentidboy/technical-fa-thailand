import {
  PDFDocument,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  type RGB,
  pushGraphicsState,
  popGraphicsState,
  rectangle,
  clip,
  endPath,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import path from "node:path";

// ใบประกาศผู้ฝึกสอนระดับ C / B / A / PRO ตามแบบของสมาคม (Main Cer Diploma / Main Cer Licence)
//   - Diploma = A4 แนวตั้ง 1 หน้า
//   - Licence = A4 แนวนอน 2 หน้า (หน้า: รูป + ข้อมูลใบอนุญาต, หลัง: ข้อความรับรอง AFC + ลายเซ็น)
// พื้นหลังเส้นโค้งกรมท่า-ทองเป็นเวกเตอร์จากไฟล์ต้นฉบับ AFC Coaching Convention (fat-backgrounds.pdf)
// ตำแหน่ง/ขนาดตัวอักษรอ้างอิงจากไฟล์ Word ต้นแบบ (หน่วย pt, จุดกำเนิดมุมซ้ายล่าง)

export const AFC_LEVELS: Record<string, string> = { PRO: "PRO", A: "A", B: "B", C: "C" };

export const SIGNATORIES = [
  // height/bottom = ขนาดและตำแหน่งลายเซ็นบน Diploma (ให้อยู่ระหว่างชื่อตำแหน่งกับเส้น และทับเส้นเล็กน้อยเหมือนเซ็นจริง)
  { role: "President", name: "Mrs. Nualphan Lamsam", sig: "sig-president.png", width: 80, height: 29, bottom: 178 },
  { role: "General Secretary", name: "Mr. Ekapol Polnavee", sig: "sig-general-secretary.png", width: 44, height: 35, bottom: 172 },
  { role: "Technical Director", name: "Mr. Songyos Klinsrisuk", sig: "sig-technical-director.png", width: 104, height: 19, bottom: 180 },
];
const ASSOCIATION = "Football Association of Thailand";
const PLACE = "Bangkok";

const A4 = { w: 595.32, h: 841.92 };
const ASSET_DIR = path.join(process.cwd(), "src", "assets", "certificates");
const THAI_FONT_DIR = path.join(process.cwd(), "node_modules", "@fontsource", "noto-sans-thai", "files");

const NAVY = rgb(0.122, 0.165, 0.357);
const INK = rgb(0.2, 0.22, 0.27);
const LINE = rgb(0.11, 0.13, 0.27);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const bkk = (d: Date) => new Date(d.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
const pad = (n: number) => String(n).padStart(2, "0");
const dotDate = (d: Date) => {
  const x = bkk(d);
  return `${pad(x.getDate())}.${pad(x.getMonth() + 1)}.${x.getFullYear()}`;
};
const longDate = (d: Date) => {
  const x = bkk(d);
  return `${x.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`;
};

const isThai = (s: string) => /[฀-๿]/.test(s);
// ตัดอักขระที่ฟอนต์ไม่มี (อักขระมองไม่เห็นที่ติดมากับข้อมูลนำเข้า) — ขีดแบบยูนิโคดแปลงเป็น "-" ธรรมดา
const clean = (s: string) =>
  s
    .replace(/[‐-―−]/g, "-")
    .replace(/[^\x20-\x7EÀ-ſ฀-๿’]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export type CoachCertificateInput = {
  licenseType: string;
  nameTh: string;
  nameEn: string | null;
  dob: Date | null;
  afcId: string | null;
  issueDate: Date | null;
  expireDate: Date | null;
  certificateNo: string | null;
  photoUrl: string | null;
};

type Fonts = { regular: PDFFont; bold: PDFFont; title: PDFFont; thai: PDFFont };
type Align = "left" | "center";

function writer(page: PDFPage, fonts: Fonts) {
  return (
    value: string,
    o: { x: number; y: number; size: number; font?: keyof Fonts; align?: Align; maxWidth?: number; color?: RGB },
  ) => {
    value = clean(value);
    if (!value) return;
    const font = isThai(value) ? fonts.thai : fonts[o.font ?? "regular"];
    let size = o.size;
    const w = font.widthOfTextAtSize(value, size);
    if (o.maxWidth && w > o.maxWidth) size = (size * o.maxWidth) / w;
    const width = font.widthOfTextAtSize(value, size);
    page.drawText(value, { x: o.align === "center" ? o.x - width / 2 : o.x, y: o.y, size, font, color: o.color ?? NAVY });
  };
}

// รูปแบบ "ครอบเต็มกรอบ" (object-fit: cover) — ตัดส่วนเกินด้วย clipping path
function drawCover(page: PDFPage, image: PDFImage, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / image.width, h / image.height);
  const dw = image.width * scale;
  const dh = image.height * scale;
  page.pushOperators(pushGraphicsState(), rectangle(x, y, w, h), clip(), endPath());
  // ชิดด้านบนของรูป (หน้าคนมักอยู่ส่วนบน)
  page.drawImage(image, { x: x + (w - dw) / 2, y: y + h - dh, width: dw, height: dh });
  page.pushOperators(popGraphicsState());
}

async function loadPhoto(doc: PDFDocument, url: string | null): Promise<PDFImage | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    // ตรวจชนิดไฟล์จากส่วนหัว (pdf-lib รองรับ JPG/PNG เท่านั้น)
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return await doc.embedJpg(bytes);
    if (bytes[0] === 0x89 && bytes[1] === 0x50) return await doc.embedPng(bytes);
    return null;
  } catch {
    return null;
  }
}

async function setup(kind: "diploma" | "licence") {
  const read = (f: string) => readFile(path.join(ASSET_DIR, f));
  const [bg, afc, cc, crest, regular, bold, title, thai, ...sigs] = await Promise.all([
    read("fat-backgrounds.pdf"),
    read("afc-logo.png"),
    read("coaching-convention.png"),
    read("fa-thailand-crest.png"),
    read("fonts/carlito-latin-400-normal.woff"),
    read("fonts/carlito-latin-700-normal.woff"),
    read("fonts/montserrat-latin-800-normal.woff"),
    readFile(path.join(THAI_FONT_DIR, "noto-sans-thai-thai-400-normal.woff")),
    ...SIGNATORIES.map((s) => read(s.sig)),
  ]);
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setAuthor(ASSOCIATION);
  // หน้า 0 = พื้นหลังแนวตั้ง (Diploma), หน้า 1 / 2 = พื้นหลังแนวนอน (Licence หน้า/หลัง)
  const backgrounds = await doc.embedPdf(bg, kind === "diploma" ? [0] : [1, 2]);
  const fonts: Fonts = {
    regular: await doc.embedFont(regular, { subset: true }),
    bold: await doc.embedFont(bold, { subset: true }),
    title: await doc.embedFont(title, { subset: true }),
    thai: await doc.embedFont(thai, { subset: true }),
  };
  const images = {
    afc: await doc.embedPng(afc),
    cc: await doc.embedPng(cc),
    crest: await doc.embedPng(crest),
    sigs: await Promise.all(sigs.map((b) => doc.embedPng(b))),
  };
  return { doc, backgrounds, fonts, images };
}

const fitWidth = (img: PDFImage, width: number) => ({ width, height: (img.height / img.width) * width });

function displayName(c: CoachCertificateInput) {
  return clean(c.nameEn ?? "") ? clean(c.nameEn!).toUpperCase() : c.nameTh;
}

export async function generateAfcDiplomaPdf(c: CoachCertificateInput) {
  const level = AFC_LEVELS[c.licenseType];
  if (!level) throw new Error(`ไม่มีแบบใบประกาศ AFC สำหรับระดับ ${c.licenseType}`);
  const { doc, backgrounds, fonts, images } = await setup("diploma");
  doc.setTitle(`AFC ${level} Diploma — ${displayName(c)}`);
  const page = doc.addPage([A4.w, A4.h]);
  page.drawPage(backgrounds[0], { x: 0, y: 0, width: A4.w, height: A4.h });
  const text = writer(page, fonts);

  // โลโก้ AFC + COACHING CONVENTION + ตราสมาคม
  page.drawImage(images.afc, { x: 127.9, y: 695.7, ...fitWidth(images.afc, 114.8) });
  page.drawImage(images.cc, { x: 258.5, y: 691.5, ...fitWidth(images.cc, 148) });
  page.drawImage(images.crest, { x: 439, y: 667.4, ...fitWidth(images.crest, 106.1) });

  text("This is to certify that:", { x: 70.6, y: 569.9, size: 17 });
  text(displayName(c), { x: 72.7, y: 498.9, size: 30, maxWidth: 440 });
  if (c.dob) text(`Born on ${dotDate(c.dob)}`, { x: 75.3, y: 480.3, size: 12.96 });
  text("has successfully completed the", { x: 76, y: 428.5, size: 15 });
  text(ASSOCIATION, { x: 75.3, y: 392.6, size: 33, maxWidth: 440 });
  text(`AFC ${level} Diploma`, { x: 79.2, y: 357.9, size: 27, font: "title", maxWidth: 440 });

  // ลายเซ็น 3 ตำแหน่ง
  const centers = [141, 297.4, 453.7];
  SIGNATORIES.forEach((s, i) => {
    const cx = centers[i];
    text(s.role, { x: cx, y: 213.9, size: 12, align: "center" });
    const sig = images.sigs[i];
    const size = { width: (sig.width / sig.height) * s.height, height: s.height };
    page.drawImage(sig, { x: cx - size.width / 2, y: s.bottom, ...size });
    page.drawRectangle({ x: cx - 58.5, y: 185, width: 117, height: 1.2, color: LINE });
    text(s.name, { x: cx, y: 148.6, size: 12, align: "center" });
  });

  // ล่างซ้าย: สถานที่-วันที่ / เลขที่ใบประกาศ / AFC ID
  const lines = [c.issueDate ? `${PLACE}, ${longDate(c.issueDate)}` : PLACE, c.certificateNo ?? "", c.afcId ?? ""].filter((l) => clean(l));
  lines.forEach((l, i) => text(l, { x: 73.5, y: 78.9 - i * 16.8, size: 12.96 }));

  return doc.save();
}

export async function generateAfcLicencePdf(c: CoachCertificateInput) {
  const level = AFC_LEVELS[c.licenseType];
  if (!level) throw new Error(`ไม่มีแบบใบอนุญาต AFC สำหรับระดับ ${c.licenseType}`);
  const { doc, backgrounds, fonts, images } = await setup("licence");
  doc.setTitle(`AFC ${level} Licence — ${displayName(c)}`);
  const L = { w: A4.h, h: A4.w };

  // ---------- หน้า (รูป + ข้อมูล) ----------
  const front = doc.addPage([L.w, L.h]);
  front.drawPage(backgrounds[0], { x: 0, y: 0, width: L.w, height: L.h });
  const t1 = writer(front, fonts);
  front.drawImage(images.afc, { x: 170.8, y: 438.1, ...fitWidth(images.afc, 136.5) });
  front.drawImage(images.cc, { x: 326, y: 435.5, ...fitWidth(images.cc, 172) });
  front.drawImage(images.crest, { x: 565.1, y: 416, ...fitWidth(images.crest, 106.4) });

  const cx = L.w / 2;
  t1(`${ASSOCIATION} Award`, { x: cx, y: 338.7, size: 45, align: "center", maxWidth: 760 });
  t1(`AFC ${level} License`, { x: cx, y: 287.7, size: 40, font: "title", align: "center", maxWidth: 720 });

  // รูปถ่าย (ไม่มีรูป/รูปชนิดที่ไม่รองรับ → กรอบเทาพร้อมข้อความ)
  const photo = await loadPhoto(doc, c.photoUrl);
  const P = { x: 76, y: 53.9, w: 150, h: 195.6 };
  if (photo) drawCover(front, photo, P.x, P.y, P.w, P.h);
  else {
    front.drawRectangle({ x: P.x, y: P.y, width: P.w, height: P.h, color: rgb(0.72, 0.73, 0.78) });
    t1("Photo", { x: P.x + P.w / 2, y: P.y + P.h / 2 - 5, size: 13, align: "center", color: rgb(1, 1, 1) });
  }

  const ix = 420;
  t1(displayName(c), { x: ix, y: 212.2, size: 28, align: "center", maxWidth: 380, color: INK });
  if (c.dob) t1(`Birth date: ${dotDate(c.dob)}`, { x: ix, y: 160.3, size: 16, align: "center", color: INK });
  if (c.certificateNo) t1(c.certificateNo, { x: ix, y: 91.6, size: 17, align: "center", color: INK });
  if (c.afcId) t1(`AFC ID: ${c.afcId}`, { x: ix, y: 72.7, size: 15, align: "center", color: INK });
  if (c.expireDate) t1(`Valid until: ${dotDate(c.expireDate)}`, { x: ix, y: 53.7, size: 15, align: "center", color: INK });

  // ---------- หลัง (ข้อความรับรอง + ลายเซ็น) ----------
  const back = doc.addPage([L.w, L.h]);
  back.drawPage(backgrounds[1], { x: 0, y: 0, width: L.w, height: L.h });
  const t2 = writer(back, fonts);
  [
    `The holder of this AFC ${level} licence is authorised to coach, in accordance with the`,
    `AFC Coaching Convention, on the territory of ${ASSOCIATION}, as well as`,
    "within all other associations which have signed the AFC Coaching Convention.",
    "This licence may not be transferred to a third party.",
  ].forEach((line, i) => t2(line, { x: cx, y: 452 - i * 19.2, size: 15.5, align: "center", maxWidth: 690, color: INK }));

  const centers = [206, 420.6, 636];
  SIGNATORIES.forEach((s, i) => {
    const sx = centers[i];
    t2(s.role, { x: sx, y: 286, size: 15, font: "bold", align: "center" });
    const sig = images.sigs[i];
    const size = fitWidth(sig, s.width * 1.15);
    back.drawImage(sig, { x: sx - size.width / 2, y: 231, ...size });
    back.drawRectangle({ x: sx - 69, y: 234.6, width: 138, height: 1.4, color: LINE });
    t2(s.name, { x: sx, y: 203.7, size: 15, font: "bold", align: "center" });
  });

  return doc.save();
}
