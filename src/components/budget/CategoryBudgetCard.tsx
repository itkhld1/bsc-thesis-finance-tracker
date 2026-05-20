import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Pencil, Utensils, Car, ShoppingBag, Gamepad2, Zap, Heart, GraduationCap, CreditCard } from "lucide-react";
import { BudgetCategory, formatCurrency, getSpentPercentage } from "@/data/budgetData";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Zap,
  Heart,
  GraduationCap,
  CreditCard,
};

interface CategoryBudgetCardProps {
  category: BudgetCategory;
  onEdit?: (category: BudgetCategory) => void;
}

export function CategoryBudgetCard({ category, onEdit }: CategoryBudgetCardProps) {
  const percentage = getSpentPercentage(category.spent, category.allocated);
  const isOverBudget = percentage >= 100;
  const isWarning = percentage >= 80 && percentage < 100;
  const remaining = category.allocated - category.spent;

  const IconComponent = iconMap[category.icon] || CreditCard;

  const getProgressColor = () => {
    if (isOverBudget) return "bg-destructive";
    if (isWarning) return "bg-amber-500";
    return "";
  };

  return (
    <Card className="group hover:shadow-md transition-all duration-200 border-slate-100 text-slate-900">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div 
              className="p-1.5 sm:p-2.5 rounded-lg flex-shrink-0"
              style={{ backgroundColor: `${category.color}15` }}
            >
              <IconComponent 
                className="h-4 w-4 sm:h-5 sm:w-5" 
                style={{ color: category.color }}
              />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-xs sm:text-sm truncate">{category.name}</h3>
              <p className="text-[9px] sm:text-xs text-slate-400 font-bold uppercase tracking-tighter truncate">
                {formatCurrency(category.spent)} / {formatCurrency(category.allocated)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-slate-400 hover:text-primary shrink-0"
            onClick={() => onEdit?.(category)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="space-y-1.5">
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                isOverBudget ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-primary"
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[8px] sm:text-[10px] font-black uppercase tracking-tighter">
            <span style={{ color: isOverBudget ? '#f43f5e' : isWarning ? '#f59e0b' : '#64748b' }}>
              {percentage}%
            </span>
            <span className={cn(
              remaining < 0 ? 'text-rose-600' : 'text-slate-400'
            )}>
              {remaining < 0 ? 'Over' : 'Left'}: {formatCurrency(Math.abs(remaining))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
