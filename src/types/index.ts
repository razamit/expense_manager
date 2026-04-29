export interface AccountDTO {
  id: string;
  displayName: string;
  companyType: string;
  accountNumber: string | null;
  credentialSourceAccountId: string | null;
  lastScrapedAt: string | null;
  lastBalance: number | null;
  isActive: boolean;
}

export interface TransactionDTO {
  id: string;
  accountId: string;
  accountName?: string;
  externalId: string | null;
  date: string;
  processedDate: string | null;
  originalAmount: number;
  originalCurrency: string;
  chargedAmount: number;
  chargedCurrency: string;
  description: string;
  memo: string | null;
  bankCategory: string | null;
  rawTransaction: Record<string, unknown> | null;
  transactionType: string;
  installmentNumber: number | null;
  installmentTotal: number | null;
  status: string;
  direction: string;
  categoryId: string | null;
  categoryName?: string;
  categoryColor?: string;
  isCategorizedByRule: boolean;
  isExcluded: boolean;
}

export interface CategoryDTO {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  parentId: string | null;
  parentName?: string | null;
  isSystem: boolean;
  childCount?: number;
  isLeaf?: boolean;
  transactionCount?: number;
  totalSpent?: number;
}

export interface CategoryRuleDTO {
  id: string;
  categoryId: string;
  categoryName?: string;
  matchField: string;
  matchPattern: string;
  isRegex: boolean;
  priority: number;
}

export interface ScrapeRunDTO {
  id: string;
  accountId: string;
  accountName?: string;
  startedAt: string;
  completedAt: string | null;
  status: string;
  errorType: string | null;
  errorMessage: string | null;
  txnCount: number;
  newTxnCount: number;
}

export interface BudgetDTO {
  id: string;
  categoryId: string;
  categoryName?: string;
  categoryColor?: string;
  monthlyLimit: number;
  currentSpent?: number;
  percentUsed?: number;
}

export interface ScrapeBindingOption {
  accountNumber: string;
  balance?: number | null;
  transactionCount: number;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  categoryId?: string;
  direction?: string;
  status?: string;
  search?: string;
  uncategorizedOnly?: boolean;
  excludeExcluded?: boolean;
  page?: number;
  pageSize?: number;
}

export interface SpendingByCategory {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  totalAmount: number;
  transactionCount: number;
  percentOfTotal: number;
}

export interface IncomeExpenseTrend {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface AnomalyAlert {
  type: "high_spending" | "new_recurring" | "large_transaction" | "missing_expected";
  severity: "warning" | "alert";
  title: string;
  description: string;
  categoryId?: string;
  transactionId?: string;
  amount?: number;
  expectedAmount?: number;
}

export interface ScrapeProgress {
  accountId: string;
  accountName: string;
  status:
    | "pending"
    | "scraping"
    | "importing"
    | "done"
    | "error"
    | "binding-needed";
  message?: string;
  txnCount?: number;
  newTxnCount?: number;
  credentialOwnerAccountId?: string;
  credentialOwnerName?: string;
  matchedAccountNumber?: string | null;
  availableBindings?: ScrapeBindingOption[];
}

export interface DashboardSummary {
  totalExpenseThisMonth: number;
  totalIncomeThisMonth: number;
  netThisMonth: number;
  uncategorizedCount: number;
  topCategories: SpendingByCategory[];
  recentTransactions: TransactionDTO[];
  anomalies: AnomalyAlert[];
  budgetAlerts: BudgetDTO[];
}
