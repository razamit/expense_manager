import { NextRequest, NextResponse } from "next/server";
import { AccountRepository } from "@/repositories/AccountRepository";
import { ConfigEncryptionManager } from "@/managers/ConfigEncryptionManager";

export async function GET() {
  const accounts = await AccountRepository.findAll();
  return NextResponse.json(
    accounts.map((a) => ({
      id: a.id,
      displayName: a.displayName,
      companyType: a.companyType,
      accountNumber: a.accountNumber,
      lastScrapedAt: a.lastScrapedAt?.toISOString() ?? null,
      lastBalance: a.lastBalance,
      isActive: a.isActive,
    }))
  );
}

export async function POST(request: NextRequest) {
  if (!ConfigEncryptionManager.isUnlocked()) {
    return NextResponse.json({ error: "App is locked" }, { status: 401 });
  }

  const body = await request.json();
  const { displayName, companyType, accountNumber, credentials } = body;

  if (!displayName || !companyType) {
    return NextResponse.json(
      { error: "displayName and companyType are required" },
      { status: 400 }
    );
  }

  const account = await AccountRepository.create({
    displayName,
    companyType,
    accountNumber: accountNumber || undefined,
  });

  if (credentials) {
    await ConfigEncryptionManager.saveCredentials(account.id, credentials);
  }

  return NextResponse.json({
    id: account.id,
    displayName: account.displayName,
    companyType: account.companyType,
    accountNumber: account.accountNumber,
    lastScrapedAt: null,
    isActive: account.isActive,
  });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, displayName, isActive, credentials } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const account = await AccountRepository.update(id, {
    ...(displayName !== undefined && { displayName }),
    ...(isActive !== undefined && { isActive }),
  });

  if (credentials && ConfigEncryptionManager.isUnlocked()) {
    await ConfigEncryptionManager.saveCredentials(id, credentials);
  }

  return NextResponse.json({
    id: account.id,
    displayName: account.displayName,
    companyType: account.companyType,
    accountNumber: account.accountNumber,
    lastScrapedAt: account.lastScrapedAt?.toISOString() ?? null,
    isActive: account.isActive,
  });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await AccountRepository.remove(id);
  if (ConfigEncryptionManager.isUnlocked()) {
    await ConfigEncryptionManager.removeCredentials(id);
  }

  return NextResponse.json({ success: true });
}
