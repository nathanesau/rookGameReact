import { useEffect, useState } from 'react';
import { GameBoard, GameSetup, GameEnd, HelpModal, LoadingSpinner } from './components';
import { SettingsModal } from './components/SettingsModal';
import { FullscreenButton } from './components/FullscreenButton';
import { useGame } from './contexts';
import './App.css';

function App() {
  const { state, dispatch } = useGame();
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDealing, setIsDealing] = useState(false);
  const [winningScore, setWinningScore] = useState(500);
  const [nestSelectableCards, setNestSelectableCards] = useState(3);

  const handleStartGame = (playerNames: string[]) => {
    dispatch({
      type: 'INITIALIZE_GAME',
      payload: { playerNames, winningScore, nestSelectableCards },
    });
  };

  // Auto-deal cards after initialization
  useEffect(() => {
    if (state.phase === 'dealing' && state.players.length > 0 && state.players[0].hand.length === 0) {
      setIsDealing(true);
      
      // Small delay to show dealing phase
      const timer = setTimeout(() => {
        dispatch({ type: 'DEAL_CARDS' });
        setIsDealing(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.players, dispatch]);

  const handleSaveSettings = (newWinningScore: number, newNestSelectableCards: number) => {
    setWinningScore(newWinningScore);
    setNestSelectableCards(newNestSelectableCards);
  };

  // Show setup screen if in setup phase
  if (state.phase === 'setup') {
    return (
      <>
        <GameSetup onStartGame={handleStartGame} winningScore={winningScore} />
        <button
          className="settings-button"
          onClick={() => setShowSettings(true)}
          aria-label="Show game settings"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
        <button
          className="help-button"
          onClick={() => setShowHelp(true)}
          aria-label="Show game instructions"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>
        <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} winningScore={winningScore} nestSelectableCards={nestSelectableCards} />
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          winningScore={winningScore}
          nestSelectableCards={nestSelectableCards}
          onSave={handleSaveSettings}
        />
      </>
    );
  }

  // Show game end screen if game is over
  if (state.phase === 'gameEnd') {
    return (
      <>
        <GameEnd />
        <button
          className="help-button"
          onClick={() => setShowHelp(true)}
          aria-label="Show game instructions"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>
        <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} winningScore={winningScore} nestSelectableCards={nestSelectableCards} />
      </>
    );
  }

  // Show loading spinner during dealing
  if (isDealing) {
    return (
      <div className="loading-container">
        <LoadingSpinner size="large" message="Dealing cards..." />
      </div>
    );
  }

  // During gameplay, HelpButton component in GameTable handles the help button
  return (
    <>
      <FullscreenButton />
      <GameBoard />
    </>
  );
}

export default App;
