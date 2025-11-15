import { useState, useEffect } from 'react';
import { Card as CardComponent } from './Card';
import type { Trick, Player } from '../types';
import styles from './TrickArea.module.css';

interface TrickAreaProps {
  trick: Trick | null;
  players: Player[];
  trumpColor: string | null;
}

export const TrickArea = ({ trick, players }: TrickAreaProps) => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [previousTrick, setPreviousTrick] = useState<Trick | null>(null);

  // Detect when trick is complete and trigger collection animation
  useEffect(() => {
    if (trick && trick.cards.size === 4 && trick.winnerId) {
      // Trick is complete, show winning animation briefly then collect
      const timer = setTimeout(() => {
        setIsCollecting(true);
        setPreviousTrick(trick);

        // Clear the trick after animation completes
        setTimeout(() => {
          setIsCollecting(false);
          setPreviousTrick(null);
        }, 600); // Match the collectTrick animation duration
      }, 1000); // Show winning card for 1 second

      return () => clearTimeout(timer);
    }
  }, [trick]);

  // Show the trick being collected or the current trick
  const displayTrick = isCollecting ? previousTrick : trick;

  if (!displayTrick || displayTrick.cards.size === 0) {
    return <div className={styles.trickArea} />;
  }

  // Get the winning card ID if trick is complete
  const winningCardId = displayTrick.winnerId
    ? displayTrick.cards.get(displayTrick.winnerId)?.id
    : null;

  // Map player positions to CSS classes
  const positionClasses = {
    0: styles.bottomPosition,
    1: styles.leftPosition,
    2: styles.topPosition,
    3: styles.rightPosition,
  };

  return (
    <div className={`${styles.trickArea} ${isCollecting ? styles.collecting : ''}`}>
      {players.map((player) => {
        const card = displayTrick.cards.get(player.id);
        if (!card) return null;

        const isWinning = winningCardId === card.id;
        const positionClass = positionClasses[player.position];

        return (
          <div
            key={player.id}
            className={`${styles.playedCard} ${positionClass} ${isWinning ? styles.winningCard : ''
              }`}
          >
            <CardComponent
              card={card}
              isDisabled={true}
              isSelected={false}
              onClick={() => { }}
            />
            <div className={styles.playerLabel}>{player.name}</div>
          </div>
        );
      })}
    </div>
  );
};
