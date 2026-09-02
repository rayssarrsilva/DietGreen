import type { Goal, MacroTarget } from "@/domain/entities/types";

export type ActivityLevel =
  | "sedentario"
  | "leve"
  | "moderado"
  | "intenso"
  | "atleta";

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  intenso: 1.725,
  atleta: 1.9,
};

export interface UserBiometrics {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: "M" | "F" | "outro";
  activityLevel: ActivityLevel;
}

export function calculateBMR(bio: UserBiometrics): number {
  const { weightKg, heightCm, age, sex } = bio;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === "M") return base + 5;
  if (sex === "F") return base - 161;
  return base - 78; 
}

export function calculateMacroTarget(
  bio: UserBiometrics,
  goal: Goal
): MacroTarget {
  const bmr = calculateBMR(bio);
  const tdee = bmr * ACTIVITY_FACTORS[bio.activityLevel];
  const kcal = Math.round(tdee * (1 + goal.calorieAdjustmentPct / 100));

  const proteinPerKg =
    (goal.proteinGKgMin + goal.proteinGKgMax) / 2;
  const proteinG = Math.round(proteinPerKg * bio.weightKg);
  const proteinKcal = proteinG * 4;

  const fatKcal = kcal * 0.25; 
  const fatG = Math.round(fatKcal / 9);

  const remainingKcal = Math.max(kcal - proteinKcal - fatKcal, 0);
  const carbsG = Math.round(remainingKcal / 4);

  const fiberG = Math.round((kcal / 1000) * 14);

  return { kcal, proteinG, carbsG, fatG, fiberG };
}
