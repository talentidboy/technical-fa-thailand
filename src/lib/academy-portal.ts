import { redirect } from "next/navigation";
import { after } from "next/server";
import { prisma } from "./prisma";
import { getAcademyUser } from "./auth";
import { isEmailConfigured, sendEmail } from "./email";

// พอร์ทัลอคาเดมี: ต้องล็อกอินด้วยบัญชีอคาเดมี · approved = ต้องได้รับอนุมัติให้ดูแลอคาเดมีแล้ว (ไม่งั้นกลับหน้าภาพรวม)
export async function requireAcademy({ approved = true } = {}) {
  const au = await getAcademyUser();
  if (!au) redirect("/academies/login");
  if (approved && au.member.status !== "APPROVED") redirect("/academies/portal");
  return au;
}

export const APPLICATION_KINDS: Record<string, string> = { NEW: "ขอใบอนุญาตใหม่", RENEWAL: "ต่ออายุ", UPGRADE: "เลื่อนระดับ" };
export const APPLICATION_STATUS: Record<string, { label: string; tone: string }> = {
  DRAFT: { label: "กำลังกรอก", tone: "bg-slate-100 text-slate-600 ring-slate-200" },
  SUBMITTED: { label: "รอตรวจ", tone: "bg-sky-50 text-sky-700 ring-sky-200" },
  NEEDS_FIX: { label: "ต้องแก้ไข", tone: "bg-amber-50 text-amber-700 ring-amber-200" },
  APPROVED: { label: "อนุมัติแล้ว", tone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  REJECTED: { label: "ไม่อนุมัติ", tone: "bg-red-50 text-red-700 ring-red-200" },
};
export const EVIDENCE_STATUS: Record<string, { label: string; tone: string }> = {
  PENDING: { label: "รอตรวจ", tone: "bg-slate-100 text-slate-600" },
  PASS: { label: "ผ่าน", tone: "bg-emerald-50 text-emerald-700" },
  FIX: { label: "ต้องแก้ไข", tone: "bg-amber-50 text-amber-700" },
  FAIL: { label: "ไม่ผ่าน", tone: "bg-red-50 text-red-700" },
};
export const MEMBER_STATUS: Record<string, { label: string; tone: string }> = {
  PENDING: { label: "รออนุมัติ", tone: "bg-amber-50 text-amber-700" },
  APPROVED: { label: "อนุมัติแล้ว", tone: "bg-emerald-50 text-emerald-700" },
  REJECTED: { label: "ไม่อนุมัติ", tone: "bg-red-50 text-red-700" },
};
export const OPEN_STATUSES =["DRAFT", "SUBMITTED", "NEEDS_FIX"];
export const EDITABLE_STATUSES = ["DRAFT", "NEEDS_FIX"];

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || "https://technical-fa-thailand.vercel.app";
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// แจ้งเตือนในพอร์ทัล + อีเมลถึงผู้ดูแลอคาเดมี (อีเมลส่งหลังตอบกลับแล้ว ไม่ทำให้หน้าช้า)
export async function notifyAcademy(academyId: number, notice: { title: string; body?: string; link?: string }) {
  await prisma.academyNotice.create({ data: { academyId, ...notice } });
  if (!isEmailConfigured()) return;
  const members = await prisma.academyMember.findMany({ where: { academyId, status: "APPROVED" }, include: { user: { select: { email: true } } } });
  after(async () => {
    for (const m of members) {
      await sendEmail({
        to: m.user.email,
        subject: `[FA Thailand Academy Licensing] ${notice.title}`,
        html: `<p>เรียน คุณ${esc(m.name)}</p><p><b>${esc(notice.title)}</b></p>${notice.body ? `<p>${esc(notice.body)}</p>` : ""}<p><a href="${SITE()}${notice.link ?? "/academies/portal"}">เปิดพอร์ทัลอคาเดมี</a></p><p style="color:#64748b;font-size:12px">FA Thailand — อีเมลนี้ส่งอัตโนมัติ</p>`,
      }).catch((err) => console.error("[academy] ส่งอีเมลไม่สำเร็จ", err));
    }
  });
}
