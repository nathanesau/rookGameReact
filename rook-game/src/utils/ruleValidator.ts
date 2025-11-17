import type { Card, CardColor } from '../types';

/**
 * RuleValidator handles validation of game actions according to Rook rules
 */
export class RuleValidator {
  /**
   * Validates if a bid is valid according to Rook bidding rules
   * 
   * Requirements:
   * - Bids must be in increments of 5
   * - Minimum bid is 40 points
   * - Maximum bid is 120 points
   * - Bid must be higher than current bid
   * 
   * @param amount - The bid amount to validate
   * @param currentBid - The current high bid amount (null if no bids yet)
   * @returns true if the bid is valid, false otherwise
   */
  static isValidBid(amount: number, currentBid: number | null): boolean {
    // Bid must be in increments of 5
    if (amount % 5 !== 0) {
      return false;
    }

    // Minimum bid is 40
    if (amount < 40) {
      return false;
    }

    // Maximum bid is 120
    if (amount > 120) {
      return false;
    }

    // If there's a current bid, new bid must be higher
    if (currentBid !== null && amount <= currentBid) {
      return false;
    }

    return true;
  }

  /**
   * Checks if a player must follow suit based on their hand and the lead card
   * 
   * Requirements:
   * - Player must follow suit if they have cards of the led suit
   * - Rook Bird card is not considered part of any suit for following purposes
   * 
   * @param hand - The player's current hand
   * @param leadCard - The card that was led (first card of the trick)
   * @returns true if player must follow suit, false if they can play any card
   */
  static mustFollowSuit(hand: Card[], leadCard: Card): boolean {
    // If lead card is Rook Bird, players must play trump if they have it
    // This is handled separately in canPlayCard
    if (leadCard.color === 'rook') {
      return false; // Special case handled elsewhere
    }

    // Check if player has any cards of the led suit (excluding Rook Bird)
    const hasLeadSuit = hand.some(
      card => card.color === leadCard.color && card.color !== 'rook'
    );

    return hasLeadSuit;
  }

  /**
   * Validates if a specific card can be played given the current game state
   * 
   * Requirements:
   * - If a suit is led, player must follow suit if possible
   * - If player cannot follow suit, they can play any card
   * - Rook Bird can be played at any time (handled in Requirement 6)
   * 
   * @param card - The card the player wants to play
   * @param hand - The player's current hand
   * @param leadCard - The card that was led (null if player is leading)
   * @param trumpColor - The current trump color (null if not yet selected)
   * @returns true if the card can be played, false otherwise
   */
  static canPlayCard(
    card: Card,
    hand: Card[],
    leadCard: Card | null,
    trumpColor: CardColor | null
  ): boolean {
    // If player is leading, they can play any card from their hand
    if (leadCard === null) {
      return hand.some(c => c.id === card.id);
    }

    // Verify the card is actually in the player's hand
    if (!hand.some(c => c.id === card.id)) {
      return false;
    }

    // Rook Bird can be played at any time (Requirement 6.1)
    if (card.color === 'rook') {
      return true;
    }

    // Special case: When Rook Bird is led, must play trump if you have it (Requirement 6.3)
    if (leadCard.color === 'rook' && trumpColor !== null) {
      const hasTrump = hand.some(c => c.color === trumpColor);
      if (hasTrump) {
        return card.color === trumpColor;
      }
      // If no trump, can play any card
      return true;
    }

    // Special case: When trump is led and player has Rook Bird but no other trump (Requirement 6.4)
    // Note: If card is Rook Bird, we already returned true above
    if (trumpColor !== null && leadCard.color !== 'rook' && leadCard.color === trumpColor) {
      const trumpCards = hand.filter(c => c.color === trumpColor);
      const hasRookBird = hand.some(c => c.color === 'rook');

      // If player only has Rook Bird as trump (and no regular trump cards)
      // then they cannot play non-trump cards
      if (trumpCards.length === 0 && hasRookBird) {
        // Card must be trump color (but we know it's not Rook Bird since we checked above)
        // So this will be false, meaning only Rook Bird can be played
        return false;
      }

      // If player has trump cards, they must play trump
      if (trumpCards.length > 0) {
        return card.color === trumpColor;
      }
    }

    // Check if player must follow suit
    const mustFollow = this.mustFollowSuit(hand, leadCard);

    if (mustFollow) {
      // Player must play a card of the led suit
      return card.color === leadCard.color;
    }

    // If player cannot follow suit, they can play any card
    return true;
  }

