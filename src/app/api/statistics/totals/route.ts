import { NextRequest, NextResponse } from "next/server";
import { StatisticsManager } from "@/managers/StatisticsManager";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const now = new Date();
  const year = Number(searchParams.get("year")) || now.getFullYear();
  const month = Number(searchParams.get("month")) ?? now.getMonth();

  const totals = await StatisticsManager.getMonthlyTotals(year, month);
  return NextResponse.json(totals);
}
