import {
  PDFDocument,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  pushGraphicsState,
  popGraphicsState,
  moveTo,
  appendBezierCurve,
  closePath,
  clip,
  endPath,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import path from "node:path";

// ใบประกาศนียบัตรผู้ฝึกสอนระดับ C / B / A / PRO ตามแบบ AFC Coaching Convention
// พื้นหลัง (เส้นโค้งกรมท่า-ทอง, โลโก้ AFC Coaching Convention, เส้นลงนาม) มาจากไฟล์ต้นฉบับของ AFC โดยตรง
// (src/assets/certificates/afc-diploma-template.pdf — ลบข้อความตัวอย่างและวงกลมใส่โลโก้ออกแล้ว) แล้ววางข้อความจริงทับ
// พิกัดทั้งหมดอ้างอิงตำแหน่งข้อความในไฟล์ต้นฉบับ (หน่วย pt, จุดกำเนิดมุมซ้ายล่าง, หน้า 623.6 x 870.2)

export const AFC_DIPLOMA_TITLES: Record<string, string> = {
  PRO: "AFC PRO Diploma",
  A: "AFC A Diploma",
  B: "AFC B Diploma",
  C: "AFC C Diploma",
};

// ผู้ลงนาม 3 ตำแหน่งตามแบบ — ใส่ชื่อจริงที่นี่เมื่อได้รับยืนยัน (เว้นว่าง = แสดงเฉพาะตำแหน่ง)
const SIGNATORIES = [
  { role: "President", name: "" },
  { role: "General Secretary", name: "" },
  { role: "Technical Director", name: "" },
];
const ASSOCIATION = "Football Association of Thailand";
const PLACE = "Bangkok";

const ASSET_DIR = path.join(process.cwd(), "src", "assets", "certificates");
const FONT_DIR = path.join(process.cwd(), "node_modules", "@fontsource", "noto-sans-thai", "files");

const NAVY = rgb(0.122, 0.165, 0.365);
const MUTED = rgb(0.38, 0.42, 0.52);

const LEFT = 98.37;
const MAX_TEXT_WIDTH = 470;
const SIGN_CENTERS = [158.59, 319.16, 472.56];
const LOGO = { cx: 527.88, cy: 745.66, r: 40.6 };

const isThai = (s: string) => /[฀-๿]/.test(s);
// ตัดอักขระที่ฟอนต์ไม่มี (อักขระควบคุม/อักขระมองไม่เห็นที่ติดมากับข้อมูลนำเข้า) ไม่งั้นจะขึ้นเป็นกล่องสี่เหลี่ยม
// ขีดแบบยูนิโคด (‐ – — −) แปลงเป็น "-" ธรรมดาก่อน
const clean = (s: string) =>
  s
    .replace(/[‐-―−]/g, "-")
    .replace(/[^\x20-\x7EÀ-ſ฀-๿’]/g, "")
    .replace(/\s+/g, " ")
    .trim();
const pad = (n: number) => String(n).padStart(2, "0");
const dotDate = (d: Date) => {
  const local = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  return `${pad(local.getDate())}.${pad(local.getMonth() + 1)}.${local.getFullYear()}`;
};
// ชื่ออังกฤษที่เก็บเป็นตัวพิมพ์ใหญ่ทั้งหมด → แปลงเป็นแบบขึ้นต้นตัวใหญ่ (ตามแบบ "Name Surname")
const titleCase = (s: string) =>
  s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, p, c: string) => p + c.toUpperCase()) : s;

// วาดรูปลงในวงกลม (ตัดขอบเป็นวงกลมเหมือนช่องโลโก้ในแบบ)
function drawCircleImage(page: PDFPage, image: PDFImage, cx: number, cy: number, r: number) {
  const k = 0.5523 * r;
  page.pushOperators(
    pushGraphicsState(),
    moveTo(cx + r, cy),
    appendBezierCurve(cx + r, cy + k, cx + k, cy + r, cx, cy + r),
    appendBezierCurve(cx - k, cy + r, cx - r, cy + k, cx - r, cy),
    appendBezierCurve(cx - r, cy - k, cx - k, cy - r, cx, cy - r),
    appendBezierCurve(cx + k, cy - r, cx + r, cy - k, cx + r, cy),
    closePath(),
    clip(),
    endPath(),
  );
  page.drawImage(image, { x: cx - r, y: cy - r, width: r * 2, height: r * 2 });
  page.pushOperators(popGraphicsState());
}

