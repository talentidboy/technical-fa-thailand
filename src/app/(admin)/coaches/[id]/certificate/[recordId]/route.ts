import { coachName } from "@/lib/coach-name";
import { NextResponse } from "next/server";
import { parseId } from "@/lib/route-id";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { generateCertificatePdf } from "@/lib/certificate-pdf";
import { LICENSE_TYPES, RECORD_TYPES, labelFor } from "@/lib/constants";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; recordId: string }> },
) {
  // ใบประกาศของผู้ฝึกสอนคนใดก็ได้ — แอดมิน/เจ้าหน้าที่เท่านั้น (โค้ชดาวน์โหลดของตัวเองที่ /me/certificate)
  await requireStaff();
  const { recordId } = await params;

  const record = await prisma.licenseRecord.findUnique({
    where: { id: parseId(recordId) ?? 0 },
    include: { coach: true },
  });

  if (!record) {
    return NextResponse.json({ error: "ไม่พบใบอนุญาต" }, { status: 404 });
  }

  // ?type=licence = บัตรใบอนุญาต (แนวนอน 2 หน้า), ค่าเริ่มต้น = ประกาศนียบัตร (Diploma)
  const kind = new URL(request.url).searchParams.get("type") === "licence" ? "licence" : "diploma";
  const pdfBytes = await generateCertificatePdf({
    coachName: coachName(record.coach),
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
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=${kind}-${record.licenseType}-${record.id}.pdf`,
    },
  });
}
