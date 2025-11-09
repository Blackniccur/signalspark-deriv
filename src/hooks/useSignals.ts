import { useState, useEffect, useCallback } from 'react';

export interface Signal {
  id: string;
  market: string;
  signalType: "over" | "under" | "even" | "odd" | "matches" | "differs" | "touch" | "no-touch";
  category: "digit" | "direction" | "touch";
  probability: number;
  entryPoint: string;
  validation: "strong" | "medium" | "weak";
  digit?: number;
  price?: number;
  targetPrice?: number;
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
  "1HZ100V": "Volatility 100 (1s) Index",
  "BOOM300N": "Boom 300 Index",
  "BOOM500N": "Boom 500 Index",
  "CRASH300N": "Crash 300 Index",
  "CRASH500N": "Crash 500 Index"
};

const analyzeTickData = (symbol: string, currentPrice: number, historicalPrices: number[]): Signal[] => {
  // Need at least 50 ticks for analysis
  if (historicalPrices.length < 50) {
    return [];
  }

  const lastDigit = Math.floor((currentPrice * 100) % 10);
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
  
  const signals: Signal[] = [];
  const entryTime = new Date(Date.now() + 100000).toLocaleTimeString(); // 100 seconds validation
  
  // Even/Odd Signal
  const evenCount = digits.filter(d => d % 2 === 0).length;
  const oddCount = 50 - evenCount;
  const evenOddSignal: Signal = {
    id: `${symbol}-evenodd-${Date.now()}`,
    market: marketNames[symbol] || symbol,
    signalType: lastDigit % 2 === 0 ? "odd" : "even",
    category: "digit",
    probability: Math.min(85, Math.max(55, Math.abs(evenCount - oddCount) * 2 + 55)),
    entryPoint: entryTime,
    validation: "medium",
    digit: lastDigit,
    price: currentPrice
  };
  signals.push(evenOddSignal);
  
  // Over/Under Signal
  const overUnderSignal: Signal = {
    id: `${symbol}-overunder-${Date.now()}`,
    market: marketNames[symbol] || symbol,
    signalType: trend > 0 ? "over" : "under",
    category: "direction",
    probability: Math.min(80, 60 + Math.abs(trend) * 1000),
    entryPoint: entryTime,
    validation: Math.abs(trend) > 0.02 ? "strong" : "medium",
    digit: lastDigit,
    price: currentPrice
  };
  signals.push(overUnderSignal);
  
  // Matches/Differs Signal
  const mostFrequentDigit = Object.entries(digitCounts).sort((a, b) => b[1] - a[1])[0];
  const matchesDiffersSignal: Signal = {
    id: `${symbol}-matchesdiffer-${Date.now()}`,
    market: marketNames[symbol] || symbol,
    signalType: lastDigit === parseInt(mostFrequentDigit[0]) ? "differs" : "matches",
    category: "digit",
    probability: Math.min(75, 55 + mostFrequentDigit[1]),
    entryPoint: entryTime,
    validation: "weak",
    digit: parseInt(mostFrequentDigit[0]),
    price: currentPrice
  };
  signals.push(matchesDiffersSignal);
  
  // Touch/No Touch Signal
  const priceRange = Math.max(...last50Prices) - Math.min(...last50Prices);
  const targetPrice = trend > 0 ? currentPrice + volatility * 2 : currentPrice - volatility * 2;
  const touchSignal: Signal = {
    id: `${symbol}-touch-${Date.now()}`,
    market: marketNames[symbol] || symbol,
    signalType: volatility > avgPrice * 0.015 ? "touch" : "no-touch",
    category: "touch",
    probability: Math.min(82, 58 + (volatility / avgPrice) * 2000),
    entryPoint: entryTime,
    validation: volatility > avgPrice * 0.02 ? "strong" : "medium",
    price: currentPrice,
    targetPrice: parseFloat(targetPrice.toFixed(2))
  };
  signals.push(touchSignal);
  
  return signals;
};

export const useSignals = (connected: boolean) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [priceHistory, setPriceHistory] = useState<Record<string, number[]>>({});

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
            
            setSignals(prevSignals => {
              const newSignals = analyzeTickData(tick.symbol, tick.quote, newHistory);
              
              if (newSignals.length === 0) {
                return prevSignals;
              }
              
              // Remove old signals for this market
              const filtered = prevSignals.filter(s => s.market !== marketNames[tick.symbol]);
              return [...filtered, ...newSignals];
            });
            
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

  return { signals, isConnected: ws?.readyState === WebSocket.OPEN };
};
