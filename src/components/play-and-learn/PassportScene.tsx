import styles from "@/app/play-and-learn/pl.module.css";
import type { PassportIconName } from "@/lib/play-and-learn";

// ฉากพื้นหลังเคลื่อนไหวของแต่ละบทพาสปอร์ต — เลือกตามไอคอนของบท (แอดมินเลือกในหน้าจัดการ)
// วาดเป็น SVG ขนาด 160×96 โทนพาสเทล · อนิเมชันอยู่ใน pl.module.css (ปิดเองเมื่อผู้ใช้ตั้งค่าลดการเคลื่อนไหว)

const BG: Record<PassportIconName, string> = {
  waves: "from-sky-200 via-sky-100 to-cyan-50",
  fish: "from-cyan-100 via-sky-200 to-indigo-200",
  palm: "from-orange-100 via-pink-100 to-sky-100",
  mountain: "from-violet-100 via-sky-100 to-emerald-50",
  temple: "from-amber-100 via-orange-50 to-lime-50",
  compass: "from-sky-100 via-indigo-50 to-amber-50",
  droplets: "from-sky-200 via-cyan-50 to-pink-100",
  moon: "from-indigo-300 via-purple-300 to-pink-200",
  star: "from-indigo-300 via-violet-300 to-fuchsia-200",
  ball: "from-sky-200 via-sky-100 to-emerald-100",
};

const delay = (s: string) => ({ animationDelay: s });

// คลื่นยาว 200 หน่วย (รอบละ 40) — เลื่อนซ้ายวนได้ไม่สะดุดในกรอบกว้าง 160
function wave(y: number, amp: number) {
  let d = `M0 ${y}`;
  for (let x = 0; x < 200; x += 20) d += ` q10 ${(x / 20) % 2 ? amp : -amp} 20 0`;
  return `${d} V96 H0Z`;
}

const star4 = (x: number, y: number, r: number) =>
  `M${x} ${y - r}L${x + r * 0.3} ${y - r * 0.3}L${x + r} ${y}L${x + r * 0.3} ${y + r * 0.3}L${x} ${y + r}L${x - r * 0.3} ${y + r * 0.3}L${x - r} ${y}L${x - r * 0.3} ${y - r * 0.3}Z`;

function Cloud({ x, y, s = 1, wait }: { x: number; y: number; s?: number; wait?: string }) {
  return (
    <g className={styles.sDrift} style={wait ? delay(wait) : undefined}>
      <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fff" opacity="0.92">
        <ellipse cx="0" cy="0" rx="11" ry="4.5" />
        <circle cx="-4" cy="-3" r="4.5" />
        <circle cx="3.5" cy="-4" r="5.5" />
      </g>
    </g>
  );
}

function Palm({ x, base, h, wait }: { x: number; base: number; h: number; wait?: string }) {
  const top = { x: x + 9, y: base - h };
  return (
    <g className={styles.sSway} style={wait ? delay(wait) : undefined}>
      <path d={`M${x} ${base} C${x} ${base - h * 0.4} ${x + 4} ${base - h * 0.75} ${top.x} ${top.y}`} fill="none" stroke="#d4a373" strokeWidth="3.2" strokeLinecap="round" />
      {[-165, -130, -95, -55, -18, 20].map((a, i) => (
        <path key={a} d="M0 0C6 -5 15 -5 21 1C14 -1 6 -1 0 0Z" fill={i % 2 ? "#4ade80" : "#86efac"} transform={`translate(${top.x} ${top.y}) rotate(${a})`} />
      ))}
      <circle cx={top.x - 1} cy={top.y + 3} r="2" fill="#b45309" />
      <circle cx={top.x + 2.5} cy={top.y + 3.5} r="2" fill="#b45309" />
    </g>
  );
}

function SugarPalm({ x, base, h }: { x: number; base: number; h: number }) {
  const ty = base - h;
  return (
    <g className={styles.sSway}>
      <path d={`M${x} ${base}V${ty}`} stroke="#b45309" strokeWidth="1.6" />
      <circle cx={x} cy={ty} r="3" fill="#86efac" />
      {[-170, -140, -110, -90, -70, -40, -10].map((a) => {
        const r = (a * Math.PI) / 180;
        return <path key={a} d={`M${x} ${ty}l${(9 * Math.cos(r)).toFixed(1)} ${(9 * Math.sin(r)).toFixed(1)}`} stroke="#4ade80" strokeWidth="1.6" strokeLinecap="round" />;
      })}
    </g>
  );
}

function Fish({ y, body, tail, scale = 1 }: { y: number; body: string; tail: string; scale?: number }) {
  return (
    <g transform={`translate(0 ${y}) scale(${scale})`}>
      <path d="M-2 0l-7 -5v10z" fill={tail} />
      <ellipse cx="6" cy="0" rx="9" ry="5.5" fill={body} />
      <path d="M4 -5v10" stroke="#fff" strokeWidth="1.5" />
      <circle cx="11" cy="-1.5" r="1.2" fill="#1e293b" />
    </g>
  );
}

function Stars({ list }: { list: [number, number, number, string][] }) {
  return (
    <>
      {list.map(([x, y, r, wait]) => (
        <path key={`${x}-${y}`} d={star4(x, y, r)} fill="#fff" className={styles.sTwinkle} style={delay(wait)} />
      ))}
    </>
  );
}

// ===== ฉาก =====

