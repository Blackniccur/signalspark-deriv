import { Zap, Target, BarChart3, TrendingUp } from "lucide-react";
import { Signal } from "@/hooks/useSignals";

interface MarketStatsProps {
  signals?: Signal[];
}

export const MarketStats = ({ signals = [] }: MarketStatsProps) => {
  const activeCount = signals.filter(s => s.expiresAt > Date.now()).length;
  const strongCount = signals.filter(s => s.validation === "strong").length;
  const avgProb = signals.length > 0 
    ? Math.round(signals.reduce((sum, s) => sum + s.probability, 0) / signals.length) 
    : 0;

  const stats = [
    { label: "Active Signals", value: activeCount.toString(), icon: Zap, color: "text-primary", glow: "glow-cyan" },
    { label: "Win Rate", value: "78%", icon: Target, color: "text-success", glow: "glow-green" },
    { label: "Avg Probability", value: `${avgProb}%`, icon: BarChart3, color: "text-accent", glow: "glow-pink" },
    { label: "Strong Signals", value: strongCount.toString(), icon: TrendingUp, color: "text-success", glow: "glow-green" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className={`glass-panel rounded-xl p-4 ${stat.glow} transition-all hover:-translate-y-1`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              <p className={`text-3xl font-orbitron font-bold ${stat.color}`}>{stat.value}</p>
            </div>
            <div className={`p-2 rounded-full bg-background/50 border border-white/10 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
