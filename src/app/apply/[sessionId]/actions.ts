"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { isValidThaiIdNumber } from "@/lib/validation";
import { saveUploadedPhoto } from "@/lib/upload";
import { getHighestCoreLevel, getNextCoreLevel } from "@/lib/license-rank";
import { LIVE_APPLICATION_STATUSES } from "@/lib/course-workflow";

export type ApplyState = { error: string; values: Record<string, string> } | null;

const FIELDS = ["idNumber", "dob", "telNo", "nameTh", "surnameTh", "nameEn", "familyNameEn", "gender", "email"] as const;

// สมัครอบรมสำหรับคนที่ยังไม่มีบัญชี — ใช้ข้อมูลในใบสมัครทำทุกอย่างในครั้งเดียว:
// เจอเลขบัตรประชาชนในระบบ = ผูกกับประวัติเดิม, ไม่เจอ = สร้างประวัติผู้ฝึกสอนใหม่ → สร้างบัญชี → ส่งใบสมัคร → เข้าสู่ระบบให้เลย
export async function applyToCourse(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const values = Object.fromEntries(FIELDS.map((k) => [k, String(formData.get(k) ?? "").trim()])) as Record<
    (typeof FIELDS)[number],
    string
  >;
  values.email = values.email.toLowerCase();
  const fail = (error: string): ApplyState => ({ error, values });
  const password = String(formData.get("password") ?? "");
  const sessionId = Number(formData.get("sessionId"));

  if (FIELDS.some((k) => k !== "gender" && !values[k]) || password.length < 8) {
    return fail("กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบ และตั้งรหัสผ่านอย่างน้อย 8 ตัวอักษร");
  }
  const idDigits = values.idNumber.replace(/\D/g, "");
  if (!isValidThaiIdNumber(idDigits)) return fail("เลขบัตรประชาชนไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
  const dob = new Date(values.dob);
  if (Number.isNaN(dob.getTime())) return fail("วันเกิดไม่ถูกต้อง");
  if (!/^\S+@\S+\.\S+$/.test(values.email)) return fail("รูปแบบอีเมลไม่ถูกต้อง");

  const session = await prisma.courseSession.findUnique({
    where: { id: sessionId },
    include: {
      course: true,
      _count: { select: { applications: { where: { status: { in: LIVE_APPLICATION_STATUSES } } } } },
    },
  });
  const now = new Date();
  if (!session || session.status !== "OPEN") return fail("รุ่นอบรมนี้ไม่เปิดรับสมัครแล้ว");
  if (session.applicationOpenDate && session.applicationOpenDate > now) return fail("ยังไม่ถึงวันเปิดรับสมัคร");
  if (session.applicationDeadline && session.applicationDeadline < now) return fail("หมดเขตรับสมัครแล้ว");
  if (session.capacity != null && session._count.applications >= session.capacity) return fail("รุ่นอบรมนี้เต็มแล้ว");

  if (await prisma.systemUser.findUnique({ where: { email: values.email } })) {
    return fail("อีเมลนี้มีบัญชีอยู่แล้ว — กรุณาเข้าสู่ระบบก่อน แล้วกดสมัครจากหน้านี้อีกครั้ง");
  }

  // หาประวัติเดิมด้วยเลขบัตร — ข้อมูลที่นำเข้ามีทั้งแบบติดกัน, มีขีด และเว้นวรรค
  const d = idDigits;
  const grouped = [d[0], d.slice(1, 5), d.slice(5, 10), d.slice(10, 12), d[12]];
  const existing = await prisma.coach.findFirst({
    where: { idNumber: { in: [d, grouped.join("-"), grouped.join(" ")] } },
    include: { systemUser: true, licenseRecords: { select: { licenseType: true } } },
  });

  if (existing?.systemUser) {
    return fail("เลขบัตรประชาชนนี้มีบัญชีอยู่แล้ว — กรุณาเข้าสู่ระบบ แล้วกดสมัครจากหน้านี้อีกครั้ง (ลืมรหัสผ่านติดต่อเจ้าหน้าที่)");
  }
  if (existing?.dob && existing.dob.toISOString().slice(0, 10) !== dob.toISOString().slice(0, 10)) {
    return fail("วันเกิดไม่ตรงกับข้อมูลเดิมในระบบ กรุณาตรวจสอบอีกครั้ง หรือติดต่อเจ้าหน้าที่");
  }
  // หลักสูตรตามระดับต้องเรียงขั้น — ตรวจได้เฉพาะคนที่มีประวัติในระบบ
  // คนที่ไม่พบประวัติให้สมัครได้ แล้วเจ้าหน้าที่ตรวจคุณสมบัติตอนอนุมัติ (อาจมีประวัติเดิมที่ยังไม่ได้บันทึกเลขบัตร)
  if (existing && session.course.courseType !== "GENERAL") {
    const next = getNextCoreLevel(getHighestCoreLevel(existing.licenseRecords));
    if (session.course.licenseType !== next) {
      return fail(
        next
          ? `ตามประวัติในระบบ คุณสมัครได้ที่ระดับ ${next} — หลักสูตรนี้ต้องผ่านระดับก่อนหน้าก่อน`
          : "ตามประวัติในระบบ คุณผ่านระดับสูงสุดแล้ว",
      );
    }
  }

  let photoUrl: string | null = null;
  try {
    photoUrl = await saveUploadedPhoto(formData.get("photo") as File | null);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "อัปโหลดรูปถ่ายไม่สำเร็จ");
  }

  const passwordHash = await hashPassword(password);
  const contact = {
    dob,
    telNo: values.telNo,
    email: values.email,
    ...(values.gender ? { gender: values.gender } : {}),
    ...(photoUrl ? { photoUrl } : {}),
  };

  let userId: number;
  try {
    userId = await prisma.$transaction(async (tx) => {
      // ประวัติเดิม: ไม่ทับชื่อทางการที่เจ้าหน้าที่บันทึกไว้ — เติมเฉพาะช่องที่ยังว่าง + อัปเดตช่องทางติดต่อ
      const coach = existing
        ? await tx.coach.update({
            where: { id: existing.id },
            data: {
              ...contact,
              nameEn: existing.nameEn ?? values.nameEn,
              familyNameEn: existing.familyNameEn ?? values.familyNameEn,
            },
          })
        : await tx.coach.create({
            data: {
              ...contact,
              idNumber: idDigits,
              nameTh: values.nameTh,
              surnameTh: values.surnameTh,
              nameEn: values.nameEn,
              familyNameEn: values.familyNameEn,
              nationalityCode: "TH",
            },
          });
      const user = await tx.systemUser.create({
        data: { email: values.email, passwordHash, role: "COACH", coachId: coach.id },
      });
      await tx.application.create({ data: { coachId: coach.id, courseSessionId: session.id, status: "PENDING" } });
      return user.id;
    });
  } catch {
    return fail("ส่งใบสมัครไม่สำเร็จ (อีเมลหรือข้อมูลอาจถูกใช้ไปแล้ว) กรุณาลองใหม่อีกครั้ง");
  }

  await createSession(userId);
  revalidatePath(`/course-sessions/${session.id}`);
  revalidatePath("/course-sessions");
  redirect("/me/courses?applied=1");
}
