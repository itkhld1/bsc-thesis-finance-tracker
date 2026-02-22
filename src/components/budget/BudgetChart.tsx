import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { BudgetCategory, formatCurrency } from "@/data/budgetData";

interface BudgetChartProps {
  categories: BudgetCategory[];
}

export function BudgetChart({ categories }: BudgetChartProps) {
  const data = categories.map(cat => ({
    name: cat.name.split(' ')[0],
    allocated: cat.allocated,
    spent: cat.spent,
    color: cat.color,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Budget vs Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
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
              <Bar dataKey="allocated" name="Budget" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spent" name="Spent" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
