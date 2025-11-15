import type { Card, CardColor } from './card';
import type { PlayerId, TeamId, Player } from './player';

export type GamePhase = 'setup' | 'dealing' | 'bidding' | 'nestSelection' | 'trumpSelection' | 'playing' | 'roundEnd' | 'gameEnd';

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

export interface GameState {
  phase: GamePhase;
  players: Player[];
  deck: Card[];
  nest: Card[];
  dealerId: PlayerId;
  currentPlayerId: PlayerId;

  // Bidding phase
  currentBid: Bid | null;
  passedPlayers: Set<PlayerId>;
  highBidder: PlayerId | null;

  // Playing phase
  trumpColor: CardColor | null;
  currentTrick: Trick | null;
  completedTricks: Trick[];

  // Renege tracking
  renegeInfo: RenegeInfo | null;

  // Scoring
  scores: Map<TeamId, number>;
  roundScores: Map<TeamId, number>;
}
