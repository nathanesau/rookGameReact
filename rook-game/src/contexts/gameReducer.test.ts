import { describe, it, expect, beforeEach } from 'vitest';
import { gameReducer, createInitialState } from './gameReducer';
import type { GameState, Card } from '../types';

describe('gameReducer - Bidding Phase', () => {
  let initialState: GameState;

  beforeEach(() => {
    // Create mock cards for testing
    const mockCards = Array.from({ length: 57 }, (_, i) => ({
      id: `card-${i}`,
      color: 'red' as const,
      value: 1 as const,
      points: 0,
    }));

    // Create a state ready for bidding
    initialState = {
      ...createInitialState(),
      phase: 'bidding',
      players: [
        {
          id: 'player-0',
          name: 'Player 1',
          teamId: 'team1',
          position: 0,
          hand: mockCards.slice(0, 13),
          capturedTricks: [],
        },
        {
          id: 'player-1',
          name: 'Player 2',
          teamId: 'team2',
          position: 1,
          hand: mockCards.slice(13, 26),
          capturedTricks: [],
        },
        {
          id: 'player-2',
          name: 'Player 3',
          teamId: 'team1',
          position: 2,
          hand: mockCards.slice(26, 39),
          capturedTricks: [],
        },
        {
          id: 'player-3',
          name: 'Player 4',
          teamId: 'team2',
          position: 3,
          hand: mockCards.slice(39, 52),
          capturedTricks: [],
        },
      ],
      nest: mockCards.slice(52, 57),
      dealerId: 'player-0',
      currentPlayerId: 'player-1',
      currentBid: null,
      passedPlayers: new Set(),
      highBidder: null,
    };
  });

  describe('PLACE_BID action', () => {
    it('should accept a valid first bid', () => {
      const action = {
        type: 'PLACE_BID' as const,
        payload: { playerId: 'player-1', amount: 70 },
      };

      const newState = gameReducer(initialState, action);

      expect(newState.currentBid).toEqual({ playerId: 'player-1', amount: 70 });
      expect(newState.currentPlayerId).toBe('player-2');
      expect(newState.phase).toBe('bidding');
    });

    it('should accept a higher bid', () => {
      const stateWithBid = {
        ...initialState,
        currentBid: { playerId: 'player-1', amount: 70 },
        currentPlayerId: 'player-2',
      };

      const action = {
        type: 'PLACE_BID' as const,
        payload: { playerId: 'player-2', amount: 75 },
      };

      const newState = gameReducer(stateWithBid, action);

      expect(newState.currentBid).toEqual({ playerId: 'player-2', amount: 75 });
      expect(newState.currentPlayerId).toBe('player-3');
    });

    it('should reject bid from wrong player', () => {
      const action = {
        type: 'PLACE_BID' as const,
        payload: { playerId: 'player-0', amount: 70 },
      };

      const newState = gameReducer(initialState, action);

      expect(newState.currentBid).toBeNull();
      expect(newState.currentPlayerId).toBe('player-1');
    });

    it('should reject invalid bid amount', () => {
      const action = {
        type: 'PLACE_BID' as const,
        payload: { playerId: 'player-1', amount: 35 }, // Below minimum of 40
      };

      const newState = gameReducer(initialState, action);

      expect(newState.currentBid).toBeNull();
      expect(newState.currentPlayerId).toBe('player-1');
    });

    it('should reject bid from player who already passed', () => {
      const stateWithPass = {
        ...initialState,
        passedPlayers: new Set(['player-1']),
        currentPlayerId: 'player-1',
      };

      const action = {
        type: 'PLACE_BID' as const,
        payload: { playerId: 'player-1', amount: 70 },
      };

      const newState = gameReducer(stateWithPass, action);

      expect(newState.currentBid).toBeNull();
    });

    it('should skip passed players when rotating turn', () => {
      const stateWithPasses = {
        ...initialState,
        currentPlayerId: 'player-1',
        passedPlayers: new Set(['player-2']),
      };

      const action = {
        type: 'PLACE_BID' as const,
        payload: { playerId: 'player-1', amount: 70 },
      };

      const newState = gameReducer(stateWithPasses, action);

      expect(newState.currentPlayerId).toBe('player-3'); // Skip player-2
    });

    it('should determine high bidder when all others have passed', () => {
      const stateWithPasses = {
        ...initialState,
        currentPlayerId: 'player-1',
        passedPlayers: new Set(['player-2', 'player-3', 'player-0']),
      };

      const action = {
        type: 'PLACE_BID' as const,
        payload: { playerId: 'player-1', amount: 70 },
      };

      const newState = gameReducer(stateWithPasses, action);

      expect(newState.highBidder).toBe('player-1');
      expect(newState.phase).toBe('biddingComplete');
      expect(newState.currentPlayerId).toBe('player-1');
      // Nest cards NOT added yet - they're added when transitioning to nestSelection
      const highBidder = newState.players.find(p => p.id === 'player-1');
      expect(highBidder?.hand.length).toBe(13); // Still 13 cards
    });
  });

  describe('CONTINUE_TO_NEST_SELECTION action', () => {
    it('should add nest cards to high bidder when transitioning to nest selection', () => {
      const biddingCompleteState = {
        ...initialState,
        phase: 'biddingComplete' as const,
        highBidder: 'player-1',
        currentPlayerId: 'player-1',
        currentBid: { playerId: 'player-1', amount: 70 },
      };

      const action = { type: 'CONTINUE_TO_NEST_SELECTION' as const };
      const newState = gameReducer(biddingCompleteState, action);

      expect(newState.phase).toBe('nestSelection');
      // Now nest cards should be added
      const highBidder = newState.players.find(p => p.id === 'player-1');
      expect(highBidder?.hand.length).toBe(18); // 13 original + 5 nest cards
    });
  });

  describe('PASS_BID action', () => {
    it('should allow player to pass', () => {
      const action = {
        type: 'PASS_BID' as const,
        payload: { playerId: 'player-1' },
      };

      const newState = gameReducer(initialState, action);

      expect(newState.passedPlayers.has('player-1')).toBe(true);
      expect(newState.currentPlayerId).toBe('player-2');
    });

    it('should reject pass from wrong player', () => {
      const action = {
        type: 'PASS_BID' as const,
        payload: { playerId: 'player-0' },
      };

      const newState = gameReducer(initialState, action);

      expect(newState.passedPlayers.has('player-0')).toBe(false);
      expect(newState.currentPlayerId).toBe('player-1');
    });

    it('should reject pass from player who already passed', () => {
      const stateWithPass = {
        ...initialState,
        passedPlayers: new Set(['player-1']),
        currentPlayerId: 'player-1',
      };

      const action = {
        type: 'PASS_BID' as const,
        payload: { playerId: 'player-1' },
      };

      const newState = gameReducer(stateWithPass, action);

      expect(newState.passedPlayers.size).toBe(1);
    });

    it('should skip passed players when rotating turn', () => {
      const stateWithPass = {
        ...initialState,
        currentPlayerId: 'player-1',
        passedPlayers: new Set(['player-2']),
      };

      const action = {
        type: 'PASS_BID' as const,
        payload: { playerId: 'player-1' },
      };

      const newState = gameReducer(stateWithPass, action);

      expect(newState.currentPlayerId).toBe('player-3'); // Skip player-2
    });

    it('should keep last player in bidding if no one has bid', () => {
      const stateWithPasses = {
        ...initialState,
        currentPlayerId: 'player-1',
        passedPlayers: new Set(['player-2', 'player-3']),
        currentBid: null,
      };

      const action = {
        type: 'PASS_BID' as const,
        payload: { playerId: 'player-1' },
      };

      const newState = gameReducer(stateWithPasses, action);

      expect(newState.phase).toBe('bidding');
      expect(newState.currentPlayerId).toBe('player-0');
      expect(newState.highBidder).toBeNull();
    });

    it('should determine high bidder when last player passes', () => {
      const stateWithBidAndPasses = {
        ...initialState,
        currentPlayerId: 'player-2',
        currentBid: { playerId: 'player-1', amount: 70 },
        passedPlayers: new Set(['player-3', 'player-0']),
      };

      const action = {
        type: 'PASS_BID' as const,
        payload: { playerId: 'player-2' },
      };

      const newState = gameReducer(stateWithBidAndPasses, action);

      expect(newState.highBidder).toBe('player-1');
      expect(newState.phase).toBe('biddingComplete');
      expect(newState.currentPlayerId).toBe('player-1');
      // Nest cards NOT added yet - they're added when transitioning to nestSelection
      const highBidder = newState.players.find(p => p.id === 'player-1');
      expect(highBidder?.hand.length).toBe(13); // Still 13 cards
    });
  });

  describe('Bidding turn rotation', () => {
    it('should rotate turns clockwise', () => {
      let state = initialState;

      // Player 1 bids
      state = gameReducer(state, {
        type: 'PLACE_BID',
        payload: { playerId: 'player-1', amount: 70 },
      });
      expect(state.currentPlayerId).toBe('player-2');

      // Player 2 bids
      state = gameReducer(state, {
        type: 'PLACE_BID',
        payload: { playerId: 'player-2', amount: 75 },
      });
      expect(state.currentPlayerId).toBe('player-3');

      // Player 3 bids
      state = gameReducer(state, {
        type: 'PLACE_BID',
        payload: { playerId: 'player-3', amount: 80 },
      });
      expect(state.currentPlayerId).toBe('player-0');

      // Player 0 bids
      state = gameReducer(state, {
        type: 'PLACE_BID',
        payload: { playerId: 'player-0', amount: 85 },
      });
      expect(state.currentPlayerId).toBe('player-1');
    });

    it('should handle mixed bids and passes', () => {
      let state = initialState;

      // Player 1 bids
      state = gameReducer(state, {
        type: 'PLACE_BID',
        payload: { playerId: 'player-1', amount: 70 },
      });

      // Player 2 passes
      state = gameReducer(state, {
        type: 'PASS_BID',
        payload: { playerId: 'player-2' },
      });

      // Player 3 bids
      state = gameReducer(state, {
        type: 'PLACE_BID',
        payload: { playerId: 'player-3', amount: 75 },
      });

      // Player 0 passes
      state = gameReducer(state, {
        type: 'PASS_BID',
        payload: { playerId: 'player-0' },
      });

      // Back to Player 1 (skip player-2 who passed)
      expect(state.currentPlayerId).toBe('player-1');
    });
  });

  describe('CALL_REDEAL action', () => {
    it('should allow redeal when player has no point cards', () => {
      // Create a hand with no point cards (all 1s with 0 points)
      const noPointCards: Card[] = Array.from({ length: 13 }, (_, i) => ({
        id: `card-${i}`,
        color: 'red' as const,
        value: 1 as const,
        points: 0,
      }));

      const stateWithNoPoints = {
        ...initialState,
        players: initialState.players.map(p =>
          p.id === 'player-1' ? { ...p, hand: noPointCards } : p
        ),
        currentPlayerId: 'player-1',
      };

      const action = {
        type: 'CALL_REDEAL' as const,
        payload: { playerId: 'player-1' },
      };

      const newState = gameReducer(stateWithNoPoints, action);

      // Should reset to dealing phase
      expect(newState.phase).toBe('dealing');
      // Should reset bidding state
      expect(newState.currentBid).toBeNull();
      expect(newState.passedPlayers.size).toBe(0);
      expect(newState.highBidder).toBeNull();
      // Should reset players' hands
      expect(newState.players.every(p => p.hand.length === 0)).toBe(true);
      // Should have a new shuffled deck
      expect(newState.deck.length).toBe(57);
    });

    it('should reject redeal when player has point cards', () => {
      // Create a hand with point cards
      const handWithPoints: Card[] = [
        { id: 'card-1', color: 'red' as const, value: 5 as const, points: 5 },
        ...Array.from({ length: 12 }, (_, i) => ({
          id: `card-${i + 2}`,
          color: 'red' as const,
          value: 1 as const,
          points: 0,
        })),
      ];

      const stateWithPoints = {
        ...initialState,
        players: initialState.players.map(p =>
          p.id === 'player-1' ? { ...p, hand: handWithPoints } : p
        ),
        currentPlayerId: 'player-1',
      };

      const action = {
        type: 'CALL_REDEAL' as const,
        payload: { playerId: 'player-1' },
      };

      const newState = gameReducer(stateWithPoints, action);

      // Should not change state
      expect(newState.phase).toBe('bidding');
      expect(newState).toEqual(stateWithPoints);
    });

    it('should reject redeal when not in bidding phase', () => {
      const noPointCards: Card[] = Array.from({ length: 13 }, (_, i) => ({
        id: `card-${i}`,
        color: 'red' as const,
        value: 1 as const,
        points: 0,
      }));

      const stateInPlaying = {
        ...initialState,
        phase: 'playing' as const,
        players: initialState.players.map(p =>
          p.id === 'player-1' ? { ...p, hand: noPointCards } : p
        ),
        currentPlayerId: 'player-1',
      };

      const action = {
        type: 'CALL_REDEAL' as const,
        payload: { playerId: 'player-1' },
      };

      const newState = gameReducer(stateInPlaying, action);

      // Should not change state
      expect(newState.phase).toBe('playing');
      expect(newState).toEqual(stateInPlaying);
    });

    it('should keep same dealer and starting bidder after redeal', () => {
      const noPointCards: Card[] = Array.from({ length: 13 }, (_, i) => ({
        id: `card-${i}`,
        color: 'red' as const,
        value: 1 as const,
        points: 0,
      }));

      const stateWithNoPoints = {
        ...initialState,
        players: initialState.players.map(p =>
          p.id === 'player-1' ? { ...p, hand: noPointCards } : p
        ),
        currentPlayerId: 'player-1',
        dealerId: 'player-0',
      };

      const action = {
        type: 'CALL_REDEAL' as const,
        payload: { playerId: 'player-1' },
      };

      const newState = gameReducer(stateWithNoPoints, action);

      // Should keep same dealer
      expect(newState.dealerId).toBe('player-0');
      // Should keep same starting bidder (player to left of dealer)
      expect(newState.currentPlayerId).toBe('player-1');
    });
  });

  describe('SELECT_NEST_CARDS action', () => {
    it('should allow high bidder to take up to 3 cards from nest and discard same amount', () => {
      const stateWithHighBidder = {
        ...initialState,
        phase: 'nestSelection' as const,
        highBidder: 'player-1',
        currentPlayerId: 'player-1',
        players: initialState.players.map(p =>
          p.id === 'player-1'
            ? { ...p, hand: [...p.hand, ...initialState.nest] } // 18 cards (13 + 5 nest)
            : p
        ),
      };

      const player = stateWithHighBidder.players.find(p => p.id === 'player-1')!;
      const originalHand = player.hand.slice(0, 13); // First 13 are original hand
      const nest = initialState.nest;

      // Take 2 cards from nest
      const cardsToAdd = nest.slice(0, 2);
      // Discard 2 cards from original hand
      const cardsToDiscard = originalHand.slice(0, 2);

      const action = {
        type: 'SELECT_NEST_CARDS' as const,
        payload: { cardsToAdd, cardsToDiscard },
      };

      const newState = gameReducer(stateWithHighBidder, action);

      const highBidder = newState.players.find(p => p.id === 'player-1');
      expect(highBidder?.hand.length).toBe(13); // Should have exactly 13 cards
      expect(newState.nest.length).toBe(5); // Nest should still have 5 cards
      expect(newState.phase).toBe('trumpSelection');
    });

    it('should reject if taking more than 3 cards from nest', () => {
      const stateWithHighBidder = {
        ...initialState,
        phase: 'nestSelection' as const,
        highBidder: 'player-1',
        currentPlayerId: 'player-1',
        players: initialState.players.map(p =>
          p.id === 'player-1'
            ? { ...p, hand: [...p.hand, ...initialState.nest] }
            : p
        ),
      };

      const player = stateWithHighBidder.players.find(p => p.id === 'player-1')!;
      const originalHand = player.hand.slice(0, 13);
      const nest = initialState.nest;

      const action = {
        type: 'SELECT_NEST_CARDS' as const,
        payload: {
          cardsToAdd: nest.slice(0, 4), // Try to take 4 cards
          cardsToDiscard: originalHand.slice(0, 4)
        },
      };

      const newState = gameReducer(stateWithHighBidder, action);

      // State should not change
      expect(newState.phase).toBe('nestSelection');
    });

    it('should reject if not high bidder', () => {
      const stateWithHighBidder = {
        ...initialState,
        phase: 'nestSelection' as const,
        highBidder: 'player-1',
        currentPlayerId: 'player-1',
        players: initialState.players.map(p =>
          p.id === 'player-1'
            ? { ...p, hand: [...p.hand, ...initialState.nest] }
            : p
        ),
      };

      const player = stateWithHighBidder.players.find(p => p.id === 'player-1')!;
      const originalHand = player.hand.slice(0, 13);
      const nest = initialState.nest;

      const action = {
        type: 'SELECT_NEST_CARDS' as const,
        payload: {
          cardsToAdd: nest.slice(0, 2),
          cardsToDiscard: originalHand.slice(0, 2)
        },
      };

      // Try to discard as wrong player by changing currentPlayerId
      const wrongPlayerState = {
        ...stateWithHighBidder,
        currentPlayerId: 'player-2',
      };

      const newState = gameReducer(wrongPlayerState, action);

      // State should not change
      expect(newState.phase).toBe('nestSelection');
    });
  });

  describe('SELECT_TRUMP action', () => {
    it('should allow high bidder to select trump after discarding', () => {
      const stateAfterDiscard = {
        ...initialState,
        phase: 'trumpSelection' as const,
        highBidder: 'player-1',
        currentPlayerId: 'player-1',
        nest: initialState.nest, // 5 cards discarded
        dealerId: 'player-0',
      };

      const action = {
        type: 'SELECT_TRUMP' as const,
        payload: { color: 'red' as const },
      };

      const newState = gameReducer(stateAfterDiscard, action);

      expect(newState.trumpColor).toBe('red');
      expect(newState.phase).toBe('partnerSelection'); // Next phase is partner selection
      expect(newState.currentPlayerId).toBe('player-1'); // High bidder selects partner
    });

    it('should reject if not high bidder', () => {
      const stateAfterDiscard = {
        ...initialState,
        phase: 'trumpSelection' as const,
        highBidder: 'player-1',
        currentPlayerId: 'player-2', // Wrong player
        nest: initialState.nest,
      };

      const action = {
        type: 'SELECT_TRUMP' as const,
        payload: { color: 'red' as const },
      };

      const newState = gameReducer(stateAfterDiscard, action);

      // State should not change
      expect(newState.trumpColor).toBeNull();
      expect(newState.phase).toBe('trumpSelection');
    });

    it('should reject if nest cards not discarded', () => {
      const stateWithoutDiscard = {
        ...initialState,
        phase: 'trumpSelection' as const,
        highBidder: 'player-1',
        currentPlayerId: 'player-1',
        nest: [], // No cards discarded
      };

      const action = {
        type: 'SELECT_TRUMP' as const,
        payload: { color: 'red' as const },
      };

      const newState = gameReducer(stateWithoutDiscard, action);

      // State should not change
      expect(newState.trumpColor).toBeNull();
      expect(newState.phase).toBe('trumpSelection');
    });
  });
});

