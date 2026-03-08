import { useState, useCallback, useRef, useEffect } from 'react';
import type { GameState, Screen, Holdings, StockState, StockDefinition } from './types';
import { STOCKS } from './stockData';
import {
  initStockState,
  tickStock,
  checkBankruptcy,
  generateReplacementStock,
  resetReplacementNames,
  MARKET_CLOSE,
  MINUTES_PER_TICK,
  TICK_INTERVAL_MS,
} from './stockEngine';
import { getNewsForDay } from './newsData';
import {
  generateNewsEvent,
  computeNewsInfluence,
  decrementEffects,
  MAX_LIVE_NEWS,
} from './newsEngine';

const STARTING_CASH = 10000;
const GOAL = 20000;
const MAX_DAYS = 7;

function initStocks(defs: StockDefinition[], day: number = 1): StockState[] {
  return defs.map((def) => initStockState(def, day));
}

function calcPortfolioValue(
  cash: number,
  holdings: Holdings,
  stocks: StockState[]
): number {
  let value = cash;
  for (const stock of stocks) {
    const qty = holdings[stock.ticker] || 0;
    value += qty * stock.currentPrice;
  }
  return value;
}

export function useGameState() {
  const [state, setState] = useState<GameState>(() => {
    const defs = [...STOCKS];
    const stocks = initStocks(defs);
    return {
      day: 1,
      maxDays: MAX_DAYS,
      timeMinutes: 0,
      phase: 'day',
      screen: 'day',
      cash: STARTING_CASH,
      holdings: {},
      stocks,
      stockDefinitions: defs,
      selectedTicker: stocks[0].ticker,
      goal: GOAL,
      dayStartPortfolio: STARTING_CASH,
      news: [],
      liveNews: [],
      activeEffects: [],
      bankruptcyAlert: null,
    };
  });

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const newsIdCounterRef = useRef(0);
  const trendShiftsRef = useRef<Map<string, number>>(new Map());
  const ticksSinceNewsRef = useRef(0);
  const nextNewsAtRef = useRef(Math.floor(Math.random() * 8) + 4);
  const bankruptcyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const portfolioValue = calcPortfolioValue(
    state.cash,
    state.holdings,
    state.stocks
  );

  const todayPL = portfolioValue - state.dayStartPortfolio;

  // Replace a failed stock after delay
  const replaceFailedStock = useCallback(() => {
    setState((prev) => {
      const newStocks: StockState[] = [];
      const newDefs = [...prev.stockDefinitions];

      for (let i = 0; i < prev.stocks.length; i++) {
        const s = prev.stocks[i];
        if (s.failed) {
          const existingTickers = prev.stocks.map((st) => st.ticker);
          const { definition, state: newState } = generateReplacementStock(
            newDefs[i].sector,
            prev.day,
            existingTickers
          );
          newDefs[i] = definition;
          newStocks.push(newState);
        } else {
          newStocks.push(s);
        }
      }

      return {
        ...prev,
        stocks: newStocks,
        stockDefinitions: newDefs,
        bankruptcyAlert: null,
      };
    });
  }, []);

  // Tick the market
  const tick = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'day') return prev;

      const newTime = prev.timeMinutes + MINUTES_PER_TICK;

      // --- News generation ---
      ticksSinceNewsRef.current++;
      let newLiveNews = prev.liveNews;
      let newActiveEffects = prev.activeEffects;

      if (ticksSinceNewsRef.current >= nextNewsAtRef.current) {
        const result = generateNewsEvent(
          prev.stocks,
          prev.stockDefinitions,
          newsIdCounterRef.current
        );
        if (result) {
          newsIdCounterRef.current++;
          newLiveNews = [result.event, ...prev.liveNews].slice(0, MAX_LIVE_NEWS);
          newActiveEffects = [...prev.activeEffects, result.event];

          // Accumulate trend shifts
          for (const [ticker, shift] of result.trendShifts) {
            const current = trendShiftsRef.current.get(ticker) || 0;
            trendShiftsRef.current.set(ticker, current + shift);
          }
        }
        ticksSinceNewsRef.current = 0;
        nextNewsAtRef.current = Math.floor(Math.random() * 8) + 4;
      }

      // --- Decrement active effects ---
      newActiveEffects = decrementEffects(newActiveEffects);

      // --- Tick stocks with news influence ---
      const tickStocks = (stocks: StockState[]) => {
        return stocks.map((s) => {
          if (s.failed) return s;
          const def = prev.stockDefinitions.find((d) => d.ticker === s.ticker)!;
          const { newsImpact, newsVolatility } = computeNewsInfluence(
            s.ticker,
            def.sector,
            newActiveEffects
          );
          const trendShift = trendShiftsRef.current.get(s.ticker) || 0;
          trendShiftsRef.current.delete(s.ticker);

          const time = newTime >= MARKET_CLOSE ? MARKET_CLOSE : newTime;
          return tickStock(s, def, time, prev.day, newsImpact, newsVolatility, trendShift);
        });
      };

      // --- End of day ---
      if (newTime >= MARKET_CLOSE) {
        const finalStocks = tickStocks(prev.stocks);

        const finalPortfolio = calcPortfolioValue(
          prev.cash,
          prev.holdings,
          finalStocks
        );

        const baseUpdate = {
          ...prev,
          timeMinutes: MARKET_CLOSE,
          stocks: finalStocks,
          phase: 'night' as const,
          liveNews: newLiveNews,
          activeEffects: newActiveEffects,
        };

        if (finalPortfolio >= prev.goal) {
          return {
            ...baseUpdate,
            screen: 'win' as Screen,
            news: getNewsForDay(prev.day),
          };
        }

        if (prev.day >= prev.maxDays) {
          return {
            ...baseUpdate,
            screen: 'lose' as Screen,
            news: getNewsForDay(prev.day),
          };
        }

        return {
          ...baseUpdate,
          screen: 'night' as Screen,
          news: getNewsForDay(prev.day),
        };
      }

      // --- Normal tick ---
      const newStocks = tickStocks(prev.stocks);

      // --- Bankruptcy checks ---
      let cash = prev.cash;
      let holdings = prev.holdings;
      let bankruptcyAlert = prev.bankruptcyAlert;
      const checkedStocks = newStocks.map((s) => {
        if (s.failed || s.currentPrice >= 10) return s;
        if (checkBankruptcy(s.currentPrice)) {
          const def = prev.stockDefinitions.find((d) => d.ticker === s.ticker)!;
          const lostShares = holdings[s.ticker] || 0;
          if (lostShares > 0) {
            holdings = { ...holdings };
            delete holdings[s.ticker];
          }
          bankruptcyAlert = `${def.name} (${s.ticker}) has gone bankrupt!${lostShares > 0 ? ` You lost ${lostShares} shares.` : ''}`;
          return { ...s, currentPrice: 0, failed: true };
        }
        return s;
      });

      // Schedule replacement if any stock failed this tick
      const hasNewFailure = checkedStocks.some(
        (s, i) => s.failed && !prev.stocks[i].failed
      );
      if (hasNewFailure && !bankruptcyTimerRef.current) {
        bankruptcyTimerRef.current = setTimeout(() => {
          bankruptcyTimerRef.current = null;
          replaceFailedStock();
        }, 2000);
      }

      return {
        ...prev,
        timeMinutes: newTime,
        stocks: checkedStocks,
        cash,
        holdings,
        liveNews: newLiveNews,
        activeEffects: newActiveEffects,
        bankruptcyAlert,
      };
    });
  }, [replaceFailedStock]);

  // Start/stop interval based on phase
  useEffect(() => {
    if (state.phase === 'day' && state.screen === 'day') {
      tickRef.current = setInterval(tick, TICK_INTERVAL_MS);
    } else {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [state.phase, state.screen, tick]);

  const selectStock = useCallback((ticker: string) => {
    setState((prev) => {
      const stock = prev.stocks.find((s) => s.ticker === ticker);
      if (stock?.failed) return prev;
      return { ...prev, selectedTicker: ticker };
    });
  }, []);

  const buy = useCallback((ticker: string, qty: number) => {
    setState((prev) => {
      const stock = prev.stocks.find((s) => s.ticker === ticker);
      if (!stock || stock.failed) return prev;
      const cost = stock.currentPrice * qty;
      if (cost > prev.cash) return prev;
      return {
        ...prev,
        cash: prev.cash - cost,
        holdings: {
          ...prev.holdings,
          [ticker]: (prev.holdings[ticker] || 0) + qty,
        },
      };
    });
  }, []);

  const sell = useCallback((ticker: string, qty: number) => {
    setState((prev) => {
      const stock = prev.stocks.find((s) => s.ticker === ticker);
      if (!stock || stock.failed) return prev;
      const held = prev.holdings[ticker] || 0;
      const actualQty = Math.min(qty, held);
      if (actualQty <= 0) return prev;
      return {
        ...prev,
        cash: prev.cash + stock.currentPrice * actualQty,
        holdings: {
          ...prev.holdings,
          [ticker]: held - actualQty,
        },
      };
    });
  }, []);

  const goToSearch = useCallback(() => {
    setState((prev) => ({ ...prev, screen: 'search' as Screen }));
  }, []);

  const goBackFromSearch = useCallback(() => {
    setState((prev) => ({
      ...prev,
      screen: prev.phase === 'day' ? ('day' as Screen) : ('night' as Screen),
    }));
  }, []);

  const sleep = useCallback(() => {
    // Clear any pending bankruptcy timer
    if (bankruptcyTimerRef.current) {
      clearTimeout(bankruptcyTimerRef.current);
      bankruptcyTimerRef.current = null;
    }
    trendShiftsRef.current.clear();
    ticksSinceNewsRef.current = 0;
    nextNewsAtRef.current = Math.floor(Math.random() * 8) + 4;

    setState((prev) => {
      const newDay = prev.day + 1;

      // Replace any failed stocks before new day
      let defs = [...prev.stockDefinitions];
      let currentStocks = prev.stocks;
      const hasFailedStocks = currentStocks.some((s) => s.failed);
      if (hasFailedStocks) {
        const replaced: StockState[] = [];
        for (let i = 0; i < currentStocks.length; i++) {
          if (currentStocks[i].failed) {
            const existingTickers = currentStocks.map((st) => st.ticker);
            const { definition, state: newState } = generateReplacementStock(
              defs[i].sector,
              newDay,
              existingTickers
            );
            defs[i] = definition;
            replaced.push(newState);
          } else {
            replaced.push(currentStocks[i]);
          }
        }
        currentStocks = replaced;
      }

      const newStocks = currentStocks.map((s) => {
        const def = defs.find((d) => d.ticker === s.ticker)!;
        return initStockState(def, newDay, s.currentPrice, s.history);
      });

      const newPortfolio = calcPortfolioValue(
        prev.cash,
        prev.holdings,
        newStocks
      );

      // If selected stock was replaced, select first available
      const selectedExists = newStocks.some((s) => s.ticker === prev.selectedTicker);
      const selectedTicker = selectedExists ? prev.selectedTicker : newStocks[0].ticker;

      return {
        ...prev,
        day: newDay,
        timeMinutes: 0,
        phase: 'day' as const,
        screen: 'day' as Screen,
        stocks: newStocks,
        stockDefinitions: defs,
        selectedTicker,
        dayStartPortfolio: newPortfolio,
        news: [],
        liveNews: [],
        activeEffects: [],
        bankruptcyAlert: null,
      };
    });
  }, []);

  const restart = useCallback(() => {
    // Clear timers and refs
    if (bankruptcyTimerRef.current) {
      clearTimeout(bankruptcyTimerRef.current);
      bankruptcyTimerRef.current = null;
    }
    trendShiftsRef.current.clear();
    ticksSinceNewsRef.current = 0;
    nextNewsAtRef.current = Math.floor(Math.random() * 8) + 4;
    newsIdCounterRef.current = 0;
    resetReplacementNames();

    const defs = [...STOCKS];
    const stocks = initStocks(defs, 1);
    setState({
      day: 1,
      maxDays: MAX_DAYS,
      timeMinutes: 0,
      phase: 'day',
      screen: 'day',
      cash: STARTING_CASH,
      holdings: {},
      stocks,
      stockDefinitions: defs,
      selectedTicker: stocks[0].ticker,
      goal: GOAL,
      dayStartPortfolio: STARTING_CASH,
      news: [],
      liveNews: [],
      activeEffects: [],
      bankruptcyAlert: null,
    });
  }, []);

  return {
    state,
    portfolioValue,
    todayPL,
    selectStock,
    buy,
    sell,
    goToSearch,
    goBackFromSearch,
    sleep,
    restart,
  };
}
