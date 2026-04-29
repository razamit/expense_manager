import { NextRequest, NextResponse } from "next/server";
import {
  BankCategoryMappingManager,
  isBankCategoryMappingError,
} from "@/managers/BankCategoryMappingManager";

export async function GET(request: NextRequest) {
  const includeObserved =
    new URL(request.url).searchParams.get("includeObserved") === "true";

  if (includeObserved) {
    const mappingCatalog = await BankCategoryMappingManager.listMappingCatalog();
    return NextResponse.json(mappingCatalog);
  }

  const mappings = await BankCategoryMappingManager.listMappings();
  return NextResponse.json(mappings);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bankCategory, categoryId } = body;
    const normalizedBankCategory =
      typeof bankCategory === "string" ? bankCategory.trim() : "";

    if (!normalizedBankCategory || !categoryId) {
      return NextResponse.json(
        { error: "bankCategory and categoryId are required" },
        { status: 400 }
      );
    }

    const mapping = await BankCategoryMappingManager.createMapping({
      bankCategory: normalizedBankCategory,
      categoryId,
    });

    return NextResponse.json(mapping);
  } catch (error) {
    return handleMappingError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await BankCategoryMappingManager.removeMapping(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleMappingError(error);
  }
}

function handleMappingError(error: unknown) {
  if (isBankCategoryMappingError(error)) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  return NextResponse.json(
    { error: "Unexpected bank category mapping error" },
    { status: 500 }
  );
}