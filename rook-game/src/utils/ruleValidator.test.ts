import { describe, it, expect } from 'vitest';
import { RuleValidator } from './ruleValidator';
import type { Card } from '../types';

describe('RuleValidator', () => {
  // Helper function to create test cards
  const createCard = (color: Card['color'], value: Card['value']): Card => ({
    id: `${color}-${value}`,
    color,
    value,
    points: value === 5 ? 5 : (value === 10 || value === 14 ? 10 : 0),
  });

  const rookBird: Card = {
    id: 'rook-bird',
    color: 'rook',
    value: 'rook',
    points: 20,
  };

  describe('isValidBid', () => {
    describe('bid increments', () => {
      it('should accept bids in increments of 5', () => {
        expect(RuleValidator.isValidBid(70, null)).toBe(true);
        expect(RuleValidator.isValidBid(75, null)).toBe(true);
        expect(RuleValidator.isValidBid(80, null)).toBe(true);
        expect(RuleValidator.isValidBid(120, null)).toBe(true);
      });

      it('should reject bids not in increments of 5', () => {
        expect(RuleValidator.isValidBid(71, null)).toBe(false);
        expect(RuleValidator.isValidBid(73, null)).toBe(false);
        expect(RuleValidator.isValidBid(77, null)).toBe(false);
        expect(RuleValidator.isValidBid(119, null)).toBe(false);
      });
    });

    describe('minimum bid', () => {
      it('should accept bids of 40 or higher', () => {
        expect(RuleValidator.isValidBid(40, null)).toBe(true);
        expect(RuleValidator.isValidBid(45, null)).toBe(true);
        expect(RuleValidator.isValidBid(70, null)).toBe(true);
        expect(RuleValidator.isValidBid(100, null)).toBe(true);
      });

      it('should reject bids below 40', () => {
        expect(RuleValidator.isValidBid(35, null)).toBe(false);
        expect(RuleValidator.isValidBid(30, null)).toBe(false);
        expect(RuleValidator.isValidBid(20, null)).toBe(false);
        expect(RuleValidator.isValidBid(0, null)).toBe(false);
      });
    });

    describe('maximum bid', () => {
      it('should accept bids of 120 or lower', () => {
        expect(RuleValidator.isValidBid(120, null)).toBe(true);
        expect(RuleValidator.isValidBid(115, null)).toBe(true);
        expect(RuleValidator.isValidBid(100, null)).toBe(true);
      });

      it('should reject bids above 120', () => {
        expect(RuleValidator.isValidBid(125, null)).toBe(false);
        expect(RuleValidator.isValidBid(130, null)).toBe(false);
        expect(RuleValidator.isValidBid(200, null)).toBe(false);
      });
    });

    describe('bid progression', () => {
      it('should accept bids higher than current bid', () => {
        expect(RuleValidator.isValidBid(75, 70)).toBe(true);
        expect(RuleValidator.isValidBid(80, 75)).toBe(true);
        expect(RuleValidator.isValidBid(120, 115)).toBe(true);
      });

      it('should reject bids equal to current bid', () => {
        expect(RuleValidator.isValidBid(70, 70)).toBe(false);
        expect(RuleValidator.isValidBid(80, 80)).toBe(false);
        expect(RuleValidator.isValidBid(120, 120)).toBe(false);
      });

      it('should reject bids lower than current bid', () => {
        expect(RuleValidator.isValidBid(70, 75)).toBe(false);
        expect(RuleValidator.isValidBid(75, 80)).toBe(false);
        expect(RuleValidator.isValidBid(100, 115)).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle null current bid (first bid)', () => {
        expect(RuleValidator.isValidBid(70, null)).toBe(true);
        expect(RuleValidator.isValidBid(100, null)).toBe(true);
      });

      it('should validate all rules together', () => {
        // Valid: increment of 5, >= 40, <= 120, > current
        expect(RuleValidator.isValidBid(85, 80)).toBe(true);
        
        // Invalid: not increment of 5
        expect(RuleValidator.isValidBid(83, 80)).toBe(false);
        
        // Invalid: below minimum
        expect(RuleValidator.isValidBid(35, null)).toBe(false);
        
        // Invalid: above maximum
        expect(RuleValidator.isValidBid(125, 120)).toBe(false);
        
        // Invalid: not higher than current
        expect(RuleValidator.isValidBid(80, 85)).toBe(false);
      });
    });
  });

  describe('mustFollowSuit', () => {
    it('should return true when player has cards of the led suit', () => {
      const leadCard = createCard('red', 5);
      const hand = [
        createCard('red', 3),
        createCard('yellow', 7),
        createCard('green', 10),
      ];

      expect(RuleValidator.mustFollowSuit(hand, leadCard)).toBe(true);
    });

    it('should return false when player has no cards of the led suit', () => {
      const leadCard = createCard('red', 5);
      const hand = [
        createCard('yellow', 3),
        createCard('yellow', 7),
        createCard('green', 10),
      ];

      expect(RuleValidator.mustFollowSuit(hand, leadCard)).toBe(false);
    });

    it('should not count Rook Bird as following suit', () => {
      const leadCard = createCard('red', 5);
      const hand = [
        rookBird,
        createCard('yellow', 7),
        createCard('green', 10),
      ];

      expect(RuleValidator.mustFollowSuit(hand, leadCard)).toBe(false);
    });

    it('should return false when Rook Bird is led', () => {
      const hand = [
        createCard('red', 3),
        createCard('yellow', 7),
      ];

      expect(RuleValidator.mustFollowSuit(hand, rookBird)).toBe(false);
    });

    it('should handle multiple cards of led suit', () => {
      const leadCard = createCard('black', 8);
      const hand = [
        createCard('black', 2),
        createCard('black', 9),
        createCard('black', 14),
        createCard('yellow', 5),
      ];

      expect(RuleValidator.mustFollowSuit(hand, leadCard)).toBe(true);
    });
  });

  describe('canPlayCard', () => {
    describe('when player is leading', () => {
      it('should allow any card from hand', () => {
        const card = createCard('red', 5);
        const hand = [card, createCard('yellow', 7)];

        expect(RuleValidator.canPlayCard(card, hand, null, 'green')).toBe(true);
      });

      it('should reject card not in hand', () => {
        const card = createCard('red', 5);
        const hand = [createCard('yellow', 7), createCard('green', 3)];

        expect(RuleValidator.canPlayCard(card, hand, null, 'green')).toBe(false);
      });

      it('should allow Rook Bird when leading', () => {
        const hand = [rookBird, createCard('red', 5)];

        expect(RuleValidator.canPlayCard(rookBird, hand, null, 'green')).toBe(true);
      });
    });

    describe('when following suit', () => {
      it('should allow card of led suit', () => {
        const leadCard = createCard('red', 8);
        const cardToPlay = createCard('red', 3);
        const hand = [cardToPlay, createCard('yellow', 7)];

        expect(RuleValidator.canPlayCard(cardToPlay, hand, leadCard, 'green')).toBe(true);
      });

      it('should reject card of different suit when player has led suit', () => {
        const leadCard = createCard('red', 8);
        const cardToPlay = createCard('yellow', 7);
        const hand = [createCard('red', 3), cardToPlay];

        expect(RuleValidator.canPlayCard(cardToPlay, hand, leadCard, 'green')).toBe(false);
      });

      it('should allow any card when player cannot follow suit', () => {
        const leadCard = createCard('red', 8);
        const cardToPlay = createCard('yellow', 7);
        const hand = [cardToPlay, createCard('green', 3)];

        expect(RuleValidator.canPlayCard(cardToPlay, hand, leadCard, 'green')).toBe(true);
      });

      it('should allow trump when player cannot follow suit', () => {
        const leadCard = createCard('red', 8);
        const cardToPlay = createCard('green', 7);
        const hand = [cardToPlay, createCard('yellow', 3)];

        expect(RuleValidator.canPlayCard(cardToPlay, hand, leadCard, 'green')).toBe(true);
      });
    });

    describe('Rook Bird special rules', () => {
      it('should allow Rook Bird to be played at any time', () => {
        const leadCard = createCard('red', 8);
        const hand = [rookBird, createCard('red', 3)];

        // Even though player has red cards, Rook Bird can still be played
        expect(RuleValidator.canPlayCard(rookBird, hand, leadCard, 'green')).toBe(true);
      });

      it('should allow Rook Bird when player has led suit', () => {
        const leadCard = createCard('yellow', 5);
        const hand = [rookBird, createCard('yellow', 7), createCard('yellow', 9)];

        expect(RuleValidator.canPlayCard(rookBird, hand, leadCard, 'red')).toBe(true);
      });

      it('should allow Rook Bird when player cannot follow suit', () => {
        const leadCard = createCard('black', 12);
        const hand = [rookBird, createCard('red', 3), createCard('yellow', 8)];

        expect(RuleValidator.canPlayCard(rookBird, hand, leadCard, 'green')).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should reject card not in hand', () => {
        const leadCard = createCard('red', 8);
        const cardToPlay = createCard('red', 3);
        const hand = [createCard('red', 5), createCard('yellow', 7)];

        expect(RuleValidator.canPlayCard(cardToPlay, hand, leadCard, 'green')).toBe(false);
      });

      it('should handle empty hand', () => {
        const leadCard = createCard('red', 8);
        const cardToPlay = createCard('red', 3);
        const hand: Card[] = [];

        expect(RuleValidator.canPlayCard(cardToPlay, hand, leadCard, 'green')).toBe(false);
      });

      it('should work with null trump color', () => {
        const leadCard = createCard('red', 8);
        const cardToPlay = createCard('red', 3);
        const hand = [cardToPlay, createCard('yellow', 7)];

        expect(RuleValidator.canPlayCard(cardToPlay, hand, leadCard, null)).toBe(true);
      });
    });

    describe('Rook Bird led - must play trump (Requirement 6.3)', () => {
      it('should require trump when Rook Bird is led and player has trump', () => {
        const hand = [
          createCard('green', 5),
          createCard('green', 8),
          createCard('red', 3),
        ];
        const trumpColor = 'green';

        // Player has trump, so must play trump
        expect(RuleValidator.canPlayCard(createCard('green', 5), hand, rookBird, trumpColor)).toBe(true);
        expect(RuleValidator.canPlayCard(createCard('red', 3), hand, rookBird, trumpColor)).toBe(false);
      });

      it('should allow any card when Rook Bird is led and player has no trump', () => {
        const hand = [
          createCard('red', 5),
          createCard('yellow', 8),
          createCard('black', 3),
        ];
        const trumpColor = 'green';

        // Player has no trump, so can play any card
        expect(RuleValidator.canPlayCard(createCard('red', 5), hand, rookBird, trumpColor)).toBe(true);
        expect(RuleValidator.canPlayCard(createCard('yellow', 8), hand, rookBird, trumpColor)).toBe(true);
      });
    });

    describe('Trump led with Rook Bird in hand (Requirement 6.4)', () => {
      it('should require Rook Bird when trump is led and player only has Rook Bird as trump', () => {
        const leadCard = createCard('green', 8);
        const hand = [
          rookBird,
          createCard('red', 5),
          createCard('yellow', 3),
        ];
        const trumpColor = 'green';

        // Player only has Rook Bird as trump, must play it
        expect(RuleValidator.canPlayCard(rookBird, hand, leadCard, trumpColor)).toBe(true);
        expect(RuleValidator.canPlayCard(createCard('red', 5), hand, leadCard, trumpColor)).toBe(false);
      });

      it('should allow trump cards when player has trump besides Rook Bird', () => {
        const leadCard = createCard('green', 8);
        const hand = [
          rookBird,
          createCard('green', 5),
          createCard('red', 3),
        ];
        const trumpColor = 'green';

        // Player has trump cards, can play any trump
        expect(RuleValidator.canPlayCard(createCard('green', 5), hand, leadCard, trumpColor)).toBe(true);
        expect(RuleValidator.canPlayCard(createCard('red', 3), hand, leadCard, trumpColor)).toBe(false);
      });

      it('should not require Rook Bird when non-trump is led', () => {
        const leadCard = createCard('red', 8);
        const hand = [
          rookBird,
          createCard('yellow', 5),
          createCard('black', 3),
        ];
        const trumpColor = 'green';

        // Non-trump led, player has no red, can play any card
        expect(RuleValidator.canPlayCard(rookBird, hand, leadCard, trumpColor)).toBe(true);
        expect(RuleValidator.canPlayCard(createCard('yellow', 5), hand, leadCard, trumpColor)).toBe(true);
      });
    });
  });

  describe('isRookBirdPlayable', () => {
    it('should return true when player has Rook Bird', () => {
      const hand = [rookBird, createCard('red', 5), createCard('yellow', 7)];
      
      expect(RuleValidator.isRookBirdPlayable(hand, null)).toBe(true);
    });

    it('should return false when player does not have Rook Bird', () => {
      const hand = [createCard('red', 5), createCard('yellow', 7), createCard('green', 3)];
      
      expect(RuleValidator.isRookBirdPlayable(hand, null)).toBe(false);
    });

    it('should return true regardless of lead card when player has Rook Bird', () => {
      const hand = [rookBird, createCard('red', 5)];
      const leadCard = createCard('yellow', 8);
      
      expect(RuleValidator.isRookBirdPlayable(hand, leadCard)).toBe(true);
    });

    it('should work when Rook Bird is only card in hand', () => {
      const hand = [rookBird];
      
      expect(RuleValidator.isRookBirdPlayable(hand, null)).toBe(true);
    });

    it('should return false for empty hand', () => {
      const hand: Card[] = [];
      
      expect(RuleValidator.isRookBirdPlayable(hand, null)).toBe(false);
    });
  });

  describe('mustPlayRookBird', () => {
    it('should return true when trump is led and player only has Rook Bird as trump', () => {
      const leadCard = createCard('green', 8);
      const hand = [
        rookBird,
        createCard('red', 5),
        createCard('yellow', 3),
      ];
      const trumpColor = 'green';

      expect(RuleValidator.mustPlayRookBird(hand, leadCard, trumpColor)).toBe(true);
    });

    it('should return false when player has other trump cards', () => {
      const leadCard = createCard('green', 8);
      const hand = [
        rookBird,
        createCard('green', 5),
        createCard('red', 3),
      ];
      const trumpColor = 'green';

      expect(RuleValidator.mustPlayRookBird(hand, leadCard, trumpColor)).toBe(false);
    });

    it('should return false when non-trump is led', () => {
      const leadCard = createCard('red', 8);
      const hand = [
        rookBird,
        createCard('yellow', 5),
        createCard('black', 3),
      ];
      const trumpColor = 'green';

      expect(RuleValidator.mustPlayRookBird(hand, leadCard, trumpColor)).toBe(false);
    });

    it('should return false when player does not have Rook Bird', () => {
      const leadCard = createCard('green', 8);
      const hand = [
        createCard('red', 5),
        createCard('yellow', 3),
      ];
      const trumpColor = 'green';

      expect(RuleValidator.mustPlayRookBird(hand, leadCard, trumpColor)).toBe(false);
    });

    it('should return false when trump color is null', () => {
      const leadCard = createCard('green', 8);
      const hand = [
        rookBird,
        createCard('red', 5),
      ];

      expect(RuleValidator.mustPlayRookBird(hand, leadCard, null)).toBe(false);
    });

    it('should handle multiple trump cards correctly', () => {
      const leadCard = createCard('green', 8);
      const hand = [
        rookBird,
        createCard('green', 5),
        createCard('green', 10),
        createCard('red', 3),
      ];
      const trumpColor = 'green';

      // Player has multiple trump cards, doesn't have to play Rook Bird
      expect(RuleValidator.mustPlayRookBird(hand, leadCard, trumpColor)).toBe(false);
    });

    it('should work when Rook Bird is only card in hand and trump is led', () => {
      const leadCard = createCard('green', 8);
      const hand = [rookBird];
      const trumpColor = 'green';

      expect(RuleValidator.mustPlayRookBird(hand, leadCard, trumpColor)).toBe(true);
    });
  });

  describe('detectRenege', () => {
    describe('standard suit following', () => {
      it('should detect renege when player has led suit but plays different suit', () => {
        const leadCard = createCard('red', 8);
        const playedCard = createCard('yellow', 5);
        const handBeforePlay = [
          playedCard,
          createCard('red', 3),
          createCard('red', 7),
        ];

        expect(RuleValidator.detectRenege(playedCard, handBeforePlay, leadCard, 'green')).toBe(true);
      });

      it('should not detect renege when player follows suit correctly', () => {
        const leadCard = createCard('red', 8);
        const playedCard = createCard('red', 3);
        const handBeforePlay = [
          playedCard,
          createCard('red', 7),
          createCard('yellow', 5),
        ];

        expect(RuleValidator.detectRenege(playedCard, handBeforePlay, leadCard, 'green')).toBe(false);
      });

      it('should not detect renege when player has no cards of led suit', () => {
        const leadCard = createCard('red', 8);
        const playedCard = createCard('yellow', 5);
        const handBeforePlay = [
          playedCard,
          createCard('yellow', 7),
          createCard('green', 3),
        ];

        expect(RuleValidator.detectRenege(playedCard, handBeforePlay, leadCard, 'green')).toBe(false);
      });
    });

    describe('Rook Bird special cases', () => {
      it('should never detect renege when Rook Bird is played', () => {
        const leadCard = createCard('red', 8);
        const handBeforePlay = [
          rookBird,
          createCard('red', 3),
          createCard('red', 7),
        ];

        // Rook Bird can be played at any time
        expect(RuleValidator.detectRenege(rookBird, handBeforePlay, leadCard, 'green')).toBe(false);
      });

      it('should detect renege when Rook Bird is led and player has trump but plays non-trump', () => {
        const playedCard = createCard('yellow', 5);
        const handBeforePlay = [
          playedCard,
          createCard('green', 3),
          createCard('green', 7),
        ];
        const trumpColor = 'green';

        expect(RuleValidator.detectRenege(playedCard, handBeforePlay, rookBird, trumpColor)).toBe(true);
      });

      it('should not detect renege when Rook Bird is led and player has no trump', () => {
        const playedCard = createCard('yellow', 5);
        const handBeforePlay = [
          playedCard,
          createCard('yellow', 7),
          createCard('red', 3),
        ];
        const trumpColor = 'green';

        expect(RuleValidator.detectRenege(playedCard, handBeforePlay, rookBird, trumpColor)).toBe(false);
      });

      it('should not detect renege when Rook Bird is led and player plays trump', () => {
        const playedCard = createCard('green', 5);
        const handBeforePlay = [
          playedCard,
          createCard('green', 7),
          createCard('red', 3),
        ];
        const trumpColor = 'green';

        expect(RuleValidator.detectRenege(playedCard, handBeforePlay, rookBird, trumpColor)).toBe(false);
      });
    });

    describe('trump led with Rook Bird in hand', () => {
      it('should detect renege when trump is led, player only has Rook Bird as trump, but plays non-trump', () => {
        const leadCard = createCard('green', 8);
        const playedCard = createCard('red', 5);
        const handBeforePlay = [
          playedCard,
          rookBird,
          createCard('yellow', 3),
        ];
        const trumpColor = 'green';

        expect(RuleValidator.detectRenege(playedCard, handBeforePlay, leadCard, trumpColor)).toBe(true);
      });

      it('should not detect renege when trump is led and player plays Rook Bird', () => {
        const leadCard = createCard('green', 8);
        const handBeforePlay = [
          rookBird,
          createCard('red', 5),
          createCard('yellow', 3),
        ];
        const trumpColor = 'green';

        expect(RuleValidator.detectRenege(rookBird, handBeforePlay, leadCard, trumpColor)).toBe(false);
      });

      it('should detect renege when trump is led, player has trump cards, but plays non-trump', () => {
        const leadCard = createCard('green', 8);
        const playedCard = createCard('red', 5);
        const handBeforePlay = [
          playedCard,
          createCard('green', 3),
          createCard('green', 7),
        ];
        const trumpColor = 'green';

        expect(RuleValidator.detectRenege(playedCard, handBeforePlay, leadCard, trumpColor)).toBe(true);
      });

      it('should not detect renege when trump is led and player plays trump card', () => {
        const leadCard = createCard('green', 8);
        const playedCard = createCard('green', 3);
        const handBeforePlay = [
          playedCard,
          createCard('green', 7),
          createCard('red', 5),
        ];
        const trumpColor = 'green';

        expect(RuleValidator.detectRenege(playedCard, handBeforePlay, leadCard, trumpColor)).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle null trump color', () => {
        const leadCard = createCard('red', 8);
        const playedCard = createCard('yellow', 5);
        const handBeforePlay = [
          playedCard,
          createCard('red', 3),
        ];

        expect(RuleValidator.detectRenege(playedCard, handBeforePlay, leadCard, null)).toBe(true);
      });

      it('should handle hand with only one card', () => {
        const leadCard = createCard('red', 8);
        const playedCard = createCard('yellow', 5);
        const handBeforePlay = [playedCard];

        expect(RuleValidator.detectRenege(playedCard, handBeforePlay, leadCard, 'green')).toBe(false);
      });

      it('should handle multiple cards of led suit', () => {
        const leadCard = createCard('black', 8);
        const playedCard = createCard('red', 5);
        const handBeforePlay = [
          playedCard,
          createCard('black', 2),
          createCard('black', 9),
          createCard('black', 14),
        ];

        expect(RuleValidator.detectRenege(playedCard, handBeforePlay, leadCard, 'green')).toBe(true);
      });
    });
  });
});
