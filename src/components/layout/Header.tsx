"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { GreenChat } from "@/components/green/GreenChat";
import { LifeBar } from "@/components/green/LifeBar";
import { useWallet } from "@/components/green/useWallet";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export function Header({
  isSignedIn,
  onSignOut,
}: {
  isSignedIn: boolean;
  onSignOut: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const { wallet } = useWallet(isSignedIn);

  return (
    <header className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 min-h-16 py-2 flex flex-wrap items-center justify-between gap-y-2">
        <Link href="/" className="font-display text-lg text-primary">
          DietGreen
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/onboarding" className="text-ink-muted hover:text-ink transition-colors">
            {t.nav.buildPlan}
          </Link>
          <Link href="/credits" className="text-ink-muted hover:text-ink transition-colors">
            {t.nav.credits}
          </Link>
          {isSignedIn ? (
            <>
              <Link href="/dashboard" className="text-ink-muted hover:text-ink transition-colors">
                {t.nav.myPlans}
              </Link>
              <Link href="/profile" className="text-ink-muted hover:text-ink transition-colors">
                {t.nav.profile}
              </Link>
              <LifeBar wallet={wallet} />
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
      <GreenChat isSignedIn={isSignedIn} />
    </header>
  );
}
