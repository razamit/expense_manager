import { NextRequest, NextResponse } from "next/server";
import { AccountRepository } from "@/repositories/AccountRepository";
import { ScrapingManager } from "@/managers/ScrapingManager";
import { ConfigEncryptionManager } from "@/managers/ConfigEncryptionManager";

type LatestRun = {
  status: string;
  errorType: string | null;
  errorMessage: string | null;
};

function mapAccountResponse(
  account: Awaited<ReturnType<typeof AccountRepository.findById>> extends infer T
    ? NonNullable<T>
    : never,
  latestRun?: LatestRun
) {
  return {
    id: account.id,
    displayName: account.displayName,
    companyType: account.companyType,
    accountNumber: account.accountNumber,
    credentialSourceAccountId: account.credentialSourceAccountId,
    lastScrapedAt: account.lastScrapedAt?.toISOString() ?? null,
    lastBalance: account.lastBalance,
    isActive: account.isActive,
    lastScrapeStatus: latestRun?.status ?? null,
    lastScrapeErrorType: latestRun?.errorType ?? null,
    lastScrapeErrorMessage: latestRun?.errorMessage ?? null,
  };
}

function normalizeOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function normalizeCredentials(
  value: unknown
): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const entries = Object.entries(value).filter(
    (entry): entry is [string, string] =>
      typeof entry[0] === "string" &&
      typeof entry[1] === "string" &&
      entry[1].trim().length > 0
  );

  if (entries.length === 0) {
    return null;
  }

  return Object.fromEntries(entries);
}

async function validateCredentialSource(params: {
  targetAccountId?: string;
  targetCompanyType: string;
  credentialSourceAccountId: string | null;
}) {
  const {
    targetAccountId,
    targetCompanyType,
    credentialSourceAccountId,
  } = params;

  if (!credentialSourceAccountId) {
    return { credentialSourceAccountId: null };
  }

  if (targetAccountId && credentialSourceAccountId === targetAccountId) {
    return {
      error: NextResponse.json(
        { error: "credentialSourceAccountId cannot reference the same account" },
        { status: 400 }
      ),
    };
  }

  const sourceAccount = await AccountRepository.findById(
    credentialSourceAccountId
  );
  if (!sourceAccount) {
    return {
      error: NextResponse.json(
        { error: "credentialSourceAccountId must reference an existing account" },
        { status: 400 }
      ),
    };
  }

  if (sourceAccount.companyType !== targetCompanyType) {
    return {
      error: NextResponse.json(
        {
          error:
            "credentialSourceAccountId must reference an account with the same companyType",
        },
        { status: 400 }
      ),
    };
  }

  if (sourceAccount.credentialSourceAccountId) {
    return {
      error: NextResponse.json(
        {
          error:
            "credentialSourceAccountId must reference an account that stores credentials directly",
        },
        { status: 400 }
      ),
    };
  }

  return { credentialSourceAccountId };
}

export async function GET() {
  const accounts = await AccountRepository.findAll();
  const latestRuns = await ScrapingManager.getLatestRunsForAccounts(
    accounts.map((account) => account.id)
  );
  return NextResponse.json(
    accounts.map((account) =>
      mapAccountResponse(account, latestRuns.get(account.id))
    )
  );
}

