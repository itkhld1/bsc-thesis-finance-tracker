import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Check, Loader2, Info } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { BudgetCategory } from "@/data/budgetData";
import { API_BASE_URL } from '@/lib/api-config';
import { cn } from "@/lib/utils";

interface AIBudgetOptimizerProps {
  currentCategories: BudgetCategory[];
  onApply: (optimizedData: Record<string, number>) => void;
}

export function AIBudgetOptimizer({ currentCategories, onApply }: AIBudgetOptimizerProps) {
  const [optimizedData, setOptimizedData] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/budget/optimize`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error("AI Optimization failed");
      
      const data = await response.json();
      setOptimizedData(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (optimizedData) {
      onApply(optimizedData);
      setIsOpen(false);
      setOptimizedData(null);
      toast({ title: "Applied", description: "Your budget has been updated based on AI suggestions." });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button id="ai-optimize-trigger" className="hidden" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 text-slate-900">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="p-1.5 rounded-lg gradient-ai shadow-sm shadow-primary/20">
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <DialogTitle className="text-lg font-black tracking-tight">AI Optimizer</DialogTitle>
          </div>
          <DialogDescription className="text-[10px] sm:text-xs font-medium">
            Personalized redistribution using Gradient Boosted Trees.
          </DialogDescription>
        </DialogHeader>

        {!optimizedData && !loading && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="max-w-[280px] space-y-1.5">
              <p className="font-bold text-sm">Ready to Optimize?</p>
              <p className="text-[10px] text-slate-500 font-medium">Calculate the ideal balance for your 8 categories using real behavioral data.</p>
            </div>
            <Button onClick={handleOptimize} className="gradient-primary px-8 h-9 text-xs font-black uppercase tracking-wider">Run Engine</Button>
          </div>
        )}

        {loading && (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Analyzing Patterns...</p>
          </div>
        )}

        {optimizedData && !loading && (
          <div className="space-y-4 py-2 animate-fade-in">
            {/* Compact 2x2 Overview within Dialog */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Current Limit</p>
                <p className="text-base font-black text-slate-400 line-through">₺{currentCategories.reduce((a, b) => a + b.allocated, 0).toLocaleString()}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">AI Optimized</p>
                <p className="text-base font-black text-emerald-700">₺{Object.values(optimizedData).reduce((a, b) => a + b, 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {currentCategories.map(cat => {
                const suggested = optimizedData[cat.id.toLowerCase()];
                if (suggested === undefined) return null;
                const isSaving = suggested < cat.allocated;

                return (
                  <div key={cat.id} className="p-2 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between h-[64px]">
                    <div className="flex justify-between items-start">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter truncate w-2/3">{cat.name}</p>
                      <div className={cn(
                        "text-[7px] font-black px-1 py-0.5 rounded-md uppercase tracking-tighter",
                        isSaving ? "bg-emerald-100 text-emerald-700" : "bg-primary/10 text-primary"
                      )}>
                        {isSaving ? 'Drop' : 'Fix'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-auto">
                      <span className="text-[10px] font-bold text-slate-300 line-through">₺{Math.round(cat.allocated)}</span>
                      <ArrowRight className="w-2.5 h-2.5 text-slate-200" />
                      <span className="text-[12px] font-black text-slate-900">₺{Math.round(suggested)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="bg-slate-50 p-2.5 rounded-xl flex gap-2.5 items-start border border-slate-100">
              <div className="p-1 rounded-md bg-white shadow-sm shrink-0">
                <Info className="w-3 h-3 text-primary" />
              </div>
              <p className="text-[9px] text-slate-500 font-medium leading-tight">
                Model redistributed funds from discretionary categories to ensure essential coverage while maximizing surplus.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex-row gap-2 mt-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1 h-9 text-xs font-bold uppercase tracking-wider">Later</Button>
          <Button onClick={handleApply} disabled={!optimizedData} className="flex-1 h-9 gradient-primary text-xs font-bold uppercase tracking-wider">
            Apply Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
