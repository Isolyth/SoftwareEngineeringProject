# News System

The game has two independent news systems that work together.

## 1. Real-Time News (Day Phase)

**File:** `src/newsEngine.ts`

During the trading day, news events are generated dynamically and affect stock prices in real time.

### Generation Timing

News fires every **4-12 ticks** (randomized). After each event, a new random interval is chosen.

### Event Types

| Type | Probability | Impact Range | Trend Shift |
|------|------------|--------------|-------------|
| Positive | 35% | +0.4 to +0.7 | +0.05 to +0.20 |
| Negative | 40% | -0.4 to -0.8 | -0.10 to -0.25 |
| Neutral | 25% | -0.1 to +0.1 | -0.05 to +0.05 |

Negative news is slightly more likely than positive, creating market pressure.

### Scope

Each event is either:
- **Ticker-targeted**: Affects a single stock directly. Relation effects propagate from here.
- **Sector-wide**: Affects all stocks in a sector at 60% strength. No relation propagation.

### Templates

20 templates total (8 positive, 8 negative, 4 neutral). Headlines use `{stock}` and `{sector}` placeholders that get filled with actual ticker/sector names.

Examples:
- `"{stock} beats earnings expectations!"` (positive)
- `"SEC investigates {stock}"` (negative, highest impact)
- `"{sector} sector rallies on positive outlook"` (sector-wide)

### Effect Duration

Each event lasts **5-12 ticks** (randomized). While active:
- **Impact** adds per-tick bias to the stock's price movement
- **Volatility** multiplies the stock's noise component
- **Trend Shift** permanently adjusts the stock's day trend (applied once on generation)

### Effect Stacking

Multiple active effects accumulate:
- Impacts are summed
- Volatilities are multiplied
- This means two high-volatility events create extreme swings

### Live News Feed

The UI shows the 8 most recent news items. Active effects display a badge showing the target and remaining duration (e.g., `APLL · 5t`).

## 2. Static Night News

**File:** `src/newsData.ts`

Pre-written news articles displayed during the night phase. These are informational only and don't directly affect prices — they give the player hints about which stocks might move the next day.

Each day has 3 articles with:
- **Headline**: Short title
- **Blurb**: Detailed description
- **Tags**: Related stock tickers (shown as badges)

7 days of content are pre-written. Days beyond 7 reuse day 7's articles.

## How News Affects Prices

### Direct Effect (ticker match)
```
newsImpact += effect.impact       (full strength)
newsVolatility *= effect.volatility
```

### Sector Effect (sector match)
```
newsImpact += effect.impact * 0.5       (half strength)
newsVolatility *= (effect.volatility - 1) * 0.4 + 1
```

### Relation Effect (via company relations)
Only applies to ticker-targeted news. Per-tick stochastic check:
- Competitor: 50% chance, 20-35% of impact, **inverted direction**
- Supplier: 60% chance, 25-40% of impact, same direction
- Partner: 45% chance, 15-30% of impact, same direction

See [relations.md](./relations.md) for details.
