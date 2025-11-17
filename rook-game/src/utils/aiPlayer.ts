import type { GameState, Card, CardColor } from '../types';
import { getPlayableCards } from './gameEngine';

/**
 * Simple AI for computer players
 */

/**
 * AI decides whether to bid and how much
 */
export const aiMakeBid = (state: GameState, playerId: string): { action: 'bid' | 'pass'; amount?: number } => {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return { action: 'pass' };

  // Calculate hand strength based on point cards and high cards
  const pointCards = player.hand.filter(c => c.points > 0);
  const highCards = player.hand.filter(c => typeof c.value === 'number' && c.value >= 11);
  const mediumCards = player.hand.filter(c => typeof c.value === 'number' && c.value >= 8 && c.value < 11);
  const rookBird = player.hand.find(c => c.color === 'rook');

  // More nuanced hand strength calculation
  let handStrength = 0;
  handStrength += pointCards.reduce((sum, card) => sum + card.points, 0); // Actual points
  handStrength += highCards.length * 4; // High cards are valuable
  handStrength += mediumCards.length * 2; // Medium cards have some value
  if (rookBird) handStrength += 15; // Rook is very valuable

  const minBid = state.currentBid ? state.currentBid.amount + 5 : 40;

  // Bidding strategy with some randomness
  const randomFactor = Math.random() * 8 - 4; // -4 to +4 variation
  const adjustedStrength = handStrength + randomFactor;

  // Conservative bid thresholds - rarely bid over 100
  if (adjustedStrength >= 60 && minBid <= 105) {
    // Very strong hand - willing to bid up to 105
    return { action: 'bid', amount: minBid };
  } else if (adjustedStrength >= 50 && minBid <= 95) {
    // Strong hand - bid up to 95
    return { action: 'bid', amount: minBid };
  } else if (adjustedStrength >= 40 && minBid <= 85) {
    // Good hand - bid up to 85
    return { action: 'bid', amount: minBid };
  } else if (adjustedStrength >= 30 && minBid <= 80) {
    // Decent hand - bid up to 80
    return { action: 'bid', amount: minBid };
  } else if (adjustedStrength >= 22 && minBid <= 75) {
    // Minimum hand - bid up to 75
    return { action: 'bid', amount: minBid };
  }

  return { action: 'pass' };
};

/**
 * AI selects which cards to take from nest and which to discard
 * Returns { cardsToAdd: Card[], cardsToDiscard: Card[] }
 */
export const aiSelectNestCards = (
  hand: Card[],
  nest: Card[]
): { cardsToAdd: Card[]; cardsToDiscard: Card[] } => {
  // Separate nest cards from original hand
  const nestCardIds = new Set(nest.map(c => c.id));
  const originalHand = hand.filter(c => !nestCardIds.has(c.id));

  // Evaluate each nest card's value
  const evaluateCard = (card: Card): number => {
    let value = 0;

    // Rook is very valuable
    if (card.color === 'rook') return 100;

    // Point cards are valuable
    value += card.points * 2;

    // High cards are valuable
    if (typeof card.value === 'number') {
      value += card.value;
    }

    return value;
  };

  // Sort nest cards by value (best first)
  const sortedNest = [...nest].sort((a, b) => evaluateCard(b) - evaluateCard(a));

  // Take up to 3 best cards from nest
  const cardsToAdd = sortedNest.slice(0, 3);

  // Sort original hand by value (worst first for discarding)
  const sortedHand = [...originalHand].sort((a, b) => evaluateCard(a) - evaluateCard(b));

  // Discard same number of worst cards from original hand
  const cardsToDiscard = sortedHand.slice(0, cardsToAdd.length);

  return { cardsToAdd, cardsToDiscard };
};

/**
 * AI selects trump color
 */
export const aiSelectTrump = (hand: Card[]): CardColor => {
  // Count cards by color
  const colorCounts: Record<CardColor, number> = {
    red: 0,
    yellow: 0,
    green: 0,
    black: 0,
  };

  hand.forEach(card => {
    if (card.color !== 'rook') {
      colorCounts[card.color as CardColor]++;
    }
  });

  // Select color with most cards
  let maxCount = 0;
  let bestColor: CardColor = 'red';

  (Object.keys(colorCounts) as CardColor[]).forEach(color => {
    if (colorCounts[color] > maxCount) {
      maxCount = colorCounts[color];
      bestColor = color;
    }
  });

  return bestColor;
};

