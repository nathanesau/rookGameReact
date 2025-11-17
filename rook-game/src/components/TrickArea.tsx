import { useState, useEffect, useRef } from 'react';
import { useGame } from '../contexts';
import { Card as CardComponent } from './Card';
import type { Trick, Player } from '../types';
import styles from './TrickArea.module.css';

interface TrickAreaProps {
  trick: Trick | null;
  players: Player[];
  trumpColor: string | null;
}

export const TrickArea = ({ trick, players }: TrickAreaProps) => {
  const { state, dispatch } = useGame();
  const [isCollecting, setIsCollecting] = useState(false);
  const [showPointsMessage, setShowPointsMessage] = useState(false);
  const [trickPoints, setTrickPoints] = useState<number>(0);
  const [winnerPosition, setWinnerPosition] = useState<number | null>(null);
  const [animationStarted, setAnimationStarted] = useState(false);
  const timersRef = useRef<{ pause?: number; collect?: number; clear?: number }>({});

  // Detect when trick is complete and trigger collection animation
  useEffect(() => {
    // If trick is complete and we haven't started animations yet
    if (trick && trick.cards.size === 4 && trick.winnerId && !animationStarted) {
      console.log('Starting trick animation sequence');
      setAnimationStarted(true);
      const winner = players.find(p => p.id === trick.winnerId);
      if (winner) {
        console.log('Winner:', winner.name, 'Position:', winner.position);
        setWinnerPosition(winner.position);
      }

      // Calculate points in this trick
      const points = Array.from(trick.cards.values()).reduce((sum, card) => sum + card.points, 0);
      setTrickPoints(points);

      // Clear any existing timers
      if (timersRef.current.pause) clearTimeout(timersRef.current.pause);
      if (timersRef.current.collect) clearTimeout(timersRef.current.collect);
      if (timersRef.current.clear) clearTimeout(timersRef.current.clear);

      // Step 1: Pause for 0.75 seconds to view all cards (2x faster)
      timersRef.current.pause = setTimeout(() => {
        console.log('Showing points message');
        // Step 2: Show points message (only if there are points)
        if (points > 0) {
          setShowPointsMessage(true);
        }
      }, 750);
      
      // Step 3: After 1.5 seconds total, start collecting
      timersRef.current.collect = setTimeout(() => {
        console.log('Starting collection animation');
        setShowPointsMessage(false);
        setIsCollecting(true);
      }, 1500);

      // Step 4: Clear after collection animation (2.4 seconds total: 1.5s + 0.9s animation)
      timersRef.current.clear = setTimeout(() => {
        console.log('Clearing trick');
        setIsCollecting(false);
        setAnimationStarted(false);
        // Check if this is the last trick - if so, end the round
        if (state.isLastTrick) {
          console.log('Last trick complete - ending round');
          dispatch({ type: 'END_ROUND' });
        } else {
          // Clear the trick from state
          dispatch({ type: 'CLEAR_TRICK' });
        }
      }, 2400);
    }
    
    // Reset when trick is cleared
    if (!trick) {
      setAnimationStarted(false);
      setWinnerPosition(null);
    }
  }, [trick, players, animationStarted, dispatch]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timersRef.current.pause) clearTimeout(timersRef.current.pause);
      if (timersRef.current.collect) clearTimeout(timersRef.current.collect);
      if (timersRef.current.clear) clearTimeout(timersRef.current.clear);
    };
  }, []);

  // Show the current trick
  const displayTrick = trick;

  if (!displayTrick || displayTrick.cards.size === 0) {
    return <div className={styles.trickArea} role="region" aria-label="Trick area" />;
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

  // Get play order for z-index (later cards on top)
  const playOrder = Array.from(displayTrick.cards.entries()).map(([playerId], index) => ({
    playerId,
    zIndex: index + 1,
  }));

  return (
    <>
      {showPointsMessage && trickPoints > 0 && (
        <div className={styles.pointsOverlay}>
          <div className={styles.pointsMessage}>
            +{trickPoints} points
          </div>
        </div>
      )}
      <div 
        className={`${styles.trickArea} ${isCollecting ? styles.collecting : ''}`}
        role="region" 
        aria-label="Current trick"
        aria-live="polite"
        data-winner-position={winnerPosition !== null ? winnerPosition : ''}
      >
      {players.map((player) => {
        const card = displayTrick.cards.get(player.id);
        if (!card) return null;

        const isWinning = winningCardId === card.id;
        const positionClass = positionClasses[player.position];
        const cardDescription = card.color === 'rook' ? 'Rook Bird' : `${card.color} ${card.value}`;
        const zIndex = playOrder.find(po => po.playerId === player.id)?.zIndex || 1;

        return (
          <div
            key={player.id}
            className={`${styles.playedCard} ${positionClass} ${isWinning ? styles.winningCard : ''
              }`}
            style={{ zIndex: isCollecting && isWinning ? 100 : zIndex }}
            data-position={player.position}
            data-is-winning={isWinning ? 'true' : 'false'}
            role="article"
            aria-label={`${player.name} played ${cardDescription}${isWinning ? ', currently winning' : ''}`}
          >
            <CardComponent
              card={card}
              isDisabled={true}
              isSelected={false}
              onClick={() => { }}
            />
          </div>
        );
      })}
      </div>
    </>
  );
};
