# Bankruptcy System

## Overview

Stocks trading below **$10** (the bankruptcy threshold) face a chance of going bankrupt each tick. When a stock goes bankrupt, it's marked as failed and replaced with a newly generated company.

**File:** `src/stockEngine.ts` (detection), `src/gameState.ts` (handling)

## Detection

Each tick, for every non-failed stock with `currentPrice < $10`:

```
base chance = 20%
modifier = 1 + (10 - price) / 10
final chance = 20% * modifier
```

| Price | Effective Chance |
|-------|-----------------|
| $9.00 | 22% |
| $7.00 | 26% |
| $5.00 | 30% |
| $2.00 | 36% |
| $0.50 | 39% |

Lower prices increase bankruptcy probability, but it's never guaranteed on any single tick.

## When Bankruptcy Occurs

1. Stock is marked `failed: true` with `currentPrice: 0`
2. Player's held shares in that stock are **deleted** (total loss)
3. A red alert banner displays: `"{Name} ({TICKER}) has gone bankrupt! You lost {N} shares."`
4. A **2-second timer** starts before the stock is replaced

## Replacement

After the 2-second delay:

1. A new `StockDefinition` is generated via `generateReplacementStock()`:
   - Same sector as the bankrupt stock
   - Random name from sector-specific word parts
   - Random base price ($20-200)
   - Random volatility (0.3-0.8)
   - 4-letter ticker from first 2 chars of prefix + suffix
2. The new stock is initialized with fresh price history
3. Old relations are removed, new ones generated
4. 30% chance the new stock starts with a negative day trend
5. The bankruptcy alert is cleared

### Name Generation

Each sector has 10 prefixes and 8 suffixes:

| Sector | Example Prefixes | Example Suffixes |
|--------|-----------------|-----------------|
| Tech | Cyber, Quantum, Neural | Dynamics, Systems, Labs |
| Consumer | Fresh, Swift, Bold | Goods, Market, Express |
| Energy | Solar, Wind, Volt | Energy, Power, Fuels |
| Media | Buzz, Signal, Wave | Media, Studios, Press |
| Finance | Capital, Crown, Summit | Holdings, Trust, Fund |

Names can't repeat within a game session (tracked via `usedReplacementNames` set, cleared on restart).

## Edge Cases

- If the selected stock goes bankrupt, the player can't select it (grayed out)
- If it's still selected when replaced, the selection moves to the first available stock
- Bankrupt stocks during the night phase are replaced before the new day starts (no 2-second delay)
- The bankruptcy alert persists until replacement occurs

## UI Indicators

- **RISK badge**: Pulsing red badge on stocks below $10 (visible in StockList and SearchUI)
- **FAILED label**: Shown for bankrupt stocks before replacement
- **Bankruptcy alert**: Red banner at the top of the day UI
- Failed stocks are disabled (can't click, can't trade)
