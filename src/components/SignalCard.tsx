import { useEffect, useState } from "react";
import { AlertCircle, TrendingUp, TrendingDown, Calculator, Shuffle, ArrowUpCircle, ArrowDownCircle, BarChart3 } from "lucide-react";
import type { IndicatorData } from "@/hooks/useSignals";

interface SignalCardProps {
  market: string;
  signalType: "over" | "under" | "even" | "odd" | "matches" | "differs" | "rise" | "fall";
  category: "digit" | "direction";
  probability: number;
  entryPoint: string;
  expiresAt: number;
  validation: "strong" | "medium" | "weak";
  entryDigit: number;
  predictionDigit?: number;
  price?: number;
  indicators?: IndicatorData;
}

const getGlowClass = (signalType: string) => {
  if (["even", "odd"].includes(signalType)) return "glow-green border-t-4 border-t-success";
  if (["over", "under"].includes(signalType)) return "glow-pink border-t-4 border-t-accent";
  if (["rise", "fall"].includes(signalType)) return "glow-cyan border-t-4 border-t-yellow-400";
  return "glow-cyan border-t-4 border-t-primary";
};

const getIcon = (signalType: string) => {
  if (signalType === "over") return <TrendingUp className="w-5 h-5" />;
  if (signalType === "under") return <TrendingDown className="w-5 h-5" />;
  if (signalType === "rise") return <ArrowUpCircle className="w-5 h-5" />;
  if (signalType === "fall") return <ArrowDownCircle className="w-5 h-5" />;
  if (["even", "odd"].includes(signalType)) return <Calculator className="w-5 h-5" />;
  return <Shuffle className="w-5 h-5" />;
};

const getColor = (signalType: string) => {
  if (["even", "odd"].includes(signalType)) return "text-success";
  if (["over", "under"].includes(signalType)) return "text-accent";
  if (["rise", "fall"].includes(signalType)) return "text-yellow-400";
  return "text-primary";
};

const getBarColor = (signalType: string) => {
  if (["even", "odd"].includes(signalType)) return "bg-gradient-to-r from-success to-emerald-400";
  if (["over", "under"].includes(signalType)) return "bg-gradient-to-r from-accent to-purple-500";
  if (["rise", "fall"].includes(signalType)) return "bg-gradient-to-r from-yellow-400 to-orange-500";
  return "confidence-bar";
};

const getIconBg = (signalType: string) => {
  if (["even", "odd"].includes(signalType)) return "bg-success/20 border-success/50 text-success";
  if (["over", "under"].includes(signalType)) return "bg-accent/20 border-accent/50 text-accent";
  if (["rise", "fall"].includes(signalType)) return "bg-yellow-400/20 border-yellow-400/50 text-yellow-400";
  return "bg-primary/20 border-primary/50 text-primary";
};

export const SignalCard = ({ market, signalType, category, probability, entryPoint, expiresAt, validation, entryDigit, predictionDigit, price, indicators }: SignalCardProps) => {
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

  const formatNum = (n: number) => {
    if (Math.abs(n) < 0.01) return n.toExponential(2);
    return n.toFixed(4);
  };

  return (
    <div className={`glass-panel rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 ${getGlowClass(signalType)} ${isExpired ? 'opacity-40' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={`font-orbitron text-base font-bold ${color} uppercase`}>
            {signalType}
          </h3>
          <p className="text-muted-foreground text-xs">{market}</p>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${getIconBg(signalType)}`}>
          {getIcon(signalType)}
        </div>
      </div>

      <div className="flex justify-between items-center bg-background/50 rounded-lg p-3 mb-4 border border-white/5">
        <span className="text-muted-foreground text-sm">Prediction</span>
        <span className={`font-orbitron text-xl font-bold ${color}`}>
          {signalType.toUpperCase()}
        </span>
      </div>

      <div className="space-y-1 mb-4">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Confidence</span>
          <span className={`${color} font-bold`}>{Math.round(probability)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-1000 ${getBarColor(signalType)}`} style={{ width: `${probability}%` }} />
        </div>
      </div>

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

      {/* Technical Indicators */}
      {indicators && (
        <div className="mb-4 bg-background/50 rounded-lg p-3 border border-white/5 space-y-2">
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart3 className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-orbitron text-primary uppercase tracking-wider">Indicators</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div>
              <div className="text-[9px] text-muted-foreground">BB Upper</div>
              <div className="text-[11px] font-mono text-foreground">{formatNum(indicators.bb.upper)}</div>
            </div>
            <div>
              <div className="text-[9px] text-muted-foreground">BB Mid</div>
              <div className="text-[11px] font-mono text-foreground">{formatNum(indicators.bb.middle)}</div>
            </div>
            <div>
              <div className="text-[9px] text-muted-foreground">BB Lower</div>
              <div className="text-[11px] font-mono text-foreground">{formatNum(indicators.bb.lower)}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div>
              <div className="text-[9px] text-muted-foreground">MACD</div>
              <div className={`text-[11px] font-mono ${indicators.macd.histogram > 0 ? 'text-success' : 'text-destructive'}`}>
                {indicators.macd.macdLine.toExponential(2)}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-muted-foreground">Signal</div>
              <div className="text-[11px] font-mono text-foreground">
                {indicators.macd.signalLine.toExponential(2)}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-muted-foreground">RSI</div>
              <div className={`text-[11px] font-mono ${indicators.rsi > 70 ? 'text-destructive' : indicators.rsi < 30 ? 'text-success' : 'text-foreground'}`}>
                {indicators.rsi.toFixed(1)}
              </div>
            </div>
          </div>
          {/* BB Position visual bar */}
          <div>
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>Oversold</span>
              <span>BB Pos: {(indicators.bb.position * 100).toFixed(0)}%</span>
              <span>Overbought</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden relative">
              <div className="absolute h-full w-0.5 bg-foreground/50 rounded" style={{ left: `${Math.min(100, Math.max(0, indicators.bb.position * 100))}%` }} />
            </div>
          </div>
        </div>
      )}

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
          <span className="text-xs text-destructive font-orbitron">EXPIRED - REGENERATING</span>
        </div>
      )}
    </div>
  );
};
