import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCoach } from "@/lib/auth";
import { generateCertificatePdf } from "@/lib/certificate-pdf";
import { LICENSE_TYPES, RECORD_TYPES, labelFor } from "@/lib/constants";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ recordId: string }> },
) {
  const user = await requireCoach();
  const { recordId } = await params;

  const record = await prisma.licenseRecord.findUnique({
    where: { id: Number(recordId) },
    include: { coach: true },
  });

  if (!record || record.coachId !== user.coachId) {
    return NextResponse.json({ error: "ไม่พบใบอนุญาต" }, { status: 404 });
  }

  const pdfBytes = await generateCertificatePdf({
    coachName: `${record.coach.nameTh} ${record.coach.surnameTh}`,
    licenseTypeLabel: labelFor(LICENSE_TYPES, record.licenseType) ?? record.licenseType,
    recordTypeLabel: labelFor(RECORD_TYPES, record.recordType) ?? record.recordType,
    certificateNo: record.certificateNo,
    issueDate: record.issueDate,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=certificate-${record.id}.pdf`,
    },
  });
}
