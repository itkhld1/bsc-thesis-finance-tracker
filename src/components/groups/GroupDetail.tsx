import { ArrowLeft, Plus, ArrowRightLeft, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Group, calculateDebts, getMemberById, getUserBalance, getTotalGroupExpenses } from "@/data/groupsData";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface GroupDetailProps {
  group: Group;
  onBack: () => void;
}

export function GroupDetail({ group, onBack }: GroupDetailProps) {
  const debts = calculateDebts(group);
  const totalExpenses = getTotalGroupExpenses(group);

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
              getUserBalance(group, "user-1") >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {getUserBalance(group, "user-1") >= 0 ? "+" : ""}{getUserBalance(group, "user-1").toFixed(2)}
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
              const balance = getUserBalance(group, member.id);
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
            <Button variant="outline" size="sm" className="w-full">
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
                const fromMember = getMemberById(group.members, debt.from);
                const toMember = getMemberById(group.members, debt.to);
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
              <Button size="sm" className="gradient-primary">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.expenses.map((expense) => {
              const paidByMember = getMemberById(group.members, expense.paidBy);
              return (
                <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-sm">{expense.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Paid by {paidByMember?.name} • {format(new Date(expense.date), "MMM d")}
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
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
