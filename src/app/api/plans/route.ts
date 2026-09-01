import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/infrastructure/auth/auth";
import { generateMealPlanUseCase, mealPlanRepository } from "@/lib/container";

const bodySchema = z.object({
  dietaryProfileSlug: z.string(),
  goalSlug: z.string(),
  biometrics: z.object({
    weightKg: z.number().min(30).max(300),
    heightCm: z.number().min(100).max(250),
    age: z.number().min(14).max(100),
    sex: z.enum(["M", "F", "outro"]),
    activityLevel: z.enum(["sedentario", "leve", "moderado", "intenso", "atleta"]),
  }),
  feasibilityTags: z.array(
    z.enum(["BAIXO_CUSTO", "MEDIO_CUSTO", "ALTO_CUSTO", "FACIL_DE_ACHAR", "ESPECIALIZADO"])
  ),
  selectedFoodIds: z.array(z.string()),
  daysCount: z.number().min(1).max(14),
  optionsPerMeal: z.number().min(1).max(5),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { plan, savedId } = await generateMealPlanUseCase.execute({
      userId: session?.user?.id,
      ...parsed.data,
    });
    return NextResponse.json({ plan, savedId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao gerar cardápio";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ plans: [] });
  }
  const plans = await mealPlanRepository.listByUser(session.user.id);
  return NextResponse.json({ plans });
}
