// Academy Licensing — ใบอนุญาตรับรองมาตรฐานอคาเดมีของสมาคม (FAT Bronze / Silver / Gold)
// ประยุกต์จาก AFC Elite Youth Scheme (1–3 ดาว) · อคาเดมีระดับ Gold ยื่นขอรับรองระดับดาวของ AFC ผ่านสมาคมได้

export const ACADEMY_LEVELS = ["BRONZE", "SILVER", "GOLD"] as const;
export type AcademyLevel = (typeof ACADEMY_LEVELS)[number];

export const LEVEL_META: Record<AcademyLevel, { label: string; th: string; rank: number; badge: string; medal: string; text: string; hex: string }> = {
  BRONZE: {
    label: "Bronze",
    th: "ทองแดง",
    rank: 1,
    badge: "bg-orange-50 text-orange-800 ring-orange-200",
    medal: "from-orange-200 via-orange-400 to-amber-700",
    text: "text-orange-700",
    hex: "#b0662b", // สีเรียบ (หน้าสาธารณะ)
  },
  SILVER: {
    label: "Silver",
    th: "เงิน",
    rank: 2,
    badge: "bg-slate-100 text-slate-700 ring-slate-300",
    medal: "from-slate-100 via-slate-300 to-slate-500",
    text: "text-slate-600",
    hex: "#8a96a6",
  },
  GOLD: {
    label: "Gold",
    th: "ทอง",
    rank: 3,
    badge: "bg-amber-50 text-amber-800 ring-amber-300",
    medal: "from-yellow-100 via-amber-300 to-yellow-600",
    text: "text-amber-700",
    hex: "#c4962c",
  },
};

export const isLevel = (v: string | null | undefined): v is AcademyLevel => !!v && (ACADEMY_LEVELS as readonly string[]).includes(v);

// ระดับย่อยในทะเบียน (T1 / T2 / T3) = ลีกของสโมสรต้นสังกัด — ระดับ Gold สำหรับอคาเดมีของสโมสรไทยลีก 1 และ 2
export const tierLabel = (tier: string | null | undefined) => {
  if (!tier) return null;
  const m = tier.match(/^T(\d)$/i);
  return m ? `ไทยลีก ${m[1]}` : tier;
};
export const levelRank = (v: string | null | undefined) => (isLevel(v) ? LEVEL_META[v].rank : 0);

// สถานะที่เก็บในฐานข้อมูล
export const LICENCE_STATUS: Record<string, string> = {
  ACTIVE: "มีผล",
  SUPERSEDED: "เลื่อนระดับ / ต่ออายุแล้ว",
  REVOKED: "ระงับ",
};

// คำสั่งออกใบอนุญาต (หลังบ้าน): ออกใบแรก / ต่ออายุระดับเดิม / เปลี่ยนระดับ — สองแบบหลังแทนที่ใบเดิม
export const ISSUE_KINDS = { NEW: "ออกใบอนุญาต", RENEW: "ต่ออายุ", CHANGE: "เปลี่ยนระดับ" } as const;

// เตือนก่อนหมดอายุกี่วัน
export const EXPIRING_DAYS = 60;

export type LicenceLike = { id: number; level: string | null; status: string; approvedAt: Date | null; expiresAt: Date | null };

// ใบปัจจุบัน = ใบที่มีผลระดับสูงสุด (เท่ากันใช้ใบที่อนุมัติล่าสุด) · ไม่มีใบที่มีผล → ใบที่ถูกระงับล่าสุด (แสดงว่าระงับ)
export function currentLicence<T extends LicenceLike>(licences: T[]): T | null {
  const newest = (a: T, b: T) => (b.approvedAt?.getTime() ?? 0) - (a.approvedAt?.getTime() ?? 0) || b.id - a.id;
  const active = licences.filter((l) => l.status === "ACTIVE").sort((a, b) => levelRank(b.level) - levelRank(a.level) || newest(a, b));
  if (active.length) return active[0];
  return licences.filter((l) => l.status === "REVOKED").sort(newest)[0] ?? null;
}

export type AcademyState = "active" | "expiring" | "expired" | "pending" | "revoked" | "none";

export const STATE_META: Record<AcademyState, { label: string; tone: string }> = {
  active: { label: "มีผล", tone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  expiring: { label: "ใกล้หมดอายุ", tone: "bg-amber-50 text-amber-700 ring-amber-200" },
  expired: { label: "หมดอายุ", tone: "bg-red-50 text-red-700 ring-red-200" },
  pending: { label: "รอระบุระดับ", tone: "bg-sky-50 text-sky-700 ring-sky-200" },
  revoked: { label: "ระงับ", tone: "bg-red-50 text-red-700 ring-red-200" },
  none: { label: "ไม่มีใบอนุญาต", tone: "bg-slate-100 text-slate-600 ring-slate-200" },
};

export const daysUntil = (date: Date, now: Date) => Math.ceil((date.getTime() - now.getTime()) / 86_400_000);

export function licenceState(l: LicenceLike | null, now: Date): AcademyState {
  if (!l) return "none";
  if (l.status === "REVOKED") return "revoked";
  if (!isLevel(l.level)) return "pending";
  if (l.expiresAt) {
    const d = daysUntil(l.expiresAt, now);
    if (d < 0) return "expired";
    if (d <= EXPIRING_DAYS) return "expiring";
  }
  return "active";
}

// แสดงบนหน้าสาธารณะ: อคาเดมีที่ยังเปิดอยู่และมีใบอนุญาต (ยกเว้นถูกระงับ)
export const showPublicly = (active: boolean, state: AcademyState) => active && state !== "revoked" && state !== "none";

// เรียงรายชื่อ: Gold → Silver → Bronze → รอระบุระดับ แล้วตามชื่อ
export function compareAcademies(a: { nameEn: string; level: string | null }, b: { nameEn: string; level: string | null }) {
  return levelRank(b.level) - levelRank(a.level) || a.nameEn.localeCompare(b.nameEn, "en", { sensitivity: "base" });
}

export const thaiDate = (d: Date | null | undefined, month: "short" | "long" = "short") =>
  d ? d.toLocaleDateString("th-TH", { day: "numeric", month, year: "numeric", timeZone: "Asia/Bangkok" }) : "-";

// วันที่ YYYY-MM-DD ตามเวลาไทย (ค่าเริ่มต้นของช่อง input type=date)
export const bangkokDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(d);

// "YYYY-MM-DD" จากฟอร์ม → เที่ยงคืนเวลาไทย · ปี พ.ศ. (เกิน 2400) แปลงเป็น ค.ศ. ให้อัตโนมัติ
export function parseFormDate(raw: string): Date | null {
  const m = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]) > 2400 ? Number(m[1]) - 543 : Number(m[1]);
  const d = new Date(`${year}-${m[2]}-${m[3]}T00:00:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}
