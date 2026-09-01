import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-3xl px-6 py-24 sm:py-32">
        <p className="text-sm font-medium text-primary mb-4">
          Nutrição sob medida para o seu jeito de comer
        </p>
        <h1 className="font-display text-4xl sm:text-5xl leading-tight text-ink mb-6">
          Um cardápio que já sabe o que você come — e o que não come.
        </h1>
        <p className="text-lg text-ink-muted leading-relaxed mb-10 max-w-xl">
          Escolha seu perfil alimentar — vegano, vegetariano, pescetariano e
          outras variações — e seu objetivo físico. O app monta as melhores
          substituições nutricionais para você, com base em dados reais,
          respeitando o que existe e cabe no seu bolso onde você vive.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/onboarding">
            <Button>Montar meu cardápio</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary">Entrar e ver meus cardápios salvos</Button>
          </Link>
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-3xl px-6 py-16 grid gap-10 sm:grid-cols-3">
          <div>
            <h2 className="font-display text-xl mb-2">1. Seu perfil</h2>
            <p className="text-sm text-ink-muted">
              Até 10 perfis alimentares diferentes, incluindo personalizado —
              cada um com as substituições mais eficazes para o seu caso.
            </p>
          </div>
          <div>
            <h2 className="font-display text-xl mb-2">2. Seu objetivo</h2>
            <p className="text-sm text-ink-muted">
              Ganhar massa, ganhar músculo, emagrecer, bulking ou cutting —
              com metas de proteína e calorias calculadas para você.
            </p>
          </div>
          <div>
            <h2 className="font-display text-xl mb-2">3. Seu cardápio</h2>
            <p className="text-sm text-ink-muted">
              Salvo na sua conta, disponível quando você quiser, exportável
              em PDF ou Excel.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
