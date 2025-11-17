import type { Card, CardColor } from './card';
import type { PlayerId } from './player';

export type GameAction =
  | { type: 'INITIALIZE_GAME'; payload: { playerNames: string[]; winningScore?: number; nestSelectableCards?: number } }
  | { type: 'START_ROUND' }
  | { type: 'DEAL_CARDS' }
  | { type: 'START_BIDDING' }
  | { type: 'PLACE_BID'; payload: { playerId: PlayerId; amount: number } }
  | { type: 'PASS_BID'; payload: { playerId: PlayerId } }
  | { type: 'CALL_REDEAL'; payload: { playerId: PlayerId } }
  | { type: 'CONTINUE_TO_NEST_SELECTION' }
  | { type: 'SELECT_NEST_CARDS'; payload: { cardsToAdd: Card[]; cardsToDiscard: Card[] } }
  | { type: 'SELECT_TRUMP'; payload: { color: CardColor } }
  | { type: 'SELECT_PARTNER'; payload: { card: Card } }
  | { type: 'PLAY_CARD'; payload: { playerId: PlayerId; card: Card } }
  | { type: 'CORRECT_RENEGE'; payload: { playerId: PlayerId; card: Card } }
  | { type: 'APPLY_RENEGE_PENALTY'; payload: { playerId: PlayerId } }
  | { type: 'COMPLETE_TRICK' }
  | { type: 'CLEAR_TRICK' }
  | { type: 'END_ROUND' }
  | { type: 'END_GAME' };
