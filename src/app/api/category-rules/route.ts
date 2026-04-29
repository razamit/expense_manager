import { NextRequest, NextResponse } from "next/server";
import { CategoryRuleRepository } from "@/repositories/CategoryRuleRepository";
import { CategoryManager } from "@/managers/CategoryManager";
import {
  CategoryHierarchyError,
  CategoryHierarchyManager,
} from "@/managers/CategoryHierarchyManager";

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
  try {
    const body = await request.json();
    const { categoryId, matchField, matchPattern, isRegex, priority } = body;
    const normalizedMatchPattern =
      typeof matchPattern === "string" ? matchPattern.trim() : "";

    if (!categoryId || !normalizedMatchPattern) {
      return NextResponse.json(
        { error: "categoryId and matchPattern are required" },
        { status: 400 }
      );
    }

    const { rule, autoCategorized } = await CategoryManager.createRule({
      categoryId,
      matchField,
      matchPattern: normalizedMatchPattern,
      isRegex,
      priority,
    });

    return NextResponse.json({ ...rule, autoCategorized });
  } catch (error) {
    return handleRuleError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    if (data.categoryId) {
      await CategoryHierarchyManager.assertLeafCategory(data.categoryId);
    }

    const rule = await CategoryRuleRepository.update(id, data);
    CategoryManager.invalidateCache();
    return NextResponse.json(rule);
  } catch (error) {
    return handleRuleError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deleteAll = searchParams.get("all") === "true";

  if (deleteAll) {
    const deleted = await CategoryRuleRepository.removeAll();
    CategoryManager.invalidateCache();
    return NextResponse.json({ success: true, deleted });
  }

  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await CategoryRuleRepository.remove(id);
  CategoryManager.invalidateCache();
  return NextResponse.json({ success: true });
}

function handleRuleError(error: unknown) {
  if (error instanceof CategoryHierarchyError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  return NextResponse.json(
    { error: "Unexpected category rule error" },
    { status: 500 }
  );
}
