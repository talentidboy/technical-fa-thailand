// ป้าย "LIVE" จุดแดงกระพริบ — ใช้ทุกที่ที่แสดงนัดที่กำลังแข่ง
export function LivePill({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-red-600 font-bold uppercase tracking-wide text-white ${
        size === "md" ? "px-2.5 py-1 text-[11px]" : "px-1.5 py-0.5 text-[9px]"
      }`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
      </span>
      Live
    </span>
  );
}
