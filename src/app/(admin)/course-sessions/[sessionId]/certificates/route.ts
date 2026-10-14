import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { generateCertificateBatchPdf } from "@/lib/certificate-pdf";

// ใบประกาศของทุกคนที่ผ่านในรุ่นนี้เป็น PDF ไฟล์เดียว (?type=licence = บัตรใบอนุญาต, ค่าเริ่มต้น = Diploma)
export async function GET(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  await requireAdmin();
  const { sessionId } = await params;
  const kind = new URL(request.url).searchParams.get("type") === "licence" ? "licence" : "diploma";

  const session = await prisma.courseSession.findUnique({
    where: { id: Number(sessionId) },
    include: {
      course: true,
      applications: {
        where: { status: "PASSED", licenseRecordId: { not: null } },
        include: { licenseRecord: { include: { coach: true } } },
      },
    },
  });
  if (!session) return NextResponse.json({ error: "ไม่พบรุ่นอบรม" }, { status: 404 });

  // เรียงตามเลขที่ใบประกาศ (ลำดับเดียวกับตอนยืนยันผล)
  const records = session.applications
    .map((a) => a.licenseRecord!)
    .sort((a, b) => (a.certificateNo ?? "").localeCompare(b.certificateNo ?? "", undefined, { numeric: true }));
  if (records.length === 0) return NextResponse.json({ error: "ยังไม่มีผู้ผ่านการอบรมในรุ่นนี้" }, { status: 404 });

  const title = `${session.course.title} — ${session.name}`;
  const pdf = await generateCertificateBatchPdf(kind, records, title);
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=${kind}-session-${session.id}.pdf`,
    },
  });
}
