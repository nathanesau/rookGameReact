import { useState } from 'react';
import styles from './HelpModal.module.css';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal = ({ isOpen, onClose }: HelpModalProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'scoring'>('overview');

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="help-title">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close help"
        >
          ×
        </button>

        <h2 id="help-title" className={styles.title}>How to Play Rook</h2>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('overview')}
            aria-selected={activeTab === 'overview'}
          >
            Overview
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'rules' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('rules')}
            aria-selected={activeTab === 'rules'}
          >
            Game Rules
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'scoring' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('scoring')}
            aria-selected={activeTab === 'scoring'}
          >
            Scoring
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'overview' && (
            <div className={styles.section}>
              <h3>Game Overview</h3>
              <p>
                Rook is a trick-taking card game for four players. Partners change each round based on who wins the bid.
                The goal is to be the first player to reach 500 points by winning tricks containing point cards.
              </p>

              <h4>The Deck</h4>
              <ul>
                <li>57 cards total: numbered 1-14 in four colors (Red, Yellow, Green, Black)</li>
                <li>Plus one special Rook Bird card</li>
              </ul>

              <h4>Game Flow</h4>
              <ol>
                <li><strong>Dealing:</strong> Each player receives 13 cards, 5 cards go to the "nest"</li>
                <li><strong>Bidding:</strong> Players bid for the right to name trump and take the nest</li>
                <li><strong>Trump Selection:</strong> High bidder takes nest, discards 5 cards, names trump</li>
                <li><strong>Playing:</strong> Players play 13 tricks, trying to capture point cards</li>
                <li><strong>Scoring:</strong> Teams count points, check if bidding team made their bid</li>
              </ol>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className={styles.section}>
              <h3>Playing Rules</h3>

              <h4>Bidding Phase</h4>
              <ul>
                <li>Bidding starts at 40 and increases in increments of 5</li>
                <li>Maximum bid is 120</li>
                <li>Once you pass, you cannot bid again that round</li>
                <li>If you have no point cards, you can call for a redeal</li>
              </ul>

              <h4>Playing Phase</h4>
              <ul>
                <li><strong>Following Suit:</strong> You must play the same color as the card led if you have it</li>
                <li><strong>Trump:</strong> If you can't follow suit, you can play any card including trump</li>
                <li><strong>Winning:</strong> Highest card of the led suit wins, unless trump is played</li>
                <li><strong>Trump Wins:</strong> Highest trump card always wins the trick</li>
              </ul>

              <h4>Rook Bird Special Rules</h4>
              <ul>
                <li>Can be played at any time, even if you could follow suit</li>
                <li>Acts as the highest trump card</li>
                <li>When led, all players must play trump if they have it</li>
                <li>If trump is led and you only have the Rook Bird, you must play it</li>
              </ul>

              <h4>Last Trick Bonus</h4>
              <p>The winner of the last trick also wins the 5-card nest!</p>
            </div>
          )}

          {activeTab === 'scoring' && (
            <div className={styles.section}>
              <h3>Scoring System</h3>

              <h4>Point Cards (Counters)</h4>
              <ul>
                <li><strong>5s:</strong> 5 points each</li>
                <li><strong>10s and 14s:</strong> 10 points each</li>
                <li><strong>Rook Bird:</strong> 20 points</li>
                <li><strong>All other cards:</strong> 0 points</li>
              </ul>
              <p className={styles.highlight}>Total points available: 120</p>

              <h4>Round Scoring</h4>
              <ul>
                <li><strong>Bidding Team Makes Bid:</strong> Add their captured points to their score</li>
                <li><strong>Bidding Team Fails Bid:</strong> Subtract bid amount from their score (set to 0 for the round)</li>
                <li><strong>Non-Bidding Team:</strong> Always add their captured points</li>
              </ul>

              <h4>Winning the Game</h4>
              <ul>
                <li>First player to reach 500 points wins</li>
                <li>If multiple players reach 500 in the same round, highest score wins</li>
              </ul>

              <h4>Penalties</h4>
              <p>
                <strong>Renege:</strong> If you fail to follow suit when you could have, the round ends immediately.
                Your team loses points equal to the bid, and opponents get points for counters they captured.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
