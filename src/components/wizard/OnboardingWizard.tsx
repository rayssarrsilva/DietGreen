"use client";

import { useMemo, useState } from "react";
import type {
  DietaryProfile,
  Goal,
  Food,
  FeasibilityTag,
  GeneratedPlan,
  VarietyCategory,
  OptionsPerCategory,
} from "@/domain/entities/types";
import { getFoodIcon } from "@/lib/icons";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { Translations } from "@/lib/i18n/translations";
import { clsx } from "clsx";

type Step = 1 | 2 | 3 | 4 | 5;

const QUICK_PROFILE_SLUGS = ["vegetariano", "onivoro"] as const;

const CATEGORY_ORDER: Food["category"][] = [
  "PROTEIN",
  "COMPLEX_CARB",
  "FIBER",
  "GOOD_FAT",
  "VITAMIN",
  "MINERAL",
];

const VARIETY_CATEGORY_ORDER: VarietyCategory[] = ["PROTEIN", "COMPLEX_CARB", "GOOD_FAT", "FIBER"];

const DEFAULT_OPTIONS_PER_CATEGORY: OptionsPerCategory = {
  PROTEIN: 10,
  COMPLEX_CARB: 10,
  GOOD_FAT: 10,
  FIBER: 10,
};

function feasibilityLabels(t: Translations): Record<FeasibilityTag, string> {
  return {
    BAIXO_CUSTO: t.step3.feasibilityLowCost,
    MEDIO_CUSTO: t.step3.feasibilityMediumCost,
    ALTO_CUSTO: t.step3.feasibilityHighCost,
    FACIL_DE_ACHAR: t.step3.feasibilityEasyToFind,
    ESPECIALIZADO: t.step3.feasibilitySpecialtyStore,
  };
}

function categoryLabels(t: Translations): Record<Food["category"], string> {
  return {
    PROTEIN: t.step3.categoryProtein,
    FIBER: t.step3.categoryFiber,
    VITAMIN: t.step3.categoryVitamin,
    MINERAL: t.step3.categoryMineral,
    COMPLEX_CARB: t.step3.categoryComplexCarb,
    GOOD_FAT: t.step3.categoryGoodFat,
  };
}

function varietyCategoryLabels(t: Translations): Record<VarietyCategory, string> {
  return {
    PROTEIN: t.step4.categoryProtein,
    COMPLEX_CARB: t.step4.categoryCarb,
    GOOD_FAT: t.step4.categoryFat,
    FIBER: t.step4.categoryFiber,
  };
}

