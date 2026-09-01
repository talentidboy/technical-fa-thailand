import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  PLAY_AND_LEARN_NAV_LOGO_URL,
  PLAY_AND_LEARN_HERO_URL,
  PLAY_AND_LEARN_PASSPORT_URLS,
  PLAY_AND_LEARN_MASCOT,
  PLAY_AND_LEARN_ELEMENTS,
} from "@/lib/brand";
import { InfoPopups } from "@/components/play-and-learn/InfoPopups";
import {
  ArrowLeft,
  Phone,
  Download,
  MapPin,
  Users,
  Settings,
  UserRound,
  Clock,
  Waves,
  Fish,
  TreePalm,
  Mountain,
  Landmark,
  Compass,
  Droplets,
  Moon,
} from "lucide-react";

// สีพาสเทล (โทนอ่อนกว่ารุ่นสดจัด แต่ยังคงโครงสร้าง/ลำดับสีเดิม)
const badgeAccents = [
  "from-pink-300 to-rose-300",
  "from-fuchsia-300 to-purple-300",
  "from-purple-300 to-indigo-300",
  "from-amber-300 to-orange-300",
  "from-emerald-300 to-teal-300",
  "from-sky-300 to-cyan-300",
  "from-rose-300 to-pink-300",
  "from-violet-300 to-fuchsia-300",
];

// พาสปอร์ตแห่งความสนุก 8 บท — ชื่อตอนจริงจากคู่มือกุ๋งกิ๋ง แต่ละบทจับคู่กับไอคอนที่สื่อถึงเนื้อเรื่อง ให้ดูเป็นแผนที่การผจญภัยจริงๆ
const passportChapters = [
  { title: "กุ๋งกิ๋งไปทะเล", icon: Waves },
  { title: "กุ๋งกิ๋งเที่ยวพิพิธภัณฑ์สัตว์น้ำ", icon: Fish },
  { title: "กุ๋งกิ๋งเที่ยวภาคใต้", icon: TreePalm },
  { title: "กุ๋งกิ๋งเที่ยวภาคเหนือ", icon: Mountain },
  { title: "กุ๋งกิ๋งเที่ยวภาคอีสาน", icon: Landmark },
  { title: "กุ๋งกิ๋งเที่ยวภาคกลาง", icon: Compass },
  { title: "กุ๋งกิ๋ง สุขสันต์วันสงกรานต์", icon: Droplets },
  { title: "กุ๋งกิ๋ง สุขสันต์วันลอยกระทง", icon: Moon },
];

// ลายจุดสีม่วงพาสเทลบนพื้นชมพูพาสเทล — ใช้เป็นพื้นหลังลายของทั้งหน้า (โทนสีหลักตามที่ขอ: ชมพูพาสเทล + ลายม่วงพาสเทล)
const dotPatternStyle = {
  backgroundImage: "radial-gradient(circle, rgba(192,132,252,0.35) 1.6px, transparent 1.6px)",
  backgroundSize: "26px 26px",
};

