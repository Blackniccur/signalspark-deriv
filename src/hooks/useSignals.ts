import { useState, useEffect, useCallback } from 'react';

export interface IndicatorData {
  bb: { upper: number; middle: number; lower: number; position: number; width: number };
  macd: { macdLine: number; signalLine: number; histogram: number };
  rsi: number;
}

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
  indicators?: IndicatorData;
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

const calcBollingerBands = (prices: number[], period = 20) => {
  const slice = prices.slice(-period);
  const sma = slice.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(slice.reduce((sum, p) => sum + (p - sma) ** 2, 0) / period);
  return { upper: sma + 2 * stdDev, middle: sma, lower: sma - 2 * stdDev, stdDev };
};

const calcMACD = (prices: number[]) => {
  const ema = (data: number[], period: number) => {
    const k = 2 / (period + 1);
    let val = data[0];
    for (let i = 1; i < data.length; i++) val = data[i] * k + val * (1 - k);
    return val;
  };
  const ema12 = ema(prices, 12);
  const ema26 = ema(prices, 26);
  const macdLine = ema12 - ema26;
  // Approximate signal line from last 9 MACD values
  const macdHistory: number[] = [];
  for (let i = Math.max(0, prices.length - 9); i <= prices.length; i++) {
    const slice = prices.slice(0, i);
    if (slice.length >= 26) {
      macdHistory.push(ema(slice, 12) - ema(slice, 26));
    }
  }
  const signalLine = macdHistory.length >= 2 ? ema(macdHistory, Math.min(9, macdHistory.length)) : macdLine;
  const histogram = macdLine - signalLine;
  return { macdLine, signalLine, histogram };
};

