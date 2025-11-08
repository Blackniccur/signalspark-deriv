import { Button } from "@/components/ui/button";
import { Activity, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export const MarketHeader = () => {
  const [connected, setConnected] = useState(false);

  return (
    <div className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Deriv Signal Analyzer</h1>
              <p className="text-sm text-muted-foreground">Real-time trading signals & market analysis</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={connected ? "default" : "secondary"} className="px-3 py-1">
              <div className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
              {connected ? 'Connected' : 'Disconnected'}
            </Badge>
            <Button 
              onClick={() => setConnected(!connected)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Link2 className="w-4 h-4 mr-2" />
              {connected ? 'Disconnect' : 'Connect to Deriv'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
