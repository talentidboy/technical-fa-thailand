import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentLicenseRecords, daysUntil, formatThaiDate } from "@/lib/license-renewal";
import { createNotifications, sendNotificationEmails, type NotificationInput } from "@/lib/notify";
import { isEmailConfigured, sendEmail } from "@/lib/email";

// งานอัตโนมัติรายวัน (Vercel Cron 08:00 น. — vercel.json)
// 1) แจ้งเตือนโค้ชที่ใบอนุญาตจะหมดอายุใน 90 / 30 วัน และเพิ่งหมดอายุ (แจ้งครั้งเดียวต่อรอบอายุ)
// 2) ส่งอีเมลของการแจ้งเตือนที่ค้าง  3) วันจันทร์: สรุปงานค้างให้แอดมินทางอีเมล
export const maxDuration = 60;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) return request.headers.get("authorization") === `Bearer ${secret}`;
  // ยังไม่ได้ตั้ง CRON_SECRET: รับเฉพาะคำขอจาก Vercel Cron (งานนี้ทำซ้ำได้ไม่เกิดผลเสีย — แจ้งเตือนมี key กันซ้ำ)
  return (request.headers.get("user-agent") ?? "").startsWith("vercel-cron");
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return new NextResponse("Unauthorized", { status: 401 });
  const now = new Date();

  // ===== 1) ใบอนุญาตใกล้หมด / เพิ่งหมด (ดูเฉพาะใบระดับสูงสุดของแต่ละสาย) =====
  const records = await prisma.licenseRecord.findMany({
    where: { expireDate: { gte: new Date(now.getTime() - 8 * 86_400_000), lte: new Date(now.getTime() + 91 * 86_400_000) } },
    select: { id: true, coachId: true, licenseType: true, issueDate: true, expireDate: true },
  });
  // ต้องเทียบกับใบอื่นของโค้ชคนเดียวกัน (ใบที่มีระดับสูงกว่าแล้วไม่ต้องแจ้ง)
  const coachIds = [...new Set(records.map((r) => r.coachId))];
  const allOfThoseCoaches = coachIds.length
    ? await prisma.licenseRecord.findMany({
        where: { coachId: { in: coachIds } },
        select: { id: true, coachId: true, licenseType: true, issueDate: true, expireDate: true },
      })
    : [];
  const current = new Set(currentLicenseRecords(allOfThoseCoaches).map((r) => r.id));
  const items: NotificationInput[] = [];
  for (const r of records) {
    if (!current.has(r.id) || !r.expireDate) continue;
    const days = daysUntil(r.expireDate, now);
    const cycle = r.expireDate.toISOString().slice(0, 10);
    if (days < 0 && days >= -7) {
      items.push({
        coachId: r.coachId,
        type: "LICENSE_EXPIRED",
        title: `ใบอนุญาต ${r.licenseType} หมดอายุแล้ว`,
        body: `หมดอายุเมื่อ ${formatThaiDate(r.expireDate)} — ยื่นขอต่ออายุได้ที่หน้าใบอนุญาตของฉัน`,
        href: "/me",
        key: `expired:${r.id}:${cycle}`,
      });
    } else if (days >= 0 && days <= 30) {
      items.push({
        coachId: r.coachId,
        type: "LICENSE_EXPIRING_30",
        title: `ใบอนุญาต ${r.licenseType} จะหมดอายุใน ${days} วัน`,
        body: `หมดอายุ ${formatThaiDate(r.expireDate)} — ยื่นขอต่ออายุได้ที่หน้าใบอนุญาตของฉัน`,
        href: "/me",
        key: `exp30:${r.id}:${cycle}`,
      });
    } else if (days > 30 && days <= 90) {
      items.push({
        coachId: r.coachId,
        type: "LICENSE_EXPIRING_90",
        title: `ใบอนุญาต ${r.licenseType} จะหมดอายุใน ${days} วัน`,
        body: `หมดอายุ ${formatThaiDate(r.expireDate)} — เตรียมหลักฐานการพัฒนาความรู้ (CPD) แล้วยื่นขอต่ออายุได้`,
        href: "/me",
        key: `exp90:${r.id}:${cycle}`,
      });
    }
  }
  const created = await createNotifications(items);

  // ===== 2) อีเมลที่ค้าง =====
  const emailed = await sendNotificationEmails(undefined, 50);

  // ===== 3) สรุปรายสัปดาห์ให้แอดมิน (วันจันทร์ตามเวลาไทย) =====
  let digest = false;
  const thaiDay = new Date(now.getTime() + 7 * 3600_000).getUTCDay();
  if ((thaiDay === 1 || request.nextUrl.searchParams.get("digest") === "1") && isEmailConfigured()) {
    const [renewals, applications, requests, errors, expiring] = await Promise.all([
      prisma.licenseRenewal.count({ where: { status: "PENDING" } }),
      prisma.application.count({ where: { status: "PENDING" } }),
      prisma.profileEditRequest.count({ where: { status: "PENDING" } }),
      prisma.errorLog.count({ where: { resolved: false } }),
      prisma.licenseRecord.count({ where: { expireDate: { gte: now, lte: new Date(now.getTime() + 30 * 86_400_000) } } }),
    ]);
    const admins = await prisma.systemUser.findMany({ where: { role: "ADMIN", isActive: true }, select: { email: true } });
    const to = [...new Set([process.env.ADMIN_DIGEST_EMAIL, ...admins.map((a) => a.email)].filter((e): e is string => !!e && e.includes("@")))];
    const site = process.env.NEXT_PUBLIC_SITE_URL || "https://technical-fa-thailand.vercel.app";
    const row = (label: string, n: number, path: string) => `<tr><td style="padding:4px 12px 4px 0">${label}</td><td style="padding:4px 12px 4px 0"><b>${n}</b></td><td><a href="${site}${path}">เปิด</a></td></tr>`;
    for (const email of to) {
      await sendEmail({
        to: email,
        subject: "[FA Thailand Technical] สรุปงานที่รอดำเนินการประจำสัปดาห์",
        html: `<p>สรุปงานที่รอดำเนินการ ณ ${formatThaiDate(now)}</p><table>${row("คำขอต่ออายุใบอนุญาต", renewals, "/renewals?tab=requests")}${row("ผู้สมัครอบรมรออนุมัติ", applications, "/course-sessions")}${row("คำขอแก้ไขข้อมูล", requests, "/requests")}${row("ใบอนุญาตหมดอายุใน 30 วัน", expiring, "/renewals?tab=expiring")}${row("ข้อผิดพลาดที่ยังไม่แก้", errors, "/errors")}</table>`,
      }).catch((err) => console.error("[cron] ส่งสรุปไม่สำเร็จ", email, err));
      digest = true;
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  return NextResponse.json({ ok: true, notificationsCreated: created.length, emailed, digest });
}
