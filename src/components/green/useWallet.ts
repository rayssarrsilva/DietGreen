"use client";

import { useCallback, useEffect, useState } from "react";
import type { WalletSnapshot } from "@/domain/entities/wallet";

const EVENT = "dietgreen:wallet";

export function publishWallet(wallet: WalletSnapshot): void {
  window.dispatchEvent(new CustomEvent<WalletSnapshot>(EVENT, { detail: wallet }));
}

export function requestWalletRefresh(): void {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: null }));
}

export function useWallet(enabled: boolean) {
  const [wallet, setWallet] = useState<WalletSnapshot | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/green/wallet", { cache: "no-store" });
      if (response.ok) setWallet((await response.json()) as WalletSnapshot);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const onEvent = (event: Event) => {
      const detail = (event as CustomEvent<WalletSnapshot | null>).detail;
      if (detail) setWallet(detail);
      else void refresh();
    };
    window.addEventListener(EVENT, onEvent);
    return () => window.removeEventListener(EVENT, onEvent);
  }, [enabled, refresh]);

  return { wallet, refresh };
}
