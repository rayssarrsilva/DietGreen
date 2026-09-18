"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t.theme.light : t.theme.dark}
      title={isDark ? t.theme.light : t.theme.dark}
      className="w-9 h-9 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface transition-colors"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
