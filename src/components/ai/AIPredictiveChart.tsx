import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { AIBadge } from "./AIBadge";
import { Brain, TrendingUp, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ForecastData {
  prediction: number;
  trend: string;
  confidence: number;
  historyCount: number;
  modelUsed?: string;
}

export function AIPredictiveChart() {
  const [data, setData] = useState<any[]>([]);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      setLoading(true);
      try {
        // 1. Fetch History
        const histRes = await fetch('http://localhost:5001/expenses/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!histRes.ok) throw new Error("History fetch failed");
        const history = await histRes.json();

        // 2. Fetch Forecast
        const foreRes = await fetch('http://localhost:5001/expenses/forecast', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!foreRes.ok) throw new Error("Forecast fetch failed");
        const foreData: ForecastData = await foreRes.json();
        
        console.log("AI Forecast Received:", foreData);
        setForecast(foreData);

        // 3. Process Months
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        const chartPoints = history.map((h: any) => {
          const monthIdx = parseInt(h.month.split('-')[1]) - 1;
          return {
            month: months[monthIdx],
            actual: h.amount,
            predicted: h.amount, // Start prediction line from actual point
            confidence: 100
          };
        });

        // 4. Add Future Prediction (e.g., April)
        if (chartPoints.length > 0 && foreData.historyCount > 0) {
          const lastHist = history[history.length - 1];
          const lastMonthNum = parseInt(lastHist.month.split('-')[1]);
          const nextMonthName = months[lastMonthNum % 12];
          
          chartPoints.push({
            month: nextMonthName,
            actual: null,
            predicted: foreData.prediction,
            confidence: foreData.confidence
          });
        }

        setData(chartPoints);
        setError(null);
      } catch (err: any) {
        console.error("AI Chart Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <Card className="border-primary/20 flex items-center justify-center p-12 h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">AI is training on your data...</p>
        </div>
      </Card>
    );
  }

  if (error || data.length === 0) {
    return (
      <Card className="border-destructive/20 flex items-center justify-center p-12 h-[400px]">
        <div className="text-center space-y-2">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">Forecast Unavailable</p>
          <p className="text-xs text-muted-foreground">Add more expenses to enable AI predictions.</p>
        </div>
      </Card>
    );
  }

  const lastActualMonth = data.filter(d => d.actual !== null).pop()?.month;

  return (
    <Card className="border-primary/20 gradient-ai-subtle overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl gradient-ai shadow-lg shadow-primary/20">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                Predictive Spending Analysis
                <AIBadge variant="inline" />
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">
                AI Forecast based on {forecast?.historyCount || 0} months of behavior
              </p>
            </div>
          </div>
          {forecast && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm transition-all ${
              forecast.trend === 'decreasing' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-amber-500/10 border-amber-500/20 text-amber-600"
            }`}>
              <TrendingUp className={`w-4 h-4 ${forecast.trend === 'decreasing' ? "rotate-180" : ""}`} />
              <span className="text-xs font-bold uppercase tracking-tight">{forecast.confidence}% AI Confidence</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 35, right: 15, left: 0, bottom: 0 }}>
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
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₺${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  padding: "12px"
                }}
                formatter={(value: number, name: string, props: any) => [
                  <div key={name} className="flex flex-col gap-0.5">
                    <span className="font-bold text-base text-foreground">₺{value?.toLocaleString()}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {name === "actual" ? "Actual Spending" : `AI Prediction (${props.payload.confidence}% Conf.)`}
                    </span>
                  </div>,
                  null
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
                    dy: -12
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
                isAnimationActive={true}
              />
              <Area 
                type="monotone" 
                dataKey="predicted" 
                stroke="#f59e0b" 
                strokeWidth={3} 
                strokeDasharray="8 4" 
                fill="url(#predictedGradient)" 
                dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }} 
                activeDot={{ r: 6, strokeWidth: 0 }}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-10 mt-8">
          <div className="flex items-center gap-2.5 group">
            <div className="w-3.5 h-3.5 rounded-full bg-[#6366f1] shadow-sm shadow-indigo-500/40 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Actual Spending</span>
          </div>
          <div className="flex items-center gap-2.5 group">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-[#f59e0b] bg-amber-500/10 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">AI Prediction</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