describe('gameReducer - Playing Phase', () => {
  const createCard = (color: 'red' | 'yellow' | 'green' | 'black' | 'rook', value: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 'rook'): Card => {
    const card: Card = {
      id: `${color}-${value}`,
      color: color as any,
      value: value as any,
      points: value === 5 ? 5 : (value === 10 || value === 14 ? 10 : (value === 'rook' ? 20 : 0)),
    };
    return card;
  };

  const rookBird = createCard('rook', 'rook');

  let playingState: GameState;

  beforeEach(() => {
    playingState = {
      ...createInitialState(),
      phase: 'playing',
      players: [
        {
          id: 'player-0',
          name: 'Player 1',
          teamId: 'team1',
          position: 0,
          hand: [
            createCard('red', 5),
            createCard('red', 8),
            createCard('yellow', 7),
          ],
          capturedTricks: [],
        },
        {
          id: 'player-1',
          name: 'Player 2',
          teamId: 'team2',
          position: 1,
          hand: [
            createCard('yellow', 10),  // Changed from red-10 to yellow-10
            createCard('green', 3),
            createCard('black', 12),
          ],
          capturedTricks: [],
        },
        {
          id: 'player-2',
          name: 'Player 3',
          teamId: 'team1',
          position: 2,
          hand: [
            createCard('red', 14),
            createCard('yellow', 9),
            createCard('green', 5),
          ],
          capturedTricks: [],
        },
        {
          id: 'player-3',
          name: 'Player 4',
          teamId: 'team2',
          position: 3,
          hand: [
            createCard('red', 3),
            createCard('black', 7),
            rookBird,
          ],
          capturedTricks: [],
        },
      ],
      dealerId: 'player-0',
      currentPlayerId: 'player-0',
      trumpColor: 'green',
      currentTrick: null,
      completedTricks: [],
    };
  });

  describe('PLAY_CARD action', () => {
    it('should allow player to lead a trick', () => {
      const action = {
        type: 'PLAY_CARD' as const,
        payload: { playerId: 'player-0', card: createCard('red', 5) },
      };

      const newState = gameReducer(playingState, action);

      expect(newState.currentTrick).not.toBeNull();
      expect(newState.currentTrick?.leadPlayerId).toBe('player-0');
      expect(newState.currentTrick?.cards.size).toBe(1);
      expect(newState.currentPlayerId).toBe('player-1');

      // Card should be removed from player's hand
      const player = newState.players.find(p => p.id === 'player-0');
      expect(player?.hand.length).toBe(2);
      expect(player?.hand.some(c => c.id === 'red-5')).toBe(false);
    });

    it('should allow players to follow in a trick', () => {
      let state = playingState;

      // Player 0 leads
      const player0Card = state.players.find(p => p.id === 'player-0')!.hand[0];
      state = gameReducer(state, {
        type: 'PLAY_CARD',
        payload: { playerId: 'player-0', card: player0Card },
      });

      // Player 1 follows
      const player1Card = state.players.find(p => p.id === 'player-1')!.hand[0];
      state = gameReducer(state, {
        type: 'PLAY_CARD',
        payload: { playerId: 'player-1', card: player1Card },
      });

      expect(state.currentTrick?.cards.size).toBe(2);
      expect(state.currentPlayerId).toBe('player-2');
    });

    it('should complete trick and determine winner', () => {
      let state = playingState;

      // Player 0 leads with red-5
      const player0Card = state.players.find(p => p.id === 'player-0')!.hand[0];
      state = gameReducer(state, {
        type: 'PLAY_CARD',
        payload: { playerId: 'player-0', card: player0Card },
      });

      // Player 1 plays yellow-10
      const player1Card = state.players.find(p => p.id === 'player-1')!.hand[0];
      state = gameReducer(state, {
        type: 'PLAY_CARD',
        payload: { playerId: 'player-1', card: player1Card },
      });

      // Player 2 plays red-14
      const player2Card = state.players.find(p => p.id === 'player-2')!.hand.find(c => c.value === 14)!;
      state = gameReducer(state, {
        type: 'PLAY_CARD',
        payload: { playerId: 'player-2', card: player2Card },
      });

      // Player 3 plays red-3
      const player3Card = state.players.find(p => p.id === 'player-3')!.hand.find(c => c.color === 'red')!;
      state = gameReducer(state, {
        type: 'PLAY_CARD',
        payload: { playerId: 'player-3', card: player3Card },
      });

      // Trick should be complete (kept for animation)
      expect(state.trickCompleted).toBe(true);
      expect(state.currentTrick).not.toBeNull(); // Kept for animation
      expect(state.completedTricks.length).toBe(1);

      // Winner (player-2 with red-14) should lead next trick
      expect(state.currentPlayerId).toBe('player-2');

      // Winner should have captured the trick
      const winner = state.players.find(p => p.id === 'player-2');
      expect(winner?.capturedTricks.length).toBe(1);
      expect(winner?.capturedTricks[0].length).toBe(4);
    });

    it('should award trick to trump card', () => {
      let state = playingState;

      // Player 0 leads with red-5
      const player0Card = state.players.find(p => p.id === 'player-0')!.hand[0];
      state = gameReducer(state, {
        type: 'PLAY_CARD',
        payload: { playerId: 'player-0', card: player0Card },
      });

      // Player 1 plays trump (green-3)
      const player1Card = state.players.find(p => p.id === 'player-1')!.hand.find(c => c.color === 'green')!;
      state = gameReducer(state, {
        type: 'PLAY_CARD',
        payload: { playerId: 'player-1', card: player1Card },
      });

      // Player 2 plays red-14
      const player2Card = state.players.find(p => p.id === 'player-2')!.hand.find(c => c.value === 14)!;
      state = gameReducer(state, {
        type: 'PLAY_CARD',
        payload: { playerId: 'player-2', card: player2Card },
      });

      // Player 3 plays red-3
      const player3Card = state.players.find(p => p.id === 'player-3')!.hand.find(c => c.color === 'red')!;
      state = gameReducer(state, {
        type: 'PLAY_CARD',
        payload: { playerId: 'player-3', card: player3Card },
      });

      // Player-1 should win with trump
      expect(state.currentPlayerId).toBe('player-1');

      const winner = state.players.find(p => p.id === 'player-1');
      expect(winner?.capturedTricks.length).toBe(1);
    });

    it('should award trick to trump over Rook Bird (Rook is lowest trump)', () => {
      let state = playingState;

      // Player 0 leads with red-5
      const player0Card = state.players.find(p => p.id === 'player-0')!.hand[0];
      state = gameReducer(state, {
        type: 'PLAY_CARD',
        payload: { playerId: 'player-0', card: player0Card },
      });

      // Player 1 plays trump (green-3)
      const player1Card = state.players.find(p => p.id === 'player-1')!.hand.find(c => c.color === 'green')!;
      state = gameReducer(state, {
        type: 'PLAY_CARD',
        payload: { playerId: 'player-1', card: player1Card },
      });

      // Player 2 plays red-14
      const player2Card = state.players.find(p => p.id === 'player-2')!.hand.find(c => c.value === 14)!;
      state = gameReducer(state, {
        type: 'PLAY_CARD',
        payload: { playerId: 'player-2', card: player2Card },
      });

      // Player 3 plays Rook Bird (lowest trump)
      const player3Card = state.players.find(p => p.id === 'player-3')!.hand.find(c => c.color === 'rook')!;
      state = gameReducer(state, {
        type: 'PLAY_CARD',
        payload: { playerId: 'player-3', card: player3Card },
      });

      // Player-1 should win with green-3 (beats Rook Bird which is lowest trump)
      expect(state.currentPlayerId).toBe('player-1');

      const winner = state.players.find(p => p.id === 'player-1');
      expect(winner?.capturedTricks.length).toBe(1);
    });

    it('should award nest to last trick winner', () => {
      // Create state where all players have only 1 card left
      const lastTrickState: GameState = {
        ...playingState,
        players: playingState.players.map(p => ({
          ...p,
          hand: [p.hand[0]], // Only 1 card each
        })),
        nest: [
          createCard('yellow', 1),
          createCard('yellow', 2),
          createCard('yellow', 3),
          createCard('yellow', 4),
          createCard('black', 1),
        ],
      };

      let state = lastTrickState;

      // Play the last trick - get actual cards from hands
      const player0Card = state.players.find(p => p.id === 'player-0')!.hand[0];
      state = gameReducer(state, {
        type: 'PLAY_CARD',
        payload: { playerId: 'player-0', card: player0Card },
      });

      const player1Card = state.players.find(p => p.id === 'player-1')!.hand[0];
      state = gameReducer(state, {
        type: 'PLAY_CARD',
        payload: { playerId: 'player-1', card: player1Card },
      });

      const player2Card = state.players.find(p => p.id === 'player-2')!.hand[0];
      state = gameReducer(state, {
        type: 'PLAY_CARD',
        payload: { playerId: 'player-2', card: player2Card },
      });

      const player3Card = state.players.find(p => p.id === 'player-3')!.hand[0];
      state = gameReducer(state, {
        type: 'PLAY_CARD',
        payload: { playerId: 'player-3', card: player3Card },
      });

      // End the round after all tricks are complete
      state = gameReducer(state, {
        type: 'END_ROUND',
      });

      // Should transition to roundEnd phase
      expect(state.phase).toBe('roundEnd');

      // Winner (player-2 with red-14) should have the nest in their captured tricks
      const winner = state.players.find(p => p.id === 'player-2');
      expect(winner?.capturedTricks.length).toBe(2); // Last trick + nest
      expect(winner?.capturedTricks[1].length).toBe(5); // Nest has 5 cards
    });

    it('should reject card play from wrong player', () => {
      const action = {
        type: 'PLAY_CARD' as const,
        payload: { playerId: 'player-1', card: createCard('red', 10) },
      };

      const newState = gameReducer(playingState, action);

      // State should not change
      expect(newState.currentTrick).toBeNull();
      expect(newState.currentPlayerId).toBe('player-0');
    });

    it('should reject card not in player hand', () => {
      const action = {
        type: 'PLAY_CARD' as const,
        payload: { playerId: 'player-0', card: createCard('black', 14) },
      };

      const newState = gameReducer(playingState, action);

      // State should not change
      expect(newState.currentTrick).toBeNull();
      expect(newState.currentPlayerId).toBe('player-0');
    });

    it('should allow winner to lead next trick', () => {
      let state = playingState;

      // Complete first trick
      const player0Card = state.players.find(p => p.id === 'player-0')!.hand[0];
      state = gameReducer(state, {
        type: 'PLAY_CARD',
        payload: { playerId: 'player-0', card: player0Card },
      });

      const player1Card = state.players.find(p => p.id === 'player-1')!.hand[0];
      state = gameReducer(state, {
        type: 'PLAY_CARD',
        payload: { playerId: 'player-1', card: player1Card },
      });

      const player2Card = state.players.find(p => p.id === 'player-2')!.hand.find(c => c.value === 14)!;
      state = gameReducer(state, {
        type: 'PLAY_CARD',
        payload: { playerId: 'player-2', card: player2Card },
      });

      const player3Card = state.players.find(p => p.id === 'player-3')!.hand.find(c => c.color === 'red')!;
      state = gameReducer(state, {
        type: 'PLAY_CARD',
        payload: { playerId: 'player-3', card: player3Card },
      });

      // Player-2 won, should be able to lead
      expect(state.currentPlayerId).toBe('player-2');
      expect(state.trickCompleted).toBe(true);

      // Clear the completed trick (normally done by UI after animation)
      state = gameReducer(state, { type: 'CLEAR_TRICK' });
      expect(state.currentTrick).toBeNull();
      expect(state.trickCompleted).toBe(false);

      // Player-2 leads next trick
      const player2NextCard = state.players.find(p => p.id === 'player-2')!.hand.find(c => c.value === 9)!;
      state = gameReducer(state, {
        type: 'PLAY_CARD',
        payload: { playerId: 'player-2', card: player2NextCard },
      });

      expect(state.currentTrick?.leadPlayerId).toBe('player-2');
      expect(state.currentPlayerId).toBe('player-3');
    });
  });
});

