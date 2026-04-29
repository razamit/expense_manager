import {
  getCategoryDisplayName,
  sortCategoriesByDisplayName,
} from "@/lib/category-hierarchy";
import type {
  BankCategoryMappingDTO,
  BankCategorySuggestionReason,
  BankCategorySuggestionDTO,
  CategoryDTO,
} from "@/types";

const MIN_FUZZY_SUGGESTION_SCORE = 0.6;
const MIN_SEMANTIC_SUGGESTION_SCORE = 0.58;
const MIN_FUZZY_QUERY_LENGTH = 2;
const MIN_TOKEN_LENGTH = 2;
const AMBIGUOUS_SCORE_DELTA = 0.05;

const SEMANTIC_TOKEN_MAP: Record<string, string[]> = {
  food: ["groceries", "restaurants"],
  grocery: ["groceries"],
  groceries: ["groceries"],
  supermarket: ["groceries"],
  supermarkets: ["groceries"],
  market: ["groceries", "shopping"],
  dining: ["restaurants"],
  restaurant: ["restaurants"],
  restaurants: ["restaurants"],
  cafe: ["restaurants"],
  coffee: ["restaurants"],
  transport: ["transportation"],
  transportation: ["transportation"],
  transit: ["transportation"],
  commute: ["transportation"],
  taxi: ["transportation"],
  travel: ["transportation"],
  rideshare: ["transportation"],
  ride: ["transportation"],
  car: ["transportation"],
  auto: ["transportation"],
  vehicle: ["transportation"],
  fuel: ["transportation"],
  gas: ["transportation", "utilities"],
  parking: ["transportation"],
  toll: ["transportation"],
  housing: ["housing"],
  home: ["housing"],
  rent: ["housing"],
  mortgage: ["housing"],
  utilities: ["utilities"],
  utility: ["utilities"],
  electricity: ["utilities"],
  electric: ["utilities"],
  water: ["utilities"],
  internet: ["utilities"],
  wifi: ["utilities"],
  phone: ["utilities"],
  mobile: ["utilities"],
  cellular: ["utilities"],
  telecom: ["utilities"],
  healthcare: ["healthcare"],
  medical: ["healthcare"],
  medicine: ["healthcare"],
  pharmacy: ["healthcare"],
  doctor: ["healthcare"],
  dental: ["healthcare"],
  education: ["education"],
  school: ["education"],
  tuition: ["education"],
  university: ["education"],
  entertainment: ["entertainment"],
  movie: ["entertainment"],
  cinema: ["entertainment"],
  music: ["entertainment"],
  gaming: ["entertainment"],
  shopping: ["shopping"],
  retail: ["shopping"],
  apparel: ["shopping"],
  clothing: ["shopping"],
  fashion: ["shopping"],
  insurance: ["insurance"],
  subscription: ["subscriptions"],
  subscriptions: ["subscriptions"],
  streaming: ["subscriptions"],
  membership: ["subscriptions"],
  salary: ["salary"],
  payroll: ["salary"],
  income: ["salary"],
  transfer: ["transfers"],
  transfers: ["transfers"],
  withdrawal: ["transfers"],
  deposit: ["transfers", "salary"],
  מזון: ["groceries", "restaurants"],
  סופר: ["groceries"],
  סופרמרקט: ["groceries"],
  מרכול: ["groceries"],
  מסעדה: ["restaurants"],
  מסעדות: ["restaurants"],
  אוכל: ["groceries", "restaurants"],
  קפה: ["restaurants"],
  תחבורה: ["transportation"],
  נסיעה: ["transportation"],
  נסיעות: ["transportation"],
  מונית: ["transportation"],
  רכבת: ["transportation"],
  דלק: ["transportation", "utilities"],
  חניה: ["transportation"],
  רכב: ["transportation"],
  דיור: ["housing"],
  שכירות: ["housing"],
  משכנתא: ["housing"],
  בית: ["housing"],
  חשמל: ["utilities"],
  מים: ["utilities"],
  גז: ["utilities", "transportation"],
  אינטרנט: ["utilities"],
  תקשורת: ["utilities"],
  סלולר: ["utilities"],
  טלפון: ["utilities"],
  בריאות: ["healthcare"],
  רפואה: ["healthcare"],
  רופא: ["healthcare"],
  מרפאה: ["healthcare"],
  ביתמרקחת: ["healthcare"],
  ביטוח: ["insurance"],
  חינוך: ["education"],
  לימודים: ["education"],
  ביתספר: ["education"],
  פנאי: ["entertainment"],
  בידור: ["entertainment"],
  סרטים: ["entertainment"],
  קניות: ["shopping"],
  ביגוד: ["shopping"],
  הלבשה: ["shopping"],
  מנוי: ["subscriptions"],
  מנויים: ["subscriptions"],
  משכורת: ["salary"],
  שכר: ["salary"],
  העברה: ["transfers"],
  העברות: ["transfers"],
};

