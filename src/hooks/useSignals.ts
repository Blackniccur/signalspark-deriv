import { useState, useEffect, useCallback } from 'react';

export interface Signal {
  id: string;
  market: string;
  signalType: "over" | "under" | "even" | "odd" | "rise" | "fall" | "matches" | "differs";
  probability: number;
  entryPoint: string;
  validation: "strong" | "medium" | "weak";
  digit?: number;
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
  "1HZ100V": "Volatility 100 (1s) Index",
  "BOOM300N": "Boom 300 Index",
  "BOOM500N": "Boom 500 Index",
  "CRASH300N": "Crash 300 Index",
  "CRASH500N": "Crash 500 Index"
};

const analyzeTickData = (symbol: string, currentPrice: number, historicalPrices: number[]): Signal => {
  const lastDigit = Math.floor((currentPrice * 100) % 10);
  const priceChange = historicalPrices.length > 0 ? currentPrice - historicalPrices[historicalPrices.length - 1] : 0;
  
  // Analyze recent trend
  const recentPrices = historicalPrices.slice(-5);
  const avgPrice = recentPrices.reduce((a, b) => a + b, 0) / (recentPrices.length || 1);
  const volatility = Math.abs(currentPrice - avgPrice);
  
  // Generate signal based on technical analysis
  let signalType: Signal["signalType"];
  let probability: number;
  
  // Determine signal type based on price movement and digit
  if (priceChange > 0) {
    signalType = volatility > avgPrice * 0.01 ? "rise" : "over";
    probability = Math.min(90, 55 + volatility * 1000);
  } else {
    signalType = volatility > avgPrice * 0.01 ? "fall" : "under";
    probability = Math.min(90, 55 + volatility * 1000);
  }
  
  // Add digit-based signals
  if (lastDigit % 2 === 0) {
    signalType = Math.random() > 0.5 ? "even" : signalType;
  } else {
    signalType = Math.random() > 0.5 ? "odd" : signalType;
  }
  
  // Occasionally add matches/differs signals
  if (Math.random() > 0.7) {
    signalType = Math.random() > 0.5 ? "matches" : "differs";
  }
  
  let validation: "strong" | "medium" | "weak";
  if (probability >= 75) validation = "strong";
  else if (probability >= 60) validation = "medium";
  else validation = "weak";
  
  return {
    id: `${symbol}-${Date.now()}`,
    market: marketNames[symbol] || symbol,
    signalType,
    probability: Math.floor(probability),
    entryPoint: new Date(Date.now() + 30000).toLocaleTimeString(),
    validation,
    digit: ["matches", "differs", "even", "odd"].includes(signalType) ? lastDigit : undefined,
    price: currentPrice
  };
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
            const newHistory = [...history, tick.quote].slice(-20);
            
            setSignals(prevSignals => {
              const existingIndex = prevSignals.findIndex(s => s.market === marketNames[tick.symbol]);
              const newSignal = analyzeTickData(tick.symbol, tick.quote, newHistory);
              
              if (existingIndex >= 0) {
                const updated = [...prevSignals];
                updated[existingIndex] = newSignal;
                return updated;
              } else {
                return [...prevSignals, newSignal];
              }
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