describe('gameReducer - Round End and Game End', () => {
  const createCard = (color: 'red' | 'yellow' | 'green' | 'black' | 'rook', value: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 'rook'): Card => {
    const card: Card = {
      id: `${color}-${value}`,
      color: color as any,
      value: value as any,
      points: value === 'rook' ? 20 : (value === 5 ? 5 : (value === 10 || value === 14 ? 10 : 0)),
    };
    return card;
  };

  describe('END_ROUND action', () => {
    it('should calculate scores when bidding team fails their bid', () => {
      // Create a state where round is complete
      const roundEndState: GameState = {
        ...createInitialState(),
        phase: 'roundEnd',
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
        highBidder: 'player-0', // Team 1 bid
        currentBid: { playerId: 'player-0', amount: 70 },
        nest: [createCard('yellow', 5)], // 5 points - awarded to last trick winner (player-2)
        completedTricks: [
          {
            leadPlayerId: 'player-0',
            cards: new Map([
              ['player-0', createCard('red', 5)],
              ['player-1', createCard('yellow', 14)],
              ['player-2', createCard('black', 10)],
              ['player-3', createCard('green', 1)],
            ]),
            winnerId: 'player-0', // Team 1 wins: 5 + 10 + 10 = 25 points
          },
          {
            leadPlayerId: 'player-0',
            cards: new Map([
              ['player-0', createCard('red', 10)],
              ['player-1', createCard('green', 5)],
              ['player-2', createCard('rook', 'rook')],
              ['player-3', createCard('black', 1)],
            ]),
            winnerId: 'player-2', // Team 1 wins (last trick): 10 + 5 + 20 = 35 points + 5 (nest) = 40
          },
        ],
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
      };

      const action = { type: 'END_ROUND' as const };
      const newState = gameReducer(roundEndState, action);

      // Team 1 captured: 25 + 35 + 5 (nest) = 65 points
      // Team 1 bid 70, so they failed: -70 points
      // Team 2 captured: 0 points
      expect(newState.roundScores.get('team1')).toBe(-70);
      expect(newState.roundScores.get('team2')).toBe(0);
      // Individual scores: player-0 and player-2 each get -70
      expect(newState.scores.get('player-0')).toBe(-70);
      expect(newState.scores.get('player-2')).toBe(-70);
      expect(newState.scores.get('player-1')).toBe(0);
      expect(newState.scores.get('player-3')).toBe(0);
      expect(newState.phase).toBe('roundEnd');
    });

    it('should calculate scores when bidding team makes their bid successfully', () => {
      const roundEndState: GameState = {
        ...createInitialState(),
        phase: 'roundEnd',
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
        highBidder: 'player-0', // Team 1 bid
        currentBid: { playerId: 'player-0', amount: 70 },
        nest: [createCard('yellow', 10)], // 10 points - awarded to last trick winner (player-2)
        completedTricks: [
          {
            leadPlayerId: 'player-0',
            cards: new Map([
              ['player-0', createCard('red', 5)],
              ['player-1', createCard('yellow', 5)],
              ['player-2', createCard('red', 14)],
              ['player-3', createCard('green', 10)],
            ]),
            winnerId: 'player-0', // Team 1 wins: 5 + 5 + 10 + 10 = 30 points
          },
          {
            leadPlayerId: 'player-1',
            cards: new Map([
              ['player-0', createCard('red', 10)],
              ['player-1', createCard('yellow', 1)],
              ['player-2', createCard('black', 10)],
              ['player-3', createCard('yellow', 14)],
            ]),
            winnerId: 'player-1', // Team 2 wins: 10 + 10 + 10 = 30 points
          },
          {
            leadPlayerId: 'player-2',
            cards: new Map([
              ['player-0', createCard('red', 3)],
              ['player-1', createCard('yellow', 2)],
              ['player-2', createCard('rook', 'rook')],
              ['player-3', createCard('green', 1)],
            ]),
            winnerId: 'player-2', // Team 1 wins (last trick): 20 points + 10 (nest) = 30
          },
        ],
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
      };

      const action = { type: 'END_ROUND' as const };
      const newState = gameReducer(roundEndState, action);

      // Team 1 captured: 30 + 20 + 10 (nest) = 60 points
      // Team 1 bid 70, so they failed: -70 points
      // Team 2 captured: 30 points
      expect(newState.roundScores.get('team1')).toBe(-70);
      expect(newState.roundScores.get('team2')).toBe(30);
      // Individual scores: player-0 and player-2 each get -70, player-1 and player-3 each get +30
      expect(newState.scores.get('player-0')).toBe(-70);
      expect(newState.scores.get('player-2')).toBe(-70);
      expect(newState.scores.get('player-1')).toBe(30);
      expect(newState.scores.get('player-3')).toBe(30);
    });

    it('should calculate scores when bidding team exactly makes their bid', () => {
      const roundEndState: GameState = {
        ...createInitialState(),
        phase: 'roundEnd',
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
        highBidder: 'player-0', // Team 1 bid
        currentBid: { playerId: 'player-0', amount: 70 },
        nest: [createCard('yellow', 10), createCard('black', 5)], // 15 points - awarded to last trick winner (player-2)
        completedTricks: [
          {
            leadPlayerId: 'player-0',
            cards: new Map([
              ['player-0', createCard('red', 5)],
              ['player-1', createCard('yellow', 5)],
              ['player-2', createCard('red', 14)],
              ['player-3', createCard('green', 1)],
            ]),
            winnerId: 'player-0', // Team 1 wins: 5 + 5 + 10 = 20 points
          },
          {
            leadPlayerId: 'player-1',
            cards: new Map([
              ['player-0', createCard('red', 10)],
              ['player-1', createCard('yellow', 1)],
              ['player-2', createCard('black', 10)],
              ['player-3', createCard('yellow', 2)],
            ]),
            winnerId: 'player-0', // Team 1 wins: 10 + 10 = 20 points
          },
          {
            leadPlayerId: 'player-2',
            cards: new Map([
              ['player-0', createCard('red', 3)],
              ['player-1', createCard('yellow', 3)],
              ['player-2', createCard('rook', 'rook')],
              ['player-3', createCard('green', 10)],
            ]),
            winnerId: 'player-2', // Team 1 wins (last trick): 20 + 10 = 30 points + 15 (nest) = 45
          },
        ],
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
      };

      const action = { type: 'END_ROUND' as const };
      const newState = gameReducer(roundEndState, action);

      // Team 1 captured: 20 + 20 + 30 + 15 (nest) = 85 points (made bid!)
      // Team 2 captured: 0 points
      expect(newState.roundScores.get('team1')).toBe(85);
      expect(newState.roundScores.get('team2')).toBe(0);
      // Player scores (team1 players get 85 each, team2 players get 0 each)
      expect(newState.scores.get('player-0')).toBe(85);
      expect(newState.scores.get('player-2')).toBe(85);
      expect(newState.scores.get('player-1')).toBe(0);
      expect(newState.scores.get('player-3')).toBe(0);
    });

    it('should transition to gameEnd when player reaches 500 points', () => {
      const roundEndState: GameState = {
        ...createInitialState(),
        phase: 'roundEnd',
        partnerRevealed: true,
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
        highBidder: 'player-0', // Team 1 bid
        partnerId: 'player-2',
        currentBid: { playerId: 'player-0', amount: 70 },
        nest: [createCard('yellow', 10), createCard('black', 5), createCard('green', 5)], // 20 points
        completedTricks: [
          {
            leadPlayerId: 'player-0',
            cards: new Map([
              ['player-0', createCard('red', 5)],
              ['player-1', createCard('yellow', 1)],
              ['player-2', createCard('red', 14)],
              ['player-3', createCard('green', 1)],
            ]),
            winnerId: 'player-0', // Team 1 wins: 5 + 10 = 15 points
          },
          {
            leadPlayerId: 'player-2',
            cards: new Map([
              ['player-0', createCard('red', 10)],
              ['player-1', createCard('yellow', 2)],
              ['player-2', createCard('rook', 'rook')],
              ['player-3', createCard('green', 2)],
            ]),
            winnerId: 'player-2', // Team 1 wins (last trick): 10 + 20 = 30 points + 20 (nest) = 50
          },
          {
            leadPlayerId: 'player-0',
            cards: new Map([
              ['player-0', createCard('black', 10)],
              ['player-1', createCard('yellow', 3)],
              ['player-2', createCard('yellow', 14)],
              ['player-3', createCard('green', 3)],
            ]),
            winnerId: 'player-0', // Team 1 wins: 10 + 10 = 20 points
          },
        ],
        scores: new Map([
          ['player-0', 420], // Player 0 already at 420
          ['player-1', 150],
          ['player-2', 380],
          ['player-3', 200],
        ]),
        roundScores: new Map([
          ['team1', 0],
          ['team2', 0],
        ]),
      };

      const action = { type: 'END_ROUND' as const };
      const newState = gameReducer(roundEndState, action);

      // Team 1 captured: 15 + 30 + 20 + 20 (nest) = 85 points (made bid of 70!)
      // Player 0 and Player 2 each get +85
      // Player 0 total: 420 + 85 = 505 (wins!)
      // Player 2 total: 380 + 85 = 465
      expect(newState.scores.get('player-0')).toBe(505);
      expect(newState.scores.get('player-2')).toBe(465);
      expect(newState.phase).toBe('gameEnd');
    });

    it('should distribute team scores to individual players correctly', () => {
      const roundEndState: GameState = {
        ...createInitialState(),
        phase: 'roundEnd',
        partnerRevealed: true,
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
        highBidder: 'player-1', // Team 2 bid
        partnerId: 'player-3',
        currentBid: { playerId: 'player-1', amount: 70 },
        nest: [createCard('yellow', 5)], // 5 points
        completedTricks: [
          {
            leadPlayerId: 'player-0',
            cards: new Map([
              ['player-0', createCard('red', 5)],
              ['player-1', createCard('yellow', 1)],
              ['player-2', createCard('red', 10)],
              ['player-3', createCard('green', 1)],
            ]),
            winnerId: 'player-0', // Team 1 wins: 5 + 10 = 15 points
          },
          {
            leadPlayerId: 'player-1',
            cards: new Map([
              ['player-0', createCard('red', 1)],
              ['player-1', createCard('yellow', 14)],
              ['player-2', createCard('black', 10)],
              ['player-3', createCard('rook', 'rook')],
            ]),
            winnerId: 'player-1', // Team 2 wins: 10 + 10 + 20 = 40 points
          },
          {
            leadPlayerId: 'player-2',
            cards: new Map([
              ['player-0', createCard('red', 2)],
              ['player-1', createCard('yellow', 2)],
              ['player-2', createCard('green', 5)],
              ['player-3', createCard('green', 2)],
            ]),
            winnerId: 'player-2', // Team 1 wins: 5 points
          },
          {
            leadPlayerId: 'player-3',
            cards: new Map([
              ['player-0', createCard('red', 3)],
              ['player-1', createCard('yellow', 3)],
              ['player-2', createCard('red', 14)],
              ['player-3', createCard('yellow', 10)],
            ]),
            winnerId: 'player-3', // Team 2 wins (last trick): 10 + 10 = 20 points + 5 (nest) = 25
          },
        ],
        scores: new Map([
          ['player-0', 280],
          ['player-1', 235],
          ['player-2', 150],
          ['player-3', 190],
        ]),
        roundScores: new Map([
          ['team1', 0],
          ['team2', 0],
        ]),
      };

      const action = { type: 'END_ROUND' as const };
      const newState = gameReducer(roundEndState, action);

      // Team 1 (non-bidding): 15 + 5 = 20 points
      // Team 2 (bidding): 40 + 20 + 5 (nest) = 65 points (failed bid of 70, so -70)
      // Player 0 (team1): 280 + 20 = 300
      // Player 1 (team2): 235 - 70 = 165
      // Player 2 (team1): 150 + 20 = 170
      // Player 3 (team2): 190 - 70 = 120
      expect(newState.scores.get('player-0')).toBe(300);
      expect(newState.scores.get('player-1')).toBe(165);
      expect(newState.scores.get('player-2')).toBe(170);
      expect(newState.scores.get('player-3')).toBe(120);
      expect(newState.phase).toBe('roundEnd'); // No one reached 500 yet
    });

    it('should update cumulative scores across multiple rounds', () => {
      const roundEndState: GameState = {
        ...createInitialState(),
        phase: 'roundEnd',
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
        highBidder: 'player-0', // Team 1 bid
        currentBid: { playerId: 'player-0', amount: 70 },
        nest: [createCard('yellow', 5)], // 5 points
        completedTricks: [
          {
            leadPlayerId: 'player-0',
            cards: new Map([
              ['player-0', createCard('red', 5)],
              ['player-1', createCard('yellow', 14)],
              ['player-2', createCard('red', 10)],
              ['player-3', createCard('green', 1)],
            ]),
            winnerId: 'player-0', // Team 1 wins: 5 + 10 + 10 = 25 points
          },
          {
            leadPlayerId: 'player-1',
            cards: new Map([
              ['player-0', createCard('red', 1)],
              ['player-1', createCard('yellow', 1)],
              ['player-2', createCard('black', 10)],
              ['player-3', createCard('yellow', 10)],
            ]),
            winnerId: 'player-1', // Team 2 wins: 10 + 10 = 20 points
          },
          {
            leadPlayerId: 'player-2',
            cards: new Map([
              ['player-0', createCard('red', 2)],
              ['player-1', createCard('yellow', 2)],
              ['player-2', createCard('rook', 'rook')],
              ['player-3', createCard('green', 5)],
            ]),
            winnerId: 'player-2', // Team 1 wins (last trick): 20 + 5 = 25 points + 5 (nest) = 30
          },
        ],
        scores: new Map([
          ['player-0', 85], // Previous rounds - team1 players
          ['player-1', 60], // team2 players
          ['player-2', 85], // team1 players
          ['player-3', 60], // team2 players
        ]),
        roundScores: new Map([
          ['team1', 0],
          ['team2', 0],
        ]),
      };

      const action = { type: 'END_ROUND' as const };
      const newState = gameReducer(roundEndState, action);

      // Team 1 captured: 25 + 25 + 5 (nest) = 55 points (failed bid of 70)
      // Team 2 captured: 20 points
      expect(newState.roundScores.get('team1')).toBe(-70);
      expect(newState.roundScores.get('team2')).toBe(20);
      // Player scores (team1 players: 85 - 70 = 15, team2 players: 60 + 20 = 80)
      expect(newState.scores.get('player-0')).toBe(15); // 85 - 70
      expect(newState.scores.get('player-2')).toBe(15); // 85 - 70
      expect(newState.scores.get('player-1')).toBe(80); // 60 + 20
      expect(newState.scores.get('player-3')).toBe(80); // 60 + 20
    });
  });

  describe('END_GAME action', () => {
    it('should keep game in gameEnd phase', () => {
      const gameEndState: GameState = {
        ...createInitialState(),
        phase: 'gameEnd',
        scores: new Map([
          ['team1', 305],
          ['team2', 280],
        ]),
      };

      const action = { type: 'END_GAME' as const };
      const newState = gameReducer(gameEndState, action);

      expect(newState.phase).toBe('gameEnd');
      expect(newState.scores.get('team1')).toBe(305);
      expect(newState.scores.get('team2')).toBe(280);
    });
  });
});

