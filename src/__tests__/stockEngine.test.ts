import { describe, it, expect, beforeEach } from 'vitest';
import {
  MARKET_OPEN,
  MARKET_CLOSE,
  REAL_DAY_SECONDS,
  TICK_INTERVAL_MS,
  MINUTES_PER_TICK,
  toAbsoluteTime,
  formatGameTime,
  formatGameTimeWithDay,
  generateDayTrend,
  generatePrefillHistory,
  initStockState,
  tickStock,
  checkBankruptcy,
  generateReplacementStock,
  resetReplacementNames,
  BANKRUPTCY_THRESHOLD,
} from '../stockEngine';
import type { StockDefinition, StockState } from '../types';

// --- Constants ---

describe('stockEngine constants', () => {
  it('MARKET_OPEN is 0 (9:00 AM)', () => {
    expect(MARKET_OPEN).toBe(0);
  });

  it('MARKET_CLOSE is 480 (5:00 PM = 8 hours = 480 minutes)', () => {
    expect(MARKET_CLOSE).toBe(480);
  });

  it('REAL_DAY_SECONDS is 300 (5 minutes real time per trading day)', () => {
    expect(REAL_DAY_SECONDS).toBe(300);
  });

  it('TICK_INTERVAL_MS is 1000 (1 second per tick)', () => {
    expect(TICK_INTERVAL_MS).toBe(1000);
  });

  it('MINUTES_PER_TICK is 1.6 (480 game-minutes / 300 ticks)', () => {
    expect(MINUTES_PER_TICK).toBe(480 / 300);
    expect(MINUTES_PER_TICK).toBe(1.6);
  });

  it('BANKRUPTCY_THRESHOLD is 10', () => {
    expect(BANKRUPTCY_THRESHOLD).toBe(10);
  });
});

// --- toAbsoluteTime ---

describe('toAbsoluteTime', () => {
  it('day 1, minute 0 → 0', () => {
    expect(toAbsoluteTime(1, 0)).toBe(0);
  });

  it('day 1, minute 240 → 240', () => {
    expect(toAbsoluteTime(1, 240)).toBe(240);
  });

  it('day 2, minute 0 → 480', () => {
    expect(toAbsoluteTime(2, 0)).toBe(480);
  });

  it('day 3, minute 100 → 1060', () => {
    expect(toAbsoluteTime(3, 100)).toBe(2 * 480 + 100);
  });
});

// --- formatGameTime ---

describe('formatGameTime', () => {
  it('formats minute 0 as 9:00 AM', () => {
    expect(formatGameTime(0)).toBe('9:00 AM');
  });

  it('formats minute 180 as 12:00 PM', () => {
    expect(formatGameTime(180)).toBe('12:00 PM');
  });

  it('formats minute 240 as 1:00 PM', () => {
    expect(formatGameTime(240)).toBe('1:00 PM');
  });

  it('formats minute 480 (end of day) wraps to 9:00 AM', () => {
    // 480 % 480 = 0 → 9:00 AM
    expect(formatGameTime(480)).toBe('9:00 AM');
  });

  it('formats minute 60 as 10:00 AM', () => {
    expect(formatGameTime(60)).toBe('10:00 AM');
  });

  it('formats minute 90 as 10:30 AM', () => {
    expect(formatGameTime(90)).toBe('10:30 AM');
  });

  it('handles absolute times from day 2', () => {
    // absTime 480 + 60 = 540 → minute 60 → 10:00 AM
    expect(formatGameTime(540)).toBe('10:00 AM');
  });
});

// --- formatGameTimeWithDay ---

describe('formatGameTimeWithDay', () => {
  it('formats day 1 correctly', () => {
    expect(formatGameTimeWithDay(0)).toBe('D1 9:00 AM');
  });

  it('formats day 2 correctly', () => {
    expect(formatGameTimeWithDay(480 + 60)).toBe('D2 10:00 AM');
  });

  it('formats day 3 correctly', () => {
    expect(formatGameTimeWithDay(2 * 480 + 180)).toBe('D3 12:00 PM');
  });
});

// --- generateDayTrend ---

describe('generateDayTrend', () => {
  it('returns a number', () => {
    expect(typeof generateDayTrend(0.5)).toBe('number');
  });

  it('trend magnitude scales with volatility', () => {
    // With high volatility, range is wider. Run many samples.
    const lowVolSamples = Array.from({ length: 1000 }, () => Math.abs(generateDayTrend(0.1)));
    const highVolSamples = Array.from({ length: 1000 }, () => Math.abs(generateDayTrend(1.0)));

    const avgLow = lowVolSamples.reduce((a, b) => a + b) / lowVolSamples.length;
    const avgHigh = highVolSamples.reduce((a, b) => a + b) / highVolSamples.length;

    // Higher volatility should produce larger average absolute trend
    expect(avgHigh).toBeGreaterThan(avgLow);
  });
});

