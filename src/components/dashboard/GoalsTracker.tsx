import { useState } from "react";
import { Target, TrendingUp, MoreVertical, Trash2, Edit2, Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGoals, Goal } from "@/hooks/useGoals";
import { useToast } from "@/hooks/use-toast";
import { AddGoalDialog } from "./AddGoalDialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function GoalsTracker() {
  const { goals, isLoading, contribute, deleteGoal, isContributing } = useGoals();
  const { toast } = useToast();
  const [contributionOpen, setContributionOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");

  const handleContribute = async () => {
    if (!selectedGoal || !contributionAmount) return;

    try {
      await contribute({
        id: selectedGoal.id,
        amount: parseFloat(contributionAmount)
      });
      toast({ title: "Goal Updated", description: `Added ₺${contributionAmount} to "${selectedGoal.name}"` });
      setContributionOpen(false);
      setContributionAmount("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGoal(id);
      toast({ title: "Success", description: "Savings goal removed." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <Card className="border-slate-100 shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-100 shadow-sm flex flex-col h-fit text-slate-900">
      <CardHeader className="flex flex-row items-center justify-between pb-1 p-4 sm:p-6">
        <div>
          <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 tracking-tight">
            <Target className="w-4 h-4 text-primary" />
            Savings Goals
          </CardTitle>
          <CardDescription className="text-[10px] sm:text-xs">Track your long-term targets</CardDescription>
        </div>
        <div className="scale-90 sm:scale-100 origin-right">
          <AddGoalDialog />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-4 sm:p-6 pt-2">
        {goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
              <TrendingUp className="w-6 h-6 text-slate-200" />
            </div>
            <h4 className="text-xs font-bold mb-0.5">No goals set yet</h4>
            <p className="text-[10px] text-slate-400 max-w-[150px] mx-auto">Set a savings goal to start.</p>
          </div>
        ) : (
          <div className="space-y-4 mt-1 max-h-[180px] sm:max-h-none overflow-y-auto pr-1 scrollbar-none">
            {goals.map((goal) => {
              const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
              const isCompleted = progress >= 100;

              return (
                <div key={goal.id} className="group/goal relative">
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="min-w-0">
                      <h4 className={cn("text-xs font-bold truncate", isCompleted ? "text-green-600" : "text-slate-900")}>
                        {goal.name}
                        {isCompleted && " 🎉"}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">
                          ₺{Number(goal.currentAmount).toLocaleString()} of ₺{Number(goal.targetAmount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-1.5 text-[9px] font-black uppercase tracking-tighter text-primary hover:bg-primary/5"
                        onClick={() => {
                          setSelectedGoal(goal);
                          setContributionOpen(true);
                        }}
                      >
                        Add
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400">
                            <MoreVertical className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-rose-600 text-xs font-bold" onClick={() => handleDelete(goal.id)}>
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Delete Goal
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full transition-all", isCompleted ? "bg-green-500" : "bg-primary")} 
                        style={{ width: `${progress}%` }} 
                      />
                    </div>
                    <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-tighter">
                      <span className="text-slate-400">
                        {Math.round(progress)}% Complete
                      </span>
                      {isCompleted && (
                        <span className="text-green-600">Goal Reached!</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={contributionOpen} onOpenChange={setContributionOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Savings</DialogTitle>
            <DialogDescription>How much are you putting towards "{selectedGoal?.name}"?</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Contribution Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₺</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  className="pl-7"
                  placeholder="0.00"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContributionOpen(false)}>Cancel</Button>
            <Button onClick={handleContribute} disabled={isContributing} className="gradient-primary">
              {isContributing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm Contribution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
