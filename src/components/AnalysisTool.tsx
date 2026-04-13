import React, { useState } from 'react';
import { Activity, Link2, Zap, Shield } from 'lucide-react';
import { useSignalSpark } from '../hooks/useSignalSpark';
import { useSignalSound } from '../hooks/useSignalSound';
import SignalCard from './SignalCard';
import SignalScanner from './SignalScanner';
import MarketStats from './MarketStats';
import DigitPatternTracker from './DigitPatternTracker';
import TradingChart from './TradingChart';
import './analysis-tool.scss';

const AnalysisTool = () => {
    const [connected, setConnected] = useState(false);
    const [selectedMarket, setSelectedMarket] = useState<string>('all');
    const [contractFilter, setContractFilter] = useState<string>('all');
    const { signals, isConnected, tickCounts, digitPatterns } = useSignalSpark(connected);
    useSignalSound(signals);

    const filteredByMarket =
        selectedMarket === 'all'
            ? signals
            : signals.filter(s => {
                  const targets: Record<string, string> = { '10': '10', '25': '25', '50': '50', '75': '75', '100': '100' };
                  return s.market.includes(targets[selectedMarket] || selectedMarket);
              });

    const displaySignals =
        contractFilter === 'all'
            ? filteredByMarket
            : contractFilter === 'evenodd'
              ? filteredByMarket.filter(s => ['even', 'odd'].includes(s.signalType))
              : contractFilter === 'overunder'
                ? filteredByMarket.filter(s => ['over', 'under'].includes(s.signalType))
                : contractFilter === 'risefall'
                  ? filteredByMarket.filter(s => ['rise', 'fall'].includes(s.signalType))
                  : filteredByMarket.filter(s => ['matches', 'differs'].includes(s.signalType));

    return (
        <div className='ss-root'>
            <div className='ss-header'>
                <div className='ss-header__inner'>
                    <div>
                        <h1 className='ss-header__title'>DERIV SIGNAL PRO</h1>
                        <p className='ss-header__subtitle'>Advanced Market Prediction • App ID: 70785</p>
                    </div>
                    <div className='ss-header__controls'>
                        <span className={`ss-header__status ${isConnected ? 'ss-header__status--on' : ''}`}>
                            <span className='ss-header__dot' />
                            {isConnected ? 'Live' : 'Offline'}
                        </span>
                        <button
                            className={`ss-btn ${connected ? 'ss-btn--danger' : 'ss-btn--primary'}`}
                            onClick={() => setConnected(!connected)}
                        >
                            <Link2 size={14} />
                            {connected ? 'DISCONNECT' : 'GENERATE SIGNALS'}
                        </button>
                    </div>
                </div>
            </div>

            <div className='ss-content'>
                <div className='ss-filters'>
                    <div className='ss-filters__group'>
                        <label className='ss-filters__label'>Market</label>
                        <select className='ss-filters__select' value={selectedMarket} onChange={e => setSelectedMarket(e.target.value)}>
                            <option value='all'>All Markets</option>
                            <option value='10'>Volatility 10</option>
                            <option value='25'>Volatility 25</option>
                            <option value='50'>Volatility 50</option>
                            <option value='75'>Volatility 75</option>
                            <option value='100'>Volatility 100</option>
                        </select>
                    </div>
                    <div className='ss-filters__group'>
                        <label className='ss-filters__label'>Contract Type</label>
                        <select className='ss-filters__select' value={contractFilter} onChange={e => setContractFilter(e.target.value)}>
                            <option value='all'>All Types</option>
                            <option value='evenodd'>Even / Odd</option>
                            <option value='overunder'>Over / Under</option>
                            <option value='risefall'>Rise / Fall</option>
                            <option value='matchesdiffer'>Matches / Differs</option>
                        </select>
                    </div>
                </div>

                <MarketStats signals={signals} />

                <div className='ss-grid'>
                    <div className='ss-grid__left'>
                        <SignalScanner tickCounts={tickCounts} isConnected={isConnected} />
                        {isConnected && Object.keys(digitPatterns).length > 0 && (
                            <TradingChart digitPatterns={digitPatterns} />
                        )}
                    </div>

                    <div className='ss-grid__right'>
                        {displaySignals.length > 0 && (
                            <>
                                <h2 className='ss-section-title'>
                                    <Zap size={16} />
                                    LIVE SIGNALS ({displaySignals.length})
                                </h2>
                                <div className='ss-signals-grid'>
                                    {displaySignals.map(signal => (
                                        <SignalCard key={signal.id} signal={signal} />
                                    ))}
                                </div>
                            </>
                        )}

                        {isConnected && Object.keys(digitPatterns).length > 0 && (
                            <>
                                <h2 className='ss-section-title'>
                                    <Activity size={16} />
                                    DIGIT PATTERNS
                                </h2>
                                <DigitPatternTracker patterns={digitPatterns} selectedMarket={selectedMarket} />
                            </>
                        )}

                        {!isConnected && signals.length === 0 && (
                            <div className='ss-empty'>
                                <Activity size={40} />
                                <p>Click &quot;GENERATE SIGNALS&quot; to start receiving predictions</p>
                            </div>
                        )}

                        {isConnected && signals.length === 0 && (
                            <div className='ss-loading'>
                                <div className='ss-loading__pulse' />
                                <p>COLLECTING 50 TICKS FOR ANALYSIS...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisTool;
