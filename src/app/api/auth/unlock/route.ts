import { NextRequest, NextResponse } from "next/server";
import { ConfigEncryptionManager } from "@/managers/ConfigEncryptionManager";

export async function GET() {
  const isPasswordSet = await ConfigEncryptionManager.isMasterPasswordSet();
  const isUnlocked = ConfigEncryptionManager.isUnlocked();
  return NextResponse.json({ isPasswordSet, isUnlocked });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, password } = body;

  if (action === "create") {
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }
    await ConfigEncryptionManager.setMasterPassword(password);
    return NextResponse.json({ success: true });
  }

  if (action === "unlock") {
    const success = await ConfigEncryptionManager.unlock(password);
    if (!success) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }
    return NextResponse.json({ success: true });
  }

  if (action === "lock") {
    ConfigEncryptionManager.lock();
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
