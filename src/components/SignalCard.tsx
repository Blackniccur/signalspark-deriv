import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface SignalCardProps {
  market: string;
  signalType: "over" | "under" | "even" | "odd" | "rise" | "fall" | "matches" | "differs" | "touch" | "no-touch";
  category: "digit" | "direction" | "touch";
  probability: number;
  entryPoint: string;
  validation: "strong" | "medium" | "weak";
  digit?: number;
  price?: number;
  targetPrice?: number;
}

export const SignalCard = ({ market, signalType, category, probability, entryPoint, validation, digit, price, targetPrice }: SignalCardProps) => {
  const getValidationColor = () => {
    switch (validation) {
      case "strong": return "bg-green-500/20 text-green-400 border-green-500/50";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "weak": return "bg-red-500/20 text-red-400 border-red-500/50";
    }
  };

  const getSignalColor = () => {
    if (["over", "rise"].includes(signalType)) return "text-green-500";
    if (["under", "fall"].includes(signalType)) return "text-red-500";
    if (["even", "odd"].includes(signalType)) return "text-blue-500";
    if (["touch", "no-touch"].includes(signalType)) return "text-purple-500";
    return "text-yellow-500";
  };

  const getCategoryLabel = () => {
    switch(category) {
      case "digit": return "Digit Signal";
      case "direction": return "Direction Signal";
      case "touch": return "Touch Signal";
    }
  };

  return (
    <Card className="overflow-hidden border-border/50 hover:border-primary/50 transition-all">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{market}</CardTitle>
            <p className="text-xs text-muted-foreground">{getCategoryLabel()}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {signalType === "over" && "📈 Over"}
              {signalType === "under" && "📉 Under"}
              {signalType === "rise" && "🚀 Rise"}
              {signalType === "fall" && "📉 Fall"}
              {signalType === "even" && "⚖️ Even"}
              {signalType === "odd" && "🎯 Odd"}
              {signalType === "matches" && "🎲 Matches"}
              {signalType === "differs" && "🔄 Differs"}
              {signalType === "touch" && "👆 Touch"}
              {signalType === "no-touch" && "🚫 No Touch"}
            </p>
          </div>
          <Badge className={getValidationColor()}>
            {validation}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Probability</span>
              <span className={getSignalColor()}>{probability}%</span>
            </div>
            <Progress value={probability} className="h-2" />
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Valid For</span>
            <span className="font-medium">100 seconds</span>
          </div>

          {price && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Price</span>
              <span className="font-medium">{price.toFixed(2)}</span>
            </div>
          )}

          {targetPrice && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Target Price</span>
              <span className="font-medium">{targetPrice.toFixed(2)}</span>
            </div>
          )}
          
          {digit !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Prediction Digit</span>
              <span className="font-bold text-lg">{digit}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
