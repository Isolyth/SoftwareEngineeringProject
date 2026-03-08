import { useState, useEffect, useCallback, useRef } from 'react'

const INITIAL_CASH = 10000
const MAX_HISTORY = 50
const MAX_NEWS = 8
const BANKRUPTCY_THRESHOLD = 10
const BANKRUPTCY_CHANCE = 0.20 // 20% chance per tick when under $10

type Sector = 'Tech' | 'Healthcare' | 'Energy'

interface Stock {
  id: string
  name: string
  ticker: string
  sector: Sector
  price: number
  priceHistory: number[]
  failed: boolean
  // Hidden trend system
  trend: number // -1 to 1, persistent bias (hidden from player)
  trendMomentum: number // how fast trend is changing
  volatility: number // individual stock volatility
}

interface Portfolio {
  [stockId: string]: number // shares owned
}

interface NewsEvent {
  id: number
  headline: string
  impact: number
  volatility: number
  duration: number
  type: 'positive' | 'negative' | 'neutral'
  targetSector?: Sector
  targetStock?: string
}

const SECTOR_COLORS: Record<Sector, string> = {
  Tech: '#8b5cf6',
  Healthcare: '#06b6d4',
  Energy: '#f59e0b',
}

const STOCK_NAME_PARTS: Record<Sector, { prefixes: string[]; suffixes: string[] }> = {
  Tech: {
    prefixes: ['Cyber', 'Quantum', 'Neural', 'Cloud', 'Data', 'Pixel', 'Logic', 'Binary', 'Nano', 'Meta', 'Sync', 'Byte', 'Core', 'Nexus', 'Apex'],
    suffixes: ['Dynamics', 'Systems', 'Labs', 'Tech', 'Software', 'AI', 'Networks', 'Digital', 'Solutions', 'Computing', 'Innovations', 'Corp'],
  },
  Healthcare: {
    prefixes: ['Bio', 'Medi', 'Vita', 'Gene', 'Pharma', 'Health', 'Neuro', 'Cardio', 'Immuno', 'Thera', 'Onco', 'Cell', 'Life', 'Cure', 'Heal'],
    suffixes: ['Therapeutics', 'Pharmaceuticals', 'Sciences', 'Medical', 'Biotech', 'Health', 'Genetics', 'Labs', 'Care', 'Rx', 'Cure', 'Med'],
  },
  Energy: {
    prefixes: ['Solar', 'Wind', 'Petro', 'Volt', 'Power', 'Fusion', 'Hydro', 'Atomic', 'Grid', 'Eco', 'Green', 'Terra', 'Flux', 'Amp', 'Charge'],
    suffixes: ['Energy', 'Power', 'Resources', 'Utilities', 'Electric', 'Dynamics', 'Systems', 'Corp', 'Industries', 'Solutions', 'Grid', 'Fuels'],
  },
}

const usedNames = new Set<string>()

function generateStockName(sector: Sector): { name: string; ticker: string } {
  const parts = STOCK_NAME_PARTS[sector]
  let name = ''
  let ticker = ''
  let attempts = 0

  do {
    const prefix = parts.prefixes[Math.floor(Math.random() * parts.prefixes.length)]
    const suffix = parts.suffixes[Math.floor(Math.random() * parts.suffixes.length)]
    name = `${prefix} ${suffix}`
    ticker = (prefix.slice(0, 2) + suffix.slice(0, 2)).toUpperCase()
    attempts++
  } while (usedNames.has(name) && attempts < 50)

  usedNames.add(name)
  return { name, ticker }
}

function generateInitialPrice(): number {
  // Generate between $20 and $200
  return Math.round((Math.random() * 180 + 20) * 100) / 100
}

function generateInitialTrend(): number {
  // Most stocks start with mild trends, but some can be more extreme
  // 70% chance of mild trend (-0.2 to 0.2)
  // 20% chance of moderate trend (-0.4 to 0.4)
  // 10% chance of strong trend (-0.6 to 0.6)
  const roll = Math.random()
  if (roll < 0.7) {
    return (Math.random() - 0.5) * 0.4
  } else if (roll < 0.9) {
    return (Math.random() - 0.5) * 0.8
  } else {
    return (Math.random() - 0.5) * 1.2
  }
}

