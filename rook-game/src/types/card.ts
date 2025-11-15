export type CardColor = 'red' | 'yellow' | 'green' | 'black';
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface Card {
  id: string;
  color: CardColor | 'rook';
  value: CardValue | 'rook';
  points: number;
}
