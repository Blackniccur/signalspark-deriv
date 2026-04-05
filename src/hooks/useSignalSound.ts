import { useEffect, useRef } from 'react';
import type { Signal } from './useSignals';

const getRecommendedRuns = (probability: number, validation: string): number => {
  if (validation === "strong" && probability >= 80) return 1;
  if (validation === "strong" && probability >= 70) return 2;
  if (validation === "medium" && probability >= 65) return 3;
  if (validation === "medium") return 4;
  return 5;
};

const playStrongSignalSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Rising 3-note chime for strong signal
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
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

    // Clean up after sounds finish
    setTimeout(() => ctx.close(), 2000);
  } catch (e) {
    console.warn('Could not play signal sound:', e);
  }
};

export const useSignalSound = (signals: Signal[]) => {
  const notifiedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    signals.forEach(signal => {
      if (notifiedIds.current.has(signal.id)) return;
      
      const runs = getRecommendedRuns(signal.probability, signal.validation);
      
      if (runs <= 2 && signal.validation === "strong") {
        playStrongSignalSound();
        notifiedIds.current.add(signal.id);
      }
    });

    // Clean up expired signal IDs
    const activeIds = new Set(signals.map(s => s.id));
    notifiedIds.current.forEach(id => {
      if (!activeIds.has(id)) notifiedIds.current.delete(id);
    });
  }, [signals]);
};
