import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, Zap, PiggyBank, TrendingDown, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/useCategories";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface Projection {
  goalName: string;
  currentMonthsToGoal: number | null;
  newMonthsToGoal: number | null;
  monthsSaved: number | null;
}

interface SimulationResult {
  categoryId: string;
  reductionPercentage: number;
  potentialMonthlySavings: number;
  newMonthlySurplus: number;
  projections: Projection[];
}

export function AIWhatIfSimulator() {
  const { data: categories } = useCategories();
  const { token } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("food");
  const [reduction, setReduction] = useState([20]);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runSimulation = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5001/ai/what-if', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          categoryId: selectedCategory,
          reductionPercentage: reduction[0]
        })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Simulation failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation();
    }, 500);
    return () => clearTimeout(timer);
  }, [selectedCategory, reduction]);

  return (
    <Card className="border-primary/20 shadow-lg shadow-primary/5 overflow-hidden">
      <CardHeader className="pb-4 bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI "What-If" Simulator
            </CardTitle>
            <CardDescription className="text-xs font-medium">Simulate spending changes to see goal impacts</CardDescription>
          </div>
          <Badge variant="outline" className="bg-white border-primary/20 text-primary font-bold">BETA</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-11 font-bold">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Spending Reduction</label>
              <span className="text-sm font-black text-primary">{reduction[0]}%</span>
            </div>
            <div className="h-11 flex items-center">
              <Slider 
                value={reduction} 
                onValueChange={setReduction} 
                max={100} 
                step={5} 
                className="cursor-pointer"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recalculating Projections...</p>
          </div>
        ) : result && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Monthly Savings Potential</p>
                  <p className="text-2xl font-black text-slate-900">₺{result.potentialMonthlySavings.toFixed(0)}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                By reducing your <span className="font-bold text-primary">{selectedCategory}</span> spending by <span className="font-bold text-primary">{reduction}%</span>, you could save an extra <span className="font-bold text-primary">₺{result.potentialMonthlySavings.toFixed(0)}</span> every month.
              </p>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <ArrowRight className="w-3 h-3" /> Impact on Savings Goals
              </label>
              
              {result.projections.length === 0 ? (
                <div className="text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No goals to analyze</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {result.projections.map((p, i) => (
                    <div key={i} className="p-4 rounded-xl border border-slate-100 bg-white hover:border-primary/20 transition-all group">
                      <h5 className="text-sm font-bold text-slate-900 mb-2 truncate">{p.goalName}</h5>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Now</p>
                          <p className="text-sm font-black text-slate-600">{p.currentMonthsToGoal ?? '?'} mo</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-primary transition-colors" />
                        <div className="space-y-0.5 text-right">
                          <p className="text-[10px] font-bold text-primary uppercase">Optimized</p>
                          <p className="text-sm font-black text-primary">{p.newMonthsToGoal ?? '?'} mo</p>
                        </div>
                      </div>
                      {p.monthsSaved !== null && p.monthsSaved > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-black text-[9px] uppercase px-1.5 h-5">
                            Reach {p.monthsSaved} mo sooner!
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-2">
          <Button className="w-full h-11 gradient-primary font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20">
            Apply Optimized Budget
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
