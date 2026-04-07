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
  holdTicks?: number;
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

// === DIGIT PSYCHOLOGY ANALYSIS ===
const analyzeDigitPsychology = (digits: number[]) => {
  // Streak detection - digits tend to revert after long streaks
  let evenStreak = 0, oddStreak = 0;
  for (let i = digits.length - 1; i >= 0; i--) {
    if (digits[i] % 2 === 0 && oddStreak === 0) evenStreak++;
    else if (digits[i] % 2 !== 0 && evenStreak === 0) oddStreak++;
    else break;
  }
  
  // Hot/cold digit detection
  const recent10 = digits.slice(-10);
  const recent5 = digits.slice(-5);
  const digitHeat: Record<number, number> = {};
  for (let d = 0; d <= 9; d++) {
    const in10 = recent10.filter(x => x === d).length;
    const in5 = recent5.filter(x => x === d).length;
    digitHeat[d] = in5 * 2 + in10; // weight recent more
  }
  
  // Over/Under digit bias - how digits cluster above/below 4.5
  const overDigits = recent10.filter(d => d > 4).length;
  const underDigits = recent10.filter(d => d <= 4).length;
  const digitBias = (overDigits - underDigits) / 10; // -1 to 1
  
  // Alternation pattern detection
  let alternations = 0;
  for (let i = 1; i < recent10.length; i++) {
    if ((recent10[i] % 2 === 0) !== (recent10[i-1] % 2 === 0)) alternations++;
  }
  const alternationRate = alternations / Math.max(1, recent10.length - 1);
  
  // Consecutive same-parity detection (mean reversion signal)
  const parityStreak = Math.max(evenStreak, oddStreak);
  const meanReversionStrength = parityStreak >= 5 ? 0.8 : parityStreak >= 4 ? 0.5 : parityStreak >= 3 ? 0.25 : 0;
  
  return { evenStreak, oddStreak, digitHeat, digitBias, alternationRate, meanReversionStrength, parityStreak };
};

// === ADVANCED INDICATOR HELPERS ===
const calcEMA = (data: number[], period: number): number[] => {
  const k = 2 / (period + 1);
  const result: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push(data[i] * k + result[i - 1] * (1 - k));
  }
  return result;
};

const calcATR = (prices: number[], period = 14): number => {
  if (prices.length < period + 1) return 0;
  const trs: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    trs.push(Math.abs(prices[i] - prices[i - 1]));
  }
  return trs.slice(-period).reduce((a, b) => a + b, 0) / period;
};

const calcStochRSI = (prices: number[], rsiPeriod = 14, stochPeriod = 14): number => {
  if (prices.length < rsiPeriod + stochPeriod) return 50;
  // Calculate RSI series
  const rsiValues: number[] = [];
  for (let i = rsiPeriod; i <= prices.length; i++) {
    const slice = prices.slice(i - rsiPeriod, i);
    const changes = slice.slice(1).map((p, j) => p - slice[j]);
    const gains = changes.filter(c => c > 0);
    const losses = changes.filter(c => c < 0).map(c => Math.abs(c));
    const ag = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / rsiPeriod : 0;
    const al = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / rsiPeriod : 0;
    const rs = al === 0 ? 100 : ag / al;
    rsiValues.push(100 - (100 / (1 + rs)));
  }
  const recentRSI = rsiValues.slice(-stochPeriod);
  const minRSI = Math.min(...recentRSI);
  const maxRSI = Math.max(...recentRSI);
  const currentRSI = recentRSI[recentRSI.length - 1];
  return maxRSI === minRSI ? 50 : ((currentRSI - minRSI) / (maxRSI - minRSI)) * 100;
};

// Williams %R
const calcWilliamsR = (prices: number[], period = 14): number => {
  if (prices.length < period) return -50;
  const recent = prices.slice(-period);
  const high = Math.max(...recent);
  const low = Math.min(...recent);
  const close = recent[recent.length - 1];
  return high === low ? -50 : ((high - close) / (high - low)) * -100;
};

