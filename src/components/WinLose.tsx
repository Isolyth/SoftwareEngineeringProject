interface Props {
  won: boolean;
  portfolioValue: number;
  goal: number;
  day: number;
  onRestart: () => void;
}

export default function WinLose({ won, portfolioValue, goal, day, onRestart }: Props) {
  return (
    <div className="modal-overlay">
      <div className="endgame">
        <h1 className={`endgame-title ${won ? 'win' : 'lose'}`}>
          {won ? 'YOU WIN!' : 'GAME OVER'}
        </h1>
        <p className="endgame-sub">
          {won
            ? `You reached your goal of $${goal.toLocaleString()} on Day ${day}!`
            : `You failed to reach $${goal.toLocaleString()} in ${day} days.`}
        </p>
        <div className="endgame-stats">
          <div>Final Portfolio: <strong>${portfolioValue.toFixed(2)}</strong></div>
          <div>Goal: <strong>${goal.toLocaleString()}</strong></div>
        </div>
        <button className="endgame-btn" onClick={onRestart}>
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
}
