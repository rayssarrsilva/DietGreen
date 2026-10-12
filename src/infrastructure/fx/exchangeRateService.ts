import { prisma } from "@/infrastructure/db/prisma";

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function bcbDate(date: Date): string {
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${mm}-${dd}-${date.getUTCFullYear()}`;
}

async function fetchPtax(now: Date): Promise<number | null> {
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const url =
    "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)" +
    `?@dataInicial='${bcbDate(start)}'&@dataFinalCotacao='${bcbDate(now)}'&$format=json&$orderby=dataHoraCotacao%20desc&$top=1`;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(4000), cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as { value?: { cotacaoVenda?: number }[] };
    const rate = data.value?.[0]?.cotacaoVenda;
    return typeof rate === "number" && rate > 1 && rate < 20 ? rate : null;
  } catch {
    return null;
  }
}

let memo: { day: string; rate: number } | null = null;

export async function getUsdBrlRate(fallback: number, now = new Date()): Promise<number> {
  const day = dayKey(now);
  if (memo?.day === day) return memo.rate;
  try {
    const stored = await prisma.exchangeRate.findUnique({ where: { day } });
    if (stored) {
      memo = { day, rate: Number(stored.usdBrl.toString()) };
      return memo.rate;
    }
    const fetched = await fetchPtax(now);
    if (fetched) {
      await prisma.exchangeRate.upsert({
        where: { day },
        create: { day, usdBrl: fetched.toFixed(4), source: "BCB PTAX venda" },
        update: {},
      });
      memo = { day, rate: fetched };
      return fetched;
    }
    const latest = await prisma.exchangeRate.findFirst({ orderBy: { day: "desc" } });
    if (latest) return Number(latest.usdBrl.toString());
  } catch (err) {
    console.error("exchange rate lookup failed", err);
  }
  return fallback;
}
