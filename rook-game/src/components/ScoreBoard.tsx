import { useState } from 'react';
import { useGame } from '../contexts';
import type { TeamId } from '../types';
import styles from './ScoreBoard.module.css';

export const ScoreBoard = () => {
  const { state } = useGame();
  const { scores, roundScores, currentBid, highBidder, phase, players, partnerRevealed, scoreHistory } = state;
  const [showHistory, setShowHistory] = useState(false);

  const isGameEnd = phase === 'gameEnd';
  const isRoundEnd = phase === 'roundEnd';

  // Get bidding team information
  let biddingTeam: TeamId | null = null;
  let bidAmount: number | null = null;

  if (highBidder && currentBid) {
    const bidder = players.find(p => p.id === highBidder);
    if (bidder && bidder.teamId) {
      biddingTeam = bidder.teamId;
      bidAmount = currentBid.amount;
    }
  }

  // Find winner if game ended
  let winnerId: string | null = null;
  let highestScore = 0;
  if (isGameEnd) {
    scores.forEach((score, playerId) => {
      if (score > highestScore) {
        highestScore = score;
        winnerId = playerId;
      }
    });
  }

  // Group players by team for display (only if teams are revealed)
  const team1Players = partnerRevealed ? players.filter(p => p.teamId === 'team1') : [];
  const team2Players = partnerRevealed ? players.filter(p => p.teamId === 'team2') : [];

  const team1RoundScore = roundScores.get('team1') || 0;
  const team2RoundScore = roundScores.get('team2') || 0;

  return (
    <div className={styles.scoreBoard} role="region" aria-label="Score board">
      <div className={styles.header}>
        <h2 className={styles.title}>Scores</h2>
        {scoreHistory.length > 0 && (
          <button
            className={styles.historyButton}
            onClick={() => setShowHistory(!showHistory)}
            aria-label={showHistory ? 'Hide score history' : 'Show score history'}
          >
            {showHistory ? 'Current' : 'History'}
          </button>
        )}
      </div>

      {showHistory && scoreHistory.length > 0 ? (
        <div className={styles.historyView}>
          <h3 className={styles.historyTitle}>Score History</h3>
          <div className={styles.historyTable}>
            <table>
              <thead>
                <tr>
                  <th>Round</th>
                  {players.map(player => (
                    <th key={player.id}>{player.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scoreHistory.map((round) => (
                  <tr key={round.roundNumber}>
                    <td className={styles.roundCell}>
                      {round.roundNumber}
                      {round.bidMade !== null && (
                        <span className={round.bidMade ? styles.bidMadeIcon : styles.bidBrokenIcon}>
                          {round.bidMade ? '✓' : '✗'}
                        </span>
                      )}
                    </td>
                    {players.map(player => {
                      const score = round.playerScores.get(player.id) || 0;
                      const delta = round.roundDeltas.get(player.id) || 0;
                      const isBidder = round.bidderId === player.id;
                      return (
                        <td key={player.id} className={isBidder ? styles.bidderCell : ''}>
                          <div className={styles.scoreCell}>
                            <span className={styles.totalScore}>{score}</span>
                            <span className={delta >= 0 ? styles.positiveDelta : styles.negativeDelta}>
                              ({delta >= 0 ? '+' : ''}{delta})
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>

      {/* Show team grouping only if teams are revealed and in round/game end */}
      {partnerRevealed && (isRoundEnd || isGameEnd) && (
        <div className={styles.roundInfo}>
          <h3 className={styles.roundTitle}>Round Results</h3>
          <div className={styles.teams}>
            {/* Team 1 */}
            <div className={styles.team}>
              <div className={styles.teamHeader}>
                <h4 className={styles.teamName}>
                  {team1Players.map(p => p.name).join(' & ')}
                </h4>
                {biddingTeam === 'team1' && bidAmount && (
                  <span className={styles.bidBadge}>Bid: {bidAmount}</span>
                )}
              </div>
              <div className={styles.teamScore}>
                Round: <strong>{team1RoundScore > 0 ? `+${team1RoundScore}` : team1RoundScore}</strong>
              </div>
            </div>

            {/* Team 2 */}
            <div className={styles.team}>
              <div className={styles.teamHeader}>
                <h4 className={styles.teamName}>
                  {team2Players.map(p => p.name).join(' & ')}
                </h4>
                {biddingTeam === 'team2' && bidAmount && (
                  <span className={styles.bidBadge}>Bid: {bidAmount}</span>
                )}
              </div>
              <div className={styles.teamScore}>
                Round: <strong>{team2RoundScore > 0 ? `+${team2RoundScore}` : team2RoundScore}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

          {/* Individual Player Scores */}
          <div className={styles.playerScores}>
            <h3 className={styles.sectionTitle}>Individual Scores</h3>
            {players.map(player => {
              const playerScore = scores.get(player.id) || 0;
              const isWinner = isGameEnd && player.id === winnerId;
              
              return (
                <div 
                  key={player.id} 
                  className={`${styles.playerScore} ${isWinner ? styles.winner : ''}`}
                  role="article"
                  aria-label={`${player.name}: ${playerScore} points${isWinner ? ', Winner!' : ''}`}
                >
                  <div className={styles.playerName}>
                    {player.name}
                    {player.id === 'player-0' && <span className={styles.youBadge}>YOU</span>}
                  </div>
                  <div className={styles.scoreValue}>{playerScore}</div>
                  {isWinner && <div className={styles.winnerBadge}>Winner!</div>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
