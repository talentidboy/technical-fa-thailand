// สถิติโครงการฟุตบอลรากหญ้ารายปี (ตัวเลขสรุปเท่านั้น ไม่มีข้อมูลรายคน) — ใช้ทั้งหน้า Grassroots Football และหน้าแรก
// เพิ่มปีใหม่: เพิ่มรายการใน SEASONS (หน้าเว็บแสดงปีล่าสุดเป็นค่าเริ่มต้น และให้เลือกดูปีอื่นได้) · ยอดรวม = ชาย + หญิง
// · 2025: รายงานสรุปโครงการ (มีจังหวัดแค่ 5 อันดับแรก)
// · 2026: นับจากแบบฟอร์มลงทะเบียนเข้าร่วมกิจกรรม (โค้ช / เด็ก) — ทุกแถวในแท็บคำตอบหลัก ไม่ตัดคนที่ลงทะเบียนซ้ำ
//   จังหวัดของผู้เข้าร่วม = จังหวัดที่จัดกิจกรรม (ถ้าเว้นว่างใช้จังหวัดที่อาศัย) · จำนวนจังหวัดที่จัดกิจกรรมนับจากช่องจังหวัดที่จัดกิจกรรมเท่านั้น

export type CountRow = { label: string; count: number };
export type GenderRow = { label: string; male: number; female: number };
export type ProvinceRow = { name: string; count: number; male?: number; female?: number };
export type GrassrootsEvent = { date: string; province: string; coaches: number };

type Season = {
  year: number;
  source: string;
  sourceEn: string;
  playersMale: number;
  playersFemale: number;
  coachesMale: number;
  coachesFemale: number;
  coachesNoLicence: number;
  // จำนวนจังหวัดที่จัดกิจกรรม
  provinces: number;
  playerAges: CountRow[];
  coachLicences: CountRow[];
  playerProvinces: ProvinceRow[];
  coachProvinces: ProvinceRow[];
  // ตัวเลขละเอียด (มีเฉพาะปีที่คำนวณจากแบบฟอร์มรายคน) — ไม่มี = ไม่แสดงส่วนนั้น
  detail?: {
    playerAgeGender: GenderRow[];
    playerSingleAges: CountRow[];
    // อายุต่ำกว่า 5 ปีหรืออ่านไม่ได้ (น่าจะกรอกผิด)
    playerAgeUnclear: number;
    playerSchools: number;
    coachAges: CountRow[];
    coachAverageAge: number;
    coachFirstTime: number;
    coachReturning: number;
    coachOrganisations: number;
    coachLicenceGender: GenderRow[];
    // กิจกรรมหลัก: วันที่ + จังหวัดที่ผู้ฝึกสอนกรอก (เฉพาะที่มีผู้ฝึกสอนลงทะเบียน 5 คนขึ้นไป)
    events: GrassrootsEvent[];
  };
};

