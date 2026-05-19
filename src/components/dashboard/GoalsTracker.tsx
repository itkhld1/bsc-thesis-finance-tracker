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
        <CardContent className="flex items-center justify-center py-12 p-3 sm:p-6">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-100 shadow-sm flex flex-col h-fit">
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 pb-2">
        <div>
          <CardTitle className="text-sm sm:text-lg sm:text-xl font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Savings Goals
          </CardTitle>
          <CardDescription>Track your long-term targets</CardDescription>
        </div>
        <AddGoalDialog />
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-3 sm:p-6">
        {goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-slate-200" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">No goals set yet</h4>
            <p className="text-xs text-slate-500 max-w-[180px] mx-auto">Set a savings goal to start tracking your progress.</p>
          </div>
        ) : (
          <div className="space-y-5 mt-2 max-h-[320px] overflow-y-auto pr-2 scrollbar-thin">
            {goals.map((goal) => {
              const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
              const isCompleted = progress >= 100;

              return (
                <div key={goal.id} className="group/goal relative">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className={cn("text-sm font-bold", isCompleted ? "text-green-600" : "text-slate-900")}>
                        {goal.name}
                        {isCompleted && " 🎉"}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          ₺{Number(goal.currentAmount).toLocaleString()} of ₺{Number(goal.targetAmount).toLocaleString()}
                        </span>
                        {goal.deadline && (
                          <Badge variant="outline" className="text-[9px] px-1 h-4 leading-none border-slate-200 text-slate-500">
                            By {format(new Date(goal.deadline), "MMM yyyy")}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary hover:bg-primary/5"
                        onClick={() => {
                          setSelectedGoal(goal);
                          setContributionOpen(true);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-rose-600" onClick={() => handleDelete(goal.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Goal
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Progress value={progress} className={cn("h-1.5", isCompleted ? "bg-green-100" : "bg-slate-100")}>
                      <div 
                        className={cn("h-full transition-all rounded-full", isCompleted ? "bg-green-500" : "bg-primary")} 
                        style={{ width: `${progress}%` }} 
                      />
                    </Progress>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                        {Math.round(progress)}% Complete
                      </span>
                      {isCompleted && (
                        <span className="text-[9px] font-black text-green-600 uppercase tracking-tighter">
                          Goal Reached!
                        </span>
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
