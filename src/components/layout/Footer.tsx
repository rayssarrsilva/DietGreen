import Link from "next/link";
import { getSellerInfo } from "@/infrastructure/config/greenConfig";

export function Footer() {
  const seller = getSellerInfo();
  return (
    <footer className="border-t border-border mt-auto">
      <div className="mx-auto max-w-5xl px-6 py-6 pr-48 text-xs text-ink-muted flex flex-wrap gap-x-6 gap-y-2">
        <Link href="/terms" className="hover:text-ink">Termos de uso / Terms</Link>
        <Link href="/privacy" className="hover:text-ink">Privacidade / Privacy</Link>
        {seller.name && (
          <span>
            {seller.name}
            {seller.document ? ` — CPF/CNPJ ${seller.document}` : ""}
            {seller.address ? ` — ${seller.address}` : ""}
          </span>
        )}
        {seller.email && (
          <a href={`mailto:${seller.email}`} className="hover:text-ink">
            {seller.email}
          </a>
        )}
      </div>
    </footer>
  );
}
