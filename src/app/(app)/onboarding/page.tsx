import { catalogRepository } from "@/lib/container";
import { OnboardingWizard } from "@/components/wizard/OnboardingWizard";

export default async function OnboardingPage() {
  const [profiles, goals, foods] = await Promise.all([
    catalogRepository.listDietaryProfiles(),
    catalogRepository.listGoals(),
    catalogRepository.listFoods(),
  ]);

  return (
    <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-12">
      <OnboardingWizard profiles={profiles} goals={goals} foods={foods} />
    </main>
  );
}
