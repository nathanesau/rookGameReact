import { useState } from 'react';
import { ScoreBoard } from './ScoreBoard';
import styles from './ScoreButton.module.css';

export const ScoreButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleScore = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleScore();
    }
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        className={styles.scoreButton}
        onClick={toggleScore}
        onKeyDown={handleKeyDown}
        aria-label="View scores"
        aria-expanded={isOpen}
        type="button"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 3v18h18" />
          <path d="M18 17V9" />
          <path d="M13 17V5" />
          <path d="M8 17v-3" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className={styles.overlay}
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className={styles.scoreModal} role="dialog" aria-label="Score board">
            <button
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Close score board"
              type="button"
            >
              ×
            </button>
            <ScoreBoard />
          </div>
        </>
      )}
    </>
  );
};
