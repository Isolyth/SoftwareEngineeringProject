import type { StockState, StockDefinition, LiveNewsEvent, NewsEventType } from './types';

export const MAX_LIVE_NEWS = 8;

interface NewsTemplate {
  headline: string;
  impact: number;
  volatility: number;
  trendShift: number;
  sectorWide?: boolean;
}

const NEWS_TEMPLATES: Record<NewsEventType, NewsTemplate[]> = {
  positive: [
    { headline: '{stock} beats earnings expectations!', impact: 0.6, volatility: 1.5, trendShift: 0.15 },
    { headline: '{stock} announces breakthrough product', impact: 0.7, volatility: 1.6, trendShift: 0.2 },
    { headline: '{stock} secures major partnership', impact: 0.5, volatility: 1.3, trendShift: 0.1 },
    { headline: "Analysts upgrade {stock} to 'Strong Buy'", impact: 0.6, volatility: 1.4, trendShift: 0.15 },
    { headline: '{stock} reports record revenue', impact: 0.7, volatility: 1.5, trendShift: 0.2 },
    { headline: '{sector} sector rallies on positive outlook', impact: 0.4, volatility: 1.3, sectorWide: true, trendShift: 0.08 },
    { headline: 'Government announces {sector} subsidies', impact: 0.5, volatility: 1.4, sectorWide: true, trendShift: 0.1 },
    { headline: '{sector} stocks surge on regulatory news', impact: 0.4, volatility: 1.5, sectorWide: true, trendShift: 0.08 },
  ],
  negative: [
    { headline: '{stock} misses earnings forecast', impact: -0.6, volatility: 1.5, trendShift: -0.15 },
    { headline: '{stock} faces product recall', impact: -0.7, volatility: 1.8, trendShift: -0.2 },
    { headline: '{stock} CEO resigns unexpectedly', impact: -0.5, volatility: 1.6, trendShift: -0.15 },
    { headline: 'SEC investigates {stock}', impact: -0.8, volatility: 2.0, trendShift: -0.25 },
    { headline: '{stock} loses major client', impact: -0.5, volatility: 1.4, trendShift: -0.12 },
    { headline: '{sector} sector tumbles on weak demand', impact: -0.4, volatility: 1.4, sectorWide: true, trendShift: -0.1 },
    { headline: 'New regulations threaten {sector} profits', impact: -0.5, volatility: 1.5, sectorWide: true, trendShift: -0.12 },
    { headline: '{sector} stocks dive on global concerns', impact: -0.4, volatility: 1.6, sectorWide: true, trendShift: -0.1 },
  ],
  neutral: [
    { headline: '{stock} announces stock split', impact: 0.1, volatility: 1.3, trendShift: 0.05 },
    { headline: '{stock} appoints new board member', impact: 0.05, volatility: 1.1, trendShift: 0 },
    { headline: 'Mixed signals for {sector} sector', impact: 0, volatility: 1.4, sectorWide: true, trendShift: 0 },
    { headline: 'Market awaits {sector} earnings reports', impact: 0, volatility: 1.5, sectorWide: true, trendShift: 0 },
  ],
};

export function generateNewsEvent(
  stocks: StockState[],
  defs: StockDefinition[],
  newsId: number
): { event: LiveNewsEvent; trendShifts: Map<string, number> } | null {
  const activeStocks = stocks.filter((s) => !s.failed);
  if (activeStocks.length === 0) return null;

  // Type distribution: 35% positive, 40% negative, 25% neutral
  const rand = Math.random();
  let type: NewsEventType;
  if (rand < 0.35) type = 'positive';
  else if (rand < 0.75) type = 'negative';
  else type = 'neutral';

  const templates = NEWS_TEMPLATES[type];
  const template = templates[Math.floor(Math.random() * templates.length)];

  const targetStock = activeStocks[Math.floor(Math.random() * activeStocks.length)];
  const targetDef = defs.find((d) => d.ticker === targetStock.ticker);
  if (!targetDef) return null;

  const isSectorWide = template.sectorWide === true;
  const headline = template.headline
    .replace('{stock}', targetStock.ticker)
    .replace('{sector}', targetDef.sector);

  const event: LiveNewsEvent = {
    id: newsId,
    headline,
    impact: template.impact,
    volatility: template.volatility,
    duration: Math.floor(Math.random() * 8) + 5, // 5-12 ticks
    type,
    targetSector: isSectorWide ? targetDef.sector : undefined,
    targetTicker: isSectorWide ? undefined : targetStock.ticker,
  };

  // Compute trend shifts
  const trendShifts = new Map<string, number>();
  if (isSectorWide) {
    for (const s of activeStocks) {
      const sDef = defs.find((d) => d.ticker === s.ticker);
      if (sDef && sDef.sector === targetDef.sector) {
        trendShifts.set(s.ticker, template.trendShift * 0.6);
      }
    }
  } else {
    trendShifts.set(targetStock.ticker, template.trendShift);
  }

  return { event, trendShifts };
}

export function computeNewsInfluence(
  ticker: string,
  sector: string,
  activeEffects: LiveNewsEvent[]
): { newsImpact: number; newsVolatility: number } {
  let newsImpact = 0;
  let newsVolatility = 1;

  for (const effect of activeEffects) {
    if (effect.targetTicker === ticker) {
      newsImpact += effect.impact;
      newsVolatility *= effect.volatility;
    } else if (effect.targetSector === sector) {
      newsImpact += effect.impact * 0.5;
      newsVolatility *= (effect.volatility - 1) * 0.4 + 1;
    }
  }

  return { newsImpact, newsVolatility };
}

export function decrementEffects(effects: LiveNewsEvent[]): LiveNewsEvent[] {
  return effects
    .map((e) => ({ ...e, duration: e.duration - 1 }))
    .filter((e) => e.duration > 0);
}
