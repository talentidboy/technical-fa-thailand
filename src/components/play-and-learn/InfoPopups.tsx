"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { X, Footprints, BookOpen, Sparkles } from "lucide-react";
import { PLAY_AND_LEARN_PILLARS_DIAGRAM_URL } from "@/lib/brand";

const popups = [
  {
    key: "coaching",
    icon: Footprints,
    title: "แนวทางการฝึกนักเตะรุ่นจิ๋ว",
    color: "bg-pink-100 text-pink-600",
  },
  {
    key: "chapters",
    icon: BookOpen,
    title: "พาเล่นอย่างไรให้สนุกและบรรลุเป้าหมาย",
    color: "bg-purple-100 text-purple-600",
  },
  {
    key: "goals",
    icon: Sparkles,
    title: "เป้าหมายแห่งการเรียนรู้คู่ความสนุก",
    color: "bg-amber-100 text-amber-600",
  },
] as const;

type PopupKey = (typeof popups)[number]["key"];

// ปุ่ม 3 ปุ่มหลังเนื้อหา Introduction — กดแล้วเด้งป๊อปอัพอ่านรายละเอียดเพิ่มเติมแทนการยัดข้อความยาวๆ ไว้ในหน้าเดียว
export function InfoPopups() {
  const [open, setOpen] = useState<PopupKey | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {popups.map(({ key, icon: Icon, title, color }) => (
          <button
            key={key}
            type="button"
            onClick={() => setOpen(key)}
            className="group flex flex-col items-center gap-3 rounded-2xl border border-pink-100 bg-white p-5 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} transition-transform group-hover:scale-110`}>
              <Icon className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <span className="text-xs font-medium text-purple-600">อ่านเพิ่มเติม</span>
          </button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => setOpen(null)}
        >
          <div
            className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(null)}
              aria-label="ปิด"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-pink-50 text-pink-500 transition-colors hover:bg-pink-100"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {open === "coaching" && <CoachingContent />}
            {open === "chapters" && <ChaptersContent />}
            {open === "goals" && <GoalsContent />}
          </div>
        </div>
      )}
    </>
  );
}

function PopupHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="pr-10 text-xl font-bold text-slate-900">{children}</h3>;
}

function CoachingContent() {
  return (
    <div className="space-y-4">
      <PopupHeading>แนวทางการฝึกนักเตะรุ่นจิ๋ว</PopupHeading>
      <div className="space-y-4 text-sm leading-relaxed text-slate-600">
        <p>
          PLAY AND LEARN เพลินให้สุดกับฟุตบอล คือโครงการที่เปิดโอกาสให้เด็กผู้หญิงวัย 5-8 ปี ได้ฝึกเล่นกีฬาฟุตบอลอย่างสนุกสนาน
          ภายใต้การควบคุมดูแลของโค้ชที่ได้รับการรับรองจากสมาคมกีฬาฟุตบอลแห่งประเทศไทยฯ เพราะโค้ชคือคนสำคัญ
          ที่จะพาเด็ก ๆ ไปสนุกสนานกับกิจกรรม เป็นผู้สร้างสภาพแวดล้อมในการเล่น
          สอนการเคลื่อนไหวและทักษะพื้นฐานในการเล่นฟุตบอลให้กับนักเตะรุ่นจิ๋วมือใหม่
        </p>
        <p>
          หลักการสำคัญของ PLAY AND LEARN เพลินให้สุดกับฟุตบอลคือการทำกิจกรรมแบบอิสระที่มุ่งให้เด็ก ๆ
          ได้ตัดสินใจคิดสร้างสรรค์ เรียนรู้แก้ไขปัญหาด้วยตนเองและฝึกการทำงานเป็นทีม
          โค้ชจึงต้องสร้างบรรยากาศเชิงบวก (Positive Environment) นำเสนอกิจกรรมอย่างมีชีวิตชีวา
          ใช้โทนเสียงที่ดึงดูดความสนใจ มีจังหวะจะโคนในการเล่าเรื่องเพื่อให้เด็ก ๆ รู้สึกสนุกสนาน ลุ้น
          และพร้อมผจญภัยไปกับกุ๋งกิ๋ง ซึ่งทุกเหตุการณ์จะเชื่อมโยงสู่เกมและการฝึกฝนกีฬาฟุตบอลขั้นพื้นฐาน
          ที่สอดคล้องกับพัฒนาการของเด็กหญิงวัย 5-8 ปี
        </p>
      </div>
    </div>
  );
}

