import type { StockState, StockDefinition, StockRelation, RelationType } from '../types';
import { BANKRUPTCY_THRESHOLD } from '../stockEngine';

const RELATION_ICONS: Record<RelationType, string> = {
  competitor: '\u2694',
  supplier: '\u2B8C',
  partner: '\u2660',
};

interface Props {
  stocks: StockState[];
  stockDefinitions: StockDefinition[];
  selectedTicker: string;
  onSelect: (ticker: string) => void;
  holdings: { [ticker: string]: number };
  relations: StockRelation[];
}

export default function StockList({ stocks, stockDefinitions, selectedTicker, onSelect, holdings, relations }: Props) {
  const relatedMap = new Map<string, RelationType>();
  for (const rel of relations) {
    if (rel.from === selectedTicker) relatedMap.set(rel.to, rel.type);
    else if (rel.to === selectedTicker) relatedMap.set(rel.from, rel.type);
  }

  // Group stocks by sector
  const sectors = new Map<string, StockState[]>();
  for (const stock of stocks) {
    const def = stockDefinitions.find((d) => d.ticker === stock.ticker);
    const sector = def?.sector ?? 'Other';
    if (!sectors.has(sector)) sectors.set(sector, []);
    sectors.get(sector)!.push(stock);
  }

  return (
    <div className="stock-list">
      <div className="stock-list-header">STOCKS</div>
      {[...sectors.entries()].map(([sector, sectorStocks]) => (
        <div key={sector} className="stock-list-group">
          <div className="stock-list-sector">{sector}</div>
          {sectorStocks.map((stock) => {
            const change = stock.failed
              ? 0
              : ((stock.currentPrice - stock.openPrice) / stock.openPrice) * 100;
            const isUp = change >= 0;
            const held = holdings[stock.ticker] || 0;
            const isDanger = !stock.failed && stock.currentPrice < BANKRUPTCY_THRESHOLD;
            const relType = relatedMap.get(stock.ticker);

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
                    {relType && (
                      <span className={`stock-btn-rel ${relType}`}>{RELATION_ICONS[relType]}</span>
                    )}
                    {isDanger && <span className="bankruptcy-badge">RISK</span>}
                  </>
                )}
                {held > 0 && !stock.failed && <span className="stock-btn-held">{held}</span>}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
