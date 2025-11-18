import type { Card as CardType } from '../types';
import styles from './Card.module.css';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  isSelected?: boolean;
  isDisabled?: boolean;
}

export const Card = ({ card, onClick, isSelected = false, isDisabled = false }: CardProps) => {
  const isRookBird = card.color === 'rook';

  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDisabled && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  const cardClasses = [
    styles.card,
    styles[`card-${card.color}`],
    isSelected && styles.selected,
    isDisabled && styles.disabled,
    isRookBird && styles.rookBird
  ].filter(Boolean).join(' ');

  const getAriaLabel = () => {
    if (isRookBird) {
      return `Rook Bird card, worth ${card.points} points`;
    }
    const pointsText = card.points > 0 ? `, worth ${card.points} points` : '';
    return `${card.color} ${card.value}${pointsText}`;
  };

  return (
    <div
      className={cardClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-label={getAriaLabel()}
      aria-disabled={isDisabled}
      aria-pressed={isSelected}
    >
      {!isRookBird && (
        <>
          <div className={styles.cornerTopLeft}>
            <div className={styles.cornerValue}>{card.value}{card.color.charAt(0).toUpperCase()}</div>
            {card.points > 0 && <div className={styles.cornerPointsBadge}>{card.points}</div>}
          </div>
          <div className={styles.cornerBottomRight}>
            {card.value}{card.color.charAt(0).toUpperCase()}
          </div>
        </>
      )}
      <div className={styles.cardContent}>
        {isRookBird ? (
          <>
            <div className={styles.rookSymbol}>🦅</div>
            <div className={styles.rookText}>ROOK</div>
          </>
        ) : (
          <>
            <div className={styles.cardValue}>{card.value}</div>
            <div className={styles.cardColor}>
              {card.color.charAt(0).toUpperCase()}
            </div>
          </>
        )}
      </div>
      {card.points > 0 && (
        <div className={styles.pointsBadge}>{card.points}</div>
      )}
    </div>
  );
};
