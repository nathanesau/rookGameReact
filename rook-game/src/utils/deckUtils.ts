import type { Card, CardColor, CardValue } from '../types';

/**
 * Gets the point value for a card based on its value
 * 5 cards = 5 points
 * 10 and 14 cards = 10 points
 * Rook Bird = 20 points
 * All other cards = 0 points
 */
export function getCardPoints(value: CardValue | 'rook'): number {
  if (value === 'rook') return 20;
  if (value === 5) return 5;
  if (value === 10 || value === 14) return 10;
  return 0;
}

/**
 * Generates a complete Rook deck with 57 cards:
 * - 56 colored cards (4 colors × 14 values)
 * - 1 Rook Bird card
 */
export function generateDeck(): Card[] {
  const colors: CardColor[] = ['red', 'yellow', 'green', 'black'];
  const values: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const cards: Card[] = [];

  // Generate colored cards
  for (const color of colors) {
    for (const value of values) {
      cards.push({
        id: `${color}-${value}`,
        color,
        value,
        points: getCardPoints(value),
      });
    }
  }

  // Add Rook Bird card
  cards.push({
    id: 'rook-bird',
    color: 'rook',
    value: 'rook',
    points: 20,
  });

  return cards;
}

/**
 * Shuffles an array of cards using the Fisher-Yates algorithm
 * Returns a new shuffled array without modifying the original
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Checks if a hand contains any point cards (counters)
 * Point cards are: 5s (5 points), 10s (10 points), 14s (10 points), and Rook Bird (20 points)
 */
export function hasPointCards(hand: Card[]): boolean {
  return hand.some(card => card.points > 0);
}
