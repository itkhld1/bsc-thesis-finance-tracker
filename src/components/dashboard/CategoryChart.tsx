import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart as PieIcon } from "lucide-react";

// Define the shape of data expected by CategoryChart, matching Dashboard's aggregation
interface ChartCategoryData {
  name: string;
  value: number;
  color: string;
  icon?: string;
}

interface CategoryChartProps {
  data: ChartCategoryData[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-[350px] border-slate-100 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
          <PieIcon className="w-6 h-6 text-slate-200" />
        </div>
        <p className="text-sm font-bold text-slate-900 uppercase tracking-wider">No Data</p>
        <p className="text-xs text-slate-500 mt-1">Start adding expenses to see breakdown</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-slate-100 shadow-sm h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold">Spending by Category</CardTitle>
        <CardDescription className="text-xs">Distribution across all categories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                animationDuration={800}
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`₺${value.toLocaleString()}`, "Amount"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-sm text-foreground font-medium">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
