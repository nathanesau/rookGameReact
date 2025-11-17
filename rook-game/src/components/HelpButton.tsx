import { useState } from 'react';
import { HelpModal } from './HelpModal';
import styles from './HelpButton.module.css';

export const HelpButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleHelp = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleHelp();
    }
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        className={styles.helpButton}
        onClick={toggleHelp}
        onKeyDown={handleKeyDown}
        aria-label="View game rules"
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
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>

      <HelpModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
