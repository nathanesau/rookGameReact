import { useState, useMemo } from 'react';
import { Card } from './Card';
import type { Card as CardType } from '../types';
import styles from './NestDisplay.module.css';

interface NestDisplayProps {
  hand: CardType[];
  nest: CardType[];
  onComplete: (cardsToAdd: CardType[], cardsToDiscard: CardType[]) => void;
}

export const NestDisplay = ({ hand, nest, onComplete }: NestDisplayProps) => {
  const [selectedNestCards, setSelectedNestCards] = useState<Set<string>>(new Set());
  const [selectedDiscardCards, setSelectedDiscardCards] = useState<Set<string>>(new Set());

  // Get the original 13-card hand (without nest cards)
  const originalHand = useMemo(() => {
    const nestCardIds = new Set(nest.map(c => c.id));
    return hand.filter(card => !nestCardIds.has(card.id));
  }, [hand, nest]);

  // Preview hand: original hand + selected nest cards - selected discard cards
  const previewHand = useMemo(() => {
    const selectedNest = nest.filter(card => selectedNestCards.has(card.id));
    const handAfterDiscard = originalHand.filter(card => !selectedDiscardCards.has(card.id));
    return [...handAfterDiscard, ...selectedNest];
  }, [originalHand, nest, selectedNestCards, selectedDiscardCards]);

  const handleNestCardClick = (card: CardType) => {
    const newSelected = new Set(selectedNestCards);
    if (newSelected.has(card.id)) {
      newSelected.delete(card.id);
    } else {
      if (newSelected.size < 3) {
        newSelected.add(card.id);
      }
    }
    setSelectedNestCards(newSelected);
  };

  const handleHandCardClick = (card: CardType) => {
    const newSelected = new Set(selectedDiscardCards);
    if (newSelected.has(card.id)) {
      newSelected.delete(card.id);
    } else {
      newSelected.add(card.id);
    }
    setSelectedDiscardCards(newSelected);
  };

  const handleConfirm = () => {
    const cardsToAdd = nest.filter(card => selectedNestCards.has(card.id));
    const cardsToDiscard = originalHand.filter(card => selectedDiscardCards.has(card.id));
    onComplete(cardsToAdd, cardsToDiscard);
  };

  const isValid = selectedNestCards.size === selectedDiscardCards.size;

  const sortCards = (cards: CardType[]) => {
    return [...cards].sort((a, b) => {
      if (a.color === 'rook') return 1;
      if (b.color === 'rook') return -1;
      if (a.color !== b.color) {
        return a.color.localeCompare(b.color);
      }
      if (a.value === 'rook') return 1;
      if (b.value === 'rook') return -1;
      return (a.value as number) - (b.value as number);
    });
  };

  const sortedNest = sortCards(nest);
  const sortedHand = sortCards(originalHand);
  const sortedPreview = sortCards(previewHand);

  return (
    <div className={styles.nestDisplay} role="region" aria-label="Nest card selection">
      <div className={styles.header}>
        <h2>Nest Selection</h2>
        <div className={styles.counter} role="status" aria-live="polite">
          Adding {selectedNestCards.size} | Discarding {selectedDiscardCards.size}
        </div>
      </div>

      <div className={styles.instructions} role="note">
        Select cards from the nest to add, then select the same number of cards from your hand to discard.
      </div>

      {/* Row 1: Nest Cards */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Nest (5 cards) - Click to Add (up to 3)</h3>
        <div className={styles.nestCards} role="group" aria-label="Nest cards">
          {sortedNest.map(card => (
            <Card
              key={card.id}
              card={card}
              onClick={() => handleNestCardClick(card)}
              isSelected={selectedNestCards.has(card.id)}
              isDisabled={false}
            />
          ))}
        </div>
      </div>

      {/* Row 2: Original Hand */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Your Hand (13 cards) - Click to Discard</h3>
        <div className={styles.handDisplay} role="group" aria-label="Your hand">
          {sortedHand.map((card, index) => {
            const isDiscard = selectedDiscardCards.has(card.id);
            return (
              <div
                key={card.id}
                className={isDiscard ? styles.discardCard : ''}
                style={{
                  '--card-index': index,
                  '--total-cards': sortedHand.length,
                } as React.CSSProperties}
              >
                <Card
                  card={card}
                  onClick={() => handleHandCardClick(card)}
                  isSelected={false}
                  isDisabled={false}
                />
                {isDiscard && <div className={styles.discardX}>✗</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 3: Preview */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Preview: Final Hand ({previewHand.length} cards)</h3>
        <div className={styles.handDisplay} role="group" aria-label="Hand preview">
          {sortedPreview.map((card, index) => {
            const isFromNest = selectedNestCards.has(card.id);
            return (
              <div
                key={card.id}
                style={{
                  '--card-index': index,
                  '--total-cards': sortedPreview.length,
                } as React.CSSProperties}
              >
                <Card
                  card={card}
                  onClick={() => { }}
                  isSelected={isFromNest}
                  isDisabled={true}
                />
              </div>
            );
          })}
        </div>
      </div>

      <button
        className={styles.confirmButton}
        onClick={handleConfirm}
        disabled={!isValid}
        type="button"
      >
        {!isValid
          ? `Select ${selectedNestCards.size} card${selectedNestCards.size !== 1 ? 's' : ''} to discard`
          : selectedNestCards.size === 0
            ? 'Skip Nest (Keep Original Hand)'
            : 'Confirm Selection'}
      </button>
    </div>
  );
};
