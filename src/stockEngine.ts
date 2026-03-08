import type { StockDefinition, StockState, PricePoint } from './types';

// Trading day: 9am-5pm = 480 minutes of game time
// Real time: 5 minutes = 300 seconds
// Tick interval: every 1 second real time
// Minutes per tick: 480 / 300 = 1.6 game-minutes per second
export const MARKET_OPEN = 0;    // 9:00 AM in minutes offset
export const MARKET_CLOSE = 480; // 5:00 PM in minutes offset
export const REAL_DAY_SECONDS = 300; // 5 minutes
export const TICK_INTERVAL_MS = 1000; // 1 second
export const MINUTES_PER_TICK = MARKET_CLOSE / REAL_DAY_SECONDS; // 1.6

// Absolute time: (day - 1) * 480 + minuteInDay
export function toAbsoluteTime(day: number, minuteInDay: number): number {
  return (day - 1) * MARKET_CLOSE + minuteInDay;
}

export function formatGameTime(absTime: number): string {
  const minuteInDay = ((absTime % MARKET_CLOSE) + MARKET_CLOSE) % MARKET_CLOSE;
  const totalMinutes = Math.floor(minuteInDay) + 9 * 60; // offset from 9:00 AM
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${mins.toString().padStart(2, '0')} ${period}`;
}

export function formatGameTimeWithDay(absTime: number): string {
  const day = Math.floor(absTime / MARKET_CLOSE) + 1;
  const clock = formatGameTime(absTime);
  return `D${day} ${clock}`;
}

export function generateDayTrend(volatility: number): number {
  return (Math.random() - 0.5) * 0.08 * (0.5 + volatility);
}

// Generate fake pre-game history for day 1 (1 fake day of data)
export function generatePrefillHistory(def: StockDefinition): PricePoint[] {
  const points: PricePoint[] = [];
  const fakeDayStart = -MARKET_CLOSE; // day "0"
  let price = def.basePrice * (0.95 + Math.random() * 0.1); // start near base
  const trend = generateDayTrend(def.volatility);
  const targetPrice = price * (1 + trend);
  const tickStep = MINUTES_PER_TICK;

  for (let t = 0; t <= MARKET_CLOSE; t += tickStep) {
    const absTime = fakeDayStart + t;
    const progress = t / MARKET_CLOSE;
    const trendPull = (targetPrice - price) * 0.002 * (0.5 + progress);
    const noise = (Math.random() - 0.5) * price * def.volatility * 0.008;
    const deviation = (price - def.basePrice) / def.basePrice;
    const reversion = -deviation * price * 0.001;
    price = Math.max(0.5, price + trendPull + noise + reversion);
    points.push({ time: absTime, price });
  }

  return points;
}

export function initStockState(
  def: StockDefinition,
  day: number,
  previousClose?: number,
  previousHistory?: PricePoint[]
): StockState {
  const openPrice = previousClose ?? def.basePrice;
  const absOpen = toAbsoluteTime(day, MARKET_OPEN);

  const carryHistory = previousHistory ?? generatePrefillHistory(def);

  return {
    ticker: def.ticker,
    currentPrice: openPrice,
    openPrice: openPrice,
    dayTrend: generateDayTrend(def.volatility),
    history: [...carryHistory, { time: absOpen, price: openPrice }],
  };
}

export const BANKRUPTCY_THRESHOLD = 10;
const BANKRUPTCY_CHANCE = 0.20;

export function tickStock(
  stock: StockState,
  def: StockDefinition,
  minuteInDay: number,
  day: number,
  newsImpact: number = 0,
  newsVolatility: number = 1,
  trendShift: number = 0
): StockState {
  if (stock.failed) return stock;

  const progress = minuteInDay / MARKET_CLOSE; // 0 to 1
  const price = stock.currentPrice;

  const adjustedDayTrend = stock.dayTrend + trendShift;
  const targetPrice = stock.openPrice * (1 + adjustedDayTrend);
  const trendPull = (targetPrice - price) * 0.002 * (0.5 + progress);

  const effectiveVolatility = def.volatility * newsVolatility;
  const noise = (Math.random() - 0.5) * price * effectiveVolatility * 0.008;

  const deviation = (price - stock.openPrice) / stock.openPrice;
  const reversion = -deviation * price * 0.001;

  const newsBias = newsImpact * price * 0.003;

  const newPrice = Math.max(0.5, price + trendPull + noise + reversion + newsBias);
  const absTime = toAbsoluteTime(day, minuteInDay);
  const newPoint: PricePoint = { time: absTime, price: newPrice };

  return {
    ...stock,
    currentPrice: newPrice,
    dayTrend: adjustedDayTrend,
    history: [...stock.history, newPoint],
  };
}

export function checkBankruptcy(price: number): boolean {
  if (price >= BANKRUPTCY_THRESHOLD) return false;
  const modifier = 1 + (BANKRUPTCY_THRESHOLD - price) / BANKRUPTCY_THRESHOLD;
  return Math.random() < BANKRUPTCY_CHANCE * modifier;
}

const REPLACEMENT_NAME_PARTS: Record<string, { prefixes: string[]; suffixes: string[] }> = {
  Tech: {
    prefixes: ['Cyber', 'Quantum', 'Neural', 'Cloud', 'Data', 'Pixel', 'Logic', 'Binary', 'Nano', 'Sync'],
    suffixes: ['Dynamics', 'Systems', 'Labs', 'Tech', 'Software', 'Networks', 'Digital', 'Solutions'],
  },
  Entertainment: {
    prefixes: ['Star', 'Vivid', 'Epic', 'Prime', 'Nova', 'Blitz', 'Flash', 'Hype', 'Mega', 'Ultra'],
    suffixes: ['Studios', 'Media', 'Entertainment', 'Pictures', 'Productions', 'Arts', 'Play', 'Show'],
  },
  Energy: {
    prefixes: ['Solar', 'Wind', 'Petro', 'Volt', 'Power', 'Fusion', 'Hydro', 'Grid', 'Eco', 'Terra'],
    suffixes: ['Energy', 'Power', 'Resources', 'Utilities', 'Electric', 'Dynamics', 'Systems', 'Fuels'],
  },
  Media: {
    prefixes: ['Buzz', 'Signal', 'Wave', 'Pulse', 'Stream', 'Link', 'Cast', 'Vibe', 'Core', 'Flux'],
    suffixes: ['Media', 'Digital', 'Networks', 'Broadcasting', 'Content', 'Studios', 'Wire', 'Press'],
  },
  Finance: {
    prefixes: ['Capital', 'Crown', 'Summit', 'Apex', 'Vault', 'Prime', 'Atlas', 'Merit', 'Crest', 'Forge'],
    suffixes: ['Holdings', 'Financial', 'Capital', 'Group', 'Partners', 'Trust', 'Ventures', 'Fund'],
  },
  Consumer: {
    prefixes: ['Fresh', 'Swift', 'Snap', 'Quick', 'Dash', 'Bright', 'Peak', 'True', 'Bold', 'Pure'],
    suffixes: ['Goods', 'Market', 'Direct', 'Express', 'Supply', 'Brands', 'Corp', 'Commerce'],
  },
};

const usedReplacementNames = new Set<string>();

export function generateReplacementStock(
  sector: string,
  day: number,
  existingTickers: string[]
): { definition: StockDefinition; state: StockState } {
  const parts = REPLACEMENT_NAME_PARTS[sector] || REPLACEMENT_NAME_PARTS['Tech'];
  let name = '';
  let ticker = '';
  let attempts = 0;

  do {
    const prefix = parts.prefixes[Math.floor(Math.random() * parts.prefixes.length)];
    const suffix = parts.suffixes[Math.floor(Math.random() * parts.suffixes.length)];
    name = `${prefix} ${suffix}`;
    ticker = (prefix.slice(0, 2) + suffix.slice(0, 2)).toUpperCase();
    attempts++;
  } while (
    (usedReplacementNames.has(name) || existingTickers.includes(ticker)) &&
    attempts < 50
  );

  usedReplacementNames.add(name);

  const basePrice = Math.round((Math.random() * 180 + 20) * 100) / 100;
  const volatility = 0.3 + Math.random() * 0.5;

  const definition: StockDefinition = {
    ticker,
    name,
    sector,
    basePrice,
    volatility,
  };

  // 30% chance of negative starting trend
  const forceNegative = Math.random() < 0.3;
  const state = initStockState(definition, day);
  if (forceNegative) {
    state.dayTrend = -(0.02 + Math.random() * 0.04);
  }

  return { definition, state };
}

export function resetReplacementNames(): void {
  usedReplacementNames.clear();
}
