import Link from "next/link";
import { auth, signOut } from "@/infrastructure/auth/auth";
import { Button } from "@/components/ui/Button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-lg text-primary">
            Nutre
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/onboarding" className="text-ink-muted hover:text-ink">
              Montar cardápio
            </Link>
            {session?.user ? (
              <>
                <Link href="/dashboard" className="text-ink-muted hover:text-ink">
                  Meus cardápios
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <Button variant="ghost" type="submit">
                    Sair
                  </Button>
                </form>
              </>
            ) : (
              <Link href="/login">
                <Button variant="secondary">Entrar</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>
      <div className="flex-1 flex flex-col">{children}</div>
    </>
  );
}
