import { NextRequest, NextResponse } from "next/server";
import { TransactionManager } from "@/managers/TransactionManager";
import type { TransactionFilters } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const filters: TransactionFilters = {
    startDate: searchParams.get("startDate") ?? undefined,
    endDate: searchParams.get("endDate") ?? undefined,
    accountId: searchParams.get("accountId") ?? undefined,
    categoryId: searchParams.get("categoryId") ?? undefined,
    direction: searchParams.get("direction") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    uncategorizedOnly: searchParams.get("uncategorizedOnly") === "true",
    page: Number(searchParams.get("page")) || 1,
    pageSize: Number(searchParams.get("pageSize")) || 50,
  };

  const result = await TransactionManager.getTransactions(filters);
  return NextResponse.json(result);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, action, categoryId, createRule, rulePattern } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  if (action === "toggle-excluded") {
    const isExcluded = await TransactionManager.toggleExcluded(id);
    return NextResponse.json({ success: true, isExcluded });
  }

  if (createRule && categoryId) {
    const { CategoryManager } = await import("@/managers/CategoryManager");
    const { autoCategorized } = await CategoryManager.createRuleFromTransaction(id, categoryId, rulePattern);
    return NextResponse.json({ success: true, autoCategorized });
  }

  await TransactionManager.assignCategory(id, categoryId);
  return NextResponse.json({ success: true });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body.action === "export") {
    const csv = await TransactionManager.exportCSV(body.filters ?? {});
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=transactions.csv",
      },
    });
  }

  if (body.action === "bulk-categorize") {
    const count = await TransactionManager.bulkCategorize(
      body.transactionIds,
      body.categoryId
    );
    return NextResponse.json({ categorized: count });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
