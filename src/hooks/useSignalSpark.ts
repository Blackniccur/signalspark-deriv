import { useState, useEffect, useCallback } from 'react';

export interface IndicatorData {
    bb: { upper: number; middle: number; lower: number; position: number; width: number };
    macd: { macdLine: number; signalLine: number; histogram: number };
    rsi: number;
}

export interface Signal {
    id: string;
    market: string;
    signalType: 'over' | 'under' | 'even' | 'odd' | 'matches' | 'differs' | 'rise' | 'fall';
    category: 'digit' | 'direction';
    probability: number;
    entryPoint: string;
    expiresAt: number;
    validation: 'strong' | 'medium' | 'weak';
    entryDigit: number;
    predictionDigit?: number;
    price?: number;
    indicators?: IndicatorData;
    holdTicks?: number;
}

export const MARKET_NAMES: Record<string, string> = {
    R_10: 'Volatility 10 Index',
    R_25: 'Volatility 25 Index',
    R_50: 'Volatility 50 Index',
    R_75: 'Volatility 75 Index',
    R_100: 'Volatility 100 Index',
    '1HZ10V': 'Volatility 10 (1s) Index',
    '1HZ25V': 'Volatility 25 (1s) Index',
    '1HZ50V': 'Volatility 50 (1s) Index',
    '1HZ75V': 'Volatility 75 (1s) Index',
    '1HZ100V': 'Volatility 100 (1s) Index',
};

const MARKETS = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100', '1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V'];
const DERIV_APP_ID = 70785;

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
    const macdHistory: number[] = [];
    for (let i = Math.max(0, prices.length - 9); i <= prices.length; i++) {
        const slice = prices.slice(0, i);
        if (slice.length >= 26) macdHistory.push(ema(slice, 12) - ema(slice, 26));
    }
    const signalLine = macdHistory.length >= 2 ? ema(macdHistory, Math.min(9, macdHistory.length)) : macdLine;
    return { macdLine, signalLine, histogram: macdLine - signalLine };
};

const calcStochRSI = (prices: number[], period = 14) => {
    if (prices.length < period * 2) return 50;
    const gains: number[] = [], losses: number[] = [];
    for (let i = 1; i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1];
        gains.push(diff > 0 ? diff : 0);
        losses.push(diff < 0 ? Math.abs(diff) : 0);
    }
    const rsiValues: number[] = [];
    for (let i = period - 1; i < gains.length; i++) {
        const ag = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        const al = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        rsiValues.push(al === 0 ? 100 : 100 - 100 / (1 + ag / al));
    }
    const minRSI = Math.min(...rsiValues.slice(-period));
    const maxRSI = Math.max(...rsiValues.slice(-period));
    return maxRSI === minRSI ? 50 : ((rsiValues[rsiValues.length - 1] - minRSI) / (maxRSI - minRSI)) * 100;
};

const calcWilliamsR = (prices: number[], period = 14) => {
    if (prices.length < period) return -50;
    const slice = prices.slice(-period);
    const highest = Math.max(...slice);
    const lowest = Math.min(...slice);
    const current = prices[prices.length - 1];
    return highest === lowest ? -50 : ((highest - current) / (highest - lowest)) * -100;
};

const calcATR = (prices: number[], period = 14) => {
    if (prices.length < 2) return 0;
    const trs = prices.slice(1).map((price, i) => Math.abs(price - prices[i]));
    return trs.slice(-period).reduce((a, b) => a + b, 0) / Math.min(period, trs.length);
};

const calcTrendStrength = (prices: number[]) => {
    if (prices.length < 10) return { direction: 0, strength: 0 };
    const sma5 = prices.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const sma10 = prices.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const direction = sma5 > sma10 ? 1 : -1;
    const strength = Math.min(1, Math.abs(sma5 - sma10) / (sma10 * 0.001));
    return { direction, strength };
};

