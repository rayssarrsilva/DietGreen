"use client";

import Link from "next/link";
import { clsx } from "clsx";
import type { WalletSnapshot } from "@/domain/entities/wallet";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { fmt } from "@/lib/i18n/translations";

const SEGMENTS = 10;

function segmentColor(fraction: number): string {
  if (fraction > 0.5) return "bg-primary";
  if (fraction > 0.2) return "bg-accent";
  return "bg-berry";
}

function Bar({ fraction, segments, label }: { fraction: number; segments: number; label: string }) {
  const clamped = Math.max(0, Math.min(1, fraction));
  const filled = clamped === 0 ? 0 : Math.max(1, Math.round(clamped * segments));
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      className="flex gap-[3px] p-[3px] rounded-[4px] border-2 border-ink/70 bg-surface-2"
    >
      {Array.from({ length: segments }, (_, i) => (
        <span
          key={i}
          className={clsx(
            "h-3 flex-1 min-w-[6px] rounded-[1px] transition-colors duration-300",
            i < filled ? segmentColor(clamped) : "bg-bg/60"
          )}
        />
      ))}
    </div>
  );
}

export function walletFractions(wallet: WalletSnapshot) {
  if (wallet.mode === "trial" || (wallet.mode === "empty" && !wallet.trial.closed)) {
    return { main: wallet.trial.limit ? wallet.trial.remaining / wallet.trial.limit : 0, segments: wallet.trial.limit };
  }
  const capacity = wallet.chat.capacityBrl;
  return { main: capacity > 0 ? wallet.chat.balanceBrl / capacity : 0, segments: SEGMENTS };
}

export function LifeBar({ wallet, variant = "compact" }: { wallet: WalletSnapshot | null; variant?: "compact" | "full" }) {
  const { t, locale } = useTranslation();
  if (!wallet) return null;
  const { main, segments } = walletFractions(wallet);
  const isTrial = wallet.mode === "trial" || (wallet.mode === "empty" && !wallet.trial.closed);
  const caption = isTrial
    ? fmt(t.lifeBar.freeLeft, { n: wallet.trial.remaining, limit: wallet.trial.limit })
    : `${fmt(t.lifeBar.approx, { n: wallet.chat.approxMessages })} ${t.lifeBar.messages}`;

  if (variant === "compact") {
    return (
      <Link
        href="/profile"
        title={`${t.lifeBar.label}: ${caption}`}
        className="hidden sm:flex items-center gap-2 group"
      >
        <span className="w-24">
          <Bar fraction={main} segments={segments} label={t.lifeBar.label} />
        </span>
        <span className="text-xs tabular-nums text-ink-muted group-hover:text-ink">
          {isTrial ? `${wallet.trial.remaining}/${wallet.trial.limit}` : wallet.chat.approxMessages}
        </span>
      </Link>
    );
  }

  const attachmentFraction = wallet.attachments.capacityBrl > 0 ? wallet.attachments.balanceBrl / wallet.attachments.capacityBrl : 0;
  const date = (iso: string) => new Date(iso).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US");

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-sm font-medium">{isTrial ? t.lifeBar.trial : t.lifeBar.credits}</span>
          <span className="text-sm text-ink-muted tabular-nums">{caption}</span>
        </div>
        <Bar fraction={main} segments={segments} label={t.lifeBar.label} />
      </div>
      {!isTrial && (
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-sm font-medium">{t.lifeBar.attachments}</span>
            <span className="text-sm text-ink-muted tabular-nums">
              {fmt(t.lifeBar.approx, { n: wallet.attachments.approxAttachments })} {t.lifeBar.attachments}
            </span>
          </div>
          <Bar fraction={attachmentFraction} segments={5} label={t.lifeBar.attachments} />
        </div>
      )}
      <p className="text-sm text-ink-muted">
        {wallet.premiumActive && wallet.premiumUntil
          ? fmt(t.lifeBar.premiumUntil, { date: date(wallet.premiumUntil) })
          : t.lifeBar.premiumInactive}
        {" · "}
        <Link href="/credits" className="text-primary underline underline-offset-2">
          {t.lifeBar.refill}
        </Link>
      </p>
    </div>
  );
}
