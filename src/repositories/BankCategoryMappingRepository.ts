import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const bankCategoryMappingInclude = {
  category: {
    select: {
      id: true,
      name: true,
      parent: {
        select: {
          name: true,
        },
      },
    },
  },
} satisfies Prisma.BankCategoryMappingInclude;

export type BankCategoryMappingWithCategory = Prisma.BankCategoryMappingGetPayload<{
  include: typeof bankCategoryMappingInclude;
}>;

export class BankCategoryMappingRepository {
  static async findAll(): Promise<BankCategoryMappingWithCategory[]> {
    return prisma.bankCategoryMapping.findMany({
      orderBy: [{ rawBankCategory: "asc" }, { createdAt: "asc" }],
      include: bankCategoryMappingInclude,
    });
  }

  static async findById(id: string): Promise<BankCategoryMappingWithCategory | null> {
    return prisma.bankCategoryMapping.findUnique({
      where: { id },
      include: bankCategoryMappingInclude,
    });
  }

  static async upsertByNormalizedBankCategory(data: {
    rawBankCategory: string;
    normalizedBankCategory: string;
    categoryId: string;
  }): Promise<BankCategoryMappingWithCategory> {
    return prisma.bankCategoryMapping.upsert({
      where: { normalizedBankCategory: data.normalizedBankCategory },
      update: {
        rawBankCategory: data.rawBankCategory,
        categoryId: data.categoryId,
      },
      create: data,
      include: bankCategoryMappingInclude,
    });
  }

  static async remove(id: string): Promise<void> {
    await prisma.bankCategoryMapping.delete({ where: { id } });
  }
}