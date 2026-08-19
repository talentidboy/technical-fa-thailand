import { LICENSE_RANK_ORDER, CORE_LICENSE_PROGRESSION } from "./constants";
import { getLicenseStatus } from "./license-status";

type LicenseLike = {
  licenseType: string;
  expireDate: Date | null;
  issueDate: Date | null;
};

export function getHighestLicense<T extends LicenseLike>(
  records: T[],
): T | null {
  if (records.length === 0) return null;

  const active = records.filter(
    (r) => getLicenseStatus(r.expireDate) !== "expired",
  );
  const pool = active.length > 0 ? active : records;

  return [...pool].sort((a, b) => {
    const rankA = LICENSE_RANK_ORDER.indexOf(a.licenseType);
    const rankB = LICENSE_RANK_ORDER.indexOf(b.licenseType);
    if (rankA !== rankB) {
      return (rankA === -1 ? 999 : rankA) - (rankB === -1 ? 999 : rankB);
    }
    return (b.issueDate?.getTime() ?? 0) - (a.issueDate?.getTime() ?? 0);
  })[0];
}

// ระดับสูงสุดที่ผู้ฝึกสอนถืออยู่ในเส้นทางหลัก (G -> C -> B -> A -> PRO)
export function getHighestCoreLevel(records: { licenseType: string }[]) {
  let bestIndex = -1;
  for (const record of records) {
    const index = CORE_LICENSE_PROGRESSION.indexOf(record.licenseType);
    if (index > bestIndex) bestIndex = index;
  }
  return bestIndex === -1 ? null : CORE_LICENSE_PROGRESSION[bestIndex];
}

// ระดับถัดไปที่จะอัปเกรดได้ — คืนค่า null หากถึงระดับสูงสุด (PRO) แล้ว
export function getNextCoreLevel(currentLevel: string | null) {
  if (!currentLevel) return CORE_LICENSE_PROGRESSION[0];
  const index = CORE_LICENSE_PROGRESSION.indexOf(currentLevel);
  if (index === -1) return CORE_LICENSE_PROGRESSION[0];
  if (index === CORE_LICENSE_PROGRESSION.length - 1) return null;
  return CORE_LICENSE_PROGRESSION[index + 1];
}
