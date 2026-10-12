"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import type { ClassifiedLabValue, LabStatus } from "@/domain/entities/green";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { LabDraft } from "./types";

function labStatusOf(v: ClassifiedLabValue): LabStatus {
  if (v.labRangeLow === null && v.labRangeHigh === null) return "unknown";
  if (v.labRangeLow !== null && v.value < v.labRangeLow) return "low";
  if (v.labRangeHigh !== null && v.value > v.labRangeHigh) return "high";
  return "normal";
}

function parseNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function LabReview({
  draft,
  defaultSave,
  onConfirm,
  onDiscard,
}: {
  draft: LabDraft;
  defaultSave: boolean;
  onConfirm: (draft: LabDraft, save: boolean) => Promise<void>;
  onDiscard: () => void;
}) {
  const { t } = useTranslation();
  const [values, setValues] = useState<ClassifiedLabValue[]>(draft.values);
  const [collectedAt, setCollectedAt] = useState(draft.collectedAt ?? "");
  const [save, setSave] = useState(defaultSave);
  const [busy, setBusy] = useState(false);
  const critical = values.some((v) => v.critical);

  const statusLabel: Record<LabStatus, string> = {
    low: t.green.statusLow,
    normal: t.green.statusNormal,
    high: t.green.statusHigh,
    unknown: t.green.statusUnknown,
  };

  function update(index: number, patch: Partial<ClassifiedLabValue>) {
    setValues((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-3 text-sm space-y-3">
      <div>
        <p className="font-display text-base">{t.green.reviewTitle}</p>
        <p className="text-xs text-ink-muted">{t.green.reviewHint}</p>
      </div>
      {critical && (
        <p role="alert" className="rounded-md border border-berry/40 bg-berry/10 text-berry px-3 py-2 text-xs font-medium">
          {t.green.criticalBanner}
        </p>
      )}
      <label className="flex items-center gap-2 text-xs">
        <span className="text-ink-muted">{t.green.collectedAt}</span>
        <input type="date" className="input !w-auto !py-1" value={collectedAt} onChange={(e) => setCollectedAt(e.target.value)} />
      </label>
      <div className="overflow-x-auto max-h-64">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-surface">
            <tr className="text-left text-ink-muted">
              <th className="py-1 pr-1 font-medium">{t.green.colMarker}</th>
              <th className="py-1 pr-1 font-medium">{t.green.colValue}</th>
              <th className="py-1 pr-1 font-medium">{t.green.colUnit}</th>
              <th className="py-1 pr-1 font-medium">{t.green.colRange}</th>
              <th className="py-1 font-medium">{t.green.colStatus}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {values.map((v, i) => {
              const status = labStatusOf(v);
              return (
                <tr key={i} className="border-t border-border align-middle">
                  <td className="py-1 pr-1">
                    <input className="input !px-1 !py-0.5 !text-xs" value={v.marker} onChange={(e) => update(i, { marker: e.target.value })} />
                  </td>
                  <td className="py-1 pr-1 w-16">
                    <input
                      className="input !px-1 !py-0.5 !text-xs tabular-nums"
                      inputMode="decimal"
                      defaultValue={String(v.value).replace(".", ",")}
                      onBlur={(e) => {
                        const n = parseNumber(e.target.value);
                        if (n !== null) update(i, { value: n });
                      }}
                    />
                  </td>
                  <td className="py-1 pr-1 w-16">
                    <input className="input !px-1 !py-0.5 !text-xs" value={v.unit} onChange={(e) => update(i, { unit: e.target.value })} />
                  </td>
                  <td className="py-1 pr-1 w-28">
                    <div className="flex gap-1">
                      <input
                        className="input !px-1 !py-0.5 !text-xs tabular-nums"
                        inputMode="decimal"
                        aria-label="min"
                        defaultValue={v.labRangeLow === null ? "" : String(v.labRangeLow).replace(".", ",")}
                        onBlur={(e) => update(i, { labRangeLow: parseNumber(e.target.value) })}
                      />
                      <input
                        className="input !px-1 !py-0.5 !text-xs tabular-nums"
                        inputMode="decimal"
                        aria-label="max"
                        defaultValue={v.labRangeHigh === null ? "" : String(v.labRangeHigh).replace(".", ",")}
                        onBlur={(e) => update(i, { labRangeHigh: parseNumber(e.target.value) })}
                      />
                    </div>
                    {v.labRangeText && <p className="text-[10px] text-ink-muted mt-0.5 line-clamp-2">{v.labRangeText}</p>}
                  </td>
                  <td className="py-1">
                    <span
                      className={clsx(
                        "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap",
                        status === "normal" && "bg-primary/15 text-primary",
                        (status === "low" || status === "high") && "bg-accent/20 text-ink",
                        status === "unknown" && "bg-surface-2 text-ink-muted",
                        v.critical && "!bg-berry/15 !text-berry"
                      )}
                    >
                      {statusLabel[status]}
                    </span>
                  </td>
                  <td className="py-1 pl-1">
                    <button
                      type="button"
                      aria-label={t.green.removeRow}
                      className="text-ink-muted hover:text-berry"
                      onClick={() => setValues((prev) => prev.filter((_, j) => j !== i))}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="text-xs text-primary underline underline-offset-2"
        onClick={() =>
          setValues((prev) => [
            ...prev,
            {
              marker: "",
              value: 0,
              unit: "",
              labRangeLow: null,
              labRangeHigh: null,
              labRangeText: null,
              markerKey: null,
              labStatus: "unknown",
              guidelineStatus: "unknown",
              guidelineLabel: null,
              guidelineSource: null,
              critical: false,
            },
          ])
        }
      >
        {t.green.addRow}
      </button>
      <label className="flex gap-2 items-start text-xs">
        <input type="checkbox" className="mt-0.5" checked={save} onChange={(e) => setSave(e.target.checked)} />
        <span>{t.green.saveValues}</span>
      </label>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          disabled={busy || values.filter((v) => v.marker.trim()).length === 0}
          onClick={async () => {
            setBusy(true);
            await onConfirm(
              {
                collectedAt: /^\d{4}-\d{2}-\d{2}$/.test(collectedAt) ? collectedAt : null,
                labName: draft.labName,
                values: values.filter((v) => v.marker.trim()),
              },
              save
            );
            setBusy(false);
          }}
        >
          {t.green.confirmAndAnalyze}
        </Button>
        <Button variant="secondary" onClick={onDiscard}>
          {t.green.discard}
        </Button>
      </div>
    </div>
  );
}
