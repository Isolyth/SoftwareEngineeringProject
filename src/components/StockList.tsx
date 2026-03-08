import type { StockState } from '../types';
import { BANKRUPTCY_THRESHOLD } from '../stockEngine';

interface Props {
  stocks: StockState[];
  selectedTicker: string;
  onSelect: (ticker: string) => void;
  holdings: { [ticker: string]: number };
}

export default function StockList({ stocks, selectedTicker, onSelect, holdings }: Props) {
  return (
    <div className="stock-list">
      <div className="stock-list-header">STOCKS</div>
      {stocks.map((stock) => {
        const change = stock.failed
          ? 0
          : ((stock.currentPrice - stock.openPrice) / stock.openPrice) * 100;
        const isUp = change >= 0;
        const held = holdings[stock.ticker] || 0;
        const isDanger = !stock.failed && stock.currentPrice < BANKRUPTCY_THRESHOLD;

        return (
          <button
            key={stock.ticker}
            className={`stock-btn ${stock.ticker === selectedTicker ? 'selected' : ''} ${stock.failed ? 'failed' : ''} ${isDanger ? 'danger' : ''}`}
            onClick={() => !stock.failed && onSelect(stock.ticker)}
            disabled={stock.failed}
          >
            <span className="stock-btn-ticker">{stock.ticker}</span>
            {stock.failed ? (
              <span className="failed-label">FAILED</span>
            ) : (
              <>
                <span className={`stock-btn-change ${isUp ? 'up' : 'down'}`}>
                  {isUp ? '+' : ''}{change.toFixed(1)}%
                </span>
                {isDanger && <span className="bankruptcy-badge">RISK</span>}
              </>
            )}
            {held > 0 && !stock.failed && <span className="stock-btn-held">{held}</span>}
          </button>
        );
      })}
    </div>
  );
}
