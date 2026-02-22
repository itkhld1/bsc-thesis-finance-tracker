import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIBadge } from "./AIBadge";
import { AIInsightCard } from "./AIInsightCard";
import { Brain, Sparkles, Activity, BarChart3 } from "lucide-react";

const insights = [
  {
    type: "prediction" as const,
    title: "End-of-Month Forecast",
    description: "Based on spending velocity, you'll have $1,240 remaining by month end.",
    value: "$1,240",
    confidence: 89,
    trend: { value: 8, isPositive: true },
  },
  {
    type: "warning" as const,
    title: "Unusual Activity Detected",
    description: "3 transactions from new merchants in the last 24 hours. Verify these purchases.",
    confidence: 76,
    actionLabel: "Review Now",
  },
  {
    type: "tip" as const,
    title: "Subscription Optimization",
    description: "You have 3 overlapping streaming services. Consolidating could save $25/month.",
    value: "$25/mo",
    confidence: 94,
    actionLabel: "View Subscriptions",
  },
  {
    type: "achievement" as const,
    title: "Spending Streak!",
    description: "You've stayed under budget for 12 consecutive days. Your longest streak!",
    trend: { value: 12, isPositive: true },
    confidence: 100,
  },
  {
    type: "trend" as const,
    title: "Category Shift Detected",
    description: "Your grocery spending decreased 15% while dining out increased 22%.",
    confidence: 91,
    actionLabel: "See Details",
  },
  {
    type: "action" as const,
    title: "Smart Savings Opportunity",
    description: "Moving $200 to savings now would put you on track for your vacation goal.",
    value: "$200",
    confidence: 85,
    actionLabel: "Transfer Now",
  },
];

export function AIInsightsPanel() {
  return (
    <Card className="border-primary/20 gradient-ai-subtle overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2.5 rounded-xl gradient-ai animate-scale-pulse">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                AI Financial Insights
                <AIBadge variant="inline" />
              </div>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                Real-time analysis of your financial behavior
              </p>
            </div>
          </CardTitle>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/60 border border-border/50">
              <Activity className="w-4 h-4 text-success animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">Live Analysis</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/60 border border-border/50">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">6 insights</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight, index) => (
            <AIInsightCard
              key={index}
              {...insight}
              className="animate-fade-in"
              onAction={insight.actionLabel ? () => console.log("Action:", insight.title) : undefined}
            />
          ))}
        </div>

        {/* AI Status Footer */}
        <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs text-muted-foreground">
              AI models processing 847 transactions from the last 30 days
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Last updated 2 minutes ago</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
