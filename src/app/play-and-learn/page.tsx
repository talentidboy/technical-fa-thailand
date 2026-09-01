import Link from "next/link";
import Image from "next/image";
import { LOGO_URL, PLAY_AND_LEARN_LOGO_URL, PLAY_AND_LEARN_PASSPORT_URLS } from "@/lib/brand";
import {
  ArrowLeft,
  Sparkles,
  Star,
  Heart,
  Goal,
  Phone,
  Download,
  MapPin,
  Users,
  Footprints,
  BookOpen,
  UserRound,
  Flower2,
} from "lucide-react";

// ข้อมูลศูนย์ฝึกกิจกรรม — คัดลอกจากไฟล์ "Play and Learn เพลินให้สุดกับฟุตบอล.xlsx" ชีต Sheet1 (ข้อมูลนิ่ง กรอกด้วยมือ)
// registerUrl เป็น null ไว้ก่อน เพราะยังไม่มีลิงก์ Google Form จริง — ตอนนี้ใช้เบอร์โทรผู้ประสานงานเป็นช่องทางสมัครแทน
// เมื่อได้ลิงก์ฟอร์มจริงมาแล้ว ใส่ลิงก์ตรงนี้ได้เลย ปุ่ม "สมัครเรียน" จะเปลี่ยนมาใช้ลิงก์นั้นให้อัตโนมัติ
const activityCenters: {
  name: string;
  province: string;
  provinceEn: string;
  address: string;
  coaches: string[];
  coordinator: string;
  tel: string;
  schedule: string | null;
  registerUrl: string | null;
}[] = [
  {
    name: "CHR Football Academy",
    province: "กรุงเทพมหานคร",
    provinceEn: "Bangkok",
    address: "Jas Green Village Kubon เลขที่ 54/3 ถนนคู้บอน แขวงบางชัน เขตคลองสามวา กรุงเทพมหานคร 10510",
    coaches: ["นายณัฐอนันตชัย สาระสิทธิ์ (แบงค์)", "นายวัชรินทร์ ทองมนต์ (เบียร์)"],
    coordinator: "คุณบอลลูน",
    tel: "098-426-3341",
    schedule: "สัปดาห์ที่ 1 เสาร์ 10:00–11:00 น. · สัปดาห์ที่ 2–10 อาทิตย์ 14:00–15:00 น.",
    registerUrl: null,
  },
  {
    name: "Pinpat Kindergarten School",
    province: "สุราษฎร์ธานี",
    provinceEn: "Surat Thani",
    address: "โรงเรียนอนุบาลภิญพัฒน์ 16/2 หมู่ 2 ตำบลบ้านส้อง อำเภอเวียงสระ สุราษฎร์ธานี 84190",
    coaches: ["นางสาวอรวรรณ อินทร์คีรี (โม)", "นางสาวบุษยมาศ คำแก้ว (แคท)"],
    coordinator: "คุณโม",
    tel: "091-825-1610",
    schedule: null,
    registerUrl: null,
  },
  {
    name: "Chanthaburi FC Academy",
    province: "จันทบุรี",
    provinceEn: "Chanthaburi",
    address: "โรงเรียนเทศบาลเมืองจันทบุรี ๒ เลขที่ 4 ถ.มหาราช ต.ตลาด อ.เมือง จ.จันทบุรี 22000",
    coaches: ["นางสาวมีนา เร่งขวนขวาย (มีนา)", "นางสาววาลุกา ศรีสันต์ (วา)"],
    coordinator: "คุณมีนา",
    tel: "098-420-7530",
    schedule: null,
    registerUrl: null,
  },
  {
    name: "JT Football Academy",
    province: "หนองบัวลำภู",
    provinceEn: "Nong Bua Lamphu",
    address: "เลขที่ 158 หมู่ 9 บ้านศรีทองพัฒนา ตำบลกุดดินจี่ อำเภอนากลาง จังหวัดหนองบัวลำภู 39350",
    coaches: ["นางสาวณภัทรธนัตถ์ ชาวงษ์ (จอย)", "นางสาวนันทิกาญจน์ บัวสระ (หล่อ)"],
    coordinator: "คุณจอย",
    tel: "065-417-9193",
    schedule: null,
    registerUrl: null,
  },
  {
    name: "Sports Friends Thailand & Agape Academy",
    province: "เชียงใหม่",
    provinceEn: "Chiang Mai",
    address: "มูลนิธิช่วยไทย 120 ม.2 ต.แม่โป่ง อ.ดอยสะเก็ด จ.เชียงใหม่ 50220",
    coaches: ["นายสุพัฒน์ จันทร์แก้วมูล (ต้น)", "นายดนัย ปอด๋อ (ต่าย)"],
    coordinator: "คุณต้น",
    tel: "083-766-3737",
    schedule: null,
    registerUrl: null,
  },
];

