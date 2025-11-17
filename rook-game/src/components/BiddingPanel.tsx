import { useState } from 'react';
import type { Bid, PlayerId, Card } from '../types';
import styles from './BiddingPanel.module.css';

interface BiddingPanelProps {
  currentBid: Bid | null;
  currentPlayerId: PlayerId;
  humanPlayerId: PlayerId;
  passedPlayers: Set<PlayerId>;
  playerHand: Card[];
  players: Array<{ id: PlayerId; name: string }>;
  onPlaceBid: (amount: number) => void;
  onPass: () => void;
  onCallRedeal: () => void;
}

export const BiddingPanel = ({
  currentBid,
  currentPlayerId,
  humanPlayerId,
  passedPlayers,
  playerHand,
  players,
  onPlaceBid,
  onPass,
  onCallRedeal,
}: BiddingPanelProps) => {
  const minBid = currentBid ? currentBid.amount + 5 : 40;
  const maxBid = 120;
  const [bidAmount, setBidAmount] = useState(minBid);

  const isMyTurn = currentPlayerId === humanPlayerId;
  const hasPassedAlready = passedPlayers.has(humanPlayerId);
  const canBid = isMyTurn && !hasPassedAlready;

  // Check if player has no point cards (can call redeal)
  const hasNoPointCards = !playerHand.some(card => card.points > 0);
  const canCallRedeal = hasNoPointCards && !hasPassedAlready;

  const handleIncrement = () => {
    if (bidAmount < maxBid) {
      setBidAmount(bidAmount + 5);
    }
  };

  const handleDecrement = () => {
    if (bidAmount > minBid) {
      setBidAmount(bidAmount - 5);
    }
  };

  const handleBid = () => {
    if (canBid && bidAmount >= minBid && bidAmount <= maxBid) {
      onPlaceBid(bidAmount);
    }
  };

  const handlePass = () => {
    if (canBid) {
      onPass();
    }
  };

  const handleCallRedeal = () => {
    if (canCallRedeal) {
      onCallRedeal();
    }
  };

  // Update bidAmount when minBid changes
  if (bidAmount < minBid) {
    setBidAmount(minBid);
  }

  return (
    <div className={styles.biddingPanel} role="region" aria-label="Bidding controls">
      <div className={styles.header}>
        <h3>Bidding Phase</h3>
        <div className={styles.playerTurns}>
          {players.map(player => {
            const hasPassed = passedPlayers.has(player.id);
            const isCurrentTurn = player.id === currentPlayerId;
            return (
              <span
                key={player.id}
                className={`${styles.playerName} ${isCurrentTurn ? styles.currentTurn : ''} ${hasPassed ? styles.passed : ''}`}
              >
                {player.name}
              </span>
            );
          })}
        </div>
        <div className={styles.currentBid} aria-live="polite">
          Current Bid: <strong>{currentBid ? currentBid.amount : 'None'}</strong>
        </div>
      </div>

      <div className={styles.mainContent}>
        {!hasPassedAlready ? (
          <div className={styles.controls}>
              <div className={styles.bidSelector} role="group" aria-label="Bid amount selector">
                <button
                  onClick={handleDecrement}
                  disabled={!canBid || bidAmount <= minBid}
                  className={styles.adjustButton}
                  aria-label={`Decrease bid to ${bidAmount - 5}`}
                  type="button"
                >
                  −
                </button>
                <div className={styles.bidDisplay} role="status" aria-live="polite" aria-atomic="true">
                  <span className={styles.bidAmount} aria-label={`Current bid amount: ${bidAmount} points`}>{bidAmount}</span>
                  <span className={styles.bidLabel} aria-hidden="true">points</span>
                </div>
                <button
                  onClick={handleIncrement}
                  disabled={!canBid || bidAmount >= maxBid}
                  className={styles.adjustButton}
                  aria-label={`Increase bid to ${bidAmount + 5}`}
                  type="button"
                >
                  +
                </button>
              </div>

              <div className={styles.bidInfo}>
                <span>Min: {minBid}</span>
                <span>Max: {maxBid}</span>
              </div>

              <div className={styles.actions}>
                <button
                  onClick={handleBid}
                  disabled={!canBid}
                  className={`${styles.button} ${styles.bidButton}`}
                  type="button"
                  aria-label={`Place bid of ${bidAmount} points`}
                >
                  Place Bid
                </button>
                <button
                  onClick={handlePass}
                  disabled={!canBid}
                  className={`${styles.button} ${styles.passButton}`}
                  type="button"
                  aria-label="Pass on bidding"
                >
                  Pass
                </button>
              </div>

              {canCallRedeal && (
                <div className={styles.redealSection} role="region" aria-label="Redeal option">
                  <button
                    onClick={handleCallRedeal}
                    className={`${styles.button} ${styles.redealButton}`}
                    type="button"
                    aria-label="Call for redeal because you have no point cards"
                  >
                    Call Redeal
                  </button>
                  <span className={styles.redealHint} aria-live="polite">No point cards in hand</span>
                </div>
              )}


          </div>
        ) : (
          <div className={styles.passedMessage} role="status" aria-live="polite">
            You have passed. Waiting for bidding to complete...
          </div>
        )}
      </div>
    </div>
  );
};
