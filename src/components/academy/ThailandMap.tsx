"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import map from "@/lib/thailand-map.json";
import { ACADEMY_LEVELS, LEVEL_META, levelRank, type AcademyLevel } from "@/lib/academy";
import { LevelMedal } from "./AcademyUi";
import styles from "./ThailandMap.module.css";
import { ArrowRight, ListOrdered, MapPin, MousePointerClick, X } from "lucide-react";

export type MapAcademy = { id: number; nameEn: string; nameTh: string | null; province: string | null; level: string | null };
type Filter = "ALL" | AcademyLevel;

const W = map.width;
const H = map.height;
// ขอบรอบแผนที่ภายในกรอบ (ด้านบนเผื่อแถบเครื่องมือ)
const PAD = 18;
const TOP = 58;
const BOTTOM = 52; // ที่ว่างใต้แผนที่สำหรับคำอธิบายสี
// สีตามจำนวนอคาเดมีในจังหวัด (สีเดียว มืด → สว่าง)
const BINS = [
  { min: 1, label: "1", color: "#854f15" },
  { min: 2, label: "2", color: "#ae6c14" },
  { min: 4, label: "4", color: "#d58d16" },
  { min: 7, label: "7", color: "#f3b539" },
  { min: 15, label: "15+", color: "#ffe283" },
];
function fillFor(n: number) {
  let color = "var(--zero)";
  for (const b of BINS) if (n >= b.min) color = b.color;
  return color;
}
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const LEVELS_DESC = [...ACADEMY_LEVELS].reverse();

