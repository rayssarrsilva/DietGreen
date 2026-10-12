import { PrismaCatalogRepository } from "@/infrastructure/repositories/prismaCatalogRepository";
import { PrismaMealPlanRepository } from "@/infrastructure/repositories/prismaMealPlanRepository";
import { PrismaGreenRepository } from "@/infrastructure/repositories/prismaGreenRepository";
import { PrismaPaymentRepository } from "@/infrastructure/repositories/prismaPaymentRepository";
import { GenerateMealPlanUseCase } from "@/application/use-cases/generateMealPlan";
import { PricingService } from "@/application/green/pricingService";
import { GreenService } from "@/application/green/greenService";
import { BillingService } from "@/application/green/billingService";
import { AccountDataService } from "@/application/green/accountDataService";
import { getGreenConfig } from "@/infrastructure/config/greenConfig";

const catalogRepository = new PrismaCatalogRepository();
const mealPlanRepository = new PrismaMealPlanRepository();
const greenRepository = new PrismaGreenRepository();
const paymentRepository = new PrismaPaymentRepository();
const greenConfig = getGreenConfig();

export const generateMealPlanUseCase = new GenerateMealPlanUseCase(
  catalogRepository,
  mealPlanRepository
);

export const pricingService = new PricingService(greenRepository, greenConfig);
export const greenService = new GreenService(greenRepository, mealPlanRepository, pricingService, greenConfig);
export const billingService = new BillingService(greenRepository, paymentRepository, pricingService, greenConfig);
export const accountDataService = new AccountDataService(greenRepository);

export { catalogRepository, mealPlanRepository, greenConfig };
