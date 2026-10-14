import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { AFC_LEVELS, generateAfcBatchPdf, generateAfcDiplomaPdf, generateAfcLicencePdf } from "./certificate-afc";
import { LICENSE_TYPES, RECORD_TYPES, labelFor } from "./constants";

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
  // สำหรับแบบ AFC (C / B / A / PRO)
  licenseType?: string;
  coachNameEn?: string | null;
  dob?: Date | null;
  afcId?: string | null;
  expireDate?: Date | null;
  photoUrl?: string | null;
  // diploma = ประกาศนียบัตร (แนวตั้ง), licence = บัตรใบอนุญาต (แนวนอน 2 หน้า)
  kind?: "diploma" | "licence";
}) {
  // ระดับ C / B / A / PRO ใช้แบบของสมาคมตาม AFC Coaching Convention — ระดับอื่น (G, GK ฯลฯ) ใช้แบบเดิมด้านล่าง
  if (params.licenseType && AFC_LEVELS[params.licenseType]) {
    const input = {
      licenseType: params.licenseType,
      nameTh: params.coachName,
      nameEn: params.coachNameEn ?? null,
      dob: params.dob ?? null,
      afcId: params.afcId ?? null,
      issueDate: params.issueDate,
      expireDate: params.expireDate ?? null,
      certificateNo: params.certificateNo,
      photoUrl: params.photoUrl ?? null,
    };
    return params.kind === "licence" ? generateAfcLicencePdf(input) : generateAfcDiplomaPdf(input);
  }

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

type RecordWithCoach = {
  licenseType: string;
  recordType: string;
  certificateNo: string | null;
  issueDate: Date | null;
  expireDate: Date | null;
  coach: {
    nameTh: string;
    surnameTh: string;
    nameEn: string | null;
    familyNameEn: string | null;
    dob: Date | null;
    afcId: string | null;
    photoUrl: string | null;
  };
};

function paramsFromRecord(record: RecordWithCoach, kind: "diploma" | "licence") {
  return {
    coachName: `${record.coach.nameTh} ${record.coach.surnameTh}`,
    licenseTypeLabel: labelFor(LICENSE_TYPES, record.licenseType) ?? record.licenseType,
    recordTypeLabel: labelFor(RECORD_TYPES, record.recordType) ?? record.recordType,
    certificateNo: record.certificateNo,
    issueDate: record.issueDate,
    licenseType: record.licenseType,
    coachNameEn: [record.coach.nameEn, record.coach.familyNameEn].filter(Boolean).join(" ") || null,
    dob: record.coach.dob,
    afcId: record.coach.afcId,
    expireDate: record.expireDate,
    photoUrl: record.coach.photoUrl,
    kind,
  };
}

// ใบประกาศทั้งรุ่นในไฟล์เดียว (เรียงตามลำดับที่ส่งมา) สำหรับสั่งพิมพ์ครั้งเดียว
export async function generateCertificateBatchPdf(kind: "diploma" | "licence", records: RecordWithCoach[], title: string) {
  if (records.length > 0 && records.every((r) => AFC_LEVELS[r.licenseType])) {
    return generateAfcBatchPdf(
      kind,
      records.map((r) => {
        const p = paramsFromRecord(r, kind);
        return {
          licenseType: r.licenseType,
          nameTh: p.coachName,
          nameEn: p.coachNameEn,
          dob: p.dob,
          afcId: p.afcId,
          issueDate: p.issueDate,
          expireDate: p.expireDate,
          certificateNo: p.certificateNo,
          photoUrl: p.photoUrl,
        };
      }),
      title,
    );
  }
  // ระดับอื่น (G ฯลฯ) ใช้แบบเดิม — สร้างทีละคนแล้วรวมหน้า
  const merged = await PDFDocument.create();
  merged.setTitle(title);
  for (const r of records) {
    const src = await PDFDocument.load(await generateCertificatePdf(paramsFromRecord(r, kind)));
    for (const page of await merged.copyPages(src, src.getPageIndices())) merged.addPage(page);
  }
  return merged.save();
}
