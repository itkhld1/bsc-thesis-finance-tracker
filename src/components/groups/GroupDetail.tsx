import { API_BASE_URL } from '@/lib/api-config';
import { useState, useMemo } from "react";
import { ArrowLeft, Plus, ArrowRight, Receipt, Loader2, TrendingUp, TrendingDown, Info, Trash2, Handshake, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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
import { useGroups, GroupExpense } from "@/hooks/useGroups";
import { EditGroupExpenseDialog } from "./EditGroupExpenseDialog";
import { GroupReceiptUpload } from "./GroupReceiptUpload";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  ReferenceLine,
  CartesianGrid
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, MessageSquare, ListFilter } from "lucide-react";

interface GroupDetailProps {
  group: Group;
  onBack: () => void;
}

export function GroupDetail({ group, onBack }: GroupDetailProps) {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  const { settleUp, isSettling, useGroupActivity } = useGroups();
  const { data: activities, isLoading: activitiesLoading } = useGroupActivity(group.id);

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [splitType, setSplitType] = useState<"equal" | "percentage" | "fixed">("equal");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  const [expenseData, setExpenseExpenseData] = useState({
    amount: "",
    description: "",
    categoryId: "other",
    date: new Date().toISOString().split('T')[0]
  });

  // Initialize selected members when dialog opens
  useMemo(() => {
    if (addExpenseOpen && selectedMembers.length === 0) {
      setSelectedMembers(group.members.map(m => m.id.toString()));
    }
  }, [addExpenseOpen, group.members]);

  const handleAddExpense = async () => {
    if (!expenseData.amount || !expenseData.description) return;
    
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

    setIsAddingExpense(true);
    try {
      const res = await fetch(`${API_BASE_URL}/expenses`, {
        method: 'POST',
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
      setCustomSplits({});
      setSplitType("equal");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsAddingExpense(false);
    }
  };

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleReceiptParsed = (data: any) => {
    setExpenseExpenseData({
      amount: data.amount?.toString() || "",
      description: data.description || "Receipt Expense",
      categoryId: data.categoryId || "other",
      date: data.date || new Date().toISOString().split('T')[0]
    });
  };

  const [settleUpOpen, setSettleUpOpen] = useState(false);
  const [settlementData, setSettlementData] = useState({
    recipientId: "",
    amount: "",
    date: new Date().toISOString().split('T')[0]
  });

  const [editExpenseOpen, setEditExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<GroupExpense | null>(null);

  const debts = useMemo(() => calculateDebts(group), [group]);
  const totalExpenses = getTotalGroupExpenses(group);
  const userBalance = user ? getUserBalance(group, user.id.toString()) : 0;

  // Debts involving the current user
  const userDebts = useMemo(() => {
    if (!user) return [];
    return debts.filter(d => d.from === user.id.toString());
  }, [debts, user]);

  const balanceData = useMemo(() => {
    return group.members.map(member => ({
      name: member.name,
      balance: getUserBalance(group, member.id.toString())
    })).sort((a, b) => a.balance - b.balance);
  }, [group]);

  const handleDeleteGroup = async () => {
    if (!group.id) {
      toast({ title: "Error", description: "Invalid group ID", variant: "destructive" });
      return;
    }
    
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/groups/${group.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        let errorMessage = "Failed to delete group";
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON
        }
        throw new Error(errorMessage);
      }
      
      toast({ title: "Group Deleted", description: "The group has been removed successfully." });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      onBack();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddMember = async () => {
    if (!memberEmail.trim()) return;
    setIsAddingMember(true);
    try {
      const res = await fetch(`${API_BASE_URL}/groups/${group.id}/members`, {
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

  const handleSettleUp = async () => {
    if (!settlementData.amount || !settlementData.recipientId) return;
    try {
      await settleUp({
        groupId: group.id,
        amount: parseFloat(settlementData.amount),
        recipientId: settlementData.recipientId,
        date: settlementData.date
      });
      toast({ title: "Success", description: "Settlement recorded successfully" });
      setSettleUpOpen(false);
      setSettlementData({
        recipientId: "",
        amount: "",
        date: new Date().toISOString().split('T')[0]
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete expense");
      toast({ title: "Success", description: "Expense deleted" });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{group.name}</h2>
            <p className="text-sm text-slate-500 font-medium">{group.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user?.id === group.createdBy && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 font-bold uppercase tracking-wider text-[10px] h-9 px-4">
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Delete Group
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the group <span className="font-bold text-slate-900">"{group.name}"</span> and remove all associated expense records. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteGroup} className="bg-rose-600 hover:bg-rose-700 text-white">
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Permanently Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button variant="outline" size="sm" className="h-9 px-4 font-bold uppercase tracking-wider text-[10px]" onClick={() => setSettleUpOpen(true)}>
            <Handshake className="w-3.5 h-3.5 mr-2" />
            Settle Up
          </Button>
          <Button size="sm" className="gradient-primary h-9 px-4 font-bold uppercase tracking-wider text-[10px]" onClick={() => setAddExpenseOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-100/50 border border-slate-200 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <ListFilter className="w-3.5 h-3.5 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <History className="w-3.5 h-3.5 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-0">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-slate-100 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Group Spending</p>
                  <p className="text-2xl font-bold text-foreground">₺{(Number(totalExpenses) || 0).toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-100 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Members Involved</p>
                  <p className="text-2xl font-bold text-foreground">{group.members.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-100 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  userBalance >= 0 ? "bg-green-50" : "bg-red-50"
                )}>
                  {userBalance >= 0 ? 
                    <TrendingUp className="w-5 h-5 text-green-500" /> : 
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  }
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Net Balance</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    userBalance >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {userBalance >= 0 ? "+" : ""}₺{Math.abs(userBalance).toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Settlement Strategy & Chart */}
            <Card className="lg:col-span-2 border-slate-100 shadow-sm overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Settlement Overview
                    </CardTitle>
                    <CardDescription className="text-sm">Visualizing who owes and who is owed</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs font-normal">
                    {debts.length === 0 ? "Fully Settled" : `${debts.length} Pending Payments`}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Balance Chart */}
                  <div className="md:col-span-3 h-[250px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={balanceData} 
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 13, fill: '#64748b' }}
                          width={90}
                        />
                        <Tooltip 
                          cursor={{ fill: 'transparent' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const val = payload[0].value as number;
                              return (
                                <div className="bg-white p-2 border border-slate-200 shadow-md rounded-lg text-xs">
                                  <p className="font-bold">{payload[0].payload.name}</p>
                                  <p className={val >= 0 ? "text-green-600" : "text-red-600"}>
                                    {val >= 0 ? "Is owed: " : "Owes: "} ₺{Math.abs(val).toFixed(2)}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={2} />
                        <Bar dataKey="balance" radius={[0, 4, 4, 0]}>
                          {balanceData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.balance >= 0 ? '#10b981' : '#ef4444'} 
                              fillOpacity={0.8}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Repayment List */}
                  <div className="md:col-span-2 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Suggested Payments</p>
                    {debts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/30 rounded-xl">
                        <p className="text-sm font-medium text-muted-foreground">
                          🎉 Everyone is settled up!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin">
                        {debts.map((debt, index) => {
                          const fromMember = getMemberById(group.members, debt.from.toString());
                          const toMember = getMemberById(group.members, debt.to.toString());
                          return (
                            <div key={index} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                              <div className="flex items-center gap-2 overflow-hidden flex-1">
                                <span className="font-bold text-[13px] text-slate-900 truncate">{fromMember?.name}</span>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase shrink-0">pays</span>
                                <span className="font-bold text-[13px] text-slate-900 truncate">{toMember?.name}</span>
                              </div>
                              <div className="ml-3 shrink-0">
                                <span className="text-[14px] font-black text-primary">₺{(Number(debt.amount) || 0).toFixed(2)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sidebar Cards */}
            <div className="space-y-6">
              {/* Members & Balances List */}
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Members</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {group.members.map((member) => {
                    const balance = getUserBalance(group, member.id.toString());
                    return (
                      <div key={member.id} className="flex items-center justify-between group/member">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 transition-transform group-hover/member:scale-110">
                            <AvatarFallback className="text-[10px] bg-muted">
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
                            "text-xs px-2 py-0.5 h-6",
                            balance > 0 && "bg-green-50 text-green-700 border-green-100",
                            balance < 0 && "bg-red-50 text-red-700 border-red-100",
                            balance === 0 && "bg-slate-50 text-slate-500 border-slate-100"
                          )}
                        >
                          {balance > 0 ? "+" : ""}{balance === 0 ? "Settled" : `₺${(Number(balance) || 0).toFixed(2)}`}
                        </Badge>
                      </div>
                    );
                  })}
                  <Separator className="my-2" />
                  <Button variant="outline" size="sm" className="w-full text-sm h-9" onClick={() => setAddMemberOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Expenses List */}
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      Expenses
                    </CardTitle>
                    <Button size="sm" className="gradient-primary h-7 text-xs px-2" onClick={() => setAddExpenseOpen(true)}>
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {group.expenses.length === 0 ? (
                    <div className="text-center py-6">
                      <Receipt className="w-9 h-9 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No expenses yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                      {group.expenses.slice().reverse().map((expense) => {
                        const paidByMember = getMemberById(group.members, expense.paidBy);
                        return (
                          <div key={expense.id} className="p-2.5 rounded-lg border border-slate-100 bg-white hover:border-primary/20 transition-all group/expense relative">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-sm truncate flex-1">{expense.description}</p>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm">₺{(Number(expense.amount) || 0).toFixed(2)}</p>
                                {user?.id === expense.paidBy && (
                                  <div className="flex items-center gap-1 opacity-0 group-hover/expense:opacity-100 transition-opacity">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="w-6 h-6 rounded-full text-slate-400 hover:text-primary hover:bg-primary/5"
                                      onClick={() => {
                                        setEditingExpense(expense);
                                        setEditExpenseOpen(true);
                                      }}
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="w-6 h-6 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete this expense? This will update everyone's balances.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteExpense(expense.id)} className="bg-rose-600 hover:bg-rose-700">
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">
                                By {paidByMember?.name || "Member"} • {format(new Date(expense.date), "MMM d")}
                              </p>
                              <Badge variant="outline" className="text-[9px] h-4.5 px-1 leading-none">
                                {expense.splitBetween.length} ppl
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-0">
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-50">
              <CardTitle className="text-lg font-bold">Group Activity History</CardTitle>
              <CardDescription>A chronological log of all actions in this group</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {activitiesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : activities && activities.length > 0 ? (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent">
                  {activities.map((activity, idx) => (
                    <div key={idx} className="relative flex items-start gap-4 pl-1 group/activity">
                      <div className="mt-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white bg-slate-100 shadow-sm ring-4 ring-white z-10 transition-transform group-hover/activity:scale-110">
                        {activity.type.includes('EXPENSE') ? (
                          <Receipt className="h-3.5 w-3.5 text-blue-500" />
                        ) : activity.type.includes('MEMBER') ? (
                          <Plus className="h-3.5 w-3.5 text-purple-500" />
                        ) : activity.type.includes('SETTLEMENT') ? (
                          <Handshake className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Info className="h-3.5 w-3.5 text-slate-500" />
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 pt-0.5">
                        <p className="text-sm font-medium text-slate-900 leading-tight">
                          <span className="font-bold text-slate-900">{activity.userId === parseInt(user?.id || "0") ? "You" : activity.userName}</span> {activity.description}
                        </p>
                        <time className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {format(new Date(activity.createdAt), "MMM d, h:mm a")}
                        </time>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                    <History className="w-8 h-8 text-slate-200" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">No activity yet</h4>
                  <p className="text-slate-500 max-w-xs mx-auto">Actions like adding expenses or members will appear here in chronological order.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Group Expense</DialogTitle>
            <DialogDescription>Choose how to split this expense among members</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <GroupReceiptUpload onParsed={handleReceiptParsed} className="mb-2" />
            
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
            <Button variant="outline" onClick={() => setAddExpenseOpen(false)}>Cancel</Button>
            <Button onClick={handleAddExpense} disabled={isAddingExpense || selectedMembers.length === 0}>
              {isAddingExpense ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settle Up Dialog */}
      <Dialog open={settleUpOpen} onOpenChange={setSettleUpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Settle Up</DialogTitle>
            <DialogDescription>Record a payment to another member</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {userDebts.length > 0 && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Suggested Settlements</p>
                <div className="space-y-2">
                  {userDebts.map((debt, idx) => {
                    const toMember = getMemberById(group.members, debt.to.toString());
                    return (
                      <Button 
                        key={idx} 
                        variant="ghost" 
                        className="w-full justify-between h-auto py-2 px-3 bg-white border border-slate-100 hover:border-primary/30"
                        onClick={() => setSettlementData({
                          ...settlementData,
                          recipientId: debt.to.toString(),
                          amount: debt.amount.toString()
                        })}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-[8px]">{toMember?.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">Pay {toMember?.name}</span>
                        </div>
                        <span className="font-bold text-primary">₺{(Number(debt.amount) || 0).toFixed(2)}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Recipient</Label>
              <Select 
                value={settlementData.recipientId} 
                onValueChange={(v) => setSettlementData({...settlementData, recipientId: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {group.members.filter(m => m.id.toString() !== user?.id.toString()).map(member => (
                    <SelectItem key={member.id} value={member.id.toString()}>{member.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">₺</span>
                <Input 
                  type="number"
                  className="pl-7"
                  placeholder="0.00" 
                  value={settlementData.amount}
                  onChange={(e) => setSettlementData({...settlementData, amount: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input 
                type="date"
                value={settlementData.date}
                onChange={(e) => setSettlementData({...settlementData, date: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettleUpOpen(false)}>Cancel</Button>
            <Button onClick={handleSettleUp} disabled={isSettling || !settlementData.amount || !settlementData.recipientId}>
              {isSettling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditGroupExpenseDialog 
        isOpen={editExpenseOpen} 
        onClose={() => {
          setEditExpenseOpen(false);
          setEditingExpense(null);
        }}
        group={group}
        expense={editingExpense}
      />
    </div>
  );
}
