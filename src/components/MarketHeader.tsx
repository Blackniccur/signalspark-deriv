import { Button } from "@/components/ui/button";
import { Activity, Link2 } from "lucide-react";
import { useEffect, useState } from "react";

interface MarketHeaderProps {
  connected: boolean;
  onToggleConnection: () => void;
}

export const MarketHeader = ({ connected, onToggleConnection }: MarketHeaderProps) => {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative text-center">
            <h1 className="font-orbitron text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-destructive tracking-wider">
              DERIV SIGNAL PRO
            </h1>
            <div className="absolute -inset-2 bg-gradient-to-r from-primary to-accent opacity-20 blur-xl -z-10" />
          </div>
          <p className="text-primary/80 text-sm tracking-[0.3em] uppercase font-orbitron">
            Advanced Market Prediction Algorithm
          </p>

          <div className="flex items-center gap-4 text-sm flex-wrap justify-center">
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
              <span className={connected ? 'text-success' : 'text-muted-foreground'}>
                {connected ? 'System Online' : 'Offline'}
              </span>
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="text-primary font-orbitron text-xs">{time}</span>
            <span className="text-muted-foreground">|</span>
            <Button
              onClick={onToggleConnection}
              size="sm"
              className={`font-orbitron tracking-wider text-xs ${
                connected 
                  ? 'bg-destructive/20 text-destructive border border-destructive/50 hover:bg-destructive/30' 
                  : 'bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30'
              }`}
              variant="ghost"
            >
              <Link2 className="w-3 h-3 mr-1" />
              {connected ? 'DISCONNECT' : 'CONNECT'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