// ทะเล: ดวงอาทิตย์ เมฆ นกนางนวล เรือใบโคลงเคลง คลื่น ชายหาด ปลาดาว
function Sea() {
  return (
    <>
      <circle cx="130" cy="20" r="14" fill="#fef3c7" className={styles.sGlow} />
      <circle cx="130" cy="20" r="9" fill="#fde68a" />
      <Cloud x={28} y={18} />
      <Cloud x={84} y={12} s={0.8} wait="-3s" />
      <path d="M54 30q3 -3 6 0q3 -3 6 0M72 24q2.5 -2.5 5 0q2.5 -2.5 5 0" fill="none" stroke="#64748b" strokeWidth="1" strokeLinecap="round" />
      <g className={styles.sWaveSlow}>
        <path d={wave(52, 2.5)} fill="#bae6fd" />
      </g>
      <g className={styles.sBob}>
        <path d="M90 60h22l-4 5h-14z" fill="#f472b6" />
        <path d="M100 59V38" stroke="#94a3b8" strokeWidth="1" />
        <path d="M101 40L112 57H101Z" fill="#fff" />
        <path d="M99 43L91 57H99Z" fill="#fbcfe8" />
      </g>
      <g className={styles.sWave}>
        <path d={wave(62, 3)} fill="#7dd3fc" />
      </g>
      <path d="M0 80Q40 72 82 79T160 76V96H0Z" fill="#fde68a" />
      <path d={star4(30, 87, 4)} fill="#fb7185" />
      <path d="M128 88a4 4 0 0 1 8 0z" fill="#fbcfe8" />
    </>
  );
}

// พิพิธภัณฑ์สัตว์น้ำ: แสงลอดน้ำ สาหร่ายไหว ปะการัง ปลาว่าย ฟองน้ำลอยขึ้น
function Aquarium() {
  return (
    <>
      <path d="M18 0h14l26 96h-18zM78 0h10l18 96h-14zM122 0h8l12 96h-10z" fill="#fff" opacity="0.25" />
      <path d="M0 84Q40 78 80 84T160 82V96H0Z" fill="#fde68a" />
      <g className={styles.sSway}>
        <path d="M14 92C8 80 20 74 13 62C8 54 16 48 13 40" fill="none" stroke="#34d399" strokeWidth="4" strokeLinecap="round" />
      </g>
      <g className={styles.sSway} style={delay("-1.2s")}>
        <path d="M24 92C20 84 28 80 24 70" fill="none" stroke="#6ee7b7" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g className={styles.sSway} style={delay("-2s")}>
        <path d="M146 92C140 82 150 76 144 64" fill="none" stroke="#34d399" strokeWidth="4" strokeLinecap="round" />
      </g>
      <path d="M118 90v-9m0 4l-5 -6m5 4l5 -7m-5 -1v-5" fill="none" stroke="#f9a8d4" strokeWidth="3" strokeLinecap="round" />
      <g className={styles.sSwim} style={delay("-3s")}>
        <Fish y={38} body="#fdba74" tail="#fb923c" />
      </g>
      <g transform="matrix(-1 0 0 1 160 0)">
        <g className={styles.sSwim} style={{ animationDuration: "14s", animationDelay: "-9s" }}>
          <Fish y={62} body="#f9a8d4" tail="#f472b6" scale={0.8} />
        </g>
      </g>
      <g className={styles.sSwim} style={{ animationDuration: "12s", animationDelay: "-1s" }}>
        <Fish y={24} body="#fde68a" tail="#facc15" scale={0.6} />
      </g>
      {(
        [
          [120, 80, 2, "0s"],
          [126, 84, 2.8, "-1.3s"],
          [131, 78, 2, "-2.6s"],
          [42, 86, 2.4, "-0.7s"],
        ] as const
      ).map(([x, y, r, wait]) => (
        <circle key={x} cx={x} cy={y} r={r} fill="#fff" fillOpacity="0.5" stroke="#fff" strokeWidth="0.6" className={styles.sRise} style={delay(wait)} />
      ))}
    </>
  );
}

// ภาคใต้: พระอาทิตย์ตก เกาะหินปูน เรือหางยาว ทะเล ชายหาด ต้นมะพร้าว
function South() {
  return (
    <>
      <circle cx="112" cy="50" r="15" fill="#fdba74" opacity="0.85" />
      <Cloud x={40} y={16} s={0.9} />
      <path d="M74 56C72 40 80 30 85 36C88 28 96 34 95 56Z" fill="#c4b5fd" opacity="0.75" />
      <path d="M128 56C127 46 133 40 137 45C140 42 144 48 143 56Z" fill="#c4b5fd" opacity="0.6" />
      <g className={styles.sWaveSlow}>
        <path d={wave(55, 1.5)} fill="#7dd3fc" />
      </g>
      <g className={styles.sBob} style={delay("-0.8s")}>
        <path d="M92 66q14 6 30 -1l-2 -3q-13 4 -26 1z" fill="#f472b6" />
        <path d="M120 62l3 -8" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M100 64v-6h8v5" fill="#fde68a" />
      </g>
      <g className={styles.sWave}>
        <path d={wave(68, 1.8)} fill="#38bdf8" opacity="0.55" />
      </g>
      <path d="M0 76Q50 68 100 76T160 74V96H0Z" fill="#fde68a" />
      <Palm x={22} base={90} h={46} />
      <Palm x={142} base={92} h={34} wait="-1.5s" />
    </>
  );
}

