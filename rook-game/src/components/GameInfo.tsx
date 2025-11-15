import { useGame } from '../contexts';
import styles from './GameInfo.module.css';

export const GameInfo = () => {
  const { state } = useGame();
  const { phase, currentPlayerId, players, trumpColor, currentBid, highBidder } = state;

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const bidderPlayer = highBidder ? players.find(p => p.id === highBidder) : null;

  const getPhaseDisplay = () => {
    switch (phase) {
      case 'setup':
        return 'Setting up game...';
      case 'dealing':
        return 'Dealing cards...';
      case 'bidding':
        return 'Bidding Phase';
      case 'nestSelection':
        return 'High Bidder Selecting Cards';
      case 'trumpSelection':
        return 'Selecting Trump Suit';
      case 'playing':
        return 'Playing Tricks';
      case 'roundEnd':
        return 'Round Complete';
      case 'gameEnd':
        return 'Game Over';
      default:
        return '';
    }
  };

  const getTurnDisplay = () => {
    if (!currentPlayer) return '';
    
    if (phase === 'bidding') {
      return `${currentPlayer.name}'s turn to bid`;
    }
    
    if (phase === 'playing') {
      return `${currentPlayer.name}'s turn`;
    }
    
    if (phase === 'nestSelection' && bidderPlayer) {
      return `${bidderPlayer.name} is selecting cards to discard`;
    }
    
    if (phase === 'trumpSelection' && bidderPlayer) {
      return `${bidderPlayer.name} is selecting trump`;
    }
    
    return '';
  };

  const getTrumpDisplay = () => {
    if (!trumpColor || phase === 'bidding' || phase === 'nestSelection' || phase === 'trumpSelection') {
      return null;
    }
    
    return (
      <div className={styles.trumpInfo} role="status" aria-label={`Trump suit is ${trumpColor}`}>
        <span className={styles.label}>Trump:</span>
        <span className={`${styles.trumpSuit} ${styles[trumpColor]}`}>
          {trumpColor.charAt(0).toUpperCase() + trumpColor.slice(1)}
        </span>
      </div>
    );
  };

  const getBidDisplay = () => {
    if (phase !== 'bidding' || !currentBid) {
      return null;
    }
    
    const bidder = players.find(p => p.id === currentBid.playerId);
    
    return (
      <div className={styles.bidInfo} role="status" aria-live="polite" aria-label={`Current bid is ${currentBid.amount} points${bidder ? ` by ${bidder.name}` : ''}`}>
        <span className={styles.label}>Current Bid:</span>
        <span className={styles.bidAmount}>{currentBid.amount}</span>
        {bidder && (
          <span className={styles.bidder}>by {bidder.name}</span>
        )}
      </div>
    );
  };

  return (
    <div className={styles.gameInfo} role="region" aria-label="Game status information">
      <div className={styles.phaseDisplay} role="status" aria-live="polite">
        {getPhaseDisplay()}
      </div>
      
      {getTurnDisplay() && (
        <div className={styles.turnDisplay} role="status" aria-live="polite" aria-atomic="true">
          {getTurnDisplay()}
        </div>
      )}
      
      {getBidDisplay()}
      {getTrumpDisplay()}
    </div>
  );
};
