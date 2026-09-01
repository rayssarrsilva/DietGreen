import { PrismaCatalogRepository } from "@/infrastructure/repositories/prismaCatalogRepository";
import { PrismaMealPlanRepository } from "@/infrastructure/repositories/prismaMealPlanRepository";
import { GenerateMealPlanUseCase } from "@/application/use-cases/generateMealPlan";

const catalogRepository = new PrismaCatalogRepository();
const mealPlanRepository = new PrismaMealPlanRepository();

export const generateMealPlanUseCase = new GenerateMealPlanUseCase(
  catalogRepository,
  mealPlanRepository
);

export { catalogRepository, mealPlanRepository };