// ภาคเหนือ: พระอาทิตย์ ภูเขาซ้อนกัน หมอกลอย เนินเขา ต้นสน เจดีย์บนดอย
function North() {
  return (
    <>
      <circle cx="84" cy="40" r="15" fill="#fef3c7" className={styles.sGlow} />
      <circle cx="84" cy="40" r="10" fill="#fde68a" />
      <path d="M0 58L26 34L46 50L74 24L100 48L126 30L160 52V96H0Z" fill="#c4b5fd" />
      <g className={styles.sDrift}>
        <rect x="10" y="44" width="50" height="7" rx="3.5" fill="#fff" opacity="0.75" />
        <rect x="96" y="40" width="40" height="6" rx="3" fill="#fff" opacity="0.7" />
      </g>
      <path d="M0 70L30 48L58 68L92 42L126 66L160 54V96H0Z" fill="#a5b4fc" />
      <g className={styles.sDrift} style={delay("-4s")}>
        <rect x="40" y="62" width="60" height="7" rx="3.5" fill="#fff" opacity="0.8" />
      </g>
      <path d="M0 82Q40 70 82 80T160 76V96H0Z" fill="#86efac" />
      {[10, 19, 28].map((x) => (
        <path key={x} d={`M${x} ${84 - (x - 10) * 0.2}l5 -13l5 13z`} fill="#34d399" />
      ))}
      <rect x="69" y="77" width="14" height="3" fill="#fcd34d" />
      <path d="M71 77C71 69 81 69 81 77Z" fill="#fde68a" />
      <path d="M74.5 71L76 59L77.5 71Z" fill="#fcd34d" />
      <path d="M44 22q2.5 -2.5 5 0q2.5 -2.5 5 0M58 28q2 -2 4 0q2 -2 4 0" fill="none" stroke="#64748b" strokeWidth="1" strokeLinecap="round" />
    </>
  );
}

// ภาคอีสาน: ปราสาทหิน ทุ่งนา ต้นตาล เมฆลอย
function Isan() {
  return (
    <>
      <circle cx="30" cy="22" r="14" fill="#fed7aa" className={styles.sGlow} />
      <circle cx="30" cy="22" r="9" fill="#fdba74" />
      <Cloud x={70} y={14} s={0.8} />
      <Cloud x={132} y={20} s={0.7} wait="-3s" />
      <path d="M0 72Q80 66 160 72V96H0Z" fill="#d9f99d" />
      <path d="M84 70h36v4h-36z" fill="#f2b8a0" />
      <rect x="90" y="52" width="24" height="18" fill="#f9cbb4" />
      <rect x="98" y="57" width="8" height="13" rx="4" fill="#c08497" />
      <path d="M90 52C90 36 95 24 102 16C109 24 114 36 114 52Z" fill="#fbd5c0" />
      <path d="M92 44h20M94 36h16M97 28h10M102 16V10" stroke="#e8a58a" strokeWidth="1.2" />
      <SugarPalm x={24} base={74} h={34} />
      <SugarPalm x={142} base={73} h={28} />
      <path d="M0 80Q80 74 160 80V96H0Z" fill="#bef264" />
      {Array.from({ length: 14 }, (_, i) => (
        <path key={i} d={`M${i * 12 - 4} 96l7 -14`} stroke="#84cc16" strokeWidth="1.2" opacity="0.5" />
      ))}
    </>
  );
}

// ภาคกลาง: วัด (โบสถ์หลังคาซ้อน + พระปรางค์) ริมแม่น้ำ เรือ
function Central() {
  return (
    <>
      <Cloud x={30} y={16} s={0.9} />
      <Cloud x={118} y={12} s={0.8} wait="-2.5s" />
      <path d="M118 66C118 46 124 32 128 22C132 32 138 46 138 66Z" fill="#e9d5ff" />
      <path d="M120 56h16M122 46h12M124 36h8M128 22V16" stroke="#c4b5fd" strokeWidth="1.2" />
      <rect x="0" y="64" width="160" height="6" fill="#bbf7d0" />
      <rect x="38" y="50" width="40" height="16" fill="#fff" />
      <path d="M46 66V52M54 66V52M62 66V52M70 66V52" stroke="#fcd34d" strokeWidth="1.2" />
      <path d="M30 54L58 36L86 54Z" fill="#fdba74" />
      <path d="M38 46L58 30L78 46Z" fill="#fb923c" opacity="0.8" />
      <path d="M30 54L58 36L86 54M38 46L58 30L78 46" fill="none" stroke="#6ee7b7" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M58 30q1 -4 3 -4M86 54q3 -1 3 -5M30 54q-3 -1 -3 -5" fill="none" stroke="#fcd34d" strokeWidth="1.5" strokeLinecap="round" />
      <g className={styles.sWaveSlow}>
        <path d={wave(68, 1.5)} fill="#93c5fd" />
      </g>
      <path d="M14 80h14M58 88h18M110 84h16" stroke="#fff" opacity="0.6" strokeLinecap="round" />
      <g className={styles.sBob}>
        <path d="M66 80q13 5 27 0l-2 -3h-23z" fill="#f472b6" />
        <path d="M72 77v-6h13v6" fill="#fde68a" />
      </g>
    </>
  );
}

