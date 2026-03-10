import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, TrendingUp, TrendingDown, Calculator, Shuffle } from "lucide-react";

interface SignalCardProps {
  market: string;
  signalType: "over" | "under" | "even" | "odd" | "matches" | "differs";
  category: "digit" | "direction";
  probability: number;
  entryPoint: string;
  expiresAt: number;
  validation: "strong" | "medium" | "weak";
  entryDigit: number;
  predictionDigit?: number;
  price?: number;
}

const getGlowClass = (signalType: string) => {
  if (["even", "odd"].includes(signalType)) return "glow-green border-t-4 border-t-success";
  if (["over", "under"].includes(signalType)) return "glow-pink border-t-4 border-t-accent";
  return "glow-cyan border-t-4 border-t-primary";
};

const getIcon = (signalType: string) => {
  if (signalType === "over") return <TrendingUp className="w-5 h-5" />;
  if (signalType === "under") return <TrendingDown className="w-5 h-5" />;
  if (["even", "odd"].includes(signalType)) return <Calculator className="w-5 h-5" />;
  return <Shuffle className="w-5 h-5" />;
};

const getColor = (signalType: string) => {
  if (["even", "odd"].includes(signalType)) return "text-success";
  if (["over", "under"].includes(signalType)) return "text-accent";
  return "text-primary";
};

const getBarColor = (signalType: string) => {
  if (["even", "odd"].includes(signalType)) return "bg-gradient-to-r from-success to-emerald-400";
  if (["over", "under"].includes(signalType)) return "bg-gradient-to-r from-accent to-purple-500";
  return "confidence-bar";
};

export const SignalCard = ({ market, signalType, category, probability, entryPoint, expiresAt, validation, entryDigit, predictionDigit, price }: SignalCardProps) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      setIsExpired(remaining === 0);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const color = getColor(signalType);

  return (
    <div className={`glass-panel rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 ${getGlowClass(signalType)} ${isExpired ? 'opacity-40' : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={`font-orbitron text-base font-bold ${color} uppercase`}>
            {signalType}
          </h3>
          <p className="text-muted-foreground text-xs">{market}</p>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
          signalType === "even" || signalType === "odd" ? 'bg-success/20 border-success/50 text-success' :
          signalType === "over" || signalType === "under" ? 'bg-accent/20 border-accent/50 text-accent' :
          'bg-primary/20 border-primary/50 text-primary'
        }`}>
          {getIcon(signalType)}
        </div>
      </div>

      {/* Prediction */}
      <div className="flex justify-between items-center bg-background/50 rounded-lg p-3 mb-4 border border-white/5">
        <span className="text-muted-foreground text-sm">Prediction</span>
        <span className={`font-orbitron text-xl font-bold ${color}`}>
          {signalType.toUpperCase()}
        </span>
      </div>

      {/* Confidence */}
      <div className="space-y-1 mb-4">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Confidence</span>
          <span className={`${color} font-bold`}>{Math.round(probability)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-1000 ${getBarColor(signalType)}`} style={{ width: `${probability}%` }} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-background/50 rounded p-2 text-center border border-white/5">
          <div className="text-[10px] text-muted-foreground uppercase">Entry Digit</div>
          <div className={`font-orbitron text-lg ${color}`}>{entryDigit}</div>
        </div>
        <div className="bg-background/50 rounded p-2 text-center border border-white/5">
          <div className="text-[10px] text-muted-foreground uppercase">
            {predictionDigit !== undefined ? 'Target' : 'Time Left'}
          </div>
          <div className={`font-orbitron text-lg ${timeLeft < 20 ? 'text-destructive' : color}`}>
            {predictionDigit !== undefined ? predictionDigit : `${timeLeft}s`}
          </div>
        </div>
      </div>

      {/* Validation Badge */}
      <div className="flex items-center justify-between text-xs">
        <span className={`px-2 py-1 rounded border ${
          validation === "strong" ? 'bg-success/10 text-success border-success/30' :
          validation === "medium" ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
          'bg-destructive/10 text-destructive border-destructive/30'
        } font-orbitron uppercase tracking-wider`}>
          {validation}
        </span>
        <span className="text-muted-foreground font-orbitron">{timeLeft}s</span>
      </div>

      {isExpired && (
        <div className="mt-3 p-2 bg-destructive/10 border border-destructive/30 rounded-md flex items-center gap-2">
          <AlertCircle className="h-3 w-3 text-destructive" />
          <span className="text-xs text-destructive font-orbitron">EXPIRED</span>
        </div>
      )}
    </div>
  );
};
