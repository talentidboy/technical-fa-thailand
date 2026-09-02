export const LICENSE_TYPES = [
  { value: "PRO", label: "PRO" },
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "G", label: "G" },
  { value: "ELITE_YOUTH", label: "ELITE YOUTH" },
  { value: "GK", label: "GK" },
  { value: "VDO", label: "VDO" },
];

export const RECORD_TYPES = [
  { value: "TRAINING", label: "Training (อบรมปกติ)" },
  { value: "EQUALIZATION", label: "Equalization (เทียบโอน)" },
];

export const GENDER_OPTIONS = [
  { value: "MALE", label: "ชาย" },
  { value: "FEMALE", label: "หญิง" },
  { value: "OTHER", label: "อื่นๆ" },
];

export const LICENSE_RANK_ORDER = [
  "PRO",
  "A",
  "ELITE_YOUTH",
  "B",
  "C",
  "G",
  "GK",
  "VDO",
];

// เส้นทางการอัปเกรดระดับหลักของผู้ฝึกสอน (จากต่ำไปสูง) ตามมาตรฐาน AFC Core Program
export const CORE_LICENSE_PROGRESSION = ["G", "C", "B", "A", "PRO"];

export const LICENSE_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "ยังไม่หมดอายุ" },
  { value: "EXPIRED", label: "หมดอายุแล้ว" },
];

// ใช้ในหน้า /users — จัดการเฉพาะบัญชี Admin/เจ้าหน้าที่เท่านั้น บัญชีผู้ฝึกสอนจัดการแยกที่ /coaches/accounts
export const ADMIN_STAFF_ROLES = [
  { value: "ADMIN", label: "ผู้ดูแลระบบ" },
  { value: "STAFF", label: "เจ้าหน้าที่" },
];

export const COURSE_TYPES = [
  { value: "LICENSE", label: "หลักสูตรตามระดับใบอนุญาต" },
  { value: "GENERAL", label: "อบรมทั่วไป" },
];

export const TRAINING_CENTRE_AREAS = [
  { value: "THE_GAME", label: "The Game" },
  { value: "PRACTICE", label: "Practice" },
  { value: "ENVIRONMENT", label: "Environment" },
];

export function labelFor(
  options: { value: string; label: string }[],
  value: string | null,
) {
  if (!value) return null;
  return options.find((opt) => opt.value === value)?.label ?? value;
}
