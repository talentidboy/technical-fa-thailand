import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { videoEmbed } from "@/lib/g15-video";
import {
  PLAY_AND_LEARN_NAV_LOGO_URL,
  PLAY_AND_LEARN_HERO_URL,
  PLAY_AND_LEARN_PILLARS_DIAGRAM_URL,
  PLAY_AND_LEARN_MASCOT,
  PLAY_AND_LEARN_ELEMENTS,
} from "@/lib/brand";
import { DEFAULT_PASSPORT, bangkokDay, loadPlSettings, paragraphs, parseFacts, sortEvents, thaiDate, type PlKind } from "@/lib/play-and-learn";
import type { PlayAndLearnCenter, PlayAndLearnItem } from "@/generated/prisma/client";
import { InfoPopups } from "@/components/play-and-learn/InfoPopups";
import { SectionNav } from "@/components/play-and-learn/SectionNav";
import { CountUp } from "@/components/play-and-learn/CountUp";
import { Gallery, type GalleryPhoto } from "@/components/play-and-learn/Gallery";
import { VideoGrid, type PlVideo } from "@/components/play-and-learn/VideoGrid";
import { PassportIcon } from "@/components/play-and-learn/PassportIcon";
import { PassportScene, PassportZone, PassportZoneDefs, passportTint } from "@/components/play-and-learn/PassportScene";
import { Reveal } from "@/components/g15/Reveal";
import styles from "./pl.module.css";
import {
  ArrowLeft,
  ArrowRight,
  Phone,
  Mail,
  MessageCircle,
  Globe,
  Download,
  MapPin,
  Navigation,
  Users,
  Settings,
  UserRound,
  Clock,
  Quote,
  ChevronDown,
  PartyPopper,
  HeartHandshake,
  PersonStanding,
  Volleyball,
  Smile,
  Gift,
  Handshake,
  ShieldCheck,
  BookOpen,
  Sparkles,
  MessageCircleHeart,
  ChevronsRight,
  CalendarDays,
  Repeat,
  Timer,
  Heart,
} from "lucide-react";

// การ์ดเรียงเป็นตาราง กว้างไม่เกิน 350px และจัดกึ่งกลางเมื่อมีน้อยรายการ
const cardGrid = "grid justify-center gap-5 grid-cols-[repeat(auto-fit,minmax(min(100%,290px),350px))]";

// สีพาสเทลของป้ายพาสปอร์ต (วนตามลำดับบท)
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

// ลายจุดสีม่วงพาสเทลบนพื้นชมพูพาสเทล — พื้นหลังของทั้งหน้า
const dotPatternStyle = {
  backgroundImage: "radial-gradient(circle, rgba(192,132,252,0.35) 1.6px, transparent 1.6px)",
  backgroundSize: "26px 26px",
};

// ดอกไม้/ดาวลอยอยู่บนภาพแบนเนอร์
const HERO_DECOR = [
  { src: PLAY_AND_LEARN_ELEMENTS.star, className: `left-[4%] top-[8%] w-7 sm:w-11 ${styles.twinkle}`, delay: "0s" },
  { src: PLAY_AND_LEARN_ELEMENTS.flowerPink, className: `right-[4%] top-[10%] w-9 sm:w-14 ${styles.drift}`, delay: "0.6s" },
  { src: PLAY_AND_LEARN_ELEMENTS.flowerPurple, className: `bottom-[16%] left-[3%] w-8 sm:w-12 ${styles.drift}`, delay: "1.8s" },
  { src: PLAY_AND_LEARN_ELEMENTS.star, className: `bottom-[24%] right-[3%] w-6 sm:w-9 ${styles.twinkle}`, delay: "1.2s" },
  { src: PLAY_AND_LEARN_ELEMENTS.flowerYellow, className: `left-[46%] top-[4%] hidden w-9 sm:block ${styles.drift}`, delay: "2.6s" },
];

// 3 เสาหลักของการเรียนรู้ (จากเนื้อหา "เป้าหมายแห่งการเรียนรู้คู่ความสนุก")
const PILLARS = [
  {
    icon: HeartHandshake,
    th: "ทักษะทางสังคม",
    en: "Life skills and Values",
    desc: "เรียนรู้การอยู่ร่วมกับผู้อื่น การเล่นเป็นทีม การเคารพ และการแก้ไขปัญหา ซึ่งเป็นทักษะพื้นฐานในการใช้ชีวิต",
    tone: "from-pink-300 to-rose-300",
  },
  {
    icon: PersonStanding,
    th: "ทักษะการเคลื่อนไหวขั้นพื้นฐาน",
    en: "Fundamental movement skills",
    desc: "การเคลื่อนที่ การทรงตัว และการควบคุมวัตถุ เช่น เดิน วิ่ง กระโดด หมุนตัว เตะ ขว้าง และรับ-ส่งลูกบอล",
    tone: "from-purple-300 to-violet-300",
  },
  {
    icon: Volleyball,
    th: "ทักษะฟุตบอลขั้นพื้นฐาน",
    en: "Basic football skills",
    desc: "การควบคุมลูกบอล การเคลื่อนที่ไปกับลูกบอล การส่งและการเตะลูกบอล และการเล่นเกม 1 ต่อ 1 และ 3 ต่อ 3",
    tone: "from-teal-300 to-emerald-300",
  },
];

// ปรัชญาฟุตบอล Grassroots
const PHILOSOPHY = [
  { icon: Smile, th: "สนุก", en: "Enjoy", tone: "bg-pink-100 text-pink-600" },
  { icon: Gift, th: "แบ่งปัน", en: "Share", tone: "bg-amber-100 text-amber-600" },
  { icon: Handshake, th: "เคารพกัน", en: "Respect", tone: "bg-purple-100 text-purple-600" },
  { icon: ShieldCheck, th: "ให้ปลอดภัย", en: "Safe", tone: "bg-teal-100 text-teal-600" },
];

