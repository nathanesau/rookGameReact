import type { Card } from './card';

export type PlayerId = string;
export type TeamId = 'team1' | 'team2';
export type PlayerPosition = 0 | 1 | 2 | 3;

export interface Player {
  id: PlayerId;
  name: string;
  teamId: TeamId | null; // Null until partner is revealed
  position: PlayerPosition;
  hand: Card[];
  capturedTricks: Card[][];
}
