import { describe, expect, it } from "vitest";
import { calculateBMR, calculateTDEE, calculateMacroTarget, type UserBiometrics } from "./macroCalculator";
import type { Goal } from "@/domain/entities/types";

const baseBiometrics: UserBiometrics = {
  weightKg: 70,
  heightCm: 170,
  age: 28,
  sex: "M",
  dailyActivityLevel: "pouco_ativa",
  trainingSessionsPerWeek: 2,
  trainingSessionDurationMin: 60,
  trainingIntensity: "moderada",
};

const maintenanceGoal: Goal = {
  id: "g1",
  slug: "manutencao",
  name: "Manutenção",
  shortDesc: "",
  longDesc: "",
  proteinGKgMin: 1.2,
  proteinGKgMax: 1.6,
  calorieAdjustmentPct: 0,
  fatPctOfCalories: 27,
  sortOrder: 0,
};

describe("calculateBMR", () => {
  it("matches the Mifflin-St Jeor formula for a man", () => {
    const bmr = calculateBMR(baseBiometrics);
    expect(bmr).toBeCloseTo(10 * 70 + 6.25 * 170 - 5 * 28 + 5, 1);
  });

  it("is lower for a woman with the same weight, height, and age", () => {
    const male = calculateBMR(baseBiometrics);
    const female = calculateBMR({ ...baseBiometrics, sex: "F" });
    expect(female).toBeLessThan(male);
  });
});

describe("calculateTDEE", () => {
  it("increases with more weekly training volume", () => {
    const low = calculateTDEE({ ...baseBiometrics, trainingSessionsPerWeek: 1 });
    const high = calculateTDEE({ ...baseBiometrics, trainingSessionsPerWeek: 5 });
    expect(high).toBeGreaterThan(low);
  });

  it("increases with a more active daily lifestyle", () => {
    const sedentary = calculateTDEE({ ...baseBiometrics, dailyActivityLevel: "sedentaria" });
    const active = calculateTDEE({ ...baseBiometrics, dailyActivityLevel: "ativa" });
    expect(active).toBeGreaterThan(sedentary);
  });
});

describe("calculateMacroTarget", () => {
  it("applies the goal's calorie adjustment on top of TDEE", () => {
    const cuttingGoal: Goal = { ...maintenanceGoal, slug: "cutting", calorieAdjustmentPct: -20 };
    const target = calculateMacroTarget(baseBiometrics, cuttingGoal);
    expect(target.targetCalories).toBeCloseTo(target.maintenanceCalories * 0.8, 0);
  });

  it("keeps protein within the goal's g/kg range", () => {
    const target = calculateMacroTarget(baseBiometrics, maintenanceGoal);
    const proteinPerKg = target.proteinG / baseBiometrics.weightKg;
    expect(proteinPerKg).toBeGreaterThanOrEqual(maintenanceGoal.proteinGKgMin - 0.01);
    expect(proteinPerKg).toBeLessThanOrEqual(maintenanceGoal.proteinGKgMax + 0.01);
  });

  it("computes fiber as roughly 14g per 1000kcal, with no fixed floor", () => {
    const lowCalorieGoal: Goal = { ...maintenanceGoal, calorieAdjustmentPct: -40 };
    const target = calculateMacroTarget(baseBiometrics, lowCalorieGoal);
    const expectedFiber = Math.round((target.targetCalories / 1000) * 14);
    expect(target.fiberG).toBe(expectedFiber);
  });

  it("never lets carbohydrate calories go negative", () => {
    const target = calculateMacroTarget(baseBiometrics, maintenanceGoal);
    expect(target.carbsG).toBeGreaterThanOrEqual(0);
  });
});