const analyzeDigitPsychology = (digits: number[]) => {
    let evenStreak = 0, oddStreak = 0;
    for (let i = digits.length - 1; i >= 0; i--) {
        if (digits[i] % 2 === 0 && oddStreak === 0) evenStreak++;
        else if (digits[i] % 2 !== 0 && evenStreak === 0) oddStreak++;
        else break;
    }
    const recent10 = digits.slice(-10);
    const recent5 = digits.slice(-5);
    const digitHeat: Record<number, number> = {};
    for (let d = 0; d <= 9; d++) {
        digitHeat[d] = recent5.filter(x => x === d).length * 2 + recent10.filter(x => x === d).length;
    }
    const overDigits = recent10.filter(d => d > 4).length;
    const underDigits = recent10.filter(d => d <= 4).length;
    const digitBias = (overDigits - underDigits) / 10;
    let alternations = 0;
    for (let i = 1; i < recent10.length; i++) {
        if ((recent10[i] % 2 === 0) !== (recent10[i - 1] % 2 === 0)) alternations++;
    }
    const parityStreak = Math.max(evenStreak, oddStreak);
    const meanReversionStrength = parityStreak >= 5 ? 0.8 : parityStreak >= 4 ? 0.5 : parityStreak >= 3 ? 0.25 : 0;
    return { evenStreak, oddStreak, digitHeat, digitBias, alternationRate: alternations / Math.max(1, recent10.length - 1), parityStreak, meanReversionStrength };
};

