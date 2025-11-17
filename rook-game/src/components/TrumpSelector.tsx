import { useState } from 'react';
import type { Card, CardColor } from '../types';
import { Card as CardComponent } from './Card';
import styles from './TrumpSelector.module.css';

interface TrumpSelectorProps {
  hand: Card[];
  onSelectTrump: (color: CardColor) => void;
  onBack?: () => void;
}

const COLORS: { color: CardColor; label: string; emoji: string }[] = [
  { color: 'red', label: 'Red', emoji: '🔴' },
  { color: 'yellow', label: 'Yellow', emoji: '🟡' },
  { color: 'green', label: 'Green', emoji: '🟢' },
  { color: 'black', label: 'Black', emoji: '⚫' },
];

export const TrumpSelector = ({ hand, onSelectTrump, onBack }: TrumpSelectorProps) => {
  const [selectedColor, setSelectedColor] = useState<CardColor | null>(null);

  const handleColorClick = (color: CardColor) => {
    setSelectedColor(color);
  };

  const handleConfirm = () => {
    if (selectedColor) {
      onSelectTrump(selectedColor);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, color: CardColor) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleColorClick(color);
    }
  };

  // Sort hand by color and value
  const sortedHand = [...hand].sort((a, b) => {
    const colorOrder = { red: 0, yellow: 1, green: 2, black: 3, rook: 4 };
    if (a.color !== b.color) {
      return colorOrder[a.color] - colorOrder[b.color];
    }
    if (a.value === 'rook') return 1;
    if (b.value === 'rook') return -1;
    return (a.value as number) - (b.value as number);
  });

  return (
    <div className={styles.trumpSelectorContainer}>
      <div className={styles.handPreview}>
        <h3 className={styles.handTitle}>Your Hand</h3>
        <div 
          className={styles.cards}
          style={{ '--total-cards': sortedHand.length } as React.CSSProperties}
        >
          {sortedHand.map((card, index) => (
            <div
              key={card.id}
              style={{ '--card-index': index } as React.CSSProperties}
            >
              <CardComponent card={card} />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.trumpSelector} role="dialog" aria-labelledby="trump-selector-title">
      <div className={styles.header}>
        {onBack && (
          <button
            className={styles.backButton}
            onClick={onBack}
            type="button"
            aria-label="Go back to nest selection"
          >
            ← Back
          </button>
        )}
        <h2 id="trump-selector-title">Choose Trump Suit</h2>
        <div className={styles.spacer} />
      </div>

      <div className={styles.instructions} role="note">
        Select the trump suit for this round. Trump cards will beat all other suits.
      </div>

      <div className={styles.colorOptions} role="group" aria-label="Trump suit options">
        {COLORS.map(({ color, label, emoji }) => (
          <button
            key={color}
            className={`${styles.colorButton} ${styles[`color-${color}`]} ${
              selectedColor === color ? styles.selected : ''
            }`}
            onClick={() => handleColorClick(color)}
            onKeyDown={(e) => handleKeyDown(e, color)}
            type="button"
            role="radio"
            aria-checked={selectedColor === color}
            aria-label={`Select ${label} as trump suit`}
          >
            <span className={styles.emoji} aria-hidden="true">{emoji}</span>
            <span className={styles.label}>{label}</span>
          </button>
        ))}
      </div>

      <button
        className={styles.confirmButton}
        onClick={handleConfirm}
        disabled={!selectedColor}
        type="button"
        aria-label={selectedColor ? `Confirm ${selectedColor} as trump suit` : 'Select a trump suit first'}
      >
        Confirm Trump Selection
      </button>
      </div>
    </div>
  );
};
