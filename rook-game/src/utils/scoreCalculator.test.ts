import { describe, it, expect } from 'vitest';
import { ScoreCalculator } from './scoreCalculator';
import type { Card, Trick } from '../types';

describe('ScoreCalculator', () => {
  describe('getCardPoints', () => {
    it('should return 20 points for Rook Bird card', () => {
      const rookCard: Card = {
        id: 'rook-bird',
        color: 'rook',
        value: 'rook',
        points: 20,
      };
      expect(ScoreCalculator.getCardPoints(rookCard)).toBe(20);
    });

    it('should return 5 points for 5 cards', () => {
      const fiveCard: Card = {
        id: 'red-5',
        color: 'red',
        value: 5,
        points: 5,
      };
      expect(ScoreCalculator.getCardPoints(fiveCard)).toBe(5);
    });

    it('should return 10 points for 10 cards', () => {
      const tenCard: Card = {
        id: 'yellow-10',
        color: 'yellow',
        value: 10,
        points: 10,
      };
      expect(ScoreCalculator.getCardPoints(tenCard)).toBe(10);
    });

    it('should return 10 points for 14 cards', () => {
      const fourteenCard: Card = {
        id: 'green-14',
        color: 'green',
        value: 14,
        points: 10,
      };
      expect(ScoreCalculator.getCardPoints(fourteenCard)).toBe(10);
    });

    it('should return 0 points for non-counter cards', () => {
      const nonCounterCards: Card[] = [
        { id: 'red-1', color: 'red', value: 1, points: 0 },
        { id: 'yellow-7', color: 'yellow', value: 7, points: 0 },
        { id: 'green-13', color: 'green', value: 13, points: 0 },
      ];

      nonCounterCards.forEach(card => {
        expect(ScoreCalculator.getCardPoints(card)).toBe(0);
      });
    });
  });

  describe('calculateTrickPoints', () => {
    it('should return 0 for trick with no counters', () => {
      const cards: Card[] = [
        { id: 'red-1', color: 'red', value: 1, points: 0 },
        { id: 'yellow-2', color: 'yellow', value: 2, points: 0 },
        { id: 'green-3', color: 'green', value: 3, points: 0 },
        { id: 'black-4', color: 'black', value: 4, points: 0 },
      ];
      expect(ScoreCalculator.calculateTrickPoints(cards)).toBe(0);
    });

    it('should calculate points for trick with one 5 card', () => {
      const cards: Card[] = [
        { id: 'red-5', color: 'red', value: 5, points: 5 },
        { id: 'yellow-2', color: 'yellow', value: 2, points: 0 },
        { id: 'green-3', color: 'green', value: 3, points: 0 },
        { id: 'black-4', color: 'black', value: 4, points: 0 },
      ];
      expect(ScoreCalculator.calculateTrickPoints(cards)).toBe(5);
    });

    it('should calculate points for trick with 10 and 14 cards', () => {
      const cards: Card[] = [
        { id: 'red-10', color: 'red', value: 10, points: 10 },
        { id: 'yellow-14', color: 'yellow', value: 14, points: 10 },
        { id: 'green-3', color: 'green', value: 3, points: 0 },
        { id: 'black-4', color: 'black', value: 4, points: 0 },
      ];
      expect(ScoreCalculator.calculateTrickPoints(cards)).toBe(20);
    });

    it('should calculate points for trick with Rook Bird', () => {
      const cards: Card[] = [
        { id: 'rook-bird', color: 'rook', value: 'rook', points: 20 },
        { id: 'yellow-2', color: 'yellow', value: 2, points: 0 },
        { id: 'green-3', color: 'green', value: 3, points: 0 },
        { id: 'black-4', color: 'black', value: 4, points: 0 },
      ];
      expect(ScoreCalculator.calculateTrickPoints(cards)).toBe(20);
    });

    it('should calculate points for trick with multiple counters', () => {
      const cards: Card[] = [
        { id: 'red-5', color: 'red', value: 5, points: 5 },
        { id: 'yellow-10', color: 'yellow', value: 10, points: 10 },
        { id: 'green-14', color: 'green', value: 14, points: 10 },
        { id: 'rook-bird', color: 'rook', value: 'rook', points: 20 },
      ];
      expect(ScoreCalculator.calculateTrickPoints(cards)).toBe(45);
    });

    it('should return 0 for empty array', () => {
      expect(ScoreCalculator.calculateTrickPoints([])).toBe(0);
    });
  });

  describe('calculateTeamScore', () => {
    const createTrick = (winnerId: string, cards: Card[]): Trick => {
      const trick: Trick = {
        leadPlayerId: 'player1',
        cards: new Map(),
        winnerId,
      };
      
      cards.forEach((card, index) => {
        trick.cards.set(`player${index + 1}`, card);
      });
      
      return trick;
    };

    it('should calculate score for team with no tricks won', () => {
      const tricks: Trick[] = [
        createTrick('player2', [
          { id: 'red-5', color: 'red', value: 5, points: 5 },
          { id: 'yellow-2', color: 'yellow', value: 2, points: 0 },
          { id: 'green-3', color: 'green', value: 3, points: 0 },
          { id: 'black-4', color: 'black', value: 4, points: 0 },
        ]),
      ];

      const score = ScoreCalculator.calculateTeamScore(
        tricks,
        ['player1', 'player3'],
        [],
        null
      );

      expect(score).toBe(0);
    });

    it('should calculate score for team with one trick won', () => {
      const tricks: Trick[] = [
        createTrick('player1', [
          { id: 'red-5', color: 'red', value: 5, points: 5 },
          { id: 'yellow-10', color: 'yellow', value: 10, points: 10 },
          { id: 'green-3', color: 'green', value: 3, points: 0 },
          { id: 'black-4', color: 'black', value: 4, points: 0 },
        ]),
      ];

      const score = ScoreCalculator.calculateTeamScore(
        tricks,
        ['player1', 'player3'],
        [],
        null
      );

      expect(score).toBe(15);
    });

    it('should calculate score for team with multiple tricks won', () => {
      const tricks: Trick[] = [
        createTrick('player1', [
          { id: 'red-5', color: 'red', value: 5, points: 5 },
          { id: 'yellow-2', color: 'yellow', value: 2, points: 0 },
          { id: 'green-3', color: 'green', value: 3, points: 0 },
          { id: 'black-4', color: 'black', value: 4, points: 0 },
        ]),
        createTrick('player3', [
          { id: 'red-10', color: 'red', value: 10, points: 10 },
          { id: 'yellow-14', color: 'yellow', value: 14, points: 10 },
          { id: 'green-1', color: 'green', value: 1, points: 0 },
          { id: 'black-2', color: 'black', value: 2, points: 0 },
        ]),
      ];

      const score = ScoreCalculator.calculateTeamScore(
        tricks,
        ['player1', 'player3'],
        [],
        null
      );

      expect(score).toBe(25);
    });

    it('should include nest points when team member won last trick', () => {
      const tricks: Trick[] = [
        createTrick('player1', [
          { id: 'red-5', color: 'red', value: 5, points: 5 },
          { id: 'yellow-2', color: 'yellow', value: 2, points: 0 },
          { id: 'green-3', color: 'green', value: 3, points: 0 },
          { id: 'black-4', color: 'black', value: 4, points: 0 },
        ]),
      ];

      const nest: Card[] = [
        { id: 'red-10', color: 'red', value: 10, points: 10 },
        { id: 'yellow-14', color: 'yellow', value: 14, points: 10 },
        { id: 'green-5', color: 'green', value: 5, points: 5 },
        { id: 'black-1', color: 'black', value: 1, points: 0 },
        { id: 'red-2', color: 'red', value: 2, points: 0 },
      ];

      const score = ScoreCalculator.calculateTeamScore(
        tricks,
        ['player1', 'player3'],
        nest,
        'player1'
      );

      expect(score).toBe(30); // 5 from trick + 25 from nest
    });

    it('should not include nest points when opposing team won last trick', () => {
      const tricks: Trick[] = [
        createTrick('player1', [
          { id: 'red-5', color: 'red', value: 5, points: 5 },
          { id: 'yellow-2', color: 'yellow', value: 2, points: 0 },
          { id: 'green-3', color: 'green', value: 3, points: 0 },
          { id: 'black-4', color: 'black', value: 4, points: 0 },
        ]),
      ];

      const nest: Card[] = [
        { id: 'red-10', color: 'red', value: 10, points: 10 },
        { id: 'yellow-14', color: 'yellow', value: 14, points: 10 },
        { id: 'green-5', color: 'green', value: 5, points: 5 },
        { id: 'black-1', color: 'black', value: 1, points: 0 },
        { id: 'red-2', color: 'red', value: 2, points: 0 },
      ];

      const score = ScoreCalculator.calculateTeamScore(
        tricks,
        ['player1', 'player3'],
        nest,
        'player2' // Opposing team won last trick
      );

      expect(score).toBe(5); // Only 5 from trick, no nest points
    });

    it('should calculate correct score with Rook Bird in tricks', () => {
      const tricks: Trick[] = [
        createTrick('player1', [
          { id: 'rook-bird', color: 'rook', value: 'rook', points: 20 },
          { id: 'yellow-2', color: 'yellow', value: 2, points: 0 },
          { id: 'green-3', color: 'green', value: 3, points: 0 },
          { id: 'black-4', color: 'black', value: 4, points: 0 },
        ]),
      ];

      const score = ScoreCalculator.calculateTeamScore(
        tricks,
        ['player1', 'player3'],
        [],
        null
      );

      expect(score).toBe(20);
    });
  });

  describe('applyBidResult', () => {
    it('should return captured points when bid is made exactly', () => {
      const result = ScoreCalculator.applyBidResult(100, 100);
      expect(result).toBe(100);
    });

    it('should return captured points when bid is exceeded', () => {
      const result = ScoreCalculator.applyBidResult(120, 100);
      expect(result).toBe(120);
    });

    it('should return negative bid amount when bid is failed', () => {
      const result = ScoreCalculator.applyBidResult(95, 100);
      expect(result).toBe(-100);
    });

    it('should return negative bid amount when captured points are zero', () => {
      const result = ScoreCalculator.applyBidResult(0, 80);
      expect(result).toBe(-80);
    });

    it('should handle minimum bid of 70', () => {
      const madeBid = ScoreCalculator.applyBidResult(70, 70);
      expect(madeBid).toBe(70);

      const failedBid = ScoreCalculator.applyBidResult(65, 70);
      expect(failedBid).toBe(-70);
    });

    it('should handle maximum bid of 120', () => {
      const madeBid = ScoreCalculator.applyBidResult(120, 120);
      expect(madeBid).toBe(120);

      const failedBid = ScoreCalculator.applyBidResult(115, 120);
      expect(failedBid).toBe(-120);
    });

    it('should handle edge case where team captures all 180 points', () => {
      // Total possible points in a round: 4 colors × 4 counters (5,10,14) × points + Rook Bird
      // = 4×(5+10+10) + 20 = 100 + 20 = 120 points per color... wait, let me recalculate
      // Actually: 4 fives (20) + 4 tens (40) + 4 fourteens (40) + Rook (20) = 120 total
      const result = ScoreCalculator.applyBidResult(120, 80);
      expect(result).toBe(120);
    });
  });
});
