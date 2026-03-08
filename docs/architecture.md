# Architecture Overview

## Tech Stack

- **React 19** — UI framework
- **TypeScript** — Type safety
- **Vite 7** — Build tool and dev server
- **Recharts** — Stock chart rendering
- **Vitest** — Unit testing

## Project Structure

```
src/
├── App.tsx                    # Root component, screen router
├── App.css                    # All styles (single stylesheet)
├── main.tsx                   # Entry point (renders App)
├── types.ts                   # All TypeScript interfaces/types
├── gameState.ts               # Central game hook (useGameState)
├── stockEngine.ts             # Stock price simulation math
├── stockData.ts               # Initial stock definitions (15 stocks)
├── newsEngine.ts              # Real-time news generation & effects
├── newsData.ts                # Night-phase news articles (per day)
├── relationEngine.ts          # Inter-company relationship logic
├── relationData.ts            # Relation description templates
├── __tests__/                 # Unit tests (vitest)
│   ├── stockEngine.test.ts
│   ├── newsEngine.test.ts
│   ├── relationEngine.test.ts
│   ├── relationData.test.ts
│   ├── stockData.test.ts
│   └── newsData.test.ts
└── components/
    ├── DayUI.tsx              # Daytime trading screen
    ├── NightUI.tsx            # Night phase (news + sleep)
    ├── SearchUI.tsx           # Full stock market browser
    ├── StockList.tsx          # Left sidebar stock list
    ├── StockChart.tsx         # Price chart (Recharts)
    ├── InfoPanel.tsx          # Portfolio summary panel
    ├── NewsFeed.tsx           # Live news ticker
    ├── BankruptcyAlert.tsx    # Bankruptcy notification banner
    ├── WinLose.tsx            # Game end screen
    └── TradeModal.tsx         # (Unused legacy component)
```

## Data Flow

```
App.tsx
  └─ useGameState() hook
       ├─ state: GameState           (all game data)
       ├─ portfolioValue: number     (computed)
       ├─ todayPL: number            (computed)
       ├─ selectStock(ticker)
       ├─ buy(ticker, qty)
       ├─ sell(ticker, qty)
       ├─ goToSearch() / goBackFromSearch()
       ├─ sleep()                    (advance to next day)
       └─ restart()                  (new game)
```

The `useGameState` hook is the single source of truth. It manages:
- A `setInterval` game loop (1-second ticks during day phase)
- Stock price updates via `stockEngine.tickStock()`
- News generation via `newsEngine.generateNewsEvent()`
- Bankruptcy detection and replacement
- Relation effects propagation

## Screen Flow

```
         ┌──────────┐
    ┌────│  Day UI   │────┐
    │    └──────────┘    │
    │         │          │
    │    [market close]  │
    │         ▼          │
    │    ┌──────────┐    │
    │    │ Night UI  │    │
    │    └──────────┘    │
    │         │          │
    │    [sleep]         │
    │         │          │
    │    ┌────▼─────┐    │
    │    │ next day  │────┘
    │    └──────────┘
    │
    │    ┌──────────┐
    ├───▶│ Search   │───┐
    │    └──────────┘   │
    │                   │
    │    [back]         │
    └───────────────────┘

    Win condition: portfolio >= $20,000 → Win screen
    Lose condition: day 7 ends without goal → Lose screen
```
