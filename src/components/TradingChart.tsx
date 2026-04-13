import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { MARKET_NAMES } from '../hooks/useSignalSpark';

interface TradingChartProps {
    digitPatterns: Record<string, { digits: number[]; prices: number[]; timestamps: number[] }>;
}

const calculateSMA = (prices: number[], period: number, index: number): number | null => {
    if (index < period - 1) return null;
    const slice = prices.slice(index - period + 1, index + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
};

const TradingChart = ({ digitPatterns }: TradingChartProps) => {
    const availableMarkets = Object.keys(digitPatterns);
    const [selectedMarket, setSelectedMarket] = useState(availableMarkets[0] || '');
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

    const { chartData, currentPrice, previousPrice, high, low } = useMemo(() => {
        const marketData = digitPatterns[selectedMarket];
        if (!marketData || marketData.prices.length === 0)
            return { chartData: [], currentPrice: 0, previousPrice: 0, high: 0, low: 0 };
        const prices = marketData.prices;
        const cd = prices.map((price, index) => ({
            time: new Date(marketData.timestamps[index]).toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }),
            price,
            sma: calculateSMA(prices, 10, index),
        }));
        const cp = prices[prices.length - 1] || 0;
        const pp = prices[prices.length - 2] || cp;
        return {
            chartData: cd,
            currentPrice: cp,
            previousPrice: pp,
            high: Math.max(...prices),
            low: Math.min(...prices),
        };
    }, [selectedMarket, digitPatterns]);

    if (availableMarkets.length === 0) return null;
    const isPositive = currentPrice >= previousPrice;
    const priceColor = isPositive ? '#34d399' : '#f87171';

    return (
        <div className='ss-chart'>
            <div className='ss-chart__header'>
                <div>
                    <select
                        className='ss-chart__select'
                        value={selectedMarket}
                        onChange={e => setSelectedMarket(e.target.value)}
                    >
                        {availableMarkets.map(m => (
                            <option key={m} value={m}>
                                {MARKET_NAMES[m] || m}
                            </option>
                        ))}
                    </select>
                </div>
                <div className='ss-chart__price-info'>
                    <span className='ss-chart__current-price' style={{ color: priceColor }}>
                        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {currentPrice.toFixed(5)}
                    </span>
                    <span className='ss-chart__time'>{currentTime.toLocaleTimeString()}</span>
                </div>
            </div>

            <div className='ss-chart__meta'>
                <span>H: <strong style={{ color: '#34d399' }}>{high.toFixed(5)}</strong></span>
                <span>L: <strong style={{ color: '#f87171' }}>{low.toFixed(5)}</strong></span>
                <span>Ticks: <strong>{chartData.length}</strong></span>
            </div>

            <div style={{ height: 250 }}>
                <ResponsiveContainer width='100%' height='100%'>
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id='priceGrad' x1='0' y1='0' x2='0' y2='1'>
                                <stop offset='5%' stopColor={priceColor} stopOpacity={0.3} />
                                <stop offset='95%' stopColor={priceColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray='3 3' stroke='#1f2937' vertical={false} />
                        <XAxis
                            dataKey='time'
                            stroke='#374151'
                            tick={{ fill: '#6b7280', fontSize: 9 }}
                            interval='preserveStartEnd'
                        />
                        <YAxis
                            stroke='#374151'
                            tick={{ fill: '#6b7280', fontSize: 9 }}
                            domain={['auto', 'auto']}
                            tickFormatter={v => v.toFixed(3)}
                            width={60}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#111827',
                                border: '1px solid #374151',
                                borderRadius: 6,
                                fontSize: 11,
                                fontFamily: 'monospace',
                            }}
                            formatter={(val: number) => [val.toFixed(5), 'Price']}
                        />
                        <Area
                            type='monotone'
                            dataKey='price'
                            stroke={priceColor}
                            strokeWidth={1.5}
                            fill='url(#priceGrad)'
                            dot={false}
                            animationDuration={200}
                        />
                        <Area
                            type='monotone'
                            dataKey='sma'
                            stroke='#f59e0b'
                            strokeWidth={1}
                            fill='none'
                            dot={false}
                            strokeDasharray='4 2'
                            animationDuration={200}
                            connectNulls={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TradingChart;
