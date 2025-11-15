import type { Card, CardColor } from './card';
import type { PlayerId } from './player';

export type GameAction =
  | { type: 'INITIALIZE_GAME'; payload: { playerNames: string[] } }
  | { type: 'START_ROUND' }
  | { type: 'DEAL_CARDS' }
  | { type: 'PLACE_BID'; payload: { playerId: PlayerId; amount: number } }
  | { type: 'PASS_BID'; payload: { playerId: PlayerId } }
  | { type: 'CALL_REDEAL'; payload: { playerId: PlayerId } }
  | { type: 'SELECT_NEST_CARDS'; payload: { cards: Card[] } }
  | { type: 'SELECT_TRUMP'; payload: { color: CardColor } }
  | { type: 'PLAY_CARD'; payload: { playerId: PlayerId; card: Card } }
  | { type: 'CORRECT_RENEGE'; payload: { playerId: PlayerId; card: Card } }
  | { type: 'APPLY_RENEGE_PENALTY'; payload: { playerId: PlayerId } }
  | { type: 'COMPLETE_TRICK' }
  | { type: 'END_ROUND' }
  | { type: 'END_GAME' };
