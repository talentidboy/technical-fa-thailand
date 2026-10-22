"use client";

import { useCallback, useSyncExternalStore } from "react";

const cache = new Map<string, unknown>();

function eventName(storageKey: string) {
  return `calendar-storage:${storageKey}`;
}

function readStoredValue<T>(storageKey: string, fallback: T, isValid: (value: unknown) => value is T): T {
  if (cache.has(storageKey)) return cache.get(storageKey) as T;

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isValid(parsed)) {
        cache.set(storageKey, parsed);
        return parsed;
      }
    }
  } catch {
    // Ignore malformed or unavailable localStorage.
  }

  cache.set(storageKey, fallback);
  return fallback;
}

export function useStoredValue<T>(
  storageKey: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const onStorage = (event: StorageEvent) => {
        if (event.key !== storageKey) return;
        cache.delete(storageKey);
        onStoreChange();
      };

      window.addEventListener("storage", onStorage);
      window.addEventListener(eventName(storageKey), onStoreChange);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(eventName(storageKey), onStoreChange);
      };
    },
    [storageKey],
  );

  const getSnapshot = useCallback(
    () => readStoredValue(storageKey, fallback, isValid),
    [fallback, isValid, storageKey],
  );
  const getServerSnapshot = useCallback(() => fallback, [fallback]);
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const update = useCallback(
    (updater: (previous: T) => T) => {
      const next = updater(readStoredValue(storageKey, fallback, isValid));
      cache.set(storageKey, next);

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Keep the in-memory value when localStorage is unavailable.
      }

      window.dispatchEvent(new Event(eventName(storageKey)));
    },
    [fallback, isValid, storageKey],
  );

  return [value, update] as const;
}
