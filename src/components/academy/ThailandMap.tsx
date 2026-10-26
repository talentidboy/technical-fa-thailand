"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import map from "@/lib/thailand-map.json";
import { ACADEMY_LEVELS, LEVEL_META, levelRank, type AcademyLevel } from "@/lib/academy";
import { LevelMark } from "./AcademyUi";
import { display } from "@/components/fonts";
import styles from "./ThailandMap.module.css";
import { ArrowRight, ListOrdered, X } from "lucide-react";

export type MapAcademy = { id: number; nameEn: string; nameTh: string | null; province: string | null; level: string | null };
type Filter = "ALL" | AcademyLevel;

const W = map.width;
const H = map.height;
// ขอบรอบแผนที่ภายในกรอบ (ด้านบนเผื่อแถบเครื่องมือ · ด้านล่างเผื่อคำอธิบายสี)
const PAD = 18;
const TOP = 58;
const BOTTOM = 52;
// สีตามจำนวนอคาเดมีในจังหวัด (แผนที่พื้นกรมท่าเข้ม): ทองสีเดียว มืด → สว่าง
const ZERO = "#1a2748";
const BINS = [
  { min: 1, label: "1", color: "#4d4630" },
  { min: 2, label: "2", color: "#7d6a32" },
  { min: 4, label: "4", color: "#ad8c35" },
  { min: 7, label: "7", color: "#d9b043" },
  { min: 15, label: "15+", color: "#ffdc6e" },
];
function fillFor(n: number) {
  let color = ZERO;
  for (const b of BINS) if (n >= b.min) color = b.color;
  return color;
}
// โครงประเทศทั้งผืน (ใช้วาดความหนาใต้แผนที่ให้ดูเป็นสามมิติ)
const OUTLINE = map.provinces.map((p) => p.d).join(" ");
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const LEVELS_DESC = [...ACADEMY_LEVELS].reverse();

