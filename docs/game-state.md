# Game State Management

**File:** `src/gameState.ts`

## The `useGameState` Hook

Central React hook that manages all game logic. Returns state and action functions.

### Returned API

```ts
{
  state: GameState,          // Full game state
  portfolioValue: number,    // Computed: cash + holdings value
  todayPL: number,           // Computed: portfolioValue - dayStartPortfolio
  selectStock(ticker),       // Select a stock for viewing/trading
  buy(ticker, qty),          // Buy shares
  sell(ticker, qty),         // Sell shares
  goToSearch(),              // Navigate to search screen
  goBackFromSearch(),        // Return to day/night screen
  sleep(),                   // Advance to next day
  restart(),                 // Start new game
}
```

### GameState Shape

```ts
{
  day: number;                    // Current day (1-7)
  maxDays: number;                // 7
  timeMinutes: number;            // 0-480 (current time in trading day)
  phase: 'day' | 'night';
  screen: 'day' | 'night' | 'search' | 'win' | 'lose';
  cash: number;                   // Available cash
  holdings: { [ticker]: qty };    // Shares owned per stock
  stocks: StockState[];           // Current price state of all stocks
  stockDefinitions: StockDefinition[];  // Mutable stock metadata
  selectedTicker: string;         // Currently viewed stock
  goal: number;                   // $20,000
  dayStartPortfolio: number;      // Portfolio value at start of day
  news: NewsArticle[];            // Night-phase static news
  liveNews: LiveNewsEvent[];      // Day-phase live events (display)
  activeEffects: LiveNewsEvent[]; // Currently active effects
  bankruptcyAlert: string | null; // Active bankruptcy message
  relations: StockRelation[];     // Inter-company relationships
}
```

### Internal Refs

The hook uses `useRef` for mutable state that doesn't trigger re-renders:

| Ref | Purpose |
|-----|---------|
| `tickRef` | `setInterval` ID for the game loop |
| `newsIdCounterRef` | Auto-incrementing news event ID |
| `trendShiftsRef` | Accumulated trend shifts per ticker (Map) |
| `ticksSinceNewsRef` | Ticks since last news generation |
| `nextNewsAtRef` | Random threshold for next news event |
| `bankruptcyTimerRef` | 2-second timeout for stock replacement |

### Game Loop (tick function)

Called every 1 second during day phase:

1. **Advance time** by `MINUTES_PER_TICK` (1.6 minutes)
2. **News generation** — If enough ticks have passed, generate a news event
3. **Decrement effects** — Reduce active effect durations, remove expired
4. **Tick all stocks** — Update prices with news influence and trend shifts
5. **Check end of day** — If time >= 480:
   - Check win condition (portfolio >= goal)
   - Check lose condition (day >= maxDays)
   - Otherwise transition to night phase
6. **Bankruptcy check** — For stocks below $10, roll for bankruptcy
7. **Schedule replacement** — If new bankruptcy, set 2-second timer

### Actions

**`buy(ticker, qty)`**
- Validates: stock exists, not failed, sufficient cash
- Deducts cost from cash, adds to holdings

**`sell(ticker, qty)`**
- Validates: stock exists, not failed, has shares
- Caps at held quantity, adds proceeds to cash

**`selectStock(ticker)`**
- Rejects failed stocks
- Updates `selectedTicker`

**`sleep()`**
- Clears bankruptcy timer and news state
- Replaces any failed stocks (with new relations)
- Re-initializes all stock states for new day (carries forward close price and history)
- Recalculates `dayStartPortfolio`
- Resets to day phase

**`restart()`**
- Clears all timers and refs
- Resets replacement name tracking
- Creates fresh state from static `STOCKS` data
- Generates new relations

## Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `STARTING_CASH` | 10,000 | Initial cash |
| `GOAL` | 20,000 | Win condition |
| `MAX_DAYS` | 7 | Maximum trading days |
