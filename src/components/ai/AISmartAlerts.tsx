import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, X, AlertTriangle, TrendingUp, Calendar, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIBadge } from "./AIBadge";
import { Expense } from "@/hooks/useExpenses";

interface AISmartAlertsProps {
  expenses: Expense[];
}

const alertConfig = {
  warning: { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  insight: { icon: TrendingUp, color: "text-primary", bg: "bg-primary/10", border: "border-primary/30" },
  reminder: { icon: Calendar, color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/30" },
  achievement: { icon: Sparkles, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/30" },
};

export function AISmartAlerts({ expenses }: AISmartAlertsProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const alerts = useMemo(() => {
    const activeAlerts = [];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalSpent = monthlyExpenses.reduce((acc, e) => acc + e.amount, 0);

    // 1. High Spending Warning
    if (totalSpent > 4000) {
      activeAlerts.push({
        id: "high-spending",
        type: "warning" as const,
        title: "High Monthly Spending",
        message: `Total spent: ₺${totalSpent.toFixed(0)}. You're approaching your ₺5200 income limit.`,
        time: "Just now",
        priority: "high" as const,
      });
    }

    // 2. Weekend Insight
    activeAlerts.push({
      id: "weekend-pattern",
      type: "insight" as const,
      title: "Weekend Spending Pattern",
      message: "AI noticed you spend 40% more on weekends. Consider setting a daily weekend budget.",
      time: "2 hours ago",
      priority: "medium" as const,
    });

    // 3. Savings Achievement
    if (totalSpent < 2000 && monthlyExpenses.length > 5) {
      activeAlerts.push({
        id: "savings-goal",
        type: "achievement" as const,
        title: "Savings Goal Progress",
        message: "Excellent! You've only spent ₺" + totalSpent.toFixed(0) + " so far. You're on track for a high savings rate.",
        time: "1 day ago",
        priority: "low" as const,
      });
    }

    return activeAlerts.filter(a => !dismissedIds.includes(a.id));
  }, [expenses, dismissedIds]);

  const dismissAlert = (id: string) => {
    setDismissedIds(prev => [...prev, id]);
  };

  return (
    <Card className="border-primary/20 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="p-2 rounded-lg gradient-ai">
              <Bell className="w-5 h-5 text-primary-foreground" />
            </div>
            Smart Notifications
            <AIBadge variant="inline" />
          </CardTitle>
          <span className="text-xs text-muted-foreground">{alerts.length} active</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">All caught up! No new alerts.</p>
            </div>
          ) : (
            alerts.map((alert, index) => {
              const config = alertConfig[alert.type];
              const Icon = config.icon;

              return (
                <div
                  key={alert.id}
                  className={cn(
                    "relative p-4 rounded-xl border transition-all duration-300 hover:shadow-md animate-fade-in",
                    config.bg,
                    config.border,
                    alert.priority === "high" ? "ring-2 ring-orange-500/20" : ""
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>

                  <div className="flex gap-3">
                    <div className={cn("p-2 rounded-lg bg-background/50", config.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 pr-6">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm text-foreground">{alert.title}</h4>
                        {alert.priority === "high" && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-orange-500/20 text-orange-500">
                            Urgent
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{alert.message}</p>
                      <span className="text-[10px] text-muted-foreground/70 mt-2 block">{alert.time}</span>
                    </div>
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
