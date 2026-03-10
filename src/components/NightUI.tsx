import type { GameState } from '../types';

interface Props {
  state: GameState;
  portfolioValue: number;
  onSleep: () => void;
}

export default function NightUI({ state, portfolioValue, onSleep }: Props) {
  return (
    <div className="night-ui">
      <div className="night-header">
        <h1 className="night-title">FINANCE CORNER</h1>
        <div className="night-dots">
          {Array.from({ length: state.maxDays }, (_, i) => (
            <span key={i} className={`dot ${i < state.day ? 'filled' : ''}`} />
          ))}
        </div>
      </div>

      <div className="night-content">
        <div className="news-main">
          {state.news.map((article, i) => (
            <div key={i} className="news-card">
              <h2 className="news-headline">{article.headline}</h2>
              <p className="news-blurb">{article.blurb}</p>
              <div className="news-tags">
                {article.tags.map((tag) => (
                  <span key={tag} className="news-tag">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="night-sidebar">
          <div className="sidebar-scroll">
            <div className="sidebar-section">
              <h3>TODAY'S NEWS</h3>
              {state.news.map((article, i) => (
                <div key={i} className="sidebar-item">
                  {article.headline.substring(0, 30)}...
                </div>
              ))}
            </div>
            <div className="sidebar-section">
              <h3>PORTFOLIO</h3>
              <div className="sidebar-value">${portfolioValue.toFixed(2)}</div>
              <div className="sidebar-goal">Goal: ${state.goal.toLocaleString()}</div>
            </div>
          </div>
          <button className="sleep-btn" onClick={onSleep}>
            GO TO SLEEP
          </button>
        </div>
      </div>
    </div>
  );
}
