import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Clock, BarChart3 } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface PriceData {
  time: string;
  price: number;
  sma: number | null;
}

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

export const DerivTradingView = ({ digitPatterns }: DerivTradingViewProps) => {
  const availableMarkets = Object.keys(digitPatterns);
  const [selectedMarket, setSelectedMarket] = useState(availableMarkets[0] || "");
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    if (availableMarkets.length > 0 && !availableMarkets.includes(selectedMarket)) {
      setSelectedMarket(availableMarkets[0]);
    }
  }, [availableMarkets, selectedMarket]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (availableMarkets.length === 0 || !selectedMarket) {
    return null;
  }

  const marketData = digitPatterns[selectedMarket];
  const prices = marketData.prices;
  
  const chartData: PriceData[] = prices.map((price, index) => ({
    time: new Date(marketData.timestamps[index]).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    price: price,
    sma: calculateSMA(prices, 10, index)
  }));

  const currentPrice = prices[prices.length - 1];
  const previousPrice = prices[prices.length - 2] || currentPrice;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = ((priceChange / previousPrice) * 100).toFixed(3);
  const isPositive = priceChange >= 0;

  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const open = prices[0];
  const spread = high - low;

  const priceRange = high - low;
  const yMin = low - priceRange * 0.1;
  const yMax = high + priceRange * 0.1;

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
          <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-mono">LIVE</span>
          <span className="text-[10px] text-muted-foreground">{prices.length} ticks</span>
        </div>
      </div>

      {/* Price Display */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/10">
        <div className="flex items-center gap-4">
          <div>
            <span className={`font-mono text-2xl font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {currentPrice.toFixed(4)}
            </span>
          </div>
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
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? '#34d399' : '#f87171'} stopOpacity={0.3} />
                <stop offset="100%" stopColor={isPositive ? '#34d399' : '#f87171'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#333"
              tick={{ fill: '#555', fontSize: 9, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={{ stroke: '#222' }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#333"
              tick={{ fill: '#555', fontSize: 9, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              domain={[yMin, yMax]}
              tickFormatter={(v) => v.toFixed(3)}
              width={65}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'monospace',
                padding: '8px 12px'
              }}
              labelStyle={{ color: '#888', marginBottom: '4px' }}
              formatter={(value: number, name: string) => [
                value.toFixed(5),
                name === 'price' ? 'Price' : 'SMA(10)'
              ]}
            />
            <ReferenceLine y={currentPrice} stroke={isPositive ? '#34d399' : '#f87171'} strokeDasharray="2 2" strokeOpacity={0.5} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={isPositive ? '#34d399' : '#f87171'}
              strokeWidth={1.5}
              fill="url(#priceGradient)"
              dot={false}
              animationDuration={200}
            />
            <Line
              type="monotone"
              dataKey="sma"
              stroke="#f59e0b"
              strokeWidth={1}
              dot={false}
              strokeDasharray="4 2"
              animationDuration={200}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
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
            <span>SMA(10)</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
