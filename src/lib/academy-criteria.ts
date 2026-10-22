// เกณฑ์มาตรฐาน FAT Academy Licensing (โครงการ GROW TOGETHER · FIFA Talent Development Scheme)
// ถอดจากเอกสารเผยแพร่ของสมาคมฯ — 3 หมวดหลัก แต่ละหัวข้อมีเกณฑ์ของระดับ ทองแดง / เงิน / ทอง (ช่องว่าง = ระดับนั้นไม่ต้องมี)
import type { AcademyLevel } from "./academy";

export type CriterionText = { th: string; en: string };
// [Bronze, Silver, Gold]
export type CriterionRow = [CriterionText | null, CriterionText | null, CriterionText | null];
export type CriteriaSub = { code: string; th: string; en: string; rows: CriterionRow[] };
export type CriteriaCategory = { no: number; th: string; en: string; subs: CriteriaSub[] };

const t = (th: string, en: string): CriterionText => ({ th, en });
const all = (th: string, en: string): CriterionRow => [t(th, en), t(th, en), t(th, en)];
const fromSilver = (th: string, en: string): CriterionRow => [null, t(th, en), t(th, en)];
const goldOnly = (th: string, en: string): CriterionRow => [null, null, t(th, en)];

export const LEVEL_INDEX: Record<AcademyLevel, 0 | 1 | 2> = { BRONZE: 0, SILVER: 1, GOLD: 2 };

