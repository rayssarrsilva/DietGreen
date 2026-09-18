"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export function Header({
  isSignedIn,
  onSignOut,
}: {
  isSignedIn: boolean;
  onSignOut: () => Promise<void>;
}) {
  const { t } = useTranslation();

  return (
    <header className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-lg text-primary">
          DietGreen
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/onboarding" className="text-ink-muted hover:text-ink transition-colors">
            {t.nav.buildPlan}
          </Link>
          {isSignedIn ? (
            <>
              <Link href="/dashboard" className="text-ink-muted hover:text-ink transition-colors">
                {t.nav.myPlans}
              </Link>
              <form action={onSignOut}>
                <Button variant="ghost" type="submit">
                  {t.nav.signOut}
                </Button>
              </form>
            </>
          ) : (
            <Link href="/login">
              <Button variant="secondary">{t.nav.signIn}</Button>
            </Link>
          )}
          <span className="w-px h-5 bg-border" />
          <ThemeToggle />
          <LanguageToggle />
        </nav>
      </div>
    </header>
  );
}
