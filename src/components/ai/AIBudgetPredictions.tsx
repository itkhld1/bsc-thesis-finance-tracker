import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Sparkles, Target, Zap, Shield, Wallet, Loader2, AlertCircle } from "lucide-react";
import { AIBadge } from "./AIBadge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface BudgetPrediction {
  category: string;
  predictedSpend: number;
  budgetLimit: number;
  confidence: number;
  riskLevel: "low" | "medium" | "high";
  suggestion: string;
}

const riskStyles = {
  low: { bg: "bg-success/10", border: "border-success/30", text: "text-success", icon: Shield },
  medium: { bg: "bg-warning/10", border: "border-warning/30", text: "text-warning", icon: Target },
  high: { bg: "bg-destructive/10", border: "border-destructive/30", text: "text-destructive", icon: Zap },
};

export function AIBudgetPredictions() {
  const [predictions, setPredictions] = useState<BudgetPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchPredictions = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch('http://localhost:5001/ai/budget-predictions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch AI budget predictions");
        const data = await res.json();
        setPredictions(data);
        setError(null);
      } catch (err: any) {
        console.error("AI Budget Predictions Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [token]);

  if (loading) {
    return (
      <Card className="border-primary/20 gradient-ai-subtle h-[200px] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p className="text-xs text-muted-foreground animate-pulse font-medium">
          Predicting your month-end financial status...
        </p>
      </Card>
    );
  }

  if (error || predictions.length === 0) {
    return (
      <Card className="border-destructive/20 h-[200px] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-8 h-8 text-destructive mb-2" />
        <p className="text-xs text-muted-foreground">Budget forecasts currently unavailable.</p>
      </Card>
    );
  }

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
                    <p className="text-lg font-bold text-foreground">₺{prediction.predictedSpend.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">of ₺{prediction.budgetLimit.toLocaleString()}</p>
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
                  ? `₺${(totalBudget - totalPredicted).toLocaleString()} under budget`
                  : `₺${(totalPredicted - totalBudget).toLocaleString()} over budget`}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
