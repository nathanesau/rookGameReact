import { useState } from 'react';
import type { Card, CardColor, CardValue } from '../types';
import styles from './PartnerSelector.module.css';

interface PartnerSelectorProps {
  playerHand: Card[];
  nest: Card[];
  onSelectPartner: (card: Card) => void;
}

// Generate all possible cards (including Rook, excluding cards in player's hand and nest)
const generateSelectableCards = (playerHand: Card[], nest: Card[]): Card[] => {
  const colors: CardColor[] = ['red', 'yellow', 'green', 'black'];
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

  const playerCardIds = new Set(playerHand.map(c => c.id));
  const nestCardIds = new Set(nest.map(c => c.id));
  const selectableCards: Card[] = [];

  // Add regular cards (exclude player's hand and nest)
  for (const color of colors) {
    for (const value of values) {
      const cardId = `${color}-${value}`;
      if (!playerCardIds.has(cardId) && !nestCardIds.has(cardId)) {
        selectableCards.push({
          id: cardId,
          color,
          value: value as CardValue,
          points: value === 1 ? 15 : value === 14 ? 10 : value === 10 ? 10 : value === 5 ? 5 : 0,
        });
      }
    }
  }

  // Add Rook if player doesn't have it and it's not in the nest
  if (!playerCardIds.has('rook-bird') && !nestCardIds.has('rook-bird')) {
    selectableCards.push({
      id: 'rook-bird',
      color: 'rook',
      value: 'rook',
      points: 20,
    });
  }

  return selectableCards;
};

type SelectableColor = CardColor | 'rook';

export const PartnerSelector = ({ playerHand, nest, onSelectPartner }: PartnerSelectorProps) => {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedColor, setSelectedColor] = useState<SelectableColor | null>(null);

  const selectableCards = generateSelectableCards(playerHand, nest);
  const colorGroups: Record<SelectableColor, Card[]> = {
    red: selectableCards.filter(c => c.color === 'red'),
    yellow: selectableCards.filter(c => c.color === 'yellow'),
    green: selectableCards.filter(c => c.color === 'green'),
    black: selectableCards.filter(c => c.color === 'black'),
    rook: selectableCards.filter(c => c.color === 'rook'),
  };

  const handleColorSelect = (color: SelectableColor) => {
    setSelectedColor(color);
    setSelectedCard(null);

    // If Rook is selected and available, auto-select it since there's only one
    if (color === 'rook' && colorGroups.rook.length > 0) {
      const rookCard = colorGroups.rook[0];
      onSelectPartner(rookCard);
    }
  };

  const handleCardSelect = (card: Card) => {
    setSelectedCard(card);
  };

  const handleConfirm = () => {
    if (selectedCard) {
      onSelectPartner(selectedCard);
    }
  };

  const getColorLabel = (color: SelectableColor) => {
    return color.charAt(0).toUpperCase() + color.slice(1);
  };

  const getColorEmoji = (color: SelectableColor) => {
    switch (color) {
      case 'red': return '🔴';
      case 'yellow': return '🟡';
      case 'green': return '🟢';
      case 'black': return '⚫';
      case 'rook': return '🦅';
    }
  };

  return (
    <div className={styles.partnerSelector} role="dialog" aria-labelledby="partner-selector-title">
      <div className={styles.header}>
        <h2 id="partner-selector-title">Call Your Partner</h2>
      </div>

      <div className={styles.instructions} role="note">
        Select a card to call. The player with this card will be your secret partner!
      </div>

      {!selectedColor ? (
        <div className={styles.colorSelection}>
          <p className={styles.stepLabel}>Step 1: Choose a color or Rook</p>
          <div className={styles.colorOptions} role="group" aria-label="Card color options">
            {(['red', 'yellow', 'green', 'black', 'rook'] as SelectableColor[]).map((color) => (
              <button
                key={color}
                className={`${styles.colorButton} ${styles[`color-${color}`]}`}
                onClick={() => handleColorSelect(color)}
                type="button"
                aria-label={`Select ${getColorLabel(color)} ${color === 'rook' ? '' : 'cards'}`}
                disabled={colorGroups[color].length === 0}
              >
                <span className={styles.emoji} aria-hidden="true">{getColorEmoji(color)}</span>
                <span className={styles.label}>{getColorLabel(color)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.cardSelection}>
          <div className={styles.stepHeader}>
            <button
              className={styles.backButton}
              onClick={() => {
                setSelectedColor(null);
                setSelectedCard(null);
              }}
              type="button"
              aria-label="Go back to color selection"
            >
              ← Back
            </button>
            <p className={styles.stepLabel}>
              Step 2: Choose a {getColorLabel(selectedColor)} card
            </p>
          </div>

          <div className={styles.cardGrid} role="group" aria-label={`${getColorLabel(selectedColor)} card options`}>
            {selectedColor && colorGroups[selectedColor].map((card) => (
              <button
                key={card.id}
                className={`${styles.cardButton} ${selectedCard?.id === card.id ? styles.selected : ''}`}
                onClick={() => handleCardSelect(card)}
                type="button"
                aria-label={`Select ${getColorLabel(selectedColor)} ${card.value === 'rook' ? 'Bird' : card.value}`}
                aria-pressed={selectedCard?.id === card.id}
              >
                {card.value === 'rook' ? '🦅' : card.value}
              </button>
            ))}
          </div>

          <button
            className={styles.confirmButton}
            onClick={handleConfirm}
            disabled={!selectedCard}
            type="button"
            aria-label={selectedCard ? `Confirm calling ${selectedColor ? getColorLabel(selectedColor) : ''} ${selectedCard.value === 'rook' ? 'Bird' : selectedCard.value}` : 'Select a card first'}
          >
            Call This Card
          </button>
        </div>
      )}
    </div>
  );
};
