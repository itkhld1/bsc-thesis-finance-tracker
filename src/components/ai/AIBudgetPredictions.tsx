import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Sparkles, Target, Zap, Shield, Wallet } from "lucide-react";
import { AIBadge } from "./AIBadge";
import { cn } from "@/lib/utils";

interface BudgetPrediction {
  category: string;
  predictedSpend: number;
  budgetLimit: number;
  confidence: number;
  riskLevel: "low" | "medium" | "high";
  suggestion: string;
}

const predictions: BudgetPrediction[] = [
  {
    category: "Food & Dining",
    predictedSpend: 720,
    budgetLimit: 600,
    confidence: 87,
    riskLevel: "high",
    suggestion: "Reduce dining out by 3 meals to stay on budget",
  },
  {
    category: "Transportation",
    predictedSpend: 230,
    budgetLimit: 300,
    confidence: 92,
    riskLevel: "low",
    suggestion: "You're on track. Consider saving the difference!",
  },
  {
    category: "Entertainment",
    predictedSpend: 195,
    budgetLimit: 200,
    confidence: 78,
    riskLevel: "medium",
    suggestion: "Close to limit. Skip one streaming service this month?",
  },
  {
    category: "Shopping",
    predictedSpend: 280,
    budgetLimit: 350,
    confidence: 85,
    riskLevel: "low",
    suggestion: "Great control! You could add $70 to savings",
  },
];

const riskStyles = {
  low: { bg: "bg-success/10", border: "border-success/30", text: "text-success", icon: Shield },
  medium: { bg: "bg-warning/10", border: "border-warning/30", text: "text-warning", icon: Target },
  high: { bg: "bg-destructive/10", border: "border-destructive/30", text: "text-destructive", icon: Zap },
};

export function AIBudgetPredictions() {
  const totalPredicted = predictions.reduce((sum, p) => sum + p.predictedSpend, 0);
  const totalBudget = predictions.reduce((sum, p) => sum + p.budgetLimit, 0);
  const overallStatus = totalPredicted <= totalBudget ? "on-track" : "at-risk";

  return (
    <Card className="border-primary/20 gradient-ai-subtle">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="p-2 rounded-lg gradient-ai ai-pulse">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            AI Budget Predictions
            <AIBadge variant="inline" />
          </CardTitle>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg",
            overallStatus === "on-track" ? "bg-success/10 border border-success/30" : "bg-warning/10 border border-warning/30"
          )}>
            {overallStatus === "on-track" ? (
              <TrendingDown className="w-4 h-4 text-success" />
            ) : (
              <TrendingUp className="w-4 h-4 text-warning" />
            )}
            <span className={cn("text-sm font-medium", overallStatus === "on-track" ? "text-success" : "text-warning")}>
              {overallStatus === "on-track" ? "On Track" : "Attention Needed"}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          AI predicts your month-end spending based on current patterns
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {predictions.map((prediction, index) => {
            const risk = riskStyles[prediction.riskLevel];
            const RiskIcon = risk.icon;
            const percentOfBudget = Math.round((prediction.predictedSpend / prediction.budgetLimit) * 100);

            return (
              <div
                key={prediction.category}
                className={cn(
                  "p-4 rounded-xl border transition-all duration-300 hover:shadow-md animate-fade-in",
                  risk.bg,
                  risk.border
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-sm text-foreground">{prediction.category}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <RiskIcon className={cn("w-3.5 h-3.5", risk.text)} />
                      <span className={cn("text-xs font-medium capitalize", risk.text)}>
                        {prediction.riskLevel} risk
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">₺{prediction.predictedSpend}</p>
                    <p className="text-xs text-muted-foreground">of ₺{prediction.budgetLimit}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative h-2 bg-background/50 rounded-full overflow-hidden mb-3">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", {
                      "bg-success": percentOfBudget <= 80,
                      "bg-warning": percentOfBudget > 80 && percentOfBudget <= 100,
                      "bg-destructive": percentOfBudget > 100,
                    })}
                    style={{ width: `${Math.min(percentOfBudget, 100)}%` }}
                  />
                  {percentOfBudget > 100 && (
                    <div
                      className="absolute top-0 right-0 h-full bg-destructive/50 animate-pulse"
                      style={{ width: `${Math.min(percentOfBudget - 100, 20)}%` }}
                    />
                  )}
                </div>

                {/* Confidence & Suggestion */}
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-muted-foreground">AI Confidence</span>
                  <span className="font-medium text-foreground">{prediction.confidence}%</span>
                </div>

                <div className="pt-2 border-t border-border/30">
                  <p className="text-xs text-muted-foreground">
                    <span className="text-primary font-medium">💡 Suggestion:</span> {prediction.suggestion}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 rounded-xl bg-background/60 border border-border/50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Predicted Total Spending</p>
                <p className="text-xs text-muted-foreground">Based on your current patterns</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">₺{totalPredicted.toLocaleString()}</p>
              <p className={cn("text-sm font-medium", totalPredicted <= totalBudget ? "text-success" : "text-warning")}>
                {totalPredicted <= totalBudget
                  ? `₺${totalBudget - totalPredicted} under budget`
                  : `₺${totalPredicted - totalBudget} over budget`}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
