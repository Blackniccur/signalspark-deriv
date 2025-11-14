import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DigitPattern {
  digits: number[];
  prices: number[];
  timestamps: number[];
}

interface DigitPatternTrackerProps {
  patterns: Record<string, DigitPattern>;
  selectedMarket: string;
}

const marketNames: Record<string, string> = {
  "R_10": "Volatility 10 Index",
  "R_25": "Volatility 25 Index",
  "R_50": "Volatility 50 Index",
  "R_75": "Volatility 75 Index",
  "R_100": "Volatility 100 Index",
  "1HZ10V": "Volatility 10 (1s) Index",
  "1HZ25V": "Volatility 25 (1s) Index",
  "1HZ50V": "Volatility 50 (1s) Index",
  "1HZ75V": "Volatility 75 (1s) Index",
  "1HZ100V": "Volatility 100 (1s) Index"
};

export const DigitPatternTracker = ({ patterns, selectedMarket }: DigitPatternTrackerProps) => {
  const filteredPatterns = selectedMarket === "all" 
    ? Object.entries(patterns)
    : Object.entries(patterns).filter(([symbol]) => symbol === selectedMarket);

  if (filteredPatterns.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {filteredPatterns.map(([symbol, pattern]) => {
        if (pattern.digits.length === 0) return null;

        const { digits, prices } = pattern;
        
        // Calculate Even/Odd probabilities
        const evenCount = digits.filter(d => d % 2 === 0).length;
        const oddCount = digits.length - evenCount;
        const evenProbability = digits.length > 0 ? Math.round((evenCount / digits.length) * 100) : 0;
        const oddProbability = digits.length > 0 ? Math.round((oddCount / digits.length) * 100) : 0;
        
        // Calculate Over/Under (Rise/Fall) probabilities
        const priceChanges = prices.slice(1).map((price, i) => price > prices[i] ? 1 : -1);
        const riseCount = priceChanges.filter(change => change === 1).length;
        const fallCount = priceChanges.length - riseCount;
        const riseProbability = priceChanges.length > 0 ? Math.round((riseCount / priceChanges.length) * 100) : 0;
        const fallProbability = priceChanges.length > 0 ? Math.round((fallCount / priceChanges.length) * 100) : 0;
        
        return (
          <Card key={symbol} className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">{marketNames[symbol] || symbol}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Last Digits Display */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Last 20 Digits</p>
                <div className="flex flex-wrap gap-2">
                  {digits.map((digit, idx) => (
                    <Badge 
                      key={idx}
                      variant="outline"
                      className={`w-8 h-8 flex items-center justify-center ${
                        digit % 2 === 0 
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' 
                          : 'bg-purple-500/20 text-purple-400 border-purple-500/50'
                      }`}
                    >
                      {digit}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Even/Odd Pattern */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Even/Odd Pattern</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <p className="text-xs text-muted-foreground">Even</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-blue-400">{evenProbability}%</p>
                      <p className="text-xs text-muted-foreground">({evenCount}/{digits.length})</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <p className="text-xs text-muted-foreground">Odd</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-purple-400">{oddProbability}%</p>
                      <p className="text-xs text-muted-foreground">({oddCount}/{digits.length})</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Over/Under (Rise/Fall) Pattern */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Rise/Fall Pattern</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-xs text-muted-foreground">Rise (Over)</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-green-400">{riseProbability}%</p>
                      <p className="text-xs text-muted-foreground">({riseCount}/{priceChanges.length})</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-xs text-muted-foreground">Fall (Under)</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-red-400">{fallProbability}%</p>
                      <p className="text-xs text-muted-foreground">({fallCount}/{priceChanges.length})</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
