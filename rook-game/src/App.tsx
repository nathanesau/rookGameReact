import { useEffect } from 'react';
import { GameBoard, GameSetup, GameEnd } from './components';
import { useGame } from './contexts';
import './App.css';

function App() {
  const { state, dispatch } = useGame();

  const handleStartGame = (playerNames: string[]) => {
    dispatch({
      type: 'INITIALIZE_GAME',
      payload: { playerNames },
    });
  };

  // Auto-deal cards after initialization
  useEffect(() => {
    if (state.phase === 'dealing' && state.players.length > 0 && state.players[0].hand.length === 0) {
      // Small delay to show dealing phase
      const timer = setTimeout(() => {
        dispatch({ type: 'DEAL_CARDS' });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.players, dispatch]);

  // Show setup screen if in setup phase
  if (state.phase === 'setup') {
    return <GameSetup onStartGame={handleStartGame} />;
  }

  // Show game end screen if game is over
  if (state.phase === 'gameEnd') {
    return <GameEnd />;
  }

  return <GameBoard />;
}

export default App;
