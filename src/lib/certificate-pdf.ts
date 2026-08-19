import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import path from "node:path";

const FONT_DIR = path.join(
  process.cwd(),
  "node_modules",
  "@fontsource",
  "noto-sans-thai",
  "files",
);

export async function generateCertificatePdf(params: {
  coachName: string;
  licenseTypeLabel: string;
  recordTypeLabel: string;
  certificateNo: string | null;
  issueDate: Date | null;
}) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const [regularBytes, boldBytes] = await Promise.all([
    readFile(path.join(FONT_DIR, "noto-sans-thai-thai-400-normal.woff")),
    readFile(path.join(FONT_DIR, "noto-sans-thai-thai-700-normal.woff")),
  ]);

  const font = await doc.embedFont(regularBytes);
  const fontBold = await doc.embedFont(boldBytes);

  const page = doc.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();

  const navy = rgb(0.102, 0.227, 0.42);
  const gold = rgb(0.788, 0.635, 0.153);
  const slate = rgb(0.29, 0.33, 0.41);
  const lightSlate = rgb(0.55, 0.58, 0.64);

  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: navy,
    borderWidth: 3,
  });
  page.drawRectangle({
    x: 40,
    y: 40,
    width: width - 80,
    height: height - 80,
    borderColor: gold,
    borderWidth: 1,
  });

  const centerText = (
    text: string,
    y: number,
    size: number,
    useFont = font,
    color = slate,
  ) => {
    const textWidth = useFont.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y,
      size,
      font: useFont,
      color,
    });
  };

  centerText("ใบประกาศนียบัตรผู้ฝึกสอน", height - 130, 20, fontBold, navy);
  centerText(
    "Certificate of Coaching License",
    height - 158,
    12,
    font,
    lightSlate,
  );

  centerText("ขอมอบประกาศนียบัตรนี้ให้แก่", height - 220, 13, font, lightSlate);
  centerText(params.coachName, height - 260, 26, fontBold, slate);

  centerText(
    `เพื่อแสดงว่าได้รับใบอนุญาตผู้ฝึกสอนระดับ ${params.licenseTypeLabel}`,
    height - 305,
    14,
    font,
    slate,
  );
  centerText(`(${params.recordTypeLabel})`, height - 327, 12, font, lightSlate);

  const issueDateLabel = params.issueDate
    ? params.issueDate.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "-";
  centerText(`วันที่ออกใบอนุญาต: ${issueDateLabel}`, height - 365, 12, font, slate);
  if (params.certificateNo) {
    centerText(
      `เลขที่ใบประกาศ: ${params.certificateNo}`,
      height - 385,
      12,
      font,
      slate,
    );
  }

  centerText(
    "สมาคมกีฬาฟุตบอลแห่งประเทศไทย — ระบบจัดการข้อมูลผู้ฝึกสอน",
    70,
    10,
    font,
    lightSlate,
  );

  return doc.save();
}
