import { describe, expect, it } from "vitest";
import { foodsRichIn, KNOWLEDGE_STATS, lookupFoods, searchArticles } from "./knowledgeBase";

describe("knowledge base", () => {
  it("loads datasets", () => {
    expect(KNOWLEDGE_STATS.tacoFoods).toBe(597);
    expect(KNOWLEDGE_STATS.articles).toBeGreaterThan(30);
  });
  it("finds articles", () => {
    expect(searchArticles("perder gordura da barriga")[0].title).toMatch(/específico|Emagrecer/);
    expect(searchArticles("ferro anemia").length).toBeGreaterThan(0);
  });
  it("looks up foods", () => {
    expect(lookupFoods("feijão preto cozido")).toMatch(/Feijão, preto, cozido/);
  });
  it("respects vegan filter", () => {
    const text = foodsRichIn("iron", "vegan", 10);
    expect(text).not.toMatch(/Carne|Fígado|frango/i);
  });
});