// แผนที่ประเทศไทย: จังหวัดระบายสีตามจำนวนอคาเดมี · ชี้ = ดูจำนวน · แตะ = ซูม + แผ่นรายชื่อ · อันดับจังหวัดอยู่หลังปุ่ม
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

  const levelSplit = (list: MapAcademy[]) => LEVELS_DESC.map((l) => ({ l, k: list.filter((a) => a.level === l).length })).filter((x) => x.k > 0);

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto w-full max-w-md lg:max-w-[min(30rem,calc((100svh-9rem)*0.56))]"
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        if (showRank) setShowRank(false);
        else if (selected) select(null);
      }}
    >
      {/* แถบเครื่องมือ: กรองระดับ + ปุ่มอันดับจังหวัด */}
      <div className="absolute inset-x-3 top-3 z-20 flex items-center justify-between gap-2">
        <div role="group" aria-label="กรองตามระดับ" className="flex overflow-hidden rounded-lg border border-white/15 bg-white/[0.04] text-xs font-semibold">
          {(["ALL", ...LEVELS_DESC] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`border-l border-white/10 px-3 py-1.5 transition-colors first:border-l-0 ${filter === f ? "bg-(--gold) text-(--night)" : "text-white/65 hover:bg-white/10 hover:text-white"}`}
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
          className={`flex h-8 w-8 flex-none items-center justify-center rounded-md border transition-colors ${
            showRank ? "border-(--gold) bg-(--gold) text-(--night)" : "border-white/15 bg-white/[0.04] text-white/65 hover:bg-white/10 hover:text-white"
          }`}
        >
          <ListOrdered className="h-4 w-4" />
        </button>
      </div>

      {/* เงาพื้นใต้แผนที่ */}
      <span aria-hidden className="pointer-events-none absolute inset-x-[8%] bottom-[4%] h-[14%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(0_0_0/0.6),transparent)]" />
      <div className={`${styles.tilt} ${sel ? styles.flat : ""}`}>
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
          {/* ความหนาของแผ่นแผนที่: เงาเข้มสองชั้นเลื่อนลงด้านล่าง */}
          <path d={OUTLINE} fill="#000308" transform="translate(0 9)" pointerEvents="none" />
          <path d={OUTLINE} fill="#0b1733" stroke="#0b1733" strokeWidth={1.5} transform="translate(0 4.5)" pointerEvents="none" />
          {map.provinces.map((p, i) => {
            const n = countOf(p.th);
            return (
              <path
                key={p.code}
                data-code={p.code}
                d={p.d}
                fill={fillFor(n)}
                stroke="#0d1a38"
                strokeWidth={0.8}
                vectorEffect="non-scaling-stroke"
                className={`${styles.province} ${n ? "" : styles.empty}`}
                style={{ animationDelay: `${Math.round((p.cy / H) * 700 + (i % 7) * 20)}ms`, opacity: selected && selected !== p.code ? 0.35 : 1 }}
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
          })}
          {hovered && hovered.code !== selected && <path d={hovered.d} fill="none" stroke="#ffffff" strokeWidth={1.5} vectorEffect="non-scaling-stroke" pointerEvents="none" />}
          {sel && (
            <>
              <path d={sel.d} fill="none" stroke="#c8202f" strokeWidth={2} vectorEffect="non-scaling-stroke" pointerEvents="none" />
              <circle cx={sel.cx} cy={sel.cy} r={3 / view.s} fill="#c8202f" pointerEvents="none" />
              <circle key={sel.code} cx={sel.cx} cy={sel.cy} r={3 / view.s} fill="none" stroke="#c8202f" strokeWidth={1} vectorEffect="non-scaling-stroke" pointerEvents="none" className={styles.pulse} />
            </>
          )}
        </g>
      </svg>
      </div>

      {/* ป้ายตอนชี้จังหวัด */}
      {hovered && hover && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-30 w-max max-w-56 rounded-md bg-(--ink) px-3 py-2 text-white shadow-lg"
          style={{ left: hover.x, top: hover.y, transform: `translate(${hover.flip ? "calc(-100% - 14px)" : "14px"}, -50%)` }}
        >
          <p className={`${display.className} text-sm font-semibold`}>{hovered.th}</p>
          <p className="text-xs text-white/70">
            {countOf(hovered.th) ? `${countOf(hovered.th)} อคาเดมี` : "ยังไม่มีอคาเดมีที่ได้รับการรับรอง"}
            {filter !== "ALL" && countOf(hovered.th) > 0 && ` ระดับ ${LEVEL_META[filter].label}`}
          </p>
          {filter === "ALL" && countOf(hovered.th) > 0 && (
            <p className="mt-1 flex gap-2.5 text-[11px] text-white/80">
              {levelSplit(byProvince.get(hovered.th)!).map(({ l, k }) => (
                <span key={l} className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-xs" style={{ background: LEVEL_META[l].hex }} />
                  {LEVEL_META[l].label} {k}
                </span>
              ))}
            </p>
          )}
        </div>
      )}

      {/* คำอธิบายสีใต้แผนที่ */}
      {!sel && (
        <div aria-label="คำอธิบายสี: จำนวนอคาเดมีในจังหวัด" className="pointer-events-none absolute inset-x-4 bottom-3 z-10 flex items-end justify-between gap-3 text-[11px] text-white/55">
          <p className="pb-0.5 font-semibold text-white/85">อคาเดมีต่อจังหวัด</p>
          <div className="flex">
            {[{ label: "0", color: ZERO }, ...BINS].map((b) => (
              <span key={b.label} className="flex w-7 flex-col items-center gap-0.5">
                <span className="h-2 w-full" style={{ background: b.color }} />
                <span className="tabular-nums">{b.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* อันดับจังหวัด (เปิดจากปุ่ม) */}
      {showRank && (
        <div className={`${styles.pop} absolute right-3 top-13 z-30 flex max-h-[70%] w-72 max-w-[calc(100%-1.5rem)] flex-col rounded-md border border-(--line) bg-white p-4 shadow-xl`}>
          <div className="flex items-baseline justify-between gap-2 border-b border-(--line) pb-2">
            <p className={`${display.className} font-semibold text-(--ink)`}>อันดับจังหวัด</p>
            <p className="text-[11px] text-(--ink-soft)">
              {visible.length.toLocaleString()} อคาเดมี · {provinceCount} จังหวัด
            </p>
          </div>
          <ol className="-mr-2 mt-2 min-h-0 flex-1 overflow-y-auto pr-2">
            {ranking.map((p, i) => (
              <li key={p.code}>
                <button type="button" onClick={() => select(p.code)} className="group flex w-full items-center gap-2.5 rounded px-1.5 py-1.5 text-left hover:bg-(--paper)">
                  <span className="w-5 text-right text-[11px] font-semibold tabular-nums text-(--ink-soft)">{i + 1}</span>
                  <span className="w-24 flex-none truncate text-sm text-(--ink)">{p.th}</span>
                  <span className="h-1.5 flex-1 bg-(--paper)">
                    <span className="block h-full" style={{ width: `${(p.n / ranking[0].n) * 100}%`, background: fillFor(p.n) }} />
                  </span>
                  <span className="w-7 text-right text-sm font-semibold tabular-nums text-(--ink)">{p.n}</span>
                </button>
              </li>
            ))}
          </ol>
          {unknown > 0 && <p className="mt-2 border-t border-(--line) pt-2 text-[11px] text-(--ink-soft)">ไม่ระบุจังหวัดในทะเบียน {unknown} แห่ง</p>}
        </div>
      )}

      {/* แผ่นรายชื่อของจังหวัดที่เลือก */}
      {sel && inView && (
        <section
          key={`${sel.code}-${filter}`}
          aria-label={`อคาเดมีใน${sel.th}`}
          className={`${styles.sheet} fixed inset-x-3 bottom-3 z-40 flex max-h-[60svh] flex-col rounded-lg border border-(--line) bg-white shadow-2xl lg:absolute lg:z-20 lg:max-h-[52%]`}
        >
          <div className="flex items-start gap-3 border-b border-(--line) px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className={`${display.className} truncate text-xl font-semibold leading-tight text-(--ink)`}>{sel.th}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 text-xs text-(--ink-soft)">
                <span>{sel.en}</span>
                {levelSplit(selList).map(({ l, k }) => (
                  <span key={l} className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-xs" style={{ background: LEVEL_META[l].hex }} />
                    {LEVEL_META[l].label} {k}
                  </span>
                ))}
              </p>
            </div>
            <p className="text-right leading-none">
              <span className={`${display.className} block text-3xl font-semibold text-(--ink)`}>{selList.length}</span>
              <span className="text-[11px] text-(--ink-soft)">อคาเดมี</span>
            </p>
            <button type="button" onClick={() => select(null)} aria-label="ปิด กลับไปดูทั้งประเทศ" className="-mr-1 rounded p-1 text-(--ink-soft) hover:bg-(--paper) hover:text-(--ink)">
              <X className="h-5 w-5" />
            </button>
          </div>
          {selList.length === 0 ? (
            <p className="px-4 py-4 text-sm text-(--ink-soft)">ไม่มีอคาเดมี{filter !== "ALL" && `ระดับ ${LEVEL_META[filter].label}`}ในจังหวัดนี้</p>
          ) : (
            <ul className="min-h-0 flex-1 divide-y divide-(--line) overflow-y-auto">
              {selList.map((a) => (
                <li key={a.id}>
                  <Link href={`/academies/${a.id}`} className="group flex items-center gap-3 px-4 py-2.5 hover:bg-(--paper)">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-(--ink)">{a.nameEn}</span>
                      {a.nameTh && <span className="block truncate text-xs text-(--ink-soft)">{a.nameTh}</span>}
                    </span>
                    <LevelMark level={a.level} />
                    <ArrowRight className="h-4 w-4 flex-none text-slate-300 group-hover:text-(--ink)" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/academies?province=${encodeURIComponent(sel.th)}${filter !== "ALL" ? `&level=${filter}` : ""}#directory`}
            className="flex items-center justify-between border-t border-(--line) px-4 py-2.5 text-sm font-semibold text-(--ink) hover:bg-(--paper)"
          >
            ดูในทำเนียบ
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}
    </div>
  );
}