function ChaptersContent() {
  const parts = [
    { th: "บทนำ", en: "Introducing The Story" },
    { th: "ตัวละครและเหตุการณ์", en: "Characters & Setting" },
    { th: "สนุก", en: "The Adventure" },
    { th: "ทบทวนความสนุก", en: "The Reflection" },
    { th: "สนุกกันต่อในบทถัดไป", en: "The Cliffhanger" },
  ];
  return (
    <div className="space-y-4">
      <PopupHeading>พาเล่นอย่างไรให้สนุกและบรรลุเป้าหมาย</PopupHeading>
      <p className="text-sm leading-relaxed text-slate-600">
        คู่มือการสอนฟุตบอลขั้นพื้นฐานเล่มนี้ มีกุ๋งกิ๋งเป็นผู้ช่วยโค้ชที่จะชวนเด็กๆ ไปสนุกกับกีฬาฟุตบอล
        โดยโค้ชจะเป็นผู้อ่านนิทานและชวนเด็ก ๆ ร่วมเดินทางในจินตนาการไปยังสถานที่ต่าง ๆ กับกุ๋งกิ๋ง
        ผ่านเรื่องราวที่แบ่งออกเป็น <strong className="text-slate-900">8 ตอน 8 บท</strong> โดยจัดกิจกรรมต่อเนื่องเป็นเวลา{" "}
        <strong className="text-slate-900">10 สัปดาห์</strong> สัปดาห์ละ 1 ครั้ง ครั้งละ 45 นาที
        และใน 2 สัปดาห์สุดท้าย โค้ชจะเลือกกิจกรรมจากบทใดบทหนึ่งที่เด็ก ๆ ชอบกลับมาเล่นซ้ำอีกครั้ง
      </p>

      <div className="rounded-2xl bg-purple-50/60 p-4">
        <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-purple-400">แต่ละบทมีส่วนประกอบดังนี้</p>
        <ol className="space-y-1.5 text-sm text-purple-900">
          {parts.map((p, i) => (
            <li key={p.en} className="flex gap-2">
              <span className="flex-none font-bold">{i + 1}.</span>
              <span>
                {p.th} <span className="text-purple-500">({p.en})</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <p className="text-sm leading-relaxed text-slate-600">
        นอกจากนี้เด็ก ๆ จะได้รับ <strong className="text-slate-900">พาสปอร์ตแห่งความสนุก (Adventure Passport)</strong>{" "}
        ซึ่งมีเนื้อหาเกี่ยวกับการผจญภัยของกุ๋งกิ๋งและการฝึกทักษะการเคลื่อนไหวพื้นฐานในแต่ละบท
        ให้เด็ก ๆ ได้กลับไปทำกิจกรรมที่บ้านร่วมกับครอบครัวอีกด้วย
      </p>
    </div>
  );
}

function GoalsContent() {
  const movementItems = [
    { th: "การเคลื่อนไหวร่างกาย", en: "Locomotion", desc: "การเคลื่อนไหวร่างกายจากจุดหนึ่งไปอีกจุดหนึ่ง เช่น การเดิน การวิ่ง การกระโดด" },
    { th: "ความมั่นคงของข้อต่อ", en: "Stability", desc: "การเคลื่อนไหวร่างกายโดยที่ร่างกายอยู่กับที่ เช่น การหมุนตัว การบิดตัว การหมุนเท้า" },
    {
      th: "การควบคุม",
      en: "Object control",
      desc: "การเคลื่อนไหวร่างกายเพื่อทำให้วัตถุเกิดการเคลื่อนไหว เช่น การเตะ ขว้าง กระดอน ควบคุมและการรับ-ส่งลูกบอล",
    },
  ];
  const footballItems = ["การควบคุมลูกบอล", "การเคลื่อนที่ไปกับลูกบอล", "การส่งและการเตะลูกบอล", "การเล่นเกม 1 ต่อ 1 และ 3 ต่อ 3"];

  return (
    <div className="space-y-5">
      <PopupHeading>เป้าหมายแห่งการเรียนรู้คู่ความสนุก</PopupHeading>
      <p className="text-sm leading-relaxed text-slate-600">
        เปิดพื้นที่ให้เด็กผู้หญิงได้เล่นฟุตบอล เติบโต และเปล่งประกายเพราะการเล่นส่งผลดีต่อพัฒนาการของเด็กปฐมวัย
        และการได้ &lsquo;เล่น&rsquo;ฟุตบอล คือการได้ &lsquo;เรียนรู้&rsquo; ฟุตบอล เด็กทุกคนสามารถเล่นฟุตบอลร่วมกันได้อย่างเท่าเทียม
        อิสระ และสร้างสรรค์ ผ่านปรัชญาการเล่นฟุตบอล Grassroots คือ{" "}
        <strong className="text-slate-900">&ldquo;สนุก แบ่งปัน เคารพกัน ให้ปลอดภัย&rdquo;</strong> (Enjoy, Respect, Safe and Share)
        เพื่อพัฒนาการเรียนรู้ทั้ง 3 ด้าน
      </p>

      <div className="flex justify-center">
        <Image
          src={PLAY_AND_LEARN_PILLARS_DIAGRAM_URL}
          alt="3 เสาหลักของการเรียนรู้: ทักษะทางสังคม ทักษะการเคลื่อนไหวขั้นพื้นฐาน ทักษะฟุตบอลขั้นพื้นฐาน"
          width={480}
          height={480}
          className="h-auto w-full max-w-xs"
        />
      </div>

      <div className="space-y-3 text-sm text-slate-600">
        <div>
          <p className="font-semibold text-slate-900">1. ทักษะทางสังคม (Life skills and Values)</p>
          <p className="mt-1 leading-relaxed">
            เรียนรู้การอยู่ร่วมกับผู้อื่น การเล่นเป็นทีม การเคารพ และการแก้ไขปัญหา ซึ่งเป็นทักษะพื้นฐานในการใช้ชีวิต
          </p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">2. ทักษะการเคลื่อนไหวร่างกายขั้นพื้นฐาน (Fundamental movement skills)</p>
          <p className="mt-1 leading-relaxed">
            ฝึกเคลื่อนไหวร่างกายด้วยท่าทางต่าง ๆ ในเกมฟุตบอล เพื่อพัฒนาการเคลื่อนที่ การทรงตัว การทำงานประสานกันของระบบประสาทและกล้ามเนื้อ
          </p>
          <ul className="mt-2 space-y-1.5 rounded-xl bg-pink-50/60 p-3">
            {movementItems.map((m) => (
              <li key={m.en}>
                <span className="font-medium text-pink-700">
                  {m.th} ({m.en})
                </span>{" "}
                — {m.desc}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-900">3. ด้านทักษะฟุตบอลขั้นพื้นฐาน</p>
          <ul className="mt-1.5 list-inside list-disc space-y-1 leading-relaxed">
            {footballItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
