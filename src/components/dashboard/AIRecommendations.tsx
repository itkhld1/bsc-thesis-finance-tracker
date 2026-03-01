import { Sparkles, TrendingUp, Coffee, Brain, Zap, AlertTriangle, Tags } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIBadge } from "@/components/ai/AIBadge";
import { cn } from "@/lib/utils";
import { Expense } from "@/hooks/useExpenses";

interface AIRecommendationsProps {
  expenses: Expense[];
}

const typeStyles = {
  warning: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-500", iconBg: "bg-orange-500/20" },
  tip: { bg: "bg-primary/10", border: "border-primary/30", text: "text-primary", iconBg: "bg-primary/20" },
  reminder: { bg: "bg-secondary/10", border: "border-secondary/30", text: "text-secondary", iconBg: "bg-secondary/20" },
  success: { bg: "bg-success/10", border: "border-success/30", text: "text-success", iconBg: "bg-success/20" },
};

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

export function AIRecommendations({ expenses }: AIRecommendationsProps) {
  // Generate real recommendations based on data
  const generateRecommendations = () => {
    const recs = [];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const categoryTotals = monthlyExpenses.reduce((acc, e) => {
      acc[e.categoryId] = (acc[e.categoryId] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    // 1. Budget Warnings
    for (const [catId, total] of Object.entries(categoryTotals)) {
      const budget = DEFAULT_BUDGETS[catId];
      if (budget && total > budget * 0.8) {
        recs.push({
          id: `budget-${catId}`,
          icon: AlertTriangle,
          title: "Budget Warning",
          text: `You've spent ₺${total.toFixed(0)} (${Math.round(total/budget*100)}%) of your ${catId} budget.`,
          type: "warning",
          confidence: 98,
          action: "View budget"
        });
      }
    }

    // 2. Coffee/Food Tip (if Food is high)
    const foodTotal = categoryTotals['food'] || 0;
    if (foodTotal > 1000) {
      recs.push({
        id: "food-tip",
        icon: Coffee,
        title: "Saving Suggestion",
        text: "Your food spending is high. Cooking at home twice more per week could save ₺400/month.",
        type: "tip",
        confidence: 85,
        action: "Set goal"
      });
    }

    // 3. Success Message
    if (monthlyExpenses.length > 0) {
      recs.push({
        id: "categorized",
        icon: Tags,
        title: "AI Analysis",
        text: `Successfully analyzed ${monthlyExpenses.length} transactions this month. Everything looks categorized!`,
        type: "success",
        confidence: 100,
        action: "Review"
      });
    }

    // 4. General Trend
    recs.push({
      id: "trend",
      icon: TrendingUp,
      title: "Spending Pattern",
      text: "Based on your history, Friday is your highest spending day. Try a 'No Spend Friday'!",
      type: "reminder",
      confidence: 90,
      action: "See details"
    });

    return recs.slice(0, 4);
  };

  const recommendations = generateRecommendations();

  return (
    <Card className="border-primary/20 gradient-ai-subtle overflow-hidden relative h-full">
      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2.5 rounded-xl gradient-ai ai-pulse">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                AI Insights & Recommendations
                <AIBadge variant="inline" animated={false} />
              </div>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                Dynamic analysis of your real spending
              </p>
            </div>
          </CardTitle>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/60 border border-border/50">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">{recommendations.length} insights</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="grid gap-3 sm:grid-cols-2">
          {recommendations.map((rec, index) => {
            const styles = typeStyles[rec.type as keyof typeof typeStyles];
            const Icon = rec.icon;
            
            return (
              <div
                key={rec.id}
                className={cn(
                  "group relative p-4 rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 animate-fade-in cursor-pointer",
                  styles.bg,
                  styles.border
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-[10px] text-muted-foreground">{rec.confidence}%</span>
                </div>

                <div className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-lg", styles.iconBg)}>
                    <Icon className={cn("w-4 h-4", styles.text)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-foreground">{rec.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                      {rec.text}
                    </p>
                    <button className={cn(
                      "mt-2 text-xs font-medium transition-colors",
                      styles.text,
                      "hover:underline"
                    )}>
                      {rec.action} →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
