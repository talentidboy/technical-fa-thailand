import {
  getAllProvinces,
  getProvincesByCriterion,
  getDistrictsByCriterion,
  getSubdistrictsByCriterion,
} from "geothai";

export type AddressOption = {
  code: string;
  nameTh: string;
  nameEn: string;
};

export type SubdistrictOption = AddressOption & { postalCode: string };

export function getProvinceOptions(): AddressOption[] {
  return getAllProvinces()
    .map((p) => ({ code: String(p.code), nameTh: p.name_th, nameEn: p.name_en }))
    .sort((a, b) => a.nameTh.localeCompare(b.nameTh, "th"));
}

export function getDistrictOptions(provinceCode: string): AddressOption[] {
  const code = Number(provinceCode);
  if (!code) return [];
  return getDistrictsByCriterion({ province_code: code })
    .map((d) => ({ code: String(d.code), nameTh: d.name_th, nameEn: d.name_en }))
    .sort((a, b) => a.nameTh.localeCompare(b.nameTh, "th"));
}

export function getSubdistrictOptions(districtCode: string): SubdistrictOption[] {
  const code = Number(districtCode);
  if (!code) return [];
  return getSubdistrictsByCriterion({ district_code: code })
    .map((s) => ({
      code: String(s.code),
      nameTh: s.name_th,
      nameEn: s.name_en,
      postalCode: String(s.postal_code),
    }))
    .sort((a, b) => a.nameTh.localeCompare(b.nameTh, "th"));
}

function findProvince(code?: string | null) {
  if (!code) return null;
  return getProvincesByCriterion({ code: Number(code) })[0] ?? null;
}

function findDistrict(code?: string | null) {
  if (!code) return null;
  return getDistrictsByCriterion({ code: Number(code) })[0] ?? null;
}

function findSubdistrict(code?: string | null) {
  if (!code) return null;
  return getSubdistrictsByCriterion({ code: Number(code) })[0] ?? null;
}

export function getProvinceNameByCode(code?: string | null): string | null {
  return findProvince(code)?.name_th ?? null;
}

export function getDistrictNameByCode(code?: string | null): string | null {
  return findDistrict(code)?.name_th ?? null;
}

export function getSubdistrictNameByCode(code?: string | null): string | null {
  return findSubdistrict(code)?.name_th ?? null;
}

// จัดรูปแบบที่อยู่จากรหัสจังหวัด/อำเภอ/ตำบลที่บันทึกไว้ ให้เป็นข้อความอ่านง่าย
// คืนค่า null ถ้าไม่มีข้อมูลโครงสร้างใหม่เลย (ให้ผู้เรียกใช้ fallback ไปที่ residence เดิม)
export function formatThaiAddress(coach: {
  provinceCode?: string | null;
  districtCode?: string | null;
  subdistrictCode?: string | null;
}): string | null {
  const subdistrict = findSubdistrict(coach.subdistrictCode);
  const district = subdistrict
    ? getDistrictsByCriterion({ code: subdistrict.district_code })[0]
    : findDistrict(coach.districtCode);
  const province = subdistrict
    ? getProvincesByCriterion({ code: subdistrict.province_code })[0]
    : district
      ? getProvincesByCriterion({ code: district.province_code })[0]
      : findProvince(coach.provinceCode);

  const parts: string[] = [];
  if (subdistrict) parts.push(`ตำบล${subdistrict.name_th}`);
  if (district) parts.push(`อำเภอ${district.name_th}`);
  if (province) parts.push(`จังหวัด${province.name_th}`);
  if (subdistrict) parts.push(String(subdistrict.postal_code));

  return parts.length > 0 ? parts.join(" ") : null;
}