// --- generatePrefillHistory ---

describe('generatePrefillHistory', () => {
  const def: StockDefinition = {
    ticker: 'TEST',
    name: 'Test Corp',
    sector: 'Tech',
    basePrice: 100,
    volatility: 0.5,
  };

  it('returns an array of price points', () => {
    const history = generatePrefillHistory(def);
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
  });

  it('all prices are positive', () => {
    const history = generatePrefillHistory(def);
    for (const p of history) {
      expect(p.price).toBeGreaterThan(0);
    }
  });

  it('times start at negative (fake day before day 1)', () => {
    const history = generatePrefillHistory(def);
    expect(history[0].time).toBeLessThan(0);
  });

  it('times end near 0 (end of fake day)', () => {
    const history = generatePrefillHistory(def);
    // Loop uses MINUTES_PER_TICK (1.6) steps, so last time is within one step of 0
    const lastTime = history[history.length - 1].time;
    expect(lastTime).toBeGreaterThan(-MINUTES_PER_TICK * 2);
    expect(lastTime).toBeLessThanOrEqual(0);
  });

  it('prices stay roughly near basePrice', () => {
    const history = generatePrefillHistory(def);
    for (const p of history) {
      // Should be within 50% of base price in a single day
      expect(p.price).toBeGreaterThan(def.basePrice * 0.5);
      expect(p.price).toBeLessThan(def.basePrice * 1.5);
    }
  });
});

// --- initStockState ---

describe('initStockState', () => {
  const def: StockDefinition = {
    ticker: 'APLL',
    name: 'Appull Inc.',
    sector: 'Tech',
    basePrice: 254,
    volatility: 0.4,
  };

  it('creates a stock state with correct ticker', () => {
    const state = initStockState(def, 1);
    expect(state.ticker).toBe('APLL');
  });

  it('sets openPrice to basePrice when no previousClose', () => {
    const state = initStockState(def, 1);
    expect(state.openPrice).toBe(254);
    expect(state.currentPrice).toBe(254);
  });

  it('uses previousClose when provided', () => {
    const state = initStockState(def, 2, 260);
    expect(state.openPrice).toBe(260);
    expect(state.currentPrice).toBe(260);
  });

  it('generates prefill history when no previousHistory', () => {
    const state = initStockState(def, 1);
    expect(state.history.length).toBeGreaterThan(1);
    // Last point should be the open price at day start
    const lastPoint = state.history[state.history.length - 1];
    expect(lastPoint.price).toBe(254);
    expect(lastPoint.time).toBe(0); // toAbsoluteTime(1, 0)
  });

  it('carries previous history forward', () => {
    const prevHistory = [
      { time: -100, price: 200 },
      { time: -50, price: 210 },
    ];
    const state = initStockState(def, 2, 260, prevHistory);
    // Should include previous history + new open point
    expect(state.history.length).toBe(3);
    expect(state.history[0].time).toBe(-100);
    expect(state.history[2].price).toBe(260);
  });

  it('has a dayTrend number', () => {
    const state = initStockState(def, 1);
    expect(typeof state.dayTrend).toBe('number');
  });
});

// --- tickStock ---

describe('tickStock', () => {
  const def: StockDefinition = {
    ticker: 'TEST',
    name: 'Test Corp',
    sector: 'Tech',
    basePrice: 100,
    volatility: 0.5,
  };

  let stock: StockState;

  beforeEach(() => {
    stock = {
      ticker: 'TEST',
      currentPrice: 100,
      openPrice: 100,
      dayTrend: 0.05,
      history: [{ time: 0, price: 100 }],
    };
  });

  it('returns a new stock state with updated price', () => {
    const result = tickStock(stock, def, 10, 1);
    expect(result.currentPrice).not.toBe(stock.currentPrice);
    expect(result.history.length).toBe(2);
  });

  it('appends a new history point with correct time', () => {
    const result = tickStock(stock, def, 10, 1);
    const lastPoint = result.history[result.history.length - 1];
    expect(lastPoint.time).toBe(toAbsoluteTime(1, 10));
    expect(lastPoint.price).toBe(result.currentPrice);
  });

  it('price stays positive (minimum 0.5)', () => {
    const cheapStock: StockState = {
      ...stock,
      currentPrice: 1,
      openPrice: 1,
    };
    // Tick many times
    let s = cheapStock;
    for (let i = 0; i < 100; i++) {
      s = tickStock(s, def, i * MINUTES_PER_TICK, 1);
    }
    expect(s.currentPrice).toBeGreaterThanOrEqual(0.5);
  });

  it('skips failed stocks', () => {
    const failedStock: StockState = { ...stock, failed: true };
    const result = tickStock(failedStock, def, 10, 1);
    expect(result).toBe(failedStock); // Same reference — unchanged
  });

  it('applies newsImpact', () => {
    // Positive news should push price up on average
    const results: number[] = [];
    for (let i = 0; i < 200; i++) {
      const r = tickStock(stock, def, 100, 1, 5, 1, 0);
      results.push(r.currentPrice);
    }
    const avg = results.reduce((a, b) => a + b) / results.length;
    expect(avg).toBeGreaterThan(100); // Positive bias
  });

  it('applies trendShift to dayTrend', () => {
    const result = tickStock(stock, def, 10, 1, 0, 1, 0.1);
    expect(result.dayTrend).toBe(0.05 + 0.1);
  });

  it('applies newsVolatility multiplier', () => {
    // High volatility = more deviation from original price
    const highVolResults: number[] = [];
    const normalResults: number[] = [];
    for (let i = 0; i < 500; i++) {
      highVolResults.push(tickStock(stock, def, 100, 1, 0, 5, 0).currentPrice);
      normalResults.push(tickStock(stock, def, 100, 1, 0, 1, 0).currentPrice);
    }
    const highVolVariance = highVolResults.map((p) => (p - 100) ** 2).reduce((a, b) => a + b) / highVolResults.length;
    const normalVariance = normalResults.map((p) => (p - 100) ** 2).reduce((a, b) => a + b) / normalResults.length;
    expect(highVolVariance).toBeGreaterThan(normalVariance);
  });
});

