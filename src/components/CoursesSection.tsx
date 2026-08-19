import { GraduationCap, ShieldCheck, HeartPulse, ExternalLink } from "lucide-react";
import { CourseStep, type CoreStep } from "./CourseStep";

const coreProgramSteps: CoreStep[] = [
  {
    level: "G",
    title: "FA Thailand \"G\" Diploma",
    ageGroup: "นักฟุตบอลพื้นฐาน อายุ 6–12 ปี",
    description:
      "คือเอกสารยืนยันว่าผู้ฝึกสอนมีความรู้และความสามารถในการฝึกสอนนักฟุตบอลพื้นฐาน ตั้งแต่อายุ 6-12 ปี โดยการฝึกซ้อม และการแข่งขัน จะเป็นเกมฟุตบอลขนาดเล็ก ที่เน้นความสนุกเป็นหลัก",
    totalHours: 76,
    theoryHours: 28,
    practicalHours: 28,
    experienceHours: 20,
    days: 7,
    subjects: [
      "ปรัชญาฟุตบอล",
      "กฎข้อบังคับ",
      "การพัฒนาเยาวชน",
      "การสอนกีฬาฟุตบอล",
      "เทคนิค-แทคติก",
      "กิจกรรมฝึกซ้อม",
      "สภาพจิตใจ",
      "การจัดการทีม",
      "ฟิตเนส",
      "การปฐมพยาบาล",
    ],
  },
  {
    level: "C",
    title: "AFC \"C\" Diploma",
    ageGroup: "เยาวชนขั้นแรก อายุ 13–18 ปี",
    description:
      "คือเอกสารยืนยันว่าผู้ฝึกสอนมีความรู้และความสามารถในการฝึกสอนนักฟุตบอลเยาวชนขั้นแรกในช่วงอายุ 13-18 ปี โดยผู้ฝึกสอนในระดับนี้ควรให้ความสำคัญกับการฝึกซ้อม เพื่อให้นักฟุตบอลพัฒนาความเข้าใจที่มีต่อการเล่นฟุตบอล",
    totalHours: 100,
    theoryHours: 40,
    practicalHours: 40,
    experienceHours: 20,
    days: 10,
    subjects: [
      "ปรัชญา",
      "การควบคุมและค่านิยม",
      "กฎข้อบังคับ",
      "การจัดการการแข่งขัน",
      "การพัฒนาเยาวชน",
      "การสอนกีฬาฟุตบอล",
      "เทคนิค-แทคติก",
      "กิจกรรมฝึกซ้อม",
      "สภาพจิตใจ",
      "การจัดการทีม",
      "การจัดการสโมสร",
      "ฟิตเนสและการปฐมพยาบาล",
    ],
  },
  {
    level: "B",
    title: "AFC \"B\" Diploma",
    ageGroup: "เยาวชน 13–18 ปี และนักฟุตบอลสมัครเล่น",
    description:
      "คือเอกสารยืนยันว่าผู้ฝึกสอนมีความรู้และความสามารถในการฝึกสอนนักฟุตบอลเยาวชนขั้นแรกในช่วงอายุ 13-18 ปี และนักฟุตบอลสมัครเล่น การฝึกซ้อมในระดับนี้ต้องมีคุณภาพสูงเพื่อพัฒนาความสามารถของนักเตะอย่างต่อเนื่อง",
    totalHours: 130,
    theoryHours: 65,
    practicalHours: 45,
    experienceHours: 20,
    days: 17,
    subjects: [
      "ปรัชญา",
      "การควบคุมและค่านิยม",
      "กฎข้อบังคับ",
      "การจัดการการแข่งขัน",
      "การพัฒนาเยาวชน",
      "การสอนกีฬาฟุตบอล",
      "เทคนิค-แทคติก",
      "กิจกรรมฝึกซ้อม",
      "สภาพจิตใจ",
      "การจัดการทีม",
      "การจัดการสโมสร",
      "การคัดตัวผู้เล่น ฟิตเนสและสมรรถภาพ",
    ],
  },
  {
    level: "A",
    title: "AFC \"A\" Diploma",
    ageGroup: "อายุ 19 ปีขึ้นไป และนักฟุตบอลสมัครเล่นขั้นสูง",
    description:
      "คือเอกสารยืนยันว่าผู้ฝึกสอนมีความรู้และความสามารถในการฝึกสอนนักฟุตบอลตั้งแต่อายุ 19 ปีขึ้นไป และนักฟุตบอลสมัครเล่นขั้นสูง การฝึกซ้อมในระดับนี้จะเน้นไปยังเรื่องการพัฒนานักเตะ และผลงานของทีมเป็นหลัก",
    totalHours: 204,
    theoryHours: 104,
    practicalHours: 60,
    experienceHours: 40,
    days: 27,
    subjects: [
      "ปรัชญา",
      "การควบคุมและค่านิยม",
      "กฎข้อบังคับ",
      "การจัดการการแข่งขัน",
      "การสอนกีฬาฟุตบอล",
      "เทคนิค-แทคติก",
      "กิจกรรมฝึกซ้อม",
      "สภาพจิตใจ",
      "การจัดการทีม",
      "การจัดการสโมสร",
      "การสื่อสาร",
      "การคัดตัวผู้เล่น ฟิตเนส และการซ้อมแบบแบ่งช่วง",
    ],
  },
  {
    level: "PRO",
    title: "AFC \"PRO\" Diploma",
    ageGroup: "ระดับอาชีพ",
    description:
      "คือเอกสารยืนยันว่าผู้ฝึกสอนมีความรู้และความสามารถในการฝึกสอนนักฟุตบอลอาชีพ ผู้ฝึกสอนในระดับนี้มีหน้าที่ถ่ายทอดปรัชญาฟุตบอลของตัวเองสู่สโมสร และผลักดันศักยภาพ รวมถึงพัฒนาผลงานของทีมให้ดีที่สุด",
    totalHours: 383,
    theoryHours: 158,
    practicalHours: 100,
    experienceHours: 125,
    days: 50,
    subjects: [
      "ปรัชญา",
      "การควบคุมและค่านิยม",
      "กฎข้อบังคับ",
      "การจัดการการแข่งขัน",
      "การสอนกีฬาฟุตบอล",
      "เทคนิค-แทคติก",
      "กิจกรรมฝึกซ้อม",
      "สภาพจิตใจ",
      "การจัดการทีม",
      "การจัดการสโมสร",
      "การสื่อสาร",
      "การคัดตัวผู้เล่น ฟิตเนส และการซ้อมแบบแบ่งช่วง",
    ],
  },
];

