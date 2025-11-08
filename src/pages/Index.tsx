import { MarketHeader } from "@/components/MarketHeader";
import { MarketStats } from "@/components/MarketStats";
import { SignalCard } from "@/components/SignalCard";
import { useSignals } from "@/hooks/useSignals";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Index = () => {
  const [connected, setConnected] = useState(false);
  const { signals, isConnected } = useSignals(connected);

  return (
    <div className="min-h-screen bg-background">
      <MarketHeader connected={isConnected} onToggleConnection={() => setConnected(!connected)} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <MarketStats />

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Live Trading Signals</h2>
              <p className="text-sm text-muted-foreground">Updated in real-time across all markets</p>
            </div>
            <Button variant="outline" size="sm" className="border-border">
              <RefreshCw className="w-4 h-4 mr-2" />
              Auto-refresh: ON
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {signals.length === 0 && !isConnected && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                Click "Connect to Deriv" to start receiving real-time signals
              </div>
            )}
            {signals.length === 0 && isConnected && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                Connecting to markets...
              </div>
            )}
            {signals.map((signal) => (
              <SignalCard
                key={signal.id}
                market={signal.market}
                signalType={signal.signalType}
                probability={signal.probability}
                entryPoint={signal.entryPoint}
                validation={signal.validation}
                digit={signal.digit}
                price={signal.price}
              />
            ))}
          </div>

          <div className="mt-8 p-6 bg-card/50 border border-border rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">How to Use This Tool</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong className="text-foreground">Connect to Deriv:</strong> Click the connect button to link your Deriv account</li>
              <li>• <strong className="text-foreground">Signal Validation:</strong> Strong signals have 75%+ probability, medium 60-75%, weak below 60%</li>
              <li>• <strong className="text-foreground">Entry Point:</strong> Recommended time to enter the trade</li>
              <li>• <strong className="text-foreground">Entry Digit:</strong> For digit-based trades (matches/differs/even/odd)</li>
              <li>• <strong className="text-foreground">Auto-refresh:</strong> Signals update automatically every 5 seconds</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
