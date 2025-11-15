import { useState } from 'react';
import type { CardColor } from '../types';
import styles from './TrumpSelector.module.css';

interface TrumpSelectorProps {
  onSelectTrump: (color: CardColor) => void;
}

const COLORS: { color: CardColor; label: string; emoji: string }[] = [
  { color: 'red', label: 'Red', emoji: '🔴' },
  { color: 'yellow', label: 'Yellow', emoji: '🟡' },
  { color: 'green', label: 'Green', emoji: '🟢' },
  { color: 'black', label: 'Black', emoji: '⚫' },
];

export const TrumpSelector = ({ onSelectTrump }: TrumpSelectorProps) => {
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

  return (
    <div className={styles.trumpSelector} role="dialog" aria-labelledby="trump-selector-title">
      <div className={styles.header}>
        <h2 id="trump-selector-title">Choose Trump Suit</h2>
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
  );
};
