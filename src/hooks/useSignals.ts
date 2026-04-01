import { useState, useEffect, useCallback } from 'react';

export interface Signal {
  id: string;
  market: string;
  signalType: "over" | "under" | "even" | "odd" | "matches" | "differs" | "rise" | "fall";
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
  if (historicalPrices.length < 50) return [];

  const entryDigit = Math.floor((currentPrice * 100) % 10);
  const last50 = historicalPrices.slice(-50);
  
  const avgPrice = last50.reduce((a, b) => a + b, 0) / 50;
  const priceChanges = last50.slice(1).map((p, i) => p - last50[i]);
  const volatility = Math.sqrt(priceChanges.reduce((sum, c) => sum + c * c, 0) / 49);
  
  // Digit frequencies
  const digits = last50.map(p => Math.floor((p * 100) % 10));
  const digitCounts = digits.reduce((acc, d) => { acc[d] = (acc[d] || 0) + 1; return acc; }, {} as Record<number, number>);
  
  const recentDigits = digits.slice(-10);
  const evenInRecent = recentDigits.filter(d => d % 2 === 0).length;
  const oddInRecent = recentDigits.filter(d => d % 2 !== 0).length;
  
  const signals: Signal[] = [];
  const now = Date.now();
  const expiresAt = now + 100000;
  const entryTime = new Date(now).toLocaleTimeString();
  const market = marketNames[symbol] || symbol;

  // === EVEN/ODD SIGNAL ===
  const evenCount = digits.filter(d => d % 2 === 0).length;
  const evenRatio = evenCount / 50;
  const recentEvenRatio = evenInRecent / 10;
  // Weighted: 60% recent, 40% historical
  const weightedEvenProb = recentEvenRatio * 0.6 + evenRatio * 0.4;
  const predictedEvenOdd = weightedEvenProb > 0.5 ? "even" : "odd";
  const evenOddConfidence = Math.abs(weightedEvenProb - 0.5) * 2;

  signals.push({
    id: `${symbol}-evenodd`,
    market,
    signalType: predictedEvenOdd,
    category: "digit",
    probability: Math.min(88, Math.max(55, 55 + evenOddConfidence * 33)),
    entryPoint: entryTime,
    expiresAt,
    validation: evenOddConfidence > 0.4 ? "strong" : evenOddConfidence > 0.2 ? "medium" : "weak",
    entryDigit,
    price: currentPrice
  });

  // === OVER/UNDER SIGNAL (improved) ===
  // Use multiple timeframe analysis
  const last5 = last50.slice(-5);
  const last10 = last50.slice(-10);
  const last20 = last50.slice(-20);
  
  const sma5 = last5.reduce((a, b) => a + b, 0) / 5;
  const sma10 = last10.reduce((a, b) => a + b, 0) / 10;
  const sma20 = last20.reduce((a, b) => a + b, 0) / 20;
  const sma50 = avgPrice;
  
  // RSI calculation
  const gains = priceChanges.filter(c => c > 0);
  const losses = priceChanges.filter(c => c < 0).map(c => Math.abs(c));
  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / 14 : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / 14 : 0;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  // Momentum score: combine SMA crossovers + RSI
  let overScore = 0;
  if (sma5 > sma10) overScore += 1;
  if (sma10 > sma20) overScore += 1;
  if (sma5 > sma50) overScore += 1;
  if (currentPrice > sma5) overScore += 1;
  if (rsi > 50) overScore += 0.5;
  if (rsi > 65) overScore += 0.5;
  
  // Digit-based over/under: check if last digit tends to be > 4 or < 5
  const overDigits = digits.slice(-20).filter(d => d > 4).length;
  const overDigitRatio = overDigits / 20;
  if (overDigitRatio > 0.55) overScore += 1;
  
  const totalFactors = 6;
  const overProbability = overScore / totalFactors;
  const predictedDirection = overProbability > 0.5 ? "over" : "under";
  const directionConfidence = Math.abs(overProbability - 0.5) * 2;

  signals.push({
    id: `${symbol}-overunder`,
    market,
    signalType: predictedDirection,
    category: "direction",
    probability: Math.min(87, Math.max(55, 55 + directionConfidence * 32)),
    entryPoint: entryTime,
    expiresAt,
    validation: directionConfidence > 0.5 ? "strong" : directionConfidence > 0.25 ? "medium" : "weak",
    entryDigit,
    predictionDigit: predictedDirection === "over" ? Math.min(9, entryDigit + 1) : Math.max(0, entryDigit - 1),
    price: currentPrice
  });

  // === MATCHES/DIFFERS SIGNAL ===
  const mostFreqDigit = Object.entries(digitCounts).sort((a, b) => b[1] - a[1])[0];
  const predDigit = parseInt(mostFreqDigit[0]);
  const digitFreq = mostFreqDigit[1] / 50;
  const predictedType = entryDigit === predDigit ? "differs" : "matches";

