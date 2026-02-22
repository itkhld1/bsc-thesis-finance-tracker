import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { AIBadge } from "./AIBadge";
import { Brain, TrendingUp } from "lucide-react";

const historicalData = [
  { month: "Aug", actual: 2400, predicted: null },
  { month: "Sep", actual: 2800, predicted: null },
  { month: "Oct", actual: 3100, predicted: null },
  { month: "Nov", actual: 2900, predicted: null },
  { month: "Dec", actual: 3500, predicted: null },
];

const predictedData = [
  { month: "Dec", actual: 3500, predicted: 3500 },
  { month: "Jan", actual: null, predicted: 3200 },
  { month: "Feb", actual: null, predicted: 2900 },
  { month: "Mar", actual: null, predicted: 3100 },
];

const combinedData = [...historicalData, ...predictedData.slice(1)];

export function AIPredictiveChart() {
  return (
    <Card className="border-primary/20 gradient-ai-subtle overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg gradient-ai">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                Predictive Spending Analysis
                <AIBadge variant="inline" />
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">AI forecasts your next 3 months</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-success">12% savings projected</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={combinedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="predictedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₺${v}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(value: number, name: string) => [
                  `₺${value?.toLocaleString() || "N/A"}`,
                  name === "actual" ? "Actual Spending" : "AI Prediction",
                ]}
              />
              <ReferenceLine x="Dec" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" label={{ value: "Today", position: "top", fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <Area type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#actualGradient)" dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }} />
              <Area type="monotone" dataKey="predicted" stroke="hsl(var(--secondary))" strokeWidth={2} strokeDasharray="5 5" fill="url(#predictedGradient)" dot={{ fill: "hsl(var(--secondary))", strokeWidth: 2, r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Actual Spending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-secondary border-2 border-dashed border-secondary" />
            <span className="text-muted-foreground">AI Prediction</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