// สงกรานต์: พวงมาลัย ขันน้ำ สายน้ำสาด หยดน้ำตก ดอกไม้
function Songkran() {
  const garland = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    // เส้นโค้ง M0 8 Q80 22 160 8
    return { x: 160 * t, y: (1 - t) ** 2 * 8 + 2 * t * (1 - t) * 22 + t * t * 8, c: ["#fde047", "#fb7185", "#fff"][i % 3] };
  });
  return (
    <>
      <circle cx="132" cy="30" r="14" fill="#fef3c7" className={styles.sGlow} />
      <circle cx="132" cy="30" r="9" fill="#fde68a" />
      <path d="M0 8Q80 22 160 8" fill="none" stroke="#f9a8d4" strokeWidth="1" />
      {garland.map((g) => (
        <circle key={g.x} cx={g.x} cy={g.y + 2} r="2.6" fill={g.c} stroke="#f9a8d4" strokeWidth="0.5" />
      ))}
      {(
        [
          [20, "0s"],
          [46, "-0.5s"],
          [112, "-1s"],
          [148, "-0.3s"],
          [66, "-1.3s"],
          [96, "-0.8s"],
        ] as const
      ).map(([x, wait]) => (
        <path key={x} d={`M${x} 20q-3 5 0 7q3 -2 0 -7z`} fill="#38bdf8" className={styles.sFall} style={delay(wait)} />
      ))}
      <path d="M0 88Q80 82 160 88V96H0Z" fill="#fbcfe8" />
      <path d="M84 78C96 50 120 46 140 58" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" className={styles.sStream} />
      <path d="M76 78C64 52 40 48 22 60" fill="none" stroke="#7dd3fc" strokeWidth="2.2" strokeLinecap="round" className={styles.sStream} style={delay("-0.3s")} />
      <path d="M68 80h24l-4 9h-16z" fill="#fcd34d" />
      <ellipse cx="80" cy="80" rx="12" ry="2.5" fill="#7dd3fc" />
      {[14, 30, 132, 148].map((x) => (
        <g key={x}>
          <circle cx={x} cy="89" r="3" fill="#fde047" />
          <circle cx={x} cy="89" r="1.2" fill="#fb923c" />
        </g>
      ))}
    </>
  );
}

// ลอยกระทง: ดาวกะพริบ พระจันทร์เต็มดวง โคมลอย แม่น้ำ กระทงลอยพร้อมเทียน
function LoyKrathong() {
  return (
    <>
      <Stars
        list={[
          [14, 12, 2, "0s"],
          [34, 26, 1.6, "-0.8s"],
          [56, 10, 2, "-1.6s"],
          [86, 20, 1.6, "-0.4s"],
          [150, 44, 1.8, "-1.2s"],
          [100, 8, 1.6, "-2s"],
          [70, 34, 1.4, "-2.4s"],
        ]}
      />
      <circle cx="124" cy="22" r="18" fill="#fef9c3" className={styles.sGlow} />
      <circle cx="124" cy="22" r="11" fill="#fef9c3" />
      {(
        [
          [30, 58, "0s"],
          [52, 64, "-2.3s"],
          [142, 60, "-4.6s"],
        ] as const
      ).map(([x, y, wait]) => (
        <g key={x} className={styles.sLantern} style={delay(wait)}>
          <rect x={x - 3} y={y - 4} width="6" height="8" rx="2" fill="#fdba74" />
          <rect x={x - 1.5} y={y} width="3" height="3" rx="1" fill="#fef08a" />
        </g>
      ))}
      <g className={styles.sWaveSlow}>
        <path d={wave(64, 1)} fill="#a5b4fc" opacity="0.85" />
      </g>
      <path d="M116 70h16M118 75h12M121 80h6" stroke="#fef9c3" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <g className={styles.sBob}>
        <path d="M50 80q16 7 32 0l-3 -4h-26z" fill="#4ade80" />
        <path d="M56 76l4 -10l4 10zM63 76l3 -12l3 12zM70 76l4 -10l4 10z" fill="#f9a8d4" />
        <path d="M66 64v-6" stroke="#fef3c7" strokeWidth="1.2" />
        <ellipse cx="66" cy="56" rx="1.6" ry="2.6" fill="#fde047" className={styles.sFlicker} />
      </g>
      <g className={styles.sBob} style={delay("-1.4s")}>
        <path d="M104 84q10 5 20 0l-2 -3h-16z" fill="#4ade80" />
        <path d="M108 81l3 -7l3 7zM113 81l3 -7l3 7z" fill="#fbcfe8" />
        <ellipse cx="114" cy="72" rx="1.2" ry="2" fill="#fde047" className={styles.sFlicker} style={delay("-0.3s")} />
      </g>
      <g className={styles.sWave}>
        <path d={wave(86, 1.2)} fill="#818cf8" opacity="0.45" />
      </g>
    </>
  );
}

// ท้องฟ้ายามค่ำ: ดาวกะพริบ ดาวตก เนินเขา
function StarSky() {
  return (
    <>
      <Stars
        list={[
          [12, 14, 2, "0s"],
          [30, 34, 1.6, "-0.6s"],
          [48, 12, 2.2, "-1.4s"],
          [72, 28, 1.6, "-0.2s"],
          [96, 10, 2, "-1.9s"],
          [120, 30, 1.6, "-1.1s"],
          [142, 14, 2.2, "-0.8s"],
          [84, 50, 1.4, "-2.2s"],
        ]}
      />
      <g className={styles.sShoot}>
        <path d="M134 10l-22 11" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
      </g>
      <path d="M0 80Q40 66 80 78T160 72V96H0Z" fill="#a78bfa" opacity="0.6" />
    </>
  );
}

// สนามฟุตบอล: เมฆ สนามลายหญ้า ประตู ลูกบอลเด้ง
function Field() {
  return (
    <>
      <Cloud x={30} y={16} />
      <Cloud x={120} y={12} s={0.8} wait="-2s" />
      <rect x="0" y="58" width="160" height="38" fill="#86efac" />
      {[0, 32, 64, 96, 128].map((x) => (
        <rect key={x} x={x} y="58" width="16" height="38" fill="#4ade80" opacity="0.35" />
      ))}
      <path d="M0 76H160" stroke="#fff" opacity="0.7" />
      <ellipse cx="80" cy="76" rx="18" ry="6" fill="none" stroke="#fff" opacity="0.7" />
      <path d="M118 44V62M124 44V62M130 44V62M136 44V62M142 44V62M112 50H148M112 56H148" stroke="#fff" strokeWidth="0.5" opacity="0.7" />
      <path d="M112 62V44H148V62" fill="none" stroke="#fff" strokeWidth="2" />
      <g className={styles.sHop}>
        <circle cx="60" cy="66" r="5" fill="#fff" stroke="#a855f7" strokeWidth="1" />
        <path d="M60 63.5l2.4 1.7-.9 2.8h-3l-.9-2.8z" fill="#c084fc" />
      </g>
    </>
  );
}

