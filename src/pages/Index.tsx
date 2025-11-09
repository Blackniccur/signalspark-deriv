import { MarketHeader } from "@/components/MarketHeader";
import { MarketStats } from "@/components/MarketStats";
import { SignalCard } from "@/components/SignalCard";
import { useSignals } from "@/hooks/useSignals";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

const Index = () => {
  const [connected, setConnected] = useState(false);
  const { signals, isConnected } = useSignals(connected);

  const digitSignals = signals.filter(s => s.category === "digit");
  const directionSignals = signals.filter(s => s.category === "direction");
  const touchSignals = signals.filter(s => s.category === "touch");

  return (
    <div className="min-h-screen bg-background">
      <MarketHeader connected={isConnected} onToggleConnection={() => setConnected(!connected)} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <MarketStats />

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Live Trading Signals</h2>
              <p className="text-sm text-muted-foreground">Analyzing 50 ticks • 100 second validation</p>
            </div>
            <Button variant="outline" size="sm" className="border-border">
              <RefreshCw className="w-4 h-4 mr-2" />
              Auto-refresh: ON
            </Button>
          </div>

          {signals.length === 0 && !isConnected && (
            <div className="text-center py-12 text-muted-foreground">
              Click "Connect to Deriv" to start receiving real-time signals
            </div>
          )}
          
          {signals.length === 0 && isConnected && (
            <div className="text-center py-12 text-muted-foreground">
              Collecting 50 ticks for analysis...
            </div>
          )}

          {signals.length > 0 && (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All ({signals.length})</TabsTrigger>
                <TabsTrigger value="digit">Digit ({digitSignals.length})</TabsTrigger>
                <TabsTrigger value="direction">Direction ({directionSignals.length})</TabsTrigger>
                <TabsTrigger value="touch">Touch ({touchSignals.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {signals.map((signal) => (
                    <SignalCard
                      key={signal.id}
                      market={signal.market}
                      signalType={signal.signalType}
                      category={signal.category}
                      probability={signal.probability}
                      entryPoint={signal.entryPoint}
                      expiresAt={signal.expiresAt}
                      validation={signal.validation}
                      entryDigit={signal.entryDigit}
                      predictionDigit={signal.predictionDigit}
                      price={signal.price}
                      targetPrice={signal.targetPrice}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="digit" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {digitSignals.map((signal) => (
                    <SignalCard
                      key={signal.id}
                      market={signal.market}
                      signalType={signal.signalType}
                      category={signal.category}
                      probability={signal.probability}
                      entryPoint={signal.entryPoint}
                      expiresAt={signal.expiresAt}
                      validation={signal.validation}
                      entryDigit={signal.entryDigit}
                      predictionDigit={signal.predictionDigit}
                      price={signal.price}
                      targetPrice={signal.targetPrice}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="direction" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {directionSignals.map((signal) => (
                    <SignalCard
                      key={signal.id}
                      market={signal.market}
                      signalType={signal.signalType}
                      category={signal.category}
                      probability={signal.probability}
                      entryPoint={signal.entryPoint}
                      expiresAt={signal.expiresAt}
                      validation={signal.validation}
                      entryDigit={signal.entryDigit}
                      predictionDigit={signal.predictionDigit}
                      price={signal.price}
                      targetPrice={signal.targetPrice}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="touch" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {touchSignals.map((signal) => (
                    <SignalCard
                      key={signal.id}
                      market={signal.market}
                      signalType={signal.signalType}
                      category={signal.category}
                      probability={signal.probability}
                      entryPoint={signal.entryPoint}
                      expiresAt={signal.expiresAt}
                      validation={signal.validation}
                      entryDigit={signal.entryDigit}
                      predictionDigit={signal.predictionDigit}
                      price={signal.price}
                      targetPrice={signal.targetPrice}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <div className="mt-8 p-6 bg-card/50 border border-border rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">How to Use This Tool</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong className="text-foreground">50 Tick Analysis:</strong> Signals generated after analyzing 50 ticks of market data</li>
              <li>• <strong className="text-foreground">100 Second Validation:</strong> All signals are valid for 100 seconds</li>
              <li>• <strong className="text-foreground">Signal Types:</strong> Even/Odd, Over/Under, Matches/Differs, Touch/No Touch</li>
              <li>• <strong className="text-foreground">Digit Signals:</strong> Prediction digit shown for digit-based trades</li>
              <li>• <strong className="text-foreground">Touch Signals:</strong> Target price displayed for touch/no-touch trades</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
