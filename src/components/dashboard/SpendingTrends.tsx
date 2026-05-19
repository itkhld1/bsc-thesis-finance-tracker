import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Expense } from "@/hooks/useExpenses";

type ViewType = "weekly" | "monthly";
type ChartType = "bar" | "line";

interface SpendingTrendsProps {
  expenses: Expense[];
}

export function SpendingTrends({ expenses }: SpendingTrendsProps) {
  const [view, setView] = useState<ViewType>("weekly");
  const [chartType, setChartType] = useState<ChartType>("bar");

  const chartData = useMemo(() => {
    if (view === "weekly") {
      // Get last 7 days in local time
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          // Use a consistent local YYYY-MM-DD format for comparison
          compDate: d.toLocaleDateString('en-CA'), // 'en-CA' gives YYYY-MM-DD
          dayName: days[d.getDay()],
          amount: 0
        };
      });

      expenses.forEach(e => {
        // The backend date is 'YYYY-MM-DD'. We convert it to a local date string.
        const eDate = new Date(e.date);
        const compDate = eDate.toLocaleDateString('en-CA');
        
        const dayMatch = last7Days.find(d => d.compDate === compDate);
        if (dayMatch) {
          dayMatch.amount += e.amount;
        }
      });

      return last7Days.map(d => ({ label: d.dayName, amount: d.amount }));
    } else {
      // Get last 6 months
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return {
          month: d.getMonth(),
          year: d.getFullYear(),
          monthName: months[d.getMonth()],
          amount: 0
        };
      });

      expenses.forEach(e => {
        const d = new Date(e.date);
        const m = d.getMonth();
        const y = d.getFullYear();
        const monthMatch = last6Months.find(lm => lm.month === m && lm.year === y);
        if (monthMatch) {
          monthMatch.amount += e.amount;
        }
      });

      return last6Months.map(m => ({ label: m.monthName, amount: m.amount }));
    }
  }, [expenses, view]);

  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="pb-2 p-4 sm:p-6 text-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base sm:text-lg font-bold tracking-tight">Spending Trends</CardTitle>
          <div className="flex gap-1.5">
            <div className="flex bg-slate-100 rounded-lg p-0.5 sm:p-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setView("weekly")}
                className={cn(
                  "h-6 sm:h-7 px-2 sm:px-3 text-[10px] sm:text-xs font-bold uppercase",
                  view === "weekly" && "bg-white shadow-sm"
                )}
              >
                Week
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setView("monthly")}
                className={cn(
                  "h-6 sm:h-7 px-2 sm:px-3 text-[10px] sm:text-xs font-bold uppercase",
                  view === "monthly" && "bg-white shadow-sm"
                )}
              >
                Month
              </Button>
            </div>
            <div className="flex bg-slate-100 rounded-lg p-0.5 sm:p-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setChartType("bar")}
                className={cn(
                  "h-6 sm:h-7 px-2 sm:px-3 text-[10px] sm:text-xs font-bold uppercase",
                  chartType === "bar" && "bg-white shadow-sm"
                )}
              >
                Bar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setChartType("line")}
                className={cn(
                  "h-6 sm:h-7 px-2 sm:px-3 text-[10px] sm:text-xs font-bold uppercase",
                  chartType === "line" && "bg-white shadow-sm"
                )}
              >
                Line
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-6 pt-0">
        <div className="h-[180px] sm:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart data={chartData}>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  tickFormatter={(value) => `₺${value}`}
                />
                <Tooltip
                  formatter={(value: number) => [`₺${value.toFixed(2)}`, "Spent"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar
                  dataKey="amount"
                  fill="hsl(var(--primary))"
                  radius={[6, 6, 0, 0]}
                  animationDuration={800}
                />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  tickFormatter={(value) => `₺${value}`}
                />
                <Tooltip
                  formatter={(value: number) => [`₺${value.toFixed(2)}`, "Spent"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
                  activeDot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 6 }}
                  animationDuration={800}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
