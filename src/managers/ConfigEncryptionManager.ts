import fs from "fs";
import path from "path";
import { encrypt, decrypt, hashPassword, verifyPassword } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";

const CREDENTIALS_PATH = path.join(process.cwd(), "config", "credentials.enc");
const MASTER_PASSWORD_KEY = "master_password_hash";

interface StoredCredentials {
  [accountId: string]: Record<string, string>;
}

let decryptedMasterPassword: string | null = null;
let credentialsCache: StoredCredentials | null = null;

export class ConfigEncryptionManager {
  static isUnlocked(): boolean {
    return decryptedMasterPassword !== null;
  }

  static async isMasterPasswordSet(): Promise<boolean> {
    const setting = await prisma.appSetting.findUnique({
      where: { key: MASTER_PASSWORD_KEY },
    });
    return setting !== null;
  }

  static async setMasterPassword(password: string): Promise<void> {
    const hash = hashPassword(password);
    await prisma.appSetting.upsert({
      where: { key: MASTER_PASSWORD_KEY },
      update: { value: hash },
      create: { key: MASTER_PASSWORD_KEY, value: hash },
    });
    decryptedMasterPassword = password;
    credentialsCache = await this.loadCredentials(password);
  }

  static async unlock(password: string): Promise<boolean> {
    const setting = await prisma.appSetting.findUnique({
      where: { key: MASTER_PASSWORD_KEY },
    });
    if (!setting) return false;

    if (!verifyPassword(password, setting.value)) return false;

    decryptedMasterPassword = password;
    credentialsCache = await this.loadCredentials(password);
    return true;
  }

  static lock(): void {
    decryptedMasterPassword = null;
    credentialsCache = null;
  }

  static getCredentials(accountId: string): Record<string, string> | null {
    if (!credentialsCache) return null;
    return credentialsCache[accountId] ?? null;
  }

  static async saveCredentials(
    accountId: string,
    credentials: Record<string, string>
  ): Promise<void> {
    if (!decryptedMasterPassword) {
      throw new Error("App is locked. Unlock first.");
    }

    if (!credentialsCache) credentialsCache = {};
    credentialsCache[accountId] = credentials;

    await this.persistCredentials(decryptedMasterPassword);
  }

  static async removeCredentials(accountId: string): Promise<void> {
    if (!decryptedMasterPassword) {
      throw new Error("App is locked. Unlock first.");
    }

    if (!credentialsCache) return;
    delete credentialsCache[accountId];

    await this.persistCredentials(decryptedMasterPassword);
  }

  private static async loadCredentials(
    password: string
  ): Promise<StoredCredentials> {
    if (!fs.existsSync(CREDENTIALS_PATH)) return {};

    const encryptedContent = fs.readFileSync(CREDENTIALS_PATH, "utf8");
    if (!encryptedContent.trim()) return {};

    try {
      const decryptedJson = decrypt(encryptedContent, password);
      return JSON.parse(decryptedJson);
    } catch {
      return {};
    }
  }

  private static async persistCredentials(password: string): Promise<void> {
    const dir = path.dirname(CREDENTIALS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const json = JSON.stringify(credentialsCache ?? {});
    const encrypted = encrypt(json, password);
    fs.writeFileSync(CREDENTIALS_PATH, encrypted, "utf8");
  }
}
