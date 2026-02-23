export interface StockDefinition {
  ticker: string;
  name: string;
  sector: string;
  basePrice: number;
  volatility: number; // 0-1 scale
}

export interface PricePoint {
  time: number; // minutes since market open (0 = 9:00am, 480 = 5:00pm)
  price: number;
}

export interface StockState {
  ticker: string;
  currentPrice: number;
  openPrice: number;
  dayTrend: number; // % target for the day
  history: PricePoint[];
}

export interface Holdings {
  [ticker: string]: number; // ticker -> qty
}

export type Phase = 'day' | 'night';
export type Screen = 'day' | 'night' | 'search' | 'win' | 'lose';

export interface NewsArticle {
  headline: string;
  blurb: string;
  tags: string[]; // related stock tickers
}

export interface GameState {
  day: number;
  maxDays: number;
  timeMinutes: number; // 0-480 (minutes in trading day)
  phase: Phase;
  screen: Screen;
  cash: number;
  holdings: Holdings;
  stocks: StockState[];
  selectedTicker: string;
  goal: number;
  dayStartPortfolio: number;
  news: NewsArticle[];
}
