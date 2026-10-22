import { after } from "next/server";
import { prisma } from "./prisma";
import { isEmailConfigured, sendEmail } from "./email";

// แจ้งเตือนผู้ฝึกสอน: บันทึกลงกล่องแจ้งเตือนในระบบทันที แล้วส่งอีเมล (ถ้ามีอีเมล) หลังตอบผู้ใช้เสร็จ
// key = กันแจ้งซ้ำ (เช่น ใบอนุญาตใกล้หมดอายุ 90 วันของใบเดียวกัน แจ้งครั้งเดียว)

export type NotificationInput = {
  coachId: number;
  type: string;
  title: string;
  body?: string | null;
  href?: string | null;
  key?: string | null;
};

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || "https://technical-fa-thailand.vercel.app";
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// สร้างหลายรายการ (ข้ามรายการที่ key ซ้ำ) — คืน id ที่สร้างใหม่
export async function createNotifications(items: NotificationInput[]) {
  const created: number[] = [];
  for (const n of items) {
    try {
      if (n.key && (await prisma.notification.findUnique({ where: { key: n.key }, select: { id: true } }))) continue;
      const row = await prisma.notification.create({
        data: { coachId: n.coachId, type: n.type, title: n.title, body: n.body ?? null, href: n.href ?? null, key: n.key ?? null },
        select: { id: true },
      });
      created.push(row.id);
    } catch (err) {
      console.error("[notify] สร้างการแจ้งเตือนไม่สำเร็จ", err);
    }
  }
  return created;
}

// ใช้ใน Server Action: สร้างแจ้งเตือน แล้วส่งอีเมลหลังตอบผู้ใช้ (ไม่ทำให้หน้าแอดมินช้า)
export async function notifyCoaches(items: NotificationInput[]) {
  const ids = await createNotifications(items);
  if (ids.length > 0 && isEmailConfigured()) after(() => sendNotificationEmails(ids));
  return ids;
}

function emailOf(coach: { email: string | null; systemUser: { email: string } | null }) {
  const e = coach.email?.trim() || coach.systemUser?.email;
  return e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}

// ส่งอีเมลของการแจ้งเตือนที่ยังไม่ได้ส่ง (ids = เฉพาะรายการที่ระบุ, ไม่ระบุ = ค้างภายใน 7 วัน)
// เว้น 600ms ต่ออีเมล (Resend จำกัด 2 ฉบับ/วินาที) และส่งได้สูงสุดครั้งละ limit ฉบับ
export async function sendNotificationEmails(ids?: number[], limit = 80) {
  if (!isEmailConfigured()) return 0;
  const rows = await prisma.notification.findMany({
    where: {
      emailedAt: null,
      ...(ids ? { id: { in: ids } } : { createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) } }),
      OR: [{ coach: { email: { contains: "@" } } }, { coach: { systemUser: { email: { contains: "@" } } } }],
    },
    include: { coach: { select: { email: true, nameTh: true, surnameTh: true, nameEn: true, systemUser: { select: { email: true } } } } },
    orderBy: { id: "asc" },
    take: limit,
  });
  let sent = 0;
  for (const n of rows) {
    const to = emailOf(n.coach);
    if (!to) continue;
    try {
      const link = n.href ? `${SITE()}${n.href}` : `${SITE()}/me`;
      await sendEmail({
        to,
        subject: `[FA Thailand] ${n.title}`,
        html: `<p>เรียน คุณ${esc(n.coach.nameTh?.trim() || n.coach.nameEn || "ผู้ฝึกสอน")}</p><p><b>${esc(n.title)}</b></p>${
          n.body ? `<p>${esc(n.body)}</p>` : ""
        }<p><a href="${link}">ดูรายละเอียดในศูนย์อบรมผู้ฝึกสอน</a></p><p style="color:#64748b;font-size:12px">FA Thailand Technical — อีเมลนี้ส่งอัตโนมัติ</p>`,
      });
      await prisma.notification.update({ where: { id: n.id }, data: { emailedAt: new Date() } });
      sent++;
    } catch (err) {
      console.error("[notify] ส่งอีเมลไม่สำเร็จ", n.id, err);
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  return sent;
}
