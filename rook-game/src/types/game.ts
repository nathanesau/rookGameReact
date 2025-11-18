import type { Card, CardColor } from './card';
import type { PlayerId, TeamId, Player } from './player';

export type GamePhase = 'setup' | 'dealing' | 'roundStart' | 'bidding' | 'biddingComplete' | 'nestSelection' | 'trumpSelection' | 'partnerSelection' | 'playing' | 'roundEnd' | 'gameEnd';

export interface Bid {
  playerId: PlayerId;
  amount: number;
}

export interface Trick {
  leadPlayerId: PlayerId;
  cards: Map<PlayerId, Card>;
  winnerId?: PlayerId;
}

export interface RenegeInfo {
  playerId: PlayerId;
  trickIndex: number;
  cardPlayed: Card;
  correctCards: Card[];
}

export interface RoundHistory {
  roundNumber: number;
  playerScores: Map<PlayerId, number>; // Scores after this round
  roundDeltas: Map<PlayerId, number>; // Points gained/lost this round
  bidAmount: number | null;
  bidderId: PlayerId | null;
  bidMade: boolean | null;
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  deck: Card[];
  nest: Card[];
  originalNest: Card[]; // Original nest cards before any selection (for back navigation)
  dealerId: PlayerId;
  currentPlayerId: PlayerId;

  // Game settings
  winningScore: number; // Configurable winning score (default 500)
  nestSelectableCards: number; // Number of cards that can be selected from nest (3-5)

  // Bidding phase
  currentBid: Bid | null;
  passedPlayers: Set<PlayerId>;
  highBidder: PlayerId | null;
  biddingHistory: Array<{ playerId: PlayerId; action: 'bid' | 'pass'; amount?: number }>;

  // Partner selection
  calledCard: Card | null;
  partnerId: PlayerId | null; // Revealed when called card is played
  partnerRevealed: boolean;

  // Playing phase
  trumpColor: CardColor | null;
  currentTrick: Trick | null;
  completedTricks: Trick[];
  trickCompleted: boolean; // Flag to prevent playing during trick animations
  isLastTrick: boolean; // Flag to indicate the final trick of the round

  // Renege tracking
  renegeInfo: RenegeInfo | null;

  // Scoring - individual scores across game, team scores per round
  scores: Map<PlayerId, number>; // Individual cumulative scores
  roundScores: Map<TeamId, number>; // Team scores for current round only
  scoreHistory: RoundHistory[]; // History of all completed rounds
  currentRound: number; // Current round number
}
