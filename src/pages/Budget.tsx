import { API_BASE_URL } from '@/lib/api-config';
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2, ChevronLeft, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { BudgetOverview } from "@/components/budget/BudgetOverview";
import { CategoryBudgetCard } from "@/components/budget/CategoryBudgetCard";
import { BudgetChart } from "@/components/budget/BudgetChart";
import { SpendingTrendChart } from "@/components/budget/SpendingTrendChart";
import { EditBudgetDialog } from "@/components/budget/EditBudgetDialog";
import { ManageBudgetsDialog } from "@/components/budget/ManageBudgetsDialog";
import { AIBudgetPredictions } from "@/components/ai/AIBudgetPredictions";
import { AIBudgetOptimizer } from "@/components/budget/AIBudgetOptimizer";
import { mockBudgetCategories, BudgetCategory } from "@/data/budgetData";
import { useAuth } from "@/context/AuthContext";
import { useExpenses } from "@/hooks/useExpenses";
import { useToast } from "@/hooks/use-toast";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function Budget() {
  const { data: allExpenses, isLoading: expensesLoading } = useExpenses();
  const { token } = useAuth();
  const { toast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [categories, setCategories] = useState<BudgetCategory[]>(mockBudgetCategories);
  const [loadingBudget, setLoadingBudget] = useState(true);
  
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);

  // 1. Fetch real Budget Limits from Backend
  useEffect(() => {
    const fetchBudget = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/budget`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const limits = await res.json();
        
        setCategories(prev => prev.map(cat => {
          const match = limits.find((l: any) => l.categoryId === cat.id);
          return { 
            ...cat, 
            allocated: match ? Number(match.limitAmount) : cat.allocated 
          };
        }));
      } catch (e) {
        console.error("Failed to fetch budget limits");
      } finally {
        setLoadingBudget(false);
      }
    };
    fetchBudget();
  }, [token]);

  // 2. Synchronize "Spent" values from real Expenses
  useEffect(() => {
    if (!allExpenses) return;

    const monthIdx = months.indexOf(selectedMonth);
    const filtered = allExpenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === monthIdx && d.getFullYear() === selectedYear;
    });

    const totals: Record<string, number> = {};
    filtered.forEach(e => {
      totals[e.categoryId] = (totals[e.categoryId] || 0) + e.amount;
    });

    setCategories(prev => prev.map(cat => ({
      ...cat,
      spent: totals[cat.id] || 0
    })));
  }, [allExpenses, selectedMonth, selectedYear]);

  const totalBudget = categories.reduce((sum, cat) => sum + cat.allocated, 0);
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);

  const handleEditCategory = (category: BudgetCategory) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleSaveBudget = async (categoryId: string, newAmount: number) => {
    // Optimistic UI update
    setCategories(prev => prev.map(cat => cat.id === categoryId ? { ...cat, allocated: newAmount } : cat));
    
    // Save to DB
    try {
      await fetch(`${API_BASE_URL}/budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ budgets: [{ categoryId, limitAmount: newAmount }] })
      });
    } catch (e) {
      toast({ title: "Error", description: "Failed to save budget to server", variant: "destructive" });
    }
  };

  const handleSaveAllBudgets = async (budgets: { categoryId: string, limitAmount: number }[]) => {
    // Optimistic UI update
    setCategories(prev => prev.map(cat => {
      const match = budgets.find(b => b.categoryId === cat.id);
      return match ? { ...cat, allocated: match.limitAmount } : cat;
    }));

    // Save to DB
    try {
      const res = await fetch(`${API_BASE_URL}/budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ budgets })
      });
      if (res.ok) {
        toast({ title: "Success", description: "All budgets updated successfully." });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to save all budgets", variant: "destructive" });
    }
  };

  const applyOptimizedBudget = async (optimizedData: Record<string, number>) => {
    const newBudgets = Object.entries(optimizedData).map(([id, amount]) => ({
      categoryId: id,
      limitAmount: Math.round(amount)
    }));

    // Update UI
    setCategories(prev => prev.map(cat => {
      const suggested = optimizedData[cat.id];
      return suggested !== undefined ? { ...cat, allocated: Math.round(suggested) } : cat;
    }));

    // Persist all to DB
    try {
      await fetch(`${API_BASE_URL}/budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ budgets: newBudgets })
      });
    } catch (e) {
      toast({ title: "Error", description: "Failed to persist optimized budget" });
    }
  };

  if (expensesLoading || loadingBudget) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-10 text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 sm:px-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Budget</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Real-time limits and spending</p>
        </div>
        
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-lg border border-slate-200 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {}}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <div className="flex items-center gap-1">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-7 w-[90px] text-[10px] font-bold uppercase border-none bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month} value={month} className="text-xs">{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {}}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <BudgetOverview totalBudget={totalBudget} totalSpent={totalSpent} month={selectedMonth} year={selectedYear} />

      <AIBudgetOptimizer currentCategories={categories} onApply={applyOptimizedBudget} />

      <Card className="border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base sm:text-lg font-bold tracking-tight">Category Budgets</CardTitle>
            <div className="flex gap-1.5 w-full sm:w-auto">
              <Button variant="outline" size="sm" className="h-8 px-2.5 text-[9px] font-black uppercase tracking-tighter gap-1.5 border-primary/20 text-primary hover:bg-primary/5 flex-1 sm:flex-none" 
                onClick={() => document.getElementById('ai-optimize-trigger')?.click()}>
                <Sparkles className="w-3.5 h-3.5" /> AI Optimize
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-2.5 text-[9px] font-black uppercase tracking-tighter gap-1.5 flex-1 sm:flex-none"
                onClick={() => setManageDialogOpen(true)}
              >
                <Settings2 className="w-3.5 h-3.5" /> Manage
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {categories.map(category => (
              <CategoryBudgetCard key={category.id} category={category} onEdit={handleEditCategory} />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <AIBudgetPredictions />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <BudgetChart categories={categories} />
          <SpendingTrendChart />
        </div>
      </div>

      <EditBudgetDialog category={editingCategory} open={dialogOpen} onOpenChange={setDialogOpen} onSave={handleSaveBudget} />
      <ManageBudgetsDialog categories={categories} open={manageDialogOpen} onOpenChange={setManageDialogOpen} onSave={handleSaveAllBudgets} />
    </div>
  );
}