export async function generateAfcDiplomaPdf(params: {
  licenseType: string;
  nameTh: string;
  nameEn: string | null;
  dob: Date | null;
  issueDate: Date | null;
  certificateNo: string | null;
}) {
  const title = AFC_DIPLOMA_TITLES[params.licenseType];
  if (!title) throw new Error(`ไม่มีแบบใบประกาศ AFC สำหรับระดับ ${params.licenseType}`);

  const [templateBytes, logoBytes, latinLight, latinRegular, thaiLight, thaiRegular] = await Promise.all([
    readFile(path.join(ASSET_DIR, "afc-diploma-template.pdf")),
    readFile(path.join(ASSET_DIR, "fa-thailand-logo.jpg")),
    readFile(path.join(FONT_DIR, "noto-sans-thai-latin-300-normal.woff")),
    readFile(path.join(FONT_DIR, "noto-sans-thai-latin-400-normal.woff")),
    readFile(path.join(FONT_DIR, "noto-sans-thai-thai-300-normal.woff")),
    readFile(path.join(FONT_DIR, "noto-sans-thai-thai-400-normal.woff")),
  ]);

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`${title} — ${params.nameEn || params.nameTh}`);
  doc.setAuthor(ASSOCIATION);

  // คัดลอกหน้าแบบมาทั้งหน้า (คงการบีบอัดเดิมของไฟล์ — ไฟล์ผลลัพธ์เล็กกว่าการ embed เป็นภาพซ้อน)
  const template = await PDFDocument.load(templateBytes);
  const [page] = await doc.copyPages(template, [0]);
  doc.addPage(page);

  const fonts = {
    light: await doc.embedFont(latinLight, { subset: true }),
    regular: await doc.embedFont(latinRegular, { subset: true }),
    thaiLight: await doc.embedFont(thaiLight, { subset: true }),
    thaiRegular: await doc.embedFont(thaiRegular, { subset: true }),
  };
  const pick = (text: string, weight: "light" | "regular"): PDFFont =>
    isThai(text) ? (weight === "light" ? fonts.thaiLight : fonts.thaiRegular) : fonts[weight];

  // ข้อความชิดซ้าย/กึ่งกลาง ย่อขนาดอัตโนมัติถ้ายาวเกินความกว้างที่กำหนด
  const text = (
    value: string,
    opts: { x: number; y: number; size: number; weight?: "light" | "regular"; align?: "left" | "center"; maxWidth?: number; color?: ReturnType<typeof rgb> },
  ) => {
    value = clean(value);
    if (!value) return;
    const font = pick(value, opts.weight ?? "regular");
    let size = opts.size;
    const maxWidth = opts.maxWidth ?? MAX_TEXT_WIDTH;
    const w = font.widthOfTextAtSize(value, size);
    if (w > maxWidth) size = (size * maxWidth) / w;
    const width = font.widthOfTextAtSize(value, size);
    const x = opts.align === "center" ? opts.x - width / 2 : opts.x;
    page.drawText(value, { x, y: opts.y, size, font, color: opts.color ?? NAVY });
  };

  // โลโก้สมาคม (ตำแหน่งเดียวกับวงกลม "Insert Member Association's Logo" ในแบบ)
  drawCircleImage(page, await doc.embedJpg(logoBytes), LOGO.cx, LOGO.cy, LOGO.r);

  const nameEn = params.nameEn?.trim() ? titleCase(params.nameEn.trim()) : null;
  text("This is to certify that:", { x: LEFT, y: 628.56, size: 16 });
  text(nameEn ?? params.nameTh, { x: LEFT, y: 551.36, size: 26, weight: "light" });
  let y = 534;
  if (nameEn) {
    text(params.nameTh, { x: LEFT, y, size: 13 });
    y -= 17;
  }
  if (params.dob) text(`Born on ${dotDate(params.dob)}`, { x: LEFT, y, size: 12 });

  text("has successfully completed the", { x: LEFT, y: 475.17, size: 16 });
  text(ASSOCIATION, { x: LEFT, y: 434.14, size: 32, weight: "light" });
  text(title, { x: LEFT, y: 393.1, size: 33, weight: "light" });

  SIGNATORIES.forEach((s, i) => {
    text(s.role, { x: SIGN_CENTERS[i], y: 273.97, size: 11.3, align: "center", maxWidth: 150 });
    if (s.name) text(s.name, { x: SIGN_CENTERS[i], y: 206.2, size: 11.3, align: "center", maxWidth: 150 });
  });

  text(params.issueDate ? `${PLACE}, ${dotDate(params.issueDate)}` : PLACE, { x: 94.44, y: 117.34, size: 14 });
  if (params.certificateNo) {
    text(`Certificate No. ${params.certificateNo}`, { x: 94.44, y: 99, size: 10, color: MUTED });
  }

  return doc.save();
}
