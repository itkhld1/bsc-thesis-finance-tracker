import { Card, CardContent } from "@/components/ui/card";
import { Brain, Sparkles, TrendingUp, AlertTriangle, PiggyBank, Tags } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Tags,
    title: "Auto-Categorization",
    description: "Automatically classifies expenses by category",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: TrendingUp,
    title: "Spending Trends",
    description: "Analyzes patterns using moving averages",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    icon: AlertTriangle,
    title: "Budget Warnings",
    description: "Rule-based alerts when approaching limits",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: PiggyBank,
    title: "Saving Suggestions",
    description: "Simple, actionable saving recommendations",
    color: "text-success",
    bgColor: "bg-success/10",
  },
];

export function AIFeatureHighlight() {
  return (
    <Card className="border-primary/30 overflow-hidden relative">
      {/* Gradient background */}
      <div className="absolute inset-0 gradient-ai opacity-5" />
      
      <CardContent className="p-6 relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl gradient-ai ai-glow">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              Powered by AI
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full gradient-ai text-primary-foreground">
                SMART
              </span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Advanced machine learning for your finances
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group p-4 rounded-xl bg-background/60 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={cn("p-2 rounded-lg w-fit mb-3", feature.bgColor)}>
                  <Icon className={cn("w-5 h-5", feature.color)} />
                </div>
                <h4 className="font-medium text-sm text-foreground mb-1">{feature.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Stats Bar */}
        <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">90%</p>
              <p className="text-xs text-muted-foreground">+ Accuracy</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">2.5s</p>
              <p className="text-xs text-muted-foreground">Analysis Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">24/7</p>
              <p className="text-xs text-muted-foreground">Monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 border border-success/30">
            <p className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-success">AI Active</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
