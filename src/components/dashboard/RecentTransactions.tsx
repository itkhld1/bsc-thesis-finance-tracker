import { Utensils, Car, Gamepad2, ShoppingBag, Zap, Heart, Plane, MoreHorizontal, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCategories } from "@/hooks/useCategories";
import { Loader2 } from "lucide-react";
import { Expense } from "@/hooks/useExpenses";
import { exportToCSV } from "@/lib/exportUtils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils,
  Car,
  Gamepad2,
  ShoppingBag,
  Zap,
  Heart,
  Plane,
  MoreHorizontal,
};

interface RecentTransactionsProps {
  expenses: Expense[];
}

export function RecentTransactions({ expenses }: RecentTransactionsProps) {
  const { data: categories, isLoading, isError, error } = useCategories();
  const recentExpenses = expenses.slice(0, 5);

  const getCategoryInfo = (categoryId: string) => {
    return categories?.find(c => c.id === categoryId) || { name: "Unknown", icon: "MoreHorizontal", color: "#666" };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="ml-2">Loading categories...</p>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-4 text-center text-destructive">
        <p>Error loading categories: {error?.message}</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-slate-100 shadow-sm text-slate-900">
      <CardHeader className="pb-2 p-3 sm:p-6 border-b border-slate-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold tracking-tight">Recent Transactions</CardTitle>
            <CardDescription className="text-[10px] sm:text-xs">Your latest spending activity</CardDescription>
          </div>
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="h-7 px-2 text-[9px] font-black uppercase tracking-tighter gap-1.5 flex-1 sm:flex-none" onClick={() => {
              const data = expenses.map(e => ({
                Date: new Date(e.date).toLocaleDateString(),
                Description: e.description,
                Amount: e.amount,
                Category: getCategoryInfo(e.categoryId).name
              }));
              exportToCSV(data, "aura-recent-transactions");
            }}>
              <Download className="w-3 h-3" />
              Export
            </Button>
            <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-[9px] font-black uppercase tracking-tighter flex-1 sm:flex-none">
              <Link to="/expenses" className="text-primary hover:text-primary/80">
                View all
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border max-h-[220px] sm:max-h-[300px] overflow-y-auto scrollbar-none">
          {recentExpenses.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              No transactions found.
            </div>
          ) : (
            recentExpenses.map((expense, index) => {
              const category = getCategoryInfo(expense.categoryId);
              const Icon = iconMap[category.icon || "MoreHorizontal"] || MoreHorizontal;

              return (
                <div
                  key={expense.id}
                  className={cn(
                    "flex items-center gap-3 p-2.5 sm:p-4 hover:bg-slate-50 transition-colors",
                    "animate-fade-in"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${category.color}15` }}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: category.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs sm:text-sm truncate leading-tight">{expense.description || "No description"}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter mt-0.5">{category.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-xs sm:text-sm text-slate-900">-₺{(Number(expense.amount) || 0).toFixed(2)}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{formatDate(expense.date)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
