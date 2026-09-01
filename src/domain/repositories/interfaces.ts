import type {
  DietaryProfile,
  Goal,
  Food,
  FoodSubstitution,
  GeneratedPlan,
  FeasibilityTag,
} from "@/domain/entities/types";

export interface CatalogRepository {
  listDietaryProfiles(): Promise<DietaryProfile[]>;
  getDietaryProfile(slug: string): Promise<DietaryProfile | null>;
  listGoals(): Promise<Goal[]>;
  getGoal(slug: string): Promise<Goal | null>;
  listFoods(): Promise<Food[]>;
  listSubstitutions(dietaryProfileSlug: string): Promise<FoodSubstitution[]>;
}

export interface SavedMealPlan {
  id: string;
  dietaryProfileSlug: string;
  goalSlug: string;
  daysCount: number;
  optionsPerMeal: number;
  feasibilityTags: FeasibilityTag[];
  selectedFoodIds: string[];
  plan: GeneratedPlan;
  createdAt: Date;
}

export interface MealPlanRepository {
  save(
    userId: string,
    dietaryProfileId: string,
    goalId: string,
    daysCount: number,
    optionsPerMeal: number,
    feasibilityTags: FeasibilityTag[],
    selectedFoodIds: string[],
    plan: GeneratedPlan
  ): Promise<string>; 
  listByUser(userId: string): Promise<SavedMealPlan[]>;
  getById(id: string, userId: string): Promise<SavedMealPlan | null>;
}
