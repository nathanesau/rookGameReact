import type { GameState, Card, PlayerId } from '../types';
import { determineTrickWinner, getPlayableCards } from './gameEngine';

/**
 * Checks if playing a card would be a "bad play" - feeding points to the opposing team
 * when there are better options available
 */
export const isLikelyBadPlay = (
  state: GameState,
  playerId: PlayerId,
  card: Card
): { isBad: boolean; reason?: string } => {
  const { currentTrick, trumpColor, players } = state;
  
  // Only check if trick is in progress (not leading)
  if (!currentTrick || currentTrick.cards.size === 0) {
    return { isBad: false };
  }

  const player = players.find(p => p.id === playerId);
  if (!player || !player.teamId) {
    return { isBad: false };
  }

  // Check if the card has points
  if (card.points === 0) {
    return { isBad: false };
  }

  // Only warn if trick is complete enough to determine winner with certainty
  // (i.e., all 4 cards will be played after this one)
  if (currentTrick.cards.size < 3) {
    return { isBad: false }; // Can't be certain who will win yet
  }

  // Simulate the trick with this card
  const simulatedTrick = {
    ...currentTrick,
    cards: new Map(currentTrick.cards),
  };
  simulatedTrick.cards.set(playerId, card);

  // Determine who would win if we play this card
  let potentialWinnerId: PlayerId;
  try {
    potentialWinnerId = determineTrickWinner(simulatedTrick, trumpColor);
  } catch {
    return { isBad: false }; // Can't determine winner
  }

  const potentialWinner = players.find(p => p.id === potentialWinnerId);
  if (!potentialWinner || !potentialWinner.teamId) {
    return { isBad: false };
  }

  // Check if winner is on opposing team
  if (potentialWinner.teamId === player.teamId) {
    return { isBad: false }; // Giving points to teammate is fine
  }

  // Winner is on opposing team - check if we have PLAYABLE cards without points
  const playableCardIds = getPlayableCards(state, playerId);
  const playableCardsWithoutPoints = player.hand.filter(c => 
    c.id !== card.id && c.points === 0 && playableCardIds.has(c.id)
  );

  if (playableCardsWithoutPoints.length > 0) {
    const pointsInTrick = Array.from(currentTrick.cards.values()).reduce((sum, c) => sum + c.points, 0) + card.points;
    return {
      isBad: true,
      reason: `This card has ${card.points} points and will go to the opposing team (total ${pointsInTrick} points in trick). You have ${playableCardsWithoutPoints.length} playable card(s) without points.`
    };
  }

  return { isBad: false };
};
