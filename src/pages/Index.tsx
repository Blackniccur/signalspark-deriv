import { MarketHeader } from "@/components/MarketHeader";
import { MarketStats } from "@/components/MarketStats";
import { SignalCard } from "@/components/SignalCard";
import { SignalScanner } from "@/components/SignalScanner";
import { DigitPatternTracker } from "@/components/DigitPatternTracker";
import { TradingDashboard } from "@/components/TradingDashboard";
import { DerivTradingView } from "@/components/DerivTradingView";
import { useSignals } from "@/hooks/useSignals";
import { useSignalSound } from "@/hooks/useSignalSound";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info } from "lucide-react";
import { useState } from "react";

const Index = () => {
  const [connected, setConnected] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<string>("all");
  const [contractFilter, setContractFilter] = useState<string>("all");
  const { signals, isConnected, tickCounts, digitPatterns } = useSignals(connected);
  useSignalSound(signals);

  const filteredSignals = selectedMarket === "all" 
    ? signals 
    : signals.filter(s => s.market.includes(selectedMarket.replace("_", " ")));

  const displaySignals = contractFilter === "all" 
    ? filteredSignals
    : contractFilter === "evenodd" ? filteredSignals.filter(s => ["even", "odd"].includes(s.signalType))
    : contractFilter === "overunder" ? filteredSignals.filter(s => ["over", "under"].includes(s.signalType))
    : contractFilter === "risefall" ? filteredSignals.filter(s => ["rise", "fall"].includes(s.signalType))
    : filteredSignals.filter(s => ["matches", "differs"].includes(s.signalType));

  return (
    <div className="min-h-screen bg-background bg-grid-pattern relative">
      <MarketHeader connected={isConnected} onToggleConnection={() => setConnected(!connected)} />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="glass-panel rounded-xl p-4 glow-cyan flex items-center gap-3">
            <Info className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-primary font-orbitron text-xs">Log in to mentorhub.site</strong>
              <span className="mx-2">•</span>
              Using Richkiddollar hunterbot • Only configured bot works
            </p>
          </div>

          {/* Control Panel */}
          <div className="glass-panel rounded-2xl p-5 glow-cyan">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-primary text-[10px] font-orbitron uppercase tracking-widest">Market</label>
                <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                  <SelectTrigger className="bg-background/50 border-primary/20 text-foreground">
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
              </div>

              <div className="space-y-1">
                <label className="text-primary text-[10px] font-orbitron uppercase tracking-widest">Contract Type</label>
                <Select value={contractFilter} onValueChange={setContractFilter}>
                  <SelectTrigger className="bg-background/50 border-primary/20 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Signals</SelectItem>
                    <SelectItem value="evenodd">Even/Odd</SelectItem>
                    <SelectItem value="overunder">Over/Under</SelectItem>
                    <SelectItem value="risefall">Rise/Fall</SelectItem>
                    <SelectItem value="matches">Matches/Differs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setConnected(!connected)}
                  className="w-full bg-gradient-to-r from-primary/80 to-accent/60 hover:from-primary hover:to-accent text-background font-orbitron font-bold py-2.5 px-6 rounded-lg transition-all duration-300 active:scale-95 tracking-wider text-sm border border-primary/30 shadow-lg shadow-primary/20"
                >
                  {isConnected ? 'STOP SCANNING' : 'GENERATE SIGNALS'}
                </button>
              </div>
            </div>
          </div>
          
          <SignalScanner tickCounts={tickCounts} isConnected={isConnected} />
          
          <MarketStats signals={signals} />

          {isConnected && Object.keys(digitPatterns).length > 0 && (
            <TradingDashboard digitPatterns={digitPatterns} />
          )}

          {isConnected && Object.keys(digitPatterns).length > 0 && (
            <DerivTradingView digitPatterns={digitPatterns} />
          )}

          {/* Signal Cards */}
          {displaySignals.length > 0 && (
            <div>
              <div className="mb-4">
                <h2 className="font-orbitron text-lg font-bold text-primary tracking-wider">LIVE SIGNALS</h2>
                <p className="text-xs text-muted-foreground">Analyzing 50 ticks • 100 second validation</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displaySignals.map((signal) => (
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
                    indicators={signal.indicators}
                    holdTicks={signal.holdTicks}
                  />
                ))}
              </div>
            </div>
          )}

          {isConnected && Object.keys(digitPatterns).length > 0 && (
            <div>
              <h2 className="font-orbitron text-lg font-bold text-accent tracking-wider mb-4">DIGIT PATTERNS</h2>
              <DigitPatternTracker patterns={digitPatterns} selectedMarket={selectedMarket} />
            </div>
          )}

          {!isConnected && signals.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground font-orbitron text-sm tracking-wider">
                Click "GENERATE SIGNALS" to start receiving predictions
              </p>
            </div>
          )}

          {isConnected && signals.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-block animate-pulse">
                <p className="text-primary font-orbitron text-sm tracking-wider">
                  COLLECTING 50 TICKS FOR ANALYSIS...
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
