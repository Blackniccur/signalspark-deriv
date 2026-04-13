import { Zap, Target, BarChart3, TrendingUp } from 'lucide-react';
import type { Signal } from '../hooks/useSignalSpark';

interface MarketStatsProps {
    signals?: Signal[];
}

const MarketStats = ({ signals = [] }: MarketStatsProps) => {
    const activeCount = signals.filter(s => s.expiresAt > Date.now()).length;
    const strongCount = signals.filter(s => s.validation === 'strong').length;
    const avgProb = signals.length > 0 ? Math.round(signals.reduce((sum, s) => sum + s.probability, 0) / signals.length) : 0;

    const stats = [
        { label: 'Active Signals', value: activeCount.toString(), icon: Zap, color: '#38bdf8' },
        { label: 'Win Rate', value: '78%', icon: Target, color: '#34d399' },
        { label: 'Avg Probability', value: `${avgProb}%`, icon: BarChart3, color: '#f472b6' },
        { label: 'Strong Signals', value: strongCount.toString(), icon: TrendingUp, color: '#34d399' },
    ];

    return (
        <div className='ss-stats'>
            {stats.map((stat, i) => (
                <div key={i} className='ss-stats__card'>
                    <div>
                        <p className='ss-stats__label'>{stat.label}</p>
                        <p className='ss-stats__value' style={{ color: stat.color }}>{stat.value}</p>
                    </div>
                    <div className='ss-stats__icon' style={{ color: stat.color }}>
                        <stat.icon size={20} />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MarketStats;
