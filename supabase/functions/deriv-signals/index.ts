const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const upgrade = req.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket", { status: 426, headers: corsHeaders });
  }

  const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
  
  let derivSocket: WebSocket | null = null;
  const subscribedMarkets = new Set<string>();

  const markets = [
    "R_10", "R_25", "R_50", "R_75", "R_100",
    "1HZ10V", "1HZ25V", "1HZ50V", "1HZ75V", "1HZ100V",
    "BOOM300N", "BOOM500N", "CRASH300N", "CRASH500N"
  ];

  clientSocket.onopen = () => {
    console.log("Client connected");
    
    // Connect to Deriv WebSocket API
    derivSocket = new WebSocket("wss://ws.derivws.com/websockets/v3");
    
    derivSocket.onopen = () => {
      console.log("Connected to Deriv API");
      
      const apiKey = Deno.env.get("DERIV_API_KEY");
      if (apiKey) {
        // Authorize with API key
        derivSocket?.send(JSON.stringify({
          authorize: apiKey
        }));
      }
      
      // Subscribe to all markets
      markets.forEach(symbol => {
        derivSocket?.send(JSON.stringify({
          ticks: symbol,
          subscribe: 1
        }));
        subscribedMarkets.add(symbol);
      });
    };

    derivSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received from Deriv:", data.msg_type);
        
        // Forward tick data to client
        if (data.msg_type === "tick" && data.tick) {
          clientSocket.send(JSON.stringify({
            type: "tick",
            data: data.tick
          }));
        }
        
        // Forward authorization response
        if (data.msg_type === "authorize") {
          clientSocket.send(JSON.stringify({
            type: "authorized",
            data: data
          }));
        }
      } catch (error) {
        console.error("Error processing Deriv message:", error);
      }
    };

    derivSocket.onerror = (error) => {
      console.error("Deriv WebSocket error:", error);
      clientSocket.send(JSON.stringify({
        type: "error",
        message: "Deriv connection error"
      }));
    };

    derivSocket.onclose = () => {
      console.log("Deriv connection closed");
      clientSocket.send(JSON.stringify({
        type: "disconnected"
      }));
    };
  };

  clientSocket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      
      // Handle client commands
      if (message.type === "subscribe" && message.symbol) {
        if (!subscribedMarkets.has(message.symbol)) {
          derivSocket?.send(JSON.stringify({
            ticks: message.symbol,
            subscribe: 1
          }));
          subscribedMarkets.add(message.symbol);
        }
      }
    } catch (error) {
      console.error("Error processing client message:", error);
    }
  };

  clientSocket.onclose = () => {
    console.log("Client disconnected");
    derivSocket?.close();
  };

  clientSocket.onerror = (error) => {
    console.error("Client socket error:", error);
    derivSocket?.close();
  };

  return response;
});
