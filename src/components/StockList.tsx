import type { StockState } from '../types';

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
        const change = ((stock.currentPrice - stock.openPrice) / stock.openPrice) * 100;
        const isUp = change >= 0;
        const held = holdings[stock.ticker] || 0;
        return (
          <button
            key={stock.ticker}
            className={`stock-btn ${stock.ticker === selectedTicker ? 'selected' : ''}`}
            onClick={() => onSelect(stock.ticker)}
          >
            <span className="stock-btn-ticker">{stock.ticker}</span>
            <span className={`stock-btn-change ${isUp ? 'up' : 'down'}`}>
              {isUp ? '+' : ''}{change.toFixed(1)}%
            </span>
            {held > 0 && <span className="stock-btn-held">{held}</span>}
          </button>
        );
      })}
    </div>
  );
}
