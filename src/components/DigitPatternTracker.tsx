import { MARKET_NAMES } from '../hooks/useSignalSpark';

interface DigitPatternTrackerProps {
    patterns: Record<string, { digits: number[]; prices: number[]; timestamps: number[] }>;
    selectedMarket: string;
}

const DigitPatternTracker = ({ patterns, selectedMarket }: DigitPatternTrackerProps) => {
    const filteredPatterns =
        selectedMarket === 'all'
            ? Object.entries(patterns)
            : Object.entries(patterns).filter(([symbol]) => symbol === selectedMarket);

    if (filteredPatterns.length === 0) return null;

    return (
        <div className='ss-digit-tracker'>
            {filteredPatterns.map(([symbol, pattern]) => {
                if (pattern.digits.length === 0) return null;
                const { digits, prices } = pattern;
                const evenCount = digits.filter(d => d % 2 === 0).length;
                const oddCount = digits.length - evenCount;
                const evenPct = digits.length > 0 ? Math.round((evenCount / digits.length) * 100) : 0;
                const oddPct = digits.length > 0 ? Math.round((oddCount / digits.length) * 100) : 0;
                const changes = prices.slice(1).map((p, i) => (p > prices[i] ? 1 : -1));
                const riseCount = changes.filter(c => c === 1).length;
                const risePct = changes.length > 0 ? Math.round((riseCount / changes.length) * 100) : 0;
                const fallPct = 100 - risePct;

                return (
                    <div key={symbol} className='ss-digit-tracker__card'>
                        <h3 className='ss-digit-tracker__title'>{MARKET_NAMES[symbol] || symbol}</h3>

                        <div className='ss-digit-tracker__section-label'>Last 20 Digits</div>
                        <div className='ss-digit-tracker__digits'>
                            {digits.map((digit, idx) => (
                                <span
                                    key={idx}
                                    className='ss-digit-tracker__digit'
                                    style={{
                                        backgroundColor: digit % 2 === 0 ? 'rgba(56,189,248,0.1)' : 'rgba(244,114,182,0.1)',
                                        color: digit % 2 === 0 ? '#38bdf8' : '#f472b6',
                                        borderColor: digit % 2 === 0 ? 'rgba(56,189,248,0.3)' : 'rgba(244,114,182,0.3)',
                                    }}
                                >
                                    {digit}
                                </span>
                            ))}
                        </div>

                        <div className='ss-digit-tracker__stats'>
                            <div className='ss-digit-tracker__stat-box'>
                                <p className='ss-digit-tracker__stat-label'>EVEN/ODD</p>
                                <div className='ss-digit-tracker__stat-pair'>
                                    <div>
                                        <p className='ss-digit-tracker__stat-sub'>Even</p>
                                        <p className='ss-digit-tracker__stat-val' style={{ color: '#38bdf8' }}>{evenPct}%</p>
                                    </div>
                                    <div>
                                        <p className='ss-digit-tracker__stat-sub'>Odd</p>
                                        <p className='ss-digit-tracker__stat-val' style={{ color: '#f472b6' }}>{oddPct}%</p>
                                    </div>
                                </div>
                            </div>
                            <div className='ss-digit-tracker__stat-box'>
                                <p className='ss-digit-tracker__stat-label'>RISE/FALL</p>
                                <div className='ss-digit-tracker__stat-pair'>
                                    <div>
                                        <p className='ss-digit-tracker__stat-sub'>Rise</p>
                                        <p className='ss-digit-tracker__stat-val' style={{ color: '#34d399' }}>{risePct}%</p>
                                    </div>
                                    <div>
                                        <p className='ss-digit-tracker__stat-sub'>Fall</p>
                                        <p className='ss-digit-tracker__stat-val' style={{ color: '#f87171' }}>{fallPct}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default DigitPatternTracker;
