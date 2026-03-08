# Game Mechanics

## Overview

A stock trading simulation game where the player starts with **$10,000** and must reach **$20,000** within **7 trading days**. Each trading day lasts **5 real-time minutes** (300 seconds).

## Time System

| Concept | Value |
|---------|-------|
| Game day duration | 480 game-minutes (9:00 AM - 5:00 PM) |
| Real time per day | 300 seconds (5 minutes) |
| Tick interval | 1 second |
| Game-minutes per tick | 1.6 (480 / 300) |
| Total ticks per day | 300 |

### Absolute Time

Time is tracked as a single number: `(day - 1) * 480 + minuteInDay`. This allows continuous charting across days.

## Day/Night Cycle

### Day Phase
- Stock prices tick every second
- News events generate periodically (every 4-12 ticks)
- Player can buy, sell, search stocks
- Bankruptcy can occur for stocks below $10

### Night Phase
- Market is closed, no price changes
- Static news articles displayed (from `newsData.ts`)
- Player clicks "GO TO SLEEP" to advance to next day
- Failed stocks are replaced before the new day starts

## Stock Price Simulation

Each tick, stock prices update using this formula:

```
newPrice = price + trendPull + noise + reversion + newsBias
```

### Components

1. **Trend Pull** — Pulls price toward the day's target:
   ```
   targetPrice = openPrice * (1 + dayTrend + trendShift)
   trendPull = (targetPrice - price) * 0.002 * (0.5 + progress)
   ```
   Strengthens as the day progresses.

2. **Noise** — Random per-tick jitter:
   ```
   noise = (random - 0.5) * price * volatility * newsVolatility * 0.008
   ```

3. **Mean Reversion** — Pulls back toward open price:
   ```
   deviation = (price - openPrice) / openPrice
   reversion = -deviation * price * 0.001
   ```

4. **News Bias** — Impact from active news events:
   ```
   newsBias = newsImpact * price * 0.003
   ```

The minimum price is **$0.50** (hard floor).

## Trading

- **Buy**: Costs `price * quantity`, deducted from cash
- **Sell**: Earns `price * quantity`, added to cash
- No transaction fees
- Cannot trade failed/bankrupt stocks
- Instant execution at current market price

## Portfolio Valuation

```
portfolioValue = cash + sum(holdings[ticker] * currentPrice[ticker])
```

Today's P/L = current portfolio value - portfolio value at day start.

## Stocks

15 stocks across 5 sectors (3 per sector):

| Sector | Tickers | Volatility Range |
|--------|---------|-----------------|
| Tech | APLL, MXPD, NETZ | 0.4 - 0.55 |
| Media | JKKP, JOKX, STRM | 0.55 - 0.8 |
| Energy | PPOL, GRNE, VOLT | 0.5 - 0.65 |
| Finance | TRSI, BNKR, CPTL | 0.3 - 0.4 |
| Consumer | FODR, FSHG, SWFT | 0.4 - 0.55 |

Higher volatility = larger price swings.

## Win/Lose Conditions

- **Win**: Portfolio reaches $20,000 at any end-of-day
- **Lose**: Day 7 ends without reaching the goal
- After win/lose, player can restart with fresh game state