const SEASONS: Season[] = [
  {
    year: 2026,
    source: "แบบฟอร์มลงทะเบียนเข้าร่วมกิจกรรม ปี 2026 (โค้ชและเด็ก)",
    sourceEn: "2026 activity registration forms (coaches and players)",
    playersMale: 556,
    playersFemale: 562,
    coachesMale: 263,
    coachesFemale: 62,
    coachesNoLicence: 278,
    provinces: 17,
    playerAges: [{ label: "2–7 ปี", count: 54 }, { label: "8–10 ปี", count: 242 }, { label: "11–12 ปี", count: 455 }, { label: "13–15 ปี", count: 356 }, { label: "16 ปีขึ้นไป", count: 8 }],
    coachLicences: [{ label: "G-Diploma", count: 31 }, { label: "C-Diploma", count: 10 }, { label: "B-Diploma", count: 5 }, { label: "A-Diploma", count: 1 }],
    playerProvinces: [{ name: "นครพนม", count: 406, male: 3, female: 403 }, { name: "สตูล", count: 143, male: 139, female: 4 }, { name: "สมุทรปราการ", count: 88, male: 82, female: 6 }, { name: "ชลบุรี", count: 86, male: 0, female: 86 }, { name: "ระยอง", count: 81, male: 70, female: 11 }, { name: "สระแก้ว", count: 49, male: 45, female: 4 }, { name: "นราธิวาส", count: 42, male: 41, female: 1 }, { name: "กรุงเทพมหานคร", count: 40, male: 36, female: 4 }, { name: "ปทุมธานี", count: 40, male: 33, female: 7 }, { name: "ชัยภูมิ", count: 23, male: 18, female: 5 }, { name: "ขอนแก่น", count: 19, male: 19, female: 0 }, { name: "หนองคาย", count: 17, male: 13, female: 4 }, { name: "สุราษฎร์ธานี", count: 12, male: 12, female: 0 }, { name: "นนทบุรี", count: 9, male: 9, female: 0 }, { name: "ฉะเชิงเทรา", count: 6, male: 0, female: 6 }, { name: "พระนครศรีอยุธยา", count: 6, male: 6, female: 0 }, { name: "สระบุรี", count: 6, male: 4, female: 2 }, { name: "สุรินทร์", count: 4, male: 0, female: 4 }, { name: "นครปฐม", count: 3, male: 3, female: 0 }, { name: "มุกดาหาร", count: 2, male: 1, female: 1 }, { name: "นครราชสีมา", count: 2, male: 2, female: 0 }, { name: "สมุทรสาคร", count: 2, male: 2, female: 0 }, { name: "อุดรธานี", count: 2, male: 0, female: 2 }, { name: "ยโสธร", count: 2, male: 0, female: 2 }, { name: "สงขลา", count: 1, male: 1, female: 0 }, { name: "มหาสารคาม", count: 1, male: 0, female: 1 }, { name: "ปราจีนบุรี", count: 1, male: 0, female: 1 }, { name: "สุพรรณบุรี", count: 1, male: 0, female: 1 }, { name: "จันทบุรี", count: 1, male: 0, female: 1 }, { name: "ลพบุรี", count: 1, male: 1, female: 0 }, { name: "สมุทรสงคราม", count: 1, male: 1, female: 0 }, { name: "ประจวบคีรีขันธ์", count: 1, male: 1, female: 0 }],
    coachProvinces: [{ name: "สุราษฎร์ธานี", count: 99 }, { name: "นครพนม", count: 61 }, { name: "ขอนแก่น", count: 48 }, { name: "ระยอง", count: 43 }, { name: "ชลบุรี", count: 23 }, { name: "สตูล", count: 19 }, { name: "บุรีรัมย์", count: 19 }, { name: "กรุงเทพมหานคร", count: 2 }, { name: "นราธิวาส", count: 2 }, { name: "ชัยภูมิ", count: 1 }, { name: "อุดรธานี", count: 1 }, { name: "เลย", count: 1 }],
    detail: {
      playerAgeGender: [{ label: "2–7 ปี", male: 46, female: 8 }, { label: "8–10 ปี", male: 194, female: 48 }, { label: "11–12 ปี", male: 253, female: 202 }, { label: "13–15 ปี", male: 61, female: 295 }, { label: "16 ปีขึ้นไป", male: 0, female: 8 }],
      playerSingleAges: [{ label: "5", count: 2 }, { label: "6", count: 17 }, { label: "7", count: 34 }, { label: "8", count: 49 }, { label: "9", count: 84 }, { label: "10", count: 109 }, { label: "11", count: 230 }, { label: "12", count: 225 }, { label: "13", count: 133 }, { label: "14", count: 154 }, { label: "15", count: 69 }, { label: "16+", count: 8 }],
      playerAgeUnclear: 4,
      playerSchools: 408,
      coachAges: [{ label: "ต่ำกว่า 20 ปี", count: 22 }, { label: "20–29 ปี", count: 105 }, { label: "30–39 ปี", count: 109 }, { label: "40–49 ปี", count: 56 }, { label: "50–59 ปี", count: 31 }, { label: "60 ปีขึ้นไป", count: 2 }],
      coachAverageAge: 33.4,
      coachFirstTime: 255,
      coachReturning: 70,
      coachOrganisations: 196,
      coachLicenceGender: [{ label: "G-Diploma", male: 28, female: 3 }, { label: "C-Diploma", male: 8, female: 2 }, { label: "B-Diploma", male: 5, female: 0 }, { label: "A-Diploma", male: 1, female: 0 }],
      events: [{ date: "2026-01-28", province: "สุราษฎร์ธานี", coaches: 18 }, { date: "2026-01-29", province: "สุราษฎร์ธานี", coaches: 20 }, { date: "2026-01-30", province: "ระยอง", coaches: 39 }, { date: "2026-01-30", province: "สุราษฎร์ธานี", coaches: 10 }, { date: "2026-02-01", province: "สุราษฎร์ธานี", coaches: 18 }, { date: "2026-02-21", province: "สุราษฎร์ธานี", coaches: 7 }, { date: "2026-02-27", province: "บุรีรัมย์", coaches: 18 }, { date: "2026-03-08", province: "ชลบุรี", coaches: 23 }, { date: "2026-05-17", province: "นครพนม", coaches: 60 }, { date: "2026-05-21", province: "สุราษฎร์ธานี", coaches: 5 }, { date: "2026-05-23", province: "สตูล", coaches: 19 }, { date: "2026-06-27", province: "สุราษฎร์ธานี", coaches: 6 }, { date: "2026-07-11", province: "ขอนแก่น", coaches: 46 }],
    },
  },
  {
    year: 2025,
    source: "รายงานสรุปโครงการฟุตบอลรากหญ้า ปี 2025",
    sourceEn: "Grassroots Football programme summary report 2025",
    playersMale: 2414,
    playersFemale: 474,
    coachesMale: 446,
    coachesFemale: 72,
    coachesNoLicence: 387,
    provinces: 18,
    playerAges: [{ label: "2–7 ปี", count: 93 }, { label: "8–10 ปี", count: 1006 }, { label: "11–12 ปี", count: 1496 }, { label: "13–15 ปี", count: 293 }],
    coachLicences: [{ label: "G-Diploma", count: 80 }, { label: "C-Diploma", count: 27 }, { label: "T-License", count: 10 }],
    playerProvinces: [{ name: "สุราษฎร์ธานี", count: 799 }, { name: "ชลบุรี", count: 487 }, { name: "สงขลา", count: 267 }, { name: "ร้อยเอ็ด", count: 148 }, { name: "น่าน", count: 134 }],
    coachProvinces: [{ name: "สุราษฎร์ธานี", count: 107 }, { name: "ชลบุรี", count: 88 }, { name: "สงขลา", count: 65 }, { name: "ภูเก็ต", count: 62 }, { name: "น่าน", count: 48 }],
  },
];

