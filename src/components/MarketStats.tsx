import { Card } from "@/components/ui/card";
import { TrendingUp, Target, Zap, BarChart3 } from "lucide-react";

export const MarketStats = () => {
  const stats = [
    { 
      label: "Active Signals", 
      value: "12", 
      icon: Zap, 
      color: "text-primary",
      bg: "bg-primary/10"
    },
    { 
      label: "Win Rate", 
      value: "78%", 
      icon: Target, 
      color: "text-success",
      bg: "bg-success/10"
    },
    { 
      label: "Avg Probability", 
      value: "72%", 
      icon: BarChart3, 
      color: "text-accent",
      bg: "bg-accent/10"
    },
    { 
      label: "Strong Signals", 
      value: "8", 
      icon: TrendingUp, 
      color: "text-success",
      bg: "bg-success/10"
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="p-4 bg-card border-border hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${stat.bg}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