  /**
   * Checks if the Rook Bird card can be played in the current situation
   * 
   * Requirements:
   * - Rook Bird can be played at any time (Requirement 6.1)
   * - This method exists for explicit checking and documentation
   * 
   * @param hand - The player's current hand
   * @param _leadCard - The card that was led (null if player is leading) - unused but kept for API consistency
   * @returns true if Rook Bird can be played (always true if in hand)
   */
  static isRookBirdPlayable(hand: Card[], _leadCard: Card | null): boolean {
    // Check if player has the Rook Bird card
    const hasRookBird = hand.some(card => card.color === 'rook');

    if (!hasRookBird) {
      return false;
    }

    // Rook Bird can be played at any time (Requirement 6.1)
    return true;
  }

  /**
   * Checks if player must play the Rook Bird card in the current situation
   * 
   * Requirements:
   * - When trump is led and player has Rook Bird but no other trump, must play Rook Bird (Requirement 6.4)
   * 
   * @param hand - The player's current hand
   * @param leadCard - The card that was led
   * @param trumpColor - The current trump color
   * @returns true if player must play Rook Bird
   */
  static mustPlayRookBird(hand: Card[], leadCard: Card, trumpColor: CardColor | null): boolean {
    // Check if player has the Rook Bird card
    const hasRookBird = hand.some(card => card.color === 'rook');

    if (!hasRookBird || trumpColor === null) {
      return false;
    }

    // When trump is led and player has Rook Bird but no other trump (Requirement 6.4)
    if (leadCard.color === trumpColor) {
      const trumpCards = hand.filter(c => c.color === trumpColor);

      // If player has no trump cards (only Rook Bird counts as trump), must play Rook Bird
      if (trumpCards.length === 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * Detects if a player has reneged (failed to follow suit when they had cards of the led suit)
   * 
   * Requirements:
   * - Verify player followed suit if they had cards of the led suit (Requirement 7.1)
   * 
   * @param playedCard - The card that was played
   * @param handBeforePlay - The player's hand before playing the card (including the played card)
   * @param leadCard - The card that was led (first card of the trick)
   * @param trumpColor - The current trump color
   * @returns true if a renege occurred, false otherwise
   */
  static detectRenege(
    playedCard: Card,
    handBeforePlay: Card[],
    leadCard: Card,
    trumpColor: CardColor | null
  ): boolean {
    // Rook Bird can be played at any time, so it's never a renege
    if (playedCard.color === 'rook') {
      return false;
    }

    // Special case: When Rook Bird is led, must play trump if you have it
    if (leadCard.color === 'rook' && trumpColor !== null) {
      const hasTrump = handBeforePlay.some(c => c.color === trumpColor);
      if (hasTrump && playedCard.color !== trumpColor) {
        return true; // Renege: had trump but didn't play it
      }
      return false;
    }

    // Special case: When trump is led and player has Rook Bird but no other trump
    if (trumpColor !== null && leadCard.color === trumpColor) {
      const trumpCards = handBeforePlay.filter(c => c.color === trumpColor);
      const hasRookBird = handBeforePlay.some(c => c.color === 'rook');

      // If player only has Rook Bird as trump (no regular trump cards)
      if (trumpCards.length === 0 && hasRookBird) {
        // Must play Rook Bird - but we already returned early if it was rook
        // So if we're here, they didn't play the Rook Bird
        return true; // Renege: had Rook Bird but didn't play it
      }

      // If player has trump cards, they must play trump
      // At this point, playedCard.color is CardColor (not 'rook' due to early return)
      if (trumpCards.length > 0 && playedCard.color !== trumpColor) {
        return true; // Renege: had trump but didn't play it
      }
    }

    // Standard case: Check if player must follow suit
    const hasLeadSuit = handBeforePlay.some(
      card => card.color === leadCard.color && card.color !== 'rook'
    );

    if (hasLeadSuit && playedCard.color !== leadCard.color) {
      return true; // Renege: had lead suit but didn't follow
    }

    return false;
  }
}
