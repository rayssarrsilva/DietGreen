import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/infrastructure/auth/auth";
import { mealPlanRepository } from "@/lib/container";
import { Button } from "@/components/ui/Button";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const plans = await mealPlanRepository.listByUser(session.user.id);

  return (
    <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl">Meus cardápios</h1>
        <Link href="/onboarding">
          <Button>Novo cardápio</Button>
        </Link>
      </div>

      {plans.length === 0 ? (
        <p className="text-ink-muted">
          Você ainda não gerou nenhum cardápio. Clique em &quot;Novo cardápio&quot; para começar.
        </p>
      ) : (
        <ul className="space-y-3">
          {plans.map((p) => (
            <li
              key={p.id}
              className="rounded-lg border border-border p-4 flex items-center justify-between"
            >
              <div>
                <div className="font-medium capitalize">
                  {p.dietaryProfileSlug.replace(/-/g, " ")} · {p.goalSlug.replace(/-/g, " ")}
                </div>
                <div className="text-sm text-ink-muted">
                  {p.daysCount} dias · {p.plan.macroTarget.kcal} kcal/dia · gerado em{" "}
                  {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                </div>
              </div>
              <div className="flex gap-2">
                <a href={`/api/plans/${p.id}/export?format=pdf`}>
                  <Button variant="secondary">PDF</Button>
                </a>
                <a href={`/api/plans/${p.id}/export?format=xlsx`}>
                  <Button variant="secondary">Excel</Button>
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
