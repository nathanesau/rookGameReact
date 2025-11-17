import { useState } from 'react';
import styles from './GameSetup.module.css';

interface GameSetupProps {
  onStartGame: (playerNames: string[]) => void;
  winningScore?: number;
}

export const GameSetup: React.FC<GameSetupProps> = ({ onStartGame, winningScore = 500 }) => {
  const [playerName, setPlayerName] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate player name is filled
    if (playerName.trim() === '') {
      setError('Please enter your name');
      return;
    }

    // Create player names array with human player and computer players
    const allPlayerNames = [
      playerName.trim(),
      'Player 2',
      'Player 3',
      'Player 4'
    ];

    onStartGame(allPlayerNames);
  };

  return (
    <div className={styles.container}>
      <div className={styles.setupCard} role="main">
        <h1 className={styles.title}>Rook Card Game</h1>
        <p className={styles.subtitle}>Enter your name to begin</p>

        <form onSubmit={handleSubmit} className={styles.form} aria-label="Game setup form">
          <div className={styles.inputGroup}>
            <label htmlFor="player-name" className={styles.label}>
              Your Name
            </label>
            <input
              id="player-name"
              type="text"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                setError('');
              }}
              placeholder="Enter your name"
              className={styles.input}
              maxLength={20}
              required
              aria-required="true"
              autoFocus
            />
          </div>

          {error && (
            <div className={styles.error} role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          <button type="submit" className={styles.startButton} aria-label="Start game">
            Start Game
          </button>
        </form>

        <div className={styles.info} role="note">
          <p>You'll play with 3 computer players</p>
          <p>First player to <span className={styles.winningScore}>{winningScore}</span> points wins!</p>
        </div>
      </div>
    </div>
  );
};
