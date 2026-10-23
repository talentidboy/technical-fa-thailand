// ข้อมูลสถิติปี 2025 จากรายงานสรุปโครงการฟุตบอลรากหญ้า (ข้อมูลนิ่ง กรอกด้วยมือ ไม่ได้ดึงจากฐานข้อมูล)
// ใช้ทั้งหน้า Grassroots Football และหน้าแรก (เส้นทางพัฒนานักฟุตบอล)
export const GRASSROOTS_YEAR = 2025;

export const grassrootsCoaches = {
  total: 518,
  male: 446,
  malePercent: 86.1,
  female: 72,
  femalePercent: 13.9,
  provinces: 18,
  topProvinces: [
    { name: "สุราษฎร์ธานี", count: 107 },
    { name: "ชลบุรี", count: 88 },
    { name: "สงขลา", count: 65 },
    { name: "ภูเก็ต", count: 62 },
    { name: "น่าน", count: 48 },
  ],
  noLicense: 387,
  licenses: [
    { label: "G-Diploma", count: 80 },
    { label: "C-Diploma", count: 27 },
    { label: "T-License", count: 10 },
  ],
};

export const grassrootsPlayers = {
  total: 2888,
  male: 2414,
  malePercent: 83.6,
  female: 474,
  femalePercent: 16.4,
  provinces: 18,
  topProvinces: [
    { name: "สุราษฎร์ธานี", count: 799 },
    { name: "ชลบุรี", count: 487 },
    { name: "สงขลา", count: 267 },
    { name: "ร้อยเอ็ด", count: 148 },
    { name: "น่าน", count: 134 },
  ],
  ageRanges: [
    { label: "2–7 ปี", count: 93 },
    { label: "8–10 ปี", count: 1006 },
    { label: "11–12 ปี", count: 1496 },
    { label: "13–15 ปี", count: 293 },
  ],
};
