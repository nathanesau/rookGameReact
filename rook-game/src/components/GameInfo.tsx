import { useGame } from '../contexts';
import { Card as CardComponent } from './Card';
import styles from './GameInfo.module.css';

export const GameInfo = () => {
  const { state } = useGame();
  const { phase, currentPlayerId, players, trumpColor, highBidder } = state;

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const bidderPlayer = highBidder ? players.find(p => p.id === highBidder) : null;

  const getPhaseDisplay = () => {
    switch (phase) {
      case 'setup':
        return 'Setting up game...';
      case 'dealing':
        return 'Dealing cards...';
      case 'roundStart':
        return 'Bidding Phase';
      case 'bidding':
      case 'biddingComplete':
        return 'Bidding Phase';
      case 'nestSelection':
      case 'trumpSelection':
      case 'partnerSelection':
        // Keep showing "Bidding Phase" during computer selections
        return 'Bidding Phase';
      case 'playing':
        return 'Playing Phase';
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
    
    if (phase === 'roundStart') {
      return `${currentPlayer.name}'s turn to bid`;
    }
    
    if (phase === 'bidding') {
      return `${currentPlayer.name}'s turn to bid`;
    }
    
    if (phase === 'biddingComplete' && bidderPlayer) {
      return `${bidderPlayer.name} won the bid`;
    }
    
    if (phase === 'nestSelection' || phase === 'trumpSelection' || phase === 'partnerSelection') {
      // Keep showing bid winner message during computer selections
      if (bidderPlayer) {
        return `${bidderPlayer.name} won the bid`;
      }
    }
    
    if (phase === 'playing') {
      return `${currentPlayer.name}'s turn`;
    }
    
    return '';
  };

  const getPlayingPhaseInfo = () => {
    if (phase !== 'playing' || !trumpColor) {
      return null;
    }
    
    const partnerCard = state.calledCard;
    
    return (
      <div className={styles.playingInfo} role="status" aria-label={`Trump ${trumpColor}${partnerCard ? `, Partner ${partnerCard.color} ${partnerCard.value}` : ''}`}>
        <span className={styles.infoItem}>
          <span className={styles.infoLabel}>Trump:</span>
          <span className={`${styles.trumpSuit} ${styles[trumpColor]}`}>
            {trumpColor.charAt(0).toUpperCase() + trumpColor.slice(1)}
          </span>
        </span>
        {partnerCard && (
          <span className={styles.infoItem}>
            <span className={styles.infoLabel}>Partner:</span>
            <span className={styles.partnerCardWrapper}>
              <CardComponent
                card={partnerCard}
                isDisabled={true}
                isSelected={false}
                onClick={() => {}}
              />
            </span>
          </span>
        )}
      </div>
    );
  };

  const getTrumpAndPartnerDisplay = () => {
    if (!trumpColor || phase === 'bidding' || phase === 'nestSelection' || phase === 'trumpSelection' || phase === 'partnerSelection' || phase === 'playing') {
      return null;
    }
    
    const partnerCard = state.calledCard;
    
    return (
      <div className={styles.trumpPartnerInfo} role="status" aria-label={`Trump suit is ${trumpColor}${partnerCard ? `, Partner card is ${partnerCard.color} ${partnerCard.value}` : ''}`}>
        <div className={styles.trumpInfo}>
          <span className={styles.label}>Trump:</span>
          <span className={`${styles.trumpSuit} ${styles[trumpColor]}`}>
            {trumpColor.charAt(0).toUpperCase() + trumpColor.slice(1)}
          </span>
        </div>
        {partnerCard && (
          <div className={styles.partnerInfo}>
            <span className={styles.label}>Partner:</span>
            <span className={styles.partnerCardWrapper}>
              <CardComponent
                card={partnerCard}
                isDisabled={true}
                isSelected={false}
                onClick={() => {}}
              />
            </span>
          </div>
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
      
      {getPlayingPhaseInfo()}
      {getTrumpAndPartnerDisplay()}
    </div>
  );
};
