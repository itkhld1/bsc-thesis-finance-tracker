import { Utensils, Car, Gamepad2, ShoppingBag, Zap, Heart, Plane, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockExpenses } from "@/data/mockData"; // Keep mockExpenses for now
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCategories } from "@/hooks/useCategories"; // Import the new hook
import { Loader2 } from "lucide-react"; // Import Loader2 for loading indicator

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

export function RecentTransactions() {
  const { data: categories, isLoading, isError, error } = useCategories(); // Fetch categories using the hook
  const recentExpenses = mockExpenses.slice(0, 5); // Still using mockExpenses

  const getCategoryInfo = (categoryId: string) => {
    if (isLoading) return { name: "Loading...", icon: "MoreHorizontal", color: "#ccc" };
    if (isError) return { name: `Error: ${error?.message}`, icon: "MoreHorizontal", color: "#f00" };
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
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/expenses" className="text-primary hover:text-primary/80">
              View all
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {recentExpenses.map((expense, index) => {
            const category = getCategoryInfo(expense.category);
            const Icon = iconMap[category.icon || "MoreHorizontal"] || MoreHorizontal; // Fallback for icon

            return (
              <div
                key={expense.id}
                className={cn(
                  "flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors",
                  "animate-fade-in"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: category.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{expense.description}</p>
                  <p className="text-sm text-muted-foreground">{category.name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-foreground">-₺{expense.amount.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(expense.date)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