const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);
const byCount = (rows: ProvinceRow[]) => [...rows].sort((a, b) => b.count - a.count);

// รูปแบบที่หน้าเว็บใช้ (เปอร์เซ็นต์คำนวณจากจำนวน)
function toReport(s: Season) {
  const playersTotal = s.playersMale + s.playersFemale;
  const coachesTotal = s.coachesMale + s.coachesFemale;
  const sum = (rows: { count: number }[]) => rows.reduce((n, r) => n + r.count, 0);
  return {
    year: s.year,
    source: s.source,
    sourceEn: s.sourceEn,
    provinces: s.provinces,
    detail: s.detail ?? null,
    // ผู้เข้าร่วมที่ไม่มีจังหวัด (อ่านไม่ได้) — ปีที่มีข้อมูลรายจังหวัดครบเท่านั้น (ปีที่มีแค่ 5 อันดับแรกไม่นับ)
    unplacedPlayers: s.playerProvinces.length > 5 ? Math.max(0, playersTotal - sum(s.playerProvinces)) : 0,
    unplacedCoaches: s.coachProvinces.length > 5 ? Math.max(0, coachesTotal - sum(s.coachProvinces)) : 0,
    players: {
      total: playersTotal,
      male: s.playersMale,
      female: s.playersFemale,
      malePercent: pct(s.playersMale, playersTotal),
      femalePercent: pct(s.playersFemale, playersTotal),
      ageRanges: s.playerAges,
      byProvince: byCount(s.playerProvinces),
    },
    coaches: {
      total: coachesTotal,
      male: s.coachesMale,
      female: s.coachesFemale,
      malePercent: pct(s.coachesMale, coachesTotal),
      femalePercent: pct(s.coachesFemale, coachesTotal),
      noLicense: s.coachesNoLicence,
      licenses: s.coachLicences,
      byProvince: byCount(s.coachProvinces),
    },
  };
}
export type GrassrootsReport = ReturnType<typeof toReport>;

// ปีที่เลือก (ไม่ระบุหรือไม่มีปีนั้น = ปีล่าสุด) + รายการปีทั้งหมด (ใหม่ → เก่า)
export function getGrassroots(year?: number) {
  const sorted = [...SEASONS].sort((a, b) => b.year - a.year);
  const current = sorted.find((s) => s.year === year) ?? sorted[0];
  return { report: toReport(current), years: sorted.map((s) => s.year) };
}