export async function POST(request: NextRequest) {
  if (!ConfigEncryptionManager.isUnlocked()) {
    return NextResponse.json({ error: "App is locked" }, { status: 401 });
  }

  const body = await request.json();
  const { displayName, companyType } = body;
  const accountNumber = normalizeOptionalString(body.accountNumber);
  const credentialSourceAccountId = normalizeOptionalString(
    body.credentialSourceAccountId
  );
  const credentials = normalizeCredentials(body.credentials);

  if (!displayName || !companyType) {
    return NextResponse.json(
      { error: "displayName and companyType are required" },
      { status: 400 }
    );
  }

  const validatedCredentialSource = await validateCredentialSource({
    targetCompanyType: companyType,
    credentialSourceAccountId: credentialSourceAccountId ?? null,
  });
  if ("error" in validatedCredentialSource) {
    return validatedCredentialSource.error;
  }

  if (validatedCredentialSource.credentialSourceAccountId && credentials) {
    return NextResponse.json(
      {
        error:
          "Provide credentials directly or select credentialSourceAccountId, but not both",
      },
      { status: 400 }
    );
  }

  const account = await AccountRepository.create({
    displayName,
    companyType,
    accountNumber: accountNumber ?? undefined,
    credentialSourceAccountId:
      validatedCredentialSource.credentialSourceAccountId,
  });

  if (credentials) {
    await ConfigEncryptionManager.saveCredentials(account.id, credentials);
  }

  return NextResponse.json(mapAccountResponse(account));
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, displayName, isActive } = body;
  const accountNumber = normalizeOptionalString(body.accountNumber);
  const credentialSourceAccountId = normalizeOptionalString(
    body.credentialSourceAccountId
  );
  const credentials = normalizeCredentials(body.credentials);

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  if (
    (credentialSourceAccountId !== undefined || credentials) &&
    !ConfigEncryptionManager.isUnlocked()
  ) {
    return NextResponse.json(
      { error: "Unlock the app before changing credential ownership or login details" },
      { status: 401 }
    );
  }

  const existingAccount = await AccountRepository.findById(id);
  if (!existingAccount) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  if (accountNumber) {
    const duplicateAccount =
      await AccountRepository.findByCompanyTypeAndAccountNumber(
        existingAccount.companyType,
        accountNumber
      );

    if (duplicateAccount && duplicateAccount.id !== id) {
      return NextResponse.json(
        {
          error: `This card/account number is already bound to ${duplicateAccount.displayName}`,
        },
        { status: 400 }
      );
    }
  }

  const nextCredentialSourceAccountId =
    credentialSourceAccountId !== undefined
      ? credentialSourceAccountId
      : existingAccount.credentialSourceAccountId;

  const validatedCredentialSource = await validateCredentialSource({
    targetAccountId: id,
    targetCompanyType: existingAccount.companyType,
    credentialSourceAccountId: nextCredentialSourceAccountId,
  });
  if ("error" in validatedCredentialSource) {
    return validatedCredentialSource.error;
  }

  if (validatedCredentialSource.credentialSourceAccountId && credentials) {
    return NextResponse.json(
      {
        error:
          "Provide credentials directly or select credentialSourceAccountId, but not both",
      },
      { status: 400 }
    );
  }

  const account = await AccountRepository.update(id, {
    ...(displayName !== undefined && { displayName }),
    ...(accountNumber !== undefined && { accountNumber }),
    ...(credentialSourceAccountId !== undefined && {
      credentialSourceAccountId: validatedCredentialSource.credentialSourceAccountId,
    }),
    ...(isActive !== undefined && { isActive }),
  });

  if (credentials && ConfigEncryptionManager.isUnlocked()) {
    await ConfigEncryptionManager.saveCredentials(id, credentials);
  }

  if (
    validatedCredentialSource.credentialSourceAccountId &&
    ConfigEncryptionManager.isUnlocked()
  ) {
    await ConfigEncryptionManager.removeCredentials(id);
  }

  return NextResponse.json(mapAccountResponse(account));
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const dependentAccounts = await AccountRepository.findCredentialDependents(id);
  if (dependentAccounts.length > 0) {
    return NextResponse.json(
      {
        error: `Move ${dependentAccounts.length} shared-login account${dependentAccounts.length === 1 ? "" : "s"} to a different credential source before deleting this account`,
      },
      { status: 400 }
    );
  }

  await AccountRepository.remove(id);
  if (ConfigEncryptionManager.isUnlocked()) {
    await ConfigEncryptionManager.removeCredentials(id);
  }

  return NextResponse.json({ success: true });
}