const SCENES: Record<PassportIconName, () => React.ReactNode> = {
  waves: Sea,
  fish: Aquarium,
  palm: South,
  mountain: North,
  temple: Isan,
  compass: Central,
  droplets: Songkran,
  moon: LoyKrathong,
  star: StarSky,
  ball: Field,
};

const sceneKey = (name: string | null) => (name && name in BG ? name : "star") as PassportIconName;

// สีพื้นไล่เฉดของฉาก (ใช้เป็นพื้นแถวบนจอมือถือ)
export const passportTint = (name: string | null) => BG[sceneKey(name)];

export function PassportScene({ name, className = "" }: { name: string | null; className?: string }) {
  const key = sceneKey(name);
  return (
    <span aria-hidden className={`absolute inset-0 overflow-hidden bg-linear-to-b ${BG[key]} ${className}`}>
      <svg viewBox="0 0 160 96" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-110">
        {SCENES[key]()}
      </svg>
    </span>
  );
}

// ===================== วิวพื้นหลังแผนที่ตามสถานที่ของแต่ละบท =====================
// วาดในช่องขนาด 100×105 (1 ช่องต่อ 1 บทบนแผนที่) และเลยขอบออกไป (-12..112, -10..115) ให้ค่อยๆ กลืนกับช่องข้างเคียง
// จุดกึ่งกลางการ์ดอยู่ที่ (50, 44) — ของเด่นของวิวจึงวางไว้ขอบซ้าย/ขวา ด้านบน และด้านล่าง

// คลื่นเต็มความกว้างช่อง (เลื่อนซ้ายได้ 40 หน่วยโดยไม่เห็นขอบ)
function zoneWave(y: number, amp: number) {
  let d = `M-12 ${y}`;
  for (let i = 0; i < 10; i++) d += ` q10 ${i % 2 ? amp : -amp} 20 0`;
  return `${d} V115 H-12Z`;
}

const Sky = ({ fill }: { fill: string }) => <rect x="-12" y="-10" width="124" height="125" fill={fill} />;

function Prang({ x, base, h, fill, line }: { x: number; base: number; h: number; fill: string; line: string }) {
  const w = h * 0.42;
  return (
    <>
      <path d={`M${x - w / 2} ${base}C${x - w / 2} ${base - h * 0.55} ${x - w * 0.2} ${base - h * 0.85} ${x} ${base - h}C${x + w * 0.2} ${base - h * 0.85} ${x + w / 2} ${base - h * 0.55} ${x + w / 2} ${base}Z`} fill={fill} />
      <path d={`M${x - w * 0.42} ${base - h * 0.25}h${w * 0.84}M${x - w * 0.34} ${base - h * 0.5}h${w * 0.68}M${x - w * 0.22} ${base - h * 0.72}h${w * 0.44}`} stroke={line} strokeWidth="1" />
    </>
  );
}

function ZoneSea() {
  return (
    <>
      <Sky fill="#e0f2fe" />
      <circle cx="86" cy="10" r="10" fill="#fef3c7" className={styles.sGlow} />
      <circle cx="86" cy="10" r="6.5" fill="#fde68a" />
      <Cloud x={14} y={10} s={0.9} />
      <path d="M38 6q2.5 -2.5 5 0q2.5 -2.5 5 0M52 12q2 -2 4 0q2 -2 4 0" fill="none" stroke="#64748b" strokeWidth="0.9" strokeLinecap="round" />
      <g className={styles.sWaveSlow}>
        <path d={zoneWave(54, 2)} fill="#bae6fd" />
      </g>
      <g className={styles.sBob}>
        <path d="M-6 66h16l-3 4h-10z" fill="#f472b6" />
        <path d="M1 65V50" stroke="#94a3b8" strokeWidth="0.8" />
        <path d="M2 52L10 64H2Z" fill="#fff" />
      </g>
      <g className={styles.sWave}>
        <path d={zoneWave(66, 2.5)} fill="#7dd3fc" />
      </g>
      <path d="M-12 86Q30 80 60 86T112 84V115H-12Z" fill="#fde68a" />
      <path d="M8 90V76" stroke="#94a3b8" strokeWidth="1" />
      <path d="M-2 78Q8 68 18 78Z" fill="#f9a8d4" />
      <path d="M3 78Q8 70 8 68Q8 70 13 78" fill="none" stroke="#fff" strokeWidth="0.8" />
      <path d="M86 100v-6h3v-3h3v3h3v-3h3v3h3v6z" fill="#fcd34d" />
      <path d={star4(30, 100, 3)} fill="#fb7185" />
      <path d="M70 104a3 3 0 0 1 6 0z" fill="#fbcfe8" />
    </>
  );
}

