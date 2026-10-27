// เกณฑ์มาตรฐาน FAT Academy Licensing ฉบับปี 2025 (2025 EDITION)
// ถอดจากตาราง "FAT Academy Licensing Criteria table 2025" ชีต "AL criteria 2025" — 3 หมวดหลัก แต่ละหัวข้อมีเกณฑ์ของระดับ ทองแดง / เงิน / ทอง (ช่องว่าง = ระดับนั้นไม่ต้องมี)
import type { AcademyLevel } from "./academy";

export type CriterionText = { th: string; en: string };
// [Bronze, Silver, Gold]
export type CriterionRow = [CriterionText | null, CriterionText | null, CriterionText | null];
export type CriteriaSub = { code: string; th: string; en: string; rows: CriterionRow[] };
export type CriteriaCategory = { no: number; th: string; en: string; subs: CriteriaSub[] };

const t = (th: string, en: string): CriterionText => ({ th, en });

export const LEVEL_INDEX: Record<AcademyLevel, 0 | 1 | 2> = { BRONZE: 0, SILVER: 1, GOLD: 2 };

export const ACADEMY_CRITERIA: CriteriaCategory[] = [
  {
    no: 1,
    th: "การจัดการและองค์กร",
    en: "Management & Organization",
    subs: [
      {
        code: "1.1",
        th: "การบริหาร",
        en: "Leadership",
        rows: [
          [t("ข้อมูลพื้นฐานของอคาเดมี", "Basic academy information"), t("ข้อมูลพื้นฐานของอคาเดมี", "Basic academy information"), t("ข้อมูลพื้นฐานของอคาเดมี", "Basic academy information")],
          [t("ผู้เป็นเจ้าของอคาเดมี", "The Academy owner"), t("จุดประสงค์ในการทำอคาเดมีของผู้เป็นเจ้าของอคาเดมี", "Written commitment to the Academy by the owner"), t("จุดประสงค์ในการทำอคาเดมีของผู้เป็นเจ้าของอคาเดมี", "Written commitment to the Academy by the owner")],
          [t("หัวหน้าอคาเดมีที่มีใบอนุญาตผู้ฝึกสอนขั้นต่ำในระดับ FAT G Diploma", "Head of the Academy with minimum FAT G Diploma"), t("หัวหน้าอคาเดมีที่มีใบอนุญาตผู้ฝึกสอนขั้นต่ำในระดับ AFC C License และมีสัญญาจ้าง", "Head of the Academy have a contract with minimum AFC C License"), t("หัวหน้าอคาเดมีที่มีใบอนุญาตผู้ฝึกสอนขั้นต่ำในระดับ AFC A License และมีสัญญาจ้าง", "Head of the Academy have a contract with minimum AFC A License")],
          [null, t("แนวทางในการพัฒนานักฟุตบอล", "Approach to player development"), t("ปรัชญาในการทำอคาเดมี และแนวทางในการพัฒนานักฟุตบอล", "Written football philosophy and an approach to player development")],
        ],
      },
      {
        code: "1.2",
        th: "องค์กร",
        en: "Organisation",
        rows: [
          [t("เจ้าหน้าที่ที่สนับสนุนงานแก่อคาเดมี", "Administrative support"), t("เจ้าหน้าที่ที่สนับสนุนงานแก่อคาเดมี", "Administrative support"), t("เจ้าหน้าที่ที่สนับสนุนงานแก่อคาเดมี", "Administrative support")],
          [null, t("เลขานุการของอคาเดมี", "Academy secretary"), t("เลขานุการของอคาเดมี", "Academy secretary")],
          [null, t("ผังองค์กรคณะผู้บริหารของอคาเดมี", "Academy Management structure"), t("ผังองค์กรคณะผู้บริหารของอคาเดมี", "Academy Management structure")],
        ],
      },
      {
        code: "1.3",
        th: "เจ้าหน้าที่/ผู้ฝึกสอน",
        en: "Staffing",
        rows: [
          [t("มีจำนวนผู้ฝึกสอนขั้นต่ำ 1 คน ที่มีใบอนุญาตผู้ฝึกสอนในระดับ FAT G Diploma", "Minimum 1 coach with minimum FAT G Diploma"), t("มีจำนวนผู้ฝึกสอนขั้นต่ำ 2 คน ที่มีใบอนุญาตผู้ฝึกสอนในระดับ FAT G Diploma", "Minimum 2 coaches with minimum FAT G Diploma"), t("มีจำนวนผู้ฝึกสอนขั้นต่ำ 1 คน ที่มีใบอนุญาตผู้ฝึกสอนในระดับ AFC B License และ มีจำนวนผู้ช่วยผู้ฝึกสอนขั้นต่ำ 1 คน ที่มีใบอนุญาตผู้ฝึกสอนในระดับ AFC C License", "Minimum 1 coach with minimum AFC B License and 1 assistant coach with minimum AFC C License")],
          [null, t("มีการประชุมเจ้าหน้าที่หรือผู้ฝึกสอน", "Regular staff meeting"), t("การประชุมเจ้าหน้าที่หรือผู้ฝึกสอน", "Regular staff meeting")],
          [null, null, t("กิจกรรมการพัฒนาศักยภาพของเจ้าหน้าที่หรือผู้ฝึกสอน", "Educational opportunities")],
          [null, null, t("ข้อตกลงความร่วมมือในการรับผู้ฝึกสอนเข้าศึกษา/ดูงาน", "Internship agreement")],
        ],
      },
      {
        code: "1.4",
        th: "การเงิน",
        en: "Finance",
        rows: [
          [t("งบประมาณประจำปี", "Annual budget"), t("เอกสารแสดงงบประมาณประจำปี", "Written annual budget"), t("เอกสารแสดงงบประมาณประจำปี", "Written annual budget")],
          [null, t("แหล่งที่มา/ผู้สนับสนุนงบประมาณ", "Supplier of budget"), t("มีงบประมาณเพียงพอสำหรับการดำเนินการอคาเดมี", "Work within its annual budget")],
          [null, null, t("แหล่งที่มา/ผู้สนับสนุนงบประมาณ", "Supplier of budget")],
        ],
      },
      {
        code: "1.5",
        th: "สนามและอุปกรณ์",
        en: "Facilities",
        rows: [
          [t("สนามฟุตบอลขนาดมาตรฐานสำหรับการฝึกซ้อมและการแข่งขัน", "A full-sided pitch for game and training"), t("สนามฟุตบอลขนาดมาตรฐานสำหรับการฝึกซ้อมและการแข่งขัน", "A full-sided pitch for game and training"), t("สนามฟุตบอลขนาดมาตรฐานสำหรับการฝึกซ้อมและการแข่งขัน", "A full-sided pitch for game and training")],
          [t("อุปกรณ์ต่าง ๆ มีความปลอดภัยและเพียงพอต่อการใช้งาน", "Adequate/Safe supply of equipment"), t("อุปกรณ์ต่าง ๆ มีความปลอดภัยและเพียงพอต่อการใช้งาน", "Adequate/Safe supply of equipment"), t("อุปกรณ์ต่างๆ มีความปลอดภัยและเพียงพอต่อการใช้งาน", "Adequate/Safe supply of equipment")],
          [null, null, t("จำนวนห้องพักนักกีฬามีเพียงพอต่อการใช้งาน", "Adequate dressing rooms reserved")],
          [null, null, t("จำนวนห้องฟิตเนส และห้องทำงานมีเพียงพอต่อการใช้งาน", "Adequate room for admin, fitness")],
        ],
      },
      {
        code: "1.6",
        th: "ทีม",
        en: "Team",
        rows: [
          [t("จำนวนนักกีฬาอย่างน้อย 10 คน", "At least 10 players"), t("จำนวนทีมอย่างน้อย 2 ทีม เช่น U14 U16", "At least 2 youth teams ie. U14 and U16"), t("จำนวนทีมอย่างน้อย 3 ทีม เช่น U14 U16 U18", "At least 3 youth teams ie. U14, U16 and U18")],
          [null, t("จำนวนนักกีฬาอย่างน้อย 18 คน และผู้รักษาประตู 2 คน ต่อรุ่น/นักกีฬาอย่างน้อย 12 คน และผู้รักษาประตู 2 คน ต่อรุ่น สำหรับทีม U12 หรือต่ำกว่า", "At least 18 players in each squad, including 2 goalkeepers/at least 12 players for U12 and below including 2 goalkeepers"), t("จำนวนนักกีฬาอย่างน้อย 18 คน และผู้รักษาประตู 2 คน ต่อรุ่น/นักกีฬาอย่างน้อย 12 คน และผู้รักษาประตู 2 คน ต่อรุ่น สำหรับทีม U12 หรือต่ำกว่า", "At least 18 players in each squad, including 2 goalkeepers/at least 12 players for U12 and below including 2 goalkeepers")],
        ],
      },
    ],
  },
  {
    no: 2,
    th: "โปรแกรมการฝึกสอน",
    en: "Coaching & Performance",
    subs: [
      {
        code: "2.1",
        th: "แผนการพัฒนา",
        en: "Planning",
        rows: [
          [t("ช่วงอายุของการพัฒนานักฟุตบอลระดับเยาวชน", "Stage of development"), t("ช่วงอายุของการพัฒนานักฟุตบอลระดับเยาวชน", "Stage of development"), t("ช่วงอายุของการพัฒนานักฟุตบอลระดับเยาวชน", "Stage of development")],
          [null, null, t("แผนการพัฒนานักฟุตบอลระดับเยาวชนของอคาเดมี", "Youth development plan for the Academy")],
        ],
      },
      {
        code: "2.2",
        th: "การคัดเลือกนักกีฬา",
        en: "Recruitment",
        rows: [
          [t("นโยบายในการคัดเลือกนักฟุตบอล", "Recruitment policy"), t("นโยบายในการคัดเลือกนักฟุตบอล", "Recruitment policy"), t("นโยบายในการคัดเลือกนักฟุตบอล", "Recruitment policy")],
          [null, t("ขั้นตอนการคัดเลือกนักฟุตบอล", "Identification process"), t("ขั้นตอนการคัดเลือกนักฟุตบอล", "Identification process")],
          [null, null, t("เอกสารรายงานข้อมูล/ผลการคัดเลือกนักฟุตบอล", "Scouting report")],
        ],
      },
      {
        code: "2.3",
        th: "การฝึกสอน",
        en: "Coaching",
        rows: [
          [t("หลักสูตรการฝึกสอน (เนื้อหา)", "Coaching Curriculum (Contents)"), t("หลักสูตรการฝึกสอน (เนื้อหา)", "Coaching Curriculum (Contents)"), t("หลักสูตรการฝึกสอน (เนื้อหาและเป้าหมาย)", "Coaching Curriculum (Contents & Goals)")],
          [null, t("ตัวอย่างแผนการฝึกซ้อม", "Example of training session"), t("ตัวอย่างแผนการฝึกซ้อม", "Example of training session")],
          [null, null, t("รูปแบบการฝึกซ้อม", "Training Method")],
        ],
      },
      {
        code: "2.4",
        th: "การแข่งขัน",
        en: "Playing",
        rows: [
          [null, t("จำนวนเกมการแข่งขัน อย่างน้อย 18 เกม สำหรับฟุตบอล 11 คน/อย่างน้อย 14 เกม สำหรับฟุตบอล 7 คน", "Regular match (at least 18 matches F11/14 Matches F7)"), t("จำนวนเกมการแข่งขัน อย่างน้อย 18 เกม สำหรับฟุตบอล 11 คน/อย่างน้อย 14 เกม สำหรับฟุตบอล 7 คน", "Regular match (at least 18 matches F11/14 Matches F7)")],
          [null, t("โปรแกรมการแข่งขันมีความเหมาะสมต่อช่วงอายุของนักฟุตบอลเยาวชน", "Match program appropriate for the stage of development"), t("โปรแกรมการแข่งขันมีความเหมาะสมต่อช่วงอายุของนักฟุตบอลเยาวชน", "Match program appropriate for the stage of development")],
          [null, null, t("แนวทางการกำหนดจำนวนเกมการแข่งขันของนักฟุตบอล", "Guidelines on playing time")],
        ],
      },
      {
        code: "2.5",
        th: "ประสิทธิภาพ นักฟุตบอล",
        en: "Player Performance",
        rows: [
          [t("การให้ข้อเสนอแนะแก่นักฟุตบอลด้วย วาจา หรือสื่อต่าง ๆ ฯลฯ", "Feedback to the players : verbal, DVD, etc."), t("การให้ข้อเสนอแนะแก่นักฟุตบอลด้วย วาจา หรือสื่อต่าง ๆ ฯลฯ", "Feedback to the players : verbal, DVD, etc."), t("การให้ข้อเสนอแนะแก่นักฟุตบอลด้วย วาจา หรือสื่อต่าง ๆ ฯลฯ", "Feedback to the players : verbal, DVD, etc.")],
          [null, null, t("เอกสารการประเมินนักฟุตบอล", "Match report")],
        ],
      },
      {
        code: "2.6",
        th: "ฟิตเนส",
        en: "Fitness",
        rows: [
          [t("โปรแกรมการฝึกซ้อมประจำสัปดาห์ไม่ต่ำกว่า 2 ครั้ง", "Weekly Training session (minimum 2 sessions)"), t("โปรแกรมการฝึกซ้อมประจำสัปดาห์ไม่ต่ำกว่า 2 ครั้ง", "Weekly Training session (minimum 2 sessions)"), t("โปรแกรมการฝึกซ้อมประจำสัปดาห์ไม่ต่ำกว่า 2 ครั้ง", "Weekly Training session (minimum 2 sessions)")],
          [null, t("การจัดสรรโปรแกรมการฝึกซ้อมให้เหมาะสมกับนักฟุตบอล", "Managed workload for players"), t("การจัดสรรโปรแกรมการฝึกซ้อมให้เหมาะสมกับนักฟุตบอล", "Managed workload for players")],
          [null, null, t("การทดสอบสมรรถภาพนักฟุตบอล", "Regular Fitness tests for players")],
        ],
      },
      {
        code: "2.7",
        th: "การประเมิน",
        en: "Assessment",
        rows: [
          [t("นโยบายและขั้นตอนในการดำเนินการปล่อยตัวนักกีฬาออกจากอคาเดมี", "Release policy/process"), t("นโยบายและขั้นตอนในการดำเนินการปล่อยตัวนักกีฬาออกจากอคาเดมี", "Release policy/process"), t("นโยบายและขั้นตอนในการดำเนินการปล่อยตัวนักกีฬาออกจากอคาเดมี", "Release policy/process")],
          [null, t("การประเมินทีมงาน", "Staff Assessment"), t("การประเมินทีมงาน", "Staff Assessment")],
        ],
      },
      {
        code: "2.8",
        th: "ผลงาน",
        en: "Results",
        rows: [
          [t("สร้างและพัฒนานักฟุตบอลเยาวชนที่มีคุณภาพ", "Produce players for higher level"), t("พัฒนานักฟุตบอลไปสู่โอกาสในการถูกคัดเลือกของทีมชาติ", "Produce players for national pre-selections"), t("พัฒนานักฟุตบอลไปสู่ระดับภูมิภาคและ โอกาสในการถูกคัดเลือกเข้าร่วมฝึกซ้อมกับทีมชาติ", "Produce players for regional selections, national trials etc.")],
          [null, t("รายงานผลการดำเนินงานประจำปี", "Annual report for the Club Board"), t("รายงานผลการดำเนินงานประจำปี", "Annual report for the Club Board")],
          [null, null, t("โอกาสในการร่วมฝึกซ้อมหรือทำการแข่งขันร่วมกับทีมชุดใหญ่ของสโมสร", "Opportunity to train or play with the first team. Link with first team")],
        ],
      },
    ],
  },
  {
    no: 3,
    th: "สุขภาพและสวัสดิการ",
    en: "Health & Welfare",
    subs: [
      {
        code: "3.1",
        th: "สุขภาพ",
        en: "Health",
        rows: [
          [t("มีการอบรมการปฐมพยาบาลเบื้องต้นแก่ผู้ฝึกสอน", "First Aid trained for coaches"), t("มีการอบรมการปฐมพยาบาลเบื้องต้นแก่ผู้ฝึกสอน", "First Aid trained for coaches"), t("มีการอบรมการปฐมพยาบาลเบื้องต้นแก่ผู้ฝึกสอน", "First Aid trained for coaches")],
          [null, t("การตรวจเช็คสุขภาพร่างกาย", "Regular health check-ups *recommended"), t("การตรวจเช็คสุขภาพร่างกาย", "Regular health check-ups *recommended")],
          [null, t("การสนับสนุนทางการแพทย์ ขั้นพื้นฐาน", "Basic medical support"), t("การสนับสนุนทางการแพทย์ ขั้นพื้นฐาน", "Basic medical support")],
          [null, null, t("โปรแกรมพัฒนาศักยภาพเพื่อป้องกันอาการบาดเจ็บ", "Injury-prevention program")],
        ],
      },
      {
        code: "3.2",
        th: "หลักจิตวิทยา",
        en: "Psychology",
        rows: [
          [t("การให้คำแนะนำด้านจิตวิทยาพื้นฐานแก่นักฟุตบอล", "The players have basic psychological advice"), t("การให้คำแนะนำด้านจิตวิทยาพื้นฐานแก่นักฟุตบอล", "The players have basic psychological advice"), t("การสนับสนุนในเรื่องความรู้/เข้าใจในตัวเอง ความสนใจ ความกระตือรือร้น ความเป็นผู้นำ ความมั่นใจ การตอบสนองภายใต้ความกดดัน การควบคุมอารมณ์ ความยืดหยุ่นทางอารมณ์แก่นักฟุตบอล", "The players have support/guidance on self-knowledge, attention, motivation, leadership, confidence, performance under pressure, emotional stability, emotional flexibility")],
        ],
      },
      {
        code: "3.3",
        th: "สวัสดิการ",
        en: "Welfare",
        rows: [
          [t("นโยบายการคุ้มครองเยาวชน", "Policy of child protection"), t("นโยบายการคุ้มครองเยาวชน", "Policy of child protection"), t("นโยบายการคุ้มครองเยาวชน", "Policy of child protection")],
          [null, null, t("การแนะนำหลักการใช้ชีวิตประจำวัน", "Lifestyle Guidelines")],
        ],
      },
      {
        code: "3.4",
        th: "การศึกษา",
        en: "Education",
        rows: [
          [null, t("ความร่วมมือในด้านการศึกษา", "Education Authorities cooperation"), t("ความร่วมมือในด้านการศึกษา", "Education Authorities cooperation")],
          [null, null, t("เอกสารรายงานผลการศึกษา", "Report of educational progress")],
        ],
      },
      {
        code: "3.5",
        th: "ความร่วมมือ",
        en: "Collaboration",
        rows: [
          [t("ช่องทางในการติดต่อ-สื่อสารกับผู้ปกครองของนักฟุตบอล", "The way to communicate with parents"), t("ช่องทางในการติดต่อ-สื่อสารกับผู้ปกครองของนักฟุตบอล", "The way to communicate with parents"), t("ช่องทางในการติดต่อ-สื่อสารกับผู้ปกครองของนักฟุตบอล", "The way to communicate with parents")],
          [null, t("ความร่วมมือกับสโมสรท้องถิ่น สมาคมประจำภูมิภาค ทีมชาติชุดเยาวชน สถานศึกษา", "Collaboration with local club, regional association, national youth team, schools."), t("ความร่วมมือกับ สโมสรท้องถิ่น สมาคมประจำภูมิภาค ทีมชาติชุดเยาวชน สถานศึกษา", "Collaboration with local club, regional association, national youth team, schools.")],
          [null, t("เข้าร่วม/จัดกิจกรรมที่สมาคมฯ เป็นผู้กำหนด", "Participate/Organize the FAT Activity"), t("การจัดกิจกรรมที่สมาคมฯ เป็นผู้กำหนด", "Organize the FAT Activity")],
          [null, null, t("กิจกรรมการให้ความรู้แก่ผู้ปกครองของนักฟุตบอล", "Education opportunities for parents")],
        ],
      },
      {
        code: "3.6",
        th: "กฎ/ระเบียบ",
        en: "Rules",
        rows: [
          [t("เอกสารบันทึกการเข้าร่วมฝึกซ้อม", "Attendance register"), t("เอกสารบันทึกการเข้าร่วมฝึกซ้อม", "Attendance register"), t("เอกสารบันทึกการเข้าร่วมฝึกซ้อม", "Attendance register")],
          [null, t("หลักการปฏิบัติของนักฟุตบอล เจ้าหน้าที่ ผู้ฝึกสอน และผู้ปกครอง", "Code of Conduct for players, staff and parents"), t("หลักการปฏิบัติของนักฟุตบอล เจ้าหน้าที่ ผู้ฝึกสอน และผู้ปกครอง", "Code of Conduct for players, staff and parents")],
          [null, null, t("ใบอนุญาตสโมสร (AFC Club Licensing)", "AFC Club Licensing – Sporting Criteria Comply")],
        ],
      },
    ],
  },
];

