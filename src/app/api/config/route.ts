import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ConfigEncryptionManager } from "@/managers/ConfigEncryptionManager";

export async function GET() {
  const settings = await prisma.appSetting.findMany({
    where: { key: { not: "master_password_hash" } },
  });

  const config: Record<string, string> = {};
  for (const s of settings) {
    config[s.key] = s.value;
  }

  return NextResponse.json(config);
}

export async function PUT(request: NextRequest) {
  if (!ConfigEncryptionManager.isUnlocked()) {
    return NextResponse.json({ error: "App is locked" }, { status: 401 });
  }

  const body = await request.json();
  const { key, value } = body;

  if (!key) {
    return NextResponse.json({ error: "key is required" }, { status: 400 });
  }

  if (key === "master_password_hash") {
    return NextResponse.json({ error: "Cannot modify this key directly" }, { status: 403 });
  }

  await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  return NextResponse.json({ success: true });
}
