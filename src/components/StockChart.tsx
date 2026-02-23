import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { PricePoint } from '../types';
import { formatGameTime, formatGameTimeWithDay, MARKET_CLOSE } from '../stockEngine';

type WindowKey = '15m' | '30m' | '1h' | '1D';

const WINDOWS: { label: WindowKey; minutes: number }[] = [
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '1D', minutes: MARKET_CLOSE },
];

interface Props {
  history: PricePoint[];
  ticker: string;
  currentPrice: number;
  currentTime: number; // absolute time
  day: number;
}

export default function StockChart({ history, ticker, currentPrice, currentTime, day }: Props) {
  const [windowKey, setWindowKey] = useState<WindowKey>('1h');

  const windowDef = WINDOWS.find((w) => w.label === windowKey)!;

  // For "1D", show from the start of current day
  // For others, rolling window from current time
  let windowStart: number;
  if (windowKey === '1D') {
    windowStart = (day - 1) * MARKET_CLOSE;
  } else {
    windowStart = Math.max(history[0]?.time ?? 0, currentTime - windowDef.minutes);
  }

  const visibleHistory = history.filter((p) => p.time >= windowStart);

  // Change relative to visible window's first point
  const refPrice = visibleHistory.length > 0 ? visibleHistory[0].price : currentPrice;
  const change = currentPrice - refPrice;
  const changePercent = refPrice !== 0 ? (change / refPrice) * 100 : 0;
  const isUp = change >= 0;

  // Use day-aware formatter only when window spans multiple days
  const spansMultipleDays = visibleHistory.length > 0 &&
    Math.floor(visibleHistory[0].time / MARKET_CLOSE) !== Math.floor(currentTime / MARKET_CLOSE);
  const tickFormatter = spansMultipleDays ? formatGameTimeWithDay : formatGameTime;

  return (
    <div className="stock-chart">
      <div className="chart-header">
        <span className="chart-ticker">{ticker}</span>
        <span className="chart-price">${currentPrice.toFixed(2)}</span>
        <span className={`chart-change ${isUp ? 'up' : 'down'}`}>
          {isUp ? '+' : ''}{change.toFixed(2)} ({isUp ? '+' : ''}{changePercent.toFixed(2)}%)
        </span>
        <div className="chart-windows">
          {WINDOWS.map((w) => (
            <button
              key={w.label}
              className={`chart-window-btn ${windowKey === w.label ? 'active' : ''}`}
              onClick={() => setWindowKey(w.label)}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={420}>
        <LineChart data={visibleHistory}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="time"
            tickFormatter={tickFormatter}
            stroke="#888"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
            domain={[windowStart, Math.max(windowStart + windowDef.minutes, currentTime)]}
            type="number"
          />
          <YAxis
            domain={['auto', 'auto']}
            stroke="#888"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => `$${v.toFixed(0)}`}
          />
          <Tooltip
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
            labelFormatter={(label: number) => formatGameTimeWithDay(label)}
            contentStyle={{ background: '#1a1a2e', border: '1px solid #444', color: '#eee' }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke={isUp ? '#00e676' : '#ff5252'}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
