import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, X, AlertTriangle, TrendingUp, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIBadge } from "./AIBadge";
import { Badge } from "@/components/ui/badge";
import { Expense } from "@/hooks/useExpenses";
import { useAuth } from "@/context/AuthContext";
import { BudgetLimit } from "@/hooks/useBudget";

interface AISmartAlertsProps {
  expenses: Expense[];
  budgetLimits?: BudgetLimit[];
}

const alertConfig = {
  warning: { icon: AlertTriangle, color: "text-[#D97706]", bg: "bg-[#FFF8F1]", border: "border-[#FFD7B0]" },
  insight: { icon: TrendingUp, color: "text-[#0D9488]", bg: "bg-[#F0FDFA]", border: "border-[#99F6E4]" },
  achievement: { icon: Sparkles, color: "text-[#16A34A]", bg: "bg-[#F0FDF4]", border: "border-[#BBF7D0]" },
  budget: { icon: Target, color: "text-[#4F46E5]", bg: "bg-[#EEF2FF]", border: "border-[#C7D2FE]" },
};

export function AISmartAlerts({ expenses, budgetLimits }: AISmartAlertsProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const { user } = useAuth();

  const alerts = useMemo(() => {
    const activeAlerts = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const userIncome = Number(user?.income) || 0;
    
    const monthlyExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalSpent = monthlyExpenses.reduce((acc, e) => acc + e.amount, 0);

    // 1. High Monthly Spending
    if (totalSpent > userIncome * 0.8 && userIncome > 0) {
      activeAlerts.push({
        id: "high-spending",
        type: "warning" as const,
        title: "High Monthly Spending",
        message: `Total spent: ₺${totalSpent.toFixed(0)}. You're approaching your ₺${userIncome.toFixed(0)} income limit.`,
        time: "Just now",
        priority: "high" as const,
      });
    }

    // 2. Budget Threshold Alerts
    if (budgetLimits) {
      const categoryTotals = monthlyExpenses.reduce((acc, expense) => {
        acc[expense.categoryId] = (acc[expense.categoryId] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);

      budgetLimits.forEach(limit => {
        const spent = categoryTotals[limit.categoryId] || 0;
        const budget = Number(limit.limitAmount);
        if (budget > 0) {
          const percent = (spent / budget) * 100;
          const thresholds = limit.thresholds || [80, 100];
          
          // Check from highest threshold down
          const triggeredThreshold = [...thresholds].sort((a, b) => b - a).find(t => percent >= t);
          
          if (triggeredThreshold) {
            const isOver = triggeredThreshold >= 100;
            activeAlerts.push({
              id: `budget-${limit.categoryId}-${triggeredThreshold}`,
              type: "budget" as const,
              title: isOver ? `Budget Exceeded: ${limit.categoryId}` : `Budget Alert: ${limit.categoryId}`,
              message: isOver 
                ? `You've spent ₺${spent.toFixed(0)}, exceeding your ₺${budget.toFixed(0)} budget for this category.`
                : `You've reached ${triggeredThreshold}% of your ₺${budget.toFixed(0)} budget for ${limit.categoryId}.`,
              time: "Real-time",
              priority: isOver ? "high" as const : "medium" as const,
            });
          }
        }
      });
    }

    // 3. Weekend Spending Pattern
    const weekendExpenses = monthlyExpenses.filter(e => {
      const day = new Date(e.date).getDay();
      return day === 0 || day === 6; // Sun or Sat
    });
    const weekdayExpenses = monthlyExpenses.filter(e => {
      const day = new Date(e.date).getDay();
      return day !== 0 && day !== 6;
    });

    const avgWeekend = weekendExpenses.length > 0 ? weekendExpenses.reduce((a,b)=>a+b.amount,0)/weekendExpenses.length : 0;
    const avgWeekday = weekdayExpenses.length > 0 ? weekdayExpenses.reduce((a,b)=>a+b.amount,0)/weekdayExpenses.length : 0;

    if (avgWeekend > avgWeekday * 1.2 && weekendExpenses.length > 3) {
      activeAlerts.push({
        id: "weekend-pattern",
        type: "insight" as const,
        title: "Weekend Spending Pattern",
        message: "AI noticed you spend more on weekends. Consider setting a daily weekend budget.",
        time: "AI Analysis",
        priority: "medium" as const,
      });
    }

    return activeAlerts.filter(a => !dismissedIds.includes(a.id));
  }, [expenses, budgetLimits, dismissedIds, user?.income]);

  const dismissAlert = (id: string) => {
    setDismissedIds(prev => [...prev, id]);
  };

  return (
    <Card className="border-[#E5E7EB] bg-white h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="p-2 rounded-lg bg-[#0D9488]/10">
              <Bell className="w-5 h-5 text-[#0D9488]" />
            </div>
            <span className="truncate">Smart Alerts</span>
            <AIBadge variant="inline" animated={false} />
          </CardTitle>
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none text-[10px] h-5 px-1.5 font-bold uppercase">
            {alerts.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="px-6 pb-6 h-full">
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
            {alerts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs font-medium uppercase tracking-wider">All caught up!</p>
              </div>
            ) : (
              alerts.map((alert) => {
                const config = alertConfig[alert.type as keyof typeof alertConfig] || alertConfig.insight;
                const Icon = config.icon;

                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "relative p-4 rounded-2xl border transition-all duration-300 hover:shadow-md group/alert",
                      config.bg,
                      config.border
                    )}
                  >
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/5 transition-colors z-10 opacity-0 group-hover/alert:opacity-100"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 bg-white/80 rounded-xl shadow-sm border border-white/50">
                        <Icon className={cn("w-4 h-4", config.color)} />
                      </div>
                      <div className="flex-1 pr-4">
                        <div className="flex items-center flex-wrap gap-1.5 mb-1">
                          <h4 className="font-bold text-xs text-slate-900 leading-none">{alert.title}</h4>
                          {alert.priority === "high" && (
                            <span className="px-1.5 py-0.5 text-[8px] font-black uppercase rounded-full bg-rose-100 text-rose-600 border border-rose-200">
                              Urgent
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">{alert.message}</p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{alert.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
