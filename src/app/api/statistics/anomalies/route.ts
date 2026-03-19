import { NextRequest, NextResponse } from "next/server";
import { AnomalyDetectionManager } from "@/managers/AnomalyDetectionManager";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const now = new Date();
  const year = Number(searchParams.get("year")) || now.getFullYear();
  const month = Number(searchParams.get("month")) ?? now.getMonth();

  const anomalies = await AnomalyDetectionManager.detectAnomalies(year, month);
  return NextResponse.json(anomalies);
}
