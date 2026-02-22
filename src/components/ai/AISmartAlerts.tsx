import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, X, AlertTriangle, TrendingUp, Calendar, CreditCard, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIBadge } from "./AIBadge";

interface SmartAlert {
  id: string;
  type: "warning" | "insight" | "reminder" | "achievement";
  title: string;
  message: string;
  time: string;
  priority: "high" | "medium" | "low";
  dismissed?: boolean;
}

const mockAlerts: SmartAlert[] = [
  {
    id: "1",
    type: "warning",
    title: "Budget Limit Approaching",
    message: "You've used 85% of your Food budget. AI suggests reducing dining out by 2 meals this week.",
    time: "2 hours ago",
    priority: "high",
  },
  {
    id: "2",
    type: "insight",
    title: "Spending Pattern Detected",
    message: "AI noticed you spend 40% more on weekends. Consider setting weekend-specific limits.",
    time: "5 hours ago",
    priority: "medium",
  },
  {
    id: "3",
    type: "reminder",
    title: "Bill Due Tomorrow",
    message: "Your electricity bill of ₺145 is due tomorrow. Auto-pay is not enabled.",
    time: "1 day ago",
    priority: "high",
  },
  {
    id: "4",
    type: "achievement",
    title: "Savings Goal Progress",
    message: "Great job! You're 15% ahead of your monthly savings goal. Keep it up!",
    time: "2 days ago",
    priority: "low",
  },
];

const alertConfig = {
  warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", border: "border-warning/30" },
  insight: { icon: TrendingUp, color: "text-primary", bg: "bg-primary/10", border: "border-primary/30" },
  reminder: { icon: Calendar, color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/30" },
  achievement: { icon: Sparkles, color: "text-success", bg: "bg-success/10", border: "border-success/30" },
};

const priorityStyles = {
  high: "ring-2 ring-warning/30",
  medium: "",
  low: "opacity-80",
};

export function AISmartAlerts() {
  const [alerts, setAlerts] = useState(mockAlerts);

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  return (
    <Card className="border-primary/20">
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
                    priorityStyles[alert.priority]
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
                          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-warning/20 text-warning">
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
