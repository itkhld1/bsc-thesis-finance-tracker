import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getSpentPercentage, getStatusColor } from "@/data/budgetData";
import { Target } from "lucide-react";

interface BudgetCategory {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  color: string;
}

interface BudgetStatusProps {
  categories: BudgetCategory[];
}

export function BudgetStatus({ categories }: BudgetStatusProps) {
  if (!categories || categories.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-[350px] border-slate-100 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
          <Target className="w-6 h-6 text-slate-200" />
        </div>
        <p className="text-sm font-bold text-slate-900 uppercase tracking-wider">No Budgets</p>
        <p className="text-xs text-slate-500 mt-1">Set category limits in the Budget page</p>
      </Card>
    );
  }

  return (
    <Card className="h-full border-slate-100 shadow-sm overflow-hidden">
      <CardHeader className="pb-2 p-4 sm:p-6 p-3 sm:p-6 pb-2">
        <CardTitle className="text-xs sm:text-base sm:text-sm sm:text-lg font-bold tracking-tight">Budget Tracking</CardTitle>
        <CardDescription className="text-[10px] sm:text-xs">Current month usage by category</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 pt-2 p-4 sm:p-6 max-h-[200px] sm:max-h-[350px] overflow-y-auto scrollbar-none p-3 sm:p-6">
        {categories.map((cat) => {
          const percentage = getSpentPercentage(cat.spent, cat.allocated);
          const statusColor = getStatusColor(percentage);
          const isOver = percentage >= 100;
          
          return (
            <div key={cat.id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-medium text-foreground">{cat.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-foreground">₺{cat.spent.toLocaleString()}</span>
                  <span className="text-muted-foreground mx-1">/</span>
                  <span className="text-muted-foreground text-xs font-bold">₺{cat.allocated.toLocaleString()}</span>
                </div>
              </div>
              <div className="relative pt-1">
                <Progress 
                  value={Math.min(percentage, 100)} 
                  className="h-2 bg-slate-100"
                />
                <div 
                  className="absolute top-0 h-2 rounded-full opacity-20 transition-all duration-500"
                  style={{ 
                    width: `${Math.min(percentage, 100)}%`, 
                    backgroundColor: statusColor 
                  }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold">
                <span style={{ color: statusColor }}>
                  {percentage >= 100 ? "Limit Reached" : `${percentage}% Used`}
                </span>
                <span className="text-muted-foreground">
                  ₺{(cat.allocated - cat.spent).toLocaleString()} {cat.allocated - cat.spent < 0 ? 'Over' : 'Left'}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