const learningPillars = [
  {
    icon: Heart,
    title: "ทักษะชีวิตและคุณค่า",
    titleEn: "Life Skills and Values",
    description: "เรียนรู้การอยู่ร่วมกับผู้อื่น การเล่นเป็นทีม การเคารพ และการแก้ไขปัญหา",
    color: "bg-pink-100 text-pink-600",
  },
  {
    icon: Footprints,
    title: "ทักษะการเคลื่อนไหวพื้นฐาน",
    titleEn: "Fundamental Movement Skills",
    description: "ฝึกการเคลื่อนที่ (Locomotion) การทรงตัว (Stability) และการควบคุมวัตถุ (Object Control)",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: Goal,
    title: "ทักษะฟุตบอลขั้นพื้นฐาน",
    titleEn: "Basic Football Skills",
    description: "การควบคุมลูกบอล การเลี้ยงบอล การส่ง-เตะบอล และเกม 1 ต่อ 1 และ 3 ต่อ 3",
    color: "bg-amber-100 text-amber-600",
  },
];

// สีพาสเทลสลับกันทีละบท — คู่สีอ่อนกว่ารุ่นเดิม ให้ความรู้สึกนุ่มนวลสมวัยเด็ก แทนโทนสดจัด
const badgeAccents = [
  { bg: "from-pink-200 to-rose-200", icon: "text-rose-600" },
  { bg: "from-purple-200 to-fuchsia-200", icon: "text-fuchsia-600" },
  { bg: "from-violet-200 to-purple-200", icon: "text-purple-600" },
  { bg: "from-amber-100 to-orange-200", icon: "text-orange-600" },
  { bg: "from-emerald-100 to-teal-200", icon: "text-teal-600" },
  { bg: "from-sky-100 to-cyan-200", icon: "text-cyan-600" },
  { bg: "from-rose-200 to-pink-200", icon: "text-pink-600" },
  { bg: "from-fuchsia-200 to-violet-200", icon: "text-violet-600" },
];

// ลายจุดสีม่วงพาสเทลบนพื้นชมพูพาสเทล — ใช้เป็นพื้นหลังลายของทั้งหน้า (โทนสีหลักตามที่ขอ: ชมพูพาสเทล + ลายม่วงพาสเทล)
const dotPatternStyle = {
  backgroundImage: "radial-gradient(circle, rgba(192,132,252,0.35) 1.6px, transparent 1.6px)",
  backgroundSize: "26px 26px",
};

// ปุ่ม CTA พาสเทล ใช้ร่วมกันทั้งหน้า (พื้นอ่อน + ตัวอักษรเข้ม อ่านง่ายกว่าพื้นสดตัวอักษรขาว)
const pastelButtonClass =
  "inline-flex flex-none items-center gap-1.5 rounded-full bg-linear-to-r from-pink-200 to-purple-200 px-4 py-2 text-xs font-bold text-purple-900 shadow-sm transition-transform hover:scale-105 hover:from-pink-300 hover:to-purple-300";

