"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import type { GreenStreamEvent, WalletSnapshot } from "@/domain/entities/wallet";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { fmt } from "@/lib/i18n/translations";
import { GreenAvatar } from "./GreenAvatar";
import { Markdown } from "./Markdown";
import { ChatConsentCard, HealthConsentCard } from "./ConsentCards";
import { LabReview } from "./LabReview";
import { publishWallet, useWallet } from "./useWallet";
import { saveSettings, type ChatItem, type GreenSettingsView, type LabDraft, type Paywall } from "./types";

const ACCEPTED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_MB = 5;
const STYLES: GreenSettingsView["greenStyle"][] = ["direct", "technical", "detailed", "custom"];

export function GreenChat({ isSignedIn }: { isSignedIn: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <section
          aria-label={t.green.title}
          className="fixed z-50 bottom-24 right-4 w-[min(420px,calc(100vw-2rem))] h-[min(660px,calc(100dvh-8rem))] flex flex-col rounded-xl border border-border bg-bg shadow-[0_18px_50px_-12px_rgba(22,35,28,0.35)] animate-fade-in-up"
        >
          {isSignedIn ? (
            <ChatPanel onClose={() => setOpen(false)} />
          ) : (
            <div className="flex-1 flex flex-col">
              <PanelHeader onClose={() => setOpen(false)} />
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
                <GreenAvatar size={96} />
                <p className="text-sm text-ink-muted">{t.green.signInPrompt}</p>
                <Link href="/login">
                  <Button>{t.green.signInCta}</Button>
                </Link>
              </div>
            </div>
          )}
        </section>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? t.green.closeChat : t.green.openChat}
        className="fixed z-50 bottom-5 right-4 flex items-center gap-2 rounded-full border-2 border-primary bg-bg pl-1 pr-4 py-1 shadow-lg hover:bg-surface transition-colors"
      >
        <GreenAvatar size={44} />
        <span className="text-sm font-medium text-primary">{open ? t.green.closeChat : t.green.openChat}</span>
      </button>
    </>
  );
}

function PanelHeader({ onClose, children }: { onClose: () => void; children?: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <header className="flex items-center gap-3 border-b border-border px-4 py-3">
      <GreenAvatar size={40} />
      <div className="flex-1 min-w-0">
        <p className="font-display text-lg leading-tight">{t.green.title}</p>
        <p className="text-xs text-ink-muted">{t.green.subtitle}</p>
      </div>
      {children}
      <button type="button" onClick={onClose} aria-label={t.green.closeChat} className="text-ink-muted hover:text-ink text-xl leading-none px-1">
        ×
      </button>
    </header>
  );
}