function createStock(sector: Sector, forceNegativeTrend = false): Stock {
  const { name, ticker } = generateStockName(sector)
  const price = generateInitialPrice()

  // Determine initial trend
  let trend = generateInitialTrend()
  if (forceNegativeTrend) {
    trend = -0.3 - Math.random() * 0.4 // Force negative trend between -0.3 and -0.7
  }

  return {
    id: `${ticker}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    ticker,
    sector,
    price,
    priceHistory: [price],
    failed: false,
    trend,
    trendMomentum: (Math.random() - 0.5) * 0.1, // Small initial momentum
    volatility: 0.8 + Math.random() * 0.6, // 0.8 to 1.4 volatility multiplier
  }
}

function createInitialStocks(): Stock[] {
  const sectors: Sector[] = ['Tech', 'Healthcare', 'Energy']
  const stocks: Stock[] = []

  // 4 Tech, 3 Healthcare, 3 Energy
  const distribution = { Tech: 4, Healthcare: 3, Energy: 3 }

  for (const sector of sectors) {
    for (let i = 0; i < distribution[sector]; i++) {
      // 20% chance each stock starts with negative trend
      const forceNegative = Math.random() < 0.2
      stocks.push(createStock(sector, forceNegative))
    }
  }

  return stocks
}

const NEWS_TEMPLATES = {
  positive: [
    { headline: "{stock} beats earnings expectations!", impact: 0.6, volatility: 1.5, trendShift: 0.15 },
    { headline: "{stock} announces breakthrough product", impact: 0.7, volatility: 1.6, trendShift: 0.2 },
    { headline: "{stock} secures major partnership", impact: 0.5, volatility: 1.3, trendShift: 0.1 },
    { headline: "Analysts upgrade {stock} to 'Strong Buy'", impact: 0.6, volatility: 1.4, trendShift: 0.15 },
    { headline: "{stock} reports record revenue", impact: 0.7, volatility: 1.5, trendShift: 0.2 },
    { headline: "{sector} sector rallies on positive outlook", impact: 0.4, volatility: 1.3, sectorWide: true, trendShift: 0.08 },
    { headline: "Government announces {sector} subsidies", impact: 0.5, volatility: 1.4, sectorWide: true, trendShift: 0.1 },
    { headline: "{sector} stocks surge on regulatory news", impact: 0.4, volatility: 1.5, sectorWide: true, trendShift: 0.08 },
  ],
  negative: [
    { headline: "{stock} misses earnings forecast", impact: -0.6, volatility: 1.5, trendShift: -0.15 },
    { headline: "{stock} faces product recall", impact: -0.7, volatility: 1.8, trendShift: -0.2 },
    { headline: "{stock} CEO resigns unexpectedly", impact: -0.5, volatility: 1.6, trendShift: -0.15 },
    { headline: "SEC investigates {stock}", impact: -0.8, volatility: 2.0, trendShift: -0.25 },
    { headline: "{stock} loses major client", impact: -0.5, volatility: 1.4, trendShift: -0.12 },
    { headline: "{sector} sector tumbles on weak demand", impact: -0.4, volatility: 1.4, sectorWide: true, trendShift: -0.1 },
    { headline: "New regulations threaten {sector} profits", impact: -0.5, volatility: 1.5, sectorWide: true, trendShift: -0.12 },
    { headline: "{sector} stocks dive on global concerns", impact: -0.4, volatility: 1.6, sectorWide: true, trendShift: -0.1 },
  ],
  neutral: [
    { headline: "{stock} announces stock split", impact: 0.1, volatility: 1.3, trendShift: 0.05 },
    { headline: "{stock} appoints new board member", impact: 0.05, volatility: 1.1, trendShift: 0 },
    { headline: "Mixed signals for {sector} sector", impact: 0, volatility: 1.4, sectorWide: true, trendShift: 0 },
    { headline: "Market awaits {sector} earnings reports", impact: 0, volatility: 1.5, sectorWide: true, trendShift: 0 },
  ],
}

function App() {
  const [stocks, setStocks] = useState<Stock[]>(createInitialStocks)
  const [portfolio, setPortfolio] = useState<Portfolio>({})
  const [cash, setCash] = useState(INITIAL_CASH)
  const [speed, setSpeed] = useState(1000)
  const [isPaused, setIsPaused] = useState(false)
  const [news, setNews] = useState<NewsEvent[]>([])
  const [activeEffects, setActiveEffects] = useState<NewsEvent[]>([])
  const [selectedStock, setSelectedStock] = useState<string | null>(null)
  const [failedStockAlert, setFailedStockAlert] = useState<string | null>(null)
  const newsIdRef = useRef(0)
  const trendShiftsRef = useRef<Map<string, number>>(new Map()) // Track pending trend shifts

  const totalSharesValue = stocks.reduce((sum, stock) => {
    return sum + (portfolio[stock.id] || 0) * stock.price
  }, 0)
  const totalValue = cash + totalSharesValue
  const profitLoss = totalValue - INITIAL_CASH
  const profitLossPercent = ((profitLoss / INITIAL_CASH) * 100).toFixed(2)

  const selected = stocks.find(s => s.id === selectedStock) || null

  const generateNews = useCallback(() => {
    const rand = Math.random()
    let type: 'positive' | 'negative' | 'neutral'
    if (rand < 0.35) type = 'positive'
    else if (rand < 0.75) type = 'negative' // Slightly more negative news
    else type = 'neutral'

    const templates = NEWS_TEMPLATES[type]
    const template = templates[Math.floor(Math.random() * templates.length)]

    const activeStocks = stocks.filter(s => !s.failed)
    if (activeStocks.length === 0) return

    const isSectorWide = 'sectorWide' in template && template.sectorWide
    const targetStock = activeStocks[Math.floor(Math.random() * activeStocks.length)]
    const targetSector = targetStock.sector

    const headline = template.headline
      .replace('{stock}', targetStock.ticker)
      .replace('{sector}', targetSector)

    const newEvent: NewsEvent = {
      id: newsIdRef.current++,
      headline,
      impact: template.impact,
      volatility: template.volatility,
      duration: Math.floor(Math.random() * 8) + 5,
      type,
      targetSector: isSectorWide ? targetSector : undefined,
      targetStock: isSectorWide ? undefined : targetStock.id,
    }

    // Apply trend shift from news
    const trendShift = template.trendShift || 0
    if (isSectorWide) {
      activeStocks.filter(s => s.sector === targetSector).forEach(s => {
        const current = trendShiftsRef.current.get(s.id) || 0
        trendShiftsRef.current.set(s.id, current + trendShift * 0.6)
      })
    } else {
      const current = trendShiftsRef.current.get(targetStock.id) || 0
      trendShiftsRef.current.set(targetStock.id, current + trendShift)
    }

    setNews(prev => [newEvent, ...prev].slice(0, MAX_NEWS))
    setActiveEffects(prev => [...prev, newEvent])
  }, [stocks])

  const updatePrices = useCallback(() => {
    setStocks(prevStocks => {
      const newStocks = prevStocks.map(stock => {
        if (stock.failed) return stock

        // === TREND EVOLUTION ===
        // Trends slowly drift over time (random walk on the trend)
        let newTrend = stock.trend
        let newMomentum = stock.trendMomentum

        // Apply any pending trend shifts from news
        const pendingShift = trendShiftsRef.current.get(stock.id) || 0
        if (pendingShift !== 0) {
          newTrend += pendingShift
          trendShiftsRef.current.delete(stock.id)
        }

        // Momentum changes randomly
        newMomentum += (Math.random() - 0.5) * 0.03
        newMomentum *= 0.95 // Dampen momentum over time

        // Apply momentum to trend
        newTrend += newMomentum

        // Occasional trend shocks (5% chance)
        if (Math.random() < 0.05) {
          const shock = (Math.random() - 0.5) * 0.3
          newTrend += shock
          // 2% chance of "death spiral" trigger for struggling stocks
          if (stock.price < 50 && Math.random() < 0.02) {
            newTrend -= 0.3 // Sudden negative trend shift
          }
        }

        // Mean reversion - trends slowly pull back toward zero, but weakly
        // Stronger mean reversion for extreme trends
        const meanReversionStrength = 0.02 + Math.abs(newTrend) * 0.03
        newTrend -= newTrend * meanReversionStrength

        // Low price makes negative trends "stickier" (harder to recover)
        if (stock.price < 30 && newTrend < 0) {
          newTrend *= 1.01 // Negative trends get slightly stronger
        }

        // Clamp trend to reasonable bounds
        newTrend = Math.max(-0.8, Math.min(0.8, newTrend))
        newMomentum = Math.max(-0.15, Math.min(0.15, newMomentum))

        // === PRICE CALCULATION ===
        // Calculate effect from active news events
        let newsImpact = 0
        let newsVolatility = 1

        activeEffects.forEach(effect => {
          if (effect.targetStock === stock.id) {
            newsImpact += effect.impact
            newsVolatility *= effect.volatility
          } else if (effect.targetSector === stock.sector) {
            newsImpact += effect.impact * 0.5
            newsVolatility *= (effect.volatility - 1) * 0.4 + 1
          }
        })

        // Base random walk
        const randomComponent = (Math.random() - 0.5) * 2

        // Combine all factors:
        // - Hidden trend provides consistent bias
        // - News provides temporary boost/drag
        // - Random walk provides noise
        const trendEffect = newTrend * 0.4 // Trend contributes ~40% of bias
        const totalBias = trendEffect + newsImpact * 0.3 + randomComponent * 0.3

        // Calculate price change
        const baseVolatility = 0.04 * stock.volatility
        const change = totalBias * stock.price * baseVolatility * newsVolatility

        let newPrice = Math.max(0.01, stock.price + change)
        newPrice = Math.round(newPrice * 100) / 100

        // Bankruptcy check - higher chance when price is very low
        if (newPrice < BANKRUPTCY_THRESHOLD) {
          // Chance increases as price approaches zero
          const bankruptcyMod = 1 + (BANKRUPTCY_THRESHOLD - newPrice) / BANKRUPTCY_THRESHOLD
          if (Math.random() < BANKRUPTCY_CHANCE * bankruptcyMod) {
            return { ...stock, price: 0, failed: true }
          }
        }

        const newHistory = [...stock.priceHistory, newPrice].slice(-MAX_HISTORY)
        return {
          ...stock,
          price: newPrice,
          priceHistory: newHistory,
          trend: newTrend,
          trendMomentum: newMomentum,
        }
      })

      return newStocks
    })
  }, [activeEffects])

  // Handle failed stocks - clear portfolio and replace
  useEffect(() => {
    const failedStock = stocks.find(s => s.failed && portfolio[s.id] && portfolio[s.id] > 0)
    if (failedStock) {
      setFailedStockAlert(`${failedStock.name} (${failedStock.ticker}) has gone bankrupt! You lost ${portfolio[failedStock.id]} shares.`)
      setPortfolio(prev => {
        const updated = { ...prev }
        delete updated[failedStock.id]
        return updated
      })
      if (selectedStock === failedStock.id) {
        setSelectedStock(null)
      }
    }
  }, [stocks, portfolio, selectedStock])

  // Replace failed stocks after alert
  useEffect(() => {
    const hasFailedStocks = stocks.some(s => s.failed)
    if (hasFailedStocks) {
      const timer = setTimeout(() => {
        setStocks(prev => prev.map(stock => {
          if (stock.failed) {
            usedNames.delete(stock.name)
            trendShiftsRef.current.delete(stock.id)
            // 30% chance replacement starts with negative trend too
            return createStock(stock.sector, Math.random() < 0.3)
          }
          return stock
        }))
        setFailedStockAlert(null)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [stocks])

  // Decrement effect durations
  useEffect(() => {
    if (isPaused || activeEffects.length === 0) return

    const timer = setTimeout(() => {
      setActiveEffects(prev =>
        prev.map(e => ({ ...e, duration: e.duration - 1 }))
          .filter(e => e.duration > 0)
      )
    }, speed)

    return () => clearTimeout(timer)
  }, [activeEffects, speed, isPaused, stocks])

  // Price update loop
  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(updatePrices, speed)
    return () => clearInterval(interval)
  }, [speed, isPaused, updatePrices])

  // News generation
  useEffect(() => {
    if (isPaused) return
    const scheduleNews = () => {
      const delay = (Math.random() * 8 + 4) * speed
      return setTimeout(() => {
        generateNews()
        scheduleNews()
      }, delay)
    }
    const timer = scheduleNews()
    return () => clearTimeout(timer)
  }, [speed, isPaused, generateNews])

  const buy = (amount: number) => {
    if (!selected || selected.failed) return
    const maxAffordable = Math.floor(cash / selected.price)
    const toBuy = amount === -1 ? maxAffordable : Math.min(amount, maxAffordable)
    if (toBuy > 0) {
      setCash(prev => Math.round((prev - toBuy * selected.price) * 100) / 100)
      setPortfolio(prev => ({ ...prev, [selected.id]: (prev[selected.id] || 0) + toBuy }))
    }
  }

  const sell = (amount: number) => {
    if (!selected) return
    const owned = portfolio[selected.id] || 0
    const toSell = amount === -1 ? owned : Math.min(amount, owned)
    if (toSell > 0) {
      setCash(prev => Math.round((prev + toSell * selected.price) * 100) / 100)
      setPortfolio(prev => ({ ...prev, [selected.id]: prev[selected.id] - toSell }))
    }
  }

  const reset = () => {
    usedNames.clear()
    trendShiftsRef.current.clear()
    setStocks(createInitialStocks())
    setPortfolio({})
    setCash(INITIAL_CASH)
    setNews([])
    setActiveEffects([])
    setSelectedStock(null)
    setFailedStockAlert(null)
  }

  // Mini chart for stock list
  const renderMiniChart = (stock: Stock) => {
    const w = 60, h = 24, p = 2
    const history = stock.priceHistory
    if (history.length < 2) return null

    const min = Math.min(...history) * 0.98
    const max = Math.max(...history) * 1.02
    const range = max - min || 1

    const points = history.map((price, i) => {
      const x = p + (i / (history.length - 1)) * (w - 2 * p)
      const y = h - p - ((price - min) / range) * (h - 2 * p)
      return `${x},${y}`
    }).join(' ')

    const isUp = history[history.length - 1] >= history[0]

    return (
      <svg width={w} height={h}>
        <polyline fill="none" stroke={isUp ? '#22c55e' : '#ef4444'} strokeWidth="1.5" points={points} />
      </svg>
    )
  }

  // Main chart for selected stock
  const renderMainChart = () => {
    if (!selected) return null

    const w = 500, h = 180, p = 30
    const history = selected.priceHistory
    const min = Math.min(...history) * 0.95
    const max = Math.max(...history) * 1.05
    const range = max - min || 1

    const points = history.map((price, i) => {
      const x = p + (i / (MAX_HISTORY - 1)) * (w - 2 * p)
      const y = h - p - ((price - min) / range) * (h - 2 * p)
      return `${x},${y}`
    }).join(' ')

    const isUp = history[history.length - 1] >= history[0]

    return (
      <svg width={w} height={h} className="chart">
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
          const y = p + ratio * (h - 2 * p)
          const priceLabel = (max - ratio * range).toFixed(2)
          return (
            <g key={ratio}>
              <line x1={p} y1={y} x2={w - p} y2={y} stroke="#333" strokeDasharray="4,4" />
              <text x={5} y={y + 4} fill="#888" fontSize="9">${priceLabel}</text>
            </g>
          )
        })}
        <polyline fill="none" stroke={isUp ? '#22c55e' : '#ef4444'} strokeWidth="2" points={points} />
        {history.length > 0 && (
          <circle
            cx={p + ((history.length - 1) / (MAX_HISTORY - 1)) * (w - 2 * p)}
            cy={h - p - ((selected.price - min) / range) * (h - 2 * p)}
            r="4"
            fill={isUp ? '#22c55e' : '#ef4444'}
          />
        )}
      </svg>
    )
  }

  const speedLabel = speed >= 1000 ? `${speed / 1000}s` : `${speed}ms`
  const sectors: Sector[] = ['Tech', 'Healthcare', 'Energy']

  return (
    <div className="app">
      <h1>Stock Trading Game</h1>

      {failedStockAlert && (
        <div className="bankruptcy-alert">
          {failedStockAlert}
        </div>
      )}

      <div className="main-layout">
        <div className="stocks-panel">
          <h2>Stocks</h2>
          {sectors.map(sector => (
            <div key={sector} className="sector-group">
              <div className="sector-header" style={{ borderColor: SECTOR_COLORS[sector] }}>
                <span className="sector-dot" style={{ background: SECTOR_COLORS[sector] }} />
                {sector}
              </div>
              {stocks.filter(s => s.sector === sector).map(stock => (
                <div
                  key={stock.id}
                  className={`stock-row ${selectedStock === stock.id ? 'selected' : ''} ${stock.failed ? 'failed' : ''} ${stock.price < BANKRUPTCY_THRESHOLD && !stock.failed ? 'danger' : ''}`}
                  onClick={() => !stock.failed && setSelectedStock(stock.id)}
                >
                  <div className="stock-info">
                    <span className="stock-ticker">{stock.ticker}</span>
                    <span className="stock-name">{stock.name}</span>
                  </div>
                  <div className="stock-right">
                    {renderMiniChart(stock)}
                    <span className={`stock-price ${stock.price < BANKRUPTCY_THRESHOLD && !stock.failed ? 'danger' : ''}`}>
                      {stock.failed ? 'FAILED' : `$${stock.price.toFixed(2)}`}
                    </span>
                    {(portfolio[stock.id] || 0) > 0 && (
                      <span className="stock-owned">{portfolio[stock.id]} owned</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="center-panel">
          {selected ? (
            <>
              <div className="selected-header">
                <div>
                  <h2>{selected.ticker}</h2>
                  <span className="selected-name">{selected.name}</span>
                  <span className="selected-sector" style={{ background: SECTOR_COLORS[selected.sector] }}>
                    {selected.sector}
                  </span>
                </div>
                <div className={`selected-price ${selected.price >= (selected.priceHistory[selected.priceHistory.length - 2] || selected.price) ? 'up' : 'down'}`}>
                  ${selected.price.toFixed(2)}
                  {selected.price < BANKRUPTCY_THRESHOLD && (
                    <span className="bankruptcy-warning">BANKRUPTCY RISK</span>
                  )}
                </div>
              </div>

              <div className="chart-container">
                {renderMainChart()}
              </div>

              <div className="trade-section">
                <div className="owned-info">
                  You own: <strong>{portfolio[selected.id] || 0}</strong> shares
                  (${((portfolio[selected.id] || 0) * selected.price).toFixed(2)})
                </div>
                <div className="trade-buttons">
                  <button onClick={() => buy(1)} disabled={cash < selected.price} className="buy-btn">Buy 1</button>
                  <button onClick={() => buy(10)} disabled={cash < selected.price} className="buy-btn">Buy 10</button>
                  <button onClick={() => buy(-1)} disabled={cash < selected.price} className="buy-btn">Buy Max</button>
                  <button onClick={() => sell(1)} disabled={!portfolio[selected.id]} className="sell-btn">Sell 1</button>
                  <button onClick={() => sell(10)} disabled={!portfolio[selected.id]} className="sell-btn">Sell 10</button>
                  <button onClick={() => sell(-1)} disabled={!portfolio[selected.id]} className="sell-btn">Sell All</button>
                </div>
              </div>
            </>
          ) : (
            <div className="no-selection">
              <p>Select a stock to trade</p>
            </div>
          )}

          <div className="portfolio-summary">
            <div className="stat">
              <span className="label">Cash</span>
              <span className="value">${cash.toFixed(2)}</span>
            </div>
            <div className="stat">
              <span className="label">Holdings</span>
              <span className="value">${totalSharesValue.toFixed(2)}</span>
            </div>
            <div className="stat">
              <span className="label">Total Value</span>
              <span className="value">${totalValue.toFixed(2)}</span>
            </div>
            <div className="stat">
              <span className="label">P/L</span>
              <span className={`value ${profitLoss >= 0 ? 'profit' : 'loss'}`}>
                {profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)} ({profitLossPercent}%)
              </span>
            </div>
          </div>

          <div className="controls-bar">
            <label>
              Speed: {speedLabel}
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={2100 - speed}
                onChange={(e) => setSpeed(2100 - Number(e.target.value))}
              />
            </label>
            <button onClick={() => setIsPaused(!isPaused)} className="pause-btn">
              {isPaused ? '▶ Play' : '⏸ Pause'}
            </button>
            <button onClick={reset} className="reset-btn">Reset</button>
          </div>
        </div>

        <div className="news-panel">
          <h2>Market News</h2>
          <div className="news-feed">
            {news.length === 0 ? (
              <div className="no-news">Waiting for news...</div>
            ) : (
              news.map((item) => {
                const isActive = activeEffects.some(e => e.id === item.id)
                return (
                  <div
                    key={item.id}
                    className={`news-item ${item.type} ${isActive ? 'active' : 'faded'}`}
                  >
                    <div className="news-icon">
                      {item.type === 'positive' ? '📈' : item.type === 'negative' ? '📉' : '📊'}
                    </div>
                    <div className="news-content">
                      <p className="news-headline">{item.headline}</p>
                      {isActive && (
                        <span className="effect-badge">
                          {item.targetSector ? `${item.targetSector} sector` : 'Single stock'} • {item.duration} ticks
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
