// สถิติโครงการฟุตบอลรากหญ้ารายปี (ตัวเลขสรุปเท่านั้น ไม่มีข้อมูลรายคน) — ใช้ทั้งหน้า Grassroots Football และหน้าแรก
// เพิ่มปีใหม่: เพิ่มรายการใน SEASONS (หน้าเว็บแสดงปีล่าสุดเป็นค่าเริ่มต้น และให้เลือกดูปีอื่นได้) · ยอดรวม = ชาย + หญิง
// · 2025: รายงานสรุปโครงการ (มีจังหวัดแค่ 5 อันดับแรก)
// · 2026: นับจากแบบฟอร์มลงทะเบียนเข้าร่วมกิจกรรม (โค้ช / เด็ก) — ทุกแถวในแท็บคำตอบหลัก ไม่ตัดคนที่ลงทะเบียนซ้ำ
//   จังหวัดของผู้เข้าร่วม = จังหวัดที่จัดกิจกรรม (ถ้าเว้นว่างใช้จังหวัดที่อาศัย) · จำนวนจังหวัดที่จัดกิจกรรมนับจากช่องจังหวัดที่จัดกิจกรรมเท่านั้น

export type CountRow = { label: string; count: number };
export type ProvinceRow = { name: string; count: number };

type Season = {
  year: number;
  source: string;
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
};

const SEASONS: Season[] = [
  {
    year: 2026,
    source: "แบบฟอร์มลงทะเบียนเข้าร่วมกิจกรรม ปี 2026 (โค้ชและเด็ก)",
    playersMale: 556,
    playersFemale: 562,
    coachesMale: 263,
    coachesFemale: 62,
    coachesNoLicence: 278,
    provinces: 17,
    playerAges: [{ label: "2–7 ปี", count: 54 }, { label: "8–10 ปี", count: 242 }, { label: "11–12 ปี", count: 455 }, { label: "13–15 ปี", count: 356 }, { label: "16 ปีขึ้นไป", count: 8 }],
    coachLicences: [{ label: "G-Diploma", count: 31 }, { label: "C-Diploma", count: 10 }, { label: "B-Diploma", count: 5 }, { label: "A-Diploma", count: 1 }],
    playerProvinces: [{ name: "นครพนม", count: 406 }, { name: "สตูล", count: 143 }, { name: "สมุทรปราการ", count: 88 }, { name: "ชลบุรี", count: 86 }, { name: "ระยอง", count: 81 }, { name: "สระแก้ว", count: 49 }, { name: "นราธิวาส", count: 42 }, { name: "กรุงเทพมหานคร", count: 40 }, { name: "ปทุมธานี", count: 40 }, { name: "ชัยภูมิ", count: 23 }, { name: "ขอนแก่น", count: 19 }, { name: "หนองคาย", count: 17 }, { name: "สุราษฎร์ธานี", count: 12 }, { name: "นนทบุรี", count: 9 }, { name: "ฉะเชิงเทรา", count: 6 }, { name: "พระนครศรีอยุธยา", count: 6 }, { name: "สระบุรี", count: 6 }, { name: "สุรินทร์", count: 4 }, { name: "นครปฐม", count: 3 }, { name: "มุกดาหาร", count: 2 }, { name: "นครราชสีมา", count: 2 }, { name: "สมุทรสาคร", count: 2 }, { name: "อุดรธานี", count: 2 }, { name: "ยโสธร", count: 2 }, { name: "สงขลา", count: 1 }, { name: "มหาสารคาม", count: 1 }, { name: "ปราจีนบุรี", count: 1 }, { name: "สุพรรณบุรี", count: 1 }, { name: "จันทบุรี", count: 1 }, { name: "ลพบุรี", count: 1 }, { name: "สมุทรสงคราม", count: 1 }, { name: "ประจวบคีรีขันธ์", count: 1 }],
    coachProvinces: [{ name: "สุราษฎร์ธานี", count: 99 }, { name: "นครพนม", count: 61 }, { name: "ขอนแก่น", count: 48 }, { name: "ระยอง", count: 43 }, { name: "ชลบุรี", count: 23 }, { name: "สตูล", count: 19 }, { name: "บุรีรัมย์", count: 19 }, { name: "กรุงเทพมหานคร", count: 2 }, { name: "นราธิวาส", count: 2 }, { name: "ชัยภูมิ", count: 1 }, { name: "อุดรธานี", count: 1 }, { name: "เลย", count: 1 }],
  },
  {
    year: 2025,
    source: "รายงานสรุปโครงการฟุตบอลรากหญ้า ปี 2025",
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
  return {
    year: s.year,
    source: s.source,
    provinces: s.provinces,
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
