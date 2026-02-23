import { useState } from 'react';

interface Props {
  mode: 'buy' | 'sell';
  ticker: string;
  currentPrice: number;
  maxQty: number; // max affordable (buy) or max held (sell)
  onConfirm: (qty: number) => void;
  onCancel: () => void;
}

export default function TradeModal({ mode, ticker, currentPrice, maxQty, onConfirm, onCancel }: Props) {
  const [qty, setQty] = useState(1);

  const total = qty * currentPrice;
  const clampedMax = Math.max(0, maxQty);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          {mode === 'buy' ? 'BUY' : 'SELL'} {ticker}
        </div>
        <div className="modal-price">
          Price: ${currentPrice.toFixed(2)}
        </div>
        <div className="modal-qty">
          <label>Quantity:</label>
          <input
            type="number"
            min={1}
            max={clampedMax}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(clampedMax, Number(e.target.value))))}
          />
          <button className="modal-max-btn" onClick={() => setQty(clampedMax)}>MAX</button>
        </div>
        <div className="modal-total">
          Total: ${total.toFixed(2)}
        </div>
        <div className="modal-actions">
          <button
            className={`modal-confirm ${mode}`}
            onClick={() => onConfirm(qty)}
            disabled={qty <= 0 || qty > clampedMax}
          >
            {mode === 'buy' ? 'BUY' : 'SELL'}
          </button>
          <button className="modal-cancel" onClick={onCancel}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}
