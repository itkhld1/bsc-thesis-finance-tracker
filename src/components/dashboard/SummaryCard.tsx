import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  comparisonValue?: string;
  variant?: "default" | "primary" | "success" | "warning";
  action?: React.ReactNode;
}

const variantStyles = {
  default: "bg-card border-slate-100 shadow-sm",
  primary: "gradient-primary text-primary-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
};

export function SummaryCard({ title, value, icon: Icon, description, trend, comparisonValue, variant = "default", action }: SummaryCardProps) {
  const isPrimary = variant !== "default";

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 hover:shadow-md",
      variantStyles[variant]
    )}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <p className={cn(
                "text-sm font-medium",
                isPrimary ? "text-current/80" : "text-muted-foreground"
              )}>
                {title}
              </p>
              {action && action}
            </div>
            
            <div className="space-y-1">
              <p className="text-2xl lg:text-3xl font-bold tracking-tight">{value}</p>
              {comparisonValue && (
                <p className={cn(
                  "text-[10px] font-medium uppercase",
                  isPrimary ? "text-white/60" : "text-slate-400"
                )}>
                  Previous: {comparisonValue}
                </p>
              )}
            </div>

            {description && (
               <p className={cn(
                "text-[10px] uppercase font-bold tracking-widest leading-none",
                isPrimary ? "text-white/60" : "text-muted-foreground"
              )}>
                {description}
              </p>
            )}
            {trend && (
              <p className={cn(
                "text-sm font-medium flex items-center gap-1",
                isPrimary
                  ? "text-white/80"
                  : trend.isPositive ? "text-green-600" : "text-rose-600"
              )}>
                {trend.value > 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
                <span className={cn(
                  "text-[10px] opacity-70",
                  isPrimary ? "text-white" : "text-muted-foreground"
                )}>
                  {trend.label || "vs last month"}
                </span>
              </p>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-xl",
            isPrimary ? "bg-white/20" : "bg-primary/10"
          )}>
            <Icon className={cn(
              "w-6 h-6",
              isPrimary ? "text-white" : "text-primary"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
