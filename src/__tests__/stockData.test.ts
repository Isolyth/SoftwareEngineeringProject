import { describe, it, expect } from 'vitest';
import { STOCKS } from '../stockData';

describe('STOCKS data', () => {
  it('has 15 stocks', () => {
    expect(STOCKS.length).toBe(15);
  });

  it('all tickers are unique', () => {
    const tickers = STOCKS.map((s) => s.ticker);
    expect(new Set(tickers).size).toBe(tickers.length);
  });

  it('has 5 sectors', () => {
    const sectors = new Set(STOCKS.map((s) => s.sector));
    expect(sectors.size).toBe(5);
  });

  it('each sector has at least 3 stocks', () => {
    const sectorCounts = new Map<string, number>();
    for (const stock of STOCKS) {
      sectorCounts.set(stock.sector, (sectorCounts.get(stock.sector) || 0) + 1);
    }
    for (const [sector, count] of sectorCounts) {
      expect(count).toBeGreaterThanOrEqual(3);
    }
  });

  it('sectors are Tech, Media, Energy, Finance, Consumer', () => {
    const sectors = new Set(STOCKS.map((s) => s.sector));
    expect(sectors.has('Tech')).toBe(true);
    expect(sectors.has('Media')).toBe(true);
    expect(sectors.has('Energy')).toBe(true);
    expect(sectors.has('Finance')).toBe(true);
    expect(sectors.has('Consumer')).toBe(true);
  });

  it('all base prices are positive', () => {
    for (const stock of STOCKS) {
      expect(stock.basePrice).toBeGreaterThan(0);
    }
  });

  it('all volatilities are between 0 and 1', () => {
    for (const stock of STOCKS) {
      expect(stock.volatility).toBeGreaterThan(0);
      expect(stock.volatility).toBeLessThanOrEqual(1);
    }
  });

  it('all tickers are 4 uppercase letters', () => {
    for (const stock of STOCKS) {
      expect(stock.ticker).toMatch(/^[A-Z]{4}$/);
    }
  });

  it('all names are non-empty strings', () => {
    for (const stock of STOCKS) {
      expect(stock.name.length).toBeGreaterThan(0);
    }
  });
});
