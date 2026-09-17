import * as XLSX from "xlsx";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { GeneratedPlan } from "@/domain/entities/types";
import React from "react";

const SLOT_LABEL: Record<string, string> = {
  cafe_da_manha: "Café da manhã",
  almoco: "Almoço",
  lanche: "Lanche",
  jantar: "Jantar",
};

export function planToWorkbookBuffer(plan: GeneratedPlan): Buffer {
  const rows: Record<string, string | number>[] = [];
  plan.days.forEach((day) => {
    day.meals.forEach((meal) => {
      meal.options.forEach((opt) => {
        rows.push({
          Dia: day.day,
          Refeição: SLOT_LABEL[meal.slot] ?? meal.slot,
          Alimento: opt.foodName,
          Quantidade_g: opt.grams,
          Kcal: opt.kcal,
          Proteína_g: opt.proteinG,
          Carboidrato_g: opt.carbsG,
          Gordura_g: opt.fatG,
          Fibra_g: opt.fiberG,
        });
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Cardápio");

  const dailyTotalsRows = plan.days.map((day) => ({
    Dia: day.day,
    Kcal_total: day.totals.kcal,
    Proteína_g_total: day.totals.proteinG,
    Carboidrato_g_total: day.totals.carbsG,
    Gordura_g_total: day.totals.fatG,
    Fibra_g_total: day.totals.fiberG,
  }));
  const dailyTotalsSheet = XLSX.utils.json_to_sheet(dailyTotalsRows);
  XLSX.utils.book_append_sheet(workbook, dailyTotalsSheet, "Totais por dia");

  const summarySheet = XLSX.utils.json_to_sheet([
    {
      Meta_kcal_min: plan.targetRange.kcal.min,
      Meta_kcal_ideal: plan.targetRange.kcal.ideal,
      Proteína_g_min: plan.targetRange.proteinG.min,
      Proteína_g_ideal: plan.targetRange.proteinG.ideal,
      Carboidrato_g_min: plan.targetRange.carbsG.min,
      Carboidrato_g_ideal: plan.targetRange.carbsG.ideal,
      Gordura_g_min: plan.targetRange.fatG.min,
      Gordura_g_ideal: plan.targetRange.fatG.ideal,
      Fibra_g_min: plan.targetRange.fiberG.min,
      Fibra_g_ideal: plan.targetRange.fiberG.ideal,
    },
  ]);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Metas diárias");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, marginBottom: 16, color: "#444" },
  dayHeader: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 14,
    marginBottom: 6,
    color: "#2F5233",
  },
  mealBlock: { marginBottom: 8 },
  mealHeader: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 1 },
  foodName: { flex: 2 },
  foodDetail: { flex: 1, textAlign: "right", color: "#555" },
});

function PlanPdfDocument({ plan }: { plan: GeneratedPlan }) {
  return React.createElement(
    Document,
    {},
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(Text, { style: styles.title }, "Seu cardápio personalizado"),
      React.createElement(
        Text,
        { style: styles.subtitle },
        `Meta diária (mínimo–ideal): ${plan.targetRange.kcal.min}–${plan.targetRange.kcal.ideal} kcal · ${plan.targetRange.proteinG.min}–${plan.targetRange.proteinG.ideal}g proteína · ${plan.targetRange.carbsG.min}–${plan.targetRange.carbsG.ideal}g carboidrato · ${plan.targetRange.fatG.min}–${plan.targetRange.fatG.ideal}g gordura · ${plan.targetRange.fiberG.min}–${plan.targetRange.fiberG.ideal}g fibra`
      ),
      ...plan.days.map((day) =>
        React.createElement(
          View,
          { key: day.day, wrap: false },
          React.createElement(Text, { style: styles.dayHeader }, `Dia ${day.day}`),
          React.createElement(
            Text,
            { style: styles.subtitle },
            `Total do dia: ${day.totals.kcal} kcal · ${day.totals.proteinG}g proteína · ${day.totals.carbsG}g carboidrato · ${day.totals.fatG}g gordura · ${day.totals.fiberG}g fibra`
          ),
          ...day.meals.map((meal) =>
            React.createElement(
              View,
              { key: meal.slot, style: styles.mealBlock },
              React.createElement(
                Text,
                { style: styles.mealHeader },
                SLOT_LABEL[meal.slot] ?? meal.slot
              ),
              ...meal.options.map((opt, i) =>
                React.createElement(
                  View,
                  { key: i, style: styles.row },
                  React.createElement(Text, { style: styles.foodName }, opt.foodName),
                  React.createElement(
                    Text,
                    { style: styles.foodDetail },
                    `${opt.grams}g · ${opt.kcal} kcal · ${opt.proteinG}g prot`
                  )
                )
              )
            )
          )
        )
      )
    )
  );
}

export async function planToPdfBuffer(plan: GeneratedPlan): Promise<Buffer> {
  const element = PlanPdfDocument({ plan }) as React.ReactElement<
    React.ComponentProps<typeof Document>
  >;
  return renderToBuffer(element);
}