describe('gameReducer - Round Management', () => {
  const createCard = (color: 'red' | 'yellow' | 'green' | 'black' | 'rook', value: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 'rook'): Card => {
    const card: Card = {
      id: `${color}-${value}`,
      color: color as any,
      value: value as any,
      points: value === 'rook' ? 20 : (value === 5 ? 5 : (value === 10 || value === 14 ? 10 : 0)),
    };
    return card;
  };

  describe('START_ROUND action', () => {
    it('should rotate dealer position clockwise', () => {
      // Create a state after a round has ended
      const afterRoundState: GameState = {
        ...createInitialState(),
        phase: 'roundEnd',
        players: [
          {
            id: 'player-0',
            name: 'Player 1',
            teamId: 'team1',
            position: 0,
            hand: [],
            capturedTricks: [[createCard('red', 5)]],
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
        dealerId: 'player-0',
        currentPlayerId: 'player-0',
        scores: new Map([
          ['team1', 100],
          ['team2', 80],
        ]),
        roundScores: new Map([
          ['team1', 100],
          ['team2', 80],
        ]),
      };

      const action = { type: 'START_ROUND' as const };
      const newState = gameReducer(afterRoundState, action);

      // Dealer should rotate clockwise from player-0 to player-1
      expect(newState.dealerId).toBe('player-1');
      // Current player should be to the left of new dealer (player-2)
      expect(newState.currentPlayerId).toBe('player-2');
    });

    it('should reset round-specific state', () => {
      const afterRoundState: GameState = {
        ...createInitialState(),
        phase: 'roundEnd',
        players: [
          {
            id: 'player-0',
            name: 'Player 1',
            teamId: 'team1',
            position: 0,
            hand: [createCard('red', 5)],
            capturedTricks: [[createCard('red', 10)]],
          },
          {
            id: 'player-1',
            name: 'Player 2',
            teamId: 'team2',
            position: 1,
            hand: [createCard('yellow', 7)],
            capturedTricks: [[createCard('yellow', 14)]],
          },
          {
            id: 'player-2',
            name: 'Player 3',
            teamId: 'team1',
            position: 2,
            hand: [createCard('green', 3)],
            capturedTricks: [],
          },
          {
            id: 'player-3',
            name: 'Player 4',
            teamId: 'team2',
            position: 3,
            hand: [createCard('black', 9)],
            capturedTricks: [],
          },
        ],
        dealerId: 'player-0',
        currentPlayerId: 'player-0',
        currentBid: { playerId: 'player-0', amount: 85 },
        passedPlayers: new Set(['player-1', 'player-2']),
        highBidder: 'player-0',
        trumpColor: 'red',
        nest: [createCard('yellow', 1), createCard('yellow', 2)],
        currentTrick: {
          leadPlayerId: 'player-0',
          cards: new Map([['player-0', createCard('red', 5)]]),
        },
        completedTricks: [
          {
            leadPlayerId: 'player-0',
            cards: new Map([
              ['player-0', createCard('red', 10)],
              ['player-1', createCard('yellow', 14)],
              ['player-2', createCard('green', 5)],
              ['player-3', createCard('black', 1)],
            ]),
            winnerId: 'player-0',
          },
        ],
        scores: new Map([
          ['team1', 100],
          ['team2', 80],
        ]),
        roundScores: new Map([
          ['team1', 100],
          ['team2', 80],
        ]),
      };

      const action = { type: 'START_ROUND' as const };
      const newState = gameReducer(afterRoundState, action);

      // All players should have empty hands
      newState.players.forEach(player => {
        expect(player.hand).toEqual([]);
        expect(player.capturedTricks).toEqual([]);
      });

      // Round-specific state should be reset
      expect(newState.nest).toEqual([]);
      expect(newState.currentBid).toBeNull();
      expect(newState.passedPlayers.size).toBe(0);
      expect(newState.highBidder).toBeNull();
      expect(newState.trumpColor).toBeNull();
      expect(newState.currentTrick).toBeNull();
      expect(newState.completedTricks).toEqual([]);
      expect(newState.roundScores.get('team1')).toBe(0);
      expect(newState.roundScores.get('team2')).toBe(0);
    });

    it('should maintain cumulative scores across rounds', () => {
      const afterRoundState: GameState = {
        ...createInitialState(),
        phase: 'roundEnd',
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
        dealerId: 'player-0',
        currentPlayerId: 'player-0',
        scores: new Map([
          ['team1', 150],
          ['team2', 120],
        ]),
        roundScores: new Map([
          ['team1', 75],
          ['team2', 60],
        ]),
      };

      const action = { type: 'START_ROUND' as const };
      const newState = gameReducer(afterRoundState, action);

      // Cumulative scores should be maintained
      expect(newState.scores.get('team1')).toBe(150);
      expect(newState.scores.get('team2')).toBe(120);

      // Round scores should be reset
      expect(newState.roundScores.get('team1')).toBe(0);
      expect(newState.roundScores.get('team2')).toBe(0);
    });

    it('should generate and shuffle a new deck', () => {
      const afterRoundState: GameState = {
        ...createInitialState(),
        phase: 'roundEnd',
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
        dealerId: 'player-0',
        currentPlayerId: 'player-0',
        deck: [], // Empty deck from previous round
        scores: new Map([
          ['team1', 100],
          ['team2', 80],
        ]),
        roundScores: new Map([
          ['team1', 100],
          ['team2', 80],
        ]),
      };

      const action = { type: 'START_ROUND' as const };
      const newState = gameReducer(afterRoundState, action);

      // New deck should be generated with 57 cards
      expect(newState.deck.length).toBe(57);

      // Deck should contain all expected cards
      const colors = ['red', 'yellow', 'green', 'black'];
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

      // Check for colored cards (56 cards)
      colors.forEach(color => {
        values.forEach(value => {
          const card = newState.deck.find(c => c.color === color && c.value === value);
          expect(card).toBeDefined();
        });
      });

      // Check for Rook Bird card
      const rookBird = newState.deck.find(c => c.color === 'rook' && c.value === 'rook');
      expect(rookBird).toBeDefined();
    });

    it('should transition to dealing phase', () => {
      const afterRoundState: GameState = {
        ...createInitialState(),
        phase: 'roundEnd',
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
        dealerId: 'player-0',
        currentPlayerId: 'player-0',
        scores: new Map([
          ['team1', 100],
          ['team2', 80],
        ]),
        roundScores: new Map([
          ['team1', 100],
          ['team2', 80],
        ]),
      };

      const action = { type: 'START_ROUND' as const };
      const newState = gameReducer(afterRoundState, action);

      expect(newState.phase).toBe('dealing');
    });

    it('should handle dealer rotation wrapping around', () => {
      // Test when dealer is player-3 (last player)
      const afterRoundState: GameState = {
        ...createInitialState(),
        phase: 'roundEnd',
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
        dealerId: 'player-3', // Last player
        currentPlayerId: 'player-3',
        scores: new Map([
          ['team1', 100],
          ['team2', 80],
        ]),
        roundScores: new Map([
          ['team1', 100],
          ['team2', 80],
        ]),
      };

      const action = { type: 'START_ROUND' as const };
      const newState = gameReducer(afterRoundState, action);

      // Dealer should wrap around to player-0
      expect(newState.dealerId).toBe('player-0');
      // Current player should be to the left of new dealer (player-1)
      expect(newState.currentPlayerId).toBe('player-1');
    });
  });
});
