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
  const [step, setStep] = useState<'selectNest' | 'selectDiscard'>('selectNest');
  const [selectedNestCards, setSelectedNestCards] = useState<Set<string>>(new Set());
  const [selectedDiscardCards, setSelectedDiscardCards] = useState<Set<string>>(new Set());
  const [takenNestCards, setTakenNestCards] = useState<CardType[]>([]);

  // Preview hand with selected nest cards
  const previewHand = useMemo(() => {
    if (step === 'selectNest') {
      const nestCardsToAdd = nest.filter(card => selectedNestCards.has(card.id));
      return [...hand, ...nestCardsToAdd];
    }
    return hand;
  }, [step, hand, nest, selectedNestCards]);

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

  const handleDiscardCardClick = (card: CardType) => {
    const newSelected = new Set(selectedDiscardCards);
    if (newSelected.has(card.id)) {
      newSelected.delete(card.id);
    } else {
      if (newSelected.size < takenNestCards.length) {
        newSelected.add(card.id);
      }
    }
    setSelectedDiscardCards(newSelected);
  };

  const handleConfirmNestSelection = () => {
    const cardsToTake = nest.filter(card => selectedNestCards.has(card.id));
    setTakenNestCards(cardsToTake);
    setStep('selectDiscard');
  };

  const handleBackToNestSelection = () => {
    setStep('selectNest');
    setSelectedDiscardCards(new Set());
  };

  const handleConfirmDiscard = () => {
    const cardsToDiscard = hand.filter(card => selectedDiscardCards.has(card.id));
    onComplete(takenNestCards, cardsToDiscard);
  };

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

  if (step === 'selectNest') {
    const sortedNest = sortCards(nest);
    const sortedPreview = sortCards(previewHand);

    return (
      <div className={styles.nestDisplay} role="region" aria-label="Nest card selection">
        <div className={styles.header}>
          <h2>Step 1: Select Cards from Nest</h2>
          <div className={styles.counter} role="status" aria-live="polite">
            {selectedNestCards.size} / 3 selected
          </div>
        </div>
        
        <div className={styles.instructions} role="note">
          You won the bid! Select up to 3 cards from the nest to add to your hand.
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Nest Cards (5 cards)</h3>
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

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Preview: Your Hand ({previewHand.length} cards)</h3>
          <div className={styles.handDisplay} role="group" aria-label="Hand preview">
            {sortedPreview.map(card => (
              <Card
                key={card.id}
                card={card}
                onClick={() => {}}
                isSelected={false}
                isDisabled={true}
              />
            ))}
          </div>
        </div>

        <button
          className={styles.confirmButton}
          onClick={handleConfirmNestSelection}
          disabled={selectedNestCards.size === 0}
          type="button"
        >
          {selectedNestCards.size === 0 
            ? 'Select at least 1 card from nest' 
            : `Confirm Selection (${selectedNestCards.size} card${selectedNestCards.size > 1 ? 's' : ''})`}
        </button>
      </div>
    );
  }

  // Step 2: Select cards to discard
  const sortedHand = sortCards(hand);

  return (
    <div className={styles.nestDisplay} role="region" aria-label="Card discard selection">
      <div className={styles.header}>
        <h2>Step 2: Select Cards to Discard</h2>
        <div className={styles.counter} role="status" aria-live="polite">
          {selectedDiscardCards.size} / {takenNestCards.length} selected
        </div>
      </div>
      
      <div className={styles.instructions} role="note">
        You took {takenNestCards.length} card{takenNestCards.length > 1 ? 's' : ''} from the nest. 
        Now discard {takenNestCards.length} card{takenNestCards.length > 1 ? 's' : ''} from your hand.
      </div>

      <div className={styles.handDisplay} role="group" aria-label="Your hand">
        {sortedHand.map(card => (
          <Card
            key={card.id}
            card={card}
            onClick={() => handleDiscardCardClick(card)}
            isSelected={selectedDiscardCards.has(card.id)}
            isDisabled={false}
          />
        ))}
      </div>

      <div className={styles.buttonGroup}>
        <button
          className={styles.backButton}
          onClick={handleBackToNestSelection}
          type="button"
        >
          ← Back to Nest Selection
        </button>
        <button
          className={styles.confirmButton}
          onClick={handleConfirmDiscard}
          disabled={selectedDiscardCards.size !== takenNestCards.length}
          type="button"
        >
          {selectedDiscardCards.size === takenNestCards.length
            ? 'Confirm Discard'
            : `Select ${takenNestCards.length - selectedDiscardCards.size} more card${takenNestCards.length - selectedDiscardCards.size > 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
};
