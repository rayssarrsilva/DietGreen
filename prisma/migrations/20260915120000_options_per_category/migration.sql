-- Substitui o slider único "opções por refeição" por um contador de 5 a 20
-- por categoria (proteína, carboidrato, gordura boa, fibra), permitindo
-- controlar a variedade do rodízio de alimentos e resolver a repetição
-- de combos reportada na issue #4.

ALTER TABLE "MealPlan" ADD COLUMN "optionsPerCategory" JSONB;

UPDATE "MealPlan"
SET "optionsPerCategory" = jsonb_build_object(
  'PROTEIN', GREATEST(LEAST("optionsPerMeal" * 4, 20), 5),
  'COMPLEX_CARB', GREATEST(LEAST("optionsPerMeal" * 4, 20), 5),
  'GOOD_FAT', GREATEST(LEAST("optionsPerMeal" * 4, 20), 5),
  'FIBER', GREATEST(LEAST("optionsPerMeal" * 4, 20), 5)
);

ALTER TABLE "MealPlan" ALTER COLUMN "optionsPerCategory" SET NOT NULL;
ALTER TABLE "MealPlan" DROP COLUMN "optionsPerMeal";