const generateSignals = (symbol: string, prices: number[]): Signal[] => {
    if (prices.length < 50) return [];
    const last50 = prices.slice(-50);
    const currentPrice = last50[last50.length - 1];
    const avgPrice = last50.reduce((a, b) => a + b, 0) / 50;
    const priceChanges = last50.slice(1).map((p, i) => p - last50[i]);
    const volatility = Math.sqrt(priceChanges.reduce((sum, c) => sum + c ** 2, 0) / priceChanges.length);
    const bb = calcBollingerBands(last50);
    const macd = calcMACD(last50);
    const bbPosition = bb.stdDev > 0 ? (currentPrice - bb.lower) / (bb.upper - bb.lower) : 0.5;
    const bbWidth = bb.stdDev > 0 ? bb.stdDev / bb.middle : 0;
    const gains = priceChanges.filter(c => c > 0);
    const losses = priceChanges.filter(c => c < 0).map(c => Math.abs(c));
    const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / 14 : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / 14 : 0;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);
    const stochRSI = calcStochRSI(last50);
    const williamsR = calcWilliamsR(last50);
    const atr = calcATR(last50);
    const trend = calcTrendStrength(last50);
    const allDigits = last50.map(p => Math.floor((p * 100) % 10));
    const digitPsych = analyzeDigitPsychology(allDigits);
    const indicatorData: IndicatorData = {
        bb: { upper: bb.upper, middle: bb.middle, lower: bb.lower, position: bbPosition, width: bbWidth },
        macd: { macdLine: macd.macdLine, signalLine: macd.signalLine, histogram: macd.histogram },
        rsi,
    };
    const digits = last50.map(p => Math.floor((p * 100) % 10));
    const digitCounts = digits.reduce((acc, d) => { acc[d] = (acc[d] || 0) + 1; return acc; }, {} as Record<number, number>);
    const recentDigits = digits.slice(-10);
    const signals: Signal[] = [];
    const now = Date.now();
    const expiresAt = now + 100000;
    const entryTime = new Date(now).toLocaleTimeString();
    const market = MARKET_NAMES[symbol] || symbol;
    const last5 = last50.slice(-5);
    const last10 = last50.slice(-10);
    const last20 = last50.slice(-20);
    const sma5 = last5.reduce((a, b) => a + b, 0) / 5;
    const sma10 = last10.reduce((a, b) => a + b, 0) / 10;
    const sma20 = last20.reduce((a, b) => a + b, 0) / 20;
    const entryDigit = Math.floor((currentPrice * 100) % 10);
    const evenInRecent = recentDigits.filter(d => d % 2 === 0).length;

    // Even/Odd signal
    let evenScore = 0, evenFactors = 0;
    if (evenInRecent > 6) { evenScore -= 0.9; } else if (evenInRecent < 4) { evenScore += 0.9; } evenFactors += 1;
    evenScore += digitPsych.meanReversionStrength * (digitPsych.evenStreak > digitPsych.oddStreak ? -1 : 1);
    evenFactors += 1;
    evenScore += digitPsych.alternationRate > 0.6 ? 0.3 : -0.2; evenFactors += 1;
    evenScore += rsi > 70 ? -0.3 : rsi < 30 ? 0.3 : 0; evenFactors += 1;
    const evenProb = (evenScore + evenFactors / 2) / evenFactors;
    const evenType = evenProb > 0.5 ? 'even' : 'odd';
    const evenConf = Math.abs(evenProb - 0.5) * 2;
    if (evenConf > 0.15) {
        signals.push({
            id: `${symbol}-evenodd`, market, signalType: evenType, category: 'digit',
            probability: Math.min(90, Math.max(55, 55 + evenConf * 35)),
            entryPoint: entryTime, expiresAt,
            validation: evenConf > 0.6 ? 'strong' : evenConf > 0.35 ? 'medium' : 'weak',
            entryDigit, price: currentPrice, indicators: indicatorData,
        });
    }

    // Rise/Fall signal
    let riseScore = 0, riseFactors = 0;
    if (sma5 > sma10) riseScore += 0.8; else riseScore -= 0.8; riseFactors += 1;
    if (sma10 > sma20) riseScore += 0.6; else riseScore -= 0.6; riseFactors += 1;
    if (macd.histogram > 0) riseScore += 1.0; else riseScore -= 1.0; riseFactors += 1;
    if (macd.macdLine > macd.signalLine) riseScore += 0.7; else riseScore -= 0.7; riseFactors += 1;
    if (rsi > 55) riseScore += 0.5; else if (rsi < 45) riseScore -= 0.5; riseFactors += 1;
    if (bbPosition > 0.5) riseScore += 0.5; else riseScore -= 0.5; riseFactors += 1;
    riseScore += trend.direction * trend.strength * 1.5; riseFactors += 1;
    if (stochRSI > 60) riseScore += 0.4; else if (stochRSI < 40) riseScore -= 0.4; riseFactors += 1;
    if (williamsR > -30) riseScore += 0.3; else if (williamsR < -70) riseScore -= 0.3; riseFactors += 1;
    const riseProb = (riseScore + riseFactors / 2) / riseFactors;
    const riseType = riseProb > 0.5 ? 'rise' : 'fall';
    const riseConf = Math.abs(riseProb - 0.5) * 2;
    const holdTicks = atr > 0 ? Math.max(5, Math.min(20, Math.round(volatility / atr * 10))) : 10;
    if (riseConf > 0.12) {
        signals.push({
            id: `${symbol}-risefall`, market, signalType: riseType, category: 'direction',
            probability: Math.min(92, Math.max(57, 57 + riseConf * 36)),
            entryPoint: entryTime, expiresAt,
            validation: riseConf > 0.55 ? 'strong' : riseConf > 0.28 ? 'medium' : 'weak',
            entryDigit, price: currentPrice, indicators: indicatorData, holdTicks,
        });
    }

    // Over/Under signal
    let overScore = 0, overFactors = 0;
    if (rsi > 70) overScore -= 0.6; else if (rsi < 30) overScore += 0.6; else overScore += (rsi - 50) / 50; overFactors += 2;
    if (stochRSI > 60) overScore += 0.5; else if (stochRSI < 40) overScore -= 0.5; overFactors += 1;
    if (williamsR > -30) overScore += 0.4; else if (williamsR < -70) overScore -= 0.4; overFactors += 1;
    if (bbPosition > 0.85) overScore -= 1.2; else if (bbPosition < 0.15) overScore += 1.2;
    else if (bbPosition > 0.6) overScore += 0.4; else if (bbPosition < 0.4) overScore -= 0.4; overFactors += 2;
    if (macd.histogram > 0) overScore += 0.9; else overScore -= 0.9;
    if (macd.macdLine > macd.signalLine) overScore += 0.6; else overScore -= 0.6; overFactors += 2;
    overScore += trend.direction * trend.strength * 1.2; overFactors += 1;
    overScore += digitPsych.digitBias * 1.8;
    const hotHighDigits = [5,6,7,8,9].reduce((sum, d) => sum + (digitPsych.digitHeat[d] || 0), 0);
    const hotLowDigits = [0,1,2,3,4].reduce((sum, d) => sum + (digitPsych.digitHeat[d] || 0), 0);
    overScore += ((hotHighDigits - hotLowDigits) / Math.max(1, hotHighDigits + hotLowDigits)); overFactors += 3;
    const overProb = (overScore + overFactors / 2) / overFactors;
    const overType = overProb > 0.5 ? 'over' : 'under';
    const overConf = Math.abs(overProb - 0.5) * 2;
    if (overConf > 0.08) {
        signals.push({
            id: `${symbol}-overunder`, market, signalType: overType, category: 'direction',
            probability: Math.min(95, Math.max(58, 58 + overConf * 38)),
            entryPoint: entryTime, expiresAt,
            validation: overConf > 0.5 ? 'strong' : overConf > 0.25 ? 'medium' : 'weak',
            entryDigit, predictionDigit: overType === 'over' ? Math.min(9, entryDigit + 1) : Math.max(0, entryDigit - 1),
            price: currentPrice, indicators: indicatorData,
        });
    }

    // Matches/Differs signal
    const mostFreqDigit = Object.entries(digitCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
    const predDigit = parseInt(mostFreqDigit[0]);
    const digitFreq = Number(mostFreqDigit[1]) / 50;
    const recentFreq = recentDigits.filter(d => d === predDigit).length / 10;
    const blendedFreq = recentFreq * 0.6 + digitFreq * 0.4;
    let matchBonus = 0;
    if (bbWidth < 0.001) matchBonus = 0.06;
    else if (bbWidth > 0.003) matchBonus = -0.06;
    if ((digitPsych.digitHeat[predDigit] || 0) > 4) matchBonus += 0.05;
    const adjustedFreq = blendedFreq + matchBonus;
    const predictedType = entryDigit === predDigit ? 'differs' : 'matches';
    if (adjustedFreq > 0.12) {
        signals.push({
            id: `${symbol}-matchesdiffer`, market, signalType: predictedType, category: 'digit',
            probability: Math.min(88, Math.max(55, 55 + adjustedFreq * 55)),
            entryPoint: entryTime, expiresAt,
            validation: adjustedFreq > 0.25 ? 'strong' : adjustedFreq > 0.18 ? 'medium' : 'weak',
            entryDigit, predictionDigit: predDigit, price: currentPrice, indicators: indicatorData,
        });
    }

    return signals;
};

