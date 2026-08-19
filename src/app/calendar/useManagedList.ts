"use client";

import { useEffect, useState } from "react";

export function useManagedList(storageKey: string, seed: string[]) {
  const [items, setItems] = useState<string[]>(seed);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      }
    } catch {
      // ignore malformed/unavailable localStorage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(updater: (prev: string[]) => string[]) {
    setItems((prev) => {
      const next = updater(prev);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore unavailable localStorage (e.g. private mode)
      }
      return next;
    });
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
