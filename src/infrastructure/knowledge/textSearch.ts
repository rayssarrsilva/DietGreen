import { normalizeText } from "@/domain/services/labClassifier";

const STOPWORDS = new Set(
  "a o as os um uma uns umas de do da dos das em no na nos nas por para pra com sem e ou que qual quais quanto quantos quanta como onde quando eu meu minha meus minhas voce seu sua e ser estar tem ter mais menos muito pouco sobre isso esse essa este esta ao aos se me te nao sim the of and to in for is are what how much".split(
    " "
  )
);

export function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(stem);
}

function stem(token: string): string {
  if (token.length <= 4) return token;
  if (token.endsWith("oes") || token.endsWith("aes")) return token.slice(0, -3);
  if (token.endsWith("es") && token.length > 5) return token.slice(0, -2);
  if (token.endsWith("s")) return token.slice(0, -1);
  return token;
}

export interface IndexedDocument<T> {
  item: T;
  fields: { text: string; weight: number }[];
}

export class Bm25Index<T> {
  private readonly docs: { item: T; tf: Map<string, number>; length: number }[];
  private readonly df = new Map<string, number>();
  private readonly avgLength: number;

  constructor(documents: IndexedDocument<T>[]) {
    this.docs = documents.map((doc) => {
      const tf = new Map<string, number>();
      let length = 0;
      for (const field of doc.fields) {
        for (const token of tokenize(field.text)) {
          tf.set(token, (tf.get(token) ?? 0) + field.weight);
          length += 1;
        }
      }
      for (const token of tf.keys()) this.df.set(token, (this.df.get(token) ?? 0) + 1);
      return { item: doc.item, tf, length };
    });
    this.avgLength = this.docs.reduce((sum, d) => sum + d.length, 0) / Math.max(1, this.docs.length);
  }

  search(query: string, limit: number): { item: T; score: number }[] {
    const terms = [...new Set(tokenize(query))];
    if (terms.length === 0) return [];
    const k1 = 1.2;
    const b = 0.75;
    const n = this.docs.length;
    const scored = this.docs.map((doc) => {
      let score = 0;
      for (const term of terms) {
        const matches = [...doc.tf.entries()].filter(
          ([token]) => token === term || (term.length >= 5 && token.startsWith(term)) || (token.length >= 5 && term.startsWith(token))
        );
        if (matches.length === 0) continue;
        const tf = matches.reduce((sum, [, count]) => sum + count, 0);
        const df = Math.max(...matches.map(([token]) => this.df.get(token) ?? 1));
        const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
        score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * doc.length) / this.avgLength)));
      }
      return { item: doc.item, score };
    });
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b2) => b2.score - a.score)
      .slice(0, limit);
  }
}
