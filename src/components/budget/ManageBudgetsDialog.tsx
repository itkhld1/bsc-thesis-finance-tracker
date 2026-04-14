import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BudgetCategory, formatCurrency } from "@/data/budgetData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Utensils, Car, ShoppingBag, Gamepad2, Zap, Heart, GraduationCap, CreditCard, Plane, MoreHorizontal } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Zap,
  Heart,
  GraduationCap,
  CreditCard,
  Plane,
  MoreHorizontal
};

interface ManageBudgetsDialogProps {
  categories: BudgetCategory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (budgets: { categoryId: string, limitAmount: number }[]) => void;
}

export function ManageBudgetsDialog({ categories, open, onOpenChange, onSave }: ManageBudgetsDialogProps) {
  const [localBudgets, setLocalBudgets] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const initialBudgets: Record<string, string> = {};
      categories.forEach(cat => {
        initialBudgets[cat.id] = cat.allocated.toString();
      });
      setLocalBudgets(initialBudgets);
    }
  }, [open, categories]);

  const handleInputChange = (id: string, value: string) => {
    setLocalBudgets(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    const budgetsToSave = Object.entries(localBudgets).map(([id, amount]) => ({
      categoryId: id,
      limitAmount: parseFloat(amount) || 0
    }));
    onSave(budgetsToSave);
    onOpenChange(false);
  };

  const totalBudget = Object.values(localBudgets).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Manage All Budgets</DialogTitle>
          <DialogDescription>
            Set your spending limits for all categories in one place.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 py-4">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.map((cat) => {
                const IconComponent = iconMap[cat.icon] || CreditCard;
                return (
                  <div key={cat.id} className="space-y-2 p-3 rounded-xl border border-border/50 bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="p-1.5 rounded-md"
                        style={{ backgroundColor: `${cat.color}20` }}
                      >
                        <IconComponent 
                          className="h-4 w-4" 
                          style={{ color: cat.color }}
                        />
                      </div>
                      <Label htmlFor={`budget-${cat.id}`} className="font-semibold text-sm">
                        {cat.name}
                      </Label>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₺</span>
                      <Input
                        id={`budget-${cat.id}`}
                        type="number"
                        value={localBudgets[cat.id] || ""}
                        onChange={(e) => handleInputChange(cat.id, e.target.value)}
                        className="pl-7 bg-background"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground px-1">
                      Current spending: <span className="font-medium">{formatCurrency(cat.spent)}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>

        <div className="pt-4 border-t border-border mt-2">
          <div className="flex items-center justify-between mb-4 bg-primary/5 p-3 rounded-lg border border-primary/10">
            <span className="text-sm font-medium text-muted-foreground">New Total Monthly Budget</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(totalBudget)}</span>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="gradient-primary">
              Save All Changes
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
