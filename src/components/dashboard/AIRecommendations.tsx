import { Sparkles, TrendingUp, Coffee, AlertCircle, PiggyBank, Tags, AlertTriangle, Brain, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIBadge } from "@/components/ai/AIBadge";
import { cn } from "@/lib/utils";

const recommendations = [
  {
    id: 1,
    icon: AlertTriangle,
    title: "Budget Warning",
    text: "You've spent 85% of your monthly Food budget. Consider reducing spending in this category.",
    type: "warning",
    confidence: 95,
    action: "View budget",
  },
  {
    id: 2,
    icon: TrendingUp,
    title: "Spending Trend",
    text: "Your average monthly spending increased by 15% over the last 3 months based on moving average.",
    type: "reminder",
    confidence: 92,
    action: "See details",
  },
  {
    id: 3,
    icon: Coffee,
    title: "Saving Suggestion",
    text: "Reducing coffee shop visits from 5 to 3 times per week could save you $80/month.",
    type: "tip",
    confidence: 88,
    action: "Set goal",
  },
  {
    id: 4,
    icon: Tags,
    title: "Auto-Categorized",
    text: "Successfully categorized 12 new transactions. Review if any need adjustment.",
    type: "success",
    confidence: 94,
    action: "Review",
  },
];

const typeStyles = {
  warning: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-500", iconBg: "bg-orange-500/20" },
  tip: { bg: "bg-primary/10", border: "border-primary/30", text: "text-primary", iconBg: "bg-primary/20" },
  reminder: { bg: "bg-secondary/10", border: "border-secondary/30", text: "text-secondary", iconBg: "bg-secondary/20" },
  success: { bg: "bg-success/10", border: "border-success/30", text: "text-success", iconBg: "bg-success/20" },
};

export function AIRecommendations() {
  return (
    <Card className="border-primary/20 gradient-ai-subtle overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-secondary/5 to-transparent rounded-full blur-2xl" />
      
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
                Rule-based analysis with interpretable insights
              </p>
            </div>
          </CardTitle>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/60 border border-border/50">
            <Zap className="w-4 h-4 text-primary animate-bounce-subtle" />
            <span className="text-xs font-medium text-muted-foreground">4 new insights</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="grid gap-3 sm:grid-cols-2">
          {recommendations.map((rec, index) => {
            const styles = typeStyles[rec.type as keyof typeof typeStyles];
            
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
                {/* AI Confidence indicator */}
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-[10px] text-muted-foreground">{rec.confidence}%</span>
                </div>

                <div className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-lg", styles.iconBg)}>
                    <rec.icon className={cn("w-4 h-4", styles.text)} />
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

        {/* AI Processing indicator */}
        <div className="mt-4 flex items-center justify-center gap-2 py-2">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary typing-indicator" style={{ animationDelay: "0ms" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-primary typing-indicator" style={{ animationDelay: "200ms" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-primary typing-indicator" style={{ animationDelay: "400ms" }} />
          </div>
          <span className="text-xs text-muted-foreground">AI is analyzing your latest transactions...</span>
        </div>
      </CardContent>
    </Card>
  );
}
