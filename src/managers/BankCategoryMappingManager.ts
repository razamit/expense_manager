import { getCompanyTypeIdsByKind } from "@/constants/company-metadata";
import { getCategoryDisplayName } from "@/lib/category-hierarchy";
import { normalizeBankCategoryKey } from "@/lib/bank-category-suggestions";
import {
  CategoryHierarchyError,
  CategoryHierarchyManager,
} from "@/managers/CategoryHierarchyManager";
import {
  BankCategoryMappingRepository,
  type BankCategoryMappingWithCategory,
} from "@/repositories/BankCategoryMappingRepository";
import { TransactionRepository } from "@/repositories/TransactionRepository";
import type {
  BankCategoryMappingCatalogDTO,
  BankCategoryMappingDTO,
  ObservedBankCategoryDTO,
} from "@/types";

type CreateBankCategoryMappingInput = {
  bankCategory: string;
  categoryId: string;
};

export class BankCategoryMappingError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = "BankCategoryMappingError";
    this.statusCode = statusCode;
  }
}

export class BankCategoryMappingManager {
  static async listMappings(): Promise<BankCategoryMappingDTO[]> {
    const mappings = await BankCategoryMappingRepository.findAll();
    return mappings.map((mapping) => this.toDTO(mapping));
  }

  static async listMappingCatalog(): Promise<BankCategoryMappingCatalogDTO> {
    const [mappings, observedBankCategories] = await Promise.all([
      this.listMappings(),
      this.listObservedCreditCardBankCategories(),
    ]);

    return {
      mappings,
      observedBankCategories,
    };
  }

  static async createMapping(
    data: CreateBankCategoryMappingInput
  ): Promise<BankCategoryMappingDTO> {
    const rawBankCategory = data.bankCategory.trim();
    const normalizedBankCategory = normalizeBankCategoryKey(rawBankCategory);

    if (!normalizedBankCategory) {
      throw new BankCategoryMappingError("Bank category is required.");
    }

    await CategoryHierarchyManager.assertLeafCategory(data.categoryId);

    const mapping = await BankCategoryMappingRepository.upsertByNormalizedBankCategory({
      rawBankCategory,
      normalizedBankCategory,
      categoryId: data.categoryId,
    });

    return this.toDTO(mapping);
  }

  static async removeMapping(id: string): Promise<void> {
    const mapping = await BankCategoryMappingRepository.findById(id);

    if (!mapping) {
      throw new BankCategoryMappingError("Bank category mapping not found.", 404);
    }

    await BankCategoryMappingRepository.remove(id);
  }

  private static async listObservedCreditCardBankCategories(): Promise<ObservedBankCategoryDTO[]> {
    const creditCompanyTypes = getCompanyTypeIdsByKind("credit");
    const observedTransactions =
      await TransactionRepository.findObservedBankCategoriesForCompanyTypes(
        creditCompanyTypes
      );
    const observationsByNormalizedKey = new Map<
      string,
      {
        rawBankCategoryCounts: Map<string, number>;
        accountNames: Set<string>;
        occurrenceCount: number;
      }
    >();

    for (const transaction of observedTransactions) {
      const rawBankCategory = transaction.bankCategory.trim();
      const normalizedBankCategory = normalizeBankCategoryKey(rawBankCategory);

      if (!normalizedBankCategory) {
        continue;
      }

      const currentObservation = observationsByNormalizedKey.get(
        normalizedBankCategory
      ) ?? {
        rawBankCategoryCounts: new Map<string, number>(),
        accountNames: new Set<string>(),
        occurrenceCount: 0,
      };

      currentObservation.rawBankCategoryCounts.set(
        rawBankCategory,
        (currentObservation.rawBankCategoryCounts.get(rawBankCategory) ?? 0) + 1
      );
      currentObservation.accountNames.add(transaction.accountName);
      currentObservation.occurrenceCount += 1;

      observationsByNormalizedKey.set(
        normalizedBankCategory,
        currentObservation
      );
    }

    return Array.from(observationsByNormalizedKey.entries())
      .map(([normalizedBankCategory, observation]) => ({
        rawBankCategory: pickDisplayBankCategory(observation.rawBankCategoryCounts),
        normalizedBankCategory,
        occurrenceCount: observation.occurrenceCount,
        accountNames: Array.from(observation.accountNames).sort((left, right) =>
          left.localeCompare(right)
        ),
      }))
      .sort((left, right) =>
        left.rawBankCategory.localeCompare(right.rawBankCategory)
      );
  }

  private static toDTO(
    mapping: BankCategoryMappingWithCategory
  ): BankCategoryMappingDTO {
    return {
      id: mapping.id,
      rawBankCategory: mapping.rawBankCategory,
      normalizedBankCategory: mapping.normalizedBankCategory,
      categoryId: mapping.categoryId,
      categoryName: getCategoryDisplayName({
        id: mapping.category.id,
        name: mapping.category.name,
        icon: null,
        color: null,
        parentId: null,
        parentName: mapping.category.parent?.name ?? null,
        isSystem: false,
      }),
      createdAt: mapping.createdAt.toISOString(),
      updatedAt: mapping.updatedAt.toISOString(),
    };
  }
}

export function isBankCategoryMappingError(
  error: unknown
): error is BankCategoryMappingError | CategoryHierarchyError {
  return (
    error instanceof BankCategoryMappingError ||
    error instanceof CategoryHierarchyError
  );
}

function pickDisplayBankCategory(rawBankCategoryCounts: Map<string, number>): string {
  return Array.from(rawBankCategoryCounts.entries())
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0]);
    })[0]?.[0] ?? "";
}