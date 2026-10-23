import { ExternalLink } from "lucide-react";
import { CourseStep } from "./CourseStep";
import { coreProgramSteps } from "@/lib/coach-program";
import { display, SectionHead } from "@/components/coach/CoachUi";

// คงชื่อเดิมไว้ให้ไฟล์อื่นที่ import จากที่นี่ใช้ต่อได้
export { coreProgramSteps };

const simpleGroups = [
  {
    code: "GK",
    title: "AFC Goalkeeper Coaching",
    description:
      "หลักสูตรผู้ฝึกสอนผู้รักษาประตู ของสมาพันธ์ฟุตบอลเอเชีย (เอเอฟซี) แบ่งเป็น 3 ระดับ โดยสมาคมฯ ได้วางแผนการศึกษาเพื่อประกาศนียบัตรและใบอนุญาตสำหรับผู้ฝึกสอนเฉพาะด้าน ตามความตั้งใจที่จะยกระดับมาตรฐานฟุตบอลไทยให้สูงขึ้น",
    href: "https://fathailand.org/coaching-detail/AFC-Goalkeeper-Coaching",
    levels: [
      { level: "C", title: 'FA Thailand Goalkeeper "C" Diploma' },
      { level: "B", title: 'AFC Goalkeeper "B" Diploma' },
      { level: "A", title: 'AFC Goalkeeper "A" Diploma' },
    ],
    hex: "#047857",
  },
  {
    code: "FIT",
    title: "AFC Fitness Coaching",
    description:
      "หลักสูตรผู้ฝึกสอนฟิตเนส ของสมาพันธ์ฟุตบอลเอเชีย (เอเอฟซี) แบ่งเป็น 3 ระดับ โดยสมาคมฯ ได้วางแผนการศึกษาเพื่อประกาศนียบัตรและใบอนุญาตสำหรับผู้ฝึกสอนเฉพาะด้าน ตามความตั้งใจที่จะยกระดับมาตรฐานฟุตบอลไทยให้สูงขึ้น",
    href: "https://fathailand.org/coaching-detail/AFC-Fitness-Coaching",
    levels: [
      { level: "C", title: 'FA Thailand Fitness "C" Diploma' },
      { level: "B", title: 'AFC Fitness "B" Diploma' },
      { level: "A", title: 'AFC Fitness "A" Diploma' },
    ],
    hex: "#be123c",
  },
];

export function CoursesSection() {
  return (
    <section id="courses" className="mx-auto max-w-6xl space-y-20 px-5 py-16 sm:px-6">
      {/* AFC Core Program — เส้นเวลา */}
      <div>
        <SectionHead
          no="01"
          eyebrow="AFC Core Program"
          title={"หลักสูตรหลักผู้ฝึกสอน 5\u00a0ระดับ"}
          sub="สายหลักสูตรที่ 1 — กดที่แต่ละระดับเพื่อดูรายละเอียด ชั่วโมงเรียน และรายวิชา"
          action={
            <a
              href="https://fathailand.org/coaching-detail/AFC-Core-Program"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#073c5e] hover:underline"
            >
              อ่านต่อที่ fathailand.org
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          }
        />
        <ol className="space-y-5">
          {coreProgramSteps.map((step, index) => (
            <CourseStep key={step.level} step={step} index={index} last={index === coreProgramSteps.length - 1} />
          ))}
        </ol>
      </div>

      {/* ผู้รักษาประตู + ฟิตเนส */}
      <div id="specialist" className="scroll-mt-24">
        <SectionHead no="02" eyebrow="Specialist Courses" title="หลักสูตรเฉพาะทาง" sub="สายหลักสูตรที่ 2 – 3 — ผู้ฝึกสอนผู้รักษาประตู และผู้ฝึกสอนฟิตเนส" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {simpleGroups.map(({ code, title, description, href, levels, hex }) => (
            <div key={title} className="relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-6 sm:p-7">
              <span className="absolute inset-x-0 top-0 h-1" style={{ background: hex }} />
              <div className="flex items-center gap-4">
                <span className={`${display.className} flex h-12 w-14 flex-none items-center justify-center rounded-lg border text-sm font-semibold`} style={{ color: hex, borderColor: hex }}>
                  {code}
                </span>
                <h3 className={`${display.className} text-xl font-semibold text-slate-900`}>{title}</h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">{description}</p>
              <ul className="mt-5 flex-1 divide-y divide-slate-100 border-y border-slate-100">
                {levels.map((lvl) => (
                  <li key={lvl.level} className="flex items-center gap-4 py-3">
                    <span className={`${display.className} w-6 text-lg font-semibold`} style={{ color: hex }}>
                      {lvl.level}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">{lvl.title}</span>
                  </li>
                ))}
              </ul>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-[#073c5e] hover:underline"
              >
                อ่านต่อที่ fathailand.org
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
