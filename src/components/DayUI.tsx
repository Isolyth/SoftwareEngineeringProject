import { useState } from 'react';
import type { GameState } from '../types';
import { formatGameTime, toAbsoluteTime, MARKET_CLOSE } from '../stockEngine';
import StockList from './StockList';
import StockChart from './StockChart';
import InfoPanel from './InfoPanel';
import NewsFeed from './NewsFeed';
import BankruptcyAlert from './BankruptcyAlert';

interface Props {
  state: GameState;
  portfolioValue: number;
  todayPL: number;
  onSelectStock: (ticker: string) => void;
  onBuy: (ticker: string, qty: number) => void;
  onSell: (ticker: string, qty: number) => void;
  onSearch: () => void;
}

export default function DayUI({
  state,
  portfolioValue,
  todayPL,
  onSelectStock,
  onBuy,
  onSell,
  onSearch,
}: Props) {
  const [tradeQty, setTradeQty] = useState(1);

  const selectedStock = state.stocks.find((s) => s.ticker === state.selectedTicker)!;
  const progress = (state.timeMinutes / MARKET_CLOSE) * 100;

  const maxBuy = selectedStock.failed ? 0 : Math.floor(state.cash / selectedStock.currentPrice);
  const maxSell = state.holdings[state.selectedTicker] || 0;

  return (
    <div className="day-ui">
      {state.bankruptcyAlert && (
        <BankruptcyAlert message={state.bankruptcyAlert} />
      )}

      <div className="top-bar">
        <span className="day-label">DAY {state.day}</span>
        <div className="time-bar">
          <div className="time-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="time-label">{formatGameTime(toAbsoluteTime(state.day, state.timeMinutes))}</span>
      </div>

      <div className="day-content">
        <StockList
          stocks={state.stocks}
          selectedTicker={state.selectedTicker}
          onSelect={onSelectStock}
          holdings={state.holdings}
        />

        <div className="center-panel">
          <StockChart
            history={selectedStock.history}
            ticker={selectedStock.ticker}
            currentPrice={selectedStock.currentPrice}
            currentTime={toAbsoluteTime(state.day, state.timeMinutes)}
            day={state.day}
          />
          <div className="action-bar">
            <button className="action-btn search-btn" onClick={onSearch}>SEARCH</button>
            <button
              className="action-btn buy-btn"
              onClick={() => onBuy(state.selectedTicker, tradeQty)}
              disabled={maxBuy <= 0 || selectedStock.failed || tradeQty > maxBuy}
            >
              BUY
            </button>
            <button
              className="action-btn sell-btn"
              onClick={() => onSell(state.selectedTicker, tradeQty)}
              disabled={maxSell <= 0 || selectedStock.failed || tradeQty > maxSell}
            >
              SELL
            </button>
            <div className="qty-control">
              <button
                className="qty-btn"
                onClick={() => setTradeQty((q) => Math.max(1, q - 1))}
                disabled={tradeQty <= 1}
              >
                -
              </button>
              <input
                type="number"
                className="qty-input"
                min={1}
                value={tradeQty}
                onChange={(e) => setTradeQty(Math.max(1, Number(e.target.value) || 1))}
              />
              <button
                className="qty-btn"
                onClick={() => setTradeQty((q) => q + 1)}
              >
                +
              </button>
              <button
                className="qty-max-btn"
                onClick={() => setTradeQty(Math.max(maxBuy, maxSell, 1))}
              >
                MAX
              </button>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <InfoPanel
            goal={state.goal}
            portfolioValue={portfolioValue}
            todayPL={todayPL}
            cash={state.cash}
          />
          <NewsFeed
            liveNews={state.liveNews}
            activeEffects={state.activeEffects}
          />
        </div>
      </div>
    </div>
  );
}
