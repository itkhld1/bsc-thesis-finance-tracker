import { API_BASE_URL } from '@/lib/api-config';
import { useState, useMemo, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCategories } from "@/hooks/useCategories";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Group, GroupExpense } from "@/hooks/useGroups";

interface EditGroupExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  expense: GroupExpense | null;
}

export function EditGroupExpenseDialog({ isOpen, onClose, group, expense }: EditGroupExpenseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { data: categories } = useCategories();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [splitType, setSplitType] = useState<"equal" | "percentage" | "fixed">("equal");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  const [expenseData, setExpenseExpenseData] = useState({
    amount: "",
    description: "",
    categoryId: "other",
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (expense && isOpen) {
      setExpenseExpenseData({
        amount: expense.amount.toString(),
        description: expense.description,
        categoryId: expense.category || "other",
        date: new Date(expense.date).toISOString().split('T')[0]
      });

      setSelectedMembers(expense.splitBetween.map(id => id.toString()));

      if (expense.splits && expense.splits.length > 0) {
        const firstSplit = expense.splits[0];
        if (firstSplit.percentage) {
          setSplitType("percentage");
          const splits: Record<string, string> = {};
          expense.splits.forEach(s => {
            splits[s.userId.toString()] = s.percentage!.toString();
          });
          setCustomSplits(splits);
        } else if (firstSplit.amount) {
          // Check if it was an equal split or fixed
          const isEqual = expense.splits.every(s => s.amount === expense.amount / expense.splits!.length);
          if (isEqual) {
            setSplitType("equal");
          } else {
            setSplitType("fixed");
            const splits: Record<string, string> = {};
            expense.splits.forEach(s => {
              splits[s.userId.toString()] = s.amount!.toString();
            });
            setCustomSplits(splits);
          }
        }
      } else {
        setSplitType("equal");
      }
    }
  }, [expense, isOpen]);

  const handleUpdateExpense = async () => {
    if (!expenseData.amount || !expenseData.description || !expense) return;
    
    const amount = parseFloat(expenseData.amount);
    let splits: any[] = [];

    if (splitType === "equal") {
      const share = amount / selectedMembers.length;
      splits = selectedMembers.map(id => ({ userId: parseInt(id), amount: share }));
    } else if (splitType === "fixed") {
      splits = Object.entries(customSplits).map(([id, val]) => ({
        userId: parseInt(id),
        amount: parseFloat(val)
      }));
    } else if (splitType === "percentage") {
      splits = Object.entries(customSplits).map(([id, val]) => ({
        userId: parseInt(id),
        percentage: parseFloat(val)
      }));
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/expenses/${expense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...expenseData,
          amount,
          groupId: group.id,
          splits
        })
      });
      if (!res.ok) throw new Error("Failed to update expense");
      toast({ title: "Success", description: "Group expense updated" });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      onClose();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Group Expense</DialogTitle>
          <DialogDescription>Modify the expense details or how it's split</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                placeholder="Dinner, Electricity, etc." 
                value={expenseData.description}
                onChange={(e) => setExpenseExpenseData({...expenseData, description: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">₺</span>
                <Input 
                  type="number"
                  className="pl-7"
                  placeholder="0.00" 
                  value={expenseData.amount}
                  onChange={(e) => setExpenseExpenseData({...expenseData, amount: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select 
              value={expenseData.categoryId} 
              onValueChange={(v) => setExpenseExpenseData({...expenseData, categoryId: v})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories?.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold uppercase tracking-wider text-slate-500">Split Method</Label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <Button 
                  variant={splitType === "equal" ? "default" : "ghost"} 
                  size="sm" 
                  className="h-7 text-[10px] px-3"
                  onClick={() => setSplitType("equal")}
                >Equal</Button>
                <Button 
                  variant={splitType === "fixed" ? "default" : "ghost"} 
                  size="sm" 
                  className="h-7 text-[10px] px-3"
                  onClick={() => setSplitType("fixed")}
                >Fixed</Button>
                <Button 
                  variant={splitType === "percentage" ? "default" : "ghost"} 
                  size="sm" 
                  className="h-7 text-[10px] px-3"
                  onClick={() => setSplitType("percentage")}
                >%</Button>
              </div>
            </div>

            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin">
              {group.members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-50 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                      checked={selectedMembers.includes(member.id.toString())}
                      onChange={() => toggleMember(member.id.toString())}
                    />
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="text-[10px]">{member.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{member.name}</span>
                  </div>

                  {selectedMembers.includes(member.id.toString()) && (
                    <div className="flex items-center gap-2">
                      {splitType === "equal" ? (
                        <span className="text-xs font-bold text-slate-500">
                          ₺{expenseData.amount ? (parseFloat(expenseData.amount) / selectedMembers.length).toFixed(2) : "0.00"}
                        </span>
                      ) : (
                        <div className="relative w-24">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                            {splitType === "fixed" ? "₺" : "%"}
                          </span>
                          <Input 
                            type="number"
                            className="h-8 pl-5 text-right text-xs"
                            value={customSplits[member.id.toString()] || ""}
                            onChange={(e) => setCustomSplits({
                              ...customSplits,
                              [member.id.toString()]: e.target.value
                            })}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleUpdateExpense} disabled={isSubmitting || selectedMembers.length === 0}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}