export const ACADEMY_CRITERIA: CriteriaCategory[] = [
  {
    no: 1,
    th: "การจัดการ และองค์กร",
    en: "Management & Organization",
    subs: [
      {
        code: "1.1",
        th: "ผู้นำองค์กร",
        en: "Leadership",
        rows: [
          all("ข้อมูลพื้นฐานของอคาเดมี", "Basic academy information"),
          [
            t("ผู้เป็นเจ้าของอคาเดมี", "The Academy owner"),
            t("จุดประสงค์ในการทำอคาเดมีของผู้เป็นเจ้าของอคาเดมี", "Written commitment to the Academy by the owner"),
            t("จุดประสงค์ในการทำอคาเดมีของผู้เป็นเจ้าของอคาเดมี", "Written commitment to the Academy by the owner"),
          ],
          [
            t("หัวหน้าอคาเดมีที่มีใบอนุญาตผู้ฝึกสอนขั้นต่ำในระดับ เอเอฟซี ซี ไลเซนส์", "Head of the Academy with minimum AFC C license"),
            t("หัวหน้าอคาเดมีที่มีใบอนุญาตผู้ฝึกสอนขั้นต่ำในระดับ เอเอฟซี บี ไลเซนส์ และมีสัญญาจ้าง", "Head of the Academy has a contract, with minimum AFC B license"),
            t("หัวหน้าอคาเดมีที่มีใบอนุญาตผู้ฝึกสอนขั้นต่ำในระดับ เอเอฟซี เอ ไลเซนส์ และมีสัญญาจ้าง", "Head of the Academy has a contract, with minimum AFC A license"),
          ],
          [
            null,
            t("แนวทางในการพัฒนานักฟุตบอล", "Approach to player development"),
            t("ปรัชญาในการทำอคาเดมี และแนวทางในการพัฒนานักฟุตบอล", "Written football philosophy and an approach to player development"),
          ],
        ],
      },
      {
        code: "1.2",
        th: "องค์กร",
        en: "Organisation",
        rows: [
          all("เจ้าหน้าที่ที่สนับสนุนงานแก่อคาเดมี", "Administrative support"),
          fromSilver("เลขานุการของอคาเดมี", "Academy secretary"),
          fromSilver("ผังองค์กรคณะผู้บริหารของอคาเดมี", "Academy management structure"),
        ],
      },
      {
        code: "1.3",
        th: "เจ้าหน้าที่ / ผู้ฝึกสอน",
        en: "Staffing",
        rows: [
          [
            t("มีจำนวนผู้ฝึกสอนขั้นต่ำ 1 คน ที่มีใบอนุญาตผู้ฝึกสอนในระดับ เอเอฟซี ซี ไลเซนส์", "Minimum 1 coach with minimum AFC C license"),
            t("มีจำนวนผู้ฝึกสอนขั้นต่ำ 2 คน ที่มีใบอนุญาตผู้ฝึกสอนในระดับ เอเอฟซี ซี ไลเซนส์", "Minimum 2 coaches with minimum AFC C license"),
            t(
              "มีจำนวนผู้ฝึกสอนขั้นต่ำ 3 คน ที่มีใบอนุญาตผู้ฝึกสอนในระดับ เอเอฟซี บี ไลเซนส์ และมีจำนวนผู้ช่วยผู้ฝึกสอนขั้นต่ำ 3 คน ที่มีใบอนุญาตผู้ฝึกสอนในระดับ เอเอฟซี ซี ไลเซนส์",
              "Minimum 3 coaches with minimum AFC B license and 3 assistant coaches with minimum AFC C license",
            ),
          ],
          fromSilver("มีการประชุมเจ้าหน้าที่ หรือผู้ฝึกสอน", "Regular staff meeting"),
          goldOnly("กิจกรรมการพัฒนาศักยภาพของเจ้าหน้าที่ หรือผู้ฝึกสอน", "Educational opportunities"),
          goldOnly("ข้อตกลงความร่วมมือในการรับผู้ฝึกสอนเข้าศึกษา / ดูงาน", "Internship agreement"),
        ],
      },
      {
        code: "1.4",
        th: "การเงิน",
        en: "Finance",
        rows: [
          [t("งบประมาณประจำปี", "Annual budget"), t("เอกสารแสดงงบประมาณประจำปี", "Written annual budget"), t("เอกสารแสดงงบประมาณประจำปี", "Written annual budget")],
          goldOnly("มีงบประมาณเพียงพอสำหรับการดำเนินการอคาเดมี", "Work within its annual budget"),
          goldOnly("แหล่งที่มา / ผู้สนับสนุนงบประมาณ", "Supplier of budget"),
        ],
      },
      {
        code: "1.5",
        th: "สิ่งอำนวยความสะดวก",
        en: "Facilities",
        rows: [
          all(
            "สนามฟุตบอลขนาดมาตรฐานสำหรับการฝึกซ้อมและการแข่งขัน (สนามขนาดเล็กสำหรับรุ่น U12)",
            "A full-sided pitch for game and training (half field for U12)",
          ),
          all("อุปกรณ์ต่าง ๆ มีความปลอดภัย และเพียงพอต่อการใช้งาน", "Adequate / safe supply of equipment"),
          [
            null,
            t("มีพื้นที่สำหรับใช้ในการเป็นที่พักของนักฟุตบอล", "Adequate dressing rooms reserved"),
            t("จำนวนห้องพักนักกีฬามีเพียงพอต่อการใช้งาน", "Adequate dressing rooms reserved"),
          ],
          goldOnly("จำนวนห้องฟิตเนส และห้องทำงานมีเพียงพอต่อการใช้งาน", "Adequate room for admin, fitness"),
        ],
      },
      {
        code: "1.6",
        th: "ทีม",
        en: "Team",
        rows: [
          [
            t("จำนวนทีมอย่างน้อย 1 ทีม เช่น U14", "At least 1 youth team, i.e. U14"),
            t("จำนวนทีมอย่างน้อย 2 ทีม เช่น U14, U16", "At least 2 youth teams, i.e. U14 and U16"),
            t("จำนวนทีมอย่างน้อย 3 ทีม เช่น U14, U16, U18", "At least 3 youth teams, i.e. U14, U16 and U18"),
          ],
          all(
            "จำนวนนักกีฬาอย่างน้อย 18 คน และผู้รักษาประตู 2 คนต่อรุ่น / นักกีฬาอย่างน้อย 12 คน และผู้รักษาประตู 2 คนต่อรุ่น สำหรับทีม U12 หรือต่ำกว่า",
            "At least 18 players in each squad, including 2 goalkeepers / at least 12 players for U12 and below, including 2 goalkeepers",
          ),
        ],
      },
    ],
  },
  {
    no: 2,
    th: "การฝึกสอน และประสิทธิภาพ",
    en: "Coaching & Performance",
    subs: [
      {
        code: "2.1",
        th: "แผนการพัฒนา",
        en: "Planning",
        rows: [
          all("ช่วงอายุของการพัฒนานักฟุตบอลระดับเยาวชน", "Stage of development"),
          goldOnly("แผนการพัฒนานักฟุตบอลระดับเยาวชนของอคาเดมี", "Youth development plan for the Academy"),
        ],
      },
      {
        code: "2.2",
        th: "การคัดเลือกนักกีฬา",
        en: "Recruitment",
        rows: [
          all("นโยบายในการคัดเลือกนักฟุตบอล", "Recruitment policy"),
          fromSilver("ขั้นตอนการคัดเลือกนักฟุตบอล", "Identification process"),
          goldOnly("เอกสารรายงานข้อมูล / ผลการคัดเลือกนักฟุตบอล", "Scouting report"),
        ],
      },
      {
        code: "2.3",
        th: "การฝึกสอน",
        en: "Coaching",
        rows: [
          [
            t("หลักสูตรการฝึกสอน – เนื้อหา", "Coaching curriculum – contents"),
            t("หลักสูตรการฝึกสอน – เนื้อหา / เป้าหมาย", "Coaching curriculum – contents"),
            t("หลักสูตรการฝึกสอน – เนื้อหา / เป้าหมาย", "Coaching curriculum – contents"),
          ],
          fromSilver("ตัวอย่างแผนการฝึกซ้อม", "Example of training session"),
          goldOnly("รูปแบบการฝึกซ้อม", "Training method"),
        ],
      },
      {
        code: "2.4",
        th: "การแข่งขัน",
        en: "Playing",
        rows: [
          fromSilver(
            "จำนวนเกมการแข่งขันอย่างน้อย 18 เกม สำหรับฟุตบอล 11 คน / อย่างน้อย 14 เกม สำหรับฟุตบอล 7 คน",
            "Regular matches (at least 18 matches F11 / 14 matches F7)",
          ),
          fromSilver("โปรแกรมการแข่งขันมีความเหมาะสมต่อช่วงอายุของนักฟุตบอลเยาวชน", "Match program appropriate for the stage of development"),
          goldOnly("แนวทางการกำหนดจำนวนเกมการแข่งขันของนักฟุตบอล", "Guidelines on playing time"),
        ],
      },
      {
        code: "2.5",
        th: "ประสิทธิภาพนักฟุตบอล",
        en: "Player Performance",
        rows: [
          all("การให้ข้อเสนอแนะแก่นักฟุตบอลด้วยวาจา หรือสื่อต่าง ๆ ฯลฯ", "Feedback to the players: verbal, DVD, etc."),
          goldOnly("เอกสารการประเมินนักฟุตบอล", "Match report"),
        ],
      },
      {
        code: "2.6",
        th: "ฟิตเนส",
        en: "Fitness",
        rows: [
          all("โปรแกรมการฝึกซ้อมประจำสัปดาห์ไม่ต่ำกว่า 2 ครั้ง", "Weekly training sessions (minimum 2 sessions)"),
          fromSilver("การจัดสรรโปรแกรมการฝึกซ้อมให้เหมาะสมกับนักฟุตบอล", "Managed workload for players"),
          goldOnly("การทดสอบสมรรถภาพนักฟุตบอล", "Regular fitness tests for players"),
        ],
      },
      {
        code: "2.7",
        th: "การประเมิน",
        en: "Assessment",
        rows: [all("นโยบาย และขั้นตอนในการดำเนินการปล่อยตัวนักกีฬาออกจากอคาเดมี", "Release policy / process")],
      },
      {
        code: "2.8",
        th: "ผลงาน",
        en: "Results",
        rows: [
          [
            t("สร้าง / พัฒนานักฟุตบอลเยาวชนที่มีคุณภาพ", "Produce players for higher level"),
            t("พัฒนานักฟุตบอลไปสู่โอกาสในการถูกคัดเลือกของทีมชาติ", "Produce players for national pre-selections"),
            t("พัฒนานักฟุตบอลไปสู่ระดับภูมิภาค และโอกาสในการถูกคัดเลือกเข้าร่วมฝึกซ้อมกับทีมชาติ", "Produce players for regional selections, national trials, etc."),
          ],
          fromSilver("รายงานผลการดำเนินงานประจำปี", "Annual report for the Club Board"),
          goldOnly("โอกาสในการร่วมฝึกซ้อมหรือทำการแข่งขันร่วมกับทีมชุดใหญ่ของสโมสร", "Opportunity to train or play with the first team (link with first team)"),
        ],
      },
    ],
  },
  {
    no: 3,
    th: "สุขภาพ และสวัสดิการ",
    en: "Health & Welfare",
    subs: [
      {
        code: "3.1",
        th: "สุขภาพ",
        en: "Health",
        rows: [
          all("มีการอบรมการปฐมพยาบาลเบื้องต้นแก่ผู้ฝึกสอน", "First aid trained for coaches"),
          fromSilver("การตรวจเช็คสุขภาพร่างกาย (แนะนำ)", "Regular health check-ups (recommended)"),
          fromSilver("การสนับสนุนทางการแพทย์ขั้นพื้นฐาน", "Basic medical support"),
          goldOnly("โปรแกรมพัฒนาศักยภาพเพื่อป้องกันอาการบาดเจ็บ", "Injury-prevention program"),
        ],
      },
      {
        code: "3.2",
        th: "หลักจิตวิทยา",
        en: "Psychology",
        rows: [
          [
            t("การให้คำแนะนำด้านจิตวิทยาพื้นฐานแก่นักฟุตบอล", "The players have basic psychological advice"),
            t("การให้คำแนะนำด้านจิตวิทยาพื้นฐานแก่นักฟุตบอล", "The players have basic psychological advice"),
            t(
              "การสนับสนุนในเรื่องความรู้ / เข้าใจในตัวเอง ความสนใจ ความกระตือรือร้น ความเป็นผู้นำ ความมั่นใจ การตอบสนองภายใต้ความกดดัน การควบคุมอารมณ์ ความยืดหยุ่นทางอารมณ์แก่นักฟุตบอล",
              "Support / guidance on self-knowledge, attention, motivation, leadership, confidence, performance under pressure, emotional stability and flexibility",
            ),
          ],
        ],
      },
      {
        code: "3.3",
        th: "สวัสดิการ",
        en: "Welfare",
        rows: [all("นโยบายการคุ้มครองเยาวชน", "Policy of child protection"), goldOnly("การแนะนำหลักการใช้ชีวิตประจำวัน", "Lifestyle guidelines")],
      },
      {
        code: "3.4",
        th: "การศึกษา",
        en: "Education",
        rows: [fromSilver("ความร่วมมือในด้านการศึกษา", "Education authorities cooperation"), goldOnly("เอกสารรายงานผลการศึกษา", "Report of educational progress")],
      },
      {
        code: "3.5",
        th: "ความร่วมมือ",
        en: "Collaboration",
        rows: [
          all("ช่องทางในการติดต่อสื่อสารกับผู้ปกครองของนักฟุตบอล", "The way to communicate with parents"),
          fromSilver(
            "ความร่วมมือกับสโมสรท้องถิ่น สมาคมประจำภูมิภาค ทีมชาติชุดเยาวชน สถานศึกษา",
            "Collaboration with local club, regional association, national youth team, schools",
          ),
          fromSilver("การจัดกิจกรรมที่สมาคมฯ เป็นผู้กำหนด", "Organize the FAT activity"),
          goldOnly("กิจกรรมการให้ความรู้แก่ผู้ปกครองของนักฟุตบอล", "Education opportunities for parents"),
        ],
      },
    ],
  },
];

