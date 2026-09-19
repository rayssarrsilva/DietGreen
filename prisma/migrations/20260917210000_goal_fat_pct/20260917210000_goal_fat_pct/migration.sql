-- Cada objetivo passa a ter seu próprio % de gordura (ex.: cutting usa uma
-- faixa mais baixa que os demais), em vez de um valor fixo de 27% pra todos
-- os objetivos no código.

ALTER TABLE "Goal" ADD COLUMN "fatPctOfCalories" DOUBLE PRECISION NOT NULL DEFAULT 27;
