"use client";

import { useRef, useState, useTransition, Fragment } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Trash2, X, ExternalLink, Plus } from "lucide-react";
import { createEvent, updateEvent, deleteEvent } from "./actions";
import { Field, SelectField } from "@/components/FormField";
import ColorField from "./ColorField";
import { useManagedList } from "./useManagedList";

const MONTH_LABELS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

const WEEKDAY_LABELS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

const DEFAULT_TEAM_SCOPES = ["Men", "Both", "Women", "Coach Education"];
const TEAM_SCOPE_STYLES: Record<string, string> = {
  Men: "bg-blue-600",
  Both: "bg-amber-500",
  Women: "bg-pink-600",
  "Coach Education": "bg-slate-600",
};

const HEADER_ROW_HEIGHT = 42;
const TRACK_ROW_HEIGHT = 34;
const ROW_GAP = 4;

type EventRow = {
  id: number;
  title: string;
  category: string;
  color: string;
  teamScope: string;
  startDate: Date;
  endDate: Date;
  sourceUrl: string | null;
};

type CategoryRow = { category: string; color: string };

function dateKey(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function textColorFor(hex: string) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "#1e293b";
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1e293b" : "#ffffff";
}

function formatDate(date: Date) {
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

function toDateInputValue(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function packTracks(items: { id: number; startDay: number; endDay: number }[]) {
  const sorted = [...items].sort((a, b) => a.startDay - b.startDay || a.endDay - b.endDay);
  const trackEnd: number[] = [];
  const trackOf = new Map<number, number>();
  for (const item of sorted) {
    let track = trackEnd.findIndex((end) => end < item.startDay);
    if (track === -1) {
      track = trackEnd.length;
      trackEnd.push(item.endDay);
    } else {
      trackEnd[track] = item.endDay;
    }
    trackOf.set(item.id, track);
  }
  return { trackOf, trackCount: trackEnd.length };
}

export default function CalendarGrid({
  events,
  categoryRows,
  year,
  selectedMonth,
  todayKey,
}: {
  events: EventRow[];
  categoryRows: CategoryRow[];
  year: number;
  selectedMonth: number;
  todayKey: number;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addDefaultDate, setAddDefaultDate] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const addFormRef = useRef<HTMLFormElement>(null);
  const teamScopeList = useManagedList("calendar-team-scope-options", DEFAULT_TEAM_SCOPES);
  const teamScopeOptions = teamScopeList.items.map((v) => ({ value: v, label: v }));

  const [hover, setHover] = useState<{
    id: number;
    top: number;
    bottom: number;
    left: number;
  } | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleBarEnter(barId: number, el: HTMLElement) {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      const rect = el.getBoundingClientRect();
      setHover({
        id: barId,
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left + rect.width / 2,
      });
    }, 200);
  }

  function handleBarLeave() {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHover(null);
  }

  const daysInMonth = new Date(Date.UTC(year, selectedMonth, 0)).getUTCDate();
  const monthStartKey = Date.UTC(year, selectedMonth - 1, 1);
  const monthEndKey = Date.UTC(year, selectedMonth - 1, daysInMonth);
  const isCurrentMonth = monthStartKey <= todayKey && todayKey <= monthEndKey;
  const todayDay = isCurrentMonth
    ? Math.round((todayKey - monthStartKey) / 86_400_000) + 1
    : -1;

  const presentScopes = Array.from(new Set(events.map((e) => e.teamScope)));
  const scopeOrder = [
    ...DEFAULT_TEAM_SCOPES.filter((s) => presentScopes.includes(s)),
    ...presentScopes.filter((s) => !DEFAULT_TEAM_SCOPES.includes(s)).sort(),
  ];

  const lanes = scopeOrder.map((scope) => {
    const scopedItems = events
      .filter((e) => e.teamScope === scope)
      .map((e) => {
        const clampedStart = Math.max(dateKey(e.startDate), monthStartKey);
        const clampedEnd = Math.min(dateKey(e.endDate), monthEndKey);
        return {
          id: e.id,
          startDay: Math.round((clampedStart - monthStartKey) / 86_400_000) + 1,
          endDay: Math.round((clampedEnd - monthStartKey) / 86_400_000) + 1,
        };
      });
    const { trackOf, trackCount } = packTracks(scopedItems);
    const bars = scopedItems.map((item) => ({
      ...item,
      track: trackOf.get(item.id)!,
      event: events.find((e) => e.id === item.id)!,
    }));
    return { scope, bars, trackCount };
  }).filter((lane) => lane.trackCount > 0);

  let rowCursor = 2;
  const lanesWithRows = lanes.map((lane) => {
    const rowStart = rowCursor;
    rowCursor += lane.trackCount;
    return { ...lane, rowStart };
  });
  const totalTrackRows = rowCursor - 2;

  const editingEvent = events.find((e) => e.id === editingId) ?? null;
  const seedColors = Array.from(new Set(categoryRows.map((c) => c.color)));

  function closeEdit() {
    setEditingId(null);
    setConfirmDelete(false);
  }

  function openAdd(dateStr?: string) {
    setAddDefaultDate(dateStr ?? null);
    setAddOpen(true);
  }

  function closeAdd() {
    setAddOpen(false);
    setAddDefaultDate(null);
  }

  function handleSave() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    startTransition(async () => {
      await updateEvent(fd);
      closeEdit();
    });
  }

  function handleDelete() {
    if (!editingEvent) return;
    const fd = new FormData();
    fd.set("id", String(editingEvent.id));
    startTransition(async () => {
      await deleteEvent(fd);
      closeEdit();
    });
  }

  function handleCreate() {
    if (!addFormRef.current) return;
    const fd = new FormData(addFormRef.current);
    startTransition(async () => {
      await createEvent(fd);
      closeAdd();
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <CalendarDays className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-900">
            ปฏิทิน {MONTH_LABELS[selectedMonth - 1]} {year}
          </h2>
          <p className="text-xs text-slate-400">
            คลิกกิจกรรมเพื่อแก้ไข/ลบ · คลิกวันที่เพื่อเพิ่มกิจกรรม · แช่เมาส์ค้างเพื่อดูรายละเอียด
          </p>
        </div>
      </div>

      <div className="overflow-x-auto p-4">
        {lanesWithRows.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">
            ไม่มีกิจกรรมในเดือนนี้
          </p>
        ) : (
          <div className="relative">
            <div
              className="grid gap-y-1"
              style={{
                gridTemplateColumns: `120px repeat(${daysInMonth}, minmax(24px, 1fr))`,
                gridTemplateRows: `${HEADER_ROW_HEIGHT}px repeat(${totalTrackRows}, ${TRACK_ROW_HEIGHT}px)`,
              }}
            >
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d = i + 1;
                const wd = new Date(Date.UTC(year, selectedMonth - 1, d)).getUTCDay();
                const isWeekend = wd === 0 || wd === 6;
                return (
                  <div
                    key={`bg-${d}`}
                    style={{ gridColumn: i + 2, gridRow: `2 / span ${totalTrackRows}` }}
                    className={isWeekend ? "bg-slate-50" : undefined}
                  />
                );
              })}

              <div
                style={{ gridColumn: 1, gridRow: 1 }}
                className="sticky left-0 z-20 bg-white"
              />
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d = i + 1;
                const wd = new Date(Date.UTC(year, selectedMonth - 1, d)).getUTCDay();
                const isWeekend = wd === 0 || wd === 6;
                const isToday = d === todayDay;
                const dateStr = `${year}-${String(selectedMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                return (
                  <button
                    key={`hdr-${d}`}
                    type="button"
                    title={`เพิ่มกิจกรรมวันที่ ${d}`}
                    onClick={() => openAdd(dateStr)}
                    style={{ gridColumn: i + 2, gridRow: 1 }}
                    className={`flex flex-col items-center justify-center gap-0.5 rounded text-[11px] transition-colors ${
                      isToday
                        ? "bg-indigo-600 text-white hover:bg-indigo-500"
                        : isWeekend
                          ? "text-slate-500 hover:bg-slate-200"
                          : "text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    <span>{WEEKDAY_LABELS[wd]}</span>
                    <span className="text-sm font-semibold">{d}</span>
                  </button>
                );
              })}

              {lanesWithRows.map((lane) => (
                <Fragment key={lane.scope}>
                  <div
                    style={{
                      gridColumn: 1,
                      gridRow: `${lane.rowStart} / span ${lane.trackCount}`,
                    }}
                    className={`sticky left-0 z-20 flex items-center rounded px-3 text-sm font-semibold text-white ${
                      TEAM_SCOPE_STYLES[lane.scope] ?? "bg-slate-500"
                    }`}
                  >
                    {lane.scope}
                  </div>
                  {lane.bars.map((bar) => (
                    <button
                      key={bar.id}
                      type="button"
                      onClick={() => setEditingId(bar.id)}
                      onMouseEnter={(e) => handleBarEnter(bar.id, e.currentTarget)}
                      onMouseLeave={handleBarLeave}
                      onFocus={(e) => handleBarEnter(bar.id, e.currentTarget)}
                      onBlur={handleBarLeave}
                      style={{
                        gridColumn: `${bar.startDay + 1} / ${bar.endDay + 2}`,
                        gridRow: lane.rowStart + bar.track,
                        backgroundColor: bar.event.color,
                        color: textColorFor(bar.event.color),
                      }}
                      className="relative z-0 flex items-center truncate rounded px-2 text-left text-[11px] font-medium ring-1 ring-black/10 transition-all hover:z-30 hover:ring-2 hover:ring-indigo-400 focus:outline-none focus-visible:z-30 focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      {bar.event.title}
                    </button>
                  ))}
                </Fragment>
              ))}
            </div>

            {lanesWithRows.slice(1).map((lane) => (
              <div
                key={`divider-${lane.scope}`}
                className="pointer-events-none absolute inset-x-0 border-t border-slate-200"
                style={{
                  top:
                    HEADER_ROW_HEIGHT +
                    (lane.rowStart - 2) * (TRACK_ROW_HEIGHT + ROW_GAP),
                }}
              />
            ))}
          </div>
        )}
      </div>

      {hover &&
        (() => {
          const hoverEvent = events.find((e) => e.id === hover.id);
          if (!hoverEvent) return null;
          const sameDay = hoverEvent.startDate.getTime() === hoverEvent.endDate.getTime();
          const showBelow = hover.top < 140;
          return createPortal(
            <div
              className="pointer-events-none fixed z-50 w-64 rounded-lg border border-slate-200 bg-white p-3 text-left text-xs text-slate-600 shadow-xl"
              style={{
                left: hover.left,
                top: showBelow ? hover.bottom + 8 : hover.top - 8,
                transform: `translate(-50%, ${showBelow ? "0" : "-100%"})`,
              }}
            >
              <p className="font-semibold text-slate-900">{hoverEvent.title}</p>
              <p className="mt-1 text-slate-500">
                {hoverEvent.category} · {hoverEvent.teamScope}
              </p>
              <p className="mt-0.5 text-slate-500">
                {formatDate(hoverEvent.startDate)}
                {!sameDay && ` - ${formatDate(hoverEvent.endDate)}`}
              </p>
              {hoverEvent.sourceUrl && (
                <a
                  href={hoverEvent.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto mt-1.5 inline-flex items-center gap-1 text-indigo-600 hover:underline"
                >
                  ลิงก์อ้างอิง <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>,
            document.body,
          );
        })()}

      {editingEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={closeEdit}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">แก้ไขกิจกรรม</h3>
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form ref={formRef} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={editingEvent.id} />
              <div className="sm:col-span-2">
                <Field label="ชื่อกิจกรรม" name="title" required defaultValue={editingEvent.title} />
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">
                  หมวดหมู่ <span className="text-red-500">*</span>
                </span>
                <input
                  name="category"
                  required
                  defaultValue={editingEvent.category}
                  list="edit-category-suggestions"
                  className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <datalist id="edit-category-suggestions">
                  {categoryRows.map((c) => (
                    <option key={c.category} value={c.category} />
                  ))}
                </datalist>
              </label>
              <ColorField name="color" defaultValue={editingEvent.color} seedColors={seedColors} />
              <SelectField
                label="กลุ่มทีม"
                name="teamScope"
                required
                defaultValue={editingEvent.teamScope}
                options={teamScopeOptions}
              />
              <Field
                label="วันเริ่ม"
                name="startDate"
                type="date"
                required
                defaultValue={toDateInputValue(editingEvent.startDate)}
              />
              <Field
                label="วันจบ"
                name="endDate"
                type="date"
                defaultValue={toDateInputValue(editingEvent.endDate)}
              />
              <div className="sm:col-span-2">
                <Field
                  label="ลิงก์อ้างอิง (ถ้ามี)"
                  name="sourceUrl"
                  placeholder="https://..."
                  defaultValue={editingEvent.sourceUrl ?? ""}
                />
              </div>
            </form>
            <div className="mt-5 flex items-center justify-between">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-red-600">ยืนยันลบกิจกรรมนี้?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={pending}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    {pending ? "กำลังลบ..." : "ลบเลย"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100"
                  >
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  ลบกิจกรรม
                </button>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={pending}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                  {pending ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={closeAdd}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">เพิ่มกิจกรรมใหม่</h3>
              <button
                type="button"
                onClick={closeAdd}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form ref={addFormRef} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="ชื่อกิจกรรม" name="title" required placeholder="เช่น U17M Camp" />
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700">
                  หมวดหมู่ <span className="text-red-500">*</span>
                </span>
                <input
                  name="category"
                  required
                  placeholder="เช่น FIFA DAY"
                  list="add-category-suggestions"
                  className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <datalist id="add-category-suggestions">
                  {categoryRows.map((c) => (
                    <option key={c.category} value={c.category} />
                  ))}
                </datalist>
              </label>
              <ColorField name="color" defaultValue="#4A86E8" seedColors={seedColors} />
              <SelectField label="กลุ่มทีม" name="teamScope" required options={teamScopeOptions} />
              <Field
                label="วันเริ่ม"
                name="startDate"
                type="date"
                required
                defaultValue={addDefaultDate ?? undefined}
              />
              <Field
                label="วันจบ (เว้นว่าง = วันเดียว)"
                name="endDate"
                type="date"
                defaultValue={addDefaultDate ?? undefined}
              />
              <div className="sm:col-span-2">
                <Field label="ลิงก์อ้างอิง (ถ้ามี)" name="sourceUrl" placeholder="https://..." />
              </div>
            </form>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeAdd}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {pending ? "กำลังเพิ่ม..." : "เพิ่มกิจกรรม"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