function ZoneAquarium() {
  return (
    <>
      <Sky fill="#cffafe" />
      <rect x="-12" y="30" width="124" height="85" fill="#a5f3fc" />
      <rect x="-12" y="72" width="124" height="43" fill="#7dd3fc" opacity="0.6" />
      <path d="M-2 -10h10l18 125h-14zM62 -10h8l14 125h-10zM96 -10h6l10 125h-8z" fill="#fff" opacity="0.25" />
      <g className={styles.sBob}>
        <path d="M0 18a7 7 0 0 1 14 0z" fill="#f9a8d4" />
        <path d="M2 18q1 4 0 8M6 18q1 5 0 10M10 18q-1 5 0 9M13 18q1 4 0 7" fill="none" stroke="#f9a8d4" strokeWidth="0.9" strokeLinecap="round" />
      </g>
      <g className={styles.sSwim} style={{ animationDuration: "9s", animationDelay: "-4s" }}>
        <Fish y={12} body="#fde68a" tail="#facc15" scale={0.6} />
      </g>
      <g transform="matrix(-1 0 0 1 100 0)">
        <g className={styles.sSwim} style={{ animationDuration: "12s", animationDelay: "-2s" }}>
          <Fish y={84} body="#fdba74" tail="#fb923c" scale={0.8} />
        </g>
      </g>
      {(
        [
          [94, 90, 2, "0s"],
          [98, 96, 1.5, "-1.4s"],
          [4, 94, 1.8, "-2.4s"],
        ] as const
      ).map(([x, y, r, wait]) => (
        <circle key={x} cx={x} cy={y} r={r} fill="#fff" fillOpacity="0.5" stroke="#fff" strokeWidth="0.5" className={styles.sRise} style={delay(wait)} />
      ))}
      <path d="M-12 100Q50 94 112 100V115H-12Z" fill="#fde68a" />
      <g className={styles.sSway}>
        <path d="M2 104C-3 92 7 86 1 74C-3 66 4 60 2 52" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g className={styles.sSway} style={delay("-1.5s")}>
        <path d="M98 104C93 94 101 88 96 78" fill="none" stroke="#6ee7b7" strokeWidth="3" strokeLinecap="round" />
      </g>
      <path d="M86 104v-7m0 3l-4 -5m4 3l4 -6" fill="none" stroke="#f9a8d4" strokeWidth="2.4" strokeLinecap="round" />
      <path d={star4(60, 106, 3)} fill="#fb7185" />
    </>
  );
}

function ZoneSouth() {
  return (
    <>
      <Sky fill="#ffe4e6" />
      <rect x="-12" y="26" width="124" height="89" fill="#ffedd5" />
      <circle cx="90" cy="20" r="9" fill="#fdba74" opacity="0.85" />
      <Cloud x={30} y={10} s={0.8} />
      <path d="M-8 62C-9 50 -3 44 1 48C4 42 9 48 8 62Z" fill="#c4b5fd" opacity="0.75" />
      <path d="M90 62C89 54 94 50 97 53C100 50 104 55 103 62Z" fill="#c4b5fd" opacity="0.65" />
      <g className={styles.sWaveSlow}>
        <path d={zoneWave(61, 1.5)} fill="#7dd3fc" />
      </g>
      <g className={styles.sBob} style={delay("-1s")}>
        <path d="M80 76q10 4 20 -1l-2 -2q-8 3 -17 1z" fill="#f472b6" />
        <path d="M84 74v-4h6v3" fill="#fde68a" />
      </g>
      <g className={styles.sWave}>
        <path d={zoneWave(74, 1.5)} fill="#38bdf8" opacity="0.5" />
      </g>
      <path d="M-12 86Q50 78 112 88V115H-12Z" fill="#fde68a" />
      <Palm x={-4} base={104} h={62} />
      <Palm x={86} base={106} h={50} wait="-1.6s" />
      <path d="M40 100a3 3 0 0 1 6 0z" fill="#fbcfe8" />
    </>
  );
}

function ZoneNorth() {
  return (
    <>
      <Sky fill="#ede9fe" />
      <circle cx="50" cy="12" r="10" fill="#fef3c7" className={styles.sGlow} />
      <circle cx="50" cy="12" r="6.5" fill="#fde68a" />
      <path d="M-12 50L4 18L22 40L50 16L78 40L96 14L112 44V115H-12Z" fill="#c4b5fd" />
      <g className={styles.sDrift}>
        <rect x="-10" y="32" width="30" height="5" rx="2.5" fill="#fff" opacity="0.8" />
        <rect x="80" y="28" width="28" height="5" rx="2.5" fill="#fff" opacity="0.75" />
      </g>
      <path d="M-12 72L10 42L34 66L60 48L86 68L104 40L112 52V115H-12Z" fill="#a5b4fc" />
      <g className={styles.sDrift} style={delay("-4s")}>
        <rect x="74" y="58" width="34" height="5" rx="2.5" fill="#fff" opacity="0.8" />
      </g>
      <path d="M-12 86Q30 76 60 84T112 80V115H-12Z" fill="#86efac" />
      {[-6, 2, 10].map((x) => (
        <path key={x} d={`M${x} ${86 - (x + 6) * 0.15}l4 -11l4 11z`} fill="#34d399" />
      ))}
      <rect x="88" y="82" width="12" height="2.5" fill="#fcd34d" />
      <path d="M90 82C90 75 98 75 98 82Z" fill="#fde68a" />
      <path d="M92.8 77L94 67L95.2 77Z" fill="#fcd34d" />
      {Array.from({ length: 16 }, (_, i) => (
        <circle key={i} cx={-8 + i * 7.5} cy={98 + (i % 3) * 4} r="1.8" fill="#fde047" />
      ))}
    </>
  );
}