/**
 * AI selects a partner card to call
 * Strategy: Call a high card in trump suit that AI doesn't have
 */
export const aiSelectPartner = (hand: Card[], trumpColor: CardColor | null): Card => {
  if (!trumpColor) {
    // Fallback: call a high card in any color
    return { id: 'red-14', color: 'red', value: 14, points: 10 };
  }

  // Get all cards in trump suit that AI doesn't have
  const trumpCardsInHand = hand.filter(c => c.color === trumpColor);
  const trumpCardValues = new Set(trumpCardsInHand.map(c => c.value));

  // Prefer calling high trump cards (14, 13, 12, 11, 10)
  const preferredValues: import('../types').CardValue[] = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

  for (const value of preferredValues) {
    if (!trumpCardValues.has(value)) {
      // Call this card
      const points = value === 1 ? 15 : value === 14 ? 10 : value === 10 ? 10 : value === 5 ? 5 : 0;
      return {
        id: `${trumpColor}-${value}`,
        color: trumpColor,
        value: value as import('../types').CardValue,
        points,
      };
    }
  }

  // Fallback: call highest trump card (shouldn't reach here normally)
  return {
    id: `${trumpColor}-14`,
    color: trumpColor,
    value: 14 as import('../types').CardValue,
    points: 10,
  };
};

/**
 * AI selects which card to play
 */
export const aiPlayCard = (state: GameState, playerId: string): Card | null => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.hand.length === 0) return null;

  const playableCards = Array.from(getPlayableCards(state, playerId))
    .map(cardId => player.hand.find(c => c.id === cardId))
    .filter((c): c is Card => c !== undefined);

  if (playableCards.length === 0) return null;

  const currentTrick = state.currentTrick;
  const trumpColor = state.trumpColor;

  // If leading the trick
  if (!currentTrick || currentTrick.cards.size === 0) {
    // Lead with a high card or point card
    const pointCards = playableCards.filter(c => c.points > 0);
    if (pointCards.length > 0) {
      // Lead with highest point card
      return pointCards.reduce((highest, card) => {
        const cardVal = typeof card.value === 'number' ? card.value : 15;
        const highestVal = typeof highest.value === 'number' ? highest.value : 15;
        return cardVal > highestVal ? card : highest;
      });
    }

    // Otherwise lead with highest card
    return playableCards.reduce((highest, card) => {
      const cardVal = typeof card.value === 'number' ? card.value : 15;
      const highestVal = typeof highest.value === 'number' ? highest.value : 15;
      return cardVal > highestVal ? card : highest;
    });
  }

  // Following in a trick - try to win or dump low cards
  const leadCard = Array.from(currentTrick.cards.values())[0];
  const leadColor = leadCard.color;

  // Check if we can follow suit
  const sameSuitCards = playableCards.filter(c => c.color === leadColor);

  if (sameSuitCards.length > 0) {
    // Try to win with highest card of suit
    return sameSuitCards.reduce((highest, card) => {
      const cardVal = typeof card.value === 'number' ? card.value : 15;
      const highestVal = typeof highest.value === 'number' ? highest.value : 15;
      return cardVal > highestVal ? card : highest;
    });
  }

  // Can't follow suit - check if we should trump
  const trumpCards = playableCards.filter(c =>
    c.color === trumpColor || c.color === 'rook'
  );

  if (trumpCards.length > 0) {
    // Play lowest trump
    return trumpCards.reduce((lowest, card) => {
      const cardVal = typeof card.value === 'number' ? card.value : 0;
      const lowestVal = typeof lowest.value === 'number' ? lowest.value : 0;
      return cardVal < lowestVal ? card : lowest;
    });
  }

  // Can't follow suit or trump - dump lowest card
  return playableCards.reduce((lowest, card) => {
    const cardVal = typeof card.value === 'number' ? card.value : 0;
    const lowestVal = typeof lowest.value === 'number' ? lowest.value : 0;
    return cardVal < lowestVal ? card : lowest;
  });
};
