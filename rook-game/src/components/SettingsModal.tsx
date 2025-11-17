import { useState } from 'react';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  winningScore: number;
  nestSelectableCards: number;
  onSave: (winningScore: number, nestSelectableCards: number) => void;
}

export const SettingsModal = ({ isOpen, onClose, winningScore, nestSelectableCards, onSave }: SettingsModalProps) => {
  const [localWinningScore, setLocalWinningScore] = useState(winningScore);
  const [localNestSelectableCards, setLocalNestSelectableCards] = useState(nestSelectableCards);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localWinningScore, localNestSelectableCards);
    onClose();
  };

  const handleCancel = () => {
    setLocalWinningScore(winningScore);
    setLocalNestSelectableCards(nestSelectableCards);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Game Settings</h2>
          <button className={styles.closeButton} onClick={handleCancel} aria-label="Close settings">
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.setting}>
            <label htmlFor="winning-score">Winning Score</label>
            <input
              id="winning-score"
              type="number"
              min="100"
              max="1000"
              step="50"
              value={localWinningScore}
              onChange={(e) => setLocalWinningScore(Number(e.target.value))}
            />
            <p className={styles.description}>First team to reach this score wins the game</p>
          </div>

          <div className={styles.setting}>
            <label htmlFor="nest-selectable">Nest Selectable Cards</label>
            <input
              id="nest-selectable"
              type="number"
              min="3"
              max="5"
              value={localNestSelectableCards}
              onChange={(e) => setLocalNestSelectableCards(Number(e.target.value))}
            />
            <p className={styles.description}>Number of cards you can select from the nest (3-5)</p>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={handleCancel}>
            Cancel
          </button>
          <button className={styles.saveButton} onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
