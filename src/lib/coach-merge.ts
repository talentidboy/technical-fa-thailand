import { prisma } from "./prisma";
import { coachName } from "./coach-name";
import { normalizeCertNo } from "./cert-no";

// รวมประวัติผู้ฝึกสอนที่ซ้ำ: ย้ายใบอนุญาต / ใบสมัคร / ประวัติทำงาน / การแจ้งเตือน / บัญชี จาก "source" ไปไว้ที่ "target"
// ช่องข้อมูลที่ target ว่าง เติมจาก source แล้วลบ source — บันทึกสำเนาข้อมูล source ไว้ในบันทึกการแก้ไข

const digits = (s: string | null) => (s ? s.replace(/\D/g, "") : "");

async function load(id: number) {
  return prisma.coach.findUnique({
    where: { id },
    include: {
      systemUser: { select: { id: true, email: true } },
      licenseRecords: { select: { id: true, licenseType: true, certificateNo: true, issueDate: true, expireDate: true } },
      _count: { select: { employments: true, applications: true, notifications: true } },
    },
  });
}
type Loaded = NonNullable<Awaited<ReturnType<typeof load>>>;

// ตรวจก่อนรวม — คืนข้อความปัญหาที่ทำให้รวมไม่ได้ (ว่าง = รวมได้)
function conflicts(source: Loaded, target: Loaded) {
  const out: string[] = [];
  if (source.id === target.id) out.push("เลือกประวัติเดียวกัน");
  if (digits(source.idNumber) && digits(target.idNumber) && digits(source.idNumber) !== digits(target.idNumber))
    out.push("เลขบัตรประชาชนไม่ตรงกัน — น่าจะไม่ใช่คนเดียวกัน");
  if (source.afcId && target.afcId && source.afcId.trim().toUpperCase() !== target.afcId.trim().toUpperCase())
    out.push("AFC ID ไม่ตรงกัน — น่าจะไม่ใช่คนเดียวกัน");
  if (source.systemUser && target.systemUser) out.push("ทั้งสองประวัติมีบัญชีเข้าสู่ระบบ — ลบบัญชีของประวัติที่จะรวมออกก่อน");
  // 1 คน 1 ใบต่อ 1 ระดับ: ระดับเดียวกันแต่เลขที่ใบต่างกัน → ต้องลบใบที่ผิดออกก่อน
  for (const r of source.licenseRecords) {
    const t = target.licenseRecords.find((x) => x.licenseType === r.licenseType);
    if (t && r.certificateNo && t.certificateNo && normalizeCertNo(r.certificateNo) !== normalizeCertNo(t.certificateNo))
      out.push(`ใบระดับ ${r.licenseType} เลขที่ไม่ตรงกัน (${t.certificateNo} / ${r.certificateNo}) — ลบใบที่ผิดออกก่อน`);
  }
  return out;
}

const summary = (c: Loaded) => ({
  id: c.id,
  name: coachName(c),
  afcId: c.afcId,
  idTail: digits(c.idNumber).slice(-4) || null,
  licenses: c.licenseRecords.map((r) => r.licenseType),
  employments: c._count.employments,
  applications: c._count.applications,
  hasAccount: !!c.systemUser,
});

export async function previewMerge(sourceId: number, targetId: number) {
  const [source, target] = await Promise.all([load(sourceId), load(targetId)]);
  if (!source || !target) return { ok: false as const, error: "ไม่พบประวัติผู้ฝึกสอน" };
  return { ok: true as const, source: summary(source), target: summary(target), conflicts: conflicts(source, target) };
}

const FILLABLE = [
  "nameEn",
  "familyNameEn",
  "gender",
  "dob",
  "idNumber",
  "passportNumber",
  "email",
  "telNo",
  "nationality",
  "residence",
  "nationalityCode",
  "provinceCode",
  "districtCode",
  "subdistrictCode",
  "photoUrl",
] as const;

