import { describe, it, expect } from 'vitest';
import {
  generateNewsEvent,
  computeNewsInfluence,
  decrementEffects,
  MAX_LIVE_NEWS,
} from '../newsEngine';
import type { StockState, StockDefinition, LiveNewsEvent, StockRelation } from '../types';

const mockDefs: StockDefinition[] = [
  { ticker: 'APLL', name: 'Appull Inc.', sector: 'Tech', basePrice: 254, volatility: 0.4 },
  { ticker: 'MXPD', name: 'MaxPod Corp.', sector: 'Tech', basePrice: 123, volatility: 0.5 },
  { ticker: 'PPOL', name: 'PetroPole Energy', sector: 'Energy', basePrice: 27, volatility: 0.6 },
];

const mockStocks: StockState[] = [
  { ticker: 'APLL', currentPrice: 260, openPrice: 254, dayTrend: 0.02, history: [] },
  { ticker: 'MXPD', currentPrice: 120, openPrice: 123, dayTrend: -0.01, history: [] },
  { ticker: 'PPOL', currentPrice: 28, openPrice: 27, dayTrend: 0.03, history: [] },
];

const mockRelations: StockRelation[] = [
  { from: 'APLL', to: 'MXPD', type: 'competitor', description: 'Appull competes with MaxPod' },
];

// --- MAX_LIVE_NEWS ---

describe('MAX_LIVE_NEWS', () => {
  it('is 8', () => {
    expect(MAX_LIVE_NEWS).toBe(8);
  });
});

// --- generateNewsEvent ---

describe('generateNewsEvent', () => {
  it('returns null when all stocks are failed', () => {
    const failedStocks = mockStocks.map((s) => ({ ...s, failed: true }));
    const result = generateNewsEvent(failedStocks, mockDefs, 0, []);
    expect(result).toBeNull();
  });

  it('returns an event and trendShifts when stocks are active', () => {
    const result = generateNewsEvent(mockStocks, mockDefs, 1, []);
    expect(result).not.toBeNull();
    expect(result!.event).toBeDefined();
    expect(result!.trendShifts).toBeInstanceOf(Map);
  });

  it('event has required fields', () => {
    const result = generateNewsEvent(mockStocks, mockDefs, 5, []);
    const event = result!.event;
    expect(event.id).toBe(5);
    expect(typeof event.headline).toBe('string');
    expect(typeof event.impact).toBe('number');
    expect(typeof event.volatility).toBe('number');
    expect(event.duration).toBeGreaterThanOrEqual(5);
    expect(event.duration).toBeLessThanOrEqual(12);
    expect(['positive', 'negative', 'neutral']).toContain(event.type);
  });

  it('event targets either a ticker or a sector, not both', () => {
    for (let i = 0; i < 50; i++) {
      const result = generateNewsEvent(mockStocks, mockDefs, i, []);
      if (!result) continue;
      const event = result.event;
      const hasTicker = event.targetTicker !== undefined;
      const hasSector = event.targetSector !== undefined;
      // Exactly one should be set
      expect(hasTicker !== hasSector).toBe(true);
    }
  });

  it('sector-wide events set trendShifts for sector members', () => {
    // Run many times to catch a sector-wide event
    for (let i = 0; i < 100; i++) {
      const result = generateNewsEvent(mockStocks, mockDefs, i, []);
      if (!result || !result.event.targetSector) continue;

      const sector = result.event.targetSector;
      // All stocks in that sector should have trend shifts
      for (const def of mockDefs) {
        if (def.sector === sector) {
          expect(result.trendShifts.has(def.ticker)).toBe(true);
        }
      }
      return; // Found one, test passes
    }
  });

  it('ticker-targeted events set trendShift for the target', () => {
    for (let i = 0; i < 100; i++) {
      const result = generateNewsEvent(mockStocks, mockDefs, i, []);
      if (!result || !result.event.targetTicker) continue;

      expect(result.trendShifts.has(result.event.targetTicker)).toBe(true);
      return;
    }
  });

  it('propagates relation effects for ticker-targeted news', () => {
    // With APLL-MXPD competitor relation, targeting APLL should sometimes affect MXPD
    let hadRelationEffect = false;
    for (let i = 0; i < 200; i++) {
      const result = generateNewsEvent(mockStocks, mockDefs, i, mockRelations);
      if (!result || result.event.targetTicker !== 'APLL') continue;
      if (result.trendShifts.has('MXPD')) {
        hadRelationEffect = true;
        break;
      }
    }
    expect(hadRelationEffect).toBe(true);
  });

  it('headline contains the ticker or sector name', () => {
    const result = generateNewsEvent(mockStocks, mockDefs, 0, []);
    if (!result) return;
    const event = result.event;
    const hasTicker = mockDefs.some((d) => event.headline.includes(d.ticker));
    const hasSector = mockDefs.some((d) => event.headline.includes(d.sector));
    expect(hasTicker || hasSector).toBe(true);
  });
});