export const useSignalSpark = (connected: boolean) => {
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [signals, setSignals] = useState<Signal[]>([]);
    const [tickCounts, setTickCounts] = useState<Record<string, number>>({});
    const [digitPatterns, setDigitPatterns] = useState<Record<string, { digits: number[]; prices: number[]; timestamps: number[] }>>({});
    const [priceHistory, setPriceHistory] = useState<Record<string, number[]>>({});

    const connect = useCallback(() => {
        if (ws?.readyState === WebSocket.OPEN) return;
        const websocket = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`);

        websocket.onopen = () => {
            websocket.send(JSON.stringify({ ping: 1 }));
            MARKETS.forEach(symbol => {
                websocket.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
            });
        };

        websocket.onmessage = event => {
            try {
                const data = JSON.parse(event.data);
                if (data.msg_type === 'tick' && data.tick) {
                    const tick = data.tick;
                    const { symbol, quote, epoch } = tick;
                    setPriceHistory(prev => {
                        const history = [...(prev[symbol] || []), quote].slice(-200);
                        return { ...prev, [symbol]: history };
                    });
                    setTickCounts(prev => ({ ...prev, [symbol]: (prev[symbol] || 0) + 1 }));
                    setDigitPatterns(prev => {
                        const existing = prev[symbol] || { digits: [], prices: [], timestamps: [] };
                        const digit = Math.floor((quote * 100) % 10);
                        return {
                            ...prev,
                            [symbol]: {
                                digits: [...existing.digits, digit].slice(-20),
                                prices: [...existing.prices, quote].slice(-100),
                                timestamps: [...existing.timestamps, epoch * 1000].slice(-100),
                            },
                        };
                    });
                    setPriceHistory(prev => {
                        const history = prev[symbol] || [];
                        if (history.length >= 50) {
                            const newSignals = generateSignals(symbol, history);
                            setSignals(current => {
                                const filtered = current.filter(s => !s.market.includes(MARKET_NAMES[symbol]?.split(' ')[0] || '') || s.expiresAt > Date.now());
                                const updated = filtered.filter(s => !newSignals.some(ns => ns.id === s.id));
                                return [...updated, ...newSignals].slice(-50);
                            });
                        }
                        return prev;
                    });
                }
            } catch (e) {
                console.error('Signal error:', e);
            }
        };

        websocket.onerror = () => console.error('Deriv WebSocket error');
        websocket.onclose = () => setWs(null);
        setWs(websocket);
    }, [ws]);

    const disconnect = useCallback(() => {
        if (ws) {
            ws.close();
            setWs(null);
            setSignals([]);
            setPriceHistory({});
            setTickCounts({});
            setDigitPatterns({});
        }
    }, [ws]);

    useEffect(() => {
        if (connected) connect();
        else disconnect();
        return () => { ws?.close(); };
    }, [connected]);

    return { signals, isConnected: ws?.readyState === WebSocket.OPEN, tickCounts, digitPatterns };
};
