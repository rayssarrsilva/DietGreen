"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LifeBar } from "@/components/green/LifeBar";
import { requestWalletRefresh, useWallet } from "@/components/green/useWallet";
import { saveSettings, type GreenSettingsView } from "@/components/green/types";
import type { LabReport } from "@/domain/entities/green";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { fmt } from "@/lib/i18n/translations";

interface PaymentView {
  id: string;
  kind: "PREMIUM" | "CREDITS";
  status: string;
  amountBrl: number;
  messagesQty: number;
  attachmentsQty: number;
  premiumDays: number;
  refundedAmountBrl: number;
  createdAt: string;
  refundableUntil: string | null;
}

const STYLES: GreenSettingsView["greenStyle"][] = ["direct", "technical", "detailed", "custom"];

export function ProfileContent() {
  const { t, locale } = useTranslation();
  const { wallet } = useWallet(true);
  const router = useRouter();
  const [settings, setSettings] = useState<GreenSettingsView | null>(null);
  const [custom, setCustom] = useState("");
  const [saved, setSaved] = useState(false);
  const [labs, setLabs] = useState<LabReport[]>([]);
  const [payments, setPayments] = useState<PaymentView[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const loc = locale === "pt" ? "pt-BR" : "en-US";
  const money = (v: number) => v.toLocaleString(loc, { style: "currency", currency: "BRL" });
  const date = (iso: string) => new Date(iso).toLocaleDateString(loc);

  const load = useCallback(async () => {
    const [s, l, p] = await Promise.all([fetch("/api/green/settings"), fetch("/api/green/labs"), fetch("/api/billing/payments")]);
    if (s.ok) {
      const data = (await s.json()) as GreenSettingsView;
      setSettings(data);
      setCustom(data.greenCustomStyle ?? "");
    }
    if (l.ok) setLabs(((await l.json()) as { reports: LabReport[] }).reports);
    if (p.ok) setPayments(((await p.json()) as { payments: PaymentView[] }).payments);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function update(patch: Partial<GreenSettingsView>) {
    const updated = await saveSettings(patch);
    if (updated) {
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      if (patch.healthProcessingConsent === false || patch.healthStorageConsent === false) setLabs([]);
    }
  }

  async function refund(id: string) {
    if (!window.confirm(t.profile.refundConfirm)) return;
    const r = await fetch("/api/billing/refund", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentId: id }) });
    const data = (await r.json().catch(() => ({}))) as { refundBrl?: number; error?: string };
    setNotice(r.ok && data.refundBrl ? fmt(t.profile.refundDone, { amount: money(data.refundBrl) }) : t.green.errorGeneric);
    requestWalletRefresh();
    void load();
  }

  async function deleteLab(id?: string) {
    if (!window.confirm(t.profile.labsDeleteConfirm)) return;
    await fetch(id ? `/api/green/labs/${id}` : "/api/green/labs", { method: "DELETE" });
    void load();
  }

  async function deleteAccount() {
    const typed = window.prompt(t.profile.deleteConfirm);
    if (typed !== "DELETE") return;
    const r = await fetch("/api/me", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm: "DELETE" }) });
    if (r.ok) {
      router.push("/");
      router.refresh();
    }
  }

  const styleNames: Record<GreenSettingsView["greenStyle"], string> = {
    direct: t.green.styleDirect,
    technical: t.green.styleTechnical,
    detailed: t.green.styleDetailed,
    custom: t.green.styleCustom,
  };
  const statusLabel = (s: string) => (t.profile as Record<string, string>)[`status${s}`] ?? s;

  return (
    <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-12 space-y-12">
      <h1 className="font-display text-3xl">{t.profile.title}</h1>
      {notice && <p role="status" className="rounded-md bg-surface px-4 py-2 text-sm">{notice}</p>}

      <section className="space-y-4">
        <h2 className="font-display text-xl">{t.profile.balanceTitle}</h2>
        <LifeBar wallet={wallet} variant="full" />
      </section>

      {settings && (
        <section className="space-y-4">
          <h2 className="font-display text-xl">{t.profile.styleTitle} {saved && <span className="text-sm text-primary font-body">· {t.profile.styleSaved}</span>}</h2>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <Button key={s} variant={settings.greenStyle === s ? "primary" : "secondary"} onClick={() => (s === "custom" ? setSettings({ ...settings, greenStyle: "custom" }) : void update({ greenStyle: s }))}>
                {styleNames[s]}
              </Button>
            ))}
          </div>
          {settings.greenStyle === "custom" && (
            <div className="space-y-2">
              <p className="text-sm text-ink-muted">{t.green.styleCustomHint}</p>
              <textarea className="input" rows={4} maxLength={500} value={custom} placeholder={t.green.styleCustomPlaceholder} onChange={(e) => setCustom(e.target.value)} />
              <div className="flex justify-between items-center">
                <span className="text-xs text-ink-muted tabular-nums">{custom.length}/500</span>
                <Button disabled={!custom.trim()} onClick={() => void update({ greenStyle: "custom", greenCustomStyle: custom })}>{t.green.saveStyle}</Button>
              </div>
            </div>
          )}
        </section>
      )}

      {settings && (
        <section className="space-y-3">
          <h2 className="font-display text-xl">{t.profile.consentsTitle}</h2>
          <label className="flex gap-2 items-start text-sm">
            <input type="checkbox" className="mt-1" checked={settings.healthProcessingConsent} onChange={(e) => void update({ healthProcessingConsent: e.target.checked })} />
            <span>{t.profile.consentProcessing}</span>
          </label>
          <label className="flex gap-2 items-start text-sm">
            <input type="checkbox" className="mt-1" checked={settings.healthStorageConsent} onChange={(e) => void update({ healthStorageConsent: e.target.checked })} />
            <span>{t.profile.consentStorage}</span>
          </label>
          <p className="text-xs text-ink-muted">{t.profile.consentRevokeNote}</p>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl">{t.profile.labsTitle}</h2>
          {labs.length > 0 && <button className="text-sm text-berry underline" onClick={() => void deleteLab()}>{t.profile.labsDeleteAll}</button>}
        </div>
        {labs.length === 0 ? (
          <p className="text-sm text-ink-muted">{settings && !settings.healthStorageConsent ? t.profile.labsStorageOff : t.profile.labsEmpty}</p>
        ) : (
          labs.map((r) => (
            <details key={r.id} className="rounded-lg border border-border p-4">
              <summary className="cursor-pointer flex justify-between gap-4 text-sm">
                <span>{r.collectedAt ? date(r.collectedAt) : r.savedAt ? date(r.savedAt) : ""} {r.labName ? `· ${r.labName}` : ""} · {r.values.length}</span>
                <button className="text-berry underline" onClick={(e) => { e.preventDefault(); void deleteLab(r.id); }}>{t.profile.labsDelete}</button>
              </summary>
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-ink-muted"><th className="py-1">{t.green.colMarker}</th><th>{t.green.colValue}</th><th>{t.green.colRange}</th><th>{t.green.colStatus}</th></tr></thead>
                  <tbody>
                    {r.values.map((v, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="py-1 pr-2">{v.marker}</td>
                        <td className="pr-2 tabular-nums">{v.value} {v.unit}</td>
                        <td className="pr-2">{v.labRangeText ?? [v.labRangeLow, v.labRangeHigh].filter((x) => x !== null).join("–")}</td>
                        <td className={v.critical ? "text-berry font-medium" : ""}>{({ low: t.green.statusLow, normal: t.green.statusNormal, high: t.green.statusHigh, unknown: t.green.statusUnknown })[v.labStatus]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl">{t.profile.paymentsTitle}</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-ink-muted">{t.profile.paymentsEmpty}</p>
        ) : (
          <ul className="space-y-2">
            {payments.map((p) => (
              <li key={p.id} className="rounded-lg border border-border p-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">
                    {p.kind === "PREMIUM" ? fmt(t.profile.kindPremium, { days: p.premiumDays }) : fmt(t.profile.kindCredits, { m: p.messagesQty, a: p.attachmentsQty })}
                    {" · "}{money(p.amountBrl)}
                  </p>
                  <p className="text-ink-muted text-xs">
                    {date(p.createdAt)} · {statusLabel(p.status)}
                    {p.refundedAmountBrl > 0 ? ` · ${money(p.refundedAmountBrl)}` : ""}
                    {p.refundableUntil ? ` · ${fmt(t.profile.refundUntil, { date: date(p.refundableUntil) })}` : ""}
                  </p>
                </div>
                {p.refundableUntil && <Button variant="secondary" onClick={() => void refund(p.id)}>{t.profile.refund}</Button>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">{t.profile.dataTitle}</h2>
        <p className="text-sm text-ink-muted">{t.profile.dataBody}</p>
        <div className="flex flex-wrap gap-2">
          <a href="/api/me/export"><Button variant="secondary">{t.profile.export}</Button></a>
          <Button variant="secondary" onClick={async () => { if (window.confirm(t.green.clearConfirm)) await fetch("/api/green/conversation", { method: "DELETE" }); }}>{t.profile.clearChat}</Button>
          <Button variant="ghost" className="!text-berry" onClick={() => void deleteAccount()}>{t.profile.deleteAccount}</Button>
        </div>
      </section>
    </main>
  );
}
