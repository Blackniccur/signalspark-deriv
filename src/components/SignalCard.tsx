import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

interface SignalCardProps {
  market: string;
  signalType: "over" | "under" | "even" | "odd" | "rise" | "fall" | "matches" | "differs";
  probability: number;
  entryPoint: string;
  validation: "strong" | "medium" | "weak";
  digit?: number;
}

export const SignalCard = ({ 
  market, 
  signalType, 
  probability, 
  entryPoint, 
  validation,
  digit 
}: SignalCardProps) => {
  const isBullish = ["over", "rise"].includes(signalType);
  const isBearish = ["under", "fall"].includes(signalType);
  
  const getValidationColor = () => {
    switch (validation) {
      case "strong": return "bg-success text-success-foreground";
      case "medium": return "bg-accent text-accent-foreground";
      case "weak": return "bg-muted text-muted-foreground";
    }
  };

  const getSignalColor = () => {
    if (isBullish) return "text-success";
    if (isBearish) return "text-destructive";
    return "text-primary";
  };

  return (
    <Card className="p-4 bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-foreground">{market}</h3>
          <p className="text-sm text-muted-foreground">Volatility Index</p>
        </div>
        <Badge className={getValidationColor()}>
          {validation.toUpperCase()}
        </Badge>
      </div>

      <div className="flex items-center gap-2 mb-3">
        {isBullish && <TrendingUp className="w-5 h-5 text-success" />}
        {isBearish && <TrendingDown className="w-5 h-5 text-destructive" />}
        <span className={`text-lg font-bold uppercase ${getSignalColor()}`}>
          {signalType}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Probability</span>
          <span className="text-sm font-semibold text-foreground">{probability}%</span>
        </div>
        
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              probability >= 70 ? 'bg-success' : 
              probability >= 50 ? 'bg-accent' : 
              'bg-destructive'
            }`}
            style={{ width: `${probability}%` }}
          />
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-sm text-muted-foreground">Entry Point</span>
          <div className="flex items-center gap-1">
            <ArrowRight className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary">{entryPoint}</span>
          </div>
        </div>

        {digit !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Entry Digit</span>
            <span className="text-lg font-bold text-accent">{digit}</span>
          </div>
        )}
      </div>
    </Card>
  );
};