function ZoneIsan() {
  return (
    <>
      <Sky fill="#fef9c3" />
      <circle cx="12" cy="10" r="10" fill="#fed7aa" className={styles.sGlow} />
      <circle cx="12" cy="10" r="6.5" fill="#fdba74" />
      <Cloud x={84} y={12} s={0.8} wait="-2s" />
      <path d="M-12 74Q50 68 112 74V115H-12Z" fill="#d9f99d" />
      <path d="M-12 74h30v3h-30z" fill="#f2b8a0" />
      <Prang x={3} base={74} h={40} fill="#fbd5c0" line="#e8a58a" />
      <SugarPalm x={94} base={76} h={36} />
      <SugarPalm x={104} base={75} h={28} />
      <path d="M-12 86Q50 80 112 86V115H-12Z" fill="#bef264" />
      {Array.from({ length: 13 }, (_, i) => (
        <path key={i} d={`M${i * 10 - 10} 115l7 -26`} stroke="#84cc16" strokeWidth="1" opacity="0.45" />
      ))}
      <g transform="translate(78 98)">
        <ellipse cx="0" cy="0" rx="8" ry="4.5" fill="#94a3b8" />
        <circle cx="8" cy="-3" r="3" fill="#94a3b8" />
        <path d="M6.5 -5.5q-2 -3 1 -4M9.5 -5.5q2 -3 -1 -4" fill="none" stroke="#64748b" strokeWidth="0.9" />
        <path d="M-5 3v4M-1 3v4M3 3v4M6 3v4" stroke="#94a3b8" strokeWidth="1.6" />
      </g>
    </>
  );
}

function ZoneCentral() {
  return (
    <>
      <Sky fill="#e0e7ff" />
      <Cloud x={20} y={10} s={0.9} />
      <Cloud x={80} y={6} s={0.7} wait="-3s" />
      <Prang x={98} base={74} h={46} fill="#e9d5ff" line="#c4b5fd" />
      <rect x="-12" y="72" width="124" height="5" fill="#bbf7d0" />
      <rect x="-10" y="60" width="22" height="13" fill="#fff" />
      <path d="M-14 62L1 50L16 62Z" fill="#fdba74" />
      <path d="M-9 56L1 46L11 56Z" fill="#fb923c" opacity="0.8" />
      <path d="M-14 62L1 50L16 62M-9 56L1 46L11 56" fill="none" stroke="#6ee7b7" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M16 62q2 -1 2 -4M1 46q1 -3 2 -3" fill="none" stroke="#fcd34d" strokeWidth="1.2" strokeLinecap="round" />
      <g className={styles.sWaveSlow}>
        <path d={zoneWave(77, 1.2)} fill="#93c5fd" />
      </g>
      <path d="M20 90h12M64 100h14M90 92h10" stroke="#fff" opacity="0.6" strokeLinecap="round" />
      <g className={styles.sBob}>
        <path d="M4 98q11 4 22 0l-2 -3h-18z" fill="#f472b6" />
        <path d="M9 95v-5h10v5" fill="#fde68a" />
      </g>
      <g className={styles.sBob} style={delay("-1.5s")}>
        <path d="M76 106q9 3 18 0l-2 -2h-14z" fill="#a78bfa" />
      </g>
    </>
  );
}

function ZoneSongkran() {
  const flowers = Array.from({ length: 11 }, (_, i) => {
    const t = i / 10;
    // เส้นโค้ง M-12 2 Q50 18 112 2
    return { x: -12 + 124 * t, y: (1 - t) ** 2 * 2 + 2 * t * (1 - t) * 18 + t * t * 2, c: ["#fde047", "#fb7185", "#fff", "#c084fc"][i % 4] };
  });
  return (
    <>
      <Sky fill="#cffafe" />
      <rect x="-12" y="62" width="124" height="53" fill="#fce7f3" />
      <path d="M-12 2Q50 18 112 2" fill="none" stroke="#f9a8d4" strokeWidth="0.8" />
      {flowers.map((f) => (
        <circle key={f.x} cx={f.x} cy={f.y + 2} r="2.4" fill={f.c} stroke="#f9a8d4" strokeWidth="0.5" />
      ))}
      {(
        [
          [2, "0s"],
          [10, "-0.6s"],
          [90, "-1.1s"],
          [98, "-0.3s"],
        ] as const
      ).map(([x, wait]) => (
        <path key={x} d={`M${x} 16q-2.5 4 0 6q2.5 -2 0 -6z`} fill="#38bdf8" className={styles.sFall} style={delay(wait)} />
      ))}
      <path d="M-12 100Q50 95 112 100V115H-12Z" fill="#fbcfe8" />
      <path d="M8 96C12 76 26 70 34 80" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" className={styles.sStream} />
      <path d="M92 96C88 76 74 70 66 80" fill="none" stroke="#7dd3fc" strokeWidth="1.8" strokeLinecap="round" className={styles.sStream} style={delay("-0.3s")} />
      <path d="M0 96h14l-3 7h-8z" fill="#fcd34d" />
      <ellipse cx="7" cy="96" rx="7" ry="1.6" fill="#7dd3fc" />
      <path d="M86 96h14l-3 7h-8z" fill="#fcd34d" />
      <ellipse cx="93" cy="96" rx="7" ry="1.6" fill="#7dd3fc" />
      {[24, 40, 60, 76].map((x) => (
        <g key={x}>
          <circle cx={x} cy="106" r="2.6" fill="#fde047" />
          <circle cx={x} cy="106" r="1" fill="#fb923c" />
        </g>
      ))}
    </>
  );
}

