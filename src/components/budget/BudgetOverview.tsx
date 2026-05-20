import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PiggyBank, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { formatCurrency, getSpentPercentage } from "@/data/budgetData";

interface BudgetOverviewProps {
  totalBudget: number;
  totalSpent: number;
  month: string;
  year: number;
}

export function BudgetOverview({ totalBudget, totalSpent, month, year }: BudgetOverviewProps) {
  const remaining = totalBudget - totalSpent;
  const percentage = getSpentPercentage(totalSpent, totalBudget);
  const isOverBudget = remaining < 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 text-slate-900">
        <CardHeader className="flex flex-row items-center justify-between pb-1 p-3 sm:p-6">
          <CardTitle className="text-[10px] sm:text-sm font-bold text-slate-500 uppercase tracking-widest">
            Limit
          </CardTitle>
          <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="text-lg sm:text-2xl font-black tracking-tight">{formatCurrency(totalBudget)}</div>
          <p className="text-[8px] sm:text-xs text-slate-400 font-bold uppercase mt-0.5">{month} {year}</p>
        </CardContent>
      </Card>

      <Card className="border-slate-100 shadow-sm text-slate-900">
        <CardHeader className="flex flex-row items-center justify-between pb-1 p-3 sm:p-6">
          <CardTitle className="text-[10px] sm:text-sm font-bold text-slate-500 uppercase tracking-widest">
            Spent
          </CardTitle>
          <div className="p-1.5 sm:p-2 bg-slate-100 rounded-lg">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="text-lg sm:text-2xl font-black tracking-tight">{formatCurrency(totalSpent)}</div>
          <p className="text-[8px] sm:text-xs text-slate-400 font-bold uppercase mt-0.5">{percentage}% used</p>
        </CardContent>
      </Card>

      <Card className="border-slate-100 shadow-sm text-slate-900">
        <CardHeader className="flex flex-row items-center justify-between pb-1 p-3 sm:p-6">
          <CardTitle className="text-[10px] sm:text-sm font-bold text-slate-500 uppercase tracking-widest">
            Left
          </CardTitle>
          <div className={cn(
            "p-1.5 sm:p-2 rounded-lg",
            isOverBudget ? "bg-rose-100" : "bg-emerald-100"
          )}>
            {isOverBudget ? (
              <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600" />
            ) : (
              <PiggyBank className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className={cn(
            "text-lg sm:text-2xl font-black tracking-tight",
            isOverBudget ? "text-rose-600" : "text-slate-900"
          )}>
            {isOverBudget ? '-' : ''}{formatCurrency(Math.abs(remaining))}
          </div>
          <p className="text-[8px] sm:text-xs text-slate-400 font-bold uppercase mt-0.5">
            {isOverBudget ? 'Over' : 'Available'}
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-100 shadow-sm text-slate-900">
        <CardHeader className="flex flex-row items-center justify-between pb-1 p-3 sm:p-6">
          <CardTitle className="text-[10px] sm:text-sm font-bold text-slate-500 uppercase tracking-widest">
            Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 flex flex-col justify-center h-[calc(100%-40px)]">
          <div className="space-y-1.5">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-500",
                  isOverBudget ? "bg-rose-500" : "bg-primary"
                )}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] font-black uppercase text-slate-400">
              <span>{percentage}%</span>
              <span>{Math.max(0, 100 - percentage)}% left</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
