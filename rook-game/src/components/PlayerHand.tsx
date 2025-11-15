import { Card as CardComponent } from './Card';
import type { Card } from '../types';
import styles from './PlayerHand.module.css';

interface PlayerHandProps {
  cards: Card[];
  playableCards: Set<string>;
  onCardClick: (card: Card) => void;
  selectedCard?: Card | null;
}

/**
 * Sorts cards by color and then by value
 * Color order: red, yellow, green, black, rook
 */
const sortCards = (cards: Card[]): Card[] => {
  const colorOrder = { red: 0, yellow: 1, green: 2, black: 3, rook: 4 };
  
  return [...cards].sort((a, b) => {
    // Sort by color first
    const colorDiff = colorOrder[a.color] - colorOrder[b.color];
    if (colorDiff !== 0) return colorDiff;
    
    // Then sort by value within same color
    if (a.value === 'rook') return 1;
    if (b.value === 'rook') return -1;
    return (a.value as number) - (b.value as number);
  });
};

export const PlayerHand = ({ 
  cards, 
  playableCards, 
  onCardClick,
  selectedCard = null
}: PlayerHandProps) => {
  const sortedCards = sortCards(cards);
  
  const handleCardClick = (card: Card) => {
    if (playableCards.has(card.id)) {
      onCardClick(card);
    }
  };

  return (
    <div className={styles.playerHand} role="region" aria-label="Your hand">
      <div className={styles.cardFan}>
        {sortedCards.map((card, index) => {
          const isPlayable = playableCards.has(card.id);
          const isSelected = selectedCard?.id === card.id;
          
          return (
            <div
              key={card.id}
              className={`${styles.cardWrapper} ${isPlayable ? styles.playable : ''}`}
              style={{
                '--card-index': index,
                '--total-cards': sortedCards.length,
              } as React.CSSProperties}
            >
              <CardComponent
                card={card}
                onClick={() => handleCardClick(card)}
                isSelected={isSelected}
                isDisabled={!isPlayable}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
