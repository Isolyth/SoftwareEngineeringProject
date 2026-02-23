interface Props {
  goal: number;
  portfolioValue: number;
  todayPL: number;
  cash: number;
}

export default function InfoPanel({ goal, portfolioValue, todayPL, cash }: Props) {
  const isUp = todayPL >= 0;
  const progress = Math.min((portfolioValue / goal) * 100, 100);

  return (
    <div className="info-panel">
      <div className="info-row">
        <span className="info-label">GOAL</span>
        <span className="info-value goal-value">${goal.toLocaleString()}</span>
      </div>
      <div className="goal-bar">
        <div className="goal-bar-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="info-row">
        <span className="info-label">PORTFOLIO</span>
        <span className="info-value">${portfolioValue.toFixed(2)}</span>
      </div>
      <div className="info-row">
        <span className="info-label">TODAY P/L</span>
        <span className={`info-value ${isUp ? 'up' : 'down'}`}>
          {isUp ? '+' : ''}${todayPL.toFixed(2)}
        </span>
      </div>
      <div className="info-row">
        <span className="info-label">CASH</span>
        <span className="info-value">${cash.toFixed(2)}</span>
      </div>
    </div>
  );
}
