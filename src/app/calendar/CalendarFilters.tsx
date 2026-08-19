"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Pencil, X, Check, Settings2 } from "lucide-react";
import { useManagedList } from "./useManagedList";
import { useColorMap } from "./useColorMap";
import { renameEventCategory, renameEventTeamScope, updateCategoryColor } from "./actions";

const DEFAULT_TEAM_SCOPES = ["Men", "Both", "Women", "Coach Education"];
const FALLBACK_CATEGORY_COLOR = "#94a3b8";

type CategoryRow = { category: string; color: string };

function textColorFor(hex: string) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "#1e293b";
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1e293b" : "#ffffff";
}

export default function CalendarFilters({
  quarter,
  activeScopes,
  activeCategories,
  categoryRows,
}: {
  quarter: number;
  activeScopes: string[];
  activeCategories: string[];
  categoryRows: CategoryRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const teamScopeList = useManagedList("calendar-team-scope-options", DEFAULT_TEAM_SCOPES);
  const categoryList = useManagedList("calendar-category-options", []);
  const localCategoryColors = useColorMap("calendar-category-colors");

  const [manageOpen, setManageOpen] = useState(false);
  const [newScope, setNewScope] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#4A86E8");
  const [editing, setEditing] = useState<{ kind: "scope" | "category"; value: string; draft: string } | null>(
    null,
  );

  const dbCategoryNames = categoryRows.map((c) => c.category);
  const localOnlyCategories = categoryList.items.filter((c) => !dbCategoryNames.includes(c));
  const allCategories = [
    ...categoryRows,
    ...localOnlyCategories.map((c) => ({
      category: c,
      color: localCategoryColors.colors[c] ?? FALLBACK_CATEGORY_COLOR,
    })),
  ];

  function buildUrl(scopes: string[], categories: string[]) {
    const p = new URLSearchParams();
    p.set("q", String(quarter));
    if (scopes.length) p.set("scope", scopes.join(","));
    if (categories.length) p.set("category", categories.join(","));
    return `/calendar?${p.toString()}`;
  }

  function toggleScope(value: string) {
    const next = activeScopes.includes(value)
      ? activeScopes.filter((s) => s !== value)
      : [...activeScopes, value];
    startTransition(() => router.push(buildUrl(next, activeCategories)));
  }

  function toggleCategory(value: string) {
    const next = activeCategories.includes(value)
      ? activeCategories.filter((c) => c !== value)
      : [...activeCategories, value];
    startTransition(() => router.push(buildUrl(activeScopes, next)));
  }

  function clearAll() {
    startTransition(() => router.push(buildUrl([], [])));
  }

  function addScope() {
    teamScopeList.add(newScope);
    setNewScope("");
  }

  function addCategory() {
    const name = newCategory.trim();
    if (!name) return;
    categoryList.add(name);
    localCategoryColors.setColor(name, newCategoryColor);
    setNewCategory("");
  }

  function changeCategoryColor(category: string, color: string, isLocalOnly: boolean) {
    if (isLocalOnly) {
      localCategoryColors.setColor(category, color);
      return;
    }
    startTransition(async () => {
      await updateCategoryColor(category, color);
      router.refresh();
    });
  }

  function startEdit(kind: "scope" | "category", value: string) {
    setEditing({ kind, value, draft: value });
  }

  function confirmEdit() {
    if (!editing) return;
    const { kind, value, draft } = editing;
    const to = draft.trim();
    if (!to || to === value) {
      setEditing(null);
      return;
    }
    if (kind === "scope") {
      teamScopeList.rename(value, to);
      startTransition(async () => {
        await renameEventTeamScope(value, to);
        router.refresh();
      });
    } else {
      if (localOnlyCategories.includes(value)) {
        categoryList.rename(value, to);
        localCategoryColors.renameKey(value, to);
      } else {
        startTransition(async () => {
          await renameEventCategory(value, to);
          router.refresh();
        });
      }
    }
    setEditing(null);
  }

  const hasFilter = activeScopes.length > 0 || activeCategories.length > 0;

  return (
    <div
      className={`space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-opacity ${
        pending ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-700">กรองตามกลุ่มทีมและหมวดหมู่</p>
        <div className="flex items-center gap-3">
          {hasFilter && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-medium text-indigo-600 hover:underline"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
          <button
            type="button"
            onClick={() => setManageOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Settings2 className="h-3.5 w-3.5" />
            จัดการรายการ
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {teamScopeList.items.map((value) => {
          const active = activeScopes.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggleScope(value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {value}
            </button>
          );
        })}
      </div>

      {allCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
          {allCategories.map((c) => {
            const active = activeCategories.includes(c.category);
            return (
              <button
                key={c.category}
                type="button"
                onClick={() => toggleCategory(c.category)}
                style={
                  active
                    ? { backgroundColor: c.color, color: textColorFor(c.color), borderColor: c.color }
                    : undefined
                }
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active ? "" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {c.category}
              </button>
            );
          })}
        </div>
      )}

      {manageOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => setManageOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                จัดการกลุ่มทีมและหมวดหมู่
              </h3>
              <button
                type="button"
                onClick={() => setManageOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">กลุ่มทีม</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {teamScopeList.items.map((value) => {
                    const isEditing = editing?.kind === "scope" && editing.value === value;
                    if (isEditing) {
                      return (
                        <div
                          key={value}
                          className="flex items-center gap-1 rounded-full border border-indigo-300 bg-indigo-50 px-2 py-1"
                        >
                          <input
                            autoFocus
                            value={editing.draft}
                            onChange={(e) => setEditing({ ...editing, draft: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && confirmEdit()}
                            className="w-24 bg-transparent text-xs font-medium text-slate-700 focus:outline-none"
                          />
                          <button type="button" onClick={confirmEdit} className="text-emerald-600 hover:text-emerald-700">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={value}
                        className="flex items-center gap-1 rounded-full border border-slate-200 py-1 pl-3 pr-1 text-xs font-medium text-slate-600"
                      >
                        {value}
                        <button
                          type="button"
                          onClick={() => startEdit("scope", value)}
                          title="แก้ไขชื่อ (จะอัปเดตกิจกรรมที่ใช้ชื่อนี้ทั้งหมด)"
                          className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => teamScopeList.remove(value)}
                          title="ลบออกจากรายการเลือกด่วน (ไม่กระทบกิจกรรมที่มีอยู่)"
                          className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <input
                    value={newScope}
                    onChange={(e) => setNewScope(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addScope()}
                    placeholder="ชื่อกลุ่มทีมใหม่"
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  <button
                    type="button"
                    onClick={addScope}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4" />
                    เพิ่ม
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="mb-2 text-sm font-medium text-slate-700">หมวดหมู่</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {allCategories.map((c) => {
                    const isLocalOnly = localOnlyCategories.includes(c.category);
                    const isEditing = editing?.kind === "category" && editing.value === c.category;
                    if (isEditing) {
                      return (
                        <div
                          key={c.category}
                          className="flex items-center gap-1 rounded-full border border-indigo-300 bg-indigo-50 px-2 py-1"
                        >
                          <input
                            autoFocus
                            value={editing.draft}
                            onChange={(e) => setEditing({ ...editing, draft: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && confirmEdit()}
                            className="w-32 bg-transparent text-xs font-medium text-slate-700 focus:outline-none"
                          />
                          <button type="button" onClick={confirmEdit} className="text-emerald-600 hover:text-emerald-700">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={c.category}
                        className="flex items-center gap-1.5 rounded-full border border-slate-200 py-1 pl-1.5 pr-1 text-xs font-medium"
                        style={{ backgroundColor: c.color, color: textColorFor(c.color) }}
                      >
                        <input
                          type="color"
                          value={c.color}
                          onChange={(e) => changeCategoryColor(c.category, e.target.value, isLocalOnly)}
                          title="เปลี่ยนสีของหมวดหมู่นี้ (จะอัปเดตกิจกรรมที่ใช้หมวดหมู่นี้ทั้งหมด)"
                          className="h-5 w-5 flex-none cursor-pointer rounded-full border-0 bg-transparent p-0"
                        />
                        {c.category}
                        <button
                          type="button"
                          onClick={() => startEdit("category", c.category)}
                          title="แก้ไขชื่อ (จะอัปเดตกิจกรรมที่ใช้หมวดหมู่นี้ทั้งหมด)"
                          className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-black/10"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        {isLocalOnly && (
                          <button
                            type="button"
                            onClick={() => categoryList.remove(c.category)}
                            title="ลบออกจากรายการเลือกด่วน"
                            className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-black/10"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    title="สีของหมวดหมู่ใหม่"
                    className="h-9 w-9 flex-none cursor-pointer rounded-lg border border-slate-200 p-1"
                  />
                  <input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCategory()}
                    placeholder="ชื่อหมวดหมู่ใหม่"
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  <button
                    type="button"
                    onClick={addCategory}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4" />
                    เพิ่ม
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setManageOpen(false)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700"
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
