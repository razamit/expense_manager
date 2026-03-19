import { NextRequest, NextResponse } from "next/server";
import { CategoryRepository } from "@/repositories/CategoryRepository";

export async function GET() {
  const categories = await CategoryRepository.findAll();
  return NextResponse.json(
    categories.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      parentId: c.parentId,
      isSystem: c.isSystem,
      transactionCount: (c as Record<string, unknown>)._count
        ? ((c as Record<string, unknown>)._count as Record<string, number>).transactions
        : 0,
    }))
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, icon, color, parentId } = body;

  if (!name) {
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 }
    );
  }

  const category = await CategoryRepository.create({
    name,
    icon,
    color,
    parentId,
  });

  return NextResponse.json(category);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, name, icon, color, parentId } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const category = await CategoryRepository.update(id, {
    ...(name !== undefined && { name }),
    ...(icon !== undefined && { icon }),
    ...(color !== undefined && { color }),
    ...(parentId !== undefined && { parentId }),
  });

  return NextResponse.json(category);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await CategoryRepository.remove(id);
  return NextResponse.json({ success: true });
}
