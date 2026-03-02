import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { AIBadge } from "./AIBadge";
import { Brain, TrendingUp, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface HistoryData {
  month: string;
  amount: number;
}

interface ForecastData {
  prediction: number;
  trend: string;
  confidence: number;
  historyCount: number;
}

export function AIPredictiveChart() {
  const [data, setData] = useState<any[]>([]);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        // 1. Fetch History
        const histRes = await fetch('http://localhost:5001/expenses/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const history: HistoryData[] = await histRes.json();

        // 2. Fetch Forecast
        const foreRes = await fetch('http://localhost:5001/expenses/forecast', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const foreData: ForecastData = await foreRes.json();
        setForecast(foreData);

        // 3. Combine for Chart
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        const chartPoints = history.map(h => {
          const monthIdx = parseInt(h.month.split('-')[1]) - 1;
          return {
            month: months[monthIdx],
            actual: h.amount,
            predicted: h.amount, 
            fullMonth: h.month,
            confidence: 100 // Historical data is 100% certain
          };
        });

        // Add the prediction point
        if (chartPoints.length > 0) {
          const lastPoint = chartPoints[chartPoints.length - 1];
          const lastMonthNum = parseInt(lastPoint.fullMonth.split('-')[1]);
          const nextMonthIdx = lastMonthNum % 12;
          
          chartPoints.push({
            month: months[nextMonthIdx],
            actual: null,
            predicted: foreData.prediction || 0,
            fullMonth: 'Future',
            confidence: foreData.confidence
          } as any);
        }

        setData(chartPoints);
      } catch (error) {
        console.error("Failed to fetch predictive data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <Card className="border-primary/20 flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    );
  }

  const lastActualMonth = data.filter(d => d.actual !== null).pop()?.month;

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
              <p className="text-xs text-muted-foreground mt-0.5">AI forecasts based on {forecast?.historyCount || 0} months of data</p>
            </div>
          </div>
          {forecast && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm",
              forecast.trend === 'decreasing' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-amber-500/10 border-amber-500/20 text-amber-600"
            )}>
              <TrendingUp className={cn("w-4 h-4", forecast.trend === 'decreasing' && "rotate-180")} />
              <span className="text-sm font-semibold">{forecast.confidence}% AI Confidence</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 30, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="predictedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₺${v}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                }}
                formatter={(value: number, name: string, props: any) => [
                  <div key={name} className="flex flex-col gap-1">
                    <span className="font-bold text-foreground">₺{value?.toLocaleString()}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {name === "actual" ? "Actual Spending" : `AI Prediction (${props.payload.confidence}% Conf.)`}
                    </span>
                  </div>,
                  ""
                ]}
              />
              {lastActualMonth && (
                <ReferenceLine 
                  x={lastActualMonth} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="5 5" 
                  label={{ 
                    value: "Today", 
                    position: "top", 
                    fill: "hsl(var(--muted-foreground))", 
                    fontSize: 12,
                    fontWeight: 'bold',
                    dy: -10
                  }} 
                />
              )}
              <Area 
                type="monotone" 
                dataKey="actual" 
                stroke="#6366f1" 
                strokeWidth={3} 
                fill="url(#actualGradient)" 
                dot={{ fill: "#6366f1", strokeWidth: 2, r: 4 }} 
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Area 
                type="monotone" 
                dataKey="predicted" 
                stroke="#f59e0b" 
                strokeWidth={3} 
                strokeDasharray="8 5" 
                fill="url(#predictedGradient)" 
                dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }} 
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-8 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#6366f1]" />
            <span className="font-medium text-muted-foreground">Actual Spending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#f59e0b] border-2 border-dashed border-[#f59e0b]" />
            <span className="font-medium text-muted-foreground">AI Prediction</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
