import { NextRequest, NextResponse } from "next/server";
import { StatisticsManager } from "@/managers/StatisticsManager";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const months = Number(searchParams.get("months")) || 6;

  const trend = await StatisticsManager.getIncomeExpenseTrend(months);
  return NextResponse.json(trend);
}
