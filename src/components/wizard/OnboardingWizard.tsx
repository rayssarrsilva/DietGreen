"use client";

import { useMemo, useState } from "react";
import type { DietaryProfile, Goal, Food, FeasibilityTag, GeneratedPlan } from "@/domain/entities/types";
import { getFoodIcon } from "@/lib/icons";
import { Button } from "@/components/ui/Button";
import { clsx } from "clsx";

type Step = 1 | 2 | 3 | 4 | 5;

const FEASIBILITY_LABEL: Record<FeasibilityTag, string> = {
  BAIXO_CUSTO: "Baixo custo",
  MEDIO_CUSTO: "Custo médio",
  ALTO_CUSTO: "Alto custo",
  FACIL_DE_ACHAR: "Fácil de achar",
  ESPECIALIZADO: "Loja especializada",
};

const CATEGORY_LABEL: Record<Food["category"], string> = {
  PROTEIN: "Proteínas",
  FIBER: "Fibras",
  VITAMIN: "Vitaminas",
  MINERAL: "Minerais",
  COMPLEX_CARB: "Carboidratos complexos",
  GOOD_FAT: "Gorduras boas",
};

const CATEGORY_ORDER: Food["category"][] = [
  "PROTEIN",
  "COMPLEX_CARB",
  "FIBER",
  "GOOD_FAT",
  "VITAMIN",
  "MINERAL",
];

