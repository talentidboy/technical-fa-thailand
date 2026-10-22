// ความครบถ้วนของข้อมูลผู้ฝึกสอน — ใช้ทั้งหน้าโค้ช (ชวนกรอกให้ครบ) หน้าแอดมิน และรายงาน
// ไฟล์นี้ไม่แตะฐานข้อมูล ใช้ได้ทั้งฝั่ง server และ client

export type ProfileFields = {
  photoUrl: string | null;
  nameEn: string | null;
  familyNameEn: string | null;
  telNo: string | null;
  email: string | null;
  idNumber: string | null;
  passportNumber: string | null;
  dob: Date | null;
  gender: string | null;
  nationalityCode: string | null;
  nationality: string | null;
  provinceCode: string | null;
  residence: string | null;
};

// self = โค้ชแก้เองได้ในหน้าตั้งค่า · ช่องยืนยันตัวตน (เลขบัตร/วันเกิด) แก้ได้เฉพาะเจ้าหน้าที่
export const PROFILE_CHECKS: { key: string; label: string; why: string; self: boolean; ok: (c: ProfileFields) => boolean }[] = [
  { key: "photo", label: "รูปถ่าย", why: "ใช้บนบัตรประจำตัวและใบอนุญาต", self: true, ok: (c) => !!c.photoUrl },
  { key: "nameEn", label: "ชื่อ-นามสกุลภาษาอังกฤษ", why: "ใช้บนใบประกาศ AFC", self: true, ok: (c) => !!c.nameEn?.trim() && !!c.familyNameEn?.trim() },
  { key: "tel", label: "เบอร์โทรศัพท์", why: "ใช้ติดต่อเรื่องการอบรม", self: true, ok: (c) => !!c.telNo?.trim() },
  { key: "email", label: "อีเมล", why: "รับแจ้งเตือนใบอนุญาตใกล้หมดอายุ / ผลการอบรม", self: true, ok: (c) => !!c.email?.includes("@") },
  { key: "gender", label: "เพศ", why: "ใช้ในรายงานสถิติ", self: true, ok: (c) => !!c.gender },
  { key: "nationality", label: "สัญชาติ", why: "ใช้ในรายงานต่อ AFC", self: true, ok: (c) => !!(c.nationalityCode || c.nationality) },
  { key: "province", label: "จังหวัดที่อยู่", why: "ใช้จัดรุ่นอบรมตามภูมิภาค", self: true, ok: (c) => !!(c.provinceCode || c.residence) },
  { key: "idNumber", label: "เลขบัตรประชาชน / พาสปอร์ต", why: "ยืนยันตัวตน กันประวัติซ้ำ", self: false, ok: (c) => !!(c.idNumber || c.passportNumber) },
  { key: "dob", label: "วันเกิด", why: "ยืนยันตัวตน", self: false, ok: (c) => !!c.dob },
];

export function profileCompleteness(c: ProfileFields) {
  const missing = PROFILE_CHECKS.filter((x) => !x.ok(c));
  return {
    done: PROFILE_CHECKS.length - missing.length,
    total: PROFILE_CHECKS.length,
    percent: Math.round(((PROFILE_CHECKS.length - missing.length) / PROFILE_CHECKS.length) * 100),
    missing,
  };
}

export const profileSelect = {
  photoUrl: true,
  nameEn: true,
  familyNameEn: true,
  telNo: true,
  email: true,
  idNumber: true,
  passportNumber: true,
  dob: true,
  gender: true,
  nationalityCode: true,
  nationality: true,
  provinceCode: true,
  residence: true,
} as const;