// แผนที่ประเทศไทย: จังหวัดระบายสีตามจำนวนอคาเดมี · ชี้ = ดูจำนวน · แตะ = ซูม + แผ่นรายชื่อเลื่อนขึ้นมา · อันดับจังหวัดอยู่หลังปุ่ม
export function ThailandMap({ academies }: { academies: MapAcademy[] }) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [selected, setSelected] = useState<number | null>(null);
  const [showRank, setShowRank] = useState(false);
  const [hover, setHover] = useState<{ code: number; x: number; y: number; flip: boolean } | null>(null);
  const [view, setView] = useState({ s: 1, tx: 0, ty: 0 });
  const [inView, setInView] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // มือถือ: แผ่นรายชื่อลอยติดขอบจอ — ซ่อนเมื่อเลื่อนพ้นแผนที่ไปแล้ว
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const visible = useMemo(() => (filter === "ALL" ? academies : academies.filter((a) => a.level === filter)), [academies, filter]);
  const byProvince = useMemo(() => {
    const m = new Map<string, MapAcademy[]>();
    for (const a of visible) if (a.province) m.set(a.province, [...(m.get(a.province) ?? []), a]);
    for (const list of m.values()) list.sort((a, b) => levelRank(b.level) - levelRank(a.level) || a.nameEn.localeCompare(b.nameEn));
    return m;
  }, [visible]);
  const countOf = (th: string) => byProvince.get(th)?.length ?? 0;
  const unknown = visible.filter((a) => !a.province).length;
  const provinceCount = map.provinces.filter((p) => countOf(p.th) > 0).length;
  const ranking = map.provinces
    .map((p) => ({ ...p, n: countOf(p.th) }))
    .filter((p) => p.n > 0)
    .sort((a, b) => b.n - a.n || a.th.localeCompare(b.th, "th"));

  const sel = map.provinces.find((p) => p.code === selected) ?? null;
  const hovered = map.provinces.find((p) => p.code === hover?.code) ?? null;
  const selList = sel ? (byProvince.get(sel.th) ?? []) : [];

  function select(code: number | null) {
    setSelected(code);
    setShowRank(false);
    const path = code == null ? null : svgRef.current?.querySelector<SVGPathElement>(`[data-code="${code}"]`);
    if (!path) return setView({ s: 1, tx: 0, ty: 0 });
    const b = path.getBBox();
    const s = clamp(Math.min(W / b.width, H / b.height) * 0.3, 1.4, 6);
    // จังหวัดไปอยู่ช่วงบนของกรอบ — ครึ่งล่างมีแผ่นรายชื่อทับอยู่
    setView({
      s,
      tx: clamp(W / 2 - s * (b.x + b.width / 2), W - s * W, 0),
      ty: clamp(H * 0.3 - s * (b.y + b.height / 2), H * 0.55 - s * H, 0),
    });
  }

  function onPointer(e: React.PointerEvent<SVGSVGElement>) {
    const code = Number((e.target as Element).getAttribute("data-code"));
    const box = wrapRef.current?.getBoundingClientRect();
    if (!code || !box || e.pointerType === "touch") return setHover(null);
    setHover({ code, x: e.clientX - box.left, y: e.clientY - box.top, flip: e.clientX - box.left > box.width * 0.55 });
  }

  const layer = map.provinces.map((p, i) => {
    const n = countOf(p.th);
    return (
      <path
        key={p.code}
        data-code={p.code}
        d={p.d}
        fill={fillFor(n)}
        stroke="var(--edge)"
        strokeWidth={0.6}
        vectorEffect="non-scaling-stroke"
        className={`${styles.province} ${n ? "" : styles.empty}`}
        style={{ animationDelay: `${Math.round((p.cy / H) * 900 + (i % 7) * 25)}ms`, opacity: selected && selected !== p.code ? 0.45 : 1 }}
        tabIndex={n ? 0 : -1}
        role={n ? "button" : undefined}
        aria-label={n ? `${p.th}: ${n} อคาเดมี` : undefined}
        onClick={() => n && select(p.code)}
        onKeyDown={(e) => {
          if (n && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            select(p.code);
          }
        }}
      />
    );
  });

  const levelSplit = (list: MapAcademy[]) => LEVELS_DESC.map((l) => ({ l, k: list.filter((a) => a.level === l).length })).filter((x) => x.k > 0);

  return (
    <div
      ref={wrapRef}
      className={`${styles.map} relative mx-auto w-full max-w-md overflow-hidden lg:max-w-[min(28rem,calc((100svh-9rem)*0.52))] rounded-[2.25rem] bg-linear-to-b from-white/8 to-white/2 shadow-[0_30px_90px_-30px_rgba(251,191,36,0.35)] ring-1 ring-white/12`}
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        if (showRank) setShowRank(false);
        else if (selected) select(null);
      }}
    >
      {/* แถบเครื่องมือ: กรองระดับ + ปุ่มอันดับจังหวัด */}
      <div className="absolute inset-x-3 top-3 z-20 flex items-center justify-between gap-2">
        <div role="group" aria-label="กรองตามระดับ" className="flex rounded-full bg-indigo-950/70 p-1 ring-1 ring-white/10 backdrop-blur-md">
          {(["ALL", ...LEVELS_DESC] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${filter === f ? "bg-amber-300 text-indigo-950 shadow" : "text-indigo-200 hover:text-white"}`}
            >
              {f === "ALL" ? "ทั้งหมด" : LEVEL_META[f].label}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-expanded={showRank}
          aria-label="อันดับจังหวัด"
          title="อันดับจังหวัด"
          onClick={() => setShowRank((v) => !v)}
          className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ring-1 backdrop-blur-md transition-colors ${
            showRank ? "bg-amber-300 text-indigo-950 ring-amber-300" : "bg-indigo-950/70 text-indigo-100 ring-white/10 hover:text-white"
          }`}
        >
          <ListOrdered className="h-4 w-4" />
        </button>
      </div>

      <svg
        ref={svgRef}
        viewBox={`${-PAD} ${-TOP} ${W + PAD * 2} ${H + TOP + BOTTOM}`}
        className="block h-auto w-full"
        role="img"
        aria-label={`แผนที่ประเทศไทย: อคาเดมีที่ได้รับการรับรอง ${visible.length} แห่ง ใน ${provinceCount} จังหวัด`}
        onPointerMove={onPointer}
        onPointerLeave={() => setHover(null)}
        onClick={(e) => {
          if (!(e.target as Element).getAttribute("data-code")) setShowRank(false);
        }}
      >
        <g className={styles.zoom} style={{ transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.s})` }}>
          {layer}
          {hovered && hovered.code !== selected && <path d={hovered.d} fill="none" stroke="#fff" strokeWidth={1.4} vectorEffect="non-scaling-stroke" pointerEvents="none" />}
          {sel && (
            <>
              <path d={sel.d} fill="none" stroke="#fff7d6" strokeWidth={2} vectorEffect="non-scaling-stroke" pointerEvents="none" className={styles.glow} />
              <circle cx={sel.cx} cy={sel.cy} r={3 / view.s} fill="#fff" pointerEvents="none" />
              <circle key={sel.code} cx={sel.cx} cy={sel.cy} r={3 / view.s} fill="none" stroke="#fff" strokeWidth={1} vectorEffect="non-scaling-stroke" pointerEvents="none" className={styles.pulse} />
            </>
          )}
        </g>
      </svg>

      {/* ป้ายลอยตอนชี้จังหวัด */}
      {hovered && hover && (
        <div
          className="pointer-events-none absolute z-30 w-max max-w-56 rounded-xl bg-white px-3 py-2 text-slate-900 shadow-xl ring-1 ring-black/5"
          style={{ left: hover.x, top: hover.y, transform: `translate(${hover.flip ? "calc(-100% - 14px)" : "14px"}, -50%)` }}
        >
          <p className="text-sm font-bold">{hovered.th}</p>
          <p className="text-xs text-slate-500">
            {countOf(hovered.th) ? `${countOf(hovered.th)} อคาเดมี` : "ยังไม่มีอคาเดมีที่ได้รับการรับรอง"}
            {filter !== "ALL" && countOf(hovered.th) > 0 && ` ระดับ ${LEVEL_META[filter].label}`}
          </p>
          {filter === "ALL" && countOf(hovered.th) > 0 && (
            <p className="mt-1 flex gap-2 text-[11px] font-semibold">
              {levelSplit(byProvince.get(hovered.th)!).map(({ l, k }) => (
                <span key={l} className={LEVEL_META[l].text}>
                  {LEVEL_META[l].label} {k}
                </span>
              ))}
            </p>
          )}
        </div>
      )}

      {/* คำแนะนำ (อ่าวไทย = ที่ว่าง) + คำอธิบายสีใต้แผนที่ */}
      {!sel && (
        <>
          <p className="pointer-events-none absolute right-4 top-[62%] z-10 hidden items-center gap-1 rounded-full bg-indigo-950/60 px-2.5 py-1 text-[11px] text-indigo-200 backdrop-blur sm:flex">
            <MousePointerClick className="h-3.5 w-3.5 text-amber-300" />
            แตะจังหวัดเพื่อดูรายชื่อ
          </p>
          <div aria-label="คำอธิบายสี: จำนวนอคาเดมีในจังหวัด" className="pointer-events-none absolute inset-x-4 bottom-3 z-10 flex items-end justify-between gap-3 text-[11px] text-indigo-200">
            <p className="pb-0.5 font-semibold text-indigo-100">อคาเดมีต่อจังหวัด</p>
            <div className="flex gap-0.5">
              {[{ label: "0", color: "#2e2e62" }, ...BINS].map((b) => (
                <span key={b.label} className="flex w-7 flex-col items-center gap-0.5">
                  <span className="h-2 w-full rounded-sm ring-1 ring-white/10" style={{ background: b.color }} />
                  <span className="tabular-nums">{b.label}</span>
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* อันดับจังหวัด (เปิดจากปุ่ม) */}
      {showRank && (
        <div className={`${styles.pop} absolute right-3 top-15 z-30 flex max-h-[70%] w-72 max-w-[calc(100%-1.5rem)] flex-col rounded-3xl bg-indigo-950/90 p-4 shadow-2xl ring-1 ring-white/15 backdrop-blur-md`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-white">อันดับจังหวัด</p>
            <p className="text-[11px] text-indigo-300">
              {visible.length.toLocaleString()} อคาเดมี · {provinceCount} จังหวัด
            </p>
          </div>
          <ol className="mt-3 -mr-2 min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-2">
            {ranking.map((p, i) => (
              <li key={p.code}>
                <button type="button" onClick={() => select(p.code)} className="group flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left hover:bg-white/5">
                  <span className="w-5 text-right text-[11px] font-bold tabular-nums text-indigo-400">{i + 1}</span>
                  <span className="w-24 flex-none truncate text-sm text-white group-hover:text-amber-200">{p.th}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                    <span className="block h-full rounded-full" style={{ width: `${(p.n / ranking[0].n) * 100}%`, background: fillFor(p.n) }} />
                  </span>
                  <span className="w-7 text-right text-sm font-bold tabular-nums text-white">{p.n}</span>
                </button>
              </li>
            ))}
          </ol>
          {unknown > 0 && <p className="mt-2 text-[11px] text-indigo-400">ไม่ระบุจังหวัดในทะเบียน {unknown} แห่ง</p>}
        </div>
      )}

      {/* แผ่นรายชื่อของจังหวัดที่เลือก */}
      {sel && inView && (
        <section
          key={`${sel.code}-${filter}`}
          aria-label={`อคาเดมีใน${sel.th}`}
          className={`${styles.sheet} fixed inset-x-3 bottom-3 z-40 flex max-h-[60svh] flex-col rounded-3xl bg-indigo-950/95 p-4 shadow-2xl ring-1 ring-white/15 backdrop-blur-md lg:absolute lg:z-20 lg:max-h-[52%] lg:bg-indigo-950/90`}
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-lg font-extrabold text-white">
                <MapPin className="h-4.5 w-4.5 flex-none text-amber-300" />
                <span className="truncate">{sel.th}</span>
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-indigo-300">
                <span>{sel.en}</span>
                {levelSplit(selList).map(({ l, k }) => (
                  <span key={l} className="font-semibold text-indigo-100">
                    · {LEVEL_META[l].label} {k}
                  </span>
                ))}
              </p>
            </div>
            <p className="text-right leading-none">
              <span className="block text-3xl font-extrabold text-amber-300">{selList.length}</span>
              <span className="text-[11px] text-indigo-300">อคาเดมี</span>
            </p>
            <button type="button" onClick={() => select(null)} aria-label="ปิด กลับไปดูทั้งประเทศ" className="-mr-1 -mt-1 rounded-full p-1.5 text-indigo-300 hover:bg-white/10 hover:text-white">
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
          {selList.length === 0 ? (
            <p className="mt-3 text-sm text-indigo-200">ไม่มีอคาเดมี{filter !== "ALL" && `ระดับ ${LEVEL_META[filter].label}`}ในจังหวัดนี้</p>
          ) : (
            <ul className="mt-3 -mr-2 min-h-0 flex-1 space-y-1 overflow-y-auto pr-2">
              {selList.map((a) => (
                <li key={a.id}>
                  <Link href={`/academies/${a.id}`} className="group flex items-center gap-3 rounded-2xl p-1.5 pr-2 transition-colors hover:bg-white/8">
                    <LevelMedal level={a.level} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">{a.nameEn}</span>
                      {a.nameTh && <span className="block truncate text-xs text-indigo-300">{a.nameTh}</span>}
                    </span>
                    <ArrowRight className="h-4 w-4 flex-none text-indigo-400 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-300" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/academies?province=${encodeURIComponent(sel.th)}${filter !== "ALL" ? `&level=${filter}` : ""}#directory`}
            className="mt-3 inline-flex items-center gap-1 self-start text-sm font-semibold text-amber-300 hover:text-amber-200"
          >
            ดูในทำเนียบ
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}
    </div>
  );
}
