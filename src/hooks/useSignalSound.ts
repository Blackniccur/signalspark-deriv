import { useEffect, useRef } from 'react';
import type { Signal } from './useSignalSpark';

const playStrongSignalSound = () => {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
            gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.15 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.4);
            osc.start(ctx.currentTime + i * 0.15);
            osc.stop(ctx.currentTime + i * 0.15 + 0.4);
        });
        setTimeout(() => ctx.close(), 2000);
    } catch (e) {
        console.warn('Signal sound error:', e);
    }
};

export const useSignalSound = (signals: Signal[]) => {
    const notifiedIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        signals.forEach(signal => {
            if (notifiedIds.current.has(signal.id)) return;
            if (signal.validation === 'strong' && signal.probability >= 70) {
                playStrongSignalSound();
                notifiedIds.current.add(signal.id);
            }
        });
        const activeIds = new Set(signals.map(s => s.id));
        notifiedIds.current.forEach(id => { if (!activeIds.has(id)) notifiedIds.current.delete(id); });
    }, [signals]);
};
