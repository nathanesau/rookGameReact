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

  const cardClasses = [
    styles.card,
    styles[`card-${card.color}`],
    isSelected && styles.selected,
    isDisabled && styles.disabled,
    isRookBird && styles.rookBird
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={cardClasses}
      onClick={handleClick}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-label={isRookBird ? 'Rook Bird card' : `${card.color} ${card.value}`}
      aria-disabled={isDisabled}
    >
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
