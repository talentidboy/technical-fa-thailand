"use client";

import { useStoredValue } from "./useStoredValue";

function isNonEmptyStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string");
}

export function useManagedList(storageKey: string, seed: string[]) {
  const [items, updateItems] = useStoredValue(storageKey, seed, isNonEmptyStringArray);

  function update(updater: (prev: string[]) => string[]) {
    updateItems(updater);
  }

  function add(value: string) {
    const v = value.trim();
    if (!v) return;
    update((prev) => (prev.some((x) => x.toLowerCase() === v.toLowerCase()) ? prev : [...prev, v]));
  }

  function remove(value: string) {
    update((prev) => prev.filter((x) => x !== value));
  }

  function rename(oldValue: string, newValue: string) {
    const v = newValue.trim();
    if (!v || v === oldValue) return;
    update((prev) => prev.map((x) => (x === oldValue ? v : x)));
  }

  return { items, add, remove, rename };
}