type ScoredCategorySuggestion = {
  category: CategoryDTO;
  filterText: string;
  reason: Exclude<BankCategorySuggestionReason, "explicit-mapping">;
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
      const displayName = getCategoryDisplayName(mappedCategory);

      return {
        categoryId: mappedCategory.id,
        categoryDisplayName: displayName,
        filterText: displayName,
        reason: "explicit-mapping",
      };
    }
  }

  if (normalizedBankCategory.length < MIN_FUZZY_QUERY_LENGTH) {
    return null;
  }

  const scoredCategories = sortCategoriesByDisplayName(selectableCategories)
    .map((category) =>
      scoreCategorySuggestion(category, normalizedBankCategory)
    )
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (left.reason !== right.reason) {
        return left.reason === "fuzzy-category-name" ? -1 : 1;
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

  if (!meetsSuggestionThreshold(bestSuggestion)) {
    return null;
  }

  if (
    secondBestSuggestion &&
    bestSuggestion.score < 1 &&
    bestSuggestion.score - secondBestSuggestion.score < AMBIGUOUS_SCORE_DELTA &&
    bestSuggestion.reason === secondBestSuggestion.reason &&
    bestSuggestion.lengthGap === secondBestSuggestion.lengthGap
  ) {
    return null;
  }

  return {
    categoryId: bestSuggestion.category.id,
    categoryDisplayName: bestSuggestion.filterText,
    filterText: bestSuggestion.filterText,
    reason: bestSuggestion.reason,
  };
}

function scoreCategorySuggestion(
  category: CategoryDTO,
  normalizedBankCategory: string
): ScoredCategorySuggestion {
  const normalizedCategoryName = normalizeBankCategoryKey(category.name);
  const fuzzyScore = getCategoryNameScore(
    normalizedBankCategory,
    normalizedCategoryName
  );
  const semanticScore = getSemanticCategoryScore(
    normalizedBankCategory,
    normalizedCategoryName
  );
  const filterText = getCategoryDisplayName(category);

  return {
    category,
    filterText,
    reason:
      semanticScore > fuzzyScore
        ? "semantic-category-similarity"
        : "fuzzy-category-name",
    score: Math.max(fuzzyScore, semanticScore),
    lengthGap: Math.abs(
      normalizedBankCategory.length - normalizedCategoryName.length
    ),
  };
}

function meetsSuggestionThreshold(candidate: ScoredCategorySuggestion): boolean {
  if (candidate.reason === "semantic-category-similarity") {
    return candidate.score >= MIN_SEMANTIC_SUGGESTION_SCORE;
  }

  return candidate.score >= MIN_FUZZY_SUGGESTION_SCORE;
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

function getSemanticCategoryScore(
  normalizedBankCategory: string,
  normalizedCategoryName: string
): number {
  const bankConcepts = getSemanticConcepts(normalizedBankCategory);
  const categoryConcepts = getSemanticConcepts(normalizedCategoryName);

  if (bankConcepts.size === 0 || categoryConcepts.size === 0) {
    return 0;
  }

  const overlap = getConceptOverlapScore(bankConcepts, categoryConcepts);

  if (overlap === 0) {
    return 0;
  }

  if (isSubsetMatch(bankConcepts, categoryConcepts)) {
    return 0.72 + overlap * 0.18;
  }

  return 0.52 + overlap * 0.22;
}

function getSemanticConcepts(value: string): Set<string> {
  const concepts = new Set<string>();

  for (const token of tokenize(value)) {
    for (const variant of getTokenVariants(token)) {
      concepts.add(variant);

      const mappedConcepts = SEMANTIC_TOKEN_MAP[variant];
      if (!mappedConcepts) {
        continue;
      }

      for (const mappedConcept of mappedConcepts) {
        concepts.add(mappedConcept);
      }
    }
  }

  return concepts;
}

function getTokenVariants(token: string): Set<string> {
  const variants = new Set<string>([token]);

  for (const prefixVariant of getPrefixedVariants(token)) {
    variants.add(prefixVariant);
  }

  for (const variant of Array.from(variants)) {
    for (const singularVariant of getSingularVariants(variant)) {
      variants.add(singularVariant);
    }
  }

  return new Set(
    Array.from(variants).filter((variant) => variant.length >= MIN_TOKEN_LENGTH)
  );
}

function getPrefixedVariants(token: string): string[] {
  const variants: string[] = [];

  for (const prefix of ["ו", "ה", "ב", "כ", "ל", "מ", "ש"]) {
    if (token.startsWith(prefix) && token.length > prefix.length + 1) {
      variants.push(token.slice(prefix.length));
    }
  }

  return variants;
}

function getSingularVariants(token: string): string[] {
  const variants = new Set<string>();

  if (token.endsWith("ies") && token.length > 4) {
    variants.add(`${token.slice(0, -3)}y`);
  }

  if (token.endsWith("es") && token.length > 4) {
    variants.add(token.slice(0, -2));
  }

  if (token.endsWith("s") && token.length > 3) {
    variants.add(token.slice(0, -1));
  }

  if (token.endsWith("ים") && token.length > 3) {
    variants.add(token.slice(0, -2));
  }

  if (token.endsWith("ות") && token.length > 3) {
    variants.add(token.slice(0, -2));
  }

  if (token.endsWith("ה") && token.length > 2) {
    variants.add(token.slice(0, -1));
  }

  return Array.from(variants);
}

function getConceptOverlapScore(
  bankConcepts: Set<string>,
  categoryConcepts: Set<string>
): number {
  let overlapCount = 0;

  for (const concept of categoryConcepts) {
    if (bankConcepts.has(concept)) {
      overlapCount += 1;
    }
  }

  return overlapCount / Math.max(bankConcepts.size, categoryConcepts.size);
}

function isSubsetMatch(
  bankConcepts: Set<string>,
  categoryConcepts: Set<string>
): boolean {
  if (bankConcepts.size === 0 || categoryConcepts.size === 0) {
    return false;
  }

  for (const concept of categoryConcepts) {
    if (!bankConcepts.has(concept)) {
      return false;
    }
  }

  return true;
}

function tokenize(value: string): Set<string> {
  return new Set(
    value
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => token.length >= MIN_TOKEN_LENGTH)
  );
}