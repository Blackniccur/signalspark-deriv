import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Calculator, Shuffle, ArrowUpCircle, ArrowDownCircle, BarChart3, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import type { Signal } from '../hooks/useSignalSpark';

interface SignalCardProps {
    signal: Signal;
}

const getSignalColor = (type: string) => {
    if (['even', 'odd'].includes(type)) return '#34d399';
    if (['over', 'under'].includes(type)) return '#f472b6';
    if (['rise', 'fall'].includes(type)) return '#38bdf8';
    return '#a78bfa';
};

const getIcon = (type: string) => {
    if (type === 'over') return <TrendingUp size={16} />;
    if (type === 'under') return <TrendingDown size={16} />;
    if (type === 'rise') return <ArrowUpCircle size={16} />;
    if (type === 'fall') return <ArrowDownCircle size={16} />;
    if (['even', 'odd'].includes(type)) return <Calculator size={16} />;
    return <Shuffle size={16} />;
};

const getValidationColor = (v: string) => {
    if (v === 'strong') return '#34d399';
    if (v === 'medium') return '#fbbf24';
    return '#f87171';
};

const SignalCard = ({ signal }: SignalCardProps) => {
    const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor((signal.expiresAt - Date.now()) / 1000)));
    const [expanded, setExpanded] = useState(false);
    const isExpired = timeLeft <= 0;
    const color = getSignalColor(signal.signalType);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(Math.max(0, Math.floor((signal.expiresAt - Date.now()) / 1000)));
        }, 1000);
        return () => clearInterval(interval);
    }, [signal.expiresAt]);

    return (
        <div className='ss-signal-card' style={{ borderTopColor: color }}>
            <div className='ss-signal-card__header'>
                <div className='ss-signal-card__type' style={{ color }}>
                    {getIcon(signal.signalType)}
                    <span>{signal.signalType.toUpperCase()}</span>
                </div>
                <div className='ss-signal-card__prob' style={{ color }}>
                    {signal.probability.toFixed(0)}%
                </div>
            </div>

            <div className='ss-signal-card__market'>{signal.market}</div>

            <div className='ss-signal-card__bar'>
                <div className='ss-signal-card__bar-fill' style={{ width: `${signal.probability}%`, backgroundColor: color }} />
            </div>

            <div className='ss-signal-card__meta'>
                <span>Entry: {signal.entryPoint}</span>
                {signal.holdTicks && <span>Hold: {signal.holdTicks}t</span>}
                {signal.price && <span>@ {signal.price.toFixed(4)}</span>}
            </div>

            {signal.predictionDigit !== undefined && (
                <div className='ss-signal-card__digit' style={{ borderColor: color, color }}>
                    Digit: {signal.predictionDigit}
                </div>
            )}

            <div className='ss-signal-card__footer'>
                <span className='ss-signal-card__validation' style={{ color: getValidationColor(signal.validation), borderColor: getValidationColor(signal.validation) }}>
                    {signal.validation.toUpperCase()}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {signal.indicators && (
                        <button className='ss-signal-card__expand-btn' onClick={() => setExpanded(!expanded)}>
                            <BarChart3 size={12} />
                            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                    )}
                    <span className='ss-signal-card__timer'>{timeLeft}s</span>
                </div>
            </div>

            {expanded && signal.indicators && (
                <div className='ss-signal-card__indicators'>
                    <div className='ss-signal-card__ind-row'>
                        <span>RSI</span>
                        <span style={{ color: signal.indicators.rsi > 70 ? '#f87171' : signal.indicators.rsi < 30 ? '#34d399' : '#94a3b8' }}>
                            {signal.indicators.rsi.toFixed(1)}
                        </span>
                    </div>
                    <div className='ss-signal-card__ind-row'>
                        <span>MACD</span>
                        <span style={{ color: signal.indicators.macd.histogram > 0 ? '#34d399' : '#f87171' }}>
                            {signal.indicators.macd.histogram.toExponential(2)}
                        </span>
                    </div>
                    <div className='ss-signal-card__ind-row'>
                        <span>BB Pos</span>
                        <span>{(signal.indicators.bb.position * 100).toFixed(0)}%</span>
                    </div>
                </div>
            )}

            {isExpired && (
                <div className='ss-signal-card__expired'>
                    <AlertCircle size={12} />
                    <span>EXPIRED - REGENERATING</span>
                </div>
            )}
        </div>
    );
};

export default SignalCard;
