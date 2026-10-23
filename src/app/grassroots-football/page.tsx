import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { GRASSROOTS_YEAR, grassrootsCoaches as coaches, grassrootsPlayers as players } from "@/lib/grassroots-data";
import { display } from "@/components/fonts";
import { ModuleHeader } from "@/components/ModuleHeader";
import { ProvinceMap, provinceCodeByName } from "@/components/ProvinceMap";
import { grassrootsBg } from "@/lib/section-images";

const h = display.className;
const ACCENT = "#047857";

const PILLARS = [
  { title: "สนุกเป็นหลัก", description: "ปลูกฝังความรักในกีฬาฟุตบอลผ่านกิจกรรมที่สนุกและเหมาะสมกับวัย" },
  { title: "การมีส่วนร่วม", description: "เปิดโอกาสให้เด็กและเยาวชนทุกคนได้ร่วมกิจกรรมฟุตบอลอย่างทั่วถึง" },
  { title: "พัฒนาการรอบด้าน", description: "เสริมสร้างทักษะกาย ใจ สังคม และการคิด ควบคู่ไปกับทักษะฟุตบอล" },
  { title: "รากฐานที่มั่นคง", description: "วางรากฐานสู่เส้นทางนักกีฬาและผู้ฝึกสอนในระดับที่สูงขึ้น" },
];

const MALE = "#2f5799";
const FEMALE = "#f43f5e";

// แผนที่: ระบายสีเฉพาะ 5 จังหวัดที่มีนักฟุตบอลมากที่สุด (ข้อมูลรายจังหวัดมีแค่ 5 อันดับแรก)
const MAP_BINS = [1, 200, 400, 700];
const MAP_COLORS = ["#a7f3d0", "#34d399", "#059669", "#065f46"];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: ACCENT }}>
      <span className="h-px w-10" style={{ background: ACCENT }} />
      {children}
    </p>
  );
}

function GenderSplit({ male, malePercent, female, femalePercent }: { male: number; malePercent: number; female: number; femalePercent: number }) {
  return (
    <div>
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        <span title={`ชาย ${male.toLocaleString()} คน`} style={{ width: `${malePercent}%`, background: MALE }} />
        <span title={`หญิง ${female.toLocaleString()} คน`} style={{ width: `${femalePercent}%`, background: FEMALE }} />
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-4 text-sm">
        <p className="flex items-baseline gap-2">
          <span className="h-2.5 w-2.5 flex-none translate-y-px rounded-sm" style={{ background: MALE }} />
          <span className="text-slate-500">ชาย</span>
          <b className="font-semibold tabular-nums text-slate-900">{male.toLocaleString()}</b>
          <span className="text-xs text-slate-400">{malePercent}%</span>
        </p>
        <p className="flex items-baseline gap-2">
          <span className="h-2.5 w-2.5 flex-none translate-y-px rounded-sm" style={{ background: FEMALE }} />
          <span className="text-slate-500">หญิง</span>
          <b className="font-semibold tabular-nums text-slate-900">{female.toLocaleString()}</b>
          <span className="text-xs text-slate-400">{femalePercent}%</span>
        </p>
      </div>
    </div>
  );
}

