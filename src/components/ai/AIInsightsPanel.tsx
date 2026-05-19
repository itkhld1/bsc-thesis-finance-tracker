import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIBadge } from "./AIBadge";
import { AIInsightCard } from "./AIInsightCard";
import { Brain, Sparkles, Activity, BarChart3, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from '@/lib/api-config';

interface Insight {
  type: "prediction" | "warning" | "tip" | "achievement" | "trend" | "action";
  title: string;
  description: string;
  value?: string;
  confidence: number;
  trend?: { value: number; isPositive: boolean };
  actionLabel?: string;
}

export function AIInsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchInsights = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/ai/insights`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch AI insights");
        const data = await res.json();
        setInsights(data);
        setError(null);
      } catch (err: any) {
        console.error("AI Insights Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [token]);

  if (loading) {
    return (
      <Card className="border-primary/20 gradient-ai-subtle h-[300px] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground animate-pulse font-medium">
          Our AI is analyzing your financial patterns...
        </p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20 h-[300px] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-10 h-10 text-destructive mb-3" />
        <h3 className="font-semibold text-foreground">Insights Unavailable</h3>
        <p className="text-xs text-muted-foreground mt-2 max-w-[300px]">
          We couldn't reach the AI analysis engine. Please check your connection or try again later.
        </p>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 gradient-ai-subtle overflow-hidden">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-start gap-3 text-lg font-semibold">
            <div className="p-2.5 rounded-xl gradient-ai animate-scale-pulse flex-shrink-0 mt-1 sm:mt-0">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="truncate">AI Financial Insights</span>
                <AIBadge variant="inline" />
              </div>
              <p className="text-xs text-muted-foreground font-normal leading-relaxed">
                Real-time analysis of your financial behavior
              </p>
            </div>
          </CardTitle>
          
          <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-background/60 border border-border/50 flex-1 sm:flex-none justify-center">
              <Activity className="w-3.5 h-3.5 text-success animate-pulse" />
              <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap uppercase tracking-tight">Live Analysis</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-background/60 border border-border/50 flex-1 sm:flex-none justify-center">
              <BarChart3 className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap uppercase tracking-tight">{insights.length} insights</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {insights.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Add more transactions to generate deeper AI insights.</p>
          </div>
        ) : (
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
        )}

        {/* AI Status Footer */}
        <div className="mt-6 pt-4 border-t border-border/50 flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1 flex-shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
              Neural Network model active and processing
            </span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] sm:text-xs text-muted-foreground">Updated just now</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
