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
import { Button } from "@/components/ui/button";
import { summaryData, mockExpenses } from "@/data/mockData"; // Keep mockExpenses for aggregation
import { useCategories, Category as API_Category } from "@/hooks/useCategories"; // Import useCategories hook and Category type
import { Card } from "@/components/ui/card"; // Import Card for loading/error states
import { Loader2 } from "lucide-react"; // Import Loader2 for loading indicator
import { useAuth } from "@/context/AuthContext"; // Import useAuth

// Define the shape of data expected by CategoryChart
interface ChartCategoryData {
  name: string;
  value: number;
  color: string;
  icon?: string; // Optional if not all categories have icons
}

export default function Dashboard() {
  const { data: categories, isLoading, isError, error } = useCategories(); // Fetch categories
  const { user } = useAuth(); // Access the authenticated user

  // Aggregate spending data if categories and expenses are available
  const getAggregatedCategoryData = (): ChartCategoryData[] => {
    if (!categories || categories.length === 0 || mockExpenses.length === 0) {
      return [];
    }

    const categoryTotals = mockExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return categories
      .filter(cat => categoryTotals[cat.id]) // Only include categories with spending
      .map(cat => ({
        name: cat.name,
        value: categoryTotals[cat.id],
        color: cat.color || "#000", // Provide a default color if missing
        icon: cat.icon,
      }));
  };

  const categoryData = getAggregatedCategoryData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="ml-2">Loading dashboard data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-8 text-center text-destructive">
        <p>Error loading dashboard: {error?.message}</p>
      </Card>
    );
  }

  const displayName = user?.name || user?.username || user?.email;


  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back{displayName ? `, ${displayName}` : ''}! Here's your financial overview.</p>
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
          value={`₺${summaryData.totalBalance.toLocaleString()}`}
          icon={Wallet}
          variant="primary"
        />
        <SummaryCard
          title="Monthly Income"
          value={`₺${summaryData.monthlyIncome.toLocaleString()}`}
          icon={TrendingUp}
          trend={{ value: 12, isPositive: true }}
        />
        <SummaryCard
          title="Monthly Expenses"
          value={`₺${summaryData.monthlyExpenses.toLocaleString()}`}
          icon={TrendingDown}
          trend={{ value: 8, isPositive: false }}
        />
        <SummaryCard
          title="Savings Rate"
          value={`${summaryData.savingsRate}%`}
          icon={PiggyBank}
          trend={{ value: 5, isPositive: true }}
        />
      </div>

      {/* AI Feature Highlight */}
      <AIFeatureHighlight />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryChart data={categoryData} /> {/* Pass aggregated data to CategoryChart */}
        <SpendingTrends />
      </div>

      {/* AI Predictive Analysis */}
      <AIPredictiveChart />

      {/* AI Recommendations & Smart Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AIRecommendations />
        </div>
        <AISmartAlerts />
      </div>

      {/* Recent Transactions */}
      <RecentTransactions />
    </div>
  );
}
