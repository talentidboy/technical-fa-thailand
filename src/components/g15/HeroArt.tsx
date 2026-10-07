// ลายตกแต่งฮีโร่ตามอาร์ตเวิร์กทางการ (สไลด์ FA Thailand G15) — เส้นแปรงทแยงชมพู/ฟ้า/บานเย็น + ดอกไม้เล็ก ๆ
// วางเป็น -z-10 ภายใต้ section ที่ใส่ `isolate` — อยู่หลังเนื้อหาเสมอ ไม่ต้องไปแก้ z-index ของข้อความในฮีโร่ทุกหน้า
const STREAKS = [
  { className: "-left-24 top-6 w-96", color: "via-pink-500" },
  { className: "left-1/3 -top-6 w-72", color: "via-cyan-400" },
  { className: "-right-16 top-10 w-[28rem]", color: "via-fuchsia-500" },
  { className: "right-1/4 bottom-4 w-80", color: "via-cyan-400" },
  { className: "-left-10 bottom-0 w-64", color: "via-fuchsia-400" },
];

const FLOWERS = [
  { className: "right-[12%] top-6 h-7 w-7 text-pink-400/80", delay: "0s" },
  { className: "left-[46%] bottom-6 h-5 w-5 text-fuchsia-300/70", delay: "1.4s" },
  { className: "left-[8%] top-1/2 h-4 w-4 text-pink-300/60", delay: "0.7s" },
  { className: "right-[30%] bottom-10 h-4 w-4 text-amber-300/70", delay: "2s" },
];

function Flower({ className, delay }: { className: string; delay: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`animate-float-y absolute ${className}`} style={{ animationDelay: delay }} fill="currentColor">
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse key={deg} cx="12" cy="6.5" rx="3.6" ry="5.5" transform={`rotate(${deg} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="2.6" className="text-amber-300" fill="currentColor" />
    </svg>
  );
}

export function HeroArt() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {STREAKS.map((s, i) => (
        <div
          key={i}
          className={`absolute h-3 -rotate-[35deg] rounded-full bg-linear-to-r from-transparent ${s.color} to-transparent opacity-50 blur-[1px] ${s.className}`}
        />
      ))}
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      {FLOWERS.map((f, i) => (
        <Flower key={i} {...f} />
      ))}
    </div>
  );
}