const goalkeeperLevels = [
  { level: "C", title: "FA Thailand Goalkeeper \"C\" Diploma" },
  { level: "B", title: "AFC Goalkeeper \"B\" Diploma" },
  { level: "A", title: "AFC Goalkeeper \"A\" Diploma" },
];

const fitnessLevels = [
  { level: "C", title: "FA Thailand Fitness \"C\" Diploma" },
  { level: "B", title: "AFC Fitness \"B\" Diploma" },
  { level: "A", title: "AFC Fitness \"A\" Diploma" },
];

const simpleGroups = [
  {
    icon: ShieldCheck,
    title: "AFC Goalkeeper Coaching",
    description:
      "หลักสูตรผู้ฝึกสอนผู้รักษาประตู ของสมาพันธ์ฟุตบอลเอเชีย (เอเอฟซี) แบ่งเป็น 3 ระดับ โดยสมาคมฯ ได้วางแผนการศึกษาเพื่อประกาศนียบัตรและใบอนุญาตสำหรับผู้ฝึกสอนเฉพาะด้าน ตามความตั้งใจที่จะยกระดับมาตรฐานฟุตบอลไทยให้สูงขึ้น",
    href: "https://fathailand.org/coaching-detail/AFC-Goalkeeper-Coaching",
    levels: goalkeeperLevels,
    accent: "emerald",
  },
  {
    icon: HeartPulse,
    title: "AFC Fitness Coaching",
    description:
      "หลักสูตรผู้ฝึกสอนฟิตเนส ของสมาพันธ์ฟุตบอลเอเชีย (เอเอฟซี) แบ่งเป็น 3 ระดับ โดยสมาคมฯ ได้วางแผนการศึกษาเพื่อประกาศนียบัตรและใบอนุญาตสำหรับผู้ฝึกสอนเฉพาะด้าน ตามความตั้งใจที่จะยกระดับมาตรฐานฟุตบอลไทยให้สูงขึ้น",
    href: "https://fathailand.org/coaching-detail/AFC-Fitness-Coaching",
    levels: fitnessLevels,
    accent: "rose",
  },
];

