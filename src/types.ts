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
  failed?: boolean;
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

export type NewsEventType = 'positive' | 'negative' | 'neutral';

export interface LiveNewsEvent {
  id: number;
  headline: string;
  impact: number;
  volatility: number;
  duration: number; // remaining ticks of effect
  type: NewsEventType;
  targetSector?: string;
  targetTicker?: string;
}

export type RelationType = 'competitor' | 'supplier' | 'partner';

export interface StockRelation {
  from: string;        // ticker
  to: string;          // ticker
  type: RelationType;
  description: string; // e.g. "Appull Inc. competes directly with MaxPod Corp."
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
  stockDefinitions: StockDefinition[];
  selectedTicker: string;
  goal: number;
  dayStartPortfolio: number;
  news: NewsArticle[];
  liveNews: LiveNewsEvent[];
  activeEffects: LiveNewsEvent[];
  bankruptcyAlert: string | null;
  relations: StockRelation[];
}
