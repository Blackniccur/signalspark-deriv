import { MarketHeader } from "@/components/MarketHeader";
import { MarketStats } from "@/components/MarketStats";
import { SignalCard } from "@/components/SignalCard";
import { SignalScanner } from "@/components/SignalScanner";
import { DigitPatternTracker } from "@/components/DigitPatternTracker";
import { TradingDashboard } from "@/components/TradingDashboard";
import { useSignals } from "@/hooks/useSignals";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useState } from "react";

const Index = () => {
  const [connected, setConnected] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<string>("all");
  const { signals, isConnected, tickCounts, digitPatterns } = useSignals(connected);

  const filteredSignals = selectedMarket === "all" 
    ? signals 
    : signals.filter(s => s.market.includes(selectedMarket.replace("_", " ")));

  const evenOddSignals = filteredSignals.filter(s => ["even", "odd"].includes(s.signalType));
  const overUnderSignals = filteredSignals.filter(s => ["over", "under"].includes(s.signalType));
  const matchesDiffersSignals = filteredSignals.filter(s => ["matches", "differs"].includes(s.signalType));

  return (
    <div className="min-h-screen bg-background">
      <MarketHeader connected={isConnected} onToggleConnection={() => setConnected(!connected)} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Alert className="bg-primary/10 border-primary">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-foreground">
              <strong>Log in to mentorhub.site</strong> • Using Richkiddollar hunterbot • Only configured bot works
            </AlertDescription>
          </Alert>
          
          <SignalScanner tickCounts={tickCounts} isConnected={isConnected} />
          
          <MarketStats />

          {isConnected && Object.keys(digitPatterns).length > 0 && (
            <TradingDashboard digitPatterns={digitPatterns} />
          )}
          
          {isConnected && Object.keys(digitPatterns).length > 0 && (
            <>
              <div>
                <h2 className="text-xl font-bold text-foreground">Last Digit Patterns</h2>
                <p className="text-sm text-muted-foreground">Real-time even/odd and rise/fall probabilities</p>
              </div>
              <DigitPatternTracker patterns={digitPatterns} selectedMarket={selectedMarket} />
            </>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Live Trading Signals</h2>
              <p className="text-sm text-muted-foreground">Analyzing 50 ticks • 100 second validation</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Market" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Markets</SelectItem>
                  <SelectItem value="10">Volatility 10</SelectItem>
                  <SelectItem value="25">Volatility 25</SelectItem>
                  <SelectItem value="50">Volatility 50</SelectItem>
                  <SelectItem value="75">Volatility 75</SelectItem>
                  <SelectItem value="100">Volatility 100</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="border-border">
                <RefreshCw className="w-4 h-4 mr-2" />
                Auto-refresh: ON
              </Button>
            </div>
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

          {filteredSignals.length > 0 && (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All ({filteredSignals.length})</TabsTrigger>
                <TabsTrigger value="evenodd">Even/Odd ({evenOddSignals.length})</TabsTrigger>
                <TabsTrigger value="overunder">Over/Under ({overUnderSignals.length})</TabsTrigger>
                <TabsTrigger value="matches">Matches/Differs ({matchesDiffersSignals.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredSignals.map((signal) => (
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
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="evenodd" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {evenOddSignals.map((signal) => (
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
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="overunder" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {overUnderSignals.map((signal) => (
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
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="matches" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {matchesDiffersSignals.map((signal) => (
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
              <li>• <strong className="text-foreground">Signal Types:</strong> Even/Odd, Over/Under, Matches/Differs</li>
              <li>• <strong className="text-foreground">Market Filter:</strong> Switch between different volatility indices</li>
              <li>• <strong className="text-foreground">Signal Persistence:</strong> Signals remain active until expiry, then regenerate automatically</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