function ChatPanel({ onClose }: { onClose: () => void }) {
  const { t, locale } = useTranslation();
  const { wallet } = useWallet(true);
  const [settings, setSettings] = useState<GreenSettingsView | null>(null);
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState<Paywall | null>(null);
  const [premiumPrice, setPremiumPrice] = useState<{ price: number; days: number } | null>(null);
  const [labDraft, setLabDraft] = useState<LabDraft | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [askHealth, setAskHealth] = useState(false);
  const [customDraft, setCustomDraft] = useState("");
  const [editingCustom, setEditingCustom] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const money = useCallback(
    (value: number) => value.toLocaleString(locale === "pt" ? "pt-BR" : "en-US", { style: "currency", currency: "BRL" }),
    [locale]
  );

  useEffect(() => {
    void (async () => {
      const [s, c] = await Promise.all([fetch("/api/green/settings"), fetch("/api/green/conversation")]);
      if (s.ok) {
        const data = (await s.json()) as GreenSettingsView;
        setSettings(data);
        setCustomDraft(data.greenCustomStyle ?? "");
      }
      if (c.ok) setMessages(((await c.json()) as { messages: ChatItem[] }).messages);
    })();
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, labDraft, paywall, error, extracting]);

  useEffect(() => {
    if (!paywall || premiumPrice) return;
    void fetch("/api/billing/pricing")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { premium: { totalBrl: number; days: number } } | null) => {
        if (data) setPremiumPrice({ price: data.premium.totalBrl, days: data.premium.days });
      });
  }, [paywall, premiumPrice]);

  function describeError(code: string): string {
    const map: Record<string, string> = {
      busy: t.green.busy,
      ai_unavailable: t.green.aiUnavailable,
      file_too_large: fmt(t.green.fileTooLarge, { mb: MAX_MB }),
      unsupported_type: t.green.unsupportedType,
    };
    return map[code] ?? t.green.errorGeneric;
  }

  function handleGate(status: number, body: Record<string, unknown>): boolean {
    const code = String(body.error ?? "");
    if (body.wallet) publishWallet(body.wallet as WalletSnapshot);
    if (code === "consent_required") {
      setSettings((s) => (s ? { ...s, adultConfirmed: false, chatTermsAccepted: false } : s));
      return true;
    }
    if (code === "health_consent_required") {
      setAskHealth(true);
      return true;
    }
    if (status === 402) {
      setPaywall({ code, retryAt: body.retryAt as string | undefined, canRefill: body.canRefill as boolean | undefined });
      return true;
    }
    setError(describeError(code));
    return true;
  }

  async function send(text: string) {
    const message = text.trim();
    if (!message || streaming) return;
    setError(null);
    setPaywall(null);
    setStreaming(true);
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    try {
      const response = await fetch("/api/green/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        setMessages((prev) => prev.slice(0, -1));
        setInput(message);
        handleGate(response.status, body);
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as GreenStreamEvent;
          if (event.type === "text") {
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              copy[copy.length - 1] = { ...last, content: last.content + event.delta };
              return copy;
            });
          } else if (event.type === "done") {
            publishWallet(event.wallet);
          } else if (event.type === "error") {
            setError(event.message);
            setMessages((prev) => (prev[prev.length - 1]?.content ? prev : prev.slice(0, -1)));
          }
        }
      }
    } catch {
      setError(t.green.errorGeneric);
    } finally {
      setStreaming(false);
    }
  }

  async function acceptChatConsent() {
    const updated = await saveSettings({ adultConfirmed: true, chatTermsAccepted: true });
    if (updated) setSettings(updated);
  }

  function chooseFile() {
    setError(null);
    setPaywall(null);
    if (!settings?.healthProcessingConsent) {
      setAskHealth(true);
      return;
    }
    if (wallet && wallet.attachments.approxAttachments < 1 && wallet.attachments.balanceBrl <= 0) {
      setPaywall({ code: wallet.premiumActive ? "no_attachment_credits" : "premium_required", canRefill: wallet.premiumActive });
      return;
    }
    fileRef.current?.click();
  }

  async function uploadFile(file: File) {
    if (!ACCEPTED.includes(file.type)) return setError(t.green.unsupportedType);
    if (file.size > MAX_MB * 1024 * 1024) return setError(fmt(t.green.fileTooLarge, { mb: MAX_MB }));
    setExtracting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/green/labs/extract", { method: "POST", body: form });
      const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok) {
        handleGate(response.status, body);
        return;
      }
      const data = body as unknown as { report: LabDraft; isLabReport: boolean; wallet: WalletSnapshot };
      publishWallet(data.wallet);
      if (!data.isLabReport || data.report.values.length === 0) {
        setError(t.green.notLabReport);
        return;
      }
      setLabDraft(data.report);
    } catch {
      setError(t.green.errorGeneric);
    } finally {
      setExtracting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function confirmLabs(draft: LabDraft, save: boolean) {
    if (save) {
      if (!settings?.healthStorageConsent) {
        const updated = await saveSettings({ healthStorageConsent: true });
        if (updated) setSettings(updated);
      }
      await fetch("/api/green/labs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectedAt: draft.collectedAt,
          labName: draft.labName,
          values: draft.values.map(({ marker, value, unit, labRangeLow, labRangeHigh, labRangeText }) => ({
            marker,
            value,
            unit,
            labRangeLow,
            labRangeHigh,
            labRangeText,
          })),
        }),
      });
    }
    const lines = draft.values.map((v) => {
      const range = v.labRangeText ?? [v.labRangeLow, v.labRangeHigh].map((x) => (x === null ? "?" : x)).join("–");
      return `- ${v.marker}: ${v.value} ${v.unit} (faixa do laudo: ${range})`;
    });
    const header = draft.collectedAt ? `\nColeta: ${draft.collectedAt}` : "";
    setLabDraft(null);
    await send(`${t.green.analyzePrompt}${header}\n${lines.join("\n")}`);
  }

  async function changeStyle(style: GreenSettingsView["greenStyle"]) {
    if (style === "custom") {
      setEditingCustom(true);
      return;
    }
    setEditingCustom(false);
    const updated = await saveSettings({ greenStyle: style });
    if (updated) setSettings(updated);
  }

  async function saveCustom() {
    const updated = await saveSettings({ greenStyle: "custom", greenCustomStyle: customDraft });
    if (updated) {
      setSettings(updated);
      setEditingCustom(false);
    }
  }

  async function clearHistory() {
    if (!window.confirm(t.green.clearConfirm)) return;
    const response = await fetch("/api/green/conversation", { method: "DELETE" });
    if (response.ok) setMessages([]);
  }

  const styleNames: Record<GreenSettingsView["greenStyle"], string> = {
    direct: t.green.styleDirect,
    technical: t.green.styleTechnical,
    detailed: t.green.styleDetailed,
    custom: t.green.styleCustom,
  };

  const needsConsent = settings && (!settings.adultConfirmed || !settings.chatTermsAccepted);
  const inTrial = wallet ? wallet.mode !== "credits" && !wallet.trial.closed : false;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <PanelHeader onClose={onClose}>
        {settings && !needsConsent && (
          <select
            aria-label={t.green.styleLabel}
            className="input !w-auto !py-1 !text-xs"
            value={editingCustom ? "custom" : settings.greenStyle}
            onChange={(e) => void changeStyle(e.target.value as GreenSettingsView["greenStyle"])}
          >
            {STYLES.map((s) => (
              <option key={s} value={s}>
                {styleNames[s]}
              </option>
            ))}
          </select>
        )}
      </PanelHeader>

      {editingCustom && (
        <div className="border-b border-border px-4 py-3 space-y-2 bg-surface">
          <p className="text-xs text-ink-muted">{t.green.styleCustomHint}</p>
          <textarea
            className="input !text-xs"
            rows={3}
            maxLength={500}
            value={customDraft}
            placeholder={t.green.styleCustomPlaceholder}
            onChange={(e) => setCustomDraft(e.target.value)}
          />
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-ink-muted tabular-nums">{customDraft.length}/500</span>
            <div className="flex gap-2">
              <Button variant="secondary" className="!px-3 !py-1.5" onClick={() => setEditingCustom(false)}>
                {t.green.cancel}
              </Button>
              <Button className="!px-3 !py-1.5" disabled={!customDraft.trim()} onClick={() => void saveCustom()}>
                {t.green.saveStyle}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div ref={listRef} className="relative flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {needsConsent ? (
          <ChatConsentCard onAccept={acceptChatConsent} />
        ) : (
          <>
            {messages.length === 0 && (
              <div className="text-sm text-ink-muted space-y-3">
                <p className="rounded-lg bg-surface px-3 py-2 text-ink">{t.green.intro}</p>
              </div>
            )}
            {inTrial && wallet && (
              <p className="text-center text-[11px] leading-snug text-ink-muted/80 px-6 select-none">
                {fmt(t.green.trialBackground, { limit: wallet.trial.limit })}
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={clsx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={clsx(
                    "max-w-[88%] rounded-lg px-3 py-2 text-sm",
                    m.role === "user" ? "bg-primary text-white whitespace-pre-wrap" : "bg-surface text-ink"
                  )}
                >
                  {m.role === "assistant" ? (
                    m.content ? <Markdown>{m.content}</Markdown> : <span className="text-ink-muted">{t.green.thinking}</span>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            {extracting && <p className="text-sm text-ink-muted">{t.green.extracting}</p>}
            {askHealth && settings && (
              <HealthConsentCard
                initialStorage={settings.healthStorageConsent}
                onCancel={() => setAskHealth(false)}
                onAccept={async (storage) => {
                  const updated = await saveSettings({ healthProcessingConsent: true, healthStorageConsent: storage });
                  if (updated) setSettings(updated);
                  setAskHealth(false);
                  fileRef.current?.click();
                }}
              />
            )}
            {labDraft && settings && (
              <LabReview
                draft={labDraft}
                defaultSave={settings.healthStorageConsent}
                onConfirm={confirmLabs}
                onDiscard={() => setLabDraft(null)}
              />
            )}
            {paywall && (
              <PaywallCard paywall={paywall} premium={premiumPrice} money={money} locale={locale} />
            )}
            {error && (
              <p role="alert" className="rounded-md border border-berry/40 bg-berry/10 px-3 py-2 text-xs text-berry">
                {error}
              </p>
            )}
          </>
        )}
      </div>

      {!needsConsent && (
        <div className="border-t border-border px-3 pt-2 pb-3">
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const text = input;
              setInput("");
              void send(text);
            }}
          >
            <button
              type="button"
              onClick={chooseFile}
              disabled={streaming || extracting}
              aria-label={t.green.attach}
              title={t.green.attach}
              className="h-10 w-10 shrink-0 rounded-md border border-border text-ink-muted hover:text-ink hover:bg-surface disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="mx-auto h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M21 11.5 12.5 20a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4L15.5 7.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <input ref={fileRef} type="file" accept={ACCEPTED.join(",")} className="hidden" onChange={(e) => e.target.files?.[0] && void uploadFile(e.target.files[0])} />
            <textarea
              className="input flex-1 resize-none !py-2 max-h-32"
              rows={1}
              maxLength={2000}
              value={input}
              placeholder={t.green.placeholder}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  const text = input;
                  setInput("");
                  void send(text);
                }
              }}
            />
            <Button type="submit" className="h-10 !px-4" disabled={streaming || !input.trim()}>
              {t.green.send}
            </Button>
          </form>
          <div className="mt-2 flex items-start justify-between gap-3">
            <p className="text-[10px] leading-snug text-ink-muted">{t.green.disclaimer}</p>
            {messages.length > 0 && (
              <button type="button" onClick={() => void clearHistory()} className="shrink-0 text-[10px] text-ink-muted underline hover:text-berry">
                {t.green.clearChat}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PaywallCard({
  paywall,
  premium,
  money,
  locale,
}: {
  paywall: Paywall;
  premium: { price: number; days: number } | null;
  money: (value: number) => string;
  locale: string;
}) {
  const { t } = useTranslation();
  if (paywall.code === "trial_wait" && paywall.retryAt) {
    const when = new Date(paywall.retryAt).toLocaleString(locale === "pt" ? "pt-BR" : "en-US", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    return (
      <div className="rounded-lg border border-border bg-surface p-3 text-sm space-y-2">
        <p>{fmt(t.green.trialWait, { time: when })}</p>
        <Link href="/credits" className="text-primary underline underline-offset-2 text-xs">
          {t.green.paywallPremiumCta}
        </Link>
      </div>
    );
  }
  const premiumBody = premium ? fmt(t.green.paywallPremiumBody, { price: money(premium.price), days: premium.days }) : "";
  let title = t.green.paywallPremiumTitle;
  let body = premiumBody;
  let cta = t.green.paywallPremiumCta;
  if (paywall.code === "trial_paused") body = `${t.green.trialPaused} ${premiumBody}`;
  if (paywall.code === "no_credits" || paywall.code === "no_attachment_credits") {
    title = t.green.paywallCreditsTitle;
    body = paywall.canRefill ? t.green.paywallCreditsBody : t.green.paywallRenewBody;
    cta = paywall.canRefill ? t.green.paywallCreditsCta : t.green.paywallPremiumCta;
  }
  if (paywall.code === "premium_required" && paywall.canRefill === false && premium) body = `${t.green.attachmentNeedsCredits} ${premiumBody}`;
  return (
    <div className="rounded-lg border-2 border-primary/40 bg-surface p-4 text-sm space-y-2">
      <p className="font-display text-base">{title}</p>
      <p className="text-ink-muted">{body}</p>
      <Link href="/credits">
        <Button className="w-full mt-1">{cta}</Button>
      </Link>
    </div>
  );
}
