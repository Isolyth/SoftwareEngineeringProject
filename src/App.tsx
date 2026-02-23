import { useGameState } from './gameState';
import DayUI from './components/DayUI';
import NightUI from './components/NightUI';
import SearchUI from './components/SearchUI';
import WinLose from './components/WinLose';
import './App.css';

function App() {
  const {
    state,
    portfolioValue,
    todayPL,
    selectStock,
    buy,
    sell,
    goToSearch,
    goBackFromSearch,
    sleep,
    restart,
  } = useGameState();

  return (
    <div className="app">
      {state.screen === 'day' && (
        <DayUI
          state={state}
          portfolioValue={portfolioValue}
          todayPL={todayPL}
          onSelectStock={selectStock}
          onBuy={buy}
          onSell={sell}
          onSearch={goToSearch}
        />
      )}

      {state.screen === 'night' && (
        <NightUI
          state={state}
          portfolioValue={portfolioValue}
          onSleep={sleep}
        />
      )}

      {state.screen === 'search' && (
        <SearchUI
          state={state}
          portfolioValue={portfolioValue}
          todayPL={todayPL}
          onBack={goBackFromSearch}
          onBuy={buy}
          onSelectStock={selectStock}
        />
      )}

      {state.screen === 'win' && (
        <WinLose
          won={true}
          portfolioValue={portfolioValue}
          goal={state.goal}
          day={state.day}
          onRestart={restart}
        />
      )}

      {state.screen === 'lose' && (
        <WinLose
          won={false}
          portfolioValue={portfolioValue}
          goal={state.goal}
          day={state.day}
          onRestart={restart}
        />
      )}
    </div>
  );
}

export default App;
