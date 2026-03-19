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
  }): Promise<Account> {
    return prisma.account.create({ data });
  }

  static async update(
    id: string,
    data: Partial<{
      displayName: string;
      accountNumber: string;
      isActive: boolean;
      lastScrapedAt: Date;
      lastBalance: number;
    }>
  ): Promise<Account> {
    return prisma.account.update({ where: { id }, data });
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
