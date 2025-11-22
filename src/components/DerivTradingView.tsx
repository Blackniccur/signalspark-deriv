import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";

interface PriceData {
  time: string;
  price: number;
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

export const DerivTradingView = ({ digitPatterns }: DerivTradingViewProps) => {
  const availableMarkets = Object.keys(digitPatterns);
  const [selectedMarket, setSelectedMarket] = useState(availableMarkets[0] || "");
  
  useEffect(() => {
    if (availableMarkets.length > 0 && !availableMarkets.includes(selectedMarket)) {
      setSelectedMarket(availableMarkets[0]);
    }
  }, [availableMarkets, selectedMarket]);

  if (availableMarkets.length === 0 || !selectedMarket) {
    return null;
  }

  const marketData = digitPatterns[selectedMarket];
  const chartData: PriceData[] = marketData.prices.map((price, index) => ({
    time: new Date(marketData.timestamps[index]).toLocaleTimeString(),
    price: price
  }));

  const currentPrice = marketData.prices[marketData.prices.length - 1];
  const previousPrice = marketData.prices[marketData.prices.length - 2] || currentPrice;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = ((priceChange / previousPrice) * 100).toFixed(2);
  const isPositive = priceChange >= 0;

  const high = Math.max(...marketData.prices);
  const low = Math.min(...marketData.prices);
  const open = marketData.prices[0];

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">Trading View</h3>
            <p className="text-sm text-muted-foreground">Real-time price chart</p>
          </div>
          <Select value={selectedMarket} onValueChange={setSelectedMarket}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Market" />
            </SelectTrigger>
            <SelectContent>
              {availableMarkets.map((market) => (
                <SelectItem key={market} value={market}>
                  {marketNames[market] || market}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Info */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Current</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-foreground">{currentPrice.toFixed(5)}</p>
              <div className={`flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="text-sm font-medium">{priceChangePercent}%</span>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Open</p>
            <p className="text-lg font-semibold text-foreground">{open.toFixed(5)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">High</p>
            <p className="text-lg font-semibold text-success">{high.toFixed(5)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Low</p>
            <p className="text-lg font-semibold text-destructive">{low.toFixed(5)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Change</p>
            <p className={`text-lg font-semibold ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? '+' : ''}{priceChange.toFixed(5)}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="w-full h-[300px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
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
                itemStyle={{ color: 'hsl(var(--primary))' }}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Last Digit */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">Last Digit</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary bg-primary/10 px-4 py-2 rounded-lg">
              {marketData.digits[marketData.digits.length - 1]}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
