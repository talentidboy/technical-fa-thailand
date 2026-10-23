import Image from "next/image";
import Link from "next/link";
import { GRASSROOTS_YEAR, grassrootsCoaches as coaches, grassrootsPlayers as players } from "@/lib/grassroots-data";
import { GRASSROOTS_LOGO_URL } from "@/lib/brand";
import { grassrootsBg } from "@/lib/section-images";
import { grassrootsFont } from "@/components/typefaces/grassroots";
import { BrandLogo } from "@/components/BrandLogo";
import { HomeButton } from "@/components/HomeButton";
import { ProvinceMap, provinceCodeByName } from "@/components/ProvinceMap";
import { Reveal } from "@/components/g15/Reveal";
import styles from "./grassroots.module.css";
import { ArrowDown } from "lucide-react";

const g = grassrootsFont.className;

// สีประจำหมวด: เขียวสนาม · ส้มเสื้อเด็ก · เหลืองสดใส · ฟ้า
const C = { cream: "#fff7e8", green: "#0b4d2c", grass: "#0f7a3d", orange: "#ff6b1a", yellow: "#ffcc29", sky: "#2f9bd6", ink: "#0b2a1a" };

const PILLARS = [
  { title: "สนุกเป็นหลัก", description: "ปลูกฝังความรักในกีฬาฟุตบอลผ่านกิจกรรมที่สนุกและเหมาะสมกับวัย", bg: C.grass, fg: "#ffffff" },
  { title: "การมีส่วนร่วม", description: "เปิดโอกาสให้เด็กและเยาวชนทุกคนได้ร่วมกิจกรรมฟุตบอลอย่างทั่วถึง", bg: C.yellow, fg: C.ink },
  { title: "พัฒนาการรอบด้าน", description: "เสริมสร้างทักษะกาย ใจ สังคม และการคิด ควบคู่ไปกับทักษะฟุตบอล", bg: C.orange, fg: "#ffffff" },
  { title: "รากฐานที่มั่นคง", description: "วางรากฐานสู่เส้นทางนักกีฬาและผู้ฝึกสอนในระดับที่สูงขึ้น", bg: C.sky, fg: "#ffffff" },
];

const MALE = "#7cc4ff";
const FEMALE = "#ffb3c7";

// แผนที่: ระบายสีเฉพาะ 5 จังหวัดที่มีนักฟุตบอลมากที่สุด (ข้อมูลรายจังหวัดมีแค่ 5 อันดับแรก)
const MAP_BINS = [1, 200, 400, 700];
const MAP_COLORS = ["#ffe08a", "#ffb547", "#ff8a2a", "#e0550c"];
const MEDAL = ["#ffcc29", "#cfd6dd", "#e3a66d"];

// ลูกฟุตบอลเล็กคั่นข้อความในริบบิ้น
function Ball({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <circle cx="12" cy="12" r="10.5" fill="currentColor" />
      <path d="M12 7.2l3.6 2.6-1.4 4.2H9.8L8.4 9.8z" fill="#0b4d2c" />
    </svg>
  );
}

// เส้นสนามฟุตบอลบนพื้นหญ้า (ตกแต่งส่วนสถิติ)
function PitchLines() {
  const s = { fill: "none", stroke: "#ffffff", strokeOpacity: 0.16, strokeWidth: 3 };
  return (
    <svg aria-hidden viewBox="0 0 1200 760" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full">
      <rect x="40" y="40" width="1120" height="680" {...s} />
      <line x1="600" y1="40" x2="600" y2="720" {...s} />
      <circle cx="600" cy="380" r="100" {...s} />
      <rect x="40" y="200" width="170" height="360" {...s} />
      <rect x="990" y="200" width="170" height="360" {...s} />
      <rect x="40" y="300" width="60" height="160" {...s} />
      <rect x="1100" y="300" width="60" height="160" {...s} />
      <path d="M210 315 A80 80 0 0 1 210 445" {...s} />
      <path d="M990 315 A80 80 0 0 0 990 445" {...s} />
    </svg>
  );
}

