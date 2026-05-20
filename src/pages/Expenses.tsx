import { useState, useMemo } from "react";
import { Plus, Loader2, Download } from "lucide-react"; // Import Loader2
import { Link } from "react-router-dom";
import { DateRange } from "react-day-picker";
import { ExpenseFilters } from "@/components/expense/ExpenseFilters";
import { ExpenseTable } from "@/components/expense/ExpenseTable";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useExpenses, Expense } from "@/hooks/useExpenses"; // Import useExpenses and Expense interface
import { useCategories } from "@/hooks/useCategories";
import { useBudget } from "@/hooks/useBudget";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card"; // Import Card for error display
import { exportToCSV, generateFinancialPDF } from "@/lib/exportUtils";


export default function Expenses() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const { data: expenses, isLoading, isError, error } = useExpenses(); // Fetch expenses
  const { data: categories } = useCategories();
  const { data: budgetLimits } = useBudget();

  const filteredExpenses = useMemo(() => {
    if (isLoading || isError || !expenses) {
      return [];
    }
    let result = [...expenses];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.description.toLowerCase().includes(searchLower) ||
          e.notes?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (category !== "all") {
      result = result.filter((e) => e.categoryId === category); // Use categoryId
    }

    // Date range filter
    if (dateRange?.from) {
      result = result.filter((e) => {
        const expenseDate = new Date(e.date);
        const from = dateRange.from!;
        const to = dateRange.to || from;
        return expenseDate >= from && expenseDate <= to;
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "amount-asc":
          return a.amount - b.amount;
        case "amount-desc":
          return b.amount - a.amount;
        default:
          return 0;
      }
    });

    return result;
  }, [search, category, sortBy, dateRange, expenses, isLoading, isError]);

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleExportCSV = () => {
    const dataToExport = filteredExpenses.map(e => ({
      Date: new Date(e.date).toLocaleDateString(),
      Description: e.description,
      Category: e.categoryId,
      Amount: e.amount,
      Notes: e.notes || ""
    }));
    exportToCSV(dataToExport, `aura-expenses-${new Date().toISOString().split('T')[0]}`);
    toast({
      title: "Export Successful",
      description: "Your expenses have been exported to CSV.",
    });
  };

  const handleDownloadPDF = async () => {
    if (!expenses || !categories || !budgetLimits) return;
    setIsGeneratingPDF(true);
    try {
      const now = new Date();
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      await generateFinancialPDF({
        month: months[now.getMonth()],
        year: now.getFullYear(),
        expenses,
        categories,
        budgetLimits,
        user
      });
      toast({ title: "PDF Generated", description: "Your financial report has been downloaded." });
    } catch (e) {
      toast({ title: "Error", description: "Failed to generate PDF report.", variant: "destructive" });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setCategory("all");
    setSortBy("date-desc");
    setDateRange(undefined);
  };

  const handleEdit = (expense: Expense) => {
    toast({
      title: "Edit expense",
      description: `Editing: ${expense.description}`,
    });
  };

  const handleDelete = (expense: Expense) => {
    toast({
      title: "Delete expense",
      description: `Deleted: ${expense.description}`,
      variant: "destructive",
    });
  };

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="ml-2">Loading expenses...</p>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-8 text-center text-destructive">
        <h1 className="text-xl font-bold">Error</h1>
        <p className="text-muted-foreground mt-1">
          Failed to load expenses: {error?.message}
        </p>
      </Card>
    );
  }


  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-10 text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 sm:px-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Manage and track all your spending
          </p>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Button variant="outline" onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="gap-1.5 text-[9px] font-black uppercase tracking-tighter h-8 px-2.5 flex-1 sm:flex-none">
            {isGeneratingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            PDF
          </Button>
          <Button variant="outline" onClick={handleExportCSV} className="gap-1.5 text-[9px] font-black uppercase tracking-tighter h-8 px-2.5 flex-1 sm:flex-none">
            <Download className="w-3.5 h-3.5" />
            CSV
          </Button>
          <Button asChild size="sm" className="gradient-primary h-8 px-3 font-black uppercase tracking-widest text-[9px] shadow-md shadow-primary/20 flex-1 sm:flex-none">
            <Link to="/add-expense">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-1 sm:px-0">
        <ExpenseFilters
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between px-2 py-2 bg-slate-50 border border-slate-100 rounded-lg mx-1 sm:mx-0">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          <span className="text-slate-900">{filteredExpenses.length}</span> Expenses
        </p>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Total: <span className="text-primary font-black text-sm ml-1">₺{totalAmount.toFixed(2)}</span>
        </p>
      </div>

      {/* Table */}
      <ExpenseTable
        expenses={filteredExpenses}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
