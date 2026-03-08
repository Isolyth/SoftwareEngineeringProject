# UI Components

## App (`App.tsx`)

Root component. Uses `useGameState()` hook and routes to the appropriate screen component based on `state.screen`:

| Screen Value | Component |
|-------------|-----------|
| `'day'` | `DayUI` |
| `'night'` | `NightUI` |
| `'search'` | `SearchUI` |
| `'win'` | `WinLose` (won=true) |
| `'lose'` | `WinLose` (won=false) |

## DayUI (`components/DayUI.tsx`)

The main trading screen. Layout:

```
┌─────────────────────────────────────────────────┐
│ [Bankruptcy Alert - conditional]                │
├─────────────────────────────────────────────────┤
│ DAY N ████████████░░░░░░░░ 11:30 AM             │
├──────────┬────────────────────┬─────────────────┤
│          │                    │                 │
│ Stock    │   Price Chart      │  Info Panel     │
│ List     │                    │  (goal, value,  │
│          │                    │   P/L, cash)    │
│ (left    ├────────────────────┤                 │
│  sidebar)│ [SEARCH] [BUY]    │  News Feed      │
│          │ [SELL] [-][qty][+] │  (live events)  │
│          │         [MAX]      │                 │
└──────────┴────────────────────┴─────────────────┘
```

**Props:** `state`, `portfolioValue`, `todayPL`, `onSelectStock`, `onBuy`, `onSell`, `onSearch`

**Local state:** `tradeQty` (quantity for buy/sell actions)

## NightUI (`components/NightUI.tsx`)

Night phase screen showing static news articles.

```
┌─────────────────────────────────────────────────┐
│              FINANCE CORNER                     │
│              ● ● ● ○ ○ ○ ○  (day dots)         │
├────────────────────────────┬────────────────────┤
│                            │                    │
│   News Card 1              │ TODAY'S NEWS       │
│   ─────────               │ (sidebar list)     │
│   News Card 2              │                    │
│   ─────────               │ PORTFOLIO          │
│   News Card 3              │ $10,234.50         │
│                            │ Goal: $20,000      │
│                            │                    │
│                            │ [GO TO SLEEP]      │
└────────────────────────────┴────────────────────┘
```

## StockList (`components/StockList.tsx`)

Left sidebar showing all stocks grouped by sector.

Each stock button shows:
- Ticker name
- Price change % (colored green/red)
- Relation icon (if related to selected stock)
- RISK badge (if price < $10)
- Holdings count (if owned)
- FAILED label (if bankrupt)

Stocks are grouped by sector with section headers.

## StockChart (`components/StockChart.tsx`)

Recharts `LineChart` showing price history. Features:
- Time window selector: 15m, 30m, 1h, 1D
- Green line for uptrend, red for downtrend
- Price/change display in header
- Tooltip with exact price on hover
- Day-aware time formatting when spanning multiple days

## InfoPanel (`components/InfoPanel.tsx`)

Simple display panel:
- Goal amount with progress bar
- Portfolio value
- Today's P/L (green/red)
- Available cash

## NewsFeed (`components/NewsFeed.tsx`)

Live news ticker during the day phase:
- Shows up to 8 recent events
- Active effects have bright styling + duration badge
- Faded styling for expired events
- Type indicators: ▲ (positive), ▼ (negative), ◆ (neutral)

## SearchUI (`components/SearchUI.tsx`)

Full market browser with all stocks:
- Mini sparkline chart per stock
- Price, change %, sector label
- Relation tags with hover descriptions
- Quick-buy button
- Holdings display
- RISK/FAILED badges
- Portfolio summary sidebar

## BankruptcyAlert (`components/BankruptcyAlert.tsx`)

Red pulsing banner at the top of the screen when a stock goes bankrupt. Displays the bankruptcy message until the stock is replaced.

## WinLose (`components/WinLose.tsx`)

Modal overlay for game end:
- "YOU WIN!" or "GAME OVER" title
- Final portfolio value and goal
- Day reached
- "PLAY AGAIN" button to restart
