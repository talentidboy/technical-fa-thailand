"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import map from "@/lib/thailand-map.json";
import { ACADEMY_LEVELS, LEVEL_META, levelRank, type AcademyLevel } from "@/lib/academy";
import { LevelMedal } from "./AcademyUi";
import styles from "./ThailandMap.module.css";
import { ArrowRight, MapPin, Minimize2 } from "lucide-react";

export type MapAcademy = { id: number; nameEn: string; nameTh: string | null; province: string | null; level: string | null };
type Filter = "ALL" | AcademyLevel;

const W = map.width;
const H = map.height;
const PAD = 18; // ขอบรอบแผนที่ภายในกรอบ
// สีตามจำนวนอคาเดมีในจังหวัด (สีเดียว มืด → สว่าง)
const BINS = [
  { min: 1, label: "1", color: "#854f15" },
  { min: 2, label: "2–3", color: "#ae6c14" },
  { min: 4, label: "4–6", color: "#d58d16" },
  { min: 7, label: "7–14", color: "#f3b539" },
  { min: 15, label: "15+", color: "#ffe283" },
];
function fillFor(n: number) {
  let color = "var(--zero)";
  for (const b of BINS) if (n >= b.min) color = b.color;
  return color;
}
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const LEVELS_DESC = [...ACADEMY_LEVELS].reverse();

