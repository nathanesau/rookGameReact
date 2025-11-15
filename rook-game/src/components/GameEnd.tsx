import { useGame } from '../contexts';
import type { TeamId } from '../types';
import styles from './GameEnd.module.css';

export const GameEnd = () => {
  const { state } = useGame();
  const { scores, players, completedTricks } = state;

  // Get team scores
  const team1Score = scores.get('team1') || 0;
  const team2Score = scores.get('team2') || 0;

  // Determine winning team
  const team1Won = team1Score >= 300 && team1Score > team2Score;
  const team2Won = team2Score >= 300 && team2Score > team1Score;
  const winningTeam: TeamId | null = team1Won ? 'team1' : team2Won ? 'team2' : null;

  // Get team names (using player names)
  const team1Players = players.filter(p => p.teamId === 'team1');
  const team2Players = players.filter(p => p.teamId === 'team2');

  const team1Name = team1Players.length > 0
    ? `${team1Players[0].name} & ${team1Players[1]?.name || 'Partner'}`
    : 'Team 1';
  const team2Name = team2Players.length > 0
    ? `${team2Players[0].name} & ${team2Players[1]?.name || 'Partner'}`
    : 'Team 2';

  const winningTeamName = winningTeam === 'team1' ? team1Name : team2Name;

  // Calculate game statistics
  const totalRounds = Math.ceil(completedTricks.length / 13); // Each round has 13 tricks
  const pointDifference = Math.abs(team1Score - team2Score);

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
          {winningTeam && (
            <>
              <div className={styles.trophy} aria-hidden="true">🏆</div>
              <h2 className={styles.winnerName}>{winningTeamName}</h2>
              <p className={styles.winnerSubtext}>Wins the Game!</p>
            </>
          )}
        </div>

        {/* Final Scores */}
        <div className={styles.scoresSection} role="region" aria-label="Final scores">
          <h3 className={styles.sectionTitle}>Final Scores</h3>
          <div className={styles.scoreCards}>
            <div className={`${styles.scoreCard} ${team1Won ? styles.winner : ''}`} role="article" aria-label={`Team 1 final score: ${team1Score} points`}>
              <div className={styles.teamName}>{team1Name}</div>
              <div className={styles.finalScore} aria-label={`${team1Score} points`}>{team1Score}</div>
              {team1Won && <div className={styles.winnerBadge} role="status">Winner!</div>}
            </div>
            <div className={`${styles.scoreCard} ${team2Won ? styles.winner : ''}`} role="article" aria-label={`Team 2 final score: ${team2Score} points`}>
              <div className={styles.teamName}>{team2Name}</div>
              <div className={styles.finalScore} aria-label={`${team2Score} points`}>{team2Score}</div>
              {team2Won && <div className={styles.winnerBadge} role="status">Winner!</div>}
            </div>
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
              <span className={styles.statLabel}>Point Difference:</span>
              <span className={styles.statValue} aria-label={`${pointDifference} point difference`}>{pointDifference}</span>
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
