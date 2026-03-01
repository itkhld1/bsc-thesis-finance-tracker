import { Wallet, TrendingUp, TrendingDown, PiggyBank, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { CategoryChart } from "@/components/dashboard/CategoryChart";
import { SpendingTrends } from "@/components/dashboard/SpendingTrends";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { AIRecommendations } from "@/components/dashboard/AIRecommendations";
import { AIFeatureHighlight } from "@/components/ai/AIFeatureHighlight";
import { AIPredictiveChart } from "@/components/ai/AIPredictiveChart";
import { AISmartAlerts } from "@/components/ai/AISmartAlerts";
import { BudgetStatus } from "@/components/dashboard/BudgetStatus";
import { EditIncomeDialog } from "@/components/dashboard/EditIncomeDialog";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/useCategories";
import { useExpenses } from "@/hooks/useExpenses";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ChartCategoryData {
  name: string;
  value: number;
  color: string;
  icon?: string;
}

const DEFAULT_BUDGETS: Record<string, number> = {
  food: 3000,
  transport: 1500,
  shopping: 2000,
  entertainment: 1000,
  utilities: 2500,
  health: 1000,
  travel: 5000,
  other: 500
};

export default function Dashboard() {
  const { data: categories, isLoading: isCatsLoading } = useCategories();
  const { data: expenses, isLoading: isExpensesLoading } = useExpenses();
  const { user } = useAuth();

  const isLoading = isCatsLoading || isExpensesLoading;

  // --- START REAL-TIME CALCULATIONS ---
  const monthlyIncome = Number(user?.income) || 0; 
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const currentMonthExpenses = expenses?.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }) || [];

  const monthlyExpensesTotal = currentMonthExpenses.reduce((acc, e) => acc + e.amount, 0);

  const totalExpenses = expenses?.reduce((acc, e) => acc + e.amount, 0) || 0;
  const totalBalance = monthlyIncome - totalExpenses; 
  const savingsRate = monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpensesTotal) / monthlyIncome) * 100) : 0;
  // --- END REAL-TIME CALCULATIONS ---

  const getAggregatedCategoryData = (): ChartCategoryData[] => {
    if (!categories || !expenses) return [];
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.categoryId] = (acc[expense.categoryId] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);
    return categories
      .filter(cat => categoryTotals[cat.id])
      .map(cat => ({
        name: cat.name,
        value: categoryTotals[cat.id],
        color: cat.color || "#000",
        icon: cat.icon,
      }));
  };

  const getBudgetStatusData = () => {
    if (!categories || !expenses) return [];
    const monthlyCategoryTotals = currentMonthExpenses.reduce((acc, expense) => {
      acc[expense.categoryId] = (acc[expense.categoryId] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);
    return categories
      .filter(cat => DEFAULT_BUDGETS[cat.id])
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        allocated: DEFAULT_BUDGETS[cat.id],
        spent: monthlyCategoryTotals[cat.id] || 0,
        color: cat.color || "#000"
      }))
      .sort((a, b) => (b.spent / b.allocated) - (a.spent / a.allocated));
  };

  const categoryData = getAggregatedCategoryData();
  const budgetStatusData = getBudgetStatusData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="ml-2">Loading dashboard data...</p>
      </div>
    );
  }

  const displayName = user?.name || user?.username || user?.email;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1 ">Welcome back{displayName ? (
            <>
              , <span className="font-bold text-foreground">{displayName}</span>
            </>
          ) : ''}<span className="font-bold text-foreground">!</span> Here's your financial overview.</p>
        </div>
        <Button asChild className="gradient-primary hover:opacity-90 transition-opacity">
          <Link to="/add-expense">
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <SummaryCard
          title="Total Balance"
          value={`₺${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Wallet}
          variant="primary"
        />
        <SummaryCard
          title="Monthly Income"
          value={`₺${monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          action={<EditIncomeDialog />}
        />
        <SummaryCard
          title="Monthly Expenses"
          value={`₺${monthlyExpensesTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingDown}
          trend={{ value: 0, isPositive: true }}
        />
        <SummaryCard
          title="Savings Rate"
          value={`${savingsRate}%`}
          icon={PiggyBank}
          trend={{ value: 0, isPositive: true }}
        />
      </div>

      <AIFeatureHighlight expenses={expenses || []} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryChart data={categoryData} />
        <div id="budget-status" className="transition-all duration-500 rounded-xl">
          <BudgetStatus categories={budgetStatusData} />
        </div>
      </div>

      <div id="spending-trends" className="transition-all duration-500 rounded-xl">
        <SpendingTrends expenses={expenses || []} />
      </div>

      <AIPredictiveChart />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div id="ai-recommendations" className="lg:col-span-2 transition-all duration-500 rounded-xl">
          <AIRecommendations expenses={expenses || []} />
        </div>
        <AISmartAlerts expenses={expenses || []} />
      </div>

      <RecentTransactions expenses={expenses || []} />
    </div>
  );
}