  signals.push({
    id: `${symbol}-matchesdiffer`,
    market,
    signalType: predictedType,
    category: "digit",
    probability: Math.min(78, Math.max(55, 55 + digitFreq * 46)),
    entryPoint: entryTime,
    expiresAt,
    validation: digitFreq > 0.25 ? "strong" : digitFreq > 0.18 ? "medium" : "weak",
    entryDigit,
    predictionDigit: predDigit,
    price: currentPrice
  });

  // === RISE/FALL SIGNAL ===
  // Use price momentum and trend analysis
  const recentChanges = priceChanges.slice(-10);
  const positiveChanges = recentChanges.filter(c => c > 0).length;
  const negativeChanges = recentChanges.filter(c => c < 0).length;
  
  // Consecutive direction count
  let consecutiveRise = 0;
  let consecutiveFall = 0;
  for (let i = recentChanges.length - 1; i >= 0; i--) {
    if (recentChanges[i] > 0 && consecutiveFall === 0) consecutiveRise++;
    else if (recentChanges[i] < 0 && consecutiveRise === 0) consecutiveFall++;
    else break;
  }
  
  // Mean reversion: if too many consecutive in one direction, predict reversal
  let riseScore = 0;
  if (consecutiveRise >= 4) {
    riseScore = -1; // likely to fall (mean reversion)
  } else if (consecutiveFall >= 4) {
    riseScore = 1; // likely to rise (mean reversion)
  } else {
    // Trend following for moderate momentum
    riseScore = (positiveChanges - negativeChanges) / 10;
    // Add SMA trend
    if (sma5 > sma10) riseScore += 0.2;
    else riseScore -= 0.2;
  }
  
  const riseFallConfidence = Math.min(1, Math.abs(riseScore));
  const predictedRiseFall = riseScore > 0 ? "rise" : "fall";

  signals.push({
    id: `${symbol}-risefall`,
    market,
    signalType: predictedRiseFall,
    category: "direction",
    probability: Math.min(85, Math.max(55, 55 + riseFallConfidence * 30)),
    entryPoint: entryTime,
    expiresAt,
    validation: riseFallConfidence > 0.6 ? "strong" : riseFallConfidence > 0.3 ? "medium" : "weak",
    entryDigit,
    price: currentPrice
  });

  return signals;
};

export const useSignals = (connected: boolean) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [priceHistory, setPriceHistory] = useState<Record<string, number[]>>({});
  const [tickCounts, setTickCounts] = useState<Record<string, number>>({});
  const [lastSignalTime, setLastSignalTime] = useState<Record<string, Record<string, number>>>({});
  const [digitPatterns, setDigitPatterns] = useState<Record<string, { digits: number[], prices: number[], timestamps: number[] }>>({});

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
          const lastDigit = Math.floor((tick.quote * 100) % 10);
          
          setDigitPatterns(prev => {
            const current = prev[tick.symbol] || { digits: [], prices: [], timestamps: [] };
            return {
              ...prev,
              [tick.symbol]: {
                digits: [...current.digits, lastDigit].slice(-20),
                prices: [...current.prices, tick.quote].slice(-20),
                timestamps: [...current.timestamps, Date.now()].slice(-20)
              }
            };
          });
          
          setPriceHistory(prev => {
            const history = prev[tick.symbol] || [];
            const newHistory = [...history, tick.quote].slice(-50);
            
            setTickCounts(prevCounts => ({
              ...prevCounts,
              [tick.symbol]: newHistory.length
            }));
            
            if (newHistory.length >= 50) {
              setLastSignalTime(prevLastSignalTime => {
                const now = Date.now();
                const symbolSignalTimes = prevLastSignalTime[tick.symbol] || {};
                
                setSignals(prevSignals => {
                  const activeSignals = prevSignals.filter(s => s.expiresAt > now);
                  const newSignals = analyzeTickData(tick.symbol, tick.quote, newHistory);
                  const signalsToAdd: Signal[] = [];
                  
                  newSignals.forEach(newSignal => {
                    const signalKey = `${tick.symbol}-${newSignal.signalType}`;
                    const lastTime = symbolSignalTimes[signalKey] || 0;
                    const hasActiveSignal = activeSignals.some(s => s.id === newSignal.id);
                    
                    if (!hasActiveSignal && now - lastTime >= 100000) {
                      signalsToAdd.push(newSignal);
                      symbolSignalTimes[signalKey] = now;
                    }
                  });
                  
                  return [...activeSignals, ...signalsToAdd]
                    .sort((a, b) => {
                      if (a.market !== b.market) return a.market.localeCompare(b.market);
                      return a.id.localeCompare(b.id);
                    })
                    .slice(-60);
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
  }, []);

  const disconnect = useCallback(() => {
    if (ws) {
      ws.close();
      setWs(null);
      setSignals([]);
      setPriceHistory({});
      setTickCounts({});
      setLastSignalTime({});
      setDigitPatterns({});
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

  return { signals, isConnected: ws?.readyState === WebSocket.OPEN, tickCounts, digitPatterns };
};