// หน้านี้เปิดสาธารณะไม่ต้องล็อกอิน — เป็นแคมเปญให้ผู้ปกครอง/บุคคลทั่วไปเข้าดูข้อมูลและสมัครเรียนได้เลย
export default function PlayAndLearnPage() {
  return (
    <div className="min-h-screen bg-pink-50" style={dotPatternStyle}>
      <header className="sticky top-0 z-20 border-b border-white/10 bg-indigo-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={LOGO_URL}
              alt="FA Thailand"
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-cover"
            />
            <div>
              <p className="text-sm font-bold text-white">FA Thailand Technical</p>
              <p className="text-[11px] text-indigo-300">หมวด: Play and Learn</p>
            </div>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับหน้าแรก
          </Link>
        </div>
      </header>

      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-pink-100 via-pink-50 to-purple-50">
        <div className="absolute inset-0" style={dotPatternStyle} />
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-pink-300/30 blur-3xl" />
        <div className="absolute -right-16 top-10 h-80 w-80 rounded-full bg-purple-300/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-fuchsia-200/40 blur-3xl" />

        <Star className="animate-float-y absolute left-8 top-16 hidden h-6 w-6 text-amber-400/70 sm:block" />
        <Heart className="animate-float-y absolute right-12 top-24 hidden h-6 w-6 text-pink-400/70 sm:block" style={{ animationDelay: "1s" }} />
        <Sparkles className="animate-float-y absolute left-1/4 bottom-16 hidden h-5 w-5 text-purple-400/70 sm:block" style={{ animationDelay: "0.5s" }} />
        <Flower2 className="animate-float-y absolute right-1/4 bottom-10 hidden h-6 w-6 text-fuchsia-400/70 sm:block" style={{ animationDelay: "1.5s" }} />

        <div className="relative mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
          <h1 className="sr-only">PLAY AND LEARN เพลินให้สุดกับฟุตบอล</h1>
          <Image
            src={PLAY_AND_LEARN_LOGO_URL}
            alt="PLAY AND LEARN เพลินให้สุดกับฟุตบอล"
            width={480}
            height={480}
            className="mx-auto h-auto w-52 sm:w-64"
            priority
          />
          <p className="mx-auto mt-4 max-w-xl text-sm text-purple-900/70 sm:text-base">
            โครงการฟุตบอลสำหรับเด็กผู้หญิงวัย 5–8 ปี ภายใต้สมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์
          </p>
          <p className="mx-auto mt-1 max-w-xl text-xs italic text-purple-900/50 sm:text-sm">
            &ldquo;Where Thai girls grow, play and shine&rdquo;
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#centers"
              className="rounded-full bg-linear-to-r from-pink-200 to-purple-200 px-6 py-3 text-sm font-bold text-purple-900 shadow-sm transition-transform hover:scale-105 hover:from-pink-300 hover:to-purple-300"
            >
              ดูศูนย์ฝึกใกล้บ้าน
            </a>
            <a
              href="#passport"
              className="rounded-full border border-purple-200 bg-white/70 px-6 py-3 text-sm font-bold text-purple-700 backdrop-blur-sm transition-colors hover:bg-white"
            >
              ดาวน์โหลด Adventure Passport
            </a>
          </div>
        </div>

        <svg className="relative block w-full text-pink-50" viewBox="0 0 1440 60" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,32 C480,72 960,0 1440,32 L1440,60 L0,60 Z" />
        </svg>
      </section>

      {/* 2. Introduction Section */}
      <section className="relative mx-auto max-w-4xl px-6 py-4">
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-400">Introduction</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">เกี่ยวกับโครงการ</h2>
        </div>

        <div className="space-y-4 rounded-3xl border border-pink-100 bg-white/80 p-6 text-sm leading-relaxed text-slate-600 shadow-sm backdrop-blur-sm sm:text-[15px]">
          <p>
            <strong className="text-slate-900">PLAY AND LEARN เพลินให้สุดกับฟุตบอล</strong> คือโครงการที่สมาคมกีฬาฟุตบอลแห่งประเทศไทย
            ในพระบรมราชูปถัมภ์ ได้รับแรงบันดาลใจมาจาก UEFA Playmakers ซึ่งเป็นหนึ่งในความมุ่งมั่นของ UEFA
            ที่อยากเปิดโอกาสให้เด็กผู้หญิงได้สัมผัสความสนุกสนานและเสน่ห์ของกีฬาฟุตบอล
            พร้อมทั้งสร้างแรงบันดาลใจให้หันมาเล่นฟุตบอลมากขึ้น
          </p>
          <p>
            โดยเลือก <strong className="text-slate-900">&ldquo;กุ๋งกิ๋ง&rdquo;</strong>{" "}
            ตัวละครเด็กผู้หญิงตัวกลม อารมณ์ดี วัย 5 ขวบ จากหนังสือนิทานชุด &ldquo;กุ๋งกิ๋ง&rdquo; ของบริษัท แปลน ฟอร์ คิดส์ จำกัด
            ซึ่งมียอดตีพิมพ์กว่า 5 ล้านเล่มและเป็นเพื่อนรักของเด็กไทยมายาวนานกว่า 20 ปี
            เป็นผู้นำทีมเด็กผู้หญิงก้าวสู่สนามฟุตบอลเป็นครั้งแรก
          </p>
          <p>
            โครงการนี้ไม่ใช่เพียงการส่งเสริมกีฬาฟุตบอลสำหรับเด็กผู้หญิง
            แต่ยังช่วยปลุกพลังและสร้างความมั่นใจให้เด็กผู้หญิงได้แสดงศักยภาพในฐานะนักกีฬา
            ภายใต้สภาพแวดล้อมที่เป็นมิตร ปลอดภัย และสนุกสนาน เพราะ{" "}
            <strong className="text-slate-900">&ldquo;เด็กผู้หญิง ไม่ว่าอยู่ที่ไหนก็สามารถเล่นฟุตบอลได้&rdquo;</strong>
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-purple-100 bg-purple-100/50 p-5 text-sm text-purple-900">
          <p>
            คู่มือการสอนฟุตบอลขั้นพื้นฐานมีกุ๋งกิ๋งเป็นผู้ช่วยโค้ช ชวนเด็กๆ เดินทางในจินตนาการผ่านเรื่องราว{" "}
            <strong>8 บท</strong> ต่อเนื่อง <strong>10 สัปดาห์</strong> สัปดาห์ละ 1 ครั้ง ครั้งละ 45 นาที
            ภายใต้การดูแลของโค้ชที่ได้รับการรับรองจากสมาคมกีฬาฟุตบอลแห่งประเทศไทยฯ
          </p>
        </div>

        {/* 3 เสาหลักของการเรียนรู้ */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {learningPillars.map(({ icon: Icon, title, titleEn, description, color }) => (
            <div key={title} className="flex flex-col gap-3 rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="text-xs text-purple-400">{titleEn}</p>
              </div>
              <p className="text-sm text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Adventure Passport */}
      <section id="passport" className="relative mx-auto max-w-5xl px-6 py-14">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-400">Adventure Passport</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">พาสปอร์ตแห่งความสนุก</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
            เด็กๆ จะได้รับพาสปอร์ตแห่งความสนุกในแต่ละบท บันทึกการผจญภัยของกุ๋งกิ๋งและการฝึกทักษะการเคลื่อนไหวพื้นฐาน
            ให้กลับไปทำกิจกรรมที่บ้านร่วมกับครอบครัว
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {PLAY_AND_LEARN_PASSPORT_URLS.map((url, i) => {
            const accent = badgeAccents[i % badgeAccents.length];
            return (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-3 rounded-2xl border border-pink-100 bg-white p-5 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br shadow-sm transition-transform group-hover:scale-110 ${accent.bg} ${accent.icon}`}
                >
                  <BookOpen className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">บทที่</p>
                  <p className="text-lg font-extrabold text-slate-900">{i + 1}</p>
                </div>
                <span className="flex items-center gap-1 text-xs font-medium text-purple-600 group-hover:text-purple-700">
                  <Download className="h-3.5 w-3.5" />
                  ดาวน์โหลด
                </span>
              </a>
            );
          })}
        </div>
      </section>

      {/* 4. Activity Centers & Registration */}
      <section id="centers" className="bg-white/80 py-14 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-8 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-purple-400">Activity Centers</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">ศูนย์ฝึกกิจกรรม</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
              ดำเนินกิจกรรมฝึกสอนฟุตบอลระดับภูมิภาคใน 5 จังหวัดทั่วประเทศ ร่วมกับ 5 โรงเรียน/อคาเดมีฟุตบอล
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {activityCenters.map((center) => (
              <div
                key={center.name}
                className="flex flex-col overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm"
              >
                <div className="flex items-center gap-2.5 bg-linear-to-r from-pink-200 to-purple-200 px-5 py-3.5">
                  <MapPin className="h-4 w-4 flex-none text-purple-600" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-purple-900">{center.name}</p>
                    <p className="text-xs text-purple-700/70">
                      {center.province} <span className="text-purple-700/50">/ {center.provinceEn}</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-3 bg-white p-5">
                  <p className="text-xs text-slate-500">{center.address}</p>

                  <div className="flex items-start gap-2">
                    <UserRound className="mt-0.5 h-3.5 w-3.5 flex-none text-purple-400" />
                    <p className="text-xs text-slate-600">{center.coaches.join(" · ")}</p>
                  </div>

                  {center.schedule && (
                    <div className="rounded-lg bg-pink-50 px-3 py-2 text-xs font-medium text-pink-700">
                      {center.schedule}
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-pink-100 pt-3.5">
                    <p className="text-xs text-slate-400">
                      ผู้ประสานงาน: <span className="font-medium text-slate-600">{center.coordinator}</span>
                    </p>
                    {center.registerUrl ? (
                      <a href={center.registerUrl} target="_blank" rel="noopener noreferrer" className={pastelButtonClass}>
                        สมัครเรียน
                      </a>
                    ) : (
                      <a href={`tel:${center.tel.replace(/-/g, "")}`} className={pastelButtonClass}>
                        <Phone className="h-3 w-3" />
                        ติดต่อสมัคร
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* placeholder — เผื่อขยายศูนย์ฝึกเพิ่มในอนาคต */}
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-purple-200 bg-purple-50/40 p-6 text-center">
              <Users className="h-7 w-7 text-purple-300" />
              <p className="text-sm font-medium text-purple-400">ศูนย์ฝึกเพิ่มเติมเร็วๆ นี้</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / closing note */}
      <footer className="relative overflow-hidden bg-linear-to-br from-purple-100 via-fuchsia-50 to-pink-100 py-10 text-center">
        <div className="absolute inset-0 opacity-60" style={dotPatternStyle} />
        <div className="relative mx-auto max-w-2xl px-6">
          <p className="text-sm text-purple-700">กิจกรรมดำเนินภายใต้โครงการ</p>
          <p className="mt-1 text-base font-bold text-purple-900">
            AFC-UEFA Women&apos;s Football Programme (Girls Participation Programme)
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-white/70 px-4 py-2 text-xs font-medium text-purple-700 backdrop-blur-sm transition-colors hover:bg-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            กลับหน้าแรก FA Thailand Technical
          </Link>
        </div>
      </footer>
    </div>
  );
}
