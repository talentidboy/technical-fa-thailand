import { prisma } from "@/lib/prisma";
import { getAcademyUser, getCurrentUser } from "@/lib/auth";
import { parseId } from "@/lib/route-id";
import { documentResponse } from "@/lib/academy-docs";

// เปิดเอกสารของอคาเดมี — เฉพาะแอดมิน/เจ้าหน้าที่ และผู้ดูแลอคาเดมีเจ้าของเอกสาร (คนอื่นได้ 404 เหมือนไม่มีไฟล์)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  const doc = id ? await prisma.academyDocument.findUnique({ where: { id } }) : null;
  if (!doc) return new Response("Not found", { status: 404 });

  const staff = await getCurrentUser();
  let allowed = staff?.role === "ADMIN" || staff?.role === "STAFF";
  if (!allowed) {
    const au = await getAcademyUser();
    allowed = !!au && au.member.status === "APPROVED" && au.member.academyId === doc.academyId;
  }
  if (!allowed) return new Response("Not found", { status: 404 });
  return documentResponse(doc);
}