export function OnboardingWizard({
  profiles,
  goals,
  foods,
}: {
  profiles: DietaryProfile[];
  goals: Goal[];
  foods: Food[];
}) {
  const [step, setStep] = useState<Step>(1);
  const [profileSlug, setProfileSlug] = useState<string | null>(null);
  const [goalSlug, setGoalSlug] = useState<string | null>(null);
  const [feasibility, setFeasibility] = useState<FeasibilityTag[]>([]);
  const [selectedFoodIds, setSelectedFoodIds] = useState<string[]>([]);
  const [daysCount, setDaysCount] = useState(7);
  const [optionsPerMeal, setOptionsPerMeal] = useState(2);
  const [biometrics, setBiometrics] = useState({
    weightKg: 70,
    heightCm: 170,
    age: 28,
    sex: "M" as "M" | "F" | "outro",
    activityLevel: "moderado" as
      | "sedentario"
      | "leve"
      | "moderado"
      | "intenso"
      | "atleta",
  });
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profile = profiles.find((p) => p.slug === profileSlug) ?? null;
  const goal = goals.find((g) => g.slug === goalSlug) ?? null;

  const compatibleFoods = useMemo(() => {
    if (!profile) return [];
    return foods.filter((f) => {
      if (!f.containsAnimalProduct) return true;
      if (f.isMeat && !profile.allowsRedMeat && !profile.allowsWhiteMeat) return false;
      if (f.isFish && !profile.allowsFish) return false;
      if (f.isDairy && !profile.allowsDairy) return false;
      if (f.isEgg && !profile.allowsEggs) return false;
      return true;
    });
  }, [foods, profile]);

  function toggleFood(id: string) {
    setSelectedFoodIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }

  function toggleFeasibility(tag: FeasibilityTag) {
    setFeasibility((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function generate() {
    if (!profile || !goal) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dietaryProfileSlug: profile.slug,
          goalSlug: goal.slug,
          biometrics,
          feasibilityTags: feasibility,
          selectedFoodIds,
          daysCount,
          optionsPerMeal,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao gerar cardápio");
      setPlan(data.plan);
      setSavedId(data.savedId);
      setStep(5);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar cardápio");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <StepIndicator step={step} />

      {step === 1 && (
        <section>
          <h1 className="font-display text-2xl mb-2">Qual é o seu perfil alimentar?</h1>
          <p className="text-ink-muted mb-6">
            Escolha a opção mais próxima do que você come hoje. Dá pra ajustar detalhes depois.
          </p>
          <div className="grid gap-3">
            {profiles.map((p) => (
              <button
                key={p.slug}
                onClick={() => setProfileSlug(p.slug)}
                className={clsx(
                  "text-left rounded-lg border px-4 py-3 transition-colors",
                  profileSlug === p.slug
                    ? "border-primary bg-surface"
                    : "border-border hover:bg-surface"
                )}
              >
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-ink-muted">{p.shortDesc}</div>
              </button>
            ))}
          </div>
          <div className="mt-8 flex justify-end">
            <Button disabled={!profileSlug} onClick={() => setStep(2)}>
              Continuar
            </Button>
          </div>
        </section>
      )}

      {step === 2 && profile && (
        <section>
          <h1 className="font-display text-2xl mb-2">Qual é o seu objetivo?</h1>
          <p className="text-ink-muted mb-6">
            Perfil escolhido: <strong>{profile.name}</strong>. {profile.longDesc}
          </p>
          <div className="grid gap-3">
            {goals.map((g) => (
              <button
                key={g.slug}
                onClick={() => setGoalSlug(g.slug)}
                className={clsx(
                  "text-left rounded-lg border px-4 py-3 transition-colors",
                  goalSlug === g.slug
                    ? "border-primary bg-surface"
                    : "border-border hover:bg-surface"
                )}
              >
                <div className="font-medium">{g.name}</div>
                <div className="text-sm text-ink-muted mb-1">{g.shortDesc}</div>
                {goalSlug === g.slug && (
                  <p className="text-sm text-ink-muted mt-2 border-t border-border pt-2">
                    {g.longDesc}
                  </p>
                )}
              </button>
            ))}
          </div>
          <div className="mt-8 flex justify-between">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Voltar
            </Button>
            <Button disabled={!goalSlug} onClick={() => setStep(3)}>
              Continuar
            </Button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <h1 className="font-display text-2xl mb-2">Seus dados e o que é viável pra você</h1>
          <p className="text-ink-muted mb-6">
            Usamos isso para calcular suas metas diárias e filtrar só os
            alimentos que fazem sentido no seu orçamento e na sua região.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <Field label="Peso (kg)">
              <input
                type="number"
                className="input"
                value={biometrics.weightKg}
                onChange={(e) => setBiometrics({ ...biometrics, weightKg: Number(e.target.value) })}
              />
            </Field>
            <Field label="Altura (cm)">
              <input
                type="number"
                className="input"
                value={biometrics.heightCm}
                onChange={(e) => setBiometrics({ ...biometrics, heightCm: Number(e.target.value) })}
              />
            </Field>
            <Field label="Idade">
              <input
                type="number"
                className="input"
                value={biometrics.age}
                onChange={(e) => setBiometrics({ ...biometrics, age: Number(e.target.value) })}
              />
            </Field>
            <Field label="Sexo biológico (para cálculo metabólico)">
              <select
                className="input"
                value={biometrics.sex}
                onChange={(e) => setBiometrics({ ...biometrics, sex: e.target.value as "M" | "F" | "outro" })}
              >
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="outro">Prefiro não informar</option>
              </select>
            </Field>
            <Field label="Nível de atividade física">
              <select
                className="input"
                value={biometrics.activityLevel}
                onChange={(e) =>
                  setBiometrics({ ...biometrics, activityLevel: e.target.value as typeof biometrics.activityLevel })
                }
              >
                <option value="sedentario">Sedentário</option>
                <option value="leve">Leve (1-3x/semana)</option>
                <option value="moderado">Moderado (3-5x/semana)</option>
                <option value="intenso">Intenso (6-7x/semana)</option>
                <option value="atleta">Atleta</option>
              </select>
            </Field>
          </div>

          <h2 className="font-display text-lg mb-2">O que é viável pra você?</h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {(Object.keys(FEASIBILITY_LABEL) as FeasibilityTag[]).map((tag) => (
              <button
                key={tag}
                onClick={() => toggleFeasibility(tag)}
                className={clsx(
                  "text-xs rounded-full border px-3 py-1.5",
                  feasibility.includes(tag)
                    ? "border-primary bg-primary text-white"
                    : "border-border text-ink-muted"
                )}
              >
                {FEASIBILITY_LABEL[tag]}
              </button>
            ))}
            <span className="text-xs text-ink-muted self-center">
              (nenhum marcado = considera tudo)
            </span>
          </div>

          <h2 className="font-display text-lg mb-2">Alimentos que você quer incluir</h2>
          <p className="text-sm text-ink-muted mb-4">
            Marque os que você tem acesso fácil. Deixe tudo desmarcado para o
            app considerar o catálogo inteiro compatível com seu perfil.
          </p>

          {CATEGORY_ORDER.map((cat) => {
            const list = compatibleFoods.filter((f) => f.category === cat);
            if (list.length === 0) return null;
            return (
              <div key={cat} className="mb-6">
                <h3 className="text-sm font-medium text-ink-muted mb-2 uppercase tracking-wide">
                  {CATEGORY_LABEL[cat]}
                </h3>
                <div className="grid sm:grid-cols-2 gap-2">
                  {list.map((food) => {
                    const Icon = getFoodIcon(food.iconKey);
                    const checked = selectedFoodIds.includes(food.id);
                    return (
                      <label
                        key={food.id}
                        className={clsx(
                          "flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer",
                          checked ? "border-primary bg-surface" : "border-border"
                        )}
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={checked}
                          onChange={() => toggleFood(food.id)}
                        />
                        <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium">{food.name}</div>
                          <div className="text-xs text-ink-muted">
                            100g: {food.nutrition.kcal100g} kcal · {food.nutrition.protein100g}g prot
                            {" · "}50g: {Math.round(food.nutrition.kcal100g / 2)} kcal ·{" "}
                            {Math.round(food.nutrition.protein100g / 2)}g prot
                          </div>
                          {food.highlightMicros.length > 0 && (
                            <div className="text-xs text-accent mt-0.5">
                              {food.highlightMicros.join(" · ")}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="mt-4 flex justify-between">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Voltar
            </Button>
            <Button onClick={() => setStep(4)}>Continuar</Button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section>
          <h1 className="font-display text-2xl mb-2">Últimos ajustes</h1>
          <p className="text-ink-muted mb-6">
            Quantas opções de alimento por refeição, e por quantos dias?
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <Field label={`Opções por refeição: ${optionsPerMeal}`}>
              <input
                type="range"
                min={1}
                max={5}
                value={optionsPerMeal}
                onChange={(e) => setOptionsPerMeal(Number(e.target.value))}
              />
            </Field>
            <Field label={`Duração do cardápio: ${daysCount} dia(s)`}>
              <input
                type="range"
                min={1}
                max={14}
                value={daysCount}
                onChange={(e) => setDaysCount(Number(e.target.value))}
              />
            </Field>
          </div>

          {error && <p className="text-sm text-berry mb-4">{error}</p>}

          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(3)}>
              Voltar
            </Button>
            <Button onClick={generate} disabled={loading}>
              {loading ? "Gerando..." : "Gerar meu cardápio"}
            </Button>
          </div>
        </section>
      )}

      {step === 5 && plan && (
        <PlanResult plan={plan} savedId={savedId} />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-ink-muted block mb-1">{label}</span>
      {children}
    </label>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const labels = ["Perfil", "Objetivo", "Dados", "Ajustes", "Resultado"];
  return (
    <div className="flex items-center gap-2 mb-10 text-xs text-ink-muted">
      {labels.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className={clsx(
              "w-5 h-5 rounded-full flex items-center justify-center border text-[10px]",
              i + 1 <= step ? "bg-primary border-primary text-white" : "border-border"
            )}
          >
            {i + 1}
          </span>
          <span className={i + 1 === step ? "text-ink font-medium" : ""}>{label}</span>
          {i < labels.length - 1 && <span className="w-4 h-px bg-border mx-1" />}
        </div>
      ))}
    </div>
  );
}

function PlanResult({ plan, savedId }: { plan: GeneratedPlan; savedId: string | null }) {
  return (
    <section>
      <h1 className="font-display text-2xl mb-2">Seu cardápio está pronto</h1>
      <div className="rounded-lg bg-surface p-4 mb-6 text-sm grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Metric label="Kcal/dia" value={plan.macroTarget.kcal} />
        <Metric label="Proteína" value={`${plan.macroTarget.proteinG}g`} />
        <Metric label="Carboidrato" value={`${plan.macroTarget.carbsG}g`} />
        <Metric label="Gordura" value={`${plan.macroTarget.fatG}g`} />
        <Metric label="Fibra" value={`${plan.macroTarget.fiberG}g`} />
      </div>

      {savedId ? (
        <div className="flex gap-3 mb-8">
          <a href={`/api/plans/${savedId}/export?format=pdf`}>
            <Button>Baixar em PDF</Button>
          </a>
          <a href={`/api/plans/${savedId}/export?format=xlsx`}>
            <Button variant="secondary">Baixar em Excel</Button>
          </a>
        </div>
      ) : (
        <p className="text-sm text-ink-muted mb-8">
          Faça login para salvar este cardápio e poder exportá-lo em PDF/Excel a qualquer momento.
        </p>
      )}

      <div className="space-y-8">
        {plan.days.map((day) => (
          <div key={day.day}>
            <h2 className="font-display text-lg mb-3">Dia {day.day}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {day.meals.map((meal) => (
                <div key={meal.slot} className="rounded-lg border border-border p-3">
                  <div className="text-sm font-medium mb-2 capitalize">
                    {meal.slot.replace(/_/g, " ")}
                  </div>
                  <ul className="text-sm text-ink-muted space-y-1">
                    {meal.options.map((opt, i) => (
                      <li key={i} className="flex justify-between">
                        <span>{opt.foodName}</span>
                        <span>
                          {opt.grams}g · {opt.kcal} kcal
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs text-ink-muted">{label}</div>
      <div className="font-display text-lg text-primary">{value}</div>
    </div>
  );
}
