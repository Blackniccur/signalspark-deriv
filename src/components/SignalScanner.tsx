import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
    <Card className="p-4 mb-6 border-primary/20">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary animate-pulse" />
        <h3 className="font-semibold text-lg">Signal Scanner</h3>
        <div className="ml-auto">
          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/50">
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
                <span className="text-muted-foreground">{marketNames[symbol] || symbol}</span>
                <span className={`font-medium ${isReady ? 'text-green-400' : 'text-yellow-400'}`}>
                  {count}/50 ticks {isReady && '✓'}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          );
        })}
      </div>
      
      {Object.keys(tickCounts).length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Waiting for market data...
        </p>
      )}
    </Card>
  );
};
