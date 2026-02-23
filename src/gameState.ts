import { useState, useCallback, useRef, useEffect } from 'react';
import type { GameState, Screen, Holdings, StockState } from './types';
import { STOCKS } from './stockData';
import {
  initStockState,
  tickStock,
  MARKET_CLOSE,
  MINUTES_PER_TICK,
  TICK_INTERVAL_MS,
} from './stockEngine';
import { getNewsForDay } from './newsData';

const STARTING_CASH = 10000;
const GOAL = 20000;
const MAX_DAYS = 7;

function initStocks(day: number = 1): StockState[] {
  return STOCKS.map((def) => initStockState(def, day));
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
    const stocks = initStocks();
    return {
      day: 1,
      maxDays: MAX_DAYS,
      timeMinutes: 0,
      phase: 'day',
      screen: 'day',
      cash: STARTING_CASH,
      holdings: {},
      stocks,
      selectedTicker: stocks[0].ticker,
      goal: GOAL,
      dayStartPortfolio: STARTING_CASH,
      news: [],
    };
  });

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const portfolioValue = calcPortfolioValue(
    state.cash,
    state.holdings,
    state.stocks
  );

  const todayPL = portfolioValue - state.dayStartPortfolio;

  // Tick the market
  const tick = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'day') return prev;

      const newTime = prev.timeMinutes + MINUTES_PER_TICK;

      // End of day
      if (newTime >= MARKET_CLOSE) {
        const finalStocks = prev.stocks.map((s) => {
          const def = STOCKS.find((d) => d.ticker === s.ticker)!;
          return tickStock(s, def, MARKET_CLOSE, prev.day);
        });

        const finalPortfolio = calcPortfolioValue(
          prev.cash,
          prev.holdings,
          finalStocks
        );

        // Check win
        if (finalPortfolio >= prev.goal) {
          return {
            ...prev,
            timeMinutes: MARKET_CLOSE,
            stocks: finalStocks,
            phase: 'night' as const,
            screen: 'win' as Screen,
            news: getNewsForDay(prev.day),
          };
        }

        // Check lose (last day)
        if (prev.day >= prev.maxDays) {
          return {
            ...prev,
            timeMinutes: MARKET_CLOSE,
            stocks: finalStocks,
            phase: 'night' as const,
            screen: 'lose' as Screen,
            news: getNewsForDay(prev.day),
          };
        }

        return {
          ...prev,
          timeMinutes: MARKET_CLOSE,
          stocks: finalStocks,
          phase: 'night' as const,
          screen: 'night' as Screen,
          news: getNewsForDay(prev.day),
        };
      }

      // Normal tick
      const newStocks = prev.stocks.map((s) => {
        const def = STOCKS.find((d) => d.ticker === s.ticker)!;
        return tickStock(s, def, newTime, prev.day);
      });

      return {
        ...prev,
        timeMinutes: newTime,
        stocks: newStocks,
      };
    });
  }, []);

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
    setState((prev) => ({ ...prev, selectedTicker: ticker }));
  }, []);

  const buy = useCallback((ticker: string, qty: number) => {
    setState((prev) => {
      const stock = prev.stocks.find((s) => s.ticker === ticker);
      if (!stock) return prev;
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
      if (!stock) return prev;
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
    setState((prev) => {
      const newDay = prev.day + 1;
      // Carry over closing prices and full history to new day
      const newStocks = prev.stocks.map((s) => {
        const def = STOCKS.find((d) => d.ticker === s.ticker)!;
        return initStockState(def, newDay, s.currentPrice, s.history);
      });

      const newPortfolio = calcPortfolioValue(
        prev.cash,
        prev.holdings,
        newStocks
      );

      return {
        ...prev,
        day: newDay,
        timeMinutes: 0,
        phase: 'day' as const,
        screen: 'day' as Screen,
        stocks: newStocks,
        dayStartPortfolio: newPortfolio,
        news: [],
      };
    });
  }, []);

  const restart = useCallback(() => {
    const stocks = initStocks(1);
    setState({
      day: 1,
      maxDays: MAX_DAYS,
      timeMinutes: 0,
      phase: 'day',
      screen: 'day',
      cash: STARTING_CASH,
      holdings: {},
      stocks,
      selectedTicker: stocks[0].ticker,
      goal: GOAL,
      dayStartPortfolio: STARTING_CASH,
      news: [],
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
