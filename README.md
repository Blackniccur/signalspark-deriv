# SignalSpark — Deriv Analysis Tool

A standalone React signal analysis tool that connects directly to the Deriv API (App ID 70785) and generates trading signals for synthetic indices.

## Features

- Live WebSocket connection to Deriv API
- 10 synthetic indices (Volatility 10/25/50/75/100 + 1s variants)
- Indicators: Bollinger Bands, MACD, RSI, StochRSI, Williams %R
- Signal types: Rise/Fall, Even/Odd, Over/Under, Matches/Differs
- Real-time digit pattern tracker
- Price chart (Recharts)
- Audio alerts for strong signals

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000 and click **GENERATE SIGNALS**.

## Tech Stack

- React 18 + TypeScript
- Vite
- Recharts (charts)
- Lucide React (icons)
- SCSS (styling)
- Deriv API via WebSocket (App ID 70785)