function ZoneLoyKrathong() {
  return (
    <>
      <Sky fill="#c7d2fe" />
      <rect x="-12" y="-10" width="124" height="50" fill="#a5b4fc" opacity="0.55" />
      <Stars
        list={[
          [20, 6, 1.6, "0s"],
          [36, 16, 1.3, "-0.7s"],
          [64, 4, 1.6, "-1.5s"],
          [78, 18, 1.3, "-0.3s"],
          [96, 30, 1.5, "-1.1s"],
          [-4, 36, 1.3, "-1.9s"],
        ]}
      />
      <circle cx="6" cy="12" r="12" fill="#fef9c3" className={styles.sGlow} />
      <circle cx="6" cy="12" r="7.5" fill="#fef9c3" />
      <g className={styles.sTwinkle} style={delay("-0.8s")}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
          const r = (a * Math.PI) / 180;
          return <path key={a} d={`M${90 + 3 * Math.cos(r)} ${10 + 3 * Math.sin(r)}L${90 + 7 * Math.cos(r)} ${10 + 7 * Math.sin(r)}`} stroke="#fbcfe8" strokeWidth="1" strokeLinecap="round" />;
        })}
      </g>
      {(
        [
          [94, 64, "0s"],
          [100, 72, "-2.5s"],
          [2, 70, "-4.8s"],
        ] as const
      ).map(([x, y, wait]) => (
        <g key={x} className={styles.sLantern} style={delay(wait)}>
          <rect x={x - 2.5} y={y - 3.5} width="5" height="7" rx="1.8" fill="#fdba74" />
          <rect x={x - 1.2} y={y} width="2.4" height="2.4" rx="0.8" fill="#fef08a" />
        </g>
      ))}
      <g className={styles.sWaveSlow}>
        <path d={zoneWave(76, 1)} fill="#a5b4fc" />
      </g>
      <path d="M2 82h10M4 87h6" stroke="#fef9c3" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      {(
        [
          [4, 92, "0s"],
          [84, 96, "-1.2s"],
          [44, 104, "-2s"],
        ] as const
      ).map(([x, y, wait]) => (
        <g key={x} className={styles.sBob} style={delay(wait)}>
          <path d={`M${x - 8} ${y}q8 4 16 0l-2 -2.5h-12z`} fill="#4ade80" />
          <path d={`M${x - 5} ${y - 2.5}l2.5 -6l2.5 6zM${x} ${y - 2.5}l2.5 -6l2.5 6z`} fill="#f9a8d4" />
          <ellipse cx={x} cy={y - 10} rx="1" ry="1.7" fill="#fde047" className={styles.sFlicker} />
        </g>
      ))}
      <g className={styles.sWave}>
        <path d={zoneWave(100, 1)} fill="#818cf8" opacity="0.45" />
      </g>
    </>
  );
}

function ZoneStarSky() {
  return (
    <>
      <Sky fill="#ddd6fe" />
      <Stars
        list={[
          [6, 8, 1.6, "0s"],
          [26, 18, 1.3, "-0.6s"],
          [70, 6, 1.6, "-1.4s"],
          [92, 20, 1.3, "-0.2s"],
          [4, 60, 1.4, "-1.8s"],
          [96, 56, 1.4, "-1s"],
        ]}
      />
      <g className={styles.sShoot}>
        <path d="M90 4l-16 8" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
      </g>
      <path d="M-12 92Q30 80 60 90T112 84V115H-12Z" fill="#a78bfa" opacity="0.55" />
    </>
  );
}

function ZoneField() {
  return (
    <>
      <Sky fill="#e0f2fe" />
      <Cloud x={14} y={10} s={0.9} />
      <Cloud x={86} y={6} s={0.7} wait="-2s" />
      <rect x="-12" y="70" width="124" height="45" fill="#86efac" />
      {[-12, 12, 36, 60, 84, 108].map((x) => (
        <rect key={x} x={x} y="70" width="12" height="45" fill="#4ade80" opacity="0.35" />
      ))}
      <path d="M-12 92H112" stroke="#fff" opacity="0.7" />
      <path d="M92 70V54H112M98 54V70M104 54V70M92 60H112M92 65H112" fill="none" stroke="#fff" strokeWidth="0.6" opacity="0.7" />
      <path d="M92 70V54H112" fill="none" stroke="#fff" strokeWidth="1.8" />
      <g className={styles.sHop}>
        <circle cx="6" cy="84" r="4" fill="#fff" stroke="#a855f7" strokeWidth="0.9" />
      </g>
    </>
  );
}

const ZONES: Record<PassportIconName, () => React.ReactNode> = {
  waves: ZoneSea,
  fish: ZoneAquarium,
  palm: ZoneSouth,
  mountain: ZoneNorth,
  temple: ZoneIsan,
  compass: ZoneCentral,
  droplets: ZoneSongkran,
  moon: ZoneLoyKrathong,
  star: ZoneStarSky,
  ball: ZoneField,
};

// ขอบนุ่มของแต่ละช่อง (ใช้ครั้งเดียวต่อแผนที่ — ใส่ไว้ใน <defs> ของ SVG แผนที่)
export function PassportZoneDefs() {
  return (
    <defs>
      <linearGradient id="pl-zone-h" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.2" stopColor="#fff" />
        <stop offset="0.8" stopColor="#fff" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="pl-zone-v" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.16" stopColor="#fff" />
        <stop offset="0.84" stopColor="#fff" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <mask id="pl-zone-vmask" maskUnits="userSpaceOnUse" x="-12" y="-10" width="124" height="125">
        <rect x="-12" y="-10" width="124" height="125" fill="url(#pl-zone-v)" />
      </mask>
      <mask id="pl-zone" maskUnits="userSpaceOnUse" x="-12" y="-10" width="124" height="125">
        <rect x="-12" y="-10" width="124" height="125" fill="url(#pl-zone-h)" mask="url(#pl-zone-vmask)" />
      </mask>
    </defs>
  );
}

// วิวของ 1 ช่องบนแผนที่ (x, y = มุมซ้ายบนของช่องในหน่วยของแผนที่)
export function PassportZone({ name, x, y }: { name: string | null; x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g mask="url(#pl-zone)" opacity="0.85">
        {ZONES[sceneKey(name)]()}
      </g>
    </g>
  );
}
