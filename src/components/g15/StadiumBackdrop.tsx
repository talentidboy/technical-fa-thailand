// ฉากสนามฟุตบอลกลางคืน วาดด้วย SVG ล้วน (ไม่ต้องโหลดรูป คมทุกขนาดจอ) — ใช้เป็นพื้นหลังฮีโร่หน้าโปรไฟล์นักกีฬา
// ชั้นจากหลังไปหน้า: ท้องฟ้าม่วง → ลำแสงจากเสาไฟ → อัฒจันทร์ + จุดแฟลชคนดู → สนามหญ้าลายตัด + เส้นสนาม → โบเก้
// ตำแหน่งทุกจุดกำหนดตายตัว (ไม่สุ่มตอน render) ให้ HTML ฝั่งเซิร์ฟเวอร์/เบราว์เซอร์ตรงกันเสมอ

// จุดแฟลชคนดูบนอัฒจันทร์ — สร้างจากสูตรตายตัว (ไม่ใช้ Math.random)
const CROWD = Array.from({ length: 90 }, (_, i) => {
  const t = (i * 37) % 90;
  const x = 40 + ((i * 157) % 1360);
  const row = (i * 13) % 5;
  return { x, y: 268 + row * 26 + ((t % 7) - 3), r: 1 + (i % 3) * 0.6, o: 0.25 + ((i * 7) % 10) / 20, d: (i % 6) * 0.7 };
});

const BOKEH = [
  { x: "8%", y: "18%", s: 90, c: "rgba(244,114,182,0.25)" },
  { x: "22%", y: "62%", s: 60, c: "rgba(255,255,255,0.12)" },
  { x: "38%", y: "12%", s: 40, c: "rgba(251,191,36,0.22)" },
  { x: "62%", y: "8%", s: 120, c: "rgba(167,139,250,0.22)" },
  { x: "78%", y: "40%", s: 70, c: "rgba(255,255,255,0.14)" },
  { x: "92%", y: "16%", s: 50, c: "rgba(244,114,182,0.28)" },
  { x: "50%", y: "70%", s: 35, c: "rgba(103,232,249,0.2)" },
];

export function StadiumBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 560" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="sd-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0d0524" />
            <stop offset="0.55" stopColor="#21104f" />
            <stop offset="1" stopColor="#3b1890" />
          </linearGradient>
          <linearGradient id="sd-stand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#170a3a" />
            <stop offset="1" stopColor="#2a1468" />
          </linearGradient>
          <linearGradient id="sd-pitch" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#25524a" />
            <stop offset="1" stopColor="#10241f" />
          </linearGradient>
          <linearGradient id="sd-beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.32" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="sd-flood">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="0.15" stopColor="#fde68a" stopOpacity="0.5" />
            <stop offset="1" stopColor="#a78bfa" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sd-horizon" cx="0.5" cy="0" r="0.6">
            <stop offset="0" stopColor="#c4b5fd" stopOpacity="0.45" />
            <stop offset="1" stopColor="#c4b5fd" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="1440" height="560" fill="url(#sd-sky)" />

        {/* ลำแสงจากเสาไฟลงสนาม */}
        <polygon points="190,130 250,130 780,560 260,560" fill="url(#sd-beam)" opacity="0.75" />
        <polygon points="1190,130 1250,130 1180,560 660,560" fill="url(#sd-beam)" opacity="0.75" />

        {/* อัฒจันทร์โค้ง 2 ชั้น */}
        <path d="M0 250 Q720 170 1440 250 L1440 420 L0 420 Z" fill="url(#sd-stand)" />
        <path d="M0 250 Q720 170 1440 250" fill="none" stroke="#a78bfa" strokeOpacity="0.55" strokeWidth="2" />
        <path d="M0 330 Q720 262 1440 330" fill="none" stroke="#a78bfa" strokeOpacity="0.25" strokeWidth="1.5" />
        {/* แถบไฟ LED ขอบอัฒจันทร์ */}
        <path d="M0 412 Q720 360 1440 412" fill="none" stroke="#f472b6" strokeOpacity="0.7" strokeWidth="3" />
        {/* จุดแฟลชคนดู */}
        {CROWD.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={c.r} fill="#fff" opacity={c.o}>
            <animate attributeName="opacity" values={`${c.o};0.05;${c.o}`} dur="3.2s" begin={`${c.d}s`} repeatCount="indefinite" />
          </circle>
        ))}

        {/* แสงเรืองแนวขอบฟ้าเหนือสนาม */}
        <ellipse cx="720" cy="420" rx="900" ry="140" fill="url(#sd-horizon)" />

        {/* สนามหญ้าลายตัด + เส้นสนามแบบมุมมองลึก */}
        <path d="M-200 560 L260 420 L1180 420 L1640 560 Z" fill="url(#sd-pitch)" />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <path
            key={i}
            d={`M${260 + i * 131.4} 420 L${314 + i * 131.4} 420 L${-200 + (i + 0.5) * 262.8} 560 L${-200 + i * 262.8} 560 Z`}
            fill="#a7f3d0"
            opacity="0.06"
          />
        ))}
        <path d="M260 420 L1180 420" stroke="#fff" strokeOpacity="0.35" strokeWidth="2" />
        <path d="M720 420 L720 560" stroke="#fff" strokeOpacity="0.18" strokeWidth="2" />
        <ellipse cx="720" cy="482" rx="170" ry="34" fill="none" stroke="#fff" strokeOpacity="0.2" strokeWidth="2" />

        {/* เสาไฟสนามซ้าย-ขวา */}
        {[220, 1220].map((x) => (
          <g key={x}>
            <circle cx={x} cy="130" r="260" fill="url(#sd-flood)" opacity="0.75" />
            <rect x={x - 34} y="114" width="68" height="30" rx="4" fill="#1e1b4b" stroke="#c4b5fd" strokeOpacity="0.6" />
            {[0, 1, 2, 3].map((j) => (
              <circle key={j} cx={x - 24 + j * 16} cy="129" r="5" fill="#fffbea" />
            ))}
            <line x1={x} y1="144" x2={x} y2="250" stroke="#1e1b4b" strokeWidth="6" />
          </g>
        ))}
      </svg>

      {/* โบเก้ลอย */}
      {BOKEH.map((b, i) => (
        <span
          key={i}
          className="animate-float-y absolute rounded-full blur-md"
          style={{ left: b.x, top: b.y, width: b.s, height: b.s, background: b.c, animationDelay: `${i * 0.6}s` }}
        />
      ))}
    </div>
  );
}
