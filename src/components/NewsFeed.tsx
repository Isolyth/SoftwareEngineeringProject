import type { LiveNewsEvent } from '../types';

interface Props {
  liveNews: LiveNewsEvent[];
  activeEffects: LiveNewsEvent[];
}

export default function NewsFeed({ liveNews, activeEffects }: Props) {
  const activeIds = new Set(activeEffects.map((e) => e.id));

  return (
    <div className="news-feed-day">
      <div className="news-feed-header">MARKET NEWS</div>
      {liveNews.length === 0 ? (
        <div className="no-news-yet">Waiting for news...</div>
      ) : (
        liveNews.map((item) => {
          const isActive = activeIds.has(item.id);
          const activeEffect = isActive
            ? activeEffects.find((e) => e.id === item.id)
            : null;

          return (
            <div
              key={item.id}
              className={`news-item-day ${isActive ? 'active' : 'faded'} ${item.type}`}
            >
              <span className={`news-type-icon ${item.type}`}>
                {item.type === 'positive' ? '\u25B2' : item.type === 'negative' ? '\u25BC' : '\u25C6'}
              </span>
              <div>
                <div className="news-headline-day">{item.headline}</div>
                {isActive && activeEffect && (
                  <span className="news-effect-badge">
                    {item.targetSector ? `${item.targetSector}` : item.targetTicker} · {activeEffect.duration}t
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