function Leaderboard({ items, total, unit = "คน" }: { items: { name: string; count: number }[]; total: number; unit?: string }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={item.name} className="grid grid-cols-[1.5rem_1fr] gap-3" title={`${item.name}: ${item.count.toLocaleString()} ${unit} (${((item.count / total) * 100).toFixed(1)}%)`}>
          <span className={`${h} text-lg font-semibold leading-tight ${i === 0 ? "text-emerald-700" : "text-slate-400"}`}>{i + 1}</span>
          <span>
            <span className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium text-slate-800">{item.name}</span>
              <span className="flex-none font-semibold tabular-nums text-slate-900">
                {item.count.toLocaleString()} <span className="text-xs font-normal text-slate-400">{unit}</span>
              </span>
            </span>
            <span className="mt-1.5 block h-1.5 rounded-full bg-slate-100">
              <span className="block h-full rounded-full" style={{ width: `${(item.count / max) * 100}%`, background: ACCENT }} />
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export default async function GrassrootsFootballPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // ใบอนุญาตของผู้ฝึกสอนในโครงการ — ส่วนที่เหลือจากรายการหลัก = ระดับ A/B Diploma และอื่นๆ
  const licensed = coaches.licenses.reduce((s, l) => s + l.count, 0);
  const otherLicences = Math.max(0, coaches.total - coaches.noLicense - licensed);
  const licenceMix = [
    ...coaches.licenses.map((l, i) => ({ label: l.label, count: l.count, color: ["#475569", "#0369a1", ACCENT][i] ?? "#a16207" })),
    ...(otherLicences > 0 ? [{ label: "A/B Diploma และอื่นๆ", count: otherLicences, color: "#a16207" }] : []),
    { label: "ยังไม่มีใบอนุญาต", count: coaches.noLicense, color: "#d6d3d1" },
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

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f5f4f0] text-slate-900">
      <ModuleHeader
        title="Grassroots Football"
        subtitle="ฟุตบอลรากหญ้า · FA Thailand"
        accent={ACCENT}
        links={[
          { href: "#principles", label: "หลักการ" },
          { href: "#stats", label: `สถิติ ${GRASSROOTS_YEAR}` },
          { href: "#map", label: "พื้นที่กิจกรรม" },
        ]}
      />

      {/* ===== ฮีโร่ ===== */}
      <section className="px-4 pb-16 pt-10 sm:px-6 lg:pt-14">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-14">
          <div>
            <Eyebrow>Grassroots Football · FA Thailand</Eyebrow>
            <h1 className={`${h} mt-6 text-6xl font-semibold leading-none text-[#064e3b] sm:text-8xl`}>
              {/* ตัดบรรทัดได้เฉพาะระหว่าง "ฟุตบอล" กับ "รากหญ้า" — ไม่ให้ตัดกลางคำบนจอแคบ */}
              <span className="whitespace-nowrap">ฟุตบอล</span>
              <wbr />
              <span className="whitespace-nowrap">รากหญ้า</span>
            </h1>
            <p className={`${h} mt-3 text-2xl font-medium text-slate-400 sm:text-3xl`}>Grassroots Football</p>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              ฟุตบอลรากหญ้า — จุดเริ่มต้นของการพัฒนานักกีฬาและผู้ฝึกสอนฟุตบอลไทย มุ่งส่งเสริมให้เด็กและเยาวชนได้เล่นฟุตบอลอย่างมีความสุขและถูกวิธี
            </p>
          </div>

          {/* ภาพกิจกรรม + ตัวเลขสรุปของฤดูกาล วางทับขอบล่างของภาพ */}
          <figure className="relative">
            <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-[#053b2c] lg:aspect-4/5">
              <Image
                src={grassrootsBg}
                alt="กิจกรรมฟุตบอลรากหญ้า"
                fill
                priority
                placeholder="blur"
                sizes="(min-width: 1024px) 30rem, 100vw"
                className="object-cover object-[45%_40%]"
              />
            </div>
            <div className="relative mx-4 -mt-16 rounded-xl bg-[#053b2c] p-5 text-white sm:mx-6 sm:p-6 lg:absolute lg:inset-x-6 lg:bottom-6 lg:mx-0 lg:mt-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300">Season {GRASSROOTS_YEAR}</p>
              <dl className="mt-4 grid grid-cols-3 divide-x divide-white/15">
                {[
                  { value: players.total.toLocaleString(), label: "นักฟุตบอลที่เข้าร่วม" },
                  { value: coaches.total.toLocaleString(), label: "ผู้ฝึกสอนที่เข้าร่วม" },
                  { value: String(players.provinces), label: "จังหวัดที่มีกิจกรรม" },
                ].map((st) => (
                  <div key={st.label} className="flex flex-col-reverse px-3 first:pl-0 last:pr-0">
                    <dt className="mt-1 text-xs leading-snug text-white/65">{st.label}</dt>
                    <dd className={`${h} text-3xl font-semibold tabular-nums sm:text-4xl`}>{st.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </figure>
        </div>
      </section>

      {/* ===== หลักการ ===== */}
      <section id="principles" className="scroll-mt-20 border-y border-slate-200 bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Eyebrow>Our principles</Eyebrow>
          <h2 className={`${h} mt-3 text-3xl font-semibold text-[#064e3b] sm:text-4xl`}>
            หลักการของ<span className="whitespace-nowrap">ฟุตบอลรากหญ้า</span>
          </h2>
          <ol className="mt-10 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p, i) => (
              <li key={p.title} className="border-t-2 pt-5" style={{ borderColor: ACCENT }}>
                <span className={`${h} text-4xl font-semibold leading-none text-amber-500`}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className={`${h} mt-4 text-xl font-semibold text-slate-900`}>{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== สถิติ ===== */}
      <section id="stats" className="scroll-mt-20 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Eyebrow>Season report {GRASSROOTS_YEAR}</Eyebrow>
          <h2 className={`${h} mt-3 text-3xl font-semibold text-[#064e3b] sm:text-4xl`}>
            สถิติโครงการ<span className="whitespace-nowrap">ฟุตบอลรากหญ้า</span> ปี {GRASSROOTS_YEAR}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">สรุปข้อมูลผู้ฝึกสอนและนักฟุตบอลที่เข้าร่วมโครงการทั่วประเทศ</p>

          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* นักฟุตบอล */}
            <article className="rounded-xl border border-slate-200 bg-white p-6 sm:p-7">
              <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-4">
                <h3 className={`${h} text-xl font-semibold text-slate-900`}>นักฟุตบอล {GRASSROOTS_YEAR}</h3>
                <p className="text-xs text-slate-400">{players.provinces} จังหวัด</p>
              </div>
              <p className="mt-5 flex items-baseline gap-2">
                <span className={`${h} text-5xl font-semibold tabular-nums text-[#064e3b]`}>{players.total.toLocaleString()}</span>
                <span className="text-sm text-slate-500">คน · ผู้เข้าร่วมทั้งหมด</span>
              </p>
              <div className="mt-4">
                <GenderSplit male={players.male} malePercent={players.malePercent} female={players.female} femalePercent={players.femalePercent} />
              </div>

              <div className="mt-8">
                <p className="text-sm font-semibold text-slate-700">ช่วงอายุผู้เข้าร่วม</p>
                <p className="text-xs text-slate-400">
                  มากที่สุดคือ {peakAge.label} ({((peakAge.count / players.total) * 100).toFixed(0)}%)
                </p>
                <div className="mt-4 flex h-40 items-end gap-3">
                  {players.ageRanges.map((a) => (
                    <div key={a.label} className="flex h-full flex-1 flex-col items-center justify-end" title={`${a.label}: ${a.count.toLocaleString()} คน`}>
                      <span className="text-sm font-semibold tabular-nums text-slate-900">{a.count.toLocaleString()}</span>
                      <span
                        className="mt-1.5 block w-full rounded-t-md"
                        style={{ height: `${(a.count / ageMax) * 78}%`, minHeight: 2, background: a === peakAge ? ACCENT : "#a7d7c5" }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 border-t border-slate-200 pt-2">
                  {players.ageRanges.map((a) => (
                    <p key={a.label} className="flex-1 text-center text-xs font-medium text-slate-600">
                      {a.label}
                    </p>
                  ))}
                </div>
              </div>
            </article>

            {/* ผู้ฝึกสอน */}
            <article className="rounded-xl border border-slate-200 bg-white p-6 sm:p-7">
              <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-4">
                <h3 className={`${h} text-xl font-semibold text-slate-900`}>ผู้ฝึกสอน (โค้ช) {GRASSROOTS_YEAR}</h3>
                <p className="text-xs text-slate-400">{coaches.provinces} จังหวัด</p>
              </div>
              <p className="mt-5 flex items-baseline gap-2">
                <span className={`${h} text-5xl font-semibold tabular-nums text-[#064e3b]`}>{coaches.total.toLocaleString()}</span>
                <span className="text-sm text-slate-500">คน · ผู้เข้าร่วมทั้งหมด</span>
              </p>
              <div className="mt-4">
                <GenderSplit male={coaches.male} malePercent={coaches.malePercent} female={coaches.female} femalePercent={coaches.femalePercent} />
              </div>

              <div className="mt-8">
                <p className="text-sm font-semibold text-slate-700">ระดับใบอนุญาตผู้ฝึกสอน</p>
                <p className="text-xs text-slate-400">
                  มีใบอนุญาตแล้ว {(coaches.total - coaches.noLicense).toLocaleString()} คน ({(((coaches.total - coaches.noLicense) / coaches.total) * 100).toFixed(0)}%)
                </p>
                <div className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full">
                  {licenceMix.map((l) => (
                    <span key={l.label} title={`${l.label}: ${l.count.toLocaleString()} คน`} style={{ width: `${(l.count / coaches.total) * 100}%`, minWidth: 3, background: l.color }} />
                  ))}
                </div>
                <ul className="mt-4 divide-y divide-slate-100">
                  {licenceMix.map((l) => (
                    <li key={l.label} className="flex items-center gap-3 py-2 text-sm">
                      <span className="h-2.5 w-2.5 flex-none rounded-sm" style={{ background: l.color }} />
                      <span className="flex-1 text-slate-700">{l.label}</span>
                      <span className="font-semibold tabular-nums text-slate-900">{l.count.toLocaleString()}</span>
                      <span className="w-12 text-right text-xs tabular-nums text-slate-400">{((l.count / coaches.total) * 100).toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ===== พื้นที่กิจกรรม ===== */}
      <section id="map" className="scroll-mt-20 border-t border-slate-200 bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-14">
          <div>
            <Eyebrow>Where we play</Eyebrow>
            <h2 className={`${h} mt-3 text-3xl font-semibold text-[#064e3b] sm:text-4xl`}>พื้นที่กิจกรรม {players.provinces} จังหวัด</h2>
            <p className="mt-1.5 max-w-xl text-sm text-slate-500">จังหวัดที่มีผู้เข้าร่วมมากที่สุด — ตัวเลขบนแผนที่คือจำนวนนักฟุตบอลใน 5 จังหวัดแรก</p>

            <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2">
              <div>
                <p className="mb-4 text-sm font-semibold text-slate-700">นักฟุตบอล · 5 อันดับจังหวัด</p>
                <Leaderboard items={players.topProvinces} total={players.total} />
              </div>
              <div>
                <p className="mb-4 text-sm font-semibold text-slate-700">ผู้ฝึกสอน · 5 อันดับจังหวัด</p>
                <Leaderboard items={coaches.topProvinces} total={coaches.total} />
              </div>
            </div>
            <p className="mt-8 text-xs text-slate-400">ข้อมูลจากรายงานสรุปโครงการฟุตบอลรากหญ้า ปี {GRASSROOTS_YEAR}</p>
          </div>

          <figure className="mx-auto w-full max-w-sm">
            <ProvinceMap
              values={mapValues}
              bins={MAP_BINS}
              colors={MAP_COLORS}
              zero="#e7e5e4"
              unit="คน"
              markers={markers}
              markerColor="#064e3b"
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
                <span className="h-2.5 w-4 rounded-sm bg-stone-200" />
                ไม่อยู่ใน 5 อันดับ
              </span>
            </figcaption>
          </figure>
        </div>
      </section>
    </div>
  );
}
