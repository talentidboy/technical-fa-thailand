import { prisma } from "./prisma";
import { isEmailConfigured, sendEmail } from "./email";

// บันทึกข้อผิดพลาดลงตาราง error_logs — ห้ามโยน error ต่อ (การบันทึกล้มเหลวต้องไม่ทำให้หน้าพังซ้ำ)
// error เดิม (ข้อความ + หน้าเดียวกัน) ภายใน 1 ชั่วโมง รวมเป็นแถวเดียวแล้วนับเพิ่ม
// มี error ใหม่ → ส่งอีเมลแจ้ง ERROR_ALERT_EMAIL (ถ้าตั้งไว้) ไม่เกิน 1 ฉบับต่อ 10 นาที

export type ErrorInput = {
  source: "SERVER" | "CLIENT";
  message: string;
  digest?: string | null;
  path?: string | null;
  routeType?: string | null;
  stack?: string | null;
  userAgent?: string | null;
};

// error ปกติของ Next.js (redirect / notFound) ไม่ใช่บั๊ก
const IGNORED = /^(NEXT_REDIRECT|NEXT_NOT_FOUND|NEXT_HTTP_ERROR_FALLBACK|DYNAMIC_SERVER_USAGE)/;

const cut = (s: string | null | undefined, n: number) => (s ? s.slice(0, n) : null);

export async function logError(input: ErrorInput) {
  try {
    const message = cut(input.message?.trim() || "(ไม่มีข้อความ)", 1000)!;
    if (IGNORED.test(input.digest ?? "") || IGNORED.test(message)) return;
    const path = cut(input.path?.split("?")[0] ?? null, 300);
    const now = new Date();

    const existing = await prisma.errorLog.findFirst({
      where: { source: input.source, message, path, resolved: false, lastSeenAt: { gte: new Date(now.getTime() - 3600_000) } },
      select: { id: true },
    });
    if (existing) {
      await prisma.errorLog.update({ where: { id: existing.id }, data: { count: { increment: 1 }, lastSeenAt: now } });
      return;
    }
    await prisma.errorLog.create({
      data: {
        source: input.source,
        message,
        digest: cut(input.digest, 100),
        path,
        routeType: cut(input.routeType, 40),
        stack: cut(input.stack, 4000),
        userAgent: cut(input.userAgent, 300),
      },
    });
    await notify(message, path, input.source);
  } catch (err) {
    console.error("[error-log] บันทึกไม่สำเร็จ", err);
  }
}

async function notify(message: string, path: string | null, source: string) {
  const to = process.env.ERROR_ALERT_EMAIL;
  if (!to || !isEmailConfigured()) return;
  // ส่งได้ไม่เกิน 1 ฉบับต่อ 10 นาที (ถ้าระบบมีปัญหาหนัก จะไม่ส่งอีเมลรัว)
  const recent = await prisma.errorLog.count({ where: { firstSeenAt: { gte: new Date(Date.now() - 600_000) } } });
  if (recent > 1) return;
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://technical-fa-thailand.vercel.app";
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  await sendEmail({
    to,
    subject: `[FA Thailand Technical] พบข้อผิดพลาดใหม่${path ? ` ที่ ${path}` : ""}`,
    html: `<p>ระบบพบข้อผิดพลาดใหม่ (${source})</p><p><b>หน้า:</b> ${esc(path ?? "-")}<br/><b>ข้อความ:</b> ${esc(message)}</p><p><a href="${site}/errors">ดูรายละเอียดในหน้าบันทึกข้อผิดพลาด</a></p>`,
  }).catch((err) => console.error("[error-log] ส่งอีเมลแจ้งเตือนไม่สำเร็จ", err));
}
