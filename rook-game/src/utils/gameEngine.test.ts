import { describe, it, expect } from 'vitest';
import { dealCards, getPlayableCards, determineTrickWinner } from './gameEngine';
import type { GameState, Card, Trick } from '../types';
import { generateDeck } from './deckUtils';

describe('gameEngine', () => {
  describe('dealCards', () => {
    const createTestState = (): GameState => ({
      phase: 'dealing',
      players: [
        {
          id: 'player-0',
          name: 'Player 1',
          teamId: 'team1',
          position: 0,
          hand: [],
          capturedTricks: [],
        },
        {
          id: 'player-1',
          name: 'Player 2',
          teamId: 'team2',
          position: 1,
          hand: [],
          capturedTricks: [],
        },
        {
          id: 'player-2',
          name: 'Player 3',
          teamId: 'team1',
          position: 2,
          hand: [],
          capturedTricks: [],
        },
        {
          id: 'player-3',
          name: 'Player 4',
          teamId: 'team2',
          position: 3,
          hand: [],
          capturedTricks: [],
        },
      ],
      deck: generateDeck(),
      nest: [],
      originalNest: [],
      dealerId: 'player-0',
      currentPlayerId: 'player-1',
      winningScore: 500,
      nestSelectableCards: 3,
      currentBid: null,
      passedPlayers: new Set(),
      highBidder: null,
      biddingHistory: [],
      calledCard: null,
      partnerId: null,
      partnerRevealed: false,
      trumpColor: null,
      currentTrick: null,
      completedTricks: [],
      trickCompleted: false,
      isLastTrick: false,
      renegeInfo: null,
      scores: new Map([
        ['player-0', 0],
        ['player-1', 0],
        ['player-2', 0],
        ['player-3', 0],
      ]),
      roundScores: new Map([
        ['team1', 0],
        ['team2', 0],
      ]),
      scoreHistory: [],
      currentRound: 1,
    });

    it('should deal 13 cards to each player', () => {
      const state = createTestState();
      const newState = dealCards(state);

      newState.players.forEach((player) => {
        expect(player.hand.length).toBe(13);
      });
    });

    it('should create a nest with 5 cards', () => {
      const state = createTestState();
      const newState = dealCards(state);

      expect(newState.nest.length).toBe(5);
    });

    it('should use all 57 cards from the deck', () => {
      const state = createTestState();
      const newState = dealCards(state);

      const totalCards =
        newState.players.reduce((sum, player) => sum + player.hand.length, 0) +
        newState.nest.length;

      expect(totalCards).toBe(57);
    });

    it('should empty the deck after dealing', () => {
      const state = createTestState();
      const newState = dealCards(state);

      expect(newState.deck.length).toBe(0);
    });

    it('should change phase to bidding', () => {
      const state = createTestState();
      const newState = dealCards(state);

      expect(newState.phase).toBe('roundStart');
    });

    it('should deal unique cards (no duplicates)', () => {
      const state = createTestState();
      const newState = dealCards(state);

      const allCards = [
        ...newState.nest,
        ...newState.players.flatMap((p) => p.hand),
      ];

      const cardStrings = allCards.map((card) => `${card.color}-${card.value}`);
      const uniqueCards = new Set(cardStrings);

      expect(uniqueCards.size).toBe(allCards.length);
    });

    it('should deal cards starting with player to left of dealer', () => {
      const state = createTestState();
      const originalDeckFirstCard = state.deck[0];
      const newState = dealCards(state);

      // First card should go to player-1 (left of dealer player-0)
      expect(newState.players[1].hand).toContain(originalDeckFirstCard);
    });

    it('should handle different dealer positions', () => {
      // Test with dealer at position 2
      const state = createTestState();
      state.dealerId = 'player-2';
      state.currentPlayerId = 'player-3';

      const newState = dealCards(state);

      // Should still deal 13 cards to each player and 5 to nest
      expect(newState.players.every((p) => p.hand.length === 13)).toBe(true);
      expect(newState.nest.length).toBe(5);
    });
  });

  describe('getPlayableCards', () => {
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

    const createTestState = (
      playerHand: Card[],
      currentTrick: GameState['currentTrick'] = null,
      trumpColor: GameState['trumpColor'] = null
    ): GameState => ({
      phase: 'playing',
      players: [
        {
          id: 'player-0',
          name: 'Player 1',
          teamId: 'team1',
          position: 0,
          hand: playerHand,
          capturedTricks: [],
        },
        {
          id: 'player-1',
          name: 'Player 2',
          teamId: 'team2',
          position: 1,
          hand: [],
          capturedTricks: [],
        },
        {
          id: 'player-2',
          name: 'Player 3',
          teamId: 'team1',
          position: 2,
          hand: [],
          capturedTricks: [],
        },
        {
          id: 'player-3',
          name: 'Player 4',
          teamId: 'team2',
          position: 3,
          hand: [],
          capturedTricks: [],
        },
      ],
      deck: [],
      nest: [],
      originalNest: [],
      dealerId: 'player-0',
      currentPlayerId: 'player-0',
      winningScore: 500,
      nestSelectableCards: 3,
      currentBid: null,
      passedPlayers: new Set(),
      highBidder: null,
      biddingHistory: [],
      calledCard: null,
      partnerId: null,
      partnerRevealed: false,
      trumpColor,
      currentTrick,
      completedTricks: [],
      trickCompleted: false,
      isLastTrick: false,
      renegeInfo: null,
      scores: new Map([
        ['player-0', 0],
        ['player-1', 0],
        ['player-2', 0],
        ['player-3', 0],
      ]),
      roundScores: new Map([
        ['team1', 0],
        ['team2', 0],
      ]),
      scoreHistory: [],
      currentRound: 1,
    });

    describe('when player is leading', () => {
      it('should return all cards in hand as playable', () => {
        const hand = [
          createCard('red', 5),
          createCard('yellow', 7),
          createCard('green', 10),
        ];
        const state = createTestState(hand, null, 'black');

        const playableCards = getPlayableCards(state, 'player-0');

        expect(playableCards.size).toBe(3);
        expect(playableCards.has('red-5')).toBe(true);
        expect(playableCards.has('yellow-7')).toBe(true);
        expect(playableCards.has('green-10')).toBe(true);
      });

      it('should include Rook Bird as playable when leading', () => {
        const hand = [rookBird, createCard('red', 5)];
        const state = createTestState(hand, null, 'green');

        const playableCards = getPlayableCards(state, 'player-0');

        expect(playableCards.has('rook-bird')).toBe(true);
      });
    });

    describe('when following suit', () => {
      it('should return only cards of led suit when player has them', () => {
        const hand = [
          createCard('red', 3),
          createCard('red', 8),
          createCard('yellow', 7),
          createCard('green', 10),
        ];
        const leadCard = createCard('red', 5);
        const trick = {
          leadPlayerId: 'player-1',
          cards: new Map([['player-1', leadCard]]),
        };
        const state = createTestState(hand, trick, 'black');

        const playableCards = getPlayableCards(state, 'player-0');

        expect(playableCards.size).toBe(2);
        expect(playableCards.has('red-3')).toBe(true);
        expect(playableCards.has('red-8')).toBe(true);
        expect(playableCards.has('yellow-7')).toBe(false);
        expect(playableCards.has('green-10')).toBe(false);
      });

      it('should return all cards when player cannot follow suit', () => {
        const hand = [
          createCard('yellow', 7),
          createCard('green', 10),
          createCard('black', 3),
        ];
        const leadCard = createCard('red', 5);
        const trick = {
          leadPlayerId: 'player-1',
          cards: new Map([['player-1', leadCard]]),
        };
        const state = createTestState(hand, trick, 'black');

        const playableCards = getPlayableCards(state, 'player-0');

        expect(playableCards.size).toBe(3);
        expect(playableCards.has('yellow-7')).toBe(true);
        expect(playableCards.has('green-10')).toBe(true);
        expect(playableCards.has('black-3')).toBe(true);
      });

      it('should always include Rook Bird as playable', () => {
        const hand = [
          rookBird,
          createCard('red', 3),
          createCard('yellow', 7),
        ];
        const leadCard = createCard('red', 5);
        const trick = {
          leadPlayerId: 'player-1',
          cards: new Map([['player-1', leadCard]]),
        };
        const state = createTestState(hand, trick, 'green');

        const playableCards = getPlayableCards(state, 'player-0');

        // Should include Rook Bird and red-3 (following suit)
        expect(playableCards.has('rook-bird')).toBe(true);
        expect(playableCards.has('red-3')).toBe(true);
        expect(playableCards.has('yellow-7')).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should return empty set for non-existent player', () => {
        const hand = [createCard('red', 5)];
        const state = createTestState(hand, null, 'green');

        const playableCards = getPlayableCards(state, 'non-existent-player');

        expect(playableCards.size).toBe(0);
      });

      it('should return empty set for player with empty hand', () => {
        const state = createTestState([], null, 'green');

        const playableCards = getPlayableCards(state, 'player-0');

        expect(playableCards.size).toBe(0);
      });

      it('should work with null trump color', () => {
        const hand = [createCard('red', 5), createCard('yellow', 7)];
        const state = createTestState(hand, null, null);

        const playableCards = getPlayableCards(state, 'player-0');

        expect(playableCards.size).toBe(2);
      });

      it('should handle trick with multiple cards played', () => {
        const hand = [createCard('red', 3), createCard('yellow', 7)];
        const leadCard = createCard('red', 5);
        const trick = {
          leadPlayerId: 'player-1',
          cards: new Map([
            ['player-1', leadCard],
            ['player-2', createCard('red', 9)],
          ]),
        };
        const state = createTestState(hand, trick, 'black');

        const playableCards = getPlayableCards(state, 'player-0');

        // Should only allow red-3 (following suit)
        expect(playableCards.size).toBe(1);
        expect(playableCards.has('red-3')).toBe(true);
      });
    });
  });

  describe('determineTrickWinner', () => {
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

    describe('basic trick winning', () => {
      it('should award trick to highest card of led suit', () => {
        const trick: Trick = {
          leadPlayerId: 'player-0',
          cards: new Map([
            ['player-0', createCard('red', 5)],
            ['player-1', createCard('red', 8)],
            ['player-2', createCard('red', 3)],
            ['player-3', createCard('red', 12)],
          ]),
        };

        const winner = determineTrickWinner(trick, 'green');

        expect(winner).toBe('player-3'); // red-12 is highest
      });

      it('should award trick to trump card over led suit', () => {
        const trick: Trick = {
          leadPlayerId: 'player-0',
          cards: new Map([
            ['player-0', createCard('red', 14)],
            ['player-1', createCard('green', 3)], // trump
            ['player-2', createCard('red', 10)],
            ['player-3', createCard('red', 12)],
          ]),
        };

        const winner = determineTrickWinner(trick, 'green');

        expect(winner).toBe('player-1'); // green-3 is trump
      });

      it('should award trick to highest trump when multiple trumps played', () => {
        const trick: Trick = {
          leadPlayerId: 'player-0',
          cards: new Map([
            ['player-0', createCard('red', 14)],
            ['player-1', createCard('green', 3)], // trump
            ['player-2', createCard('green', 10)], // higher trump
            ['player-3', createCard('red', 12)],
          ]),
        };

        const winner = determineTrickWinner(trick, 'green');

        expect(winner).toBe('player-2'); // green-10 is highest trump
      });
    });

    describe('Rook Bird special rules', () => {
      it('should award trick to trump over Rook Bird (Rook is lowest trump)', () => {
        const trick: Trick = {
          leadPlayerId: 'player-0',
          cards: new Map([
            ['player-0', createCard('red', 14)],
            ['player-1', createCard('green', 14)], // trump
            ['player-2', rookBird],
            ['player-3', createCard('red', 12)],
          ]),
        };

        const winner = determineTrickWinner(trick, 'green');

        expect(winner).toBe('player-1'); // green-14 beats Rook Bird (lowest trump)
      });

      it('should award trick to trump when Rook Bird is led', () => {
        const trick: Trick = {
          leadPlayerId: 'player-0',
          cards: new Map([
            ['player-0', rookBird],
            ['player-1', createCard('green', 14)], // trump
            ['player-2', createCard('green', 10)], // trump
            ['player-3', createCard('red', 12)],
          ]),
        };

        const winner = determineTrickWinner(trick, 'green');

        expect(winner).toBe('player-1'); // green-14 beats Rook Bird
      });

      it('should award trick to highest trump when Rook Bird is played', () => {
        const trick: Trick = {
          leadPlayerId: 'player-0',
          cards: new Map([
            ['player-0', createCard('black', 14)], // trump
            ['player-1', createCard('black', 13)], // trump
            ['player-2', rookBird],
            ['player-3', createCard('black', 12)], // trump
          ]),
        };

        const winner = determineTrickWinner(trick, 'black');

        expect(winner).toBe('player-0'); // black-14 beats Rook Bird (lowest trump)
      });
    });

    describe('off-suit cards', () => {
      it('should not award trick to off-suit card even if higher value', () => {
        const trick: Trick = {
          leadPlayerId: 'player-0',
          cards: new Map([
            ['player-0', createCard('red', 5)],
            ['player-1', createCard('yellow', 14)], // off-suit, high value
            ['player-2', createCard('red', 8)],
            ['player-3', createCard('green', 14)], // off-suit, high value
          ]),
        };

        const winner = determineTrickWinner(trick, 'black');

        expect(winner).toBe('player-2'); // red-8 is highest of led suit
      });

      it('should award to lead card when all others are off-suit', () => {
        const trick: Trick = {
          leadPlayerId: 'player-0',
          cards: new Map([
            ['player-0', createCard('red', 3)],
            ['player-1', createCard('yellow', 14)],
            ['player-2', createCard('green', 14)],
            ['player-3', createCard('black', 14)],
          ]),
        };

        const winner = determineTrickWinner(trick, null);

        expect(winner).toBe('player-0'); // lead card wins
      });
    });

    describe('edge cases', () => {
      it('should handle trick with no trump color set', () => {
        const trick: Trick = {
          leadPlayerId: 'player-0',
          cards: new Map([
            ['player-0', createCard('red', 5)],
            ['player-1', createCard('red', 8)],
            ['player-2', createCard('yellow', 14)],
            ['player-3', createCard('red', 12)],
          ]),
        };

        const winner = determineTrickWinner(trick, null);

        expect(winner).toBe('player-3'); // red-12 is highest of led suit
      });

      it('should handle all same value cards', () => {
        const trick: Trick = {
          leadPlayerId: 'player-0',
          cards: new Map([
            ['player-0', createCard('red', 7)],
            ['player-1', createCard('yellow', 7)],
            ['player-2', createCard('green', 7)],
            ['player-3', createCard('black', 7)],
          ]),
        };

        const winner = determineTrickWinner(trick, null);

        expect(winner).toBe('player-0'); // lead card wins when tied
      });

      it('should throw error if trick does not have 4 cards', () => {
        const trick: Trick = {
          leadPlayerId: 'player-0',
          cards: new Map([
            ['player-0', createCard('red', 5)],
            ['player-1', createCard('red', 8)],
          ]),
        };

        expect(() => determineTrickWinner(trick, 'green')).toThrow(
          'Trick must have exactly 4 cards to determine winner'
        );
      });
    });
  });
});
