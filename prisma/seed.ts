import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: "Groceries", icon: "shopping-cart", color: "#22c55e", isSystem: true },
  { name: "Restaurants", icon: "utensils", color: "#f97316", isSystem: true },
  { name: "Transportation", icon: "car", color: "#3b82f6", isSystem: true },
  { name: "Housing", icon: "home", color: "#8b5cf6", isSystem: true },
  { name: "Utilities", icon: "zap", color: "#eab308", isSystem: true },
  { name: "Healthcare", icon: "heart-pulse", color: "#ef4444", isSystem: true },
  { name: "Education", icon: "graduation-cap", color: "#06b6d4", isSystem: true },
  { name: "Entertainment", icon: "tv", color: "#ec4899", isSystem: true },
  { name: "Shopping", icon: "shopping-bag", color: "#a855f7", isSystem: true },
  { name: "Insurance", icon: "shield", color: "#64748b", isSystem: true },
  { name: "Subscriptions", icon: "repeat", color: "#f43f5e", isSystem: true },
  { name: "Salary", icon: "banknote", color: "#10b981", isSystem: true },
  { name: "Transfers", icon: "arrow-left-right", color: "#94a3b8", isSystem: true },
  { name: "Other", icon: "circle-dot", color: "#737373", isSystem: true },
];

const HEBREW_MERCHANT_RULES: {
  pattern: string;
  categoryName: string;
}[] = [
  { pattern: "שופרסל", categoryName: "Groceries" },
  { pattern: "רמי לוי", categoryName: "Groceries" },
  { pattern: "מגה", categoryName: "Groceries" },
  { pattern: "יוחננוף", categoryName: "Groceries" },
  { pattern: "אושר עד", categoryName: "Groceries" },
  { pattern: "ויקטורי", categoryName: "Groceries" },
  { pattern: "חצי חינם", categoryName: "Groceries" },
  { pattern: "סופר פארם", categoryName: "Healthcare" },
  { pattern: "בי אס", categoryName: "Healthcare" },
  { pattern: "דור אלון", categoryName: "Transportation" },
  { pattern: "פז ", categoryName: "Transportation" },
  { pattern: "סונול", categoryName: "Transportation" },
  { pattern: "דלק", categoryName: "Transportation" },
  { pattern: "רב קו", categoryName: "Transportation" },
  { pattern: "מוניות", categoryName: "Transportation" },
  { pattern: "עיריית", categoryName: "Utilities" },
  { pattern: "חשמל", categoryName: "Utilities" },
  { pattern: "מים", categoryName: "Utilities" },
  { pattern: "בזק", categoryName: "Utilities" },
  { pattern: "פרטנר", categoryName: "Utilities" },
  { pattern: "סלקום", categoryName: "Utilities" },
  { pattern: "הוט", categoryName: "Utilities" },
  { pattern: "נטפליקס", categoryName: "Subscriptions" },
  { pattern: "NETFLIX", categoryName: "Subscriptions" },
  { pattern: "SPOTIFY", categoryName: "Subscriptions" },
  { pattern: "APPLE.COM", categoryName: "Subscriptions" },
  { pattern: "GOOGLE", categoryName: "Subscriptions" },
  { pattern: "AMAZON", categoryName: "Shopping" },
  { pattern: "ALIEXPRESS", categoryName: "Shopping" },
  { pattern: "קניון", categoryName: "Shopping" },
  { pattern: "H&M", categoryName: "Shopping" },
  { pattern: "ZARA", categoryName: "Shopping" },
  { pattern: "מקדונלד", categoryName: "Restaurants" },
  { pattern: "ברגר", categoryName: "Restaurants" },
  { pattern: "פיצה", categoryName: "Restaurants" },
  { pattern: "קפה", categoryName: "Restaurants" },
  { pattern: "מסעדה", categoryName: "Restaurants" },
  { pattern: "ביטוח", categoryName: "Insurance" },
  { pattern: "הראל", categoryName: "Insurance" },
  { pattern: "מגדל", categoryName: "Insurance" },
  { pattern: "כללית", categoryName: "Healthcare" },
  { pattern: "מכבי", categoryName: "Healthcare" },
  { pattern: "לאומית", categoryName: "Healthcare" },
  { pattern: "משכורת", categoryName: "Salary" },
  { pattern: "שכר", categoryName: "Salary" },
];

async function main() {
  console.log("Seeding database...");

  const categoryMap = new Map<string, string>();

  for (const cat of DEFAULT_CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { id: cat.name.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: {
        id: cat.name.toLowerCase().replace(/\s+/g, "-"),
        ...cat,
      },
    });
    categoryMap.set(cat.name, created.id);
  }

  console.log(`Created ${DEFAULT_CATEGORIES.length} categories`);

  let ruleCount = 0;
  for (const rule of HEBREW_MERCHANT_RULES) {
    const categoryId = categoryMap.get(rule.categoryName);
    if (!categoryId) continue;

    await prisma.categoryRule.upsert({
      where: {
        id: `seed-${rule.pattern.replace(/\s+/g, "-").toLowerCase()}`,
      },
      update: {},
      create: {
        id: `seed-${rule.pattern.replace(/\s+/g, "-").toLowerCase()}`,
        categoryId,
        matchField: "description",
        matchPattern: rule.pattern,
        isRegex: false,
        priority: 0,
      },
    });
    ruleCount++;
  }

  console.log(`Created ${ruleCount} category rules`);
  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
