import { NextRequest, NextResponse } from "next/server";
import { CategoryHierarchyError } from "@/managers/CategoryHierarchyManager";
import { StatisticsManager } from "@/managers/StatisticsManager";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const year = Number(searchParams.get("year")) || now.getFullYear();
    const categoryId = searchParams.get("categoryId");

    if (!categoryId) {
      return NextResponse.json(
        { error: "categoryId is required" },
        { status: 400 }
      );
    }

    const trend = await StatisticsManager.getCategoryYearlyTrend(
      year,
      categoryId
    );

    return NextResponse.json(trend);
  } catch (error) {
    if (error instanceof CategoryHierarchyError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Unexpected statistics error" },
      { status: 500 }
    );
  }
}