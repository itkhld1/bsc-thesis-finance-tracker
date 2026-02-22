import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { monthlySpendingHistory, formatCurrency } from "@/data/budgetData";

export function SpendingTrendChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Monthly Spending Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlySpendingHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="spentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--muted))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--muted))' }}
                tickFormatter={(value) => `₺${value / 1000}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="budget" 
                name="Budget"
                stroke="hsl(var(--primary))" 
                fill="url(#budgetGradient)" 
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="spent" 
                name="Spent"
                stroke="hsl(var(--chart-3))" 
                fill="url(#spentGradient)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
