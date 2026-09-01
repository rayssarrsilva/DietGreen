import { prisma } from "@/infrastructure/db/prisma";
import type { CatalogRepository } from "@/domain/repositories/interfaces";
import type {
  DietaryProfile,
  Goal,
  Food,
  FoodSubstitution,
} from "@/domain/entities/types";

function toFood(f: Awaited<ReturnType<typeof prisma.food.findMany>>[number]): Food {
  return {
    id: f.id,
    slug: f.slug,
    name: f.name,
    category: f.category,
    iconKey: f.iconKey,
    containsAnimalProduct: f.containsAnimalProduct,
    isMeat: f.isMeat,
    isFish: f.isFish,
    isDairy: f.isDairy,
    isEgg: f.isEgg,
    nutrition: {
      kcal100g: f.kcal100g,
      protein100g: f.protein100g,
      carbs100g: f.carbs100g,
      fat100g: f.fat100g,
      fiber100g: f.fiber100g,
      sodium100gMg: f.sodium100gMg,
      sugar100gG: f.sugar100gG,
    },
    highlightMicros: f.highlightMicros,
    feasibilityTags: f.feasibilityTags,
  };
}

export class PrismaCatalogRepository implements CatalogRepository {
  async listDietaryProfiles(): Promise<DietaryProfile[]> {
    return prisma.dietaryProfile.findMany({ orderBy: { sortOrder: "asc" } });
  }

  async getDietaryProfile(slug: string): Promise<DietaryProfile | null> {
    return prisma.dietaryProfile.findUnique({ where: { slug } });
  }

  async listGoals(): Promise<Goal[]> {
    return prisma.goal.findMany({ orderBy: { sortOrder: "asc" } });
  }

  async getGoal(slug: string): Promise<Goal | null> {
    return prisma.goal.findUnique({ where: { slug } });
  }

  async listFoods(): Promise<Food[]> {
    const foods = await prisma.food.findMany();
    return foods.map(toFood);
  }

  async listSubstitutions(dietaryProfileSlug: string): Promise<FoodSubstitution[]> {
    const subs = await prisma.foodSubstitution.findMany({
      where: { dietaryProfile: { slug: dietaryProfileSlug } },
      include: { food: true },
    });
    return subs.map((s) => ({
      foodId: s.foodId,
      dietaryProfileSlug,
      replacesCategory: s.replacesCategory,
      efficacyRank: s.efficacyRank,
      rationale: s.rationale,
    }));
  }
}
