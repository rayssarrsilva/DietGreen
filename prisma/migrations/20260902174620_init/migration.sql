-- CreateEnum
CREATE TYPE "NutrientCategory" AS ENUM ('PROTEIN', 'FIBER', 'VITAMIN', 'MINERAL', 'COMPLEX_CARB', 'GOOD_FAT');

-- CreateEnum
CREATE TYPE "FeasibilityTag" AS ENUM ('BAIXO_CUSTO', 'MEDIO_CUSTO', 'ALTO_CUSTO', 'FACIL_DE_ACHAR', 'ESPECIALIZADO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dietaryProfile" TEXT,
    "goal" TEXT,
    "feasibilityTags" "FeasibilityTag"[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietaryProfile" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDesc" TEXT NOT NULL,
    "longDesc" TEXT NOT NULL,
    "allowsFish" BOOLEAN NOT NULL DEFAULT false,
    "allowsWhiteMeat" BOOLEAN NOT NULL DEFAULT false,
    "allowsRedMeat" BOOLEAN NOT NULL DEFAULT false,
    "allowsDairy" BOOLEAN NOT NULL DEFAULT false,
    "allowsEggs" BOOLEAN NOT NULL DEFAULT false,
    "allowsHoney" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DietaryProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDesc" TEXT NOT NULL,
    "longDesc" TEXT NOT NULL,
    "proteinGKgMin" DOUBLE PRECISION NOT NULL,
    "proteinGKgMax" DOUBLE PRECISION NOT NULL,
    "calorieAdjustmentPct" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Food" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "NutrientCategory" NOT NULL,
    "iconKey" TEXT NOT NULL,
    "containsAnimalProduct" BOOLEAN NOT NULL DEFAULT false,
    "isMeat" BOOLEAN NOT NULL DEFAULT false,
    "isFish" BOOLEAN NOT NULL DEFAULT false,
    "isDairy" BOOLEAN NOT NULL DEFAULT false,
    "isEgg" BOOLEAN NOT NULL DEFAULT false,
    "kcal100g" DOUBLE PRECISION NOT NULL,
    "protein100g" DOUBLE PRECISION NOT NULL,
    "carbs100g" DOUBLE PRECISION NOT NULL,
    "fat100g" DOUBLE PRECISION NOT NULL,
    "fiber100g" DOUBLE PRECISION NOT NULL,
    "sodium100gMg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sugar100gG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "highlightMicros" TEXT[],
    "feasibilityTags" "FeasibilityTag"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodSubstitution" (
    "id" TEXT NOT NULL,
    "dietaryProfileId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "replacesCategory" "NutrientCategory" NOT NULL,
    "efficacyRank" INTEGER NOT NULL,
    "rationale" TEXT NOT NULL,

    CONSTRAINT "FoodSubstitution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dietaryProfileId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "daysCount" INTEGER NOT NULL,
    "optionsPerMeal" INTEGER NOT NULL,
    "feasibilityTags" "FeasibilityTag"[],
    "selectedFoodIds" TEXT[],
    "generatedPlan" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DietaryProfile_slug_key" ON "DietaryProfile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Goal_slug_key" ON "Goal"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Food_slug_key" ON "Food"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "FoodSubstitution_dietaryProfileId_foodId_replacesCategory_key" ON "FoodSubstitution"("dietaryProfileId", "foodId", "replacesCategory");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodSubstitution" ADD CONSTRAINT "FoodSubstitution_dietaryProfileId_fkey" FOREIGN KEY ("dietaryProfileId") REFERENCES "DietaryProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodSubstitution" ADD CONSTRAINT "FoodSubstitution_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_dietaryProfileId_fkey" FOREIGN KEY ("dietaryProfileId") REFERENCES "DietaryProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
