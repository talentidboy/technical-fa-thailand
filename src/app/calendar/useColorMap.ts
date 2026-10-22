"use client";

import { useStoredValue } from "./useStoredValue";

const EMPTY_COLORS: Record<string, string> = {};

function isColorMap(value: unknown): value is Record<string, string> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.values(value).every((color) => typeof color === "string")
  );
}

export function useColorMap(storageKey: string) {
  const [colors, updateColors] = useStoredValue(storageKey, EMPTY_COLORS, isColorMap);

  function update(updater: (prev: Record<string, string>) => Record<string, string>) {
    updateColors(updater);
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
