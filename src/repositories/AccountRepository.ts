import { prisma } from "@/lib/prisma";
import type { Account } from "@prisma/client";

export class AccountRepository {
  static async findAll(): Promise<Account[]> {
    return prisma.account.findMany({
      orderBy: { displayName: "asc" },
    });
  }

  static async findActive(): Promise<Account[]> {
    return prisma.account.findMany({
      where: { isActive: true },
      orderBy: { displayName: "asc" },
    });
  }

  static async findById(id: string): Promise<Account | null> {
    return prisma.account.findUnique({ where: { id } });
  }

  static async create(data: {
    displayName: string;
    companyType: string;
    accountNumber?: string;
    credentialSourceAccountId?: string | null;
  }): Promise<Account> {
    return prisma.account.create({ data });
  }

  static async update(
    id: string,
    data: Partial<{
      displayName: string;
      accountNumber: string | null;
      credentialSourceAccountId: string | null;
      isActive: boolean;
      lastScrapedAt: Date;
      lastBalance: number;
    }>
  ): Promise<Account> {
    return prisma.account.update({ where: { id }, data });
  }

  static async findByIds(ids: string[]): Promise<Account[]> {
    if (ids.length === 0) {
      return [];
    }

    return prisma.account.findMany({
      where: { id: { in: ids } },
      orderBy: { displayName: "asc" },
    });
  }

  static async findByCompanyTypeAndAccountNumber(
    companyType: string,
    accountNumber: string
  ): Promise<Account | null> {
    return prisma.account.findFirst({
      where: {
        companyType,
        accountNumber,
      },
    });
  }

  static async findCredentialDependents(
    credentialSourceAccountId: string
  ): Promise<Account[]> {
    return prisma.account.findMany({
      where: { credentialSourceAccountId },
      orderBy: { displayName: "asc" },
    });
  }

  static async remove(id: string): Promise<void> {
    await prisma.account.delete({ where: { id } });
  }

  static async updateLastScraped(id: string): Promise<void> {
    await prisma.account.update({
      where: { id },
      data: { lastScrapedAt: new Date() },
    });
  }
}
