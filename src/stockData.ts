import type { StockDefinition } from './types';

export const STOCKS: StockDefinition[] = [
  // Tech (3)
  { ticker: 'APLL', name: 'Appull Inc.', sector: 'Tech', basePrice: 254, volatility: 0.4 },
  { ticker: 'MXPD', name: 'MaxPod Corp.', sector: 'Tech', basePrice: 123, volatility: 0.5 },
  { ticker: 'NETZ', name: 'NetZone Digital', sector: 'Tech', basePrice: 312, volatility: 0.55 },

  // Media (3)
  { ticker: 'JKKP', name: 'JokeKeep Ltd.', sector: 'Media', basePrice: 67, volatility: 0.7 },
  { ticker: 'JOKX', name: 'Jokex Media', sector: 'Media', basePrice: 42, volatility: 0.8 },
  { ticker: 'STRM', name: 'StreamVibe Corp.', sector: 'Media', basePrice: 95, volatility: 0.55 },

  // Energy (3)
  { ticker: 'PPOL', name: 'PetroPole Energy', sector: 'Energy', basePrice: 27, volatility: 0.6 },
  { ticker: 'GRNE', name: 'GreenE Solar', sector: 'Energy', basePrice: 48, volatility: 0.65 },
  { ticker: 'VOLT', name: 'VoltGrid Power', sector: 'Energy', basePrice: 63, volatility: 0.5 },

  // Finance (3)
  { ticker: 'TRSI', name: 'TrustSi Financial', sector: 'Finance', basePrice: 89, volatility: 0.3 },
  { ticker: 'BNKR', name: 'Bankr Holdings', sector: 'Finance', basePrice: 156, volatility: 0.35 },
  { ticker: 'CPTL', name: 'CapitalEdge Group', sector: 'Finance', basePrice: 110, volatility: 0.4 },

  // Consumer (3)
  { ticker: 'FODR', name: 'FoodRunner Inc.', sector: 'Consumer', basePrice: 35, volatility: 0.45 },
  { ticker: 'FSHG', name: 'FreshGoods Market', sector: 'Consumer', basePrice: 52, volatility: 0.4 },
  { ticker: 'SWFT', name: 'SwiftDash Delivery', sector: 'Consumer', basePrice: 44, volatility: 0.55 },
];