const ACCENT_STYLES: Record<
  string,
  { border: string; iconBg: string; iconText: string; badge: string }
> = {
  emerald: {
    border: "border-t-emerald-500",
    iconBg: "bg-emerald-50",
    iconText: "text-emerald-600",
    badge: "bg-emerald-500",
  },
  rose: {
    border: "border-t-rose-500",
    iconBg: "bg-rose-50",
    iconText: "text-rose-600",
    badge: "bg-rose-500",
  },
};

export function CoursesSection() {
  return (
    <section id="courses" className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-900">
            หลักสูตรอบรมผู้ฝึกสอน
          </h2>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          สมาคมกีฬาฟุตบอลแห่งประเทศไทยฯ ให้ความสำคัญอย่างมากกับการพัฒนาบุคลากร
          ด้านการฝึกสอน เพราะผู้ฝึกสอนคือหนึ่งในผู้วางรากฐานให้กับฟุตบอลไทย
          ตั้งแต่ระดับพื้นฐานจนถึงระดับอาชีพ — อ้างอิงจาก{" "}
          <a
            href="https://fathailand.org/coaching-education?language=th"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-600 hover:underline"
          >
            fathailand.org
          </a>
        </p>

        {/* AFC Core Program — detailed stepper */}
        <div className="mt-10 rounded-3xl border border-slate-200 border-t-4 border-t-indigo-600 bg-slate-50/50 p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-500">
                  สายหลักสูตรที่ 1
                </p>
                <h3 className="text-lg font-bold text-slate-900">
                  AFC Core Program
                </h3>
                <p className="text-sm text-slate-500">
                  หลักสูตรหลักผู้ฝึกสอนตามมาตรฐานสมาพันธ์ฟุตบอลเอเชีย (AFC)
                </p>
              </div>
            </div>
            <a
              href="https://fathailand.org/coaching-detail/AFC-Core-Program"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
            >
              อ่านต่อที่ fathailand.org
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="mt-6 space-y-4">
            {coreProgramSteps.map((step, index) => (
              <CourseStep key={step.level} step={step} index={index} />
            ))}
          </div>
        </div>

        {/* Goalkeeper + Fitness — simpler groups */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {simpleGroups.map(({ icon: Icon, title, description, href, levels, accent }, groupIndex) => {
            const style = ACCENT_STYLES[accent];
            return (
              <div
                key={title}
                className={`flex flex-col rounded-3xl border border-slate-200 border-t-4 bg-white p-6 shadow-sm ${style.border}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${style.iconBg} ${style.iconText}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      สายหลักสูตรที่ {groupIndex + 2}
                    </p>
                    <h3 className="font-bold text-slate-900">{title}</h3>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  {description}
                </p>

                <ul className="mt-4 flex-1 space-y-2">
                  {levels.map((lvl) => (
                    <li
                      key={lvl.level}
                      className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5"
                    >
                      <span
                        className={`flex h-6 w-fit min-w-6 items-center justify-center rounded-md px-1.5 text-xs font-bold text-white ${style.badge}`}
                      >
                        {lvl.level}
                      </span>
                      <span className="text-sm font-medium text-slate-800">
                        {lvl.title}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-5 inline-flex items-center gap-1.5 self-start rounded-lg border bg-white px-3 py-1.5 text-sm font-medium transition-colors hover:bg-slate-50 ${style.iconText} border-slate-200`}
                >
                  อ่านต่อที่ fathailand.org
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