// จำนวนเกณฑ์ของแต่ละระดับ
export const criteriaCount = (level: AcademyLevel) =>
  ACADEMY_CRITERIA.reduce((n, c) => n + c.subs.reduce((m, s) => m + s.rows.filter((r) => r[LEVEL_INDEX[level]]).length, 0), 0);

// สรุประดับ (จากภาพประกอบของสมาคมฯ) — เหมาะกับใคร และข้อกำหนดหลัก
export const LEVEL_SUMMARY: Record<
  AcademyLevel,
  { title: string; th: string; audience: CriterionText; head: string; coaches: string; assistants?: string; teams: string; highlights: string[] }
> = {
  BRONZE: {
    title: "FAT Bronze Class",
    th: "อคาเดมีระดับทองแดง",
    audience: t("เหมาะสำหรับอคาเดมีเอกชนทั่วไป และอคาเดมีที่ต้องการเข้าร่วมกิจกรรมกับทางสมาคมฯ", "Enlisted for private academies and join FAT tournament"),
    head: "AFC C License",
    coaches: "1 คน AFC C License",
    teams: "1 ทีม (U14)",
    highlights: ["สนามฟุตบอลขนาดมาตรฐานสำหรับการฝึกซ้อมและการแข่งขัน", "อุปกรณ์ในการซ้อมเพียงพอ", "มีนโยบายคุ้มครองเยาวชน"],
  },
  SILVER: {
    title: "FAT Silver Class",
    th: "อคาเดมีระดับเงิน",
    audience: t("เหมาะสำหรับโรงเรียนกีฬาทั่วประเทศ และอคาเดมีที่เข้าร่วมลีกเยาวชนของสมาคมฯ", "Encompassing sports schools and FAT youth leagues"),
    head: "AFC B License",
    coaches: "2 คน AFC C License",
    teams: "2 ทีม (U14 / U16)",
    highlights: ["สนามฟุตบอลขนาดมาตรฐานสำหรับการฝึกซ้อมและการแข่งขัน", "มีห้องพักนักกีฬา", "มีการแข่งขันอย่างน้อย 18 เกม", "มีนโยบายคุ้มครองเยาวชน"],
  },
  GOLD: {
    title: "FAT Gold Class",
    th: "อคาเดมีระดับทอง",
    audience: t("สำหรับอคาเดมีของสโมสรอาชีพระดับไทยลีก 1 และ 2", "Reserved for professional Thai League 1 & 2 club academies"),
    head: "AFC A License",
    coaches: "3 คน AFC B License",
    assistants: "3 คน AFC C License",
    teams: "3 ทีม (U14 / U16 / U18)",
    highlights: [
      "สนามฟุตบอลขนาดมาตรฐานสำหรับการฝึกซ้อมและการแข่งขัน",
      "มีห้องพักนักกีฬา",
      "มีห้องฟิตเนสเพียงพอ",
      "มีการแข่งขันอย่างน้อย 18 เกม",
      "มีนโยบายคุ้มครองเยาวชน",
    ],
  },
};