// จำนวนเกณฑ์ของแต่ละระดับ
export const criteriaCount = (level: AcademyLevel) =>
  ACADEMY_CRITERIA.reduce((n, c) => n + c.subs.reduce((m, s) => m + s.rows.filter((r) => r[LEVEL_INDEX[level]]).length, 0), 0);

// เกณฑ์ของระดับหนึ่งเป็นรายการเดียว — code = หัวข้อย่อย.ลำดับแถว (เช่น 1.1.3) ใช้ผูกหลักฐานในใบสมัคร
export type CriterionItem = { code: string; catNo: number; catTh: string; subCode: string; subTh: string; subEn: string; th: string; en: string };
export function criteriaList(level: AcademyLevel): CriterionItem[] {
  const i = LEVEL_INDEX[level];
  return ACADEMY_CRITERIA.flatMap((cat) =>
    cat.subs.flatMap((sub) =>
      sub.rows.flatMap((row, n) => {
        const cell = row[i];
        return cell ? [{ code: `${sub.code}.${n + 1}`, catNo: cat.no, catTh: cat.th, subCode: sub.code, subTh: sub.th, subEn: sub.en, th: cell.th, en: cell.en }] : [];
      }),
    ),
  );
}

// สรุประดับ (จากภาพประกอบของสมาคมฯ) — เหมาะกับใคร และข้อกำหนดหลัก
export const LEVEL_SUMMARY: Record<
  AcademyLevel,
  { title: string; th: string; audience: CriterionText; head: string; coaches: string; assistants?: string; teams: string; highlights: string[] }
