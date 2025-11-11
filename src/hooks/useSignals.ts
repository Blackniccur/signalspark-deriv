import { useState, useEffect, useCallback } from 'react';

export interface Signal {
  id: string;
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

interface TickData {
  ask: number;
  bid: number;
  epoch: number;
  quote: number;
  symbol: string;
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

const analyzeTickData = (symbol: string, currentPrice: number, historicalPrices: number[]): Signal[] => {
  // Need at least 50 ticks for analysis
  if (historicalPrices.length < 50) {
    return [];
  }

  const entryDigit = Math.floor((currentPrice * 100) % 10);
  const last50Prices = historicalPrices.slice(-50);
  
  // Calculate statistics
  const avgPrice = last50Prices.reduce((a, b) => a + b, 0) / 50;
  const priceChanges = last50Prices.slice(1).map((p, i) => p - last50Prices[i]);
  const volatility = Math.sqrt(priceChanges.reduce((sum, change) => sum + change * change, 0) / 49);
  const trend = (currentPrice - last50Prices[0]) / last50Prices[0];
  
  // Calculate digit frequencies
  const digits = last50Prices.map(p => Math.floor((p * 100) % 10));
  const digitCounts = digits.reduce((acc, d) => {
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const recentDigits = digits.slice(-10);
  const evenInRecent = recentDigits.filter(d => d % 2 === 0).length;
  const oddInRecent = recentDigits.filter(d => d % 2 !== 0).length;
  
  const signals: Signal[] = [];
  const now = Date.now();
  const expiresAt = now + 100000; // 100 seconds
  const entryTime = new Date(now).toLocaleTimeString();
  
  // Even/Odd Signal
  const evenCount = digits.filter(d => d % 2 === 0).length;
  const oddCount = 50 - evenCount;
  const predictedEvenOdd = evenInRecent > oddInRecent ? "even" : "odd";
  const evenOddConfidence = Math.abs(evenInRecent - oddInRecent) / 10;
  
  const evenOddSignal: Signal = {
    id: `${symbol}-evenodd-${now}`,
    market: marketNames[symbol] || symbol,
    signalType: predictedEvenOdd,
    category: "digit",
    probability: Math.min(88, Math.max(58, 60 + evenOddConfidence * 28)),
    entryPoint: entryTime,
    expiresAt,
    validation: evenOddConfidence > 0.4 ? "strong" : evenOddConfidence > 0.2 ? "medium" : "weak",
    entryDigit,
    price: currentPrice
  };
  signals.push(evenOddSignal);
  
  // Over/Under Signal
  const recentTrend = (last50Prices.slice(-5).reduce((a, b) => a + b, 0) / 5) - avgPrice;
  const predictedDirection = recentTrend > 0 ? "over" : "under";
  const trendStrength = Math.abs(recentTrend / avgPrice);
  
  const overUnderSignal: Signal = {
    id: `${symbol}-overunder-${now}`,
    market: marketNames[symbol] || symbol,
    signalType: predictedDirection,
    category: "direction",
    probability: Math.min(85, 62 + trendStrength * 2000),
    entryPoint: entryTime,
    expiresAt,
    validation: trendStrength > 0.015 ? "strong" : trendStrength > 0.008 ? "medium" : "weak",
    entryDigit,
    predictionDigit: entryDigit,
    price: currentPrice
  };
  signals.push(overUnderSignal);
  
  // Matches/Differs Signal
  const mostFrequentDigit = Object.entries(digitCounts).sort((a, b) => b[1] - a[1])[0];
  const predictionDigit = parseInt(mostFrequentDigit[0]);
  const digitFrequency = mostFrequentDigit[1] / 50;
  const predictedType = entryDigit === predictionDigit ? "differs" : "matches";
  
  const matchesDiffersSignal: Signal = {
    id: `${symbol}-matchesdiffer-${now}`,
    market: marketNames[symbol] || symbol,
    signalType: predictedType,
    category: "digit",
    probability: Math.min(78, 58 + digitFrequency * 40),
    entryPoint: entryTime,
    expiresAt,
    validation: digitFrequency > 0.25 ? "strong" : digitFrequency > 0.18 ? "medium" : "weak",
    entryDigit,
    predictionDigit,
    price: currentPrice
  };
  signals.push(matchesDiffersSignal);
  
  return signals;
};

export const useSignals = (connected: boolean) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [priceHistory, setPriceHistory] = useState<Record<string, number[]>>({});
  const [tickCounts, setTickCounts] = useState<Record<string, number>>({});
  const [lastSignalTime, setLastSignalTime] = useState<Record<string, Record<string, number>>>({});

  const connect = useCallback(() => {
    if (ws?.readyState === WebSocket.OPEN) return;
    
    const websocket = new WebSocket('wss://emkofuphwrcpnjwogxlh.supabase.co/functions/v1/deriv-signals');
    
    websocket.onopen = () => {
      console.log('Connected to Deriv signals');
    };
    
    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'tick' && message.data) {
          const tick: TickData = message.data;
          
          setPriceHistory(prev => {
            const history = prev[tick.symbol] || [];
            const newHistory = [...history, tick.quote].slice(-100);
            
            setTickCounts(prevCounts => ({
              ...prevCounts,
              [tick.symbol]: newHistory.length
            }));
            
            // Only generate signals if we have 50+ ticks
            if (newHistory.length >= 50) {
              setLastSignalTime(prevLastSignalTime => {
                const now = Date.now();
                const symbolSignalTimes = prevLastSignalTime[tick.symbol] || {};
                
                setSignals(prevSignals => {
                  // Remove expired signals
                  const activeSignals = prevSignals.filter(s => s.expiresAt > now);
                  
                  // Generate new signals only for expired signal types
                  const newSignals = analyzeTickData(tick.symbol, tick.quote, newHistory);
                  const signalsToAdd: Signal[] = [];
                  
                  newSignals.forEach(newSignal => {
                    const signalKey = `${tick.symbol}-${newSignal.signalType}`;
                    const lastTime = symbolSignalTimes[signalKey] || 0;
                    
                    // Only add if no active signal exists for this type or the last one expired
                    const hasActiveSignal = activeSignals.some(
                      s => s.market === newSignal.market && s.signalType === newSignal.signalType && s.expiresAt > now
                    );
                    
                    if (!hasActiveSignal && now - lastTime >= 100000) {
                      signalsToAdd.push(newSignal);
                      symbolSignalTimes[signalKey] = now;
                    }
                  });
                  
                  return [...activeSignals, ...signalsToAdd].slice(-50);
                });
                
                return { ...prevLastSignalTime, [tick.symbol]: symbolSignalTimes };
              });
            }
            
            return { ...prev, [tick.symbol]: newHistory };
          });
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };
    
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    websocket.onclose = () => {
      console.log('Disconnected from Deriv signals');
      setWs(null);
    };
    
    setWs(websocket);
  }, [ws]);

  const disconnect = useCallback(() => {
    if (ws) {
      ws.close();
      setWs(null);
      setSignals([]);
      setPriceHistory({});
      setTickCounts({});
      setLastSignalTime({});
    }
  }, [ws]);

  useEffect(() => {
    if (connected) {
      connect();
    } else {
      disconnect();
    }
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [connected]);

  return { signals, isConnected: ws?.readyState === WebSocket.OPEN, tickCounts };
};
