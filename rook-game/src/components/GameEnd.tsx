import { useGame } from '../contexts';
import styles from './GameEnd.module.css';

export const GameEnd = () => {
  const { state } = useGame();
  const { scores, players, completedTricks } = state;

  // Find the winner (highest individual score)
  let winnerId: string | null = null;
  let highestScore = 0;
  scores.forEach((score, playerId) => {
    if (score > highestScore) {
      highestScore = score;
      winnerId = playerId;
    }
  });

  const winner = players.find(p => p.id === winnerId);

  // Sort players by score for display
  const sortedPlayers = [...players].sort((a, b) => {
    const scoreA = scores.get(a.id) || 0;
    const scoreB = scores.get(b.id) || 0;
    return scoreB - scoreA; // Descending order
  });

  // Calculate game statistics
  const totalRounds = Math.ceil(completedTricks.length / 13); // Each round has 13 tricks
  const secondPlace = sortedPlayers[1];
  const secondPlaceScore = scores.get(secondPlace?.id) || 0;
  const pointDifference = highestScore - secondPlaceScore;

  const handleNewGame = () => {
    // Reset to setup phase for a new game
    window.location.reload(); // Simple approach - reload the page
  };

  return (
    <div className={styles.gameEnd} role="main">
      <div className={styles.container}>
        {/* Victory Message */}
        <div className={styles.victorySection} role="region" aria-label="Game results">
          <h1 className={styles.victoryTitle}>Game Over!</h1>
          {winner && (
            <>
              <div className={styles.trophy} aria-hidden="true">🏆</div>
              <h2 className={styles.winnerName}>{winner.name}</h2>
              <p className={styles.winnerSubtext}>Wins the Game!</p>
              <div className={styles.winningScore}>{highestScore} Points</div>
            </>
          )}
        </div>

        {/* Final Scores */}
        <div className={styles.scoresSection} role="region" aria-label="Final scores">
          <h3 className={styles.sectionTitle}>Final Standings</h3>
          <div className={styles.scoreCards}>
            {sortedPlayers.map((player, index) => {
              const playerScore = scores.get(player.id) || 0;
              const isWinner = player.id === winnerId;
              
              return (
                <div 
                  key={player.id}
                  className={`${styles.scoreCard} ${isWinner ? styles.winner : ''}`} 
                  role="article" 
                  aria-label={`${index + 1}. ${player.name}: ${playerScore} points${isWinner ? ', Winner!' : ''}`}
                >
                  <div className={styles.placement}>{index + 1}</div>
                  <div className={styles.playerName}>
                    {player.name}
                    {player.id === 'player-0' && <span className={styles.youBadge}>YOU</span>}
                  </div>
                  <div className={styles.finalScore} aria-label={`${playerScore} points`}>{playerScore}</div>
                  {isWinner && <div className={styles.winnerBadge} role="status">Winner!</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Game Statistics */}
        <div className={styles.statsSection} role="region" aria-label="Game statistics">
          <h3 className={styles.sectionTitle}>Game Statistics</h3>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Rounds Played:</span>
              <span className={styles.statValue} aria-label={`${totalRounds} rounds played`}>{totalRounds}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Winning Margin:</span>
              <span className={styles.statValue} aria-label={`${pointDifference} point margin`}>{pointDifference}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Tricks:</span>
              <span className={styles.statValue} aria-label={`${completedTricks.length} total tricks`}>{completedTricks.length}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button 
            className={styles.newGameButton} 
            onClick={handleNewGame}
            type="button"
            aria-label="Start a new game"
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  );
};
