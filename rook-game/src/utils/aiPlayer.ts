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
  const highCards = player.hand.filter(c => typeof c.value === 'number' && c.value >= 12);
  const rookBird = player.hand.find(c => c.color === 'rook');

  let handStrength = pointCards.length * 3 + highCards.length * 2;
  if (rookBird) handStrength += 10;

  const minBid = state.currentBid ? state.currentBid.amount + 5 : 70;
  
  // Simple bidding strategy
  if (handStrength >= 25 && minBid <= 100) {
    return { action: 'bid', amount: Math.min(minBid, 100) };
  } else if (handStrength >= 20 && minBid <= 85) {
    return { action: 'bid', amount: minBid };
  } else if (handStrength >= 15 && minBid <= 75) {
    return { action: 'bid', amount: minBid };
  }

  return { action: 'pass' };
};

/**
 * AI selects which cards to discard from nest
 */
export const aiSelectNestCards = (hand: Card[]): Card[] => {
  // Sort cards by value (keep high cards and point cards)
  const sortedHand = [...hand].sort((a, b) => {
    // Keep Rook Bird
    if (a.color === 'rook') return -1;
    if (b.color === 'rook') return 1;
    
    // Keep point cards
    if (a.points !== b.points) return b.points - a.points;
    
    // Keep high cards
    const aVal = typeof a.value === 'number' ? a.value : 15;
    const bVal = typeof b.value === 'number' ? b.value : 15;
    return bVal - aVal;
  });

  // Discard the 5 lowest value cards
  return sortedHand.slice(-5);
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
