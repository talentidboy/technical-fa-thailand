// ถ้วยรางวัลสีทอง (SVG) สำหรับหน้า "รางวัล" — ไล่เฉดทอง + แสงสะท้อน
export function TrophyArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 150" className={className} aria-hidden>
      <defs>
        <linearGradient id="trophy-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff7d1" />
          <stop offset="30%" stopColor="#fcd34d" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
        <linearGradient id="trophy-shine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="trophy-base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b1890" />
          <stop offset="100%" stopColor="#150833" />
        </linearGradient>
      </defs>
      {/* หูถ้วย */}
      <path d="M26 22 C6 22 4 52 30 60" fill="none" stroke="url(#trophy-gold)" strokeWidth="7" strokeLinecap="round" />
      <path d="M94 22 C114 22 116 52 90 60" fill="none" stroke="url(#trophy-gold)" strokeWidth="7" strokeLinecap="round" />
      {/* ตัวถ้วย */}
      <path d="M24 12 H96 V34 C96 62 80 78 60 80 C40 78 24 62 24 34 Z" fill="url(#trophy-gold)" />
      <path d="M36 16 C34 40 40 62 54 74" fill="none" stroke="url(#trophy-shine)" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
      {/* ดาว */}
      <path
        d="M60 30 l4.4 9 9.9 1.4 -7.2 7 1.7 9.8 -8.8 -4.6 -8.8 4.6 1.7 -9.8 -7.2 -7 9.9 -1.4 Z"
        fill="#fff7d1"
        opacity="0.9"
      />
      {/* ก้าน + ฐาน */}
      <path d="M52 80 H68 L66 98 H54 Z" fill="url(#trophy-gold)" />
      <rect x="40" y="98" width="40" height="10" rx="3" fill="url(#trophy-gold)" />
      <rect x="30" y="108" width="60" height="30" rx="4" fill="url(#trophy-base)" stroke="url(#trophy-gold)" strokeWidth="3" />
      <rect x="44" y="117" width="32" height="12" rx="2" fill="url(#trophy-gold)" opacity="0.85" />
    </svg>
  );
}
