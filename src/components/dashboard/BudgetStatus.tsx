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
    <Card className="h-full border-slate-100 shadow-sm overflow-hidden text-slate-900">
      <CardHeader className="pb-1 p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg font-bold tracking-tight">Budget Tracking</CardTitle>
        <CardDescription className="text-[10px] sm:text-xs">Current month usage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-2 p-4 sm:p-6 max-h-[200px] sm:max-h-none overflow-y-auto scrollbar-none">
        {categories.map((cat) => {
          const percentage = getSpentPercentage(cat.spent, cat.allocated);
          const statusColor = getStatusColor(percentage);
          
          return (
            <div key={cat.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-bold truncate">{cat.name}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-bold">₺{cat.spent.toLocaleString()}</span>
                  <span className="text-slate-400 text-[10px] ml-1">/ ₺{cat.allocated.toLocaleString()}</span>
                </div>
              </div>
              <div className="relative h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(percentage, 100)}%`, 
                    backgroundColor: statusColor 
                  }}
                />
              </div>
              <div className="flex justify-between items-center text-[9px] uppercase tracking-tighter font-black">
                <span style={{ color: statusColor }}>
                  {percentage >= 100 ? "Limit reached" : `${percentage}% used`}
                </span>
                <span className="text-slate-400">
                  ₺{Math.abs(cat.allocated - cat.spent).toLocaleString()} {cat.allocated - cat.spent < 0 ? 'over' : 'left'}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
