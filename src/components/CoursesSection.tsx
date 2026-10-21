import { ShieldCheck, HeartPulse, ExternalLink } from "lucide-react";
import { CourseStep } from "./CourseStep";
import { coreProgramSteps } from "@/lib/coach-program";
import { SectionHead } from "@/components/coach/CoachUi";

// คงชื่อเดิมไว้ให้ไฟล์อื่นที่ import จากที่นี่ใช้ต่อได้
export { coreProgramSteps };

const simpleGroups = [
  {
    icon: ShieldCheck,
    title: "AFC Goalkeeper Coaching",
    description:
      "หลักสูตรผู้ฝึกสอนผู้รักษาประตู ของสมาพันธ์ฟุตบอลเอเชีย (เอเอฟซี) แบ่งเป็น 3 ระดับ โดยสมาคมฯ ได้วางแผนการศึกษาเพื่อประกาศนียบัตรและใบอนุญาตสำหรับผู้ฝึกสอนเฉพาะด้าน ตามความตั้งใจที่จะยกระดับมาตรฐานฟุตบอลไทยให้สูงขึ้น",
    href: "https://fathailand.org/coaching-detail/AFC-Goalkeeper-Coaching",
    levels: [
      { level: "C", title: 'FA Thailand Goalkeeper "C" Diploma' },
      { level: "B", title: 'AFC Goalkeeper "B" Diploma' },
      { level: "A", title: 'AFC Goalkeeper "A" Diploma' },
    ],
    tone: { icon: "from-emerald-400/25 text-emerald-300", badge: "bg-emerald-400 text-emerald-950", glow: "bg-emerald-500/25" },
  },
  {
    icon: HeartPulse,
    title: "AFC Fitness Coaching",
    description:
      "หลักสูตรผู้ฝึกสอนฟิตเนส ของสมาพันธ์ฟุตบอลเอเชีย (เอเอฟซี) แบ่งเป็น 3 ระดับ โดยสมาคมฯ ได้วางแผนการศึกษาเพื่อประกาศนียบัตรและใบอนุญาตสำหรับผู้ฝึกสอนเฉพาะด้าน ตามความตั้งใจที่จะยกระดับมาตรฐานฟุตบอลไทยให้สูงขึ้น",
    href: "https://fathailand.org/coaching-detail/AFC-Fitness-Coaching",
    levels: [
      { level: "C", title: 'FA Thailand Fitness "C" Diploma' },
      { level: "B", title: 'AFC Fitness "B" Diploma' },
      { level: "A", title: 'AFC Fitness "A" Diploma' },
    ],
    tone: { icon: "from-rose-400/25 text-rose-300", badge: "bg-rose-400 text-rose-950", glow: "bg-rose-500/25" },
  },
];

export function CoursesSection() {
  return (
    <section id="courses" className="mx-auto max-w-6xl space-y-20 px-5 py-16 sm:px-6">
      {/* AFC Core Program — เส้นเวลา */}
      <div>
        <SectionHead
          no="01"
          eyebrow="AFC Core Program · สายหลักสูตรที่ 1"
          title="หลักสูตรหลักผู้ฝึกสอน 5 ระดับ"
          sub="กดที่แต่ละระดับเพื่อดูรายละเอียด ชั่วโมงเรียน และรายวิชา"
          action={
            <a
              href="https://fathailand.org/coaching-detail/AFC-Core-Program"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
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
      <div>
        <SectionHead no="02" eyebrow="สายหลักสูตรที่ 2 – 3" title="หลักสูตรเฉพาะทาง" sub="ผู้ฝึกสอนผู้รักษาประตู และผู้ฝึกสอนฟิตเนส" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {simpleGroups.map(({ icon: Icon, title, description, href, levels, tone }) => (
            <div key={title} className="relative flex flex-col overflow-hidden rounded-3xl bg-[#0d1433] p-6 text-white shadow-sm sm:p-7">
              <div aria-hidden className={`pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl ${tone.glow}`} />
              <div className="relative flex items-center gap-3">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br to-transparent ring-1 ring-white/10 ${tone.icon}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="text-lg font-extrabold">{title}</h3>
              </div>
              <p className="relative mt-4 text-sm leading-relaxed text-white/60">{description}</p>
              <ul className="relative mt-5 flex-1 space-y-2">
                {levels.map((lvl) => (
                  <li key={lvl.level} className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
                    <span className={`flex h-7 min-w-7 items-center justify-center rounded-lg text-xs font-black ${tone.badge}`}>{lvl.level}</span>
                    <span className="text-sm font-semibold">{lvl.title}</span>
                  </li>
                ))}
              </ul>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="relative mt-5 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-white/70 hover:text-white"
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
