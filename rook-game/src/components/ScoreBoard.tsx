import { useGame } from '../contexts';
import type { TeamId } from '../types';
import styles from './ScoreBoard.module.css';

export const ScoreBoard = () => {
  const { state } = useGame();
  const { scores, roundScores, currentBid, highBidder, phase, players } = state;

  // Get team scores
  const team1Score = scores.get('team1') || 0;
  const team2Score = scores.get('team2') || 0;
  const team1RoundScore = roundScores.get('team1') || 0;
  const team2RoundScore = roundScores.get('team2') || 0;

  // Determine if game has ended and which team won
  const isGameEnd = phase === 'gameEnd';
  const team1Won = isGameEnd && team1Score >= 300 && team1Score > team2Score;
  const team2Won = isGameEnd && team2Score >= 300 && team2Score > team1Score;

  // Get bidding team information
  let biddingTeam: TeamId | null = null;
  let bidAmount: number | null = null;

  if (highBidder && currentBid) {
    const bidder = players.find(p => p.id === highBidder);
    if (bidder) {
      biddingTeam = bidder.teamId;
      bidAmount = currentBid.amount;
    }
  }

  // Get team names (using player names)
  const team1Players = players.filter(p => p.teamId === 'team1');
  const team2Players = players.filter(p => p.teamId === 'team2');

  const team1Name = team1Players.length > 0
    ? `${team1Players[0].name} & ${team1Players[1]?.name || 'Partner'}`
    : 'Team 1';
  const team2Name = team2Players.length > 0
    ? `${team2Players[0].name} & ${team2Players[1]?.name || 'Partner'}`
    : 'Team 2';

  return (
    <div className={styles.scoreBoard} role="region" aria-label="Score board">
      <h2 className={styles.title}>Score</h2>

      <div className={styles.teams}>
        {/* Team 1 */}
        <div className={`${styles.team} ${team1Won ? styles.winner : ''}`} role="article" aria-label={`Team 1: ${team1Name}, total score ${team1Score} points`}>
          <div className={styles.teamHeader}>
            <h3 className={styles.teamName}>{team1Name}</h3>
            {biddingTeam === 'team1' && bidAmount && (
              <span className={styles.bidBadge} aria-label={`Bidding team with bid of ${bidAmount} points`}>Bid: {bidAmount}</span>
            )}
          </div>
          <div className={styles.scores}>
            <div className={styles.totalScore}>
              <span className={styles.scoreLabel}>Total:</span>
              <span className={styles.scoreValue} aria-label={`${team1Score} points`}>{team1Score}</span>
            </div>
            {(phase === 'playing' || phase === 'roundEnd') && team1RoundScore > 0 && (
              <div className={styles.roundScore}>
                <span className={styles.scoreLabel}>Round:</span>
                <span className={styles.scoreValue} aria-label={`${team1RoundScore} points this round`}>{team1RoundScore}</span>
              </div>
            )}
          </div>
          {team1Won && <div className={styles.winnerBadge} role="status">Winner!</div>}
        </div>

        {/* Team 2 */}
        <div className={`${styles.team} ${team2Won ? styles.winner : ''}`} role="article" aria-label={`Team 2: ${team2Name}, total score ${team2Score} points`}>
          <div className={styles.teamHeader}>
            <h3 className={styles.teamName}>{team2Name}</h3>
            {biddingTeam === 'team2' && bidAmount && (
              <span className={styles.bidBadge} aria-label={`Bidding team with bid of ${bidAmount} points`}>Bid: {bidAmount}</span>
            )}
          </div>
          <div className={styles.scores}>
            <div className={styles.totalScore}>
              <span className={styles.scoreLabel}>Total:</span>
              <span className={styles.scoreValue} aria-label={`${team2Score} points`}>{team2Score}</span>
            </div>
            {(phase === 'playing' || phase === 'roundEnd') && team2RoundScore > 0 && (
              <div className={styles.roundScore}>
                <span className={styles.scoreLabel}>Round:</span>
                <span className={styles.scoreValue} aria-label={`${team2RoundScore} points this round`}>{team2RoundScore}</span>
              </div>
            )}
          </div>
          {team2Won && <div className={styles.winnerBadge} role="status">Winner!</div>}
        </div>
      </div>
    </div>
  );
};