// หน้านี้เปิดสาธารณะไม่ต้องล็อกอิน — เป็นแคมเปญให้ผู้ปกครอง/บุคคลทั่วไปเข้าดูข้อมูลและสมัครเรียนได้เลย
export default async function PlayAndLearnPage() {
  const [user, centers] = await Promise.all([
    getCurrentUser(),
    prisma.playAndLearnCenter.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
  ]);
  const canManage = user?.role === "ADMIN" || user?.role === "STAFF";

  return (
    <div className="min-h-screen bg-pink-50" style={dotPatternStyle}>
      {/* แถบบนสุด — ใช้โลโก้ Play and Learn แทนโลโก้ FA Thailand ทั่วไป ให้เข้ากับธีมของหน้านี้โดยเฉพาะ */}
      <header className="sticky top-0 z-20 border-b border-pink-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-2.5">
          <Link href="/play-and-learn" className="flex items-center">
            <Image
              src={PLAY_AND_LEARN_NAV_LOGO_URL}
              alt="Play and Learn เพลินให้สุดกับฟุตบอล"
              width={220}
              height={80}
              className="h-11 w-auto sm:h-12"
              priority
            />
          </Link>
          <div className="flex flex-none items-center gap-2">
            {canManage && (
              <Link
                href="/play-and-learn/manage"
                className="inline-flex items-center gap-1.5 rounded-lg bg-linear-to-r from-pink-300 to-purple-300 px-3 py-2 text-sm font-medium text-white shadow-sm transition-transform hover:scale-105"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">จัดการข้อมูล</span>
              </Link>
            )}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 px-3 py-2 text-sm font-medium text-purple-600 transition-colors hover:bg-purple-50"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">กลับหน้าแรก</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 1. Hero Section — ภาพแบนเนอร์ที่มีโลโก้และเด็กๆ เล่นฟุตบอลอยู่ในภาพแล้ว จึงโชว์เต็มความกว้างไปเลยโดยไม่ทับข้อความซ้ำ */}
      <section className="relative overflow-hidden">
        <Image
          src={PLAY_AND_LEARN_HERO_URL}
          alt="PLAY AND LEARN เพลินให้สุดกับฟุตบอล — Where Thai girls grow, play and shine"
          width={2750}
          height={1536}
          className="h-auto w-full"
          priority
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-pink-50 to-transparent" />
      </section>

      <div className="relative mx-auto max-w-3xl px-6 pt-8 text-center">
        <Image
          src={PLAY_AND_LEARN_ELEMENTS.star}
          alt=""
          width={64}
          height={64}
          className="animate-float-y absolute -left-2 top-2 hidden h-10 w-10 opacity-80 sm:block"
        />
        <Image
          src={PLAY_AND_LEARN_ELEMENTS.flowerPink}
          alt=""
          width={64}
          height={64}
          className="animate-float-y absolute -right-2 top-6 hidden h-12 w-12 opacity-80 sm:block"
          style={{ animationDelay: "1s" }}
        />
        <p className="text-xs italic text-purple-900/50 sm:text-sm">&ldquo;Where Thai girls grow, play and shine&rdquo;</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#centers"
            className="rounded-full bg-linear-to-r from-pink-300 to-purple-300 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-pink-300/40 transition-transform hover:scale-105"
          >
            ดูศูนย์ฝึกใกล้บ้าน
          </a>
          <a
            href="#passport"
            className="rounded-full border border-purple-300 bg-white/70 px-6 py-3 text-sm font-bold text-purple-700 backdrop-blur-sm transition-colors hover:bg-white"
          >
            ดาวน์โหลด Adventure Passport
          </a>
        </div>
      </div>

      {/* 2. Introduction Section */}
      <section className="relative mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-400">Introduction</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">PLAY AND LEARN เพลินให้สุดกับฟุตบอล</h1>
        </div>

        {/* ห่อเป็นการ์ดพื้นขาวให้ตัดกับพื้นหลังลายจุด ไม่ให้ข้อความกลืนไปกับพื้น */}
        <div className="relative overflow-hidden rounded-3xl border border-pink-100 bg-white p-6 shadow-lg shadow-pink-200/50 sm:p-8">
          <Image
            src={PLAY_AND_LEARN_ELEMENTS.flowerYellow}
            alt=""
            width={72}
            height={72}
            className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rotate-12 opacity-90 sm:h-20 sm:w-20"
          />
          <div className="relative space-y-5 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
            <p>
              PLAY AND LEARN เพลินให้สุดกับฟุตบอล คือโครงการที่สมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์
              ได้รับแรงบันดาลใจมาจาก UEFA Playmakers ซึ่งเป็นหนึ่งในความมุ่งมั่นของ UEFA (สหภาพสมาคมฟุตบอลยุโรป)
              ที่อยากเปิดโอกาสให้เด็กผู้หญิงได้สัมผัสความสนุกสนาน และเสน่ห์ของกีฬาฟุตบอล พร้อมทั้งสร้างแรงบันดาลใจให้หันมาเล่นฟุตบอลมากขึ้น
            </p>
            <p>
              สมาคมกีฬาฟุตบอลแห่งประเทศไทยฯ จึงริเริ่มโครงการ PLAY AND LEARN เพลินให้สุดกับฟุตบอล ขึ้น โดยเลือก
              <strong className="text-slate-900"> &ldquo;กุ๋งกิ๋ง&rdquo;</strong> ตัวละครเด็กผู้หญิงตัวกลม อารมณ์ดี วัย 5 ขวบ
              จากหนังสือนิทานชุด &ldquo;กุ๋งกิ๋ง&rdquo; ของบริษัท แปลน ฟอร์ คิดส์ จำกัด ซึ่งมียอดตีพิมพ์กว่า 5
              ล้านเล่มและเป็นเพื่อนรักของเด็กไทยมายาวนานกว่า 20 ปี เป็นผู้นำทีมเด็กผู้หญิงก้าวสู่สนามฟุตบอลเป็นครั้งแรก
            </p>
            <p>
              PLAY AND LEARN เพลินให้สุดกับฟุตบอล ไม่ใช่เป็นเพียงโครงการที่ส่งเสริมกีฬาฟุตบอลสำหรับเด็กผู้หญิง
              แต่ยังช่วยปลุกพลังและสร้างความมั่นใจให้เด็กผู้หญิงได้แสดงศักยภาพในฐานะนักกีฬา
              เพื่อเติบโตสู่การเป็นนักฟุตบอลมืออาชีพในอนาคต
            </p>
            <p>
              สมาคมกีฬาฟุตบอลแห่งประเทศไทย มีความตั้งใจที่จะสนับสนุนฟุตบอลเด็กผู้หญิงผ่านการจัดกิจกรรม
              เพื่อให้เด็กผู้หญิงได้รู้จักกีฬาฟุตบอลสร้างพื้นที่ให้ได้แสดงออกและมีส่วนร่วมในกิจกรรมฟุตบอล
              ภายใต้สภาพแวดล้อมที่เป็นมิตร ปลอดภัย และสนุกสนาน มุ่งเสริมสร้างความมั่นใจ เปิดโอกาสให้ได้ทำความรู้จักเพื่อนใหม่
              เรียนรู้ทักษะชีวิต และเปลี่ยนภาพจำของกีฬาฟุตบอลว่าเป็นกีฬาสำหรับทุกคน ไม่ใช่เฉพาะผู้ชายเท่านั้น และที่สำคัญ คือ
              <strong className="text-slate-900"> &ldquo;เด็กผู้หญิง ไม่ว่าอยู่ที่ไหนก็สามารถเล่นฟุตบอลได้&rdquo;</strong>
            </p>
            <p>
              PLAY AND LEARN เพลินให้สุดกับฟุตบอลจึงเป็นอีกก้าวสำคัญในการสร้างแรงบันดาลใจและต่อยอดการพัฒนาฟุตบอลหญิงไทยอย่างยั่งยืน
            </p>
          </div>
          <p className="relative mt-6 border-t border-pink-100 pt-5 text-center italic text-purple-700">
            PLAY AND LEARN เพลินให้สุดกับฟุตบอล &ldquo;Where Thai girls grow, play and shine&rdquo;
          </p>
        </div>

        {/* 3 ปุ่มป๊อปอัพอ่านรายละเอียดเพิ่มเติม */}
        <div className="mt-8">
          <InfoPopups />
        </div>
      </section>

      {/* 3. Adventure Passport */}
      <section id="passport" className="relative mx-auto max-w-5xl px-6 py-14">
        <Image
          src={PLAY_AND_LEARN_MASCOT.kicking}
          alt=""
          width={300}
          height={340}
          className="pointer-events-none absolute -left-4 bottom-0 hidden w-32 opacity-90 lg:block xl:-left-16 xl:w-44"
        />
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-400">Adventure Passport</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">พาสปอร์ตแห่งความสนุก</h2>
          <p className="mt-1 text-sm font-bold text-pink-500">🗺️ แผนที่การผจญภัยของกุ๋งกิ๋ง 8 บท</p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
            เด็กๆ จะได้รับพาสปอร์ตแห่งความสนุกในแต่ละบท บันทึกการผจญภัยของกุ๋งกิ๋งและการฝึกทักษะการเคลื่อนไหวพื้นฐาน
            ให้กลับไปทำกิจกรรมที่บ้านร่วมกับครอบครัว
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {passportChapters.map((chapter, i) => {
            const Icon = chapter.icon;
            const tilt = i % 2 === 0 ? "-rotate-1" : "rotate-1";
            return (
              <a
                key={chapter.title}
                href={PLAY_AND_LEARN_PASSPORT_URLS[i]}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex flex-col items-center gap-2.5 rounded-2xl border border-pink-100 bg-white p-4 text-center shadow-sm transition-all hover:-translate-y-1 hover:rotate-0 hover:shadow-lg ${tilt}`}
              >
                <div
                  className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br text-white shadow-md transition-transform group-hover:scale-110 ${badgeAccents[i % badgeAccents.length]}`}
                >
                  <Icon className="h-7 w-7" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-purple-600 shadow ring-1 ring-pink-100">
                    {i + 1}
                  </span>
                </div>
                <p className="min-h-8 text-xs font-bold leading-snug text-slate-900">{chapter.title}</p>
                <span className="flex items-center gap-1 text-[11px] font-medium text-purple-600 group-hover:text-purple-700">
                  <Download className="h-3 w-3" />
                  ดาวน์โหลด
                </span>
              </a>
            );
          })}
        </div>
      </section>

      {/* 4. Activity Centers & Registration */}
      <section id="centers" className="relative bg-white py-14">
        <Image
          src={PLAY_AND_LEARN_MASCOT.thumbsUp}
          alt=""
          width={260}
          height={320}
          className="pointer-events-none absolute -right-2 top-6 hidden w-28 opacity-90 lg:block xl:-right-10 xl:w-40"
        />
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-8 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-purple-400">Activity Centers</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">ศูนย์ฝึกกิจกรรม</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
              ดำเนินกิจกรรมฝึกสอนฟุตบอลระดับภูมิภาคใน 5 จังหวัดทั่วประเทศ ร่วมกับ 5 โรงเรียน/อคาเดมีฟุตบอล
            </p>
          </div>

          {centers.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/40 px-6 py-16 text-center text-sm text-purple-400">
              ยังไม่มีข้อมูลศูนย์ฝึก
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {centers.map((center) => (
                <div
                  key={center.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm"
                >
                  <div className="flex items-center gap-2.5 bg-linear-to-r from-pink-300 to-purple-300 px-5 py-3.5">
                    <MapPin className="h-4 w-4 flex-none text-white" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{center.name}</p>
                      <p className="text-xs text-white/80">
                        {center.province} <span className="text-white/60">/ {center.provinceEn}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 bg-white p-5">
                    <p className="text-xs text-slate-500">{center.address}</p>

                    <a
                      href={`tel:${center.tel.replace(/-/g, "")}`}
                      className="flex w-fit items-center gap-1.5 rounded-full bg-pink-50 px-2.5 py-1 text-xs font-semibold text-pink-700 transition-colors hover:bg-pink-100"
                    >
                      <Phone className="h-3 w-3" />
                      {center.tel}
                    </a>

                    {center.coaches && (
                      <div className="flex items-start gap-2">
                        <UserRound className="mt-0.5 h-3.5 w-3.5 flex-none text-purple-400" />
                        <p className="text-xs text-slate-600">
                          {center.coaches
                            .split("\n")
                            .map((c) => c.trim())
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    )}

                    {center.schedule && (
                      <div className="flex items-start gap-2 rounded-lg bg-purple-50 px-3 py-2 text-xs font-medium text-purple-700">
                        <Clock className="mt-0.5 h-3.5 w-3.5 flex-none" />
                        {center.schedule}
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-pink-100 pt-3.5">
                      <p className="text-xs text-slate-400">
                        ผู้ประสานงาน: <span className="font-medium text-slate-600">{center.coordinator}</span>
                      </p>
                      {center.registerUrl ? (
                        <a
                          href={center.registerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex flex-none items-center gap-1.5 rounded-full bg-linear-to-r from-pink-300 to-purple-300 px-4 py-2 text-xs font-bold text-white shadow-sm transition-transform hover:scale-105"
                        >
                          รับสมัคร
                        </a>
                      ) : (
                        <span className="inline-flex flex-none items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-400">
                          เร็วๆ นี้
                        </span>
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
          )}
        </div>
      </section>

      {/* Footer / closing note */}
      <footer className="relative overflow-hidden bg-linear-to-br from-purple-100 via-fuchsia-50 to-pink-100 py-10 text-center">
        <div className="relative mx-auto max-w-2xl px-6">
          <Image
            src={PLAY_AND_LEARN_ELEMENTS.hashtag}
            alt="#wherethaigirlsgrowplayandshine"
            width={800}
            height={90}
            className="mx-auto mb-4 h-auto w-full max-w-sm opacity-90"
          />
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
