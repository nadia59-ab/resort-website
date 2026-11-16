"use client";

import { useSyncExternalStore } from "react";
import type { AdminLanguage } from "./admin-language";

const STORAGE_KEY = "resort-admin-language";
const CHANGE_EVENT = "resort-admin-language-change";

function isAdminLanguage(value: string | null): value is AdminLanguage {
  return value === "ar" || value === "en" || value === "ru" || value === "de";
}

export function useAdminLanguage() {
  const language = useSyncExternalStore<AdminLanguage>(
    (onChange) => {
      window.addEventListener("storage", onChange);
      window.addEventListener(CHANGE_EVENT, onChange);
      return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener(CHANGE_EVENT, onChange);
      };
    },
    () => {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return isAdminLanguage(saved) ? saved : "ar";
    },
    () => "ar",
  );

  function setLanguage(nextLanguage: AdminLanguage) {
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return [language, setLanguage] as const;
}
