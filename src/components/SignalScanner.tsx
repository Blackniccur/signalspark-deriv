import { Activity } from 'lucide-react';
import { MARKET_NAMES } from '../hooks/useSignalSpark';

interface SignalScannerProps {
    tickCounts: Record<string, number>;
    isConnected: boolean;
}

const SignalScanner = ({ tickCounts, isConnected }: SignalScannerProps) => {
    if (!isConnected) return null;

    return (
        <div className='ss-scanner'>
            <div className='ss-scanner__header'>
                <Activity size={16} className='ss-scanner__icon' />
                <span className='ss-scanner__title'>SIGNAL SCANNER</span>
                <span className='ss-scanner__badge'>SCANNING</span>
            </div>
            <div className='ss-scanner__markets'>
                {Object.entries(tickCounts).map(([symbol, count]) => {
                    const progress = Math.min((count / 50) * 100, 100);
                    const isReady = count >= 50;
                    return (
                        <div key={symbol} className='ss-scanner__market'>
                            <div className='ss-scanner__market-row'>
                                <span className='ss-scanner__market-name'>{MARKET_NAMES[symbol] || symbol}</span>
                                <span className='ss-scanner__market-count' style={{ color: isReady ? '#34d399' : '#38bdf8' }}>
                                    {count}/50 {isReady ? '✓' : ''}
                                </span>
                            </div>
                            <div className='ss-scanner__progress'>
                                <div
                                    className='ss-scanner__progress-fill'
                                    style={{ width: `${progress}%`, backgroundColor: isReady ? '#34d399' : '#38bdf8' }}
                                />
                            </div>
                        </div>
                    );
                })}
                {Object.keys(tickCounts).length === 0 && (
                    <p className='ss-scanner__empty'>Waiting for market data...</p>
                )}
            </div>
        </div>
    );
};

export default SignalScanner;
