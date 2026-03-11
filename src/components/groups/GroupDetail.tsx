import { useState } from "react";
import { ArrowLeft, Plus, ArrowRightLeft, Receipt, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Group, calculateDebts, getMemberById, getUserBalance, getTotalGroupExpenses } from "@/data/groupsData";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useCategories } from "@/hooks/useCategories";

interface GroupDetailProps {
  group: Group;
  onBack: () => void;
}

export function GroupDetail({ group, onBack }: GroupDetailProps) {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);

  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseData, setExpenseExpenseData] = useState({
    amount: "",
    description: "",
    categoryId: "other",
    date: new Date().toISOString().split('T')[0]
  });

  const debts = calculateDebts(group);
  const totalExpenses = getTotalGroupExpenses(group);
  const userBalance = user ? getUserBalance(group, user.id.toString()) : 0;

  const handleAddMember = async () => {
    if (!memberEmail.trim()) return;
    setIsAddingMember(true);
    try {
      const res = await fetch(`http://localhost:5001/groups/${group.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: memberEmail })
      });
      if (!res.ok) throw new Error("Failed to add member");
      toast({ title: "Success", description: "Member added to group" });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setMemberEmail("");
      setAddMemberOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseData.amount || !expenseData.description) return;
    setIsAddingExpense(true);
    try {
      const res = await fetch('http://localhost:5001/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...expenseData,
          amount: parseFloat(expenseData.amount),
          groupId: group.id
        })
      });
      if (!res.ok) throw new Error("Failed to add expense");
      toast({ title: "Success", description: "Group expense added" });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setAddExpenseOpen(false);
      setExpenseExpenseData({
        amount: "",
        description: "",
        categoryId: "other",
        date: new Date().toISOString().split('T')[0]
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsAddingExpense(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">{group.name}</h2>
          <p className="text-muted-foreground">{group.description}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold text-foreground">₺{totalExpenses.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Members</p>
            <p className="text-2xl font-bold text-foreground">{group.members.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Your Balance</p>
            <p className={cn(
              "text-2xl font-bold",
              userBalance >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {userBalance >= 0 ? "+" : ""}{userBalance.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members & Balances */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Members & Balances
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.members.map((member) => {
              const balance = getUserBalance(group, member.id.toString());
              return (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="text-xs bg-muted">
                        {member.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      balance > 0 && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                      balance < 0 && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}
                  >
                    {balance > 0 ? "+" : ""}{balance === 0 ? "Settled" : `₺${balance.toFixed(2)}`}
                  </Badge>
                </div>
              );
            })}
            <Separator className="my-3" />
            <Button variant="outline" size="sm" className="w-full" onClick={() => setAddMemberOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </CardContent>
        </Card>

        {/* Debt Settlements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4" />
              Settlements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {debts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                All settled up! 🎉
              </p>
            ) : (
              debts.map((debt, index) => {
                const fromMember = getMemberById(group.members, debt.from.toString());
                const toMember = getMemberById(group.members, debt.to.toString());
                return (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="text-xs">
                          {fromMember?.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{fromMember?.name}</span>
                      <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="text-xs">
                          {toMember?.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{toMember?.name}</span>
                    </div>
                    <span className="font-semibold text-primary">₺{debt.amount.toFixed(2)}</span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Expenses
              </CardTitle>
              <Button size="sm" className="gradient-primary" onClick={() => setAddExpenseOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No group expenses yet</p>
            ) : (
              group.expenses.map((expense) => {
                const paidByMember = getMemberById(group.members, expense.paidBy.toString());
                return (
                  <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="font-medium text-sm">{expense.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Paid by {paidByMember?.name || "Unknown"} • {format(new Date(expense.date), "MMM d")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₺{expense.amount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {expense.splitBetween.length} people
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>Add a friend by their email address</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input 
                placeholder="friend@example.com" 
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMember} disabled={isAddingMember}>
              {isAddingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add to Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Group Expense Dialog */}
      <Dialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Group Expense</DialogTitle>
            <DialogDescription>This expense will be split between all members</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddExpenseOpen(false)}>Cancel</Button>
            <Button onClick={handleAddExpense} disabled={isAddingExpense}>
              {isAddingExpense ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
