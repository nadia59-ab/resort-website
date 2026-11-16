"use client";

import { useEffect, useSyncExternalStore } from "react";
import { isLanguage, type Language } from "@/src/lib/i18n";

const LANGUAGE_STORAGE_KEY = "resort-language";
const LANGUAGE_CHANGE_EVENT = "resort-language-change";
const PAGE_TITLES: Record<Language, string> = {
  en: "Red Sea Resort | A quieter shore",
  ar: "منتجع البحر الأحمر | شاطئ أكثر هدوءًا",
  ru: "Курорт на Красном море | Тихий берег",
  de: "Resort am Roten Meer | Ein ruhigeres Ufer",
};

export function useLanguage() {
  const language = useSyncExternalStore<Language>(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange);
      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange);
      };
    },
    () => {
      const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      return isLanguage(savedLanguage) ? savedLanguage : "en";
    },
    () => "en",
  );

  function setLanguage(nextLanguage: Language) {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
  }

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.title = PAGE_TITLES[language];
  }, [language]);

  return [language, setLanguage] as const;
}