export function OnboardingWizard({
  profiles,
  goals,
  foods,
}: {
  profiles: DietaryProfile[];
  goals: Goal[];
  foods: Food[];
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>(1);
  const [profileSlug, setProfileSlug] = useState<string | null>(null);
  const [showAllProfiles, setShowAllProfiles] = useState(false);
  const [goalSlug, setGoalSlug] = useState<string | null>(null);
  const [feasibility, setFeasibility] = useState<FeasibilityTag[]>([]);
  const [selectedFoodIds, setSelectedFoodIds] = useState<string[]>([]);
  const [daysCount, setDaysCount] = useState(7);
  const [optionsPerCategory, setOptionsPerCategory] = useState<OptionsPerCategory>(
    DEFAULT_OPTIONS_PER_CATEGORY
  );
  const [biometrics, setBiometrics] = useState({
    weightKg: 70,
    heightCm: 170,
    age: 28,
    sex: "M" as "M" | "F" | "outro",
    dailyActivityLevel: "pouco_ativa" as "sedentaria" | "pouco_ativa" | "ativa",
    trainingSessionsPerWeek: 2,
    trainingSessionDurationMin: 60,
    trainingIntensity: "moderada" as "leve" | "moderada" | "intensa",
    desiredWeightKg: undefined as number | undefined,
    avgDailySteps: undefined as number | undefined,
  });
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profile = profiles.find((p) => p.slug === profileSlug) ?? null;
  const goal = goals.find((g) => g.slug === goalSlug) ?? null;
  const quickProfiles = profiles.filter((p) =>
    QUICK_PROFILE_SLUGS.includes(p.slug as (typeof QUICK_PROFILE_SLUGS)[number])
  );
  const otherProfiles = profiles.filter(
    (p) => !QUICK_PROFILE_SLUGS.includes(p.slug as (typeof QUICK_PROFILE_SLUGS)[number])
  );

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
    setSelectedFoodIds((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }

  function toggleFeasibility(tag: FeasibilityTag) {
    setFeasibility((prev) => (prev.includes(tag) ? prev.filter((f) => f !== tag) : [...prev, tag]));
  }

  function setCategoryOptions(category: VarietyCategory, value: number) {
    setOptionsPerCategory((prev) => ({ ...prev, [category]: value }));
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
          optionsPerCategory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate plan");
      setPlan(data.plan);
      setSavedId(data.savedId);
      setStep(5);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <StepIndicator step={step} />

      {step === 1 && (
        <section className="animate-fade-in-up">
          <h1 className="font-display text-2xl mb-2">{t.step1.title}</h1>
          <p className="text-ink-muted mb-6">{t.step1.subtitle}</p>

          <div className="grid sm:grid-cols-2 gap-3">
            {quickProfiles.map((p) => {
              const isVegetarian = p.slug === "vegetariano";
              return (
                <button
                  key={p.slug}
                  onClick={() => setProfileSlug(p.slug)}
                  className={clsx(
                    "text-left rounded-xl border-2 px-5 py-4 transition-all duration-150",
                    profileSlug === p.slug
                      ? "border-primary bg-surface shadow-sm"
                      : "border-border hover:border-primary/50 hover:bg-surface/60"
                  )}
                >
                  <div className="font-display text-lg mb-1">
                    {isVegetarian ? t.step1.vegetarianTitle : t.step1.omnivoreTitle}
                  </div>
                  <div className="text-sm text-ink-muted">
                    {isVegetarian ? t.step1.vegetarianDesc : t.step1.omnivoreDesc}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowAllProfiles((prev) => !prev)}
            className="mt-6 text-sm text-primary hover:text-primary-hover underline-offset-4 hover:underline"
          >
            {showAllProfiles ? t.step1.showFewer : t.step1.moreOptionsPrompt}
          </button>
          {!showAllProfiles && (
            <p className="text-xs text-ink-muted mt-1">{t.step1.moreOptionsHint}</p>
          )}

          {showAllProfiles && (
            <div className="grid gap-3 mt-4 animate-fade-in">
              {otherProfiles.map((p) => (
                <button
                  key={p.slug}
                  onClick={() => setProfileSlug(p.slug)}
                  className={clsx(
                    "text-left rounded-lg border px-4 py-3 transition-colors duration-150",
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
          )}

          <div className="mt-8 flex justify-end">
            <Button disabled={!profileSlug} onClick={() => setStep(2)}>
              {t.common.continue}
            </Button>
          </div>
        </section>
      )}

      {step === 2 && profile && (
        <section className="animate-fade-in-up">
          <h1 className="font-display text-2xl mb-2">{t.step2.title}</h1>
          <p className="text-ink-muted mb-6">
            {t.step2.profileLabel}: <strong>{profile.name}</strong>. {profile.longDesc}
          </p>
          <div className="grid gap-3">
            {goals.map((g) => (
              <button
                key={g.slug}
                onClick={() => setGoalSlug(g.slug)}
                className={clsx(
                  "text-left rounded-lg border px-4 py-3 transition-colors duration-150",
                  goalSlug === g.slug ? "border-primary bg-surface" : "border-border hover:bg-surface"
                )}
              >
                <div className="font-medium">{g.name}</div>
                <div className="text-sm text-ink-muted mb-1">{g.shortDesc}</div>
                {goalSlug === g.slug && (
                  <p className="text-sm text-ink-muted mt-2 border-t border-border pt-2 animate-fade-in">
                    {g.longDesc}
                  </p>
                )}
              </button>
            ))}
          </div>
          <div className="mt-8 flex justify-between">
            <Button variant="secondary" onClick={() => setStep(1)}>
              {t.common.back}
            </Button>
            <Button disabled={!goalSlug} onClick={() => setStep(3)}>
              {t.common.continue}
            </Button>
          </div>
        </section>
      )}

      {step === 3 && (
        <BiometricsStep
          t={t}
          biometrics={biometrics}
          setBiometrics={setBiometrics}
          feasibility={feasibility}
          toggleFeasibility={toggleFeasibility}
          compatibleFoods={compatibleFoods}
          selectedFoodIds={selectedFoodIds}
          toggleFood={toggleFood}
          onBack={() => setStep(2)}
          onContinue={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <section className="animate-fade-in-up">
          <h1 className="font-display text-2xl mb-2">{t.step4.title}</h1>
          <p className="text-ink-muted mb-6">{t.step4.subtitle}</p>

          <div className="mb-8">
            <Field label={`${t.step4.daysLabel}: ${daysCount} ${t.step4.daysUnit}`}>
              <input
                type="range"
                min={1}
                max={14}
                value={daysCount}
                onChange={(e) => setDaysCount(Number(e.target.value))}
              />
            </Field>
          </div>

          <h2 className="font-display text-lg mb-2">{t.step4.varietyTitle}</h2>
          <p className="text-sm text-ink-muted mb-4">{t.step4.varietySubtitle}</p>
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {VARIETY_CATEGORY_ORDER.map((category) => (
              <Field
                key={category}
                label={`${varietyCategoryLabels(t)[category]}: ${optionsPerCategory[category]} ${t.step4.optionsUnit}`}
              >
                <input
                  type="range"
                  min={5}
                  max={20}
                  value={optionsPerCategory[category]}
                  onChange={(e) => setCategoryOptions(category, Number(e.target.value))}
                />
              </Field>
            ))}
          </div>

          {error && <p className="text-sm text-berry mb-4">{error}</p>}

          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(3)}>
              {t.common.back}
            </Button>
            <Button onClick={generate} disabled={loading}>
              {loading ? t.step4.generating : t.step4.generate}
            </Button>
          </div>
        </section>
      )}

      {step === 5 && plan && <PlanResult plan={plan} savedId={savedId} />}
    </div>
  );
}

function BiometricsStep({
  t,
  biometrics,
  setBiometrics,
  feasibility,
  toggleFeasibility,
  compatibleFoods,
  selectedFoodIds,
  toggleFood,
  onBack,
  onContinue,
}: {
  t: Translations;
  biometrics: {
    weightKg: number;
    heightCm: number;
    age: number;
    sex: "M" | "F" | "outro";
    dailyActivityLevel: "sedentaria" | "pouco_ativa" | "ativa";
    trainingSessionsPerWeek: number;
    trainingSessionDurationMin: number;
    trainingIntensity: "leve" | "moderada" | "intensa";
    desiredWeightKg: number | undefined;
    avgDailySteps: number | undefined;
  };
  setBiometrics: (value: BiometricsStepProps["biometrics"]) => void;
  feasibility: FeasibilityTag[];
  toggleFeasibility: (tag: FeasibilityTag) => void;
  compatibleFoods: Food[];
  selectedFoodIds: string[];
  toggleFood: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <section className="animate-fade-in-up">
      <h1 className="font-display text-2xl mb-2">{t.step3.title}</h1>
      <p className="text-ink-muted mb-6">{t.step3.subtitle}</p>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Field label={t.step3.weightKg}>
          <input
            type="number"
            className="input"
            value={biometrics.weightKg}
            onChange={(e) => setBiometrics({ ...biometrics, weightKg: Number(e.target.value) })}
          />
        </Field>
        <Field label={t.step3.heightCm}>
          <input
            type="number"
            className="input"
            value={biometrics.heightCm}
            onChange={(e) => setBiometrics({ ...biometrics, heightCm: Number(e.target.value) })}
          />
        </Field>
        <Field label={t.step3.age}>
          <input
            type="number"
            className="input"
            value={biometrics.age}
            onChange={(e) => setBiometrics({ ...biometrics, age: Number(e.target.value) })}
          />
        </Field>
        <Field label={t.step3.sex}>
          <select
            className="input"
            value={biometrics.sex}
            onChange={(e) => setBiometrics({ ...biometrics, sex: e.target.value as "M" | "F" | "outro" })}
          >
            <option value="M">{t.step3.sexMale}</option>
            <option value="F">{t.step3.sexFemale}</option>
            <option value="outro">{t.step3.sexPreferNotToSay}</option>
          </select>
        </Field>
        <Field label={t.step3.dailyActivity}>
          <select
            className="input"
            value={biometrics.dailyActivityLevel}
            onChange={(e) =>
              setBiometrics({
                ...biometrics,
                dailyActivityLevel: e.target.value as typeof biometrics.dailyActivityLevel,
              })
            }
          >
            <option value="sedentaria">{t.step3.activitySedentary}</option>
            <option value="pouco_ativa">{t.step3.activityLightlyActive}</option>
            <option value="ativa">{t.step3.activityActive}</option>
          </select>
        </Field>
        <Field label={t.step3.avgDailySteps}>
          <input
            type="number"
            className="input"
            placeholder={t.step3.avgDailyStepsPlaceholder}
            value={biometrics.avgDailySteps ?? ""}
            onChange={(e) =>
              setBiometrics({
                ...biometrics,
                avgDailySteps: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
          />
        </Field>
        <Field label={t.step3.trainingSessionsPerWeek}>
          <input
            type="number"
            className="input"
            min={0}
            value={biometrics.trainingSessionsPerWeek}
            onChange={(e) =>
              setBiometrics({ ...biometrics, trainingSessionsPerWeek: Number(e.target.value) })
            }
          />
        </Field>
        <Field label={t.step3.trainingSessionDuration}>
          <input
            type="number"
            className="input"
            min={0}
            value={biometrics.trainingSessionDurationMin}
            onChange={(e) =>
              setBiometrics({ ...biometrics, trainingSessionDurationMin: Number(e.target.value) })
            }
          />
        </Field>
        <Field label={t.step3.trainingIntensity}>
          <select
            className="input"
            value={biometrics.trainingIntensity}
            onChange={(e) =>
              setBiometrics({
                ...biometrics,
                trainingIntensity: e.target.value as typeof biometrics.trainingIntensity,
              })
            }
          >
            <option value="leve">{t.step3.intensityLight}</option>
            <option value="moderada">{t.step3.intensityModerate}</option>
            <option value="intensa">{t.step3.intensityIntense}</option>
          </select>
        </Field>
        <Field label={t.step3.desiredWeightKg}>
          <input
            type="number"
            className="input"
            placeholder={t.step3.desiredWeightKgPlaceholder}
            value={biometrics.desiredWeightKg ?? ""}
            onChange={(e) =>
              setBiometrics({
                ...biometrics,
                desiredWeightKg: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
          />
        </Field>
      </div>

      <h2 className="font-display text-lg mb-2">{t.step3.feasibilityTitle}</h2>
      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(feasibilityLabels(t)) as FeasibilityTag[]).map((tag) => (
          <button
            key={tag}
            onClick={() => toggleFeasibility(tag)}
            className={clsx(
              "text-xs rounded-full border px-3 py-1.5 transition-colors duration-150",
              feasibility.includes(tag)
                ? "border-primary bg-primary text-white"
                : "border-border text-ink-muted"
            )}
          >
            {feasibilityLabels(t)[tag]}
          </button>
        ))}
        <span className="text-xs text-ink-muted self-center">{t.step3.feasibilityNote}</span>
      </div>

      <h2 className="font-display text-lg mb-2">{t.step3.foodsTitle}</h2>
      <p className="text-sm text-ink-muted mb-4">{t.step3.foodsSubtitle}</p>

      {CATEGORY_ORDER.map((cat) => {
        const list = compatibleFoods.filter((f) => f.category === cat);
        if (list.length === 0) return null;
        return (
          <div key={cat} className="mb-6">
            <h3 className="text-sm font-medium text-ink-muted mb-2 uppercase tracking-wide">
              {categoryLabels(t)[cat]}
            </h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {list.map((food) => {
                const Icon = getFoodIcon(food.iconKey);
                const checked = selectedFoodIds.includes(food.id);
                return (
                  <label
                    key={food.id}
                    className={clsx(
                      "flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors duration-150",
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
                        {t.step3.per100g}: {food.nutrition.kcal100g} {t.step3.kcalAbbrev} ·{" "}
                        {food.nutrition.protein100g}g {t.step3.proteinAbbrev}
                        {" · "}
                        {t.step3.per50g}: {Math.round(food.nutrition.kcal100g / 2)} {t.step3.kcalAbbrev} ·{" "}
                        {Math.round(food.nutrition.protein100g / 2)}g {t.step3.proteinAbbrev}
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
        <Button variant="secondary" onClick={onBack}>
          {t.common.back}
        </Button>
        <Button onClick={onContinue}>{t.common.continue}</Button>
      </div>
    </section>
  );
}

type BiometricsStepProps = Parameters<typeof BiometricsStep>[0];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-ink-muted block mb-1">{label}</span>
      {children}
    </label>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const { t } = useTranslation();
  const labels = [t.steps.profile, t.steps.goal, t.steps.data, t.steps.adjustments, t.steps.result];
  return (
    <div className="flex items-center gap-2 mb-10 text-xs text-ink-muted">
      {labels.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className={clsx(
              "w-5 h-5 rounded-full flex items-center justify-center border text-[10px] transition-colors duration-200",
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
  const { t } = useTranslation();
  return (
    <section className="animate-fade-in-up">
      <h1 className="font-display text-2xl mb-2">{t.result.title}</h1>
      <p className="text-sm text-ink-muted mb-2">{t.result.subtitle}</p>
      <div className="rounded-lg bg-surface p-4 mb-6 text-sm grid grid-cols-2 sm:grid-cols-5 gap-3">
        <RangeMetric label={t.result.kcalPerDay} range={plan.targetRange.kcal} minToIdeal={t.result.minToIdeal} />
        <RangeMetric label={t.result.protein} range={plan.targetRange.proteinG} unit="g" minToIdeal={t.result.minToIdeal} />
        <RangeMetric label={t.result.carbohydrate} range={plan.targetRange.carbsG} unit="g" minToIdeal={t.result.minToIdeal} />
        <RangeMetric label={t.result.fat} range={plan.targetRange.fatG} unit="g" minToIdeal={t.result.minToIdeal} />
        <RangeMetric label={t.result.fiber} range={plan.targetRange.fiberG} unit="g" minToIdeal={t.result.minToIdeal} />
      </div>

      {savedId ? (
        <div className="flex gap-3 mb-8">
          <a href={`/api/plans/${savedId}/export?format=pdf`}>
            <Button>{t.result.downloadPdf}</Button>
          </a>
          <a href={`/api/plans/${savedId}/export?format=xlsx`}>
            <Button variant="secondary">{t.result.downloadExcel}</Button>
          </a>
        </div>
      ) : (
        <p className="text-sm text-ink-muted mb-8">{t.result.loginPrompt}</p>
      )}

      <div className="space-y-8">
        {plan.days.map((day, index) => (
          <div key={day.day} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}>
            <h2 className="font-display text-lg mb-1">
              {t.result.day} {day.day}
            </h2>
            <p className="text-xs text-ink-muted mb-3">
              {t.result.dayTotal}: {formatAgainstRange(day.totals.kcal, plan.targetRange.kcal)} {t.result.kcal} ·{" "}
              {formatAgainstRange(day.totals.proteinG, plan.targetRange.proteinG)}{t.result.proteinUnit} ·{" "}
              {formatAgainstRange(day.totals.carbsG, plan.targetRange.carbsG)}{t.result.carbUnit} ·{" "}
              {formatAgainstRange(day.totals.fatG, plan.targetRange.fatG)}{t.result.fatUnit} ·{" "}
              {formatAgainstRange(day.totals.fiberG, plan.targetRange.fiberG)}{t.result.fiberUnit}
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {day.meals.map((meal) => (
                <div
                  key={meal.slot}
                  className="rounded-lg border border-border p-3 transition-shadow duration-150 hover:shadow-sm"
                >
                  <div className="text-sm font-medium mb-2 capitalize">{meal.slot.replace(/_/g, " ")}</div>
                  <ul className="text-sm text-ink-muted space-y-1">
                    {meal.options.map((opt, i) => (
                      <li key={i} className="flex justify-between">
                        <span>
                          {opt.foodName} <span className="text-xs text-accent">({opt.category})</span>
                        </span>
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

function RangeMetric({
  label,
  range,
  unit = "",
  minToIdeal,
}: {
  label: string;
  range: { min: number; ideal: number };
  unit?: string;
  minToIdeal: string;
}) {
  return (
    <div>
      <div className="text-xs text-ink-muted">{label}</div>
      <div className="font-display text-lg text-primary">
        {range.min}
        {unit}–{range.ideal}
        {unit}
      </div>
      <div className="text-[10px] text-ink-muted">{minToIdeal}</div>
    </div>
  );
}

function formatAgainstRange(actual: number, range: { min: number; ideal: number; excessive: number }) {
  const className =
    actual < range.min
      ? "text-accent font-medium"
      : actual > range.excessive
        ? "text-berry font-medium"
        : undefined;
  return <span className={className}>{actual}</span>;
}
