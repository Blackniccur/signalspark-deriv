import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

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

export const SignalCard = ({ market, signalType, category, probability, entryPoint, expiresAt, validation, entryDigit, predictionDigit, price }: SignalCardProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(remaining);
      setIsExpired(remaining === 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);
  const getValidationColor = () => {
    switch (validation) {
      case "strong": return "bg-green-500/20 text-green-400 border-green-500/50";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "weak": return "bg-red-500/20 text-red-400 border-red-500/50";
    }
  };

  const getSignalColor = () => {
    if (signalType === "over") return "text-green-500";
    if (signalType === "under") return "text-red-500";
    if (["even", "odd"].includes(signalType)) return "text-blue-500";
    if (["matches", "differs"].includes(signalType)) return "text-purple-500";
    return "text-yellow-500";
  };

  const getCategoryLabel = () => {
    switch(category) {
      case "digit": return "Digit Signal";
      case "direction": return "Direction Signal";
    }
  };

  return (
    <Card className={`overflow-hidden border-border/50 hover:border-primary/50 transition-all ${isExpired ? 'opacity-50' : ''}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{market}</CardTitle>
            <p className="text-xs text-muted-foreground">{getCategoryLabel()}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {signalType === "over" && "📈 Over"}
              {signalType === "under" && "📉 Under"}
              {signalType === "even" && "⚖️ Even"}
              {signalType === "odd" && "🎯 Odd"}
              {signalType === "matches" && "🎲 Matches"}
              {signalType === "differs" && "🔄 Differs"}
            </p>
          </div>
          <Badge className={getValidationColor()}>
            {validation}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {isExpired && (
          <div className="mb-3 p-2 bg-destructive/10 border border-destructive/50 rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive font-medium">Signal Expired</span>
          </div>
        )}
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Probability</span>
              <span className={getSignalColor()}>{probability}%</span>
            </div>
            <Progress value={probability} className="h-2" />
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Time Remaining</span>
            <span className={`font-medium ${timeLeft < 20 ? 'text-destructive' : ''}`}>
              {timeLeft}s
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Entry Digit</span>
            <span className="font-bold text-lg">{entryDigit}</span>
          </div>

          {predictionDigit !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Prediction Digit</span>
              <span className="font-bold text-lg text-primary">{predictionDigit}</span>
            </div>
          )}

          {price && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Price</span>
              <span className="font-medium">{price.toFixed(2)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
