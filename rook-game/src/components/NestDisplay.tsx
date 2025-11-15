import { useState } from 'react';
import { Card } from './Card';
import type { Card as CardType } from '../types';
import styles from './NestDisplay.module.css';

interface NestDisplayProps {
  hand: CardType[];
  onDiscard: (cards: CardType[]) => void;
}

export const NestDisplay = ({ hand, onDiscard }: NestDisplayProps) => {
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  const handleCardClick = (card: CardType) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(card.id)) {
      newSelected.delete(card.id);
    } else {
      if (newSelected.size < 5) {
        newSelected.add(card.id);
      }
    }
    setSelectedCards(newSelected);
  };

  const handleDiscard = () => {
    const cardsToDiscard = hand.filter(card => selectedCards.has(card.id));
    if (cardsToDiscard.length === 5) {
      onDiscard(cardsToDiscard);
    }
  };

  const sortedHand = [...hand].sort((a, b) => {
    // Sort by color first, then by value
    if (a.color === 'rook') return 1;
    if (b.color === 'rook') return -1;
    if (a.color !== b.color) {
      return a.color.localeCompare(b.color);
    }
    if (a.value === 'rook') return 1;
    if (b.value === 'rook') return -1;
    return (a.value as number) - (b.value as number);
  });

  return (
    <div className={styles.nestDisplay} role="region" aria-label="Card discard selection">
      <div className={styles.header}>
        <h2>Select 5 Cards to Discard</h2>
        <div className={styles.counter} role="status" aria-live="polite" aria-atomic="true">
          {selectedCards.size} / 5 selected
        </div>
      </div>
      
      <div className={styles.instructions} role="note">
        You won the bid! The nest cards have been added to your hand. 
        Select exactly 5 cards to discard, then you'll choose the trump suit.
      </div>

      <div className={styles.handDisplay} role="group" aria-label="Your hand with nest cards">
        {sortedHand.map(card => (
          <Card
            key={card.id}
            card={card}
            onClick={() => handleCardClick(card)}
            isSelected={selectedCards.has(card.id)}
            isDisabled={false}
          />
        ))}
      </div>

      <button
        className={styles.discardButton}
        onClick={handleDiscard}
        disabled={selectedCards.size !== 5}
        type="button"
        aria-label={selectedCards.size === 5 ? 'Discard 5 selected cards' : `Select ${5 - selectedCards.size} more cards to discard`}
      >
        Discard Selected Cards
      </button>
    </div>
  );
};