> = {
  BRONZE: {
    title: "FAT Bronze Class",
    th: "อคาเดมีระดับทองแดง",
    audience: t("เหมาะสำหรับอคาเดมีเอกชนทั่วไป และอคาเดมีที่ต้องการเข้าร่วมกิจกรรมกับทางสมาคมฯ", "Enlisted for private academies and join FAT tournament"),
    head: "FAT G Diploma",
    coaches: "1 คน FAT G Diploma",
    teams: "นักกีฬาอย่างน้อย 10 คน",
    highlights: ["สนามฟุตบอลขนาดมาตรฐานสำหรับการฝึกซ้อมและการแข่งขัน", "อุปกรณ์ปลอดภัยและเพียงพอ", "มีนโยบายคุ้มครองเยาวชน"],
  },
  SILVER: {
    title: "FAT Silver Class",
    th: "อคาเดมีระดับเงิน",
    audience: t("เหมาะสำหรับโรงเรียนกีฬาทั่วประเทศ และอคาเดมีที่เข้าร่วมลีกเยาวชนของสมาคมฯ", "Encompassing sports schools and FAT youth leagues"),
    head: "AFC C License",
    coaches: "2 คน FAT G Diploma",
    teams: "2 ทีม (U14 / U16)",
    highlights: ["สนามฟุตบอลขนาดมาตรฐานสำหรับการฝึกซ้อมและการแข่งขัน", "แข่งขันอย่างน้อย 18 เกม (11 คน) / 14 เกม (7 คน)", "การสนับสนุนทางการแพทย์ขั้นพื้นฐาน", "มีนโยบายคุ้มครองเยาวชน"],
  },
  GOLD: {
    title: "FAT Gold Class",
    th: "อคาเดมีระดับทอง",
    audience: t("สำหรับอคาเดมีของสโมสรอาชีพระดับไทยลีก 1 และ 2", "Reserved for professional Thai League 1 & 2 club academies"),
    head: "AFC A License",
    coaches: "1 คน AFC B License",
    assistants: "1 คน AFC C License",
    teams: "3 ทีม (U14 / U16 / U18)",
    highlights: [
      "สนามฟุตบอลขนาดมาตรฐานสำหรับการฝึกซ้อมและการแข่งขัน",
      "ห้องพักนักกีฬา ห้องฟิตเนส และห้องทำงานเพียงพอ",
      "แข่งขันอย่างน้อย 18 เกม (11 คน) / 14 เกม (7 คน)",
      "โปรแกรมป้องกันอาการบาดเจ็บ",
      "มีนโยบายคุ้มครองเยาวชน",
    ],
  },
};
