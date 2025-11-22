import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import { TrendingUp, TrendingDown, Activity, BarChart3, LineChart as LineChartIcon } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradingDashboardProps {
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

export const TradingDashboard = ({ digitPatterns }: TradingDashboardProps) => {
  const availableMarkets = Object.keys(digitPatterns);
  const [selectedMarket, setSelectedMarket] = useState(availableMarkets[0] || "");
  const [chartType, setChartType] = useState<"line" | "candle">("candle");
  const [timeframe, setTimeframe] = useState("all");
  
  useEffect(() => {
    if (availableMarkets.length > 0 && !availableMarkets.includes(selectedMarket)) {
      setSelectedMarket(availableMarkets[0]);
    }
  }, [availableMarkets, selectedMarket]);

  const candleData = useMemo(() => {
    if (!selectedMarket || !digitPatterns[selectedMarket]) return [];
    
    const marketData = digitPatterns[selectedMarket];
    const data: CandleData[] = [];
    
    // Group prices into candles (every 5 ticks)
    for (let i = 0; i < marketData.prices.length; i += 5) {
      const segment = marketData.prices.slice(i, i + 5);
      if (segment.length > 0) {
        data.push({
          time: new Date(marketData.timestamps[i]).toLocaleTimeString(),
          open: segment[0],
          high: Math.max(...segment),
          low: Math.min(...segment),
          close: segment[segment.length - 1],
          volume: segment.length
        });
      }
    }
    
    return data;
  }, [selectedMarket, digitPatterns]);

  if (availableMarkets.length === 0 || !selectedMarket) {
    return null;
  }

  const marketData = digitPatterns[selectedMarket];
  const currentPrice = marketData.prices[marketData.prices.length - 1];
  const previousPrice = marketData.prices[marketData.prices.length - 2] || currentPrice;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = ((priceChange / previousPrice) * 100).toFixed(2);
  const isPositive = priceChange >= 0;

  const high = Math.max(...marketData.prices);
  const low = Math.min(...marketData.prices);
  const open = marketData.prices[0];
  const close = currentPrice;

  // Calculate simple moving average
  const sma = useMemo(() => {
    if (marketData.prices.length < 5) return null;
    const last5 = marketData.prices.slice(-5);
    return (last5.reduce((a, b) => a + b, 0) / 5).toFixed(5);
  }, [marketData.prices]);

  // Calculate RSI (simplified)
  const rsi = useMemo(() => {
    if (marketData.prices.length < 14) return null;
    const changes = marketData.prices.slice(-14).map((price, i, arr) => 
      i === 0 ? 0 : price - arr[i - 1]
    );
    const gains = changes.filter(c => c > 0).reduce((a, b) => a + b, 0) / 14;
    const losses = Math.abs(changes.filter(c => c < 0).reduce((a, b) => a + b, 0)) / 14;
    const rs = gains / (losses || 1);
    return (100 - (100 / (1 + rs))).toFixed(2);
  }, [marketData.prices]);

  const CustomCandlestick = (props: any) => {
    const { x, y, width, height, payload } = props;
    const isUp = payload.close >= payload.open;
    const color = isUp ? 'hsl(var(--success))' : 'hsl(var(--destructive))';
    const wickX = x + width / 2;
    
    return (
      <g>
        {/* Wick */}
        <line
          x1={wickX}
          y1={y}
          x2={wickX}
          y2={y + height}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body */}
        <rect
          x={x}
          y={isUp ? y + height * 0.3 : y + height * 0.1}
          width={width}
          height={height * 0.6}
          fill={color}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Main Chart */}
      <Card className="lg:col-span-3 p-6 bg-card border-border">
        <div className="space-y-4">
          {/* Chart Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableMarkets.map((market) => (
                    <SelectItem key={market} value={market}>
                      {marketNames[market] || market}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={chartType === "line" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("line")}
                >
                  <LineChartIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant={chartType === "candle" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("candle")}
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setTimeframe("5")}>5T</Button>
              <Button variant="outline" size="sm" onClick={() => setTimeframe("10")}>10T</Button>
              <Button variant="outline" size="sm" onClick={() => setTimeframe("all")}>All</Button>
            </div>
          </div>

          {/* Price Display */}
          <div className="flex items-end gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Price</p>
              <div className="flex items-center gap-3">
                <p className="text-3xl font-bold text-foreground">{currentPrice.toFixed(5)}</p>
                <div className={`flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
                  {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  <span className="text-lg font-semibold">{priceChangePercent}%</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4 pb-2">
              <div>
                <p className="text-xs text-muted-foreground">Open</p>
                <p className="text-sm font-semibold text-foreground">{open.toFixed(5)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">High</p>
                <p className="text-sm font-semibold text-success">{high.toFixed(5)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Low</p>
                <p className="text-sm font-semibold text-destructive">{low.toFixed(5)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Close</p>
                <p className="text-sm font-semibold text-foreground">{close.toFixed(5)}</p>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="w-full h-[400px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "candle" ? (
                <ComposedChart data={candleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="time" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    domain={['dataMin - 0.001', 'dataMax + 0.001']}
                    tickFormatter={(value) => value.toFixed(5)}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar 
                    dataKey="high" 
                    fill="transparent"
                    shape={<CustomCandlestick />}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="close" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={1}
                    dot={false}
                    strokeDasharray="5 5"
                  />
                </ComposedChart>
              ) : (
                <ComposedChart data={candleData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="time" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    domain={['dataMin - 0.001', 'dataMax + 0.001']}
                    tickFormatter={(value) => value.toFixed(5)}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="close" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fill="url(#colorPrice)"
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Last Digit Display */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Last Digit</p>
            </div>
            <span className="text-2xl font-bold text-primary bg-primary/10 px-4 py-2 rounded-lg">
              {marketData.digits[marketData.digits.length - 1]}
            </span>
          </div>
        </div>
      </Card>

      {/* Side Panel - Technical Indicators */}
      <Card className="p-6 bg-card border-border space-y-6">
        <div>
          <h3 className="text-lg font-bold text-foreground mb-4">Technical Indicators</h3>
          
          <div className="space-y-4">
            {/* SMA */}
            <div className="p-4 bg-background rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">SMA (5)</p>
                <span className="text-xs text-primary">Simple Moving Avg</span>
              </div>
              <p className="text-xl font-bold text-foreground">{sma || 'N/A'}</p>
            </div>

            {/* RSI */}
            <div className="p-4 bg-background rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">RSI (14)</p>
                <span className="text-xs text-primary">Relative Strength</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-foreground">{rsi || 'N/A'}</p>
                {rsi && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    parseFloat(rsi) > 70 ? 'bg-destructive/20 text-destructive' :
                    parseFloat(rsi) < 30 ? 'bg-success/20 text-success' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {parseFloat(rsi) > 70 ? 'Overbought' : parseFloat(rsi) < 30 ? 'Oversold' : 'Neutral'}
                  </span>
                )}
              </div>
            </div>

            {/* Volatility */}
            <div className="p-4 bg-background rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Volatility</p>
                <span className="text-xs text-primary">Price Range</span>
              </div>
              <p className="text-xl font-bold text-foreground">{((high - low) / open * 100).toFixed(2)}%</p>
            </div>

            {/* Spread */}
            <div className="p-4 bg-background rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Spread</p>
                <span className="text-xs text-primary">High - Low</span>
              </div>
              <p className="text-xl font-bold text-foreground">{(high - low).toFixed(5)}</p>
            </div>
          </div>
        </div>

        {/* Market Status */}
        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">Market Status</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Trend</span>
              <span className={`text-xs font-semibold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {isPositive ? 'Bullish' : 'Bearish'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Ticks</span>
              <span className="text-xs font-semibold text-foreground">{marketData.prices.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Last Update</span>
              <span className="text-xs font-semibold text-foreground">
                {new Date(marketData.timestamps[marketData.timestamps.length - 1]).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
