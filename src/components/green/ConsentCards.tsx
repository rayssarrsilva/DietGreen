"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export function ChatConsentCard({ onAccept }: { onAccept: () => Promise<void> }) {
  const { t } = useTranslation();
  const [adult, setAdult] = useState(false);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-surface p-4 text-sm space-y-3">
      <p className="font-display text-base">{t.green.consentTitle}</p>
      <label className="flex gap-2 items-start">
        <input type="checkbox" className="mt-1" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
        <span>{t.green.consentAdult}</span>
      </label>
      <label className="flex gap-2 items-start">
        <input type="checkbox" className="mt-1" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
        <span>
          {t.green.consentTermsPrefix}{" "}
          <Link href="/terms" target="_blank" className="text-primary underline underline-offset-2">
            {t.green.termsLink}
          </Link>{" "}
          {t.green.and}{" "}
          <Link href="/privacy" target="_blank" className="text-primary underline underline-offset-2">
            {t.green.privacyLink}
          </Link>
          .
        </span>
      </label>
      <p className="text-xs text-ink-muted">{t.green.consentChatNote}</p>
      <Button
        className="w-full"
        disabled={!adult || !terms || busy}
        onClick={async () => {
          setBusy(true);
          await onAccept();
          setBusy(false);
        }}
      >
        {t.green.consentAccept}
      </Button>
    </div>
  );
}

export function HealthConsentCard({
  initialStorage,
  onAccept,
  onCancel,
}: {
  initialStorage: boolean;
  onAccept: (storage: boolean) => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [processing, setProcessing] = useState(false);
  const [storage, setStorage] = useState(initialStorage);
  const [busy, setBusy] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-surface p-4 text-sm space-y-3">
      <p className="font-display text-base">{t.green.healthTitle}</p>
      <p className="text-ink-muted">{t.green.healthBody}</p>
      <label className="flex gap-2 items-start">
        <input type="checkbox" className="mt-1" checked={processing} onChange={(e) => setProcessing(e.target.checked)} />
        <span>{t.green.healthProcessing}</span>
      </label>
      <label className="flex gap-2 items-start">
        <input type="checkbox" className="mt-1" checked={storage} onChange={(e) => setStorage(e.target.checked)} />
        <span>{t.green.healthStorage}</span>
      </label>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          disabled={!processing || busy}
          onClick={async () => {
            setBusy(true);
            await onAccept(storage);
            setBusy(false);
          }}
        >
          {t.green.healthAccept}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          {t.green.cancel}
        </Button>
      </div>
    </div>
  );
}
