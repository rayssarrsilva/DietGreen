import { signIn, auth, authProvidersEnabled } from "@/infrastructure/auth/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex-1 flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <h1 className="font-display text-3xl mb-3">Entrar</h1>
        <p className="text-ink-muted mb-8">
          Faça login para salvar seus cardápios e acessá-los quando voltar.
        </p>

        {!authProvidersEnabled && (
          <p className="text-sm text-berry mb-6">
            Login ainda não configurado neste ambiente. Configure as
            credenciais OAuth no arquivo .env (veja o README).
          </p>
        )}

        <div className="flex flex-col gap-3">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <Button type="submit" className="w-full" disabled={!authProvidersEnabled}>
              Continuar com Google
            </Button>
          </form>
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/dashboard" });
            }}
          >
            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              disabled={!authProvidersEnabled}
            >
              Continuar com GitHub
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
