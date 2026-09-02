import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

import { dietaryProfilesSeed } from "./seed-data/dietary-profiles";
import { goalsSeed } from "./seed-data/goals";
import { foodsSeed } from "./seed-data/foods";
import { substitutionsSeed } from "./seed-data/substitutions";

const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL não definida.");
}

const adapter = new PrismaNeon({ connectionString });

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding dietary profiles...");
  for (const p of dietaryProfilesSeed) {
    await prisma.dietaryProfile.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }

  console.log("Seeding goals...");
  for (const g of goalsSeed) {
    await prisma.goal.upsert({
      where: { slug: g.slug },
      update: g,
      create: g,
    });
  }

  console.log("Seeding foods...");
  for (const f of foodsSeed) {
    await prisma.food.upsert({
      where: { slug: f.slug },
      update: f,
      create: f,
    });
  }

  console.log("Seeding substitution rankings...");
  const profiles = await prisma.dietaryProfile.findMany();
  const foods = await prisma.food.findMany();
  const profileBySlug = new Map<string, { id: string; slug: string }>(
    profiles.map((p) => [p.slug, p])
  );
  const foodBySlug = new Map<string, { id: string; slug: string }>(
    foods.map((f) => [f.slug, f])
  );

  for (const s of substitutionsSeed) {
    const profile = profileBySlug.get(s.dietaryProfileSlug);
    const food = foodBySlug.get(s.foodSlug);
    if (!profile || !food) {
      console.warn(`Skip: ${s.dietaryProfileSlug} / ${s.foodSlug} não encontrado`);
      continue;
    }
    await prisma.foodSubstitution.upsert({
      where: {
        dietaryProfileId_foodId_replacesCategory: {
          dietaryProfileId: profile.id,
          foodId: food.id,
          replacesCategory: s.replacesCategory,
        },
      },
      update: { efficacyRank: s.efficacyRank, rationale: s.rationale },
      create: {
        dietaryProfileId: profile.id,
        foodId: food.id,
        replacesCategory: s.replacesCategory,
        efficacyRank: s.efficacyRank,
        rationale: s.rationale,
      },
    });
  }

  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
