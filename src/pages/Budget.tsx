import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2, ChevronLeft, ChevronRight } from "lucide-react";
import { BudgetOverview } from "@/components/budget/BudgetOverview";
import { CategoryBudgetCard } from "@/components/budget/CategoryBudgetCard";
import { BudgetChart } from "@/components/budget/BudgetChart";
import { SpendingTrendChart } from "@/components/budget/SpendingTrendChart";
import { EditBudgetDialog } from "@/components/budget/EditBudgetDialog";
import { AIBudgetPredictions } from "@/components/ai/AIBudgetPredictions";
import { mockMonthlyBudget, BudgetCategory } from "@/data/budgetData";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function Budget() {
  const [selectedMonth, setSelectedMonth] = useState(mockMonthlyBudget.month);
  const [selectedYear, setSelectedYear] = useState(mockMonthlyBudget.year);
  const [categories, setCategories] = useState(mockMonthlyBudget.categories);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const totalBudget = categories.reduce((sum, cat) => sum + cat.allocated, 0);
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);

  const handleEditCategory = (category: BudgetCategory) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleSaveBudget = (categoryId: string, newAmount: number) => {
    setCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId ? { ...cat, allocated: newAmount } : cat
      )
    );
  };

  const handlePrevMonth = () => {
    const currentIndex = months.indexOf(selectedMonth);
    if (currentIndex === 0) {
      setSelectedMonth(months[11]);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(months[currentIndex - 1]);
    }
  };

  const handleNextMonth = () => {
    const currentIndex = months.indexOf(selectedMonth);
    if (currentIndex === 11) {
      setSelectedMonth(months[0]);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(months[currentIndex + 1]);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Budget</h1>
          <p className="text-muted-foreground mt-1">Set and track your monthly budgets</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {months.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {[2023, 2024, 2025].map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Budget Overview Cards */}
      <BudgetOverview 
        totalBudget={totalBudget}
        totalSpent={totalSpent}
        month={selectedMonth}
        year={selectedYear}
      />

      {/* Category Budgets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Category Budgets</CardTitle>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Manage Categories
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map(category => (
              <CategoryBudgetCard 
                key={category.id} 
                category={category}
                onEdit={handleEditCategory}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Budget Predictions */}
      <AIBudgetPredictions />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetChart categories={categories} />
        <SpendingTrendChart />
      </div>

      {/* Edit Dialog */}
      <EditBudgetDialog
        category={editingCategory}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveBudget}
      />
    </div>
  );
}
