"use client";

import { useTranslation } from "@/lib/i18n/LanguageContext";

export function LanguageToggle() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex items-center rounded-full border border-border p-0.5 text-xs">
      <button
        type="button"
        onClick={() => setLocale("pt")}
        aria-pressed={locale === "pt"}
        className={
          locale === "pt"
            ? "px-2 py-1 rounded-full bg-primary text-white"
            : "px-2 py-1 rounded-full text-ink-muted hover:text-ink"
        }
      >
        PT
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={
          locale === "en"
            ? "px-2 py-1 rounded-full bg-primary text-white"
            : "px-2 py-1 rounded-full text-ink-muted hover:text-ink"
        }
      >
        EN
      </button>
    </div>
  );
}
