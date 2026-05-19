import { Wallet, TrendingUp, TrendingDown, PiggyBank, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { CategoryChart } from "@/components/dashboard/CategoryChart";
import { SpendingTrends } from "@/components/dashboard/SpendingTrends";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { AIRecommendations } from "@/components/dashboard/AIRecommendations";
import { AIWhatIfSimulator } from "@/components/dashboard/AIWhatIfSimulator";
import { GoalsTracker } from "@/components/dashboard/GoalsTracker";
import { AIFeatureHighlight } from "@/components/ai/AIFeatureHighlight";
import { AIPredictiveChart } from "@/components/ai/AIPredictiveChart";
import { BudgetStatus } from "@/components/dashboard/BudgetStatus";
import { EditIncomeDialog } from "@/components/dashboard/EditIncomeDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { useExpenses } from "@/hooks/useExpenses";
import { useBudget } from "@/hooks/useBudget";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

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
  const { data: budgetLimits, isLoading: isBudgetLoading } = useBudget();
  const { user } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [compareWithPrevious, setCompareWithPrevious] = useState(true);

  const isLoading = isCatsLoading || isExpensesLoading || isBudgetLoading;

  // --- START REAL-TIME CALCULATIONS ---
  const monthlyIncome = Number(user?.income) || 0; 
  const monthIdx = months.indexOf(selectedMonth);
  
  // Current Month Data
  const currentMonthExpenses = useMemo(() => {
    return expenses?.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === monthIdx && d.getFullYear() === selectedYear;
    }) || [];
  }, [expenses, monthIdx, selectedYear]);

  const monthlyExpensesTotal = currentMonthExpenses.reduce((acc, e) => acc + e.amount, 0);

  // Previous Month Data for Comparison
  const prevMonthIdx = monthIdx === 0 ? 11 : monthIdx - 1;
  const prevYear = monthIdx === 0 ? selectedYear - 1 : selectedYear;
  const comparisonExpenses = useMemo(() => {
    return expenses?.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === prevMonthIdx && d.getFullYear() === prevYear;
    }) || [];
  }, [expenses, prevMonthIdx, prevYear]);

  const comparisonExpensesTotal = comparisonExpenses.reduce((acc, e) => acc + e.amount, 0);

  // Metrics
  const netCashFlow = monthlyIncome - monthlyExpensesTotal;
  const comparisonNetCashFlow = monthlyIncome - comparisonExpensesTotal;

  const savingsRate = monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpensesTotal) / monthlyIncome) * 100) : 0;
  const comparisonSavingsRate = monthlyIncome > 0 ? Math.round(((monthlyIncome - comparisonExpensesTotal) / monthlyIncome) * 100) : 0;
  
  // Trend Calculations
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const expenseTrend = calculateTrend(monthlyExpensesTotal, comparisonExpensesTotal);
  const cashFlowTrend = calculateTrend(netCashFlow, comparisonNetCashFlow);
  const savingsTrend = savingsRate - comparisonSavingsRate; 

  // Formatting helpers
  const formatCurrency = (val: number) => `₺${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  // --- END REAL-TIME CALCULATIONS ---

  const categoryData = useMemo((): ChartCategoryData[] => {
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
  }, [categories, expenses]);

  const budgetStatusData = useMemo(() => {
    if (!categories || !expenses) return [];
    
    const currentLimits: Record<string, number> = { ...DEFAULT_BUDGETS };
    budgetLimits?.forEach(limit => {
      currentLimits[limit.categoryId] = Number(limit.limitAmount);
    });

    const monthlyCategoryTotals = currentMonthExpenses.reduce((acc, expense) => {
      acc[expense.categoryId] = (acc[expense.categoryId] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return categories
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        allocated: currentLimits[cat.id] || 0,
        spent: monthlyCategoryTotals[cat.id] || 0,
        color: cat.color || "#000"
      }))
      .filter(cat => cat.allocated > 0)
      .sort((a, b) => (b.spent / b.allocated) - (a.spent / a.allocated));
  }, [categories, expenses, currentMonthExpenses, budgetLimits]);

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
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Welcome back{displayName ? (
              <>
                , <span className="text-slate-900 font-bold">{displayName}</span>
              </>
            ) : ''}! Here's your financial overview.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "h-10 px-4 transition-all text-xs font-bold uppercase tracking-wider", 
              compareWithPrevious && "bg-primary/5 border-primary/20 text-primary shadow-none"
            )}
            onClick={() => setCompareWithPrevious(!compareWithPrevious)}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            {compareWithPrevious ? "Comparison On" : "Compare"}
          </Button>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[120px] h-10 text-xs font-bold uppercase tracking-wider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[100px] h-10 text-xs font-bold uppercase tracking-wider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button asChild size="sm" className="gradient-primary h-10 px-6 font-bold uppercase tracking-widest text-xs">
            <Link to="/add-expense">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <SummaryCard
          title="Net Flow"
          value={formatCurrency(netCashFlow)}
          comparisonValue={compareWithPrevious ? formatCurrency(comparisonNetCashFlow) : undefined}
          icon={Wallet}
          variant={netCashFlow >= 0 ? "primary" : "warning"}
          description={netCashFlow >= 0 ? "Surplus" : "Deficit"}
          trend={compareWithPrevious && comparisonExpensesTotal > 0 ? {
            value: cashFlowTrend,
            isPositive: cashFlowTrend >= 0,
            label: "vs prev"
          } : undefined}
        />
        <SummaryCard
          title="Income"
          value={formatCurrency(monthlyIncome)}
          icon={TrendingUp}
          action={<EditIncomeDialog />}
        />
        <SummaryCard
          title="Expenses"
          value={formatCurrency(monthlyExpensesTotal)}
          comparisonValue={compareWithPrevious ? formatCurrency(comparisonExpensesTotal) : undefined}
          icon={TrendingDown}
          trend={compareWithPrevious && comparisonExpensesTotal > 0 ? { 
            value: expenseTrend, 
            isPositive: expenseTrend < 0,
            label: "vs prev"
          } : undefined}
        />
        <SummaryCard
          title="Savings"
          value={`${savingsRate}%`}
          comparisonValue={compareWithPrevious ? `${comparisonSavingsRate}%` : undefined}
          icon={PiggyBank}
          trend={compareWithPrevious && comparisonExpensesTotal > 0 ? { 
            value: savingsTrend, 
            isPositive: savingsTrend > 0,
            label: "pts vs prev"
          } : undefined}
        />
      </div>

      {/* Full Width Cohesive List */}
      <div className="space-y-6 sm:space-y-12">
        <AIFeatureHighlight expenses={expenses || []} />
        
        <GoalsTracker />

        <CategoryChart data={categoryData} />
        
        <div id="budget-status">
          <BudgetStatus categories={budgetStatusData} />
        </div>

        <div id="spending-trends">
          <SpendingTrends expenses={expenses || []} />
        </div>

        <AIPredictiveChart />

        <AIWhatIfSimulator />

        <div id="ai-recommendations">
           <AIRecommendations expenses={expenses || []} />
        </div>

        <RecentTransactions expenses={expenses || []} />
      </div>
    </div>
  );
}
