import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/infrastructure/auth/auth";
import { mealPlanRepository } from "@/lib/container";
import { planToPdfBuffer, planToWorkbookBuffer } from "@/lib/exportPlan";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login necessário para exportar." }, { status: 401 });
  }

  const { id } = await params;
  const format = req.nextUrl.searchParams.get("format") ?? "pdf";

  const saved = await mealPlanRepository.getById(id, session.user.id);
  if (!saved) {
    return NextResponse.json({ error: "Cardápio não encontrado." }, { status: 404 });
  }

  if (format === "xlsx") {
    const buffer = planToWorkbookBuffer(saved.plan);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="cardapio-${id}.xlsx"`,
      },
    });
  }

  const buffer = await planToPdfBuffer(saved.plan);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cardapio-${id}.pdf"`,
    },
  });
}