const analyzeTickData = (symbol: string, currentPrice: number, historicalPrices: number[]): Signal[] => {
  if (historicalPrices.length < 50) return [];

  const entryDigit = Math.floor((currentPrice * 100) % 10);
  const last50 = historicalPrices.slice(-50);
  
  const avgPrice = last50.reduce((a, b) => a + b, 0) / 50;
  const priceChanges = last50.slice(1).map((p, i) => p - last50[i]);
  const volatility = Math.sqrt(priceChanges.reduce((sum, c) => sum + c * c, 0) / 49);
  
  // Bollinger Bands & MACD
  const bb = calcBollingerBands(last50, 20);
  const macd = calcMACD(last50);
  const bbWidth = bb.stdDev > 0 ? bb.stdDev / bb.middle : 0;
  
  // RSI (calculated early for use in indicators object)
  const priceChanges = last50.slice(1).map((p, i) => p - last50[i]);
  const gains = priceChanges.filter(c => c > 0);
  const losses = priceChanges.filter(c => c < 0).map(c => Math.abs(c));
  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / 14 : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / 14 : 0;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  const indicatorData: IndicatorData = {
    bb: { upper: bb.upper, middle: bb.middle, lower: bb.lower, position: bbPosition, width: bbWidth },
    macd: { macdLine: macd.macdLine, signalLine: macd.signalLine, histogram: macd.histogram },
    rsi
  };

  // Digit frequencies
  const digits = last50.map(p => Math.floor((p * 100) % 10));
  const digitCounts = digits.reduce((acc, d) => { acc[d] = (acc[d] || 0) + 1; return acc; }, {} as Record<number, number>);
  
  const recentDigits = digits.slice(-10);
  const evenInRecent = recentDigits.filter(d => d % 2 === 0).length;
  
  const signals: Signal[] = [];
  const now = Date.now();
  const expiresAt = now + 100000;
  const entryTime = new Date(now).toLocaleTimeString();
  const market = marketNames[symbol] || symbol;
  const volatility = Math.sqrt(priceChanges.reduce((sum, c) => sum + c * c, 0) / 49);
  const entryTime = new Date(now).toLocaleTimeString();
  const market = marketNames[symbol] || symbol;

  // === EVEN/ODD SIGNAL (enhanced with BB) ===
  const evenCount = digits.filter(d => d % 2 === 0).length;
  const evenRatio = evenCount / 50;
  const recentEvenRatio = evenInRecent / 10;
  let weightedEvenProb = recentEvenRatio * 0.5 + evenRatio * 0.3;
  // BB influence: near bands = more volatile = favor odd, mid-band = favor even
  if (bbPosition > 0.8 || bbPosition < 0.2) weightedEvenProb -= 0.05;
  else if (bbPosition > 0.4 && bbPosition < 0.6) weightedEvenProb += 0.05;
  // MACD influence
  if (Math.abs(macd.histogram) < volatility * 0.1) weightedEvenProb += 0.03;
  
  const predictedEvenOdd = weightedEvenProb > 0.5 ? "even" : "odd";
  const evenOddConfidence = Math.abs(weightedEvenProb - 0.5) * 2;

  signals.push({
    id: `${symbol}-evenodd`,
    market,
    signalType: predictedEvenOdd,
    category: "digit",
    probability: Math.min(90, Math.max(55, 55 + evenOddConfidence * 35)),
    entryPoint: entryTime,
    expiresAt,
    validation: evenOddConfidence > 0.4 ? "strong" : evenOddConfidence > 0.2 ? "medium" : "weak",
    entryDigit,
    price: currentPrice
  });

  // === OVER/UNDER SIGNAL (enhanced with BB + MACD) ===
  const last5 = last50.slice(-5);
  const last10 = last50.slice(-10);
  const last20 = last50.slice(-20);
  
  const sma5 = last5.reduce((a, b) => a + b, 0) / 5;
  const sma10 = last10.reduce((a, b) => a + b, 0) / 10;
  const sma20 = last20.reduce((a, b) => a + b, 0) / 20;
  const sma50 = avgPrice;
  
  // RSI
  const gains = priceChanges.filter(c => c > 0);
  const losses = priceChanges.filter(c => c < 0).map(c => Math.abs(c));
  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / 14 : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / 14 : 0;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  let overScore = 0;
  if (sma5 > sma10) overScore += 1;
  if (sma10 > sma20) overScore += 1;
  if (sma5 > sma50) overScore += 1;
  if (currentPrice > sma5) overScore += 1;
  if (rsi > 50) overScore += 0.5;
  if (rsi > 65) overScore += 0.5;
  
  // BB: price near upper band = overbought (under), near lower = oversold (over)
  if (bbPosition > 0.85) overScore -= 1;
  else if (bbPosition < 0.15) overScore += 1;
  else if (bbPosition > 0.6) overScore += 0.3;
  else if (bbPosition < 0.4) overScore -= 0.3;
  
  // MACD: positive histogram = bullish momentum (over)
  if (macd.histogram > 0) overScore += 0.8;
  else overScore -= 0.8;
  if (macd.macdLine > macd.signalLine) overScore += 0.5;
  else overScore -= 0.5;
  
  const overDigits = digits.slice(-20).filter(d => d > 4).length;
  if (overDigits / 20 > 0.55) overScore += 0.5;
  
  const totalFactors = 8.5;
  const overProbability = (overScore + totalFactors / 2) / totalFactors;
  const predictedDirection = overProbability > 0.5 ? "over" : "under";
  const directionConfidence = Math.abs(overProbability - 0.5) * 2;

  signals.push({
    id: `${symbol}-overunder`,
    market,
    signalType: predictedDirection,
    category: "direction",
    probability: Math.min(90, Math.max(55, 55 + directionConfidence * 35)),
    entryPoint: entryTime,
    expiresAt,
    validation: directionConfidence > 0.5 ? "strong" : directionConfidence > 0.25 ? "medium" : "weak",
    entryDigit,
    predictionDigit: predictedDirection === "over" ? Math.min(9, entryDigit + 1) : Math.max(0, entryDigit - 1),
    price: currentPrice
  });

  // === MATCHES/DIFFERS SIGNAL (enhanced with volatility from BB) ===
  const mostFreqDigit = Object.entries(digitCounts).sort((a, b) => b[1] - a[1])[0];
  const predDigit = parseInt(mostFreqDigit[0]);
  const digitFreq = mostFreqDigit[1] / 50;
  // Low BB width (squeeze) = digits more predictable = matches more likely
  const bbWidth = bb.stdDev / bb.middle;
  let matchBonus = 0;
  if (bbWidth < 0.001) matchBonus = 0.05;
  else if (bbWidth > 0.003) matchBonus = -0.05;
  
  const adjustedFreq = digitFreq + matchBonus;
  const predictedType = entryDigit === predDigit ? "differs" : "matches";

  signals.push({
    id: `${symbol}-matchesdiffer`,
    market,
    signalType: predictedType,
    category: "digit",
    probability: Math.min(82, Math.max(55, 55 + adjustedFreq * 50)),
    entryPoint: entryTime,
    expiresAt,
    validation: adjustedFreq > 0.25 ? "strong" : adjustedFreq > 0.18 ? "medium" : "weak",
    entryDigit,
    predictionDigit: predDigit,
    price: currentPrice
  });

  // === RISE/FALL SIGNAL (enhanced with BB + MACD) ===
  const recentChanges = priceChanges.slice(-10);
  const positiveChanges = recentChanges.filter(c => c > 0).length;
  const negativeChanges = recentChanges.filter(c => c < 0).length;
  
  let consecutiveRise = 0;
  let consecutiveFall = 0;
  for (let i = recentChanges.length - 1; i >= 0; i--) {
    if (recentChanges[i] > 0 && consecutiveFall === 0) consecutiveRise++;
    else if (recentChanges[i] < 0 && consecutiveRise === 0) consecutiveFall++;
    else break;
  }
  
  let riseScore = 0;
  if (consecutiveRise >= 4) {
    riseScore = -1;
  } else if (consecutiveFall >= 4) {
    riseScore = 1;
  } else {
    riseScore = (positiveChanges - negativeChanges) / 10;
    if (sma5 > sma10) riseScore += 0.2;
    else riseScore -= 0.2;
  }
  
  // BB mean reversion: price at extremes likely to revert
  if (bbPosition > 0.9) riseScore -= 0.6;
  else if (bbPosition < 0.1) riseScore += 0.6;
  
  // MACD momentum confirmation
  if (macd.histogram > 0 && macd.histogram > volatility * 0.05) riseScore += 0.4;
  else if (macd.histogram < 0 && Math.abs(macd.histogram) > volatility * 0.05) riseScore -= 0.4;
  
  // MACD crossover detection
  if (macd.macdLine > macd.signalLine) riseScore += 0.3;
  else riseScore -= 0.3;
  
  const riseFallConfidence = Math.min(1, Math.abs(riseScore));
  const predictedRiseFall = riseScore > 0 ? "rise" : "fall";

  signals.push({
    id: `${symbol}-risefall`,
    market,
    signalType: predictedRiseFall,
    category: "direction",
    probability: Math.min(88, Math.max(55, 55 + riseFallConfidence * 33)),
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
