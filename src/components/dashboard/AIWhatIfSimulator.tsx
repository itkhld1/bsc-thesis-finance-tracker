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
import { API_BASE_URL } from '@/lib/api-config';

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
      const response = await fetch(`${API_BASE_URL}/ai/what-if`, {
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
    <Card className="border-primary/20 shadow-lg shadow-primary/5 overflow-hidden text-slate-900">
      <CardHeader className="pb-3 p-4 sm:p-6 bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-base sm:text-xl font-black flex items-center gap-2 tracking-tight">
              <Sparkles className="w-4 h-4 text-primary" />
              AI "What-If" Simulator
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-xs">Simulate spending changes</CardDescription>
          </div>
          <Badge variant="outline" className="bg-white border-primary/20 text-primary font-black text-[9px] h-5">BETA</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-4 space-y-4 sm:space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Target Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-9 font-bold text-xs">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Reduction</label>
              <span className="text-xs font-black text-primary">{reduction[0]}%</span>
            </div>
            <div className="h-9 flex items-center">
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
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary/50" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recalculating...</p>
          </div>
        ) : result && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-slate-50 rounded-xl p-3 sm:p-5 border border-slate-100">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Savings Potential</p>
                  <p className="text-xl font-black text-slate-900 leading-none">₺{result.potentialMonthlySavings.toFixed(0)}</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Save an extra <span className="font-bold text-primary">₺{result.potentialMonthlySavings.toFixed(0)}/mo</span> by reducing <span className="font-bold">{selectedCategory}</span> by <span className="font-bold">{reduction}%</span>.
              </p>
            </div>

            <div className="space-y-2.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <ArrowRight className="w-2.5 h-2.5" /> Savings Goals Impact
              </label>
              
              {result.projections.length === 0 ? (
                <div className="text-center py-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">No goals to analyze</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.projections.map((p, i) => (
                    <div key={i} className="p-3 rounded-lg border border-slate-100 bg-white hover:border-primary/20 transition-all group">
                      <h5 className="text-xs font-bold text-slate-900 mb-1.5 truncate">{p.goalName}</h5>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0">
                          <p className="text-[8px] font-bold text-slate-300 uppercase">Now</p>
                          <p className="text-xs font-black text-slate-400">{p.currentMonthsToGoal ?? '?'} mo</p>
                        </div>
                        <ArrowRight className="w-3 h-3 text-slate-200 group-hover:text-primary transition-colors" />
                        <div className="space-y-0 text-right">
                          <p className="text-[8px] font-bold text-primary uppercase">Optimized</p>
                          <p className="text-xs font-black text-primary">{p.newMonthsToGoal ?? '?'} mo</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-0">
          <Button className="w-full h-10 gradient-primary font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
            Apply Optimization
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
