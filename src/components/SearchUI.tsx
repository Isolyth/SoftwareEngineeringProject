import type { GameState } from '../types';
import { BANKRUPTCY_THRESHOLD } from '../stockEngine';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface Props {
  state: GameState;
  portfolioValue: number;
  todayPL: number;
  onBack: () => void;
  onBuy: (ticker: string, qty: number) => void;
  onSelectStock: (ticker: string) => void;
}

export default function SearchUI({ state, portfolioValue, todayPL, onBack, onBuy, onSelectStock }: Props) {
  return (
    <div className="search-ui">
      <div className="search-header">
        <button className="back-btn" onClick={onBack}>BACK</button>
        <h1>STOCKS ON MARKET</h1>
      </div>

      <div className="search-content">
        <div className="search-list">
          {state.stocks.map((stock) => {
            const def = state.stockDefinitions.find((d) => d.ticker === stock.ticker)!;
            const change = stock.failed
              ? 0
              : ((stock.currentPrice - stock.openPrice) / stock.openPrice) * 100;
            const isUp = change >= 0;
            const held = state.holdings[stock.ticker] || 0;
            const maxBuy = stock.failed ? 0 : Math.floor(state.cash / stock.currentPrice);
            const isDanger = !stock.failed && stock.currentPrice < BANKRUPTCY_THRESHOLD;

            return (
              <div
                key={stock.ticker}
                className={`search-row ${stock.ticker === state.selectedTicker ? 'selected' : ''} ${stock.failed ? 'failed' : ''} ${isDanger ? 'danger' : ''}`}
                onClick={() => !stock.failed && onSelectStock(stock.ticker)}
              >
                <div className="search-row-info">
                  <span className="search-ticker">{stock.ticker}</span>
                  <span className="search-name">{def.name}</span>
                  <span className="search-sector">{def.sector}</span>
                </div>
                {stock.failed ? (
                  <span className="failed-label">FAILED</span>
                ) : (
                  <>
                    <div className="search-row-chart">
                      <ResponsiveContainer width={80} height={30}>
                        <LineChart data={stock.history}>
                          <Line
                            type="monotone"
                            dataKey="price"
                            stroke={isUp ? '#00e676' : '#ff5252'}
                            strokeWidth={1.5}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <span className={`search-change ${isUp ? 'up' : 'down'}`}>
                      {isUp ? '+' : ''}{change.toFixed(1)}%
                    </span>
                    <span className="search-price">${stock.currentPrice.toFixed(2)}</span>
                    {isDanger && <span className="bankruptcy-badge">RISK</span>}
                    {held > 0 && <span className="search-held">Own: {held}</span>}
                    {state.phase === 'day' && maxBuy > 0 && (
                      <button
                        className="search-buy-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onBuy(stock.ticker, 1);
                        }}
                      >
                        BUY
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="search-sidebar">
          <div className="info-row">
            <span className="info-label">GOAL</span>
            <span className="info-value goal-value">${state.goal.toLocaleString()}</span>
          </div>
          <div className="info-row">
            <span className="info-label">PORTFOLIO</span>
            <span className="info-value">${portfolioValue.toFixed(2)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">P/L</span>
            <span className={`info-value ${todayPL >= 0 ? 'up' : 'down'}`}>
              {todayPL >= 0 ? '+' : ''}${todayPL.toFixed(2)}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">CASH</span>
            <span className="info-value">${state.cash.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
