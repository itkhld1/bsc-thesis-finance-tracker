import { useState, useMemo } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Expense } from "@/hooks/useExpenses"; // Import Expense interface from useExpenses
import { useCategories } from "@/hooks/useCategories"; // Import the new hook
import { cn } from "@/lib/utils";
import {
  Utensils, Car, Gamepad2, ShoppingBag, Zap, Heart, Plane, MoreHorizontal, Pencil, Trash2, Loader2, CheckSquare, Square
} from "lucide-react";
import { useToast } from "@/hooks/use-toast"; // Import useToast
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import { useQueryClient } from "@tanstack/react-query"; // Import useQueryClient
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Import AlertDialog
import { EditExpenseDialog } from "./EditExpenseDialog"; // Import EditExpenseDialog

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils,
  Car,
  Gamepad2,
  ShoppingBag,
  Zap,
  Heart,
  Plane,
  MoreHorizontal,
};

interface ExpenseTableProps {
  expenses: Expense[];
  // onEdit and onDelete props are no longer passed from parent; handled internally
}

export function ExpenseTable({ expenses }: ExpenseTableProps) { // onEdit and onDelete removed from props
  const { data: categories, isLoading: categoriesLoading, isError: categoriesError, error: categoriesFetchError } = useCategories();
  const { toast } = useToast();
  const { token } = useAuth(); // Get token for auth
  const queryClient = useQueryClient(); // For invalidating queries

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // State for edit dialog
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null); // State for expense being edited
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);

  const allSelected = expenses.length > 0 && selectedIds.length === expenses.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < expenses.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(expenses.map(e => e.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getCategoryInfo = (categoryId: string) => {
    if (categoriesLoading) return { name: "Loading...", icon: "MoreHorizontal", color: "#ccc" };
    if (categoriesError) return { name: `Error: ${categoriesFetchError?.message}`, icon: "MoreHorizontal", color: "#f00" };
    return categories?.find(c => c.id === categoryId) || { name: "Unknown", icon: "MoreHorizontal", color: "#666" };
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDelete = async (expenseId: string) => {
    if (!token) {
      toast({
        title: "Error",
        description: "You must be logged in to delete an expense.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch(`http://localhost:5001/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete expense');
      }

      toast({
        title: "Expense Deleted!",
        description: "The expense has been successfully removed.",
      });
      setSelectedIds(prev => prev.filter(id => id !== expenseId));
      queryClient.invalidateQueries({ queryKey: ['expenses'] }); // Invalidate expenses query to refetch
    } catch (error: any) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Deletion Failed",
        description: error.message || "An unexpected error occurred during deletion.",
        variant: "destructive",
      });
    }
  };

  const handleBatchDelete = async () => {
    if (!token || selectedIds.length === 0) return;

    console.log("Starting batch delete for IDs:", selectedIds);
    setIsDeletingBatch(true);
    try {
      const response = await fetch(`http://localhost:5001/expenses/delete-batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedIds })
      });

      console.log("Batch delete response status:", response.status);

      if (!response.ok) {
        let errorMessage = 'Failed to delete expenses';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          errorMessage = `Server Error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      toast({
        title: "Expenses Deleted!",
        description: `${selectedIds.length} expenses have been removed.`,
      });
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    } catch (error: any) {
      console.error("Batch delete catch block:", error);
      toast({
        title: "Batch Deletion Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeletingBatch(false);
    }
  };

  const handleEdit = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsEditDialogOpen(true);
  };

  if (expenses.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <ShoppingBag className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No expenses found</h3>
        <p className="text-muted-foreground">Try adjusting your filters or add a new expense</p>
      </Card>
    );
  }

  // Display loading state for categories within the table if needed
  if (categoriesLoading) {
    return (
      <Card className="p-4 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        <p>Loading categories for expenses...</p>
      </Card>
    );
  }

  if (categoriesError) {
    return (
      <Card className="p-4 text-center text-destructive">
        <p>Error loading categories: {categoriesFetchError?.message}</p>
      </Card>
    );
  }


  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleSelectAll}
            className="h-8"
          >
            {allSelected ? <CheckSquare className="w-4 h-4 mr-2" /> : <Square className="w-4 h-4 mr-2" />}
            {allSelected ? "Deselect All" : "Select All"}
          </Button>
          {selectedIds.length > 0 && (
            <span className="text-sm text-muted-foreground font-medium">
              {selectedIds.length} selected
            </span>
          )}
        </div>

        {selectedIds.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="h-8 animate-in fade-in zoom-in duration-200">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {selectedIds.length} expenses?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove all selected items. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleBatchDelete} className="bg-destructive hover:bg-destructive/90">
                  {isDeletingBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Forever"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={allSelected || (someSelected ? "indeterminate" : false)} 
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense, index) => {
              const category = getCategoryInfo(expense.categoryId);
              const Icon = iconMap[category.icon || "MoreHorizontal"] || MoreHorizontal;
              const isSelected = selectedIds.includes(expense.id);

              return (
                <TableRow
                  key={expense.id}
                  className={cn(
                    "animate-fade-in hover:bg-muted/30 transition-colors",
                    isSelected && "bg-primary/5 hover:bg-primary/10"
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <TableCell>
                    <Checkbox 
                      checked={isSelected} 
                      onCheckedChange={() => toggleSelect(expense.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-muted-foreground">
                    {formatDate(expense.date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: category.color }} />
                      </div>
                      <span className="text-sm">{category.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{expense.description}</p>
                      {expense.notes && (
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {expense.notes}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-foreground">
                    ₺{expense.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(expense)} // Now calls internal handleEdit
                        className="h-8 w-8 hover:text-primary"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your
                              expense.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(expense.id)}>Continue</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {expenses.map((expense, index) => {
          const category = getCategoryInfo(expense.categoryId);
          const Icon = iconMap[category.icon || "MoreHorizontal"] || MoreHorizontal;
          const isSelected = selectedIds.includes(expense.id);

          return (
            <Card
              key={expense.id}
              className={cn(
                "p-4 animate-fade-in transition-all",
                isSelected && "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
              )}
              style={{ animationDelay: `${index * 30}ms` }}
              onClick={() => toggleSelect(expense.id)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                   <Checkbox 
                    checked={isSelected} 
                    onCheckedChange={() => toggleSelect(expense.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: category.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">{category.name}</p>
                    </div>
                    <p className="font-semibold text-foreground whitespace-nowrap">
                      ₺{expense.amount.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-sm text-muted-foreground">{formatDate(expense.date)}</p>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(expense);
                        }}
                        className="h-8 w-8"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your
                              expense.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(expense.id)}>Continue</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {expenseToEdit && (
        <EditExpenseDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          expense={expenseToEdit}
        />
      )}
    </>
  );
}