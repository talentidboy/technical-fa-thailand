export type LicenseStatus = "expired" | "expiring" | "active" | "unknown";

export function getLicenseStatus(expireDate: Date | null): LicenseStatus {
  if (!expireDate || isNaN(expireDate.getTime())) return "unknown";
  const now = Date.now();
  const daysLeft = (expireDate.getTime() - now) / (1000 * 60 * 60 * 24);
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 90) return "expiring";
  return "active";
}

export const LICENSE_STATUS_STYLES: Record<
  LicenseStatus,
  { label: string; className: string }
> = {
  expired: { label: "หมดอายุแล้ว", className: "bg-red-50 text-red-600" },
  expiring: { label: "ใกล้หมดอายุ", className: "bg-amber-50 text-amber-600" },
  active: { label: "ใช้งานได้", className: "bg-emerald-50 text-emerald-600" },
  unknown: { label: "ไม่มีวันหมดอายุ", className: "bg-slate-100 text-slate-500" },
};