// --- checkBankruptcy ---

describe('checkBankruptcy', () => {
  it('never triggers above threshold', () => {
    for (let i = 0; i < 1000; i++) {
      expect(checkBankruptcy(BANKRUPTCY_THRESHOLD)).toBe(false);
      expect(checkBankruptcy(50)).toBe(false);
      expect(checkBankruptcy(200)).toBe(false);
    }
  });

  it('can trigger below threshold', () => {
    // With price very close to 0, probability is very high
    let triggered = false;
    for (let i = 0; i < 100; i++) {
      if (checkBankruptcy(0.5)) {
        triggered = true;
        break;
      }
    }
    expect(triggered).toBe(true);
  });

  it('higher price below threshold has lower trigger rate', () => {
    let highCount = 0;
    let lowCount = 0;
    const trials = 5000;

    for (let i = 0; i < trials; i++) {
      if (checkBankruptcy(9)) highCount++;
      if (checkBankruptcy(1)) lowCount++;
    }

    // Price 1 should trigger more often than price 9
    expect(lowCount).toBeGreaterThan(highCount);
  });
});

// --- generateReplacementStock ---

describe('generateReplacementStock', () => {
  beforeEach(() => {
    resetReplacementNames();
  });

  it('generates a stock in the specified sector', () => {
    const { definition } = generateReplacementStock('Tech', 3, ['APLL']);
    expect(definition.sector).toBe('Tech');
  });

  it('generates a valid ticker (4 uppercase letters)', () => {
    const { definition } = generateReplacementStock('Energy', 1, []);
    expect(definition.ticker).toMatch(/^[A-Z]{4}$/);
  });

  it('avoids existing tickers', () => {
    const existing = ['CYDY', 'QULA', 'NELA'];
    const { definition } = generateReplacementStock('Tech', 1, existing);
    expect(existing).not.toContain(definition.ticker);
  });

  it('generates a basePrice between 20 and 200', () => {
    for (let i = 0; i < 50; i++) {
      const { definition } = generateReplacementStock('Finance', 1, []);
      expect(definition.basePrice).toBeGreaterThanOrEqual(20);
      expect(definition.basePrice).toBeLessThanOrEqual(200);
      resetReplacementNames();
    }
  });

  it('generates volatility between 0.3 and 0.8', () => {
    for (let i = 0; i < 50; i++) {
      const { definition } = generateReplacementStock('Consumer', 1, []);
      expect(definition.volatility).toBeGreaterThanOrEqual(0.3);
      expect(definition.volatility).toBeLessThan(0.8);
      resetReplacementNames();
    }
  });

  it('state has correct ticker matching definition', () => {
    const { definition, state } = generateReplacementStock('Media', 2, []);
    expect(state.ticker).toBe(definition.ticker);
  });

  it('falls back to Tech for unknown sector', () => {
    const { definition } = generateReplacementStock('Alien', 1, []);
    // Should still generate a valid stock (uses Tech parts)
    expect(definition.ticker).toMatch(/^[A-Z]{4}$/);
  });
});

// --- resetReplacementNames ---

describe('resetReplacementNames', () => {
  it('allows previously used names to be reused', () => {
    const { definition: first } = generateReplacementStock('Tech', 1, []);
    resetReplacementNames();
    // After reset, the same name could potentially be generated again
    // We just verify it doesn't throw
    const { definition: second } = generateReplacementStock('Tech', 1, []);
    expect(second.ticker).toMatch(/^[A-Z]{4}$/);
  });
});