function GenderBar({ male, malePercent, female, femalePercent }: { male: number; malePercent: number; female: number; femalePercent: number }) {
  return (
    <div>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
        <span title={`ชาย ${male.toLocaleString()} คน`} style={{ width: `${malePercent}%`, background: MALE }} />
        <span title={`หญิง ${female.toLocaleString()} คน`} style={{ width: `${femalePercent}%`, background: FEMALE }} />
      </div>
      <div className="mt-2.5 flex justify-between gap-4 text-sm">
        <span className="flex items-baseline gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: MALE }} />
          ชาย <b className={`${g} text-lg font-semibold`}>{male.toLocaleString()}</b>
          <span className="text-xs text-white/60">{malePercent}%</span>
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: FEMALE }} />
          หญิง <b className={`${g} text-lg font-semibold`}>{female.toLocaleString()}</b>
          <span className="text-xs text-white/60">{femalePercent}%</span>
        </span>
      </div>
    </div>
  );
}

function Leaderboard({ title, items, total }: { title: string; items: { name: string; count: number }[]; total: number }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div>
      <p className={`${g} mb-4 text-lg font-medium`} style={{ color: C.green }}>
        {title}
      </p>
      <ol className="space-y-3">
        {items.map((item, i) => (
          <li key={item.name} className="flex items-center gap-3" title={`${item.name}: ${item.count.toLocaleString()} คน (${((item.count / total) * 100).toFixed(1)}%)`}>
            <span
              className={`${g} flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-semibold`}
              style={{ background: MEDAL[i] ?? "#f1e8d6", color: C.ink }}
            >
              {i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-3">
                <span className="truncate font-medium text-slate-800">{item.name}</span>
                <span className={`${g} flex-none font-semibold tabular-nums`} style={{ color: C.green }}>
                  {item.count.toLocaleString()}
                </span>
              </span>
              <span className="mt-1 block h-2 rounded-full bg-[#f1e8d6]">
                <span className="block h-full rounded-full" style={{ width: `${(item.count / max) * 100}%`, background: C.orange }} />
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// หน้าสาธารณะ — ไม่ต้องเข้าสู่ระบบ (ข้อมูลสรุปโครงการ ไม่มีข้อมูลส่วนบุคคล)
export default function GrassrootsFootballPage() {
  // ใบอนุญาตของผู้ฝึกสอนในโครงการ — ส่วนที่เหลือจากรายการหลัก = ระดับ A/B Diploma และอื่นๆ
  const licensed = coaches.licenses.reduce((s, l) => s + l.count, 0);
  const otherLicences = Math.max(0, coaches.total - coaches.noLicense - licensed);
  const licenceMix = [
    ...coaches.licenses.map((l, i) => ({ label: l.label, count: l.count, color: [C.yellow, C.orange, MALE][i] ?? FEMALE })),
    ...(otherLicences > 0 ? [{ label: "A/B Diploma และอื่นๆ", count: otherLicences, color: FEMALE }] : []),
    { label: "ยังไม่มีใบอนุญาต", count: coaches.noLicense, color: "rgb(255 255 255 / 0.22)" },
  ];

  const ageMax = Math.max(...players.ageRanges.map((a) => a.count), 1);
  const peakAge = players.ageRanges.reduce((a, b) => (b.count > a.count ? b : a));

  const mapValues: Record<number, number> = {};
  const markers: { code: number; label: string }[] = [];
  for (const p of players.topProvinces) {
    const code = provinceCodeByName(p.name);
    if (code == null) continue;
    mapValues[code] = p.count;
    markers.push({ code, label: p.count.toLocaleString() });
  }

  const ribbon = ["สนุกเป็นหลัก", "การมีส่วนร่วม", "พัฒนาการรอบด้าน", "รากฐานที่มั่นคง", "Grassroots Football", `ฤดูกาล ${GRASSROOTS_YEAR}`];

  return (
    <div className="min-h-screen overflow-x-clip text-slate-900" style={{ background: C.cream }}>
      {/* ===== แถบบน ===== */}
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/grassroots-football" className="flex min-w-0 items-center gap-3">
            <span className="relative h-10 w-10 flex-none overflow-hidden rounded-lg">
              <Image src={GRASSROOTS_LOGO_URL} alt="" fill sizes="40px" className="object-contain" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className={`${g} block truncate text-lg font-medium`} style={{ color: C.green }}>
                Grassroots Football
              </span>
              <span className="block truncate text-[11px] text-slate-500">ฟุตบอลรากหญ้า · FA Thailand</span>
            </span>
          </Link>
          <nav aria-label="เมนู Grassroots" className={`${g} hidden flex-1 items-center justify-center gap-7 text-[15px] text-slate-600 md:flex`}>
            <a href="#principles" className="hover:text-[#ff6b1a]">
              หลักการ
            </a>
            <a href="#stats" className="hover:text-[#ff6b1a]">
              สถิติ {GRASSROOTS_YEAR}
            </a>
            <a href="#map" className="hover:text-[#ff6b1a]">
              พื้นที่กิจกรรม
            </a>
          </nav>
          <div className="ml-auto flex flex-none items-center gap-3">
            <BrandLogo tone="navy" className="hidden h-9 sm:block" />
            <HomeButton />
          </div>
        </div>
      </header>

      {/* ===== ฮีโร่ ===== */}
      <section className="px-4 pb-20 pt-12 sm:px-6 lg:pt-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div>
            <p className={`${g} flex items-center gap-2 text-base font-medium`} style={{ color: C.orange }}>
              <Ball className="h-5 w-5 text-[#ff6b1a]" />
              Grassroots Football · ฤดูกาล {GRASSROOTS_YEAR}
            </p>
            <h1 className={`${g} mt-4 text-[4.5rem] font-semibold leading-[0.95] sm:text-[8.5rem]`}>
              <span className="block" style={{ color: C.green }}>
                ฟุตบอล
              </span>
              <span className="block" style={{ color: C.orange }}>
                รากหญ้า
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-slate-700 sm:text-lg">
              ฟุตบอลรากหญ้า — จุดเริ่มต้นของการพัฒนานักกีฬาและผู้ฝึกสอนฟุตบอลไทย มุ่งส่งเสริมให้เด็กและเยาวชนได้เล่นฟุตบอลอย่างมีความสุขและถูกวิธี
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#stats" className={`${g} inline-flex h-12 items-center gap-2 rounded-xl px-6 text-base font-medium text-white`} style={{ background: C.green }}>
                ดูสถิติปี {GRASSROOTS_YEAR}
                <ArrowDown className="h-4 w-4" />
              </a>
              <a href="#map" className={`${g} inline-flex h-12 items-center rounded-xl border-2 px-6 text-base font-medium`} style={{ borderColor: C.green, color: C.green }}>
                พื้นที่กิจกรรม {players.provinces} จังหวัด
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:mx-0">
            <div className="-rotate-2 rounded-[1.75rem] border-[10px] border-white bg-white shadow-xl">
              <div className="relative aspect-4/3 overflow-hidden rounded-[1.1rem]">
                <Image src={grassrootsBg} alt="กิจกรรมฟุตบอลรากหญ้า" fill priority placeholder="blur" sizes="(min-width: 1024px) 36rem, 100vw" className="object-cover object-[45%_40%]" />
              </div>
            </div>
            {/* สติกเกอร์ตัวเลข */}
            <div
              className={`${styles.sticker} absolute -left-3 -top-8 flex h-32 w-32 -rotate-12 flex-col items-center justify-center rounded-full text-center shadow-lg sm:-left-8 sm:h-36 sm:w-36`}
              style={{ background: C.yellow, color: C.ink }}
            >
              <span className={`${g} text-4xl font-semibold leading-none`}>{players.total.toLocaleString()}</span>
              <span className={`${g} mt-1 text-sm`}>นักฟุตบอล</span>
            </div>
            <div className={`${styles.sticker} absolute -bottom-6 right-2 rotate-3 rounded-2xl px-5 py-3 text-white shadow-lg sm:right-6`} style={{ background: C.green }}>
              <span className={`${g} text-3xl font-semibold`}>{coaches.total.toLocaleString()}</span>
              <span className={`${g} ml-2 text-sm`}>ผู้ฝึกสอนในโครงการ</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ริบบิ้นข้อความวิ่ง ===== */}
      <div className="relative z-10 -rotate-[1.5deg] py-3.5 text-white shadow-md" style={{ background: C.green }}>
        <div className={styles.marquee}>
          <div className={styles.track}>
            {[0, 1].map((copy) => (
              <div key={copy} aria-hidden={copy === 1} className="flex flex-none items-center">
                {ribbon.map((t) => (
                  <span key={t} className={`${g} flex items-center gap-6 whitespace-nowrap px-6 text-xl font-medium sm:text-2xl`}>
                    {t}
                    <Ball className="h-5 w-5 text-[#ffcc29]" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== หลักการ ===== */}
      <section id="principles" className="scroll-mt-20 px-4 pb-20 pt-24 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className={`${g} text-4xl font-semibold sm:text-5xl`} style={{ color: C.green }}>
            หลักการของ<span className="whitespace-nowrap">ฟุตบอลรากหญ้า</span>
          </h2>
          <p className="mt-2 text-slate-600">สี่สิ่งที่ทุกกิจกรรมของเรายึดถือ</p>
          <ol className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p, i) => (
              <li key={p.title}>
                <Reveal delay={i * 90} className="h-full">
                  <div className="flex h-full min-h-64 flex-col rounded-[1.5rem] p-7 transition-transform duration-300 hover:-rotate-1 hover:-translate-y-1" style={{ background: p.bg, color: p.fg }}>
                    <span className={`${g} text-6xl font-semibold leading-none opacity-90`}>{String(i + 1).padStart(2, "0")}</span>
                    <h3 className={`${g} mt-auto pt-10 text-2xl font-semibold`}>{p.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed opacity-90">{p.description}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== สถิติบนสนามหญ้า ===== */}
      <section id="stats" className={`${styles.grass} relative scroll-mt-16 overflow-hidden px-4 py-20 text-white sm:px-6`}>
        <PitchLines />
        <div className="relative mx-auto max-w-7xl">
          <p className={`${g} text-base`} style={{ color: C.yellow }}>
            Season report {GRASSROOTS_YEAR}
          </p>
          <h2 className={`${g} mt-1 text-4xl font-semibold sm:text-5xl`}>
            สถิติโครงการ<span className="whitespace-nowrap">ฟุตบอลรากหญ้า</span> ปี {GRASSROOTS_YEAR}
          </h2>
          <p className="mt-2 text-white/75">สรุปข้อมูลผู้ฝึกสอนและนักฟุตบอลที่เข้าร่วมโครงการทั่วประเทศ</p>

          {/* ป้ายสกอร์ */}
          <Reveal className="mt-10 overflow-hidden rounded-[1.5rem] bg-[#06331d] ring-1 ring-white/10">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-5 py-8 text-center sm:px-10">
              <div>
                <p className={`${g} text-sm text-white/70 sm:text-base`}>นักฟุตบอล</p>
                <p className={`${g} text-5xl font-semibold tabular-nums sm:text-8xl`} style={{ color: C.yellow }}>
                  {players.total.toLocaleString()}
                </p>
              </div>
              <span className={`${g} text-3xl text-white/40 sm:text-6xl`}>:</span>
              <div>
                <p className={`${g} text-sm text-white/70 sm:text-base`}>ผู้ฝึกสอน</p>
                <p className={`${g} text-5xl font-semibold tabular-nums sm:text-8xl`} style={{ color: C.yellow }}>
                  {coaches.total.toLocaleString()}
                </p>
              </div>
            </div>
            <p className={`${g} border-t border-white/10 bg-black/15 py-3 text-center text-sm text-white/80`}>
              ทั่ว {players.provinces} จังหวัด · ฤดูกาล {GRASSROOTS_YEAR}
            </p>
          </Reveal>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* นักฟุตบอล */}
            <div className="rounded-[1.25rem] bg-[#0a5c2e] p-6 ring-1 ring-white/10">
              <p className={`${g} text-xl font-medium`}>นักฟุตบอล {GRASSROOTS_YEAR}</p>
              <div className="mt-4">
                <GenderBar male={players.male} malePercent={players.malePercent} female={players.female} femalePercent={players.femalePercent} />
              </div>
              <p className={`${g} mt-7 text-base`}>ช่วงอายุผู้เข้าร่วม</p>
              <p className="text-xs text-white/60">
                มากที่สุด {peakAge.label} ({((peakAge.count / players.total) * 100).toFixed(0)}%)
              </p>
              <div className="mt-3 flex h-32 items-end gap-2.5">
                {players.ageRanges.map((a) => (
                  <div key={a.label} className="flex h-full flex-1 flex-col items-center justify-end" title={`${a.label}: ${a.count.toLocaleString()} คน`}>
                    <span className={`${g} text-sm tabular-nums`}>{a.count.toLocaleString()}</span>
                    <span
                      className="mt-1 block w-full rounded-t-lg"
                      style={{ height: `${(a.count / ageMax) * 76}%`, minHeight: 2, background: a === peakAge ? C.yellow : "rgb(255 204 41 / 0.45)" }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2.5 border-t border-white/20 pt-2">
                {players.ageRanges.map((a) => (
                  <p key={a.label} className="flex-1 text-center text-xs text-white/80">
                    {a.label}
                  </p>
                ))}
              </div>
            </div>

            {/* ผู้ฝึกสอน */}
            <div className="rounded-[1.25rem] bg-[#0a5c2e] p-6 ring-1 ring-white/10">
              <p className={`${g} text-xl font-medium`}>ผู้ฝึกสอน (โค้ช) {GRASSROOTS_YEAR}</p>
              <div className="mt-4">
                <GenderBar male={coaches.male} malePercent={coaches.malePercent} female={coaches.female} femalePercent={coaches.femalePercent} />
              </div>
              <p className={`${g} mt-7 text-base`}>ระดับใบอนุญาตผู้ฝึกสอน</p>
              <p className="text-xs text-white/60">
                มีใบอนุญาตแล้ว {(coaches.total - coaches.noLicense).toLocaleString()} คน ({(((coaches.total - coaches.noLicense) / coaches.total) * 100).toFixed(0)}%)
              </p>
              <div className="mt-3 flex h-3 gap-0.5 overflow-hidden rounded-full">
                {licenceMix.map((l) => (
                  <span key={l.label} title={`${l.label}: ${l.count.toLocaleString()} คน`} style={{ width: `${(l.count / coaches.total) * 100}%`, minWidth: 3, background: l.color }} />
                ))}
              </div>
              <ul className="mt-3 divide-y divide-white/10">
                {licenceMix.map((l) => (
                  <li key={l.label} className="flex items-center gap-3 py-1.5 text-sm">
                    <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: l.color }} />
                    <span className="flex-1 text-white/90">{l.label}</span>
                    <span className={`${g} tabular-nums`}>{l.count.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* จังหวัด */}
            <div className="flex flex-col rounded-[1.25rem] p-6" style={{ background: C.yellow, color: C.ink }}>
              <p className={`${g} text-xl font-medium`}>พื้นที่กิจกรรม</p>
              <p className={`${g} mt-auto pt-8 text-[6rem] font-semibold leading-none`}>{players.provinces}</p>
              <p className={`${g} text-lg`}>จังหวัดทั่วประเทศ</p>
              <a href="#map" className={`${g} mt-6 inline-flex w-fit items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white`} style={{ background: C.green }}>
                ดูบนแผนที่
                <ArrowDown className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== แผนที่ + จังหวัดที่เข้าร่วมมากที่สุด ===== */}
      <section id="map" className="scroll-mt-16 px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-16">
          <div>
            <h2 className={`${g} text-4xl font-semibold sm:text-5xl`} style={{ color: C.green }}>
              พื้นที่กิจกรรม {players.provinces} จังหวัด
            </h2>
            <p className="mt-2 max-w-xl text-slate-600">จังหวัดที่มีผู้เข้าร่วมมากที่สุด — ตัวเลขบนแผนที่คือจำนวนนักฟุตบอลใน 5 จังหวัดแรก</p>
            <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2">
              <Leaderboard title="นักฟุตบอล · 5 อันดับจังหวัด" items={players.topProvinces} total={players.total} />
              <Leaderboard title="ผู้ฝึกสอน · 5 อันดับจังหวัด" items={coaches.topProvinces} total={coaches.total} />
            </div>
            <p className="mt-10 text-xs text-slate-500">ข้อมูลจากรายงานสรุปโครงการฟุตบอลรากหญ้า ปี {GRASSROOTS_YEAR}</p>
          </div>
          <figure className="mx-auto w-full max-w-sm rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <ProvinceMap
              values={mapValues}
              bins={MAP_BINS}
              colors={MAP_COLORS}
              zero="#efe7d6"
              unit="คน"
              markers={markers}
              markerColor={C.green}
              title={`แผนที่ 5 จังหวัดที่มีนักฟุตบอลรากหญ้าเข้าร่วมมากที่สุด ปี ${GRASSROOTS_YEAR}`}
            />
            <figcaption className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
              {MAP_BINS.map((b, i) => (
                <span key={b} className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-4 rounded-sm" style={{ background: MAP_COLORS[i] }} />
                  {MAP_BINS[i + 1] ? `${b.toLocaleString()}–${(MAP_BINS[i + 1] - 1).toLocaleString()}` : `${b.toLocaleString()}+`}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-4 rounded-sm bg-[#efe7d6]" />
                ไม่อยู่ใน 5 อันดับ
              </span>
            </figcaption>
          </figure>
        </div>
      </section>

      <footer className="px-4 py-10 text-white sm:px-6" style={{ background: C.green }}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm">
          <span className="flex items-center gap-3">
            <BrandLogo tone="white" className="h-9" />
            <span className={`${g} text-lg`}>Grassroots Football</span>
          </span>
          <span className="text-white/70">ฝ่ายเทคนิค สมาคมกีฬาฟุตบอลแห่งประเทศไทย ในพระบรมราชูปถัมภ์</span>
        </div>
      </footer>
    </div>
  );
}