// Trend strength via ADX approximation
const calcTrendStrength = (prices: number[]): { strength: number; direction: number } => {
  if (prices.length < 20) return { strength: 0, direction: 0 };
  const ema5 = calcEMA(prices, 5);
  const ema10 = calcEMA(prices, 10);
  const ema20 = calcEMA(prices, 20);
  const last5 = ema5[ema5.length - 1];
  const last10 = ema10[ema10.length - 1];
  const last20 = ema20[ema20.length - 1];
  
  // Aligned EMAs = strong trend
  const bullAlign = last5 > last10 && last10 > last20 ? 1 : 0;
  const bearAlign = last5 < last10 && last10 < last20 ? 1 : 0;
  const direction = bullAlign - bearAlign;
  
  // Slope of EMA5 as trend momentum
  const prev5 = ema5[ema5.length - 3] || last5;
  const slope = (last5 - prev5) / Math.max(0.00001, Math.abs(prev5));
  const strength = Math.min(1, Math.abs(slope) * 1000 + (bullAlign + bearAlign) * 0.3);
  
  return { strength, direction };
};

const analyzeTickData = (symbol: string, currentPrice: number, historicalPrices: number[]): Signal[] => {
  if (historicalPrices.length < 50) return [];

  const entryDigit = Math.floor((currentPrice * 100) % 10);
  const last50 = historicalPrices.slice(-50);
  
  const avgPrice = last50.reduce((a, b) => a + b, 0) / 50;
  const priceChanges = last50.slice(1).map((p, i) => p - last50[i]);
  const volatility = Math.sqrt(priceChanges.reduce((sum, c) => sum + c * c, 0) / 49);
  
  // Core indicators
  const bb = calcBollingerBands(last50, 20);
  const macd = calcMACD(last50);
  const bbPosition = bb.stdDev > 0 ? (currentPrice - bb.lower) / (bb.upper - bb.lower) : 0.5;
  const bbWidth = bb.stdDev > 0 ? bb.stdDev / bb.middle : 0;
  
  // RSI
  const gains = priceChanges.filter(c => c > 0);
  const losses = priceChanges.filter(c => c < 0).map(c => Math.abs(c));
  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / 14 : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / 14 : 0;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  // Advanced indicators
  const stochRSI = calcStochRSI(last50);
  const williamsR = calcWilliamsR(last50);
  const atr = calcATR(last50);
  const trend = calcTrendStrength(last50);

  // Digit Psychology
  const allDigits = last50.map(p => Math.floor((p * 100) % 10));
  const digitPsych = analyzeDigitPsychology(allDigits);
  
  const indicatorData: IndicatorData = {
    bb: { upper: bb.upper, middle: bb.middle, lower: bb.lower, position: bbPosition, width: bbWidth },
    macd: { macdLine: macd.macdLine, signalLine: macd.signalLine, histogram: macd.histogram },
    rsi
  };

  // Digit frequencies
  const digits = last50.map(p => Math.floor((p * 100) % 10));
  const digitCounts = digits.reduce((acc, d) => { acc[d] = (acc[d] || 0) + 1; return acc; }, {} as Record<number, number>);
  
  const recentDigits = digits.slice(-10);
  const recent5Digits = digits.slice(-5);
  const evenInRecent = recentDigits.filter(d => d % 2 === 0).length;
  
  const signals: Signal[] = [];
  const now = Date.now();
  const expiresAt = now + 100000;
  const entryTime = new Date(now).toLocaleTimeString();
  const market = marketNames[symbol] || symbol;

  // SMAs
  const last5 = last50.slice(-5);
  const last10 = last50.slice(-10);
  const last20 = last50.slice(-20);
  const sma5 = last5.reduce((a, b) => a + b, 0) / 5;
  const sma10 = last10.reduce((a, b) => a + b, 0) / 10;
  const sma20 = last20.reduce((a, b) => a + b, 0) / 20;
  const sma50 = avgPrice;

  // === EVEN/ODD SIGNAL (Enhanced Multi-Factor) ===
  const evenCount = digits.filter(d => d % 2 === 0).length;
  const evenRatio = evenCount / 50;
  const recentEvenRatio = evenInRecent / 10;
  const recent5EvenRatio = recent5Digits.filter(d => d % 2 === 0).length / 5;
  
  // Weighted probability across timeframes
  let weightedEvenProb = recent5EvenRatio * 0.4 + recentEvenRatio * 0.35 + evenRatio * 0.25;
  
  // Digit psychology: mean reversion after streaks (stronger weight)
  if (digitPsych.meanReversionStrength > 0) {
    if (digitPsych.evenStreak > digitPsych.oddStreak) {
      weightedEvenProb -= digitPsych.meanReversionStrength * 0.2;
    } else {
      weightedEvenProb += digitPsych.meanReversionStrength * 0.2;
    }
  }
  
  // Alternation pattern
  if (digitPsych.alternationRate > 0.7) {
    const lastDigitEven = digits[digits.length - 1] % 2 === 0;
    weightedEvenProb = lastDigitEven ? weightedEvenProb - 0.12 : weightedEvenProb + 0.12;
  }
  
  // Consecutive same-parity (last 3 digits)
  const last3Digits = digits.slice(-3);
  const allEven3 = last3Digits.every(d => d % 2 === 0);
  const allOdd3 = last3Digits.every(d => d % 2 !== 0);
  if (allEven3) weightedEvenProb -= 0.12; // strong mean reversion
  if (allOdd3) weightedEvenProb += 0.12;
  
  // Technical confirmation
  if (bbPosition > 0.8 || bbPosition < 0.2) weightedEvenProb -= 0.04;
  else if (bbPosition > 0.4 && bbPosition < 0.6) weightedEvenProb += 0.04;
  if (Math.abs(macd.histogram) < volatility * 0.1) weightedEvenProb += 0.03;
  
  // Stochastic RSI extreme = digit instability
  if (stochRSI > 85 || stochRSI < 15) {
    // extreme oscillator = prefer alternation
    const lastEven = digits[digits.length - 1] % 2 === 0;
    weightedEvenProb = lastEven ? weightedEvenProb - 0.06 : weightedEvenProb + 0.06;
  }
  
  const predictedEvenOdd = weightedEvenProb > 0.5 ? "even" : "odd";
  const evenOddConfidence = Math.abs(weightedEvenProb - 0.5) * 2;
  const psychBoost = digitPsych.meanReversionStrength > 0.3 ? 0.12 : digitPsych.parityStreak >= 3 ? 0.06 : 0;
  
  // Only emit signal if confidence threshold met
  const eoConf = evenOddConfidence + psychBoost;
  if (eoConf > 0.1) {
    signals.push({
      id: `${symbol}-evenodd`, market, signalType: predictedEvenOdd, category: "digit",
      probability: Math.min(95, Math.max(58, 58 + eoConf * 38)),
      entryPoint: entryTime, expiresAt,
      validation: eoConf > 0.45 ? "strong" : eoConf > 0.2 ? "medium" : "weak",
      entryDigit, price: currentPrice, indicators: indicatorData
    });
  }

  // === OVER/UNDER SIGNAL (Enhanced with 15+ factors) ===
  let overScore = 0;
  let overFactors = 0;
  
  // SMA crossover cascade (4 factors)
  if (sma5 > sma10) overScore += 1; else overScore -= 0.5;
  if (sma10 > sma20) overScore += 1; else overScore -= 0.5;
  if (sma5 > sma50) overScore += 0.8;
  if (currentPrice > sma5) overScore += 1; else overScore -= 0.5;
  overFactors += 4;
  
  // RSI zones (2 factors)
  if (rsi > 55) overScore += 0.6;
  else if (rsi < 45) overScore -= 0.6;
  if (rsi > 70) overScore += 0.4; // strong momentum, not overbought for digits
  if (rsi < 30) overScore -= 0.4;
  overFactors += 2;
  
  // Stochastic RSI confirmation
  if (stochRSI > 60) overScore += 0.5;
  else if (stochRSI < 40) overScore -= 0.5;
  overFactors += 1;
  
  // Williams %R
  if (williamsR > -30) overScore += 0.4; // overbought zone = momentum up
  else if (williamsR < -70) overScore -= 0.4;
  overFactors += 1;
  
  // Bollinger Band position (2 factors)
  if (bbPosition > 0.85) overScore -= 1.2; // extreme = reversal
  else if (bbPosition < 0.15) overScore += 1.2;
  else if (bbPosition > 0.6) overScore += 0.4;
  else if (bbPosition < 0.4) overScore -= 0.4;
  overFactors += 2;
  
  // MACD momentum (2 factors)
  if (macd.histogram > 0) overScore += 0.9; else overScore -= 0.9;
  if (macd.macdLine > macd.signalLine) overScore += 0.6; else overScore -= 0.6;
  // MACD histogram direction (accelerating or decelerating)
  const histogramSlice = [];
  for (let i = Math.max(0, last50.length - 5); i <= last50.length; i++) {
    const s = last50.slice(0, i);
    if (s.length >= 26) {
      const m = calcMACD(s);
      histogramSlice.push(m.histogram);
    }
  }
  if (histogramSlice.length >= 2) {
    const histTrend = histogramSlice[histogramSlice.length - 1] - histogramSlice[0];
    if (histTrend > 0) overScore += 0.4; else overScore -= 0.4;
  }
  overFactors += 3;
  
  // Trend strength alignment
  overScore += trend.direction * trend.strength * 1.2;
  overFactors += 1;
  
  // === DIGIT PSYCHOLOGY for Over/Under (3 factors) ===
  overScore += digitPsych.digitBias * 1.8;
  
  const hotHighDigits = [5,6,7,8,9].reduce((sum, d) => sum + (digitPsych.digitHeat[d] || 0), 0);
  const hotLowDigits = [0,1,2,3,4].reduce((sum, d) => sum + (digitPsych.digitHeat[d] || 0), 0);
  const heatDiff = (hotHighDigits - hotLowDigits) / Math.max(1, hotHighDigits + hotLowDigits);
  overScore += heatDiff * 1.0;
  
  const overDigitsRecent = digits.slice(-10).filter(d => d > 4).length;
  if (overDigitsRecent >= 8) overScore -= 0.8;
  else if (overDigitsRecent <= 2) overScore += 0.8;
  overFactors += 3;
  
  // Price momentum
  const priceSlope = (sma5 - sma10) / Math.max(0.0001, volatility);
  overScore += Math.max(-1.2, Math.min(1.2, priceSlope * 0.6));
  overFactors += 1;
  
  const overProbability = (overScore + overFactors / 2) / overFactors;
  const predictedDirection = overProbability > 0.5 ? "over" : "under";
  const directionConfidence = Math.abs(overProbability - 0.5) * 2;

  if (directionConfidence > 0.08) {
    signals.push({
      id: `${symbol}-overunder`, market, signalType: predictedDirection, category: "direction",
      probability: Math.min(95, Math.max(58, 58 + directionConfidence * 38)),
      entryPoint: entryTime, expiresAt,
      validation: directionConfidence > 0.5 ? "strong" : directionConfidence > 0.25 ? "medium" : "weak",
      entryDigit, predictionDigit: predictedDirection === "over" ? Math.min(9, entryDigit + 1) : Math.max(0, entryDigit - 1),
      price: currentPrice, indicators: indicatorData
    });
  }

  // === MATCHES/DIFFERS SIGNAL (Enhanced) ===
  const mostFreqDigit = Object.entries(digitCounts).sort((a, b) => b[1] - a[1])[0];
  const predDigit = parseInt(mostFreqDigit[0]);
  const digitFreq = mostFreqDigit[1] / 50;
  
  // Recent frequency (last 10) weighted more
  const recentFreq = recentDigits.filter(d => d === predDigit).length / 10;
  const blendedFreq = recentFreq * 0.6 + digitFreq * 0.4;
  
  let matchBonus = 0;
  if (bbWidth < 0.001) matchBonus = 0.06; // low vol = digits cluster
  else if (bbWidth > 0.003) matchBonus = -0.06;
  
  // Hot digit bonus
  if ((digitPsych.digitHeat[predDigit] || 0) > 4) matchBonus += 0.05;
  
  const adjustedFreq = blendedFreq + matchBonus;
  const predictedType = entryDigit === predDigit ? "differs" : "matches";

  if (adjustedFreq > 0.12) {
    signals.push({
      id: `${symbol}-matchesdiffer`, market, signalType: predictedType, category: "digit",
      probability: Math.min(88, Math.max(55, 55 + adjustedFreq * 55)),
      entryPoint: entryTime, expiresAt,
      validation: adjustedFreq > 0.28 ? "strong" : adjustedFreq > 0.18 ? "medium" : "weak",
      entryDigit, predictionDigit: predDigit, price: currentPrice, indicators: indicatorData
    });
  }

  // === RISE/FALL SIGNAL (Enhanced with multi-timeframe) ===
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
  // Consecutive streak reversal (stronger)
  if (consecutiveRise >= 5) riseScore = -1.5;
  else if (consecutiveFall >= 5) riseScore = 1.5;
  else if (consecutiveRise >= 4) riseScore = -1;
  else if (consecutiveFall >= 4) riseScore = 1;
  else {
    riseScore = (positiveChanges - negativeChanges) / 10;
    if (sma5 > sma10) riseScore += 0.25; else riseScore -= 0.25;
  }
  
  // Bollinger Band reversal zones
  if (bbPosition > 0.92) riseScore -= 0.8;
  else if (bbPosition < 0.08) riseScore += 0.8;
  else if (bbPosition > 0.85) riseScore -= 0.4;
  else if (bbPosition < 0.15) riseScore += 0.4;
  
  // MACD with histogram acceleration
  if (macd.histogram > 0 && macd.histogram > volatility * 0.05) riseScore += 0.5;
  else if (macd.histogram < 0 && Math.abs(macd.histogram) > volatility * 0.05) riseScore -= 0.5;
  if (macd.macdLine > macd.signalLine) riseScore += 0.35; else riseScore -= 0.35;
  
  // Trend alignment boost
  riseScore += trend.direction * trend.strength * 0.8;
  
  // RSI divergence
  if (rsi > 70 && consecutiveRise >= 2) riseScore -= 0.3; // overbought + rising = reversal
  if (rsi < 30 && consecutiveFall >= 2) riseScore += 0.3;
  
  // Williams %R confirmation
  if (williamsR > -20) riseScore -= 0.2; // extreme overbought
  if (williamsR < -80) riseScore += 0.2; // extreme oversold
  
  // ATR-based volatility: high ATR = bigger moves, more confidence
  const atrRatio = atr / Math.max(0.00001, currentPrice);
  const volMultiplier = Math.min(1.3, 0.8 + atrRatio * 5000);
  
  const riseFallConfidence = Math.min(1, Math.abs(riseScore) * volMultiplier);
  const predictedRiseFall = riseScore > 0 ? "rise" : "fall";

  const holdTicks = 60; // 1 minute

  if (riseFallConfidence > 0.1) {
    signals.push({
      id: `${symbol}-risefall`, market, signalType: predictedRiseFall, category: "direction",
      probability: Math.min(95, Math.max(58, 58 + riseFallConfidence * 37)),
      entryPoint: entryTime, expiresAt,
      validation: riseFallConfidence > 0.65 ? "strong" : riseFallConfidence > 0.3 ? "medium" : "weak",
      entryDigit, price: currentPrice, indicators: indicatorData,
      holdTicks
    });
  }

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