// ส่วนประกอบของแต่ละบท (จากคู่มือการสอน)
const LESSON_STEPS = [
  { icon: BookOpen, th: "บทนำ", en: "Introducing The Story" },
  { icon: Users, th: "ตัวละครและเหตุการณ์", en: "Characters & Setting" },
  { icon: Sparkles, th: "สนุก", en: "The Adventure" },
  { icon: MessageCircleHeart, th: "ทบทวนความสนุก", en: "The Reflection" },
  { icon: ChevronsRight, th: "สนุกกันต่อในบทถัดไป", en: "The Cliffhanger" },
];

const SCHEDULE = [
  { icon: CalendarDays, text: "ต่อเนื่อง 10 สัปดาห์" },
  { icon: Repeat, text: "สัปดาห์ละ 1 ครั้ง" },
  { icon: Timer, text: "ครั้งละ 45 นาที" },
  { icon: Heart, text: "2 สัปดาห์สุดท้าย เล่นบทที่ชอบซ้ำอีกครั้ง" },
];

// หน้านี้เปิดสาธารณะไม่ต้องล็อกอิน — เป็นแคมเปญให้ผู้ปกครอง/บุคคลทั่วไปเข้าดูข้อมูลและสมัครเรียนได้เลย
// เนื้อหาทุกส่วนแก้ได้ที่ /play-and-learn/manage · หมวดที่ไม่มีรายการจะถูกซ่อน
export default async function PlayAndLearnPage() {
  const [user, centers, items, s] = await Promise.all([
    getCurrentUser(),
    prisma.playAndLearnCenter.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    prisma.playAndLearnItem.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    loadPlSettings(),
  ]);
  const canManage = user?.role === "ADMIN" || user?.role === "STAFF";

  const of = (kind: PlKind) => items.filter((i) => i.kind === kind && i.published);
  // ยังไม่เคยนำบทพาสปอร์ตเข้าระบบ → ใช้ 8 บทเดิม
  const passport = items.some((i) => i.kind === "PASSPORT") ? of("PASSPORT") : DEFAULT_PASSPORT;
  const { upcoming, past } = sortEvents(of("EVENT"), bangkokDay(new Date()));
  const pastShown = past.slice(0, 6);
  const photos: GalleryPhoto[] = of("PHOTO").flatMap((p) =>
    p.imageUrl ? [{ id: p.id, src: p.imageUrl, title: p.title, album: p.extra, date: p.date ? thaiDate(p.date, "long") : null }] : [],
  );
  const videos: PlVideo[] = of("VIDEO").flatMap((v) => {
    const embed = videoEmbed(v.url);
    if (!embed) return [];
    const youtubeId = embed.provider === "youtube" ? embed.src.match(/\/embed\/([\w-]+)/)?.[1] : null;
    return [{ id: v.id, title: v.title, body: v.body, src: embed.src, provider: embed.provider, thumb: youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : null }];
  });
  const voices = of("TESTIMONIAL");
  const faqs = of("FAQ");
  const partners = of("PARTNER").filter((p) => p.imageUrl);

  const provinces = new Set(centers.map((c) => c.province)).size;
  const facts = [
    ...parseFacts(s.facts),
    ...(centers.length ? [{ value: String(centers.length), label: "ศูนย์ฝึกกิจกรรม" }, { value: String(provinces), label: "จังหวัดทั่วประเทศ" }] : []),
  ];
  const contacts = [
    s.contactPhone && { href: `tel:${s.contactPhone.replace(/[^\d+]/g, "")}`, icon: Phone, label: s.contactPhone },
    s.contactEmail && { href: `mailto:${s.contactEmail}`, icon: Mail, label: s.contactEmail },
    s.lineUrl && { href: s.lineUrl, icon: MessageCircle, label: "LINE" },
    s.facebookUrl && { href: s.facebookUrl, icon: Globe, label: "Facebook" },
  ].filter((c): c is { href: string; icon: typeof Phone; label: string } => !!c);

  const sections = [
    { id: "about", label: "เกี่ยวกับโครงการ", show: true },
    { id: "learning", label: "เรียนรู้อะไรบ้าง", show: true },
    { id: "lesson", label: "1 บทเรียน", show: true },
    { id: "passport", label: "พาสปอร์ต", show: passport.length > 0 },
    { id: "centers", label: "ศูนย์ฝึก", show: true },
    { id: "events", label: "กิจกรรม", show: upcoming.length + pastShown.length > 0 },
    { id: "gallery", label: "แกลเลอรี", show: photos.length > 0 },
    { id: "videos", label: "วิดีโอ", show: videos.length > 0 },
    { id: "voices", label: "เสียงผู้ปกครอง", show: voices.length > 0 },
    { id: "faq", label: "คำถามที่พบบ่อย", show: faqs.length > 0 },
    { id: "join", label: "สมัครเรียน", show: true },
  ]
    .filter((x) => x.show)
    .map(({ id, label }) => ({ id, label }));

  return (
    <div className={`${styles.root} min-h-screen overflow-x-clip bg-pink-50`} style={dotPatternStyle}>
      <header className="sticky top-0 z-30 border-b border-pink-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <Link href="/play-and-learn" className="flex items-center">
            <Image src={PLAY_AND_LEARN_NAV_LOGO_URL} alt="Play and Learn เพลินให้สุดกับฟุตบอล" width={220} height={80} className="h-10 w-auto sm:h-12" priority />
          </Link>
          <div className="flex flex-none items-center gap-2">
            {canManage && (
              <Link
                href="/play-and-learn/manage"
                className="inline-flex items-center gap-1.5 rounded-lg bg-linear-to-r from-pink-400 to-purple-400 px-3 py-2 text-sm font-medium text-white shadow-sm transition-transform hover:scale-105"
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
        <SectionNav sections={sections} />
      </header>

      {/* ภาพแบนเนอร์ (มีโลโก้และเด็กๆ อยู่ในภาพแล้ว) + ดอกไม้/ดาวลอย */}
      <section className="relative overflow-hidden">
        <Image
          src={PLAY_AND_LEARN_HERO_URL}
          alt={`PLAY AND LEARN เพลินให้สุดกับฟุตบอล — ${s.tagline}`}
          width={2750}
          height={1536}
          className="h-auto w-full"
          priority
        />
        {HERO_DECOR.map((d, i) => (
          <Image key={i} src={d.src} alt="" width={64} height={64} className={`pointer-events-none absolute h-auto ${d.className}`} style={{ animationDelay: d.delay }} />
        ))}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-pink-50 to-transparent" />
      </section>

      {/* คำขวัญ + กุ๋งกิ๋งโบกมือ + ลูกบอลเด้ง */}
      <section className="relative mx-auto max-w-5xl px-6 pb-2 pt-4 text-center">
        <Image
          src={PLAY_AND_LEARN_MASCOT.wave}
          alt="กุ๋งกิ๋งโบกมือทักทาย"
          width={260}
          height={320}
          className={`pointer-events-none absolute -top-20 left-0 hidden h-auto w-40 lg:block xl:-left-12 ${styles.sway}`}
        />
        <div className="pointer-events-none absolute right-4 top-2 hidden flex-col items-center lg:flex" aria-hidden>
          <Ball id="hero" className={`h-14 w-14 ${styles.bounce}`} />
          <span className={`mt-1 h-2 w-12 rounded-full bg-purple-900/30 blur-[2px] ${styles.ballShadow}`} />
        </div>
        <Image src={PLAY_AND_LEARN_MASCOT.wave} alt="" width={260} height={320} className={`mx-auto mb-2 h-24 w-auto lg:hidden ${styles.sway}`} />
        <p className={`text-xl font-extrabold leading-snug sm:text-3xl ${styles.gradientText}`}>&ldquo;{s.tagline}&rdquo;</p>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
          ฟุตบอลสำหรับเด็กผู้หญิงวัย 5-8 ปี เรียนสนุกผ่านนิทานการผจญภัยของกุ๋งกิ๋ง
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#centers"
            className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-pink-400 to-purple-400 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-pink-300/50 transition-transform hover:scale-105"
          >
            <MapPin className="h-4 w-4" />
            ดูศูนย์ฝึกใกล้บ้าน
          </a>
          <a
            href="#passport"
            className="inline-flex items-center gap-1.5 rounded-full border border-purple-300 bg-white/80 px-6 py-3 text-sm font-bold text-purple-700 backdrop-blur-sm transition-colors hover:bg-white"
          >
            <Download className="h-4 w-4" />
            ดาวน์โหลด Adventure Passport
          </a>
        </div>
      </section>

      {/* ตัวเลขเด่น */}
      {facts.length > 0 && (
        <section aria-label="ตัวเลขเด่นของโครงการ" className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap justify-center gap-3">
            {facts.map((f, i) => (
              <Reveal key={`${f.value}-${f.label}`} delay={i * 80} className="w-[calc(50%-6px)] sm:w-36">
                <div
                  className={`h-full rounded-3xl border border-pink-100 bg-white/95 px-3 py-5 text-center shadow-sm transition-transform hover:-translate-y-1 hover:rotate-0 ${i % 2 ? "rotate-1" : "-rotate-1"}`}
                >
                  <p className="bg-linear-to-br from-pink-500 to-purple-500 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
                    <CountUp value={f.value} />
                  </p>
                  <p className="mt-1 text-xs font-medium leading-snug text-slate-500">{f.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* เกี่ยวกับโครงการ */}
      <section id="about" className="relative mx-auto max-w-4xl scroll-mt-32 px-6 pb-14 pt-4">
        <SectionTitle eyebrow="Introduction" title="PLAY AND LEARN เพลินให้สุดกับฟุตบอล" as="h1" />
        <Image
          src={PLAY_AND_LEARN_MASCOT.standingOnBall}
          alt=""
          width={260}
          height={340}
          className={`pointer-events-none absolute -right-36 top-40 hidden h-auto w-36 xl:block ${styles.float}`}
        />
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-pink-100 bg-white p-6 shadow-lg shadow-pink-200/50 sm:p-10">
            <Image src={PLAY_AND_LEARN_ELEMENTS.flowerYellow} alt="" width={72} height={72} className={`pointer-events-none absolute -right-3 -top-3 h-16 w-16 opacity-90 sm:h-20 sm:w-20 ${styles.drift}`} />
            <Image src={PLAY_AND_LEARN_ELEMENTS.flowerPurple} alt="" width={64} height={64} className={`pointer-events-none absolute -bottom-4 -left-4 h-14 w-14 opacity-80 ${styles.drift}`} style={{ animationDelay: "2s" }} />
            <div className="relative space-y-5 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
              {paragraphs(s.intro).map((parts, i) => (
                <p key={i}>
                  {parts.map((part, j) =>
                    part.bold ? (
                      <strong key={j} className="text-slate-900">
                        {part.text}
                      </strong>
                    ) : (
                      <Fragment key={j}>{part.text}</Fragment>
                    ),
                  )}
                </p>
              ))}
            </div>
            <p className="relative mt-6 border-t border-pink-100 pt-5 text-center italic text-purple-700">
              PLAY AND LEARN เพลินให้สุดกับฟุตบอล &ldquo;{s.tagline}&rdquo;
            </p>
          </div>
        </Reveal>
        <div className="mt-8">
          <InfoPopups />
        </div>
      </section>

      {/* เรียนรู้อะไรบ้าง: 3 เสาหลัก + ปรัชญา Grassroots */}
      <WhiteBand id="learning">
        <SectionTitle
          eyebrow="Learning Goals"
          title="เป้าหมายแห่งการเรียนรู้คู่ความสนุก"
          desc="การได้ ‘เล่น’ ฟุตบอล คือการได้ ‘เรียนรู้’ ฟุตบอล — เด็กทุกคนเล่นฟุตบอลร่วมกันได้อย่างเท่าเทียม อิสระ และสร้างสรรค์"
        />
        <div className="grid items-center gap-8 lg:grid-cols-[300px_1fr]">
          <Reveal className="flex justify-center">
            <Image
              src={PLAY_AND_LEARN_PILLARS_DIAGRAM_URL}
              alt="3 เสาหลักของการเรียนรู้: ทักษะทางสังคม ทักษะการเคลื่อนไหวขั้นพื้นฐาน ทักษะฟุตบอลขั้นพื้นฐาน"
              width={480}
              height={480}
              className={`h-auto w-full max-w-64 lg:max-w-none ${styles.float}`}
            />
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {PILLARS.map((p, i) => (
              <Reveal key={p.en} delay={i * 120}>
                <div className="group flex h-full gap-4 rounded-3xl border border-pink-100 bg-pink-50/40 p-5 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-pink-100 sm:flex-col lg:flex-row">
                  <span className={`flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-md transition-transform group-hover:rotate-6 group-hover:scale-110 ${p.tone}`}>
                    <p.icon className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">
                      {i + 1}. {p.th}
                    </p>
                    <p className="text-xs font-medium text-purple-500">{p.en}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{p.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm font-bold text-purple-700">ปรัชญาการเล่นฟุตบอล Grassroots</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {PHILOSOPHY.map((p, i) => (
              <Reveal key={p.en} delay={i * 110}>
                <span className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold shadow-sm transition-transform hover:-rotate-3 hover:scale-110 ${p.tone}`}>
                  <p.icon className="h-4.5 w-4.5" />
                  {p.th}
                  <span className="text-xs font-semibold opacity-60">{p.en}</span>
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </WhiteBand>

      {/* 1 บทเรียน */}
      <section id="lesson" className="relative mx-auto max-w-5xl scroll-mt-32 px-6 py-14">
        <SectionTitle
          eyebrow="How We Play"
          title="1 บทเรียน สนุกแบบนี้"
          desc="โค้ชอ่านนิทานแล้วชวนน้อง ๆ ออกผจญภัยในจินตนาการไปกับกุ๋งกิ๋ง ทุกเหตุการณ์เชื่อมโยงสู่เกมและการฝึกฟุตบอลขั้นพื้นฐาน"
        />
        <div className={`relative mx-[10%] mb-2 hidden h-10 md:block ${styles.track}`} aria-hidden>
          <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-purple-200" />
          <Ball id="lesson" className={`absolute left-0 top-0 h-10 w-10 ${styles.roll}`} />
        </div>
        <ol className="grid gap-4 md:grid-cols-5">
          {LESSON_STEPS.map((step, i) => (
            <li key={step.en}>
              <Reveal delay={i * 110} className="h-full">
                <div className="flex h-full items-center gap-4 rounded-3xl border border-pink-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg md:flex-col md:p-5 md:text-center">
                  <span className={`relative flex h-14 w-14 flex-none items-center justify-center rounded-full bg-linear-to-br text-white shadow-md ${badgeAccents[i * 2 % badgeAccents.length]}`}>
                    <step.icon className="h-6 w-6" />
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-purple-600 shadow ring-1 ring-pink-100">
                      {i + 1}
                    </span>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{step.th}</p>
                    <p className="text-xs text-purple-500">{step.en}</p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {SCHEDULE.map(({ icon: Icon, text }) => (
            <span key={text} className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-purple-700 shadow-sm ring-1 ring-pink-100">
              <Icon className="h-3.5 w-3.5 text-pink-500" />
              {text}
            </span>
          ))}
        </div>
      </section>

      {/* พาสปอร์ต */}
      {passport.length > 0 && (
        <WhiteBand id="passport">
          <Image
            src={PLAY_AND_LEARN_MASCOT.kicking}
            alt=""
            width={300}
            height={340}
            className={`pointer-events-none absolute -left-4 bottom-4 hidden h-auto w-32 lg:block xl:-left-14 xl:w-40 ${styles.sway}`}
          />
          <SectionTitle
            eyebrow="Adventure Passport"
            title="พาสปอร์ตแห่งความสนุก"
            desc="แผนที่การผจญภัยของกุ๋งกิ๋ง — แต่ละบทมีเรื่องราวและการฝึกทักษะการเคลื่อนไหวพื้นฐาน ให้น้อง ๆ กลับไปทำกิจกรรมที่บ้านร่วมกับครอบครัว"
          />
          <PassportMap chapters={passport} />
        </WhiteBand>
      )}

      {/* ศูนย์ฝึก */}
      <section id="centers" className="relative mx-auto max-w-6xl scroll-mt-32 px-6 py-14">
        <Image
          src={PLAY_AND_LEARN_MASCOT.thumbsUp}
          alt=""
          width={260}
          height={320}
          className={`pointer-events-none absolute -right-2 top-4 hidden h-auto w-28 lg:block xl:-right-8 xl:w-36 ${styles.float}`}
        />
        <SectionTitle eyebrow="Activity Centers" title="ศูนย์ฝึกกิจกรรม" desc={s.centersIntro} />
        {centers.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-purple-200 bg-white/60 px-6 py-16 text-center text-sm text-purple-400">ยังไม่มีข้อมูลศูนย์ฝึก</p>
        ) : (
          <div className={cardGrid}>
            {centers.map((center, i) => (
              <Reveal key={center.id} delay={(i % 3) * 100} className="h-full">
                <CenterCard center={center} />
              </Reveal>
            ))}
            <Reveal delay={(centers.length % 3) * 100} className="h-full">
              <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-purple-200 bg-white/50 p-6 text-center">
                <Users className={`h-8 w-8 text-purple-300 ${styles.float}`} />
                <p className="text-sm font-medium text-purple-400">ศูนย์ฝึกเพิ่มเติมเร็วๆ นี้</p>
              </div>
            </Reveal>
          </div>
        )}
      </section>

      {/* กิจกรรม / ข่าวสาร */}
      {upcoming.length + pastShown.length > 0 && (
        <WhiteBand id="events">
          <SectionTitle eyebrow="Events & News" title="กิจกรรมและข่าวสาร" />
          {upcoming.length > 0 && (
            <div className={cardGrid}>
              {upcoming.map((e, i) => (
                <Reveal key={e.id} delay={(i % 3) * 100} className="h-full">
                  <EventCard event={e} upcoming />
                </Reveal>
              ))}
            </div>
          )}
          {pastShown.length > 0 && (
            <>
              {upcoming.length > 0 && <p className="mb-4 mt-12 text-center text-sm font-bold text-purple-700">กิจกรรมที่ผ่านมา</p>}
              <div className={cardGrid}>
                {pastShown.map((e, i) => (
                  <Reveal key={e.id} delay={(i % 3) * 100} className="h-full">
                    <EventCard event={e} />
                  </Reveal>
                ))}
              </div>
            </>
          )}
        </WhiteBand>
      )}

      {/* แกลเลอรี */}
      {photos.length > 0 && (
        <section id="gallery" className="mx-auto max-w-6xl scroll-mt-32 px-6 py-14">
          <SectionTitle eyebrow="Gallery" title="ภาพความสนุกในสนาม" />
          <Gallery photos={photos} />
        </section>
      )}

      {/* วิดีโอ */}
      {videos.length > 0 && (
        <WhiteBand id="videos">
          <SectionTitle eyebrow="Videos" title="วิดีโอ Play and Learn" />
          <VideoGrid videos={videos} />
        </WhiteBand>
      )}

      {/* เสียงจากผู้ปกครอง */}
      {voices.length > 0 && (
        <section id="voices" className="mx-auto max-w-6xl scroll-mt-32 px-6 py-14">
          <SectionTitle eyebrow="Voices" title="เสียงจากผู้ปกครอง" />
          <div className={cardGrid}>
            {voices.map((v, i) => (
              <Reveal key={v.id} delay={(i % 3) * 110} className="h-full">
                <VoiceCard voice={v} tilt={i % 3 === 1 ? "rotate-1" : i % 3 === 2 ? "-rotate-1" : ""} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* คำถามที่พบบ่อย */}
      {faqs.length > 0 && (
        <WhiteBand id="faq">
          <SectionTitle eyebrow="FAQ" title="คำถามที่พบบ่อย" />
          <div className="mx-auto max-w-3xl space-y-3">
            {faqs.map((f, i) => (
              <Reveal key={f.id} delay={Math.min(i, 6) * 60}>
                <details className="group rounded-2xl border border-pink-100 bg-white shadow-sm transition-shadow open:shadow-md open:ring-2 open:ring-pink-100">
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-pink-100 text-sm font-extrabold text-pink-500">Q</span>
                    <span className="flex-1">{f.title}</span>
                    <ChevronDown className="h-5 w-5 flex-none text-purple-400 transition-transform duration-300 group-open:rotate-180" />
                  </summary>
                  <div className={`whitespace-pre-line px-5 pb-5 text-sm leading-relaxed text-slate-600 sm:pl-16 ${styles.faqBody}`}>{f.body}</div>
                </details>
              </Reveal>
            ))}
          </div>
        </WhiteBand>
      )}

      {/* พาร์ทเนอร์ */}
      {partners.length > 0 && (
        <section aria-label="พาร์ทเนอร์" className="mx-auto max-w-6xl px-6 pt-14">
          <p className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-purple-400">ร่วมสนับสนุนโดย</p>
          {partners.length >= 5 ? (
            <div className={`overflow-hidden ${styles.marqueeWrap}`}>
              <div className={`gap-4 ${styles.marquee}`}>
                {[...partners, ...partners].map((p, i) => (
                  <PartnerLogo key={`${p.id}-${i}`} partner={p} hidden={i >= partners.length} />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-4">
              {partners.map((p) => (
                <PartnerLogo key={p.id} partner={p} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ชวนสมัคร + ช่องทางติดต่อ */}
      <section id="join" className="scroll-mt-32 px-4 py-14 sm:px-6">
        <Reveal>
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-linear-to-br from-pink-300 via-fuchsia-300 to-purple-300 px-6 py-12 text-center shadow-2xl shadow-pink-300/40 sm:px-12">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.7) 1.6px, transparent 1.6px)", backgroundSize: "22px 22px" }}
            />
            <Image src={PLAY_AND_LEARN_ELEMENTS.star} alt="" width={48} height={48} className={`pointer-events-none absolute left-[8%] top-6 h-auto w-8 ${styles.twinkle}`} />
            <Image src={PLAY_AND_LEARN_ELEMENTS.flowerYellow} alt="" width={56} height={56} className={`pointer-events-none absolute right-[10%] top-8 h-auto w-10 ${styles.drift}`} />
            <Image
              src={PLAY_AND_LEARN_MASCOT.throwing}
              alt=""
              width={260}
              height={320}
              className={`pointer-events-none absolute -bottom-2 left-4 hidden h-auto w-32 md:block ${styles.sway}`}
            />
            <Image
              src={PLAY_AND_LEARN_MASCOT.thumbsUp}
              alt=""
              width={260}
              height={320}
              className={`pointer-events-none absolute -bottom-2 right-4 hidden h-auto w-32 md:block ${styles.float}`}
            />
            <div className="relative mx-auto max-w-xl">
              <h2 className="text-2xl font-extrabold text-purple-950 sm:text-4xl">{s.ctaTitle}</h2>
              <p className="mt-3 text-sm font-medium leading-relaxed text-purple-900 sm:text-base">{s.ctaText}</p>
              <a
                href="#centers"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-extrabold text-pink-600 shadow-lg transition-transform hover:scale-105"
              >
                เลือกศูนย์ฝึกใกล้บ้าน
                <ArrowRight className="h-4 w-4" />
              </a>
              {contacts.length > 0 && (
                <div className="mt-7 flex flex-wrap justify-center gap-2">
                  {contacts.map(({ href, icon: Icon, label }) => (
                    <a
                      key={href}
                      href={href}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-4 py-2 text-xs font-bold text-purple-800 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="relative overflow-hidden bg-linear-to-br from-purple-100 via-fuchsia-50 to-pink-100 py-10 text-center">
        <div className="relative mx-auto max-w-2xl px-6">
          <Image src={PLAY_AND_LEARN_ELEMENTS.hashtag} alt="#wherethaigirlsgrowplayandshine" width={800} height={90} className="mx-auto mb-4 h-auto w-full max-w-sm opacity-90" />
          <p className="text-sm text-purple-700">กิจกรรมดำเนินภายใต้โครงการ</p>
          <p className="mt-1 text-base font-bold text-purple-900">AFC-UEFA Women&apos;s Football Programme (Girls Participation Programme)</p>
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

function SectionTitle({ eyebrow, title, desc, as: Heading = "h2" }: { eyebrow: string; title: string; desc?: string; as?: "h1" | "h2" }) {
  return (
    <div className="mb-10 text-center">
      <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-purple-400">
        <Image src={PLAY_AND_LEARN_ELEMENTS.star} alt="" width={16} height={16} className={`h-4 w-4 ${styles.twinkle}`} />
        {eyebrow}
      </p>
      <Heading className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">{title}</Heading>
      {desc && <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">{desc}</p>}
    </div>
  );
}

// แถบพื้นขาวคั่นด้วยเส้นคลื่น สลับกับพื้นลายจุดชมพู
function WhiteBand({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-28">
      <Wave />
      <section className="relative bg-white">
        <div className="relative mx-auto max-w-6xl px-6 py-12">{children}</div>
      </section>
      <Wave flip />
    </div>
  );
}

function Wave({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 1440 48" preserveAspectRatio="none" aria-hidden className={`-my-px block h-6 w-full text-white sm:h-10 ${flip ? "rotate-180" : ""}`}>
      <path d="M0 24C180 48 360 48 540 30S900 0 1080 12s270 30 360 24V48H0Z" fill="currentColor" />
    </svg>
  );
}

// ลูกฟุตบอลโทนม่วงพาสเทล: ห้าเหลี่ยมกลาง + ห้าเหลี่ยมรอบนอก 5 ชิ้น (ถูกขอบวงกลมตัด) เชื่อมด้วยตะเข็บ
const pentagon = (cx: number, cy: number, r: number, rotate: number) =>
  Array.from({ length: 5 }, (_, k) => {
    const a = ((rotate + k * 72) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
const BALL_OUTER = Array.from({ length: 5 }, (_, k) => {
  const a = -90 + k * 72;
  const rad = (a * Math.PI) / 180;
  return { a, x: 32 + 27 * Math.cos(rad), y: 32 + 27 * Math.sin(rad) };
});

// id ต้องไม่ซ้ำกันในหน้า (ใช้ตั้งชื่อ clipPath)
function Ball({ id, className }: { id: string; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <clipPath id={`pl-ball-${id}`}>
          <circle cx="32" cy="32" r="29" />
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r="29" fill="#fff" />
      <g clipPath={`url(#pl-ball-${id})`} fill="#c084fc" stroke="#a855f7" strokeWidth="1.5" strokeLinejoin="round">
        <polygon points={pentagon(32, 32, 10, -90)} />
        {BALL_OUTER.map((o) => (
          <g key={o.a}>
            <line x1={32 + 10 * Math.cos((o.a * Math.PI) / 180)} y1={32 + 10 * Math.sin((o.a * Math.PI) / 180)} x2={o.x} y2={o.y} />
            <polygon points={pentagon(o.x, o.y, 9, o.a + 180)} />
          </g>
        ))}
      </g>
      <circle cx="32" cy="32" r="29" fill="none" stroke="#a855f7" strokeWidth="2.5" />
    </svg>
  );
}

// พาสปอร์ตเป็นแผนที่การผจญภัย: จอใหญ่เป็นเส้นทางคดเคี้ยว 4 จุดต่อแถว · จอมือถือเป็นเส้นทางแนวตั้ง
function PassportMap({ chapters }: { chapters: { title: string; extra: string | null; url: string | null }[] }) {
  const cols = 4;
  const rows = Math.ceil(chapters.length / cols);
  const W = 400;
  const RH = 105;
  const H = rows * RH;
  // จุดบนเส้นทาง = กึ่งกลางภาพฉากของแต่ละบท
  const pos = chapters.map((_, i) => {
    const r = Math.floor(i / cols);
    const c = r % 2 === 0 ? i % cols : cols - 1 - (i % cols);
    return { x: (c + 0.5) * (W / cols), y: r * RH + 44 };
  });
  let d = `M ${pos[0].x} ${pos[0].y}`;
  for (let i = 1; i < pos.length; i++) {
    const a = pos[i - 1];
    const b = pos[i];
    if (a.y === b.y) d += ` Q ${(a.x + b.x) / 2} ${a.y + (i % 2 ? -16 : 16)} ${b.x} ${b.y}`;
    else {
      const ox = a.x + (a.x > W / 2 ? 46 : -46);
      d += ` C ${ox} ${a.y} ${ox} ${b.y} ${b.x} ${b.y}`;
    }
  }

  return (
    <>
      {/* กรอบแผนที่มุมโค้ง — วิวตามสถานที่ไล่สีกลืนกันอยู่ด้านใน */}
      <div className="mx-auto hidden max-w-4xl overflow-hidden rounded-4xl bg-linear-to-br from-sky-50 via-pink-50 to-violet-50 px-4 py-2 shadow-lg shadow-pink-100/60 ring-1 ring-pink-100 md:block">
        <div className="relative" style={{ aspectRatio: `${W} / ${H}` }}>
          <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            <PassportZoneDefs />
            {chapters.map((ch, i) => (
              <PassportZone key={`${ch.title}-${i}`} name={ch.extra} x={pos[i].x - 50} y={pos[i].y - 44} />
            ))}
            <path d={d} fill="none" stroke="#fff" strokeWidth="14" strokeLinecap="round" opacity="0.8" />
            <path d={d} fill="none" stroke="#fbcfe8" strokeWidth="10" strokeLinecap="round" />
            <path d={d} fill="none" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" className={styles.road} />
          </svg>
          {chapters.map((ch, i) => (
            <div
              key={`${ch.title}-${i}`}
              className="absolute w-40 -translate-x-1/2"
              style={{ left: `${(pos[i].x / W) * 100}%`, top: `calc(${(pos[i].y / H) * 100}% - 44px)` }}
            >
              <PassportStop chapter={ch} index={i} />
            </div>
          ))}
        </div>
      </div>

      <ol className="relative space-y-3 before:absolute before:bottom-10 before:left-16 before:top-10 before:border-l-2 before:border-dashed before:border-purple-300 md:hidden">
        {chapters.map((ch, i) => (
          <li key={`${ch.title}-${i}`}>
            <PassportStop chapter={ch} index={i} row />
          </li>
        ))}
      </ol>
    </>
  );
}

// 1 บทบนแผนที่: ภาพฉากเคลื่อนไหวตามเรื่อง + ป้ายไอคอน + ชื่อบท (row = แบบแถวสำหรับจอมือถือ)
function PassportStop({ chapter, index, row }: { chapter: { title: string; extra: string | null; url: string | null }; index: number; row?: boolean }) {
  const scene = (
    <span className={`relative block flex-none overflow-hidden shadow-lg shadow-purple-200/60 ring-4 ring-white ${row ? "h-20 w-28 rounded-xl" : "h-22 w-40 rounded-2xl"}`}>
      <PassportScene name={chapter.extra} />
      <span className="absolute left-1.5 top-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-extrabold text-purple-600 shadow-sm">บทที่ {index + 1}</span>
    </span>
  );
  // ป้ายไอคอนอยู่มุมขวาล่างของภาพ — ไม่บังจุดเด่นกลางฉาก
  const badge = (
    <span
      className={`absolute flex items-center justify-center rounded-full bg-linear-to-br text-white shadow-md ring-[3px] ring-white ${badgeAccents[index % badgeAccents.length]} ${
        row ? "-bottom-2 -right-2 h-9 w-9" : `-bottom-3 -right-3 h-11 w-11 ${styles.float}`
      }`}
      style={row ? undefined : { animationDelay: `${index * 0.35}s` }}
    >
      <PassportIcon name={chapter.extra} className={row ? "h-4.5 w-4.5" : "h-5.5 w-5.5"} />
    </span>
  );
  const text = (
    <span className={row ? "min-w-0 flex-1" : "mt-3 block w-max max-w-44 rounded-xl bg-white/90 px-2.5 py-1 shadow-sm backdrop-blur-sm"}>
      <span className="block text-balance text-xs font-bold leading-snug text-slate-900 sm:text-[13px]">{chapter.title}</span>
      {chapter.url && (
        <span className={`mt-1 flex items-center gap-1 text-[11px] font-semibold text-purple-600 group-hover:text-pink-600 ${row ? "" : "justify-center"}`}>
          <Download className="h-3 w-3" />
          ดาวน์โหลด
        </span>
      )}
    </span>
  );
  const content = row ? (
    <>
      <span className="relative flex-none">
        {scene}
        {badge}
      </span>
      {text}
    </>
  ) : (
    <>
      <span className="relative block transition-transform duration-300 group-hover:-translate-y-1">
        {scene}
        {badge}
      </span>
      {text}
    </>
  );
  const className = `group flex ${row ? `items-center gap-4 rounded-2xl bg-linear-to-r p-2 pr-4 ring-1 ring-white ${passportTint(chapter.extra)}` : "flex-col items-center text-center"}`;
  return chapter.url ? (
    <a href={chapter.url} target="_blank" rel="noopener noreferrer" className={className} aria-label={`ดาวน์โหลดพาสปอร์ตบทที่ ${index + 1} ${chapter.title}`}>
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  );
}

function CenterCard({ center }: { center: PlayAndLearnCenter }) {
  const coaches = center.coaches
    .split("\n")
    .map((c) => c.trim())
    .filter(Boolean);
  const mapHref = center.mapUrl ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${center.name} ${center.address}`)}`;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-200/50">
      <div className="relative h-36 overflow-hidden bg-linear-to-br from-pink-300 via-fuchsia-300 to-purple-300">
        {center.imageUrl ? (
          <Image src={center.imageUrl} alt={center.name} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <>
            <Image src={PLAY_AND_LEARN_ELEMENTS.flowerPink} alt="" width={64} height={64} className={`absolute -right-2 -top-2 h-auto w-16 opacity-70 ${styles.drift}`} />
            <Ball id={`center-${center.id}`} className="absolute bottom-3 right-4 h-10 w-10 opacity-70 transition-transform duration-700 group-hover:-translate-x-6 group-hover:rotate-[-360deg]" />
          </>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-purple-900/60 via-purple-900/5 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="line-clamp-2 text-base font-bold leading-snug text-white drop-shadow">{center.name}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-white/90">
            <MapPin className="h-3 w-3" />
            {center.province} <span className="text-white/70">/ {center.provinceEn}</span>
          </p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-xs leading-relaxed text-slate-500">{center.address}</p>
        <div className="flex flex-wrap gap-2">
          <a
            href={`tel:${center.tel.replace(/[^\d+]/g, "")}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-2.5 py-1 text-xs font-semibold text-pink-700 transition-colors hover:bg-pink-100"
          >
            <Phone className="h-3 w-3" />
            {center.tel}
          </a>
          <a
            href={mapHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-100"
          >
            <Navigation className="h-3 w-3" />
            แผนที่
          </a>
        </div>
        {coaches.length > 0 && (
          <div className="flex items-start gap-2">
            <UserRound className="mt-0.5 h-3.5 w-3.5 flex-none text-purple-400" />
            <p className="text-xs text-slate-600">{coaches.join(" · ")}</p>
          </div>
        )}
        {center.schedule && (
          <div className="flex items-start gap-2 rounded-xl bg-purple-50 px-3 py-2 text-xs font-medium text-purple-700">
            <Clock className="mt-0.5 h-3.5 w-3.5 flex-none" />
            <span className="whitespace-pre-line">{center.schedule}</span>
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
              className="inline-flex flex-none items-center gap-1 rounded-full bg-linear-to-r from-pink-400 to-purple-400 px-4 py-2 text-xs font-bold text-white shadow-sm transition-transform hover:scale-105"
            >
              รับสมัคร
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          ) : (
            <span className="inline-flex flex-none items-center rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-400">เร็วๆ นี้</span>
          )}
        </div>
      </div>
    </article>
  );
}

function EventCard({ event, upcoming }: { event: PlayAndLearnItem; upcoming?: boolean }) {
  const day = event.date?.toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric" });
  const month = event.date?.toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", month: "short", year: "2-digit" });
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-100">
      <div className="relative aspect-video overflow-hidden bg-linear-to-br from-pink-100 via-fuchsia-50 to-purple-100">
        {event.imageUrl ? (
          <Image src={event.imageUrl} alt={event.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <PartyPopper className={`absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 text-pink-300 ${styles.float}`} />
        )}
        {day && (
          <div className="absolute left-3 top-3 min-w-14 rounded-2xl bg-white px-2.5 py-1.5 text-center shadow-md">
            <p className="text-xl font-extrabold leading-none text-pink-500">{day}</p>
            <p className="mt-0.5 text-[10px] font-bold text-purple-600">{month}</p>
          </div>
        )}
        {upcoming && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-pink-600 shadow">
            <span className="relative flex h-2 w-2">
              <span className={`absolute inset-0 rounded-full bg-pink-400 ${styles.ping}`} />
              <span className="relative h-2 w-2 rounded-full bg-pink-500" />
            </span>
            กำลังจะมาถึง
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-bold leading-snug text-slate-900">{event.title}</h3>
        {event.extra && (
          <p className="flex items-center gap-1 text-xs font-medium text-purple-600">
            <MapPin className="h-3.5 w-3.5 flex-none" />
            {event.extra}
          </p>
        )}
        {event.body && <p className="line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-slate-500">{event.body}</p>}
        {event.url && (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex w-fit items-center gap-1 pt-2 text-sm font-bold text-pink-600 transition-colors hover:text-purple-700"
          >
            ดูรายละเอียด
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        )}
      </div>
    </article>
  );
}

function VoiceCard({ voice, tilt }: { voice: PlayAndLearnItem; tilt: string }) {
  return (
    <figure className={`relative flex h-full flex-col rounded-3xl border border-pink-100 bg-white p-6 shadow-sm transition-all hover:rotate-0 hover:shadow-lg ${tilt}`}>
      <Quote className="absolute -top-3 left-5 h-8 w-8 rounded-full bg-linear-to-br from-pink-300 to-purple-300 p-1.5 text-white shadow" />
      <blockquote className="flex-1 whitespace-pre-line pt-2 text-sm leading-relaxed text-slate-600">{voice.body}</blockquote>
      <figcaption className="mt-5 flex items-center gap-3 border-t border-pink-50 pt-4">
        <span className="relative flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-pink-200 to-purple-200 text-sm font-bold text-purple-700">
          {voice.imageUrl ? <Image src={voice.imageUrl} alt="" fill sizes="40px" className="object-cover" /> : voice.title.slice(0, 1)}
        </span>
        <span>
          <span className="block text-sm font-bold text-slate-900">{voice.title}</span>
          {voice.extra && <span className="block text-xs text-slate-500">{voice.extra}</span>}
        </span>
      </figcaption>
    </figure>
  );
}

function PartnerLogo({ partner, hidden }: { partner: PlayAndLearnItem; hidden?: boolean }) {
  const logo = (
    <span className="relative block h-16 w-36 flex-none overflow-hidden rounded-2xl bg-white p-2 shadow-sm ring-1 ring-pink-100 transition-transform hover:-translate-y-0.5 hover:shadow-md">
      <span className="relative block h-full w-full">
        <Image src={partner.imageUrl!} alt={hidden ? "" : partner.title} fill sizes="144px" className="object-contain" />
      </span>
    </span>
  );
  return partner.url ? (
    <a href={partner.url} target="_blank" rel="noopener noreferrer" aria-hidden={hidden} tabIndex={hidden ? -1 : undefined} title={partner.title}>
      {logo}
    </a>
  ) : (
    <span aria-hidden={hidden} title={partner.title}>
      {logo}
    </span>
  );
}