// แผนที่ประเทศไทย: จังหวัดระบายสีตามจำนวนอคาเดมี · ชี้ = ดูจำนวน · คลิก = ซูมและดูรายชื่อ
export function ThailandMap({ academies, children }: { academies: MapAcademy[]; children?: React.ReactNode }) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [selected, setSelected] = useState<number | null>(null);
  const [hover, setHover] = useState<{ code: number; x: number; y: number; flip: boolean } | null>(null);
  const [view, setView] = useState({ s: 1, tx: 0, ty: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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
    .sort((a, b) => b.n - a.n || a.th.localeCompare(b.th, "th"))
    .slice(0, 8);
  const levelCount = (l: AcademyLevel) => academies.filter((a) => a.level === l).length;

  const sel = map.provinces.find((p) => p.code === selected) ?? null;
  const hovered = map.provinces.find((p) => p.code === hover?.code) ?? null;
  const selList = sel ? (byProvince.get(sel.th) ?? []) : [];

  function select(code: number | null, fromMap = false) {
    setSelected(code);
    const path = code == null ? null : svgRef.current?.querySelector<SVGPathElement>(`[data-code="${code}"]`);
    if (!path) return setView({ s: 1, tx: 0, ty: 0 });
    const b = path.getBBox();
    const s = clamp(Math.min(W / b.width, H / b.height) * 0.32, 1.4, 6);
    setView({
      s,
      tx: clamp(W / 2 - s * (b.x + b.width / 2), W - s * W, 0),
      ty: clamp(H / 2 - s * (b.y + b.height / 2), H - s * H, 0),
    });
    // จอเล็ก: รายชื่ออยู่ใต้แผนที่ — เลื่อนให้เห็นหลังซูมเสร็จครู่หนึ่ง
    if (fromMap && window.matchMedia("(max-width: 1023px)").matches) {
      setTimeout(() => {
        const top = panelRef.current?.getBoundingClientRect().top ?? 0;
        if (top > window.innerHeight * 0.75)
          window.scrollBy({ top: top - window.innerHeight * 0.4, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      }, 450);
    }
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
        style={{ animationDelay: `${Math.round((p.cy / H) * 900 + (i % 7) * 25)}ms`, opacity: selected && selected !== p.code ? 0.5 : 1 }}
        tabIndex={n ? 0 : -1}
        role={n ? "button" : undefined}
        aria-label={n ? `${p.th}: ${n} อคาเดมี` : undefined}
        onClick={() => n && select(p.code, true)}
        onKeyDown={(e) => {
          if (n && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            select(p.code, true);
          }
        }}
      />
    );
  });

  const tip = hovered && hover && (
    <div
      className="pointer-events-none absolute z-10 w-max max-w-56 rounded-xl bg-white px-3 py-2 text-slate-900 shadow-xl ring-1 ring-black/5"
      style={{ left: hover.x, top: hover.y, transform: `translate(${hover.flip ? "calc(-100% - 14px)" : "14px"}, -50%)` }}
    >
      <p className="text-sm font-bold">{hovered.th}</p>
      <p className="text-xs text-slate-500">
        {countOf(hovered.th) ? `${countOf(hovered.th)} อคาเดมี` : "ยังไม่มีอคาเดมีที่ได้รับการรับรอง"}
        {filter !== "ALL" && countOf(hovered.th) > 0 && ` ระดับ ${LEVEL_META[filter].label}`}
      </p>
      {filter === "ALL" && countOf(hovered.th) > 0 && (
        <p className="mt-1 flex gap-2 text-[11px] font-semibold text-slate-600">
          {LEVELS_DESC.map((l) => {
            const k = byProvince.get(hovered.th)!.filter((a) => a.level === l).length;
            return k ? (
              <span key={l} className={LEVEL_META[l].text}>
                {LEVEL_META[l].label} {k}
              </span>
            ) : null;
          })}
        </p>
      )}
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] lg:grid-rows-[auto_1fr] lg:gap-x-12">
      <div className="lg:col-start-1 lg:row-start-1">{children}</div>

      {/* แผนที่ */}
      <div className={`${styles.map} lg:col-start-2 lg:row-span-2 lg:row-start-1`}>
        <div className="mb-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="กรองตามระดับ">
          {(["ALL", ...LEVELS_DESC] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-colors ${
                filter === f ? "bg-amber-300 text-indigo-950 ring-amber-300" : "text-indigo-200 ring-white/15 hover:bg-white/10 hover:text-white"
              }`}
            >
              {f === "ALL" ? `ทั้งหมด ${academies.length}` : `${LEVEL_META[f].label} ${levelCount(f)}`}
            </button>
          ))}
        </div>
        <div ref={wrapRef} className="relative mx-auto w-full max-w-100 overflow-hidden rounded-4xl bg-white/3 ring-1 ring-white/10">
          <svg
            ref={svgRef}
            viewBox={`${-PAD} ${-PAD} ${W + PAD * 2} ${H + PAD * 2}`}
            className="block h-auto w-full"
            role="img"
            aria-label={`แผนที่ประเทศไทย: อคาเดมีที่ได้รับการรับรอง ${visible.length} แห่ง ใน ${provinceCount} จังหวัด`}
            onPointerMove={onPointer}
            onPointerLeave={() => setHover(null)}
          >
            <g className={styles.zoom} style={{ transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.s})` }}>
              {layer}
              {hovered && hovered.code !== selected && (
                <path d={hovered.d} fill="none" stroke="#fff" strokeWidth={1.4} vectorEffect="non-scaling-stroke" pointerEvents="none" />
              )}
              {sel && (
                <>
                  <path d={sel.d} fill="none" stroke="#fff7d6" strokeWidth={2} vectorEffect="non-scaling-stroke" pointerEvents="none" className={styles.glow} />
                  <circle cx={sel.cx} cy={sel.cy} r={3 / view.s} fill="#fff" pointerEvents="none" />
                  <circle key={sel.code} cx={sel.cx} cy={sel.cy} r={3 / view.s} fill="none" stroke="#fff" strokeWidth={1} vectorEffect="non-scaling-stroke" pointerEvents="none" className={styles.pulse} />
                </>
              )}
            </g>
          </svg>
          {tip}
          {sel && (
            <button
              type="button"
              onClick={() => select(null)}
              className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-indigo-950/80 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur hover:bg-indigo-900"
            >
              <Minimize2 className="h-3.5 w-3.5" />
              ทั้งประเทศ
            </button>
          )}
        </div>
        <div className="mx-auto mt-3 flex max-w-100 flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-indigo-200" aria-label="คำอธิบายสี">
          <span className="font-semibold text-indigo-100">จำนวนอคาเดมี</span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-4 rounded-sm bg-[#2e2e62] ring-1 ring-white/20" />0
          </span>
          {BINS.map((b) => (
            <span key={b.label} className="flex items-center gap-1">
              <span className="h-2.5 w-4 rounded-sm" style={{ background: b.color }} />
              {b.label}
            </span>
          ))}
        </div>
      </div>

      {/* รายละเอียดจังหวัด / อันดับ */}
      <div ref={panelRef} className="lg:col-start-1 lg:row-start-2">
        <div className="rounded-3xl bg-white/6 p-5 ring-1 ring-white/10 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">{sel ? "จังหวัดที่เลือก" : "จังหวัดที่มีอคาเดมีมากที่สุด"}</p>
            <label className="text-xs text-indigo-200">
              <span className="sr-only">เลือกจังหวัด</span>
              <select
                value={selected ?? ""}
                onChange={(e) => select(e.target.value ? Number(e.target.value) : null)}
                className="rounded-lg border border-white/15 bg-indigo-950 px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                <option value="">ทั้งประเทศ</option>
                {[...map.provinces]
                  .filter((p) => countOf(p.th) > 0 || p.code === selected)
                  .sort((a, b) => a.th.localeCompare(b.th, "th"))
                  .map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.th} ({countOf(p.th)})
                    </option>
                  ))}
              </select>
            </label>
          </div>

          {sel ? (
            <div key={`${sel.code}-${filter}`} className={styles.panelIn}>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p className="flex items-center gap-1.5 text-2xl font-extrabold text-white">
                    <MapPin className="h-5 w-5 text-amber-300" />
                    {sel.th}
                  </p>
                  <p className="text-xs text-indigo-300">{sel.en}</p>
                </div>
                <p className="text-right">
                  <span className="block text-3xl font-extrabold text-amber-300">{selList.length}</span>
                  <span className="text-xs text-indigo-200">อคาเดมี</span>
                </p>
              </div>
              {selList.length === 0 ? (
                <p className="mt-4 text-sm text-indigo-200">ไม่มีอคาเดมี{filter !== "ALL" && `ระดับ ${LEVEL_META[filter].label}`}ในจังหวัดนี้</p>
              ) : (
                <ul className="mt-4 max-h-72 space-y-1.5 overflow-y-auto pr-1">
                  {selList.map((a) => (
                    <li key={a.id}>
                      <Link href={`/academies/${a.id}`} className="group flex items-center gap-3 rounded-2xl bg-white/5 p-2 pr-3 ring-1 ring-white/5 transition-colors hover:bg-white/10">
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
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-300 hover:text-amber-200"
              >
                ดูในทำเนียบ
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div key={filter} className={styles.panelIn}>
              <ol className="mt-3 space-y-1">
                {ranking.map((p, i) => (
                  <li key={p.code}>
                    <button type="button" onClick={() => select(p.code)} className="group flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left hover:bg-white/5">
                      <span className="w-4 text-right text-xs font-bold tabular-nums text-indigo-400">{i + 1}</span>
                      <span className="w-28 flex-none truncate text-sm text-white group-hover:text-amber-200">{p.th}</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                        <span className="block h-full rounded-full" style={{ width: `${(p.n / ranking[0].n) * 100}%`, background: fillFor(p.n) }} />
                      </span>
                      <span className="w-7 text-right text-sm font-bold tabular-nums text-white">{p.n}</span>
                    </button>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-indigo-300">
                {visible.length.toLocaleString()} อคาเดมี ใน {provinceCount} จังหวัด
                {unknown > 0 && ` · ไม่ระบุจังหวัด ${unknown} แห่ง`} · คลิกจังหวัดบนแผนที่เพื่อดูรายชื่อ
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
