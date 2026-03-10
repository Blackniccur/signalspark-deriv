import { Activity } from "lucide-react";

interface SignalScannerProps {
  tickCounts: Record<string, number>;
  isConnected: boolean;
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

export const SignalScanner = ({ tickCounts, isConnected }: SignalScannerProps) => {
  if (!isConnected) return null;

  return (
    <div className="glass-panel rounded-2xl p-5 glow-cyan">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary animate-pulse" />
        <h3 className="font-orbitron text-sm font-bold tracking-wider text-primary">SIGNAL SCANNER</h3>
        <div className="ml-auto">
          <span className="text-[10px] px-3 py-1 bg-success/10 text-success rounded-full border border-success/30 font-orbitron tracking-widest animate-pulse">
            SCANNING
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        {Object.entries(tickCounts).map(([symbol, count]) => {
          const progress = Math.min((count / 50) * 100, 100);
          const isReady = count >= 50;
          
          return (
            <div key={symbol} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground text-xs">{marketNames[symbol] || symbol}</span>
                <span className={`font-orbitron text-xs font-medium ${isReady ? 'text-success' : 'text-primary'}`}>
                  {count}/50 {isReady && '✓'}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${isReady ? 'bg-success' : 'confidence-bar'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {Object.keys(tickCounts).length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4 font-orbitron text-xs tracking-wider">
          Waiting for market data...
        </p>
      )}
    </div>
  );
};
