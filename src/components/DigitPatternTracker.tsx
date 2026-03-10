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

  if (filteredPatterns.length === 0) return null;

  return (
    <div className="space-y-4">
      {filteredPatterns.map(([symbol, pattern]) => {
        if (pattern.digits.length === 0) return null;
        const { digits, prices } = pattern;
        
        const evenCount = digits.filter(d => d % 2 === 0).length;
        const oddCount = digits.length - evenCount;
        const evenProbability = digits.length > 0 ? Math.round((evenCount / digits.length) * 100) : 0;
        const oddProbability = digits.length > 0 ? Math.round((oddCount / digits.length) * 100) : 0;
        
        const priceChanges = prices.slice(1).map((price, i) => price > prices[i] ? 1 : -1);
        const riseCount = priceChanges.filter(change => change === 1).length;
        const fallCount = priceChanges.length - riseCount;
        const riseProbability = priceChanges.length > 0 ? Math.round((riseCount / priceChanges.length) * 100) : 0;
        const fallProbability = priceChanges.length > 0 ? Math.round((fallCount / priceChanges.length) * 100) : 0;
        
        return (
          <div key={symbol} className="glass-panel rounded-2xl p-5">
            <h3 className="font-orbitron text-sm font-bold text-accent tracking-wider mb-4">
              {marketNames[symbol] || symbol}
            </h3>
            
            {/* Last Digits */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Last 20 Digits</p>
              <div className="flex flex-wrap gap-1.5">
                {digits.map((digit, idx) => (
                  <span 
                    key={idx}
                    className={`w-7 h-7 flex items-center justify-center rounded text-xs font-orbitron font-bold border ${
                      digit % 2 === 0 
                        ? 'bg-primary/10 text-primary border-primary/30' 
                        : 'bg-accent/10 text-accent border-accent/30'
                    }`}
                  >
                    {digit}
                  </span>
                ))}
              </div>
            </div>

            {/* Even/Odd + Rise/Fall */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <p className="text-xs font-orbitron text-muted-foreground tracking-wider">EVEN/ODD</p>
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-[10px] text-muted-foreground">Even</p>
                  <p className="text-xl font-orbitron font-bold text-primary">{evenProbability}%</p>
                </div>
                <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                  <p className="text-[10px] text-muted-foreground">Odd</p>
                  <p className="text-xl font-orbitron font-bold text-accent">{oddProbability}%</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-orbitron text-muted-foreground tracking-wider">RISE/FALL</p>
                <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                  <p className="text-[10px] text-muted-foreground">Rise</p>
                  <p className="text-xl font-orbitron font-bold text-success">{riseProbability}%</p>
                </div>
                <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <p className="text-[10px] text-muted-foreground">Fall</p>
                  <p className="text-xl font-orbitron font-bold text-destructive">{fallProbability}%</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
