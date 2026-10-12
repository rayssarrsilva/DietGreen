"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { fmt } from "@/lib/i18n/translations";
import { quoteCredits, quotePricePoint, type CreditQuote, type PremiumQuote, type PricingParams } from "@/domain/services/pricing";
import { RECOMMENDED_PRESET_ID, type CreditPreset } from "@/domain/services/creditPresets";
import { requestWalletRefresh, useWallet } from "@/components/green/useWallet";

interface PricingResponse {
  params: PricingParams;
  premium: PremiumQuote;
  usdBrl: number;
  model: string;
  presets: CreditPreset[];
  customLimits: { maxMessages: number; messageStep: number; maxAttachments: number; attachmentStep: number };
  trialLimit: number;
  refundWindowDays: number;
  paymentsEnabled: boolean;
}

interface Checkout {
  paymentId: string;
  amountBrl: number;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string | null;
  expiresAt: string | null;
}

type Selection = { id: string; messages: number; attachments: number };

function describe(q: CreditQuote, msgs: string, atts: string): string {
  return [q.messages > 0 && fmt(msgs, { n: q.messages }), q.attachments > 0 && fmt(atts, { n: q.attachments })].filter(Boolean).join(" + ");
}

export function CreditsPage({ isSignedIn }: { isSignedIn: boolean }) {
  const { t, locale } = useTranslation();
  const { wallet } = useWallet(isSignedIn);
  const [pricing, setPricing] = useState<PricingResponse | null>(null);
  const [selection, setSelection] = useState<Selection>({ id: "custom", messages: 50, attachments: 2 });
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [status, setStatus] = useState<"idle" | "waiting" | "approved" | "failed">("idle");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const money = useCallback(
    (v: number) => v.toLocaleString(locale === "pt" ? "pt-BR" : "en-US", { style: "currency", currency: "BRL" }),
    [locale]
  );

  useEffect(() => {
    void fetch("/api/billing/pricing").then(async (r) => r.ok && setPricing((await r.json()) as PricingResponse));
  }, []);

  useEffect(() => {
    if (!checkout || status !== "waiting") return;
    const timer = setInterval(async () => {
      const r = await fetch(`/api/billing/payments/${checkout.paymentId}`, { cache: "no-store" });
      if (!r.ok) return;
      const p = (await r.json()) as { status: string };
      if (p.status === "APPROVED") {
        setStatus("approved");
        requestWalletRefresh();
      } else if (["REJECTED", "CANCELLED", "EXPIRED"].includes(p.status)) setStatus("failed");
    }, 4000);
    return () => clearInterval(timer);
  }, [checkout, status]);

  const quote = useMemo(() => {
    if (!pricing) return null;
    const preset = pricing.presets.find((x) => x.id === selection.id);
    return preset ? quotePricePoint(preset, pricing.params) : quoteCredits(selection.messages, selection.attachments, pricing.params);
  }, [pricing, selection]);

  async function pay(body: object) {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await r.json().catch(() => ({}))) as Record<string, unknown>;
      if (!r.ok) {
        const code = String(data.error ?? "");
        setError(code === "premium_required" ? t.credits.errorPremium : code === "consent_required" ? t.credits.errorConsent : code === "payments_unavailable" ? t.credits.paymentsOff : t.credits.errorGeneric);
        return;
      }
      setCheckout(data as unknown as Checkout);
      setStatus("waiting");
      setCopied(false);
    } finally {
      setBusy(false);
    }
  }

  if (!pricing) return <main className="flex-1 mx-auto max-w-4xl w-full px-6 py-12 text-ink-muted">{t.common.loading}</main>;

  const p = pricing.params;
  const premiumActive = Boolean(wallet?.premiumActive);
  const groups: { key: CreditPreset["group"]; label: string }[] = [
    { key: "messages", label: t.credits.groupMessages },
    { key: "attachments", label: t.credits.groupAttachments },
    { key: "combo", label: t.credits.groupCombo },
  ];
  const date = (iso: string) => new Date(iso).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US");
  const canBuyCredits = isSignedIn && premiumActive && pricing.paymentsEnabled;


  return (
    <main className="flex-1 mx-auto max-w-4xl w-full px-6 py-12 space-y-12">
      <section className="max-w-2xl">
        <h1 className="font-display text-3xl mb-3">{t.credits.title}</h1>
        <p className="text-ink-muted leading-relaxed">{t.credits.intro}</p>
        {!pricing.paymentsEnabled && <p className="mt-3 text-sm text-berry">{t.credits.paymentsOff}</p>}
        {!isSignedIn && (
          <p className="mt-3 text-sm">
            <Link href="/login" className="text-primary underline underline-offset-2">{t.credits.signInToBuy}</Link>
          </p>
        )}
      </section>

      {checkout && (
        <section className="rounded-xl border-2 border-primary p-6 grid gap-6 sm:grid-cols-[auto,1fr] items-start" aria-live="polite">
          {checkout.qrCodeBase64 && status === "waiting" && (
            <Image src={`data:image/png;base64,${checkout.qrCodeBase64}`} alt="QR code Pix" width={200} height={200} unoptimized className="rounded-md bg-white p-2" />
          )}
          <div className="space-y-3">
            <h2 className="font-display text-xl">{t.credits.pixTitle} · {money(checkout.amountBrl)}</h2>
            {status === "waiting" && (
              <>
                <p className="text-sm text-ink-muted">{t.credits.pixScan}</p>
                <div className="flex gap-2">
                  <input readOnly className="input font-mono !text-xs" value={checkout.qrCode} onFocus={(e) => e.target.select()} />
                  <Button variant="secondary" onClick={async () => { await navigator.clipboard.writeText(checkout.qrCode); setCopied(true); }}>
                    {copied ? t.credits.pixCopied : t.credits.pixCopy}
                  </Button>
                </div>
                {checkout.expiresAt && (
                  <p className="text-xs text-ink-muted">{fmt(t.credits.pixExpires, { time: new Date(checkout.expiresAt).toLocaleTimeString(locale === "pt" ? "pt-BR" : "en-US", { hour: "2-digit", minute: "2-digit" }) })}</p>
                )}
                <p className="text-sm">{t.credits.pixWaiting}</p>
              </>
            )}
            {status === "approved" && <p className="text-primary font-medium">{t.credits.pixApproved}</p>}
            {status === "failed" && <p className="text-berry">{t.credits.pixFailed}</p>}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-border bg-surface p-6 space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl">{t.credits.premiumTitle}</h2>
          <span className={clsx("text-sm", premiumActive ? "text-primary font-medium" : "text-ink-muted")}>
            {premiumActive && wallet?.premiumUntil ? fmt(t.credits.premiumActive, { date: date(wallet.premiumUntil) }) : t.credits.premiumInactive}
          </span>
        </div>
        <p className="text-sm text-ink-muted max-w-2xl">
          {fmt(t.credits.premiumBody, {
            days: pricing.premium.days,
            minimum: pricing.premium.minimumApplied ? t.credits.premiumMinimum : "",
          })}
        </p>
        <p className="text-sm text-ink-muted max-w-2xl">{t.credits.premiumNote} {t.credits.trialClosedNote}</p>
        <Button disabled={!isSignedIn || !pricing.paymentsEnabled || busy} onClick={() => void pay({ kind: "premium" })}>
          {premiumActive
            ? fmt(t.credits.premiumRenew, { days: pricing.premium.days, price: money(pricing.premium.totalBrl) })
            : fmt(t.credits.premiumBuy, { price: money(pricing.premium.totalBrl) })}
        </Button>
      </section>

      <section className="space-y-8">
        {!premiumActive && <p className="text-sm text-berry">{t.credits.needsPremium}</p>}
        {groups.map((g) => (
          <div key={g.key}>
            <h3 className="font-display text-lg mb-3">{g.label}</h3>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-5">
              {pricing.presets.filter((x) => x.group === g.key).map((preset) => {
                const q = quotePricePoint(preset, p);
                if (!q) return null;
                const active = selection.id === preset.id;
                const recommended = preset.id === RECOMMENDED_PRESET_ID;
                const unit = preset.group === "messages" ? fmt(t.credits.perMessage, { price: money(q.totalBrl / q.messages) }) : preset.group === "attachments" ? fmt(t.credits.perAttachment, { price: money(q.totalBrl / q.attachments) }) : null;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelection({ id: preset.id, messages: q.messages, attachments: q.attachments })}
                    className={clsx(
                      "relative rounded-lg border p-3 pt-4 text-left transition-colors",
                      active ? "border-primary bg-primary/10" : "border-border hover:bg-surface",
                      recommended && "border-2 border-primary"
                    )}
                  >
                    {recommended && (
                      <span className="absolute -top-2.5 left-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-white">
                        {t.credits.recommended}
                      </span>
                    )}
                    <span className="block text-xl font-semibold tabular-nums text-primary">{money(q.totalBrl)}</span>
                    <span className="block mt-1 text-sm font-medium">{describe(q, t.credits.msgs, t.credits.atts)}</span>
                    {unit && <span className="block text-[11px] text-ink-muted tabular-nums">{unit}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div>
          <h3 className="font-display text-lg mb-1">{t.credits.groupCustom}</h3>
          <p className="text-sm text-ink-muted mb-4">{t.credits.customHint}</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="flex justify-between text-sm mb-1"><span>{t.credits.messagesLabel}</span><span className="tabular-nums">{selection.id === "custom" ? selection.messages : "—"}</span></span>
              <input type="range" className="w-full accent-[var(--color-primary)]" min={0} max={pricing.customLimits.maxMessages} step={pricing.customLimits.messageStep}
                value={selection.id === "custom" ? selection.messages : 0}
                onChange={(e) => setSelection((s) => ({ id: "custom", messages: Number(e.target.value), attachments: s.id === "custom" ? s.attachments : 0 }))} />
            </label>
            <label className="block">
              <span className="flex justify-between text-sm mb-1"><span>{t.credits.attachmentsLabel}</span><span className="tabular-nums">{selection.id === "custom" ? selection.attachments : "—"}</span></span>
              <input type="range" className="w-full accent-[var(--color-primary)]" min={0} max={pricing.customLimits.maxAttachments} step={pricing.customLimits.attachmentStep}
                value={selection.id === "custom" ? selection.attachments : 0}
                onChange={(e) => setSelection((s) => ({ id: "custom", attachments: Number(e.target.value), messages: s.id === "custom" ? s.messages : 0 }))} />
            </label>
          </div>
        </div>

        {quote && (
          <div className="rounded-xl border border-border p-6 max-w-lg space-y-2">
            <h3 className="font-display text-lg">{t.credits.breakdownTitle}</h3>
            <p className="text-sm text-ink-muted">{describe(quote, t.credits.msgs, t.credits.atts) || "—"}</p>
            <dl className="text-sm space-y-1 tabular-nums">
              <div className="flex justify-between"><dt>{t.credits.breakdownAi}</dt><dd>{money(quote.aiCostBrl)}</dd></div>
              <div className="flex justify-between"><dt>{t.credits.breakdownFee}</dt><dd>{money(quote.feeBrl)}</dd></div>
              <div className="flex justify-between"><dt>{t.credits.breakdownMargin}</dt><dd>{money(quote.marginBrl)}</dd></div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold text-base"><dt>{t.credits.breakdownTotal}</dt><dd>{money(quote.totalBrl)}</dd></div>
            </dl>
            {quote.minimumApplied && <p className="text-xs text-ink-muted">{t.credits.breakdownMinimum}</p>}
            {quote.totalBrl > 0 && <p className="text-xs text-ink-muted">{selection.id === "custom" ? t.credits.breakdownRounding : t.credits.breakdownPricePoint}</p>}
            <Button className="w-full mt-2" disabled={!canBuyCredits || busy || quote.totalBrl <= 0}
              onClick={() => void pay(selection.id === "custom" ? { kind: "credits", messages: quote.messages, attachments: quote.attachments } : { kind: "credits", presetId: selection.id })}>
              {fmt(t.credits.buy, { price: money(quote.totalBrl) })}
            </Button>
            {error && <p role="alert" className="text-sm text-berry">{error}</p>}
          </div>
        )}
      </section>

      <section className="max-w-2xl space-y-3 text-sm text-ink-muted leading-relaxed">
        <h2 className="font-display text-xl text-ink">{t.credits.howTitle}</h2>
        <p>{t.credits.howAi} ({money(p.avgMessageBrl)} / {t.lifeBar.messages.replace(/s$/, "")}, {money(p.avgAttachmentBrl)} / {t.lifeBar.attachments.replace(/s$/, "")})</p>
        <p>{fmt(t.credits.howFee, { fee: (p.feeRate * 100).toFixed(2).replace(".", locale === "pt" ? "," : ".") })}</p>
        <p>{fmt(t.credits.howMargin, { margin: Math.round(p.marginRate * 100) })}</p>
        <p>{t.credits.howRounding}</p>
        <p>{t.credits.howBalance}</p>
        <p>{t.credits.howAttachments}</p>
        <p>{fmt(t.credits.howRates, { rate: pricing.usdBrl.toFixed(2), model: pricing.model })}</p>
        <p>{fmt(t.credits.refundNote, { days: pricing.refundWindowDays })}</p>
        <p>{t.credits.legalNote}</p>
      </section>
    </main>
  );
}

