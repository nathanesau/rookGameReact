import { useState } from 'react';
import styles from './GameSetup.module.css';

interface GameSetupProps {
  onStartGame: (playerNames: string[]) => void;
}

export const GameSetup: React.FC<GameSetupProps> = ({ onStartGame }) => {
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '', '']);
  const [error, setError] = useState<string>('');

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all names are filled
    if (playerNames.some(name => name.trim() === '')) {
      setError('Please enter names for all four players');
      return;
    }

    // Validate unique names
    const uniqueNames = new Set(playerNames.map(name => name.trim().toLowerCase()));
    if (uniqueNames.size !== 4) {
      setError('Player names must be unique');
      return;
    }

    onStartGame(playerNames.map(name => name.trim()));
  };

  return (
    <div className={styles.container}>
      <div className={styles.setupCard} role="main">
        <h1 className={styles.title}>Rook Card Game</h1>
        <p className={styles.subtitle}>Enter player names to begin</p>

        <form onSubmit={handleSubmit} className={styles.form} aria-label="Game setup form">
          <div className={styles.teamsContainer}>
            {/* Team 1 */}
            <div className={styles.team}>
              <h2 className={styles.teamTitle}>Team 1</h2>
              <div className={styles.playerInputs}>
                <div className={styles.inputGroup}>
                  <label htmlFor="player-0" className={styles.label}>
                    Player 1 (Bottom)
                  </label>
                  <input
                    id="player-0"
                    type="text"
                    value={playerNames[0]}
                    onChange={(e) => handleNameChange(0, e.target.value)}
                    placeholder="Enter name"
                    className={styles.input}
                    maxLength={20}
                    required
                    aria-required="true"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="player-2" className={styles.label}>
                    Player 3 (Top)
                  </label>
                  <input
                    id="player-2"
                    type="text"
                    value={playerNames[2]}
                    onChange={(e) => handleNameChange(2, e.target.value)}
                    placeholder="Enter name"
                    className={styles.input}
                    maxLength={20}
                    required
                    aria-required="true"
                  />
                </div>
              </div>
            </div>

            {/* Team 2 */}
            <div className={styles.team}>
              <h2 className={styles.teamTitle}>Team 2</h2>
              <div className={styles.playerInputs}>
                <div className={styles.inputGroup}>
                  <label htmlFor="player-1" className={styles.label}>
                    Player 2 (Left)
                  </label>
                  <input
                    id="player-1"
                    type="text"
                    value={playerNames[1]}
                    onChange={(e) => handleNameChange(1, e.target.value)}
                    placeholder="Enter name"
                    className={styles.input}
                    maxLength={20}
                    required
                    aria-required="true"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="player-3" className={styles.label}>
                    Player 4 (Right)
                  </label>
                  <input
                    id="player-3"
                    type="text"
                    value={playerNames[3]}
                    onChange={(e) => handleNameChange(3, e.target.value)}
                    placeholder="Enter name"
                    className={styles.input}
                    maxLength={20}
                    required
                    aria-required="true"
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className={styles.error} role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          <button type="submit" className={styles.startButton} aria-label="Start game with entered player names">
            Start Game
          </button>
        </form>

        <div className={styles.info} role="note">
          <p>Partners sit opposite each other</p>
          <p>First team to 300 points wins!</p>
        </div>
      </div>
    </div>
  );
};