// --- computeNewsInfluence ---

describe('computeNewsInfluence', () => {
  it('returns zero impact with no active effects', () => {
    const { newsImpact, newsVolatility } = computeNewsInfluence('APLL', 'Tech', [], []);
    expect(newsImpact).toBe(0);
    expect(newsVolatility).toBe(1);
  });

  it('applies full impact for direct ticker match', () => {
    const effects: LiveNewsEvent[] = [
      { id: 1, headline: 'test', impact: 0.5, volatility: 1.5, duration: 5, type: 'positive', targetTicker: 'APLL' },
    ];
    const { newsImpact, newsVolatility } = computeNewsInfluence('APLL', 'Tech', effects, []);
    expect(newsImpact).toBe(0.5);
    expect(newsVolatility).toBe(1.5);
  });

  it('applies half impact for sector match', () => {
    const effects: LiveNewsEvent[] = [
      { id: 1, headline: 'test', impact: 0.6, volatility: 1.4, duration: 5, type: 'positive', targetSector: 'Tech' },
    ];
    const { newsImpact } = computeNewsInfluence('APLL', 'Tech', effects, []);
    expect(newsImpact).toBeCloseTo(0.3); // 0.6 * 0.5
  });

  it('does not apply sector effect to different sector', () => {
    const effects: LiveNewsEvent[] = [
      { id: 1, headline: 'test', impact: 0.6, volatility: 1.4, duration: 5, type: 'positive', targetSector: 'Energy' },
    ];
    const { newsImpact, newsVolatility } = computeNewsInfluence('APLL', 'Tech', effects, []);
    expect(newsImpact).toBe(0);
    expect(newsVolatility).toBe(1);
  });

  it('accumulates multiple effects', () => {
    const effects: LiveNewsEvent[] = [
      { id: 1, headline: 'a', impact: 0.3, volatility: 1.2, duration: 5, type: 'positive', targetTicker: 'APLL' },
      { id: 2, headline: 'b', impact: -0.4, volatility: 1.3, duration: 3, type: 'negative', targetTicker: 'APLL' },
    ];
    const { newsImpact, newsVolatility } = computeNewsInfluence('APLL', 'Tech', effects, []);
    expect(newsImpact).toBeCloseTo(-0.1); // 0.3 + (-0.4)
    expect(newsVolatility).toBeCloseTo(1.2 * 1.3);
  });

  it('applies relation effects stochastically', () => {
    const effects: LiveNewsEvent[] = [
      { id: 1, headline: 'test', impact: 1.0, volatility: 1.5, duration: 5, type: 'positive', targetTicker: 'APLL' },
    ];
    // MXPD is competitor of APLL — should sometimes get inverted impact
    let hadEffect = false;
    for (let i = 0; i < 200; i++) {
      const { newsImpact } = computeNewsInfluence('MXPD', 'Tech', effects, mockRelations);
      if (newsImpact !== 0) {
        hadEffect = true;
        // Competitor inverts: positive news on APLL → negative impact on MXPD
        expect(newsImpact).toBeLessThan(0);
        break;
      }
    }
    expect(hadEffect).toBe(true);
  });
});

// --- decrementEffects ---

describe('decrementEffects', () => {
  it('decrements duration by 1', () => {
    const effects: LiveNewsEvent[] = [
      { id: 1, headline: 'test', impact: 0.5, volatility: 1.2, duration: 5, type: 'positive', targetTicker: 'APLL' },
    ];
    const result = decrementEffects(effects);
    expect(result[0].duration).toBe(4);
  });

  it('removes effects with duration reaching 0', () => {
    const effects: LiveNewsEvent[] = [
      { id: 1, headline: 'a', impact: 0.5, volatility: 1.2, duration: 1, type: 'positive', targetTicker: 'APLL' },
      { id: 2, headline: 'b', impact: -0.3, volatility: 1.1, duration: 3, type: 'negative', targetTicker: 'MXPD' },
    ];
    const result = decrementEffects(effects);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(2);
    expect(result[0].duration).toBe(2);
  });

  it('returns empty array when all effects expire', () => {
    const effects: LiveNewsEvent[] = [
      { id: 1, headline: 'test', impact: 0.5, volatility: 1.2, duration: 1, type: 'positive', targetTicker: 'APLL' },
    ];
    const result = decrementEffects(effects);
    expect(result.length).toBe(0);
  });

  it('does not mutate the original array', () => {
    const effects: LiveNewsEvent[] = [
      { id: 1, headline: 'test', impact: 0.5, volatility: 1.2, duration: 5, type: 'positive', targetTicker: 'APLL' },
    ];
    const result = decrementEffects(effects);
    expect(effects[0].duration).toBe(5); // Original unchanged
    expect(result[0].duration).toBe(4);
  });
});
