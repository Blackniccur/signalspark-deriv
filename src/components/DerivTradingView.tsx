import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine, Line, BarChart, Bar, Cell, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Clock, BarChart3, LineChart as LineChartIcon } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import type { CandleData } from "./CandlestickBar";

interface DerivTradingViewProps {
  digitPatterns: Record<string, { digits: number[], prices: number[], timestamps: number[] }>;
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

const calculateSMA = (prices: number[], period: number, index: number): number | null => {
  if (index < period - 1) return null;
  const slice = prices.slice(index - period + 1, index + 1);
  return slice.reduce((a, b) => a + b, 0) / period;
};

const buildCandles = (prices: number[], timestamps: number[], candleSize: number): CandleData[] => {
  const candles: CandleData[] = [];
  for (let i = 0; i < prices.length; i += candleSize) {
    const slice = prices.slice(i, i + candleSize);
    if (slice.length === 0) continue;
    const ts = timestamps[i];
    candles.push({
      time: new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      open: slice[0],
      high: Math.max(...slice),
      low: Math.min(...slice),
      close: slice[slice.length - 1],
      sma: null,
    });
  }
  // Calculate SMA on candle closes
  const closes = candles.map(c => c.close);
  candles.forEach((c, i) => {
    c.sma = calculateSMA(closes, 5, i);
  });
  return candles;
};

export const DerivTradingView = ({ digitPatterns }: DerivTradingViewProps) => {
  const availableMarkets = Object.keys(digitPatterns);
  const [selectedMarket, setSelectedMarket] = useState(availableMarkets[0] || "");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [chartType, setChartType] = useState<"area" | "candle">("area");

  useEffect(() => {
    if (availableMarkets.length > 0 && !availableMarkets.includes(selectedMarket)) {
      setSelectedMarket(availableMarkets[0]);
    }
  }, [availableMarkets, selectedMarket]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const marketData = digitPatterns[selectedMarket];

  const { chartData, candleData, currentPrice, previousPrice, high, low, open, spread, yMin, yMax, candleYMin, candleYMax } = useMemo(() => {
    if (!marketData) return { chartData: [], candleData: [], currentPrice: 0, previousPrice: 0, high: 0, low: 0, open: 0, spread: 0, yMin: 0, yMax: 0, candleYMin: 0, candleYMax: 0 };
    const prices = marketData.prices;
    const cd = prices.map((price, index) => ({
      time: new Date(marketData.timestamps[index]).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      price,
      sma: calculateSMA(prices, 10, index),
    }));
    const candles = buildCandles(prices, marketData.timestamps, 5);
    const cp = prices[prices.length - 1] || 0;
    const pp = prices[prices.length - 2] || cp;
    const h = Math.max(...prices);
    const l = Math.min(...prices);
    const o = prices[0] || 0;
    const range = h - l;
    const cH = candles.length > 0 ? Math.max(...candles.map(c => c.high)) : h;
    const cL = candles.length > 0 ? Math.min(...candles.map(c => c.low)) : l;
    const cRange = cH - cL;
    return {
      chartData: cd,
      candleData: candles,
      currentPrice: cp,
      previousPrice: pp,
      high: h,
      low: l,
      open: o,
      spread: h - l,
      yMin: l - range * 0.1,
      yMax: h + range * 0.1,
      candleYMin: cL - cRange * 0.1,
      candleYMax: cH + cRange * 0.1,
    };
  }, [marketData]);

  if (availableMarkets.length === 0 || !selectedMarket || !marketData) {
    return null;
  }

  const prices = marketData.prices;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice ? ((priceChange / previousPrice) * 100).toFixed(3) : '0.000';
  const isPositive = priceChange >= 0;

  return (
    <Card className="bg-[#0e0e0e] border-border/30 overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/20 bg-[#161616]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <Select value={selectedMarket} onValueChange={setSelectedMarket}>
              <SelectTrigger className="w-[180px] h-8 text-xs bg-transparent border-border/30 text-foreground font-semibold">
                <SelectValue placeholder="Select Market" />
              </SelectTrigger>
              <SelectContent>
                {availableMarkets.map((market) => (
                  <SelectItem key={market} value={market} className="text-xs">
                    {marketNames[market] || market}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            {currentTime.toLocaleTimeString('en-US', { hour12: false })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Chart Type Toggle */}
          <div className="flex items-center gap-1 bg-background/50 rounded p-0.5">
            <button
              onClick={() => setChartType("area")}
              className={`p-1.5 rounded transition-colors ${chartType === 'area' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              title="Area Chart"
            >
              <LineChartIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType("candle")}
              className={`p-1.5 rounded transition-colors ${chartType === 'candle' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              title="Candlestick Chart"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-mono">LIVE</span>
          <span className="text-[10px] text-muted-foreground">{prices.length} ticks</span>
        </div>
      </div>

      {/* Price Display */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/10">
        <div className="flex items-center gap-4">
          <span className={`font-mono text-2xl font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {currentPrice.toFixed(4)}
          </span>
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono ${isPositive ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositive ? '+' : ''}{priceChangePercent}%
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[10px] font-mono">
          <div className="text-center">
            <div className="text-muted-foreground">O</div>
            <div className="text-foreground">{open.toFixed(4)}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">H</div>
            <div className="text-emerald-400">{high.toFixed(4)}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">L</div>
            <div className="text-red-400">{low.toFixed(4)}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Spread</div>
            <div className="text-foreground">{spread.toFixed(4)}</div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-[320px] px-2 py-2">
        {chartType === "area" ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPositive ? '#34d399' : '#f87171'} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={isPositive ? '#34d399' : '#f87171'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis dataKey="time" stroke="#333" tick={{ fill: '#555', fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: '#222' }} interval="preserveStartEnd" />
              <YAxis stroke="#333" tick={{ fill: '#555', fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} domain={[yMin, yMax]} tickFormatter={(v) => v.toFixed(3)} width={65} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace', padding: '8px 12px' }} labelStyle={{ color: '#888', marginBottom: '4px' }} formatter={(value: number, name: string) => [value.toFixed(5), name === 'price' ? 'Price' : 'SMA(10)']} />
              <ReferenceLine y={currentPrice} stroke={isPositive ? '#34d399' : '#f87171'} strokeDasharray="2 2" strokeOpacity={0.5} />
              <Area type="monotone" dataKey="price" stroke={isPositive ? '#34d399' : '#f87171'} strokeWidth={1.5} fill="url(#priceGradient)" dot={false} animationDuration={200} />
              <Line type="monotone" dataKey="sma" stroke="#f59e0b" strokeWidth={1} dot={false} strokeDasharray="4 2" animationDuration={200} connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <CandlestickChart data={candleData} yMin={candleYMin} yMax={candleYMax} currentPrice={currentPrice} isPositive={isPositive} />
        )}
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border/20 bg-[#161616]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Last Digit:</span>
          <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
            {marketData.digits[marketData.digits.length - 1]}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-0.5 rounded bg-emerald-400"></div>
            <span>Price</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-0.5 rounded bg-amber-400" style={{ borderBottom: '1px dashed' }}></div>
            <span>{chartType === 'area' ? 'SMA(10)' : 'SMA(5)'}</span>
          </div>
          {chartType === 'candle' && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm border border-emerald-400 bg-emerald-400/30"></div>
              <span>Candle</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// Candlestick chart using SVG custom shapes within recharts
const CandlestickChart = ({ data, yMin, yMax, currentPrice, isPositive }: { data: CandleData[], yMin: number, yMax: number, currentPrice: number, isPositive: boolean }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
        <XAxis dataKey="time" stroke="#333" tick={{ fill: '#555', fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={{ stroke: '#222' }} interval="preserveStartEnd" />
        <YAxis stroke="#333" tick={{ fill: '#555', fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} domain={[yMin, yMax]} tickFormatter={(v) => v.toFixed(3)} width={65} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace', padding: '8px 12px' }}
          labelStyle={{ color: '#888', marginBottom: '4px' }}
          formatter={(value: number, name: string) => {
            const labels: Record<string, string> = { open: 'Open', high: 'High', low: 'Low', close: 'Close', sma: 'SMA(5)' };
            return [value.toFixed(5), labels[name] || name];
          }}
        />
        <ReferenceLine y={currentPrice} stroke={isPositive ? '#34d399' : '#f87171'} strokeDasharray="2 2" strokeOpacity={0.5} />
        
        {/* Candlestick wicks as error bars using Bar with custom shape */}
        <Bar dataKey="high" shape={(props: any) => {
          const { x, width, payload, y: barY } = props;
          if (!payload) return null;
          const { open: o, high: h, low: l, close: c } = payload;
          const isUp = c >= o;
          const color = isUp ? '#34d399' : '#f87171';
          
          // We need to calculate positions based on the chart's y-scale
          // The bar's y position corresponds to 'high', and we can use that
          const chartHeight = 290; // approximate
          const range = yMax - yMin;
          const scale = (v: number) => ((yMax - v) / range) * chartHeight + 5;
          
          const yH = scale(h);
          const yL = scale(l);
          const yO = scale(o);
          const yC = scale(c);
          const bodyTop = Math.min(yO, yC);
          const bodyH = Math.max(Math.abs(yO - yC), 1);
          const barW = Math.max(width * 0.6, 3);
          const barX = x + (width - barW) / 2;
          const wickX = x + width / 2;
          
          return (
            <g>
              <line x1={wickX} y1={yH} x2={wickX} y2={yL} stroke={color} strokeWidth={1} />
              <rect x={barX} y={bodyTop} width={barW} height={bodyH} fill={isUp ? 'transparent' : color} stroke={color} strokeWidth={1} rx={1} />
            </g>
          );
        }} fill="transparent" />
        
        <Line type="monotone" dataKey="sma" stroke="#f59e0b" strokeWidth={1} dot={false} strokeDasharray="4 2" animationDuration={200} connectNulls={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};
