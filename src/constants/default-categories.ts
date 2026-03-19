export interface DefaultCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { id: "groceries", name: "Groceries", icon: "shopping-cart", color: "#22c55e" },
  { id: "restaurants", name: "Restaurants", icon: "utensils", color: "#f97316" },
  { id: "transportation", name: "Transportation", icon: "car", color: "#3b82f6" },
  { id: "housing", name: "Housing", icon: "home", color: "#8b5cf6" },
  { id: "utilities", name: "Utilities", icon: "zap", color: "#eab308" },
  { id: "healthcare", name: "Healthcare", icon: "heart-pulse", color: "#ef4444" },
  { id: "education", name: "Education", icon: "graduation-cap", color: "#06b6d4" },
  { id: "entertainment", name: "Entertainment", icon: "tv", color: "#ec4899" },
  { id: "shopping", name: "Shopping", icon: "shopping-bag", color: "#a855f7" },
  { id: "insurance", name: "Insurance", icon: "shield", color: "#64748b" },
  { id: "subscriptions", name: "Subscriptions", icon: "repeat", color: "#f43f5e" },
  { id: "salary", name: "Salary", icon: "banknote", color: "#10b981" },
  { id: "transfers", name: "Transfers", icon: "arrow-left-right", color: "#94a3b8" },
  { id: "other", name: "Other", icon: "circle-dot", color: "#737373" },
];

export const CATEGORY_COLORS = DEFAULT_CATEGORIES.map((c) => c.color);
