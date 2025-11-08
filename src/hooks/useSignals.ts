import { useState, useEffect } from 'react';

export interface Signal {
  id: string;
  market: string;
  signalType: "over" | "under" | "even" | "odd" | "rise" | "fall" | "matches" | "differs";
  probability: number;
  entryPoint: string;
  validation: "strong" | "medium" | "weak";
  digit?: number;
}

const generateSignal = (market: string): Signal => {
  const signalTypes: Signal["signalType"][] = ["over", "under", "even", "odd", "rise", "fall", "matches", "differs"];
  const signalType = signalTypes[Math.floor(Math.random() * signalTypes.length)];
  const probability = Math.floor(Math.random() * 40) + 50; // 50-90%
  
  let validation: "strong" | "medium" | "weak";
  if (probability >= 75) validation = "strong";
  else if (probability >= 60) validation = "medium";
  else validation = "weak";

  return {
    id: `${market}-${Date.now()}`,
    market,
    signalType,
    probability,
    entryPoint: new Date(Date.now() + Math.random() * 60000).toLocaleTimeString(),
    validation,
    digit: ["matches", "differs", "even", "odd"].includes(signalType) 
      ? Math.floor(Math.random() * 10) 
      : undefined
  };
};

export const useSignals = () => {
  const markets = [
    "Volatility 10 Index",
    "Volatility 25 Index", 
    "Volatility 50 Index",
    "Volatility 75 Index",
    "Volatility 100 Index",
    "Volatility 10 (1s) Index",
    "Volatility 25 (1s) Index",
    "Volatility 50 (1s) Index",
    "Volatility 75 (1s) Index",
    "Volatility 100 (1s) Index",
    "Boom 300 Index",
    "Boom 500 Index",
    "Crash 300 Index",
    "Crash 500 Index"
  ];

  const [signals, setSignals] = useState<Signal[]>(() => 
    markets.slice(0, 12).map(market => generateSignal(market))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setSignals(prevSignals => {
        const randomIndex = Math.floor(Math.random() * prevSignals.length);
        const newSignals = [...prevSignals];
        newSignals[randomIndex] = generateSignal(prevSignals[randomIndex].market);
        return newSignals;
      });
    }, 5000); // Update random signal every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return signals;
};
