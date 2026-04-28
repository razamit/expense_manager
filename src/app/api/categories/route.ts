import { NextRequest, NextResponse } from "next/server";
import { CategoryManager } from "@/managers/CategoryManager";
import {
  CategoryHierarchyError,
  CategoryHierarchyManager,
} from "@/managers/CategoryHierarchyManager";

export async function GET() {
  const categories = await CategoryHierarchyManager.listCategories();
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, icon, color, parentId } = body;

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const category = await CategoryHierarchyManager.createCategory({
      name,
      icon,
      color,
      parentId,
    });

    return NextResponse.json(category);
  } catch (error) {
    return handleCategoryError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, icon, color, parentId } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const category = await CategoryHierarchyManager.updateCategory(id, {
      ...(name !== undefined && { name }),
      ...(icon !== undefined && { icon }),
      ...(color !== undefined && { color }),
      ...(parentId !== undefined && { parentId }),
    });

    return NextResponse.json(category);
  } catch (error) {
    return handleCategoryError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await CategoryHierarchyManager.deleteCategory(id);
    CategoryManager.invalidateCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleCategoryError(error);
  }
}

function handleCategoryError(error: unknown) {
  if (error instanceof CategoryHierarchyError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  return NextResponse.json(
    { error: "Unexpected category error" },
    { status: 500 }
  );
}
