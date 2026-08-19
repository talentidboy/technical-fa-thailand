"use client";

import { useEffect, useState } from "react";

export function useColorMap(storageKey: string) {
  const [colors, setColors] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") setColors(parsed);
      }
    } catch {
      // ignore malformed/unavailable localStorage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(updater: (prev: Record<string, string>) => Record<string, string>) {
    setColors((prev) => {
      const next = updater(prev);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore unavailable localStorage (e.g. private mode)
      }
      return next;
    });
  }

  function setColor(name: string, color: string) {
    update((prev) => ({ ...prev, [name]: color }));
  }

  function renameKey(oldName: string, newName: string) {
    update((prev) => {
      if (!(oldName in prev) || oldName === newName) return prev;
      const next = { ...prev };
      next[newName] = next[oldName];
      delete next[oldName];
      return next;
    });
  }

  function removeColor(name: string) {
    update((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  return { colors, setColor, renameKey, removeColor };
}
