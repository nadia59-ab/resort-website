"use client";

import type { Language } from "@/src/lib/i18n";

export default function LanguageDropdown({
  language,
  onChange,
}: {
  language: Language;
  onChange: (language: Language) => void;
}) {
  return (
    <label className="language-switch">
      <span className="visually-hidden">Language / اللغة / Язык / Sprache</span>
      <select
        className="language-dropdown"
        value={language}
        onChange={(event) => onChange(event.target.value as Language)}
        aria-label="Language / اللغة / Язык / Sprache"
      >
        <option value="en">EN</option>
        <option value="ar">العربية</option>
        <option value="ru">RU</option>
        <option value="de">DE</option>
      </select>
    </label>
  );
}
