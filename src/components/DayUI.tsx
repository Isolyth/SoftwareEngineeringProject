import { useState } from 'react';
import type { GameState } from '../types';
import { formatGameTime, toAbsoluteTime, MARKET_CLOSE } from '../stockEngine';
import StockList from './StockList';
import StockChart from './StockChart';
import InfoPanel from './InfoPanel';
import TradeModal from './TradeModal';

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
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell' | null>(null);

  const selectedStock = state.stocks.find((s) => s.ticker === state.selectedTicker)!;
  const progress = (state.timeMinutes / MARKET_CLOSE) * 100;

  const maxBuy = Math.floor(state.cash / selectedStock.currentPrice);
  const maxSell = state.holdings[state.selectedTicker] || 0;

  return (
    <div className="day-ui">
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
            <button className="action-btn buy-btn" onClick={() => setTradeMode('buy')} disabled={maxBuy <= 0}>BUY</button>
            <button className="action-btn sell-btn" onClick={() => setTradeMode('sell')} disabled={maxSell <= 0}>SELL</button>
          </div>
        </div>

        <InfoPanel
          goal={state.goal}
          portfolioValue={portfolioValue}
          todayPL={todayPL}
          cash={state.cash}
        />
      </div>

      {tradeMode && (
        <TradeModal
          mode={tradeMode}
          ticker={state.selectedTicker}
          currentPrice={selectedStock.currentPrice}
          maxQty={tradeMode === 'buy' ? maxBuy : maxSell}
          onConfirm={(qty) => {
            if (tradeMode === 'buy') onBuy(state.selectedTicker, qty);
            else onSell(state.selectedTicker, qty);
            setTradeMode(null);
          }}
          onCancel={() => setTradeMode(null)}
        />
      )}
    </div>
  );
}
