export interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  allocated: number;
  spent: number;
  color: string;
}

export interface MonthlyBudget {
  month: string;
  year: number;
  totalBudget: number;
  totalSpent: number;
  categories: BudgetCategory[];
}

export const mockBudgetCategories: BudgetCategory[] = [
  { id: "1", name: "Food & Dining", icon: "Utensils", allocated: 3000, spent: 2450, color: "hsl(var(--chart-1))" },
  { id: "2", name: "Transportation", icon: "Car", allocated: 1500, spent: 1200, color: "hsl(var(--chart-2))" },
  { id: "3", name: "Shopping", icon: "ShoppingBag", allocated: 2000, spent: 2350, color: "hsl(var(--chart-3))" },
  { id: "4", name: "Entertainment", icon: "Gamepad2", allocated: 1000, spent: 650, color: "hsl(var(--chart-4))" },
  { id: "5", name: "Utilities", icon: "Zap", allocated: 800, spent: 720, color: "hsl(var(--chart-5))" },
  { id: "6", name: "Healthcare", icon: "Heart", allocated: 500, spent: 180, color: "hsl(var(--chart-6))" },
  { id: "7", name: "Education", icon: "GraduationCap", allocated: 1200, spent: 900, color: "hsl(var(--chart-7))" },
  { id: "8", name: "Subscriptions", icon: "CreditCard", allocated: 500, spent: 480, color: "hsl(var(--chart-8))" },
];

export const mockMonthlyBudget: MonthlyBudget = {
  month: "December",
  year: 2024,
  totalBudget: 10500,
  totalSpent: 8930,
  categories: mockBudgetCategories,
};

export const monthlySpendingHistory = [
  { month: "Jul", budget: 10000, spent: 8500 },
  { month: "Aug", budget: 10000, spent: 9200 },
  { month: "Sep", budget: 10500, spent: 9800 },
  { month: "Oct", budget: 10500, spent: 8900 },
  { month: "Nov", budget: 10500, spent: 9500 },
  { month: "Dec", budget: 10500, spent: 8930 },
];

export function getSpentPercentage(spent: number, allocated: number): number {
  if (allocated === 0) return 0;
  return Math.round((spent / allocated) * 100);
}

export function getStatusColor(percentage: number): string {
  if (percentage >= 100) return "hsl(var(--destructive))";
  if (percentage >= 80) return "hsl(38, 92%, 50%)";
  return "hsl(var(--primary))";
}

export function formatCurrency(amount: number): string {
  return `₺${amount.toLocaleString()}`;
}
