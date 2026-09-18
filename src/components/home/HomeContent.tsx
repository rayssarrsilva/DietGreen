"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export function HomeContent() {
  const { t } = useTranslation();

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-6 py-24 sm:py-32 animate-fade-in-up">
        <p className="text-sm font-medium text-primary mb-4">{t.home.eyebrow}</p>
        <h1 className="font-display text-4xl sm:text-5xl leading-tight text-ink mb-6">
          {t.home.title}
        </h1>
        <p className="text-lg text-ink-muted leading-relaxed mb-10 max-w-xl">
          {t.home.subtitle}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/onboarding">
            <Button>{t.home.ctaPrimary}</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary">{t.home.ctaSecondary}</Button>
          </Link>
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-3xl px-6 py-16 grid gap-10 sm:grid-cols-3">
          <div className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
            <h2 className="font-display text-xl mb-2">{t.home.step1Title}</h2>
            <p className="text-sm text-ink-muted">{t.home.step1Body}</p>
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: "160ms" }}>
            <h2 className="font-display text-xl mb-2">{t.home.step2Title}</h2>
            <p className="text-sm text-ink-muted">{t.home.step2Body}</p>
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: "240ms" }}>
            <h2 className="font-display text-xl mb-2">{t.home.step3Title}</h2>
            <p className="text-sm text-ink-muted">{t.home.step3Body}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
