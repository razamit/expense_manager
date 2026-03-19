import { NextRequest, NextResponse } from "next/server";
import { CategoryRuleRepository } from "@/repositories/CategoryRuleRepository";
import { CategoryManager } from "@/managers/CategoryManager";

export async function GET() {
  const rules = await CategoryRuleRepository.findAll();
  return NextResponse.json(
    rules.map((r) => ({
      id: r.id,
      categoryId: r.categoryId,
      categoryName: (r as Record<string, unknown>).category
        ? ((r as Record<string, unknown>).category as Record<string, string>).name
        : undefined,
      matchField: r.matchField,
      matchPattern: r.matchPattern,
      isRegex: r.isRegex,
      priority: r.priority,
    }))
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { categoryId, matchField, matchPattern, isRegex, priority } = body;

  if (!categoryId || !matchPattern) {
    return NextResponse.json(
      { error: "categoryId and matchPattern are required" },
      { status: 400 }
    );
  }

  const rule = await CategoryRuleRepository.create({
    categoryId,
    matchField,
    matchPattern,
    isRegex,
    priority,
  });

  CategoryManager.invalidateCache();
  return NextResponse.json(rule);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...data } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const rule = await CategoryRuleRepository.update(id, data);
  CategoryManager.invalidateCache();
  return NextResponse.json(rule);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await CategoryRuleRepository.remove(id);
  CategoryManager.invalidateCache();
  return NextResponse.json({ success: true });
}
