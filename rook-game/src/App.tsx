import { useEffect, useState } from 'react';
import { GameBoard, GameSetup, GameEnd, HelpModal, ToastContainer, LoadingSpinner } from './components';
import { useGame } from './contexts';
import { useToast } from './hooks/useToast';
import './App.css';

function App() {
  const { state, dispatch } = useGame();
  const { toasts, removeToast, success, info } = useToast();
  const [showHelp, setShowHelp] = useState(false);
  const [isDealing, setIsDealing] = useState(false);

  const handleStartGame = (playerNames: string[]) => {
    dispatch({
      type: 'INITIALIZE_GAME',
      payload: { playerNames },
    });
    success('Game started! Good luck!');
  };

  // Auto-deal cards after initialization
  useEffect(() => {
    if (state.phase === 'dealing' && state.players.length > 0 && state.players[0].hand.length === 0) {
      setIsDealing(true);
      info('Dealing cards...');
      
      // Small delay to show dealing phase
      const timer = setTimeout(() => {
        dispatch({ type: 'DEAL_CARDS' });
        setIsDealing(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.players, dispatch, info]);

  // Show setup screen if in setup phase
  if (state.phase === 'setup') {
    return (
      <>
        <GameSetup onStartGame={handleStartGame} />
        <button
          className="help-button"
          onClick={() => setShowHelp(true)}
          aria-label="Show game instructions"
        >
          ?
        </button>
        <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
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
          ?
        </button>
        <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  // Show loading spinner during dealing
  if (isDealing) {
    return (
      <div className="loading-container">
        <LoadingSpinner size="large" message="Dealing cards..." />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    );
  }

  return (
    <>
      <GameBoard />
      <button
        className="help-button"
        onClick={() => setShowHelp(true)}
        aria-label="Show game instructions"
      >
        ?
      </button>
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

export default App;
