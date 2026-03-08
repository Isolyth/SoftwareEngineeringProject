import type { NewsArticle } from './types';

const ALL_NEWS: NewsArticle[][] = [
  // Day 1 news
  [
    {
      headline: 'APPULL RELEASES NEW PHONE',
      blurb: 'Appull Inc. unveiled its latest smartphone today, featuring a revolutionary holographic display. Analysts predict strong holiday sales could boost the company\'s market cap significantly.',
      tags: ['APLL'],
    },
    {
      headline: 'OIL PRICES SURGE ON SUPPLY FEARS',
      blurb: 'Global oil prices jumped 4% today as tensions in the Gulf region raised concerns about supply disruptions. Energy stocks are expected to benefit from the price increase.',
      tags: ['PPOL', 'GRNE'],
    },
    {
      headline: 'NETZONE ACQUIRES STREAMING STARTUP',
      blurb: 'NetZone Digital announced a $2.3 billion acquisition of StreamFlix, a popular video platform. The move is seen as a play to dominate the digital content space.',
      tags: ['NETZ', 'JOKX'],
    },
  ],
  // Day 2 news
  [
    {
      headline: 'BANKR POSTS RECORD EARNINGS',
      blurb: 'Bankr Holdings reported quarterly earnings that beat analyst expectations by 15%. The financial giant credited strong lending activity and reduced loan defaults.',
      tags: ['BNKR', 'TRSI'],
    },
    {
      headline: 'FOODRUNNER EXPANDS TO 12 NEW CITIES',
      blurb: 'FoodRunner Inc. announced rapid expansion into a dozen new metropolitan areas, intensifying competition in the food delivery market.',
      tags: ['FODR'],
    },
    {
      headline: 'JOKEX VIRAL VIDEO BREAKS RECORDS',
      blurb: 'A video on the Jokex Media platform has reached 500 million views in 24 hours, drawing massive advertiser interest to the platform.',
      tags: ['JOKX', 'NETZ'],
    },
  ],
  // Day 3 news
  [
    {
      headline: 'GREEN ENERGY BILL PASSES SENATE',
      blurb: 'The landmark Green Future Act passed the Senate today, allocating $500 billion in subsidies for renewable energy companies over the next decade.',
      tags: ['GRNE', 'PPOL'],
    },
    {
      headline: 'STREAMVIBE FACES DATA BREACH',
      blurb: 'StreamVibe Corp disclosed a data breach affecting 3 million user accounts. The company is offering free credit monitoring and expects increased security costs.',
      tags: ['STRM'],
    },
    {
      headline: 'TRUSTSI LAUNCHES CRYPTO TRADING',
      blurb: 'TrustSi Financial now offers cryptocurrency trading to all retail customers, joining the growing list of traditional finance firms entering the digital asset space.',
      tags: ['TRSI', 'BNKR'],
    },
  ],
  // Day 4 news
  [
    {
      headline: 'JOKEKEEP IPO ANNIVERSARY CELEBRATED',
      blurb: 'JokeKeep Ltd. marked one year since its IPO with a surprise announcement of a new comedy streaming service, sending shares higher in after-hours trading.',
      tags: ['JKKP', 'JOKX'],
    },
    {
      headline: 'PETROPOLE DISCOVERS NEW OIL FIELD',
      blurb: 'PetroPole Energy confirmed a massive oil discovery in the North Sea, with estimated reserves of 2 billion barrels. Production could begin within 18 months.',
      tags: ['PPOL'],
    },
    {
      headline: 'TECH SECTOR ROTATION UNDERWAY',
      blurb: 'Institutional investors appear to be rotating out of high-growth tech names and into value stocks, according to market analysts tracking fund flows.',
      tags: ['APLL', 'NETZ', 'STRM'],
    },
  ],
  // Day 5 news
  [
    {
      headline: 'FOODRUNNER CEO STEPS DOWN',
      blurb: 'FoodRunner\'s CEO announced a surprise resignation, citing personal reasons. The board has appointed the COO as interim chief executive.',
      tags: ['FODR'],
    },
    {
      headline: 'GREENE SOLAR PANELS HIT 40% EFFICIENCY',
      blurb: 'GreenE Solar announced a breakthrough in panel technology, achieving 40% energy conversion efficiency — nearly double the industry standard.',
      tags: ['GRNE'],
    },
    {
      headline: 'MARKET VOLATILITY REACHES 6-MONTH HIGH',
      blurb: 'The VIX fear index spiked to its highest level in six months as trade war concerns rattled global markets. Analysts advise caution.',
      tags: ['BNKR', 'TRSI'],
    },
  ],
  // Day 6 news
  [
    {
      headline: 'APPULL AND SWIFTDASH PARTNERSHIP DEAL',
      blurb: 'Appull Inc. and SwiftDash Delivery announced a logistics partnership, integrating same-day delivery for Appull products nationwide.',
      tags: ['APLL', 'SWFT'],
    },
    {
      headline: 'NETZONE USER BASE HITS 1 BILLION',
      blurb: 'NetZone Digital crossed the 1 billion monthly active user milestone, cementing its position as the world\'s largest digital platform.',
      tags: ['NETZ'],
    },
    {
      headline: 'ENERGY STOCKS RALLY ON COLD SNAP',
      blurb: 'An unexpected cold weather forecast across the northern hemisphere sent energy stocks surging as traders anticipate increased heating demand.',
      tags: ['PPOL', 'GRNE'],
    },
  ],
  // Day 7 news (won't show since day 7 is last)
  [
    {
      headline: 'FINAL TRADING DAY JITTERS',
      blurb: 'Markets opened mixed on the final trading day of the period as investors weigh their positions ahead of the quarterly close.',
      tags: ['BNKR', 'TRSI'],
    },
    {
      headline: 'JOKEX ANNOUNCES DIVIDEND',
      blurb: 'In a surprise move, Jokex Media declared its first-ever quarterly dividend, signaling confidence in its cash flow generation.',
      tags: ['JOKX'],
    },
    {
      headline: 'ANALYSTS PREDICT STRONG QUARTER',
      blurb: 'Wall Street consensus estimates point to broad earnings beats across most sectors this quarter, with tech and energy leading the way.',
      tags: ['APLL', 'NETZ', 'PPOL'],
    },
  ],
];

export function getNewsForDay(day: number): NewsArticle[] {
  const index = Math.min(day - 1, ALL_NEWS.length - 1);
  return ALL_NEWS[index];
}