export async function mergeCoaches(sourceId: number, targetId: number) {
  const [source, target] = await Promise.all([load(sourceId), load(targetId)]);
  if (!source || !target) throw new Error("ไม่พบประวัติผู้ฝึกสอน");
  const problems = conflicts(source, target);
  if (problems.length) throw new Error(problems.join(" · "));

  // ช่องที่ target ว่าง → ใช้ของ source
  const fill: Record<string, unknown> = {};
  for (const key of FILLABLE) if (target[key] == null || target[key] === "") if (source[key] != null && source[key] !== "") fill[key] = source[key];
  if (!target.nameTh.trim() && source.nameTh.trim()) {
    fill.nameTh = source.nameTh;
    fill.surnameTh = source.surnameTh;
  }
  const moveAfc = !target.afcId && !!source.afcId;

  await prisma.$transaction(async (tx) => {
    // ใบอนุญาต: ระดับที่ target ไม่มี → ย้ายไป · ระดับที่มีทั้งคู่ (ใบเดียวกัน) → เติมช่องที่ target ว่างจากใบของ source
    // ย้ายใบสมัคร/ประวัติต่ออายุที่ผูกกับใบของ source มาที่ใบของ target แล้วลบใบซ้ำ (1 คน 1 ใบต่อ 1 ระดับ)
    for (const r of source.licenseRecords) {
      const t = target.licenseRecords.find((x) => x.licenseType === r.licenseType);
      if (!t) {
        await tx.licenseRecord.update({ where: { id: r.id }, data: { coachId: target.id } });
        continue;
      }
      await tx.licenseRecord.update({
        where: { id: t.id },
        data: { certificateNo: t.certificateNo ?? r.certificateNo, issueDate: t.issueDate ?? r.issueDate, expireDate: t.expireDate ?? r.expireDate },
      });
      await tx.licenseRenewal.updateMany({ where: { licenseRecordId: r.id }, data: { licenseRecordId: t.id } });
      const targetLinked = await tx.application.findFirst({ where: { licenseRecordId: t.id }, select: { id: true } });
      await tx.application.updateMany({ where: { licenseRecordId: r.id }, data: { licenseRecordId: targetLinked ? null : t.id } });
      await tx.licenseRecord.delete({ where: { id: r.id } });
    }
    await tx.employment.updateMany({ where: { coachId: source.id }, data: { coachId: target.id } });
    await tx.academyStaff.updateMany({ where: { coachId: source.id }, data: { coachId: target.id } });
    await tx.profileEditRequest.updateMany({ where: { coachId: source.id }, data: { coachId: target.id } });
    await tx.notification.updateMany({ where: { coachId: source.id }, data: { coachId: target.id } });
    // ใบสมัครรุ่นเดียวกันซ้ำ → เก็บของ target
    const targetSessions = new Set((await tx.application.findMany({ where: { coachId: target.id }, select: { courseSessionId: true } })).map((a) => a.courseSessionId));
    for (const a of await tx.application.findMany({ where: { coachId: source.id } })) {
      if (targetSessions.has(a.courseSessionId)) await tx.application.delete({ where: { id: a.id } });
      else await tx.application.update({ where: { id: a.id }, data: { coachId: target.id } });
    }
    if (source.systemUser) await tx.systemUser.update({ where: { id: source.systemUser.id }, data: { coachId: null } });
    await tx.coach.delete({ where: { id: source.id } }); // afcId (unique) ของ source หายไปก่อน แล้วจึงย้ายไป target ได้
    await tx.coach.update({ where: { id: target.id }, data: { ...fill, ...(moveAfc ? { afcId: source.afcId } : {}) } });
    if (source.systemUser) await tx.systemUser.update({ where: { id: source.systemUser.id }, data: { coachId: target.id } });
  });

  return {
    target: summary(target),
    // สำเนาข้อมูลประวัติที่ถูกรวม (เก็บในบันทึกการแก้ไข เผื่อต้องตรวจสอบภายหลัง)
    removed: {
      ...Object.fromEntries(Object.entries(source).filter(([k]) => !["licenseRecords", "_count", "systemUser"].includes(k))),
      licenses: source.licenseRecords,
      account: source.systemUser?.email ?? null,
    },
    filled: Object.keys(fill).concat(moveAfc ? ["afcId"] : []),
  };
}
