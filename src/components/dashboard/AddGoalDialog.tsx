import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGoals } from "@/hooks/useGoals";
import { useToast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/useCategories";

export function AddGoalDialog() {
  const [open, setOpen] = useState(false);
  const { createGoal, isCreating } = useGoals();
  const { data: categories } = useCategories();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    deadline: "",
    category: "other"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.targetAmount) return;

    try {
      await createGoal({
        name: formData.name,
        targetAmount: parseFloat(formData.targetAmount),
        deadline: formData.deadline || undefined,
        category: formData.category
      });
      toast({ title: "Success", description: "Savings goal created!" });
      setOpen(false);
      setFormData({ name: "", targetAmount: "", deadline: "", category: "other" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-none shadow-none">
          <Plus className="w-3.5 h-3.5" />
          Add Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Savings Goal</DialogTitle>
            <DialogDescription>Set a target and track your progress</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Goal Name</Label>
              <Input
                id="name"
                placeholder="e.g. New Laptop, Vacation, Emergency Fund"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target">Target Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₺</span>
                  <Input
                    id="target"
                    type="number"
                    step="0.01"
                    className="pl-7"
                    placeholder="0.00"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline (Optional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isCreating} className="gradient-primary">
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Goal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
