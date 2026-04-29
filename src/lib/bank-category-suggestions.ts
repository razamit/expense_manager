import { sortCategoriesByDisplayName } from "@/lib/category-hierarchy";
import type {
  BankCategoryMappingDTO,
  BankCategorySuggestionDTO,
  CategoryDTO,
} from "@/types";

const MIN_FUZZY_SUGGESTION_SCORE = 0.6;
const MIN_FUZZY_QUERY_LENGTH = 2;
const MIN_TOKEN_LENGTH = 2;
const AMBIGUOUS_SCORE_DELTA = 0.05;

type ScoredCategorySuggestion = {
  category: CategoryDTO;
  filterText: string;
  score: number;
  lengthGap: number;
};

export function normalizeBankCategoryKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/["'`׳״]/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getBankCategorySuggestion({
  bankCategory,
  selectableCategories,
  mappings,
}: {
  bankCategory: string | null | undefined;
  selectableCategories: CategoryDTO[];
  mappings: BankCategoryMappingDTO[];
}): BankCategorySuggestionDTO | null {
  const normalizedBankCategory = normalizeBankCategoryKey(bankCategory ?? "");
  if (!normalizedBankCategory) {
    return null;
  }

  const explicitMapping = mappings.find(
    (mapping) => mapping.normalizedBankCategory === normalizedBankCategory
  );

  if (explicitMapping) {
    const mappedCategory = selectableCategories.find(
      (category) => category.id === explicitMapping.categoryId
    );

    if (mappedCategory) {
      return {
        filterText: mappedCategory.name,
        reason: "explicit-mapping",
      };
    }
  }

  if (normalizedBankCategory.length < MIN_FUZZY_QUERY_LENGTH) {
    return null;
  }

  const scoredCategories = sortCategoriesByDisplayName(selectableCategories)
    .map((category) => {
      const normalizedCategoryName = normalizeBankCategoryKey(category.name);
      const score = getCategoryNameScore(
        normalizedBankCategory,
        normalizedCategoryName
      );

      return {
        category,
        filterText: category.name,
        score,
        lengthGap: Math.abs(
          normalizedBankCategory.length - normalizedCategoryName.length
        ),
      } satisfies ScoredCategorySuggestion;
    })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (left.lengthGap !== right.lengthGap) {
        return left.lengthGap - right.lengthGap;
      }

      return left.filterText.localeCompare(right.filterText);
    });

  const bestSuggestion = scoredCategories[0];
  const secondBestSuggestion = scoredCategories[1];

  if (!bestSuggestion) {
    return null;
  }

  if (bestSuggestion.score < MIN_FUZZY_SUGGESTION_SCORE) {
    return null;
  }

  if (
    secondBestSuggestion &&
    bestSuggestion.score < 1 &&
    bestSuggestion.score - secondBestSuggestion.score < AMBIGUOUS_SCORE_DELTA &&
    bestSuggestion.lengthGap === secondBestSuggestion.lengthGap
  ) {
    return null;
  }

  return {
    filterText: bestSuggestion.filterText,
    reason: "fuzzy-category-name",
  };
}

function getCategoryNameScore(
  normalizedBankCategory: string,
  normalizedCategoryName: string
): number {
  if (!normalizedCategoryName) {
    return 0;
  }

  if (normalizedCategoryName === normalizedBankCategory) {
    return 1;
  }

  if (
    normalizedCategoryName.startsWith(normalizedBankCategory) ||
    normalizedBankCategory.startsWith(normalizedCategoryName)
  ) {
    return 0.88;
  }

  if (
    normalizedCategoryName.includes(normalizedBankCategory) ||
    normalizedBankCategory.includes(normalizedCategoryName)
  ) {
    return 0.76;
  }

  const tokenOverlap = getTokenOverlapScore(
    normalizedBankCategory,
    normalizedCategoryName
  );

  if (tokenOverlap === 0) {
    return 0;
  }

  return 0.45 + tokenOverlap * 0.25;
}

function getTokenOverlapScore(
  normalizedBankCategory: string,
  normalizedCategoryName: string
): number {
  const bankTokens = tokenize(normalizedBankCategory);
  const categoryTokens = tokenize(normalizedCategoryName);

  if (bankTokens.size === 0 || categoryTokens.size === 0) {
    return 0;
  }

  let overlapCount = 0;

  for (const token of categoryTokens) {
    if (bankTokens.has(token)) {
      overlapCount += 1;
    }
  }

  return overlapCount / Math.max(bankTokens.size, categoryTokens.size);
}

function tokenize(value: string): Set<string> {
  return new Set(
    value
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => token.length >= MIN_TOKEN_LENGTH)
  );
}