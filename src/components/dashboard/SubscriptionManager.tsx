import { CreditCard, Calendar, TrendingDown, ArrowRight, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useCategories } from "@/hooks/useCategories";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function SubscriptionManager() {
  const { data: subscriptions, isLoading, refetch } = useSubscriptions();
  const { data: categories } = useCategories();

  const totalMonthly = subscriptions?.reduce((sum, s) => sum + s.monthlyCost, 0) || 0;
  const totalYearly = totalMonthly * 12;

  if (isLoading) {
    return (
      <Card className="border-slate-100 shadow-sm h-[400px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Analyzing Recurring Costs...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <CardHeader className="pb-4 bg-slate-50/50 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-500" />
              Subscription Manager
            </CardTitle>
            <CardDescription className="text-xs font-medium">AI-detected recurring payments</CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Cost Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100/50">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Monthly Total</p>
            <p className="text-xl font-black text-indigo-700">₺{totalMonthly.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Yearly Impact</p>
            <p className="text-xl font-black text-slate-900">₺{totalYearly.toLocaleString()}</p>
          </div>
        </div>

        {/* Subscription List */}
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
          {!subscriptions || subscriptions.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Subscriptions Found</p>
            </div>
          ) : (
            subscriptions.map((sub, idx) => {
              const category = categories?.find(c => c.id === sub.categoryId);
              return (
                <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-white hover:border-indigo-200 transition-all group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-none">{sub.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{category?.name || 'General'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">₺{sub.monthlyCost.toFixed(0)}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">/month</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn(
                        "text-[8px] font-black uppercase px-1.5 h-4.5 border-none",
                        sub.confidence === 'High' ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
                      )}>
                        {sub.confidence} confidence
                      </Badge>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      Last paid {format(new Date(sub.lastDate), "MMM d")}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="bg-indigo-600 rounded-2xl p-4 text-white relative overflow-hidden group">
          <Sparkles className="absolute -right-2 -top-2 w-16 h-16 opacity-10 group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <h5 className="text-xs font-black uppercase tracking-widest mb-1">AI Recommendation</h5>
            <p className="text-[11px] font-medium leading-relaxed opacity-90">
              You have {subscriptions?.length || 0} active subscriptions. Reducing these by 20% could save you <span className="font-black">₺{(totalMonthly * 0.2).toFixed(0)}</span> per month!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
