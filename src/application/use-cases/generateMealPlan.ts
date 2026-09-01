import type { CatalogRepository, MealPlanRepository } from "@/domain/repositories/interfaces";
import { calculateMacroTarget, type UserBiometrics } from "@/domain/services/macroCalculator";
import { generateMealPlan as buildPlan } from "@/domain/services/planGenerator";
import type { FeasibilityTag, GeneratedPlan } from "@/domain/entities/types";

export interface GeneratePlanRequest {
  userId?: string; // se ausente, gera mas não salva (usuário sem login)
  dietaryProfileSlug: string;
  goalSlug: string;
  biometrics: UserBiometrics;
  feasibilityTags: FeasibilityTag[];
  selectedFoodIds: string[];
  daysCount: number;
  optionsPerMeal: number;
}

export class GenerateMealPlanUseCase {
  constructor(
    private readonly catalogRepo: CatalogRepository,
    private readonly mealPlanRepo: MealPlanRepository
  ) {}

  async execute(req: GeneratePlanRequest): Promise<{ plan: GeneratedPlan; savedId: string | null }> {
    const profile = await this.catalogRepo.getDietaryProfile(req.dietaryProfileSlug);
    const goal = await this.catalogRepo.getGoal(req.goalSlug);
    if (!profile) throw new Error(`Perfil alimentar '${req.dietaryProfileSlug}' não encontrado`);
    if (!goal) throw new Error(`Objetivo '${req.goalSlug}' não encontrado`);

    const allFoods = await this.catalogRepo.listFoods();
    const substitutions = await this.catalogRepo.listSubstitutions(req.dietaryProfileSlug);

    const compatibleFoods = allFoods.filter((f) => {
      if (!f.containsAnimalProduct) return true;
      if (f.isMeat && !profile.allowsRedMeat && !profile.allowsWhiteMeat) return false;
      if (f.isFish && !profile.allowsFish) return false;
      if (f.isDairy && !profile.allowsDairy) return false;
      if (f.isEgg && !profile.allowsEggs) return false;
      return true;
    });

    const macroTarget = calculateMacroTarget(req.biometrics, goal);

    const plan = buildPlan({
      dietaryProfileSlug: req.dietaryProfileSlug,
      macroTarget,
      availableFoods: compatibleFoods,
      substitutions,
      feasibilityFilter: req.feasibilityTags,
      selectedFoodIds: req.selectedFoodIds,
      daysCount: req.daysCount,
      optionsPerMeal: req.optionsPerMeal,
    });

    let savedId: string | null = null;
    if (req.userId) {
      savedId = await this.mealPlanRepo.save(
        req.userId,
        profile.id,
        goal.id,
        req.daysCount,
        req.optionsPerMeal,
        req.feasibilityTags,
        req.selectedFoodIds,
        plan
      );
    }

    return { plan, savedId };
  }
}
