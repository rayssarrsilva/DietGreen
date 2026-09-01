import { prisma } from "@/infrastructure/db/prisma";
import type {
  MealPlanRepository,
  SavedMealPlan,
} from "@/domain/repositories/interfaces";
import type { GeneratedPlan, FeasibilityTag } from "@/domain/entities/types";

export class PrismaMealPlanRepository implements MealPlanRepository {
  async save(
    userId: string,
    dietaryProfileId: string,
    goalId: string,
    daysCount: number,
    optionsPerMeal: number,
    feasibilityTags: FeasibilityTag[],
    selectedFoodIds: string[],
    plan: GeneratedPlan
  ): Promise<string> {
    const saved = await prisma.mealPlan.create({
      data: {
        userId,
        dietaryProfileId,
        goalId,
        daysCount,
        optionsPerMeal,
        feasibilityTags,
        selectedFoodIds,
        generatedPlan: plan as unknown as object,
      },
    });
    return saved.id;
  }

  async listByUser(userId: string): Promise<SavedMealPlan[]> {
    const plans = await prisma.mealPlan.findMany({
      where: { userId },
      include: { dietaryProfile: true, goal: true },
      orderBy: { createdAt: "desc" },
    });
    return plans.map((p) => ({
      id: p.id,
      dietaryProfileSlug: p.dietaryProfile.slug,
      goalSlug: p.goal.slug,
      daysCount: p.daysCount,
      optionsPerMeal: p.optionsPerMeal,
      feasibilityTags: p.feasibilityTags,
      selectedFoodIds: p.selectedFoodIds,
      plan: p.generatedPlan as unknown as GeneratedPlan,
      createdAt: p.createdAt,
    }));
  }

  async getById(id: string, userId: string): Promise<SavedMealPlan | null> {
    const p = await prisma.mealPlan.findFirst({
      where: { id, userId },
      include: { dietaryProfile: true, goal: true },
    });
    if (!p) return null;
    return {
      id: p.id,
      dietaryProfileSlug: p.dietaryProfile.slug,
      goalSlug: p.goal.slug,
      daysCount: p.daysCount,
      optionsPerMeal: p.optionsPerMeal,
      feasibilityTags: p.feasibilityTags,
      selectedFoodIds: p.selectedFoodIds,
      plan: p.generatedPlan as unknown as GeneratedPlan,
      createdAt: p.createdAt,
    };
  }
}